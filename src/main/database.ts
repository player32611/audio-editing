import { app, ipcMain } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'
import {
  Database as DatabaseType,
  StatusTable,
  TypeTable,
  WorkHistoryInput,
  WorkStatus,
  WorkType
} from '../shared/type'

let db: Database.Database | null = null

/**
 * 打开（不存在则创建）主进程的 SQLite 数据库，返回连接。
 * 仅负责建库与连接，不包含任何增删改查。
 */
export function initDatabase(): Database.Database {
  if (db) return db

  const dbPath = join(app.getPath('userData'), 'audio-editing.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('user_version = 1')

  createTable()

  return db
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('数据库尚未初始化')

  return db
}

const createTable = (): void => {
  if (!db) throw new Error('数据库尚未初始化')

  db.exec(`
    CREATE TABLE IF NOT EXISTS type (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS status (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS work_history (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        type_id     INTEGER NOT NULL,
        name        TEXT    NOT NULL,
        time        TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
        status_id   INTEGER NOT NULL,
        path        TEXT,

        CONSTRAINT fk_work_history_type
            FOREIGN KEY (type_id) REFERENCES type(id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,

        CONSTRAINT fk_work_history_status
            FOREIGN KEY (status_id) REFERENCES status(id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_work_history_type_id   ON work_history(type_id);
    CREATE INDEX IF NOT EXISTS idx_work_history_status_id ON work_history(status_id);
    CREATE INDEX IF NOT EXISTS idx_work_history_time      ON work_history(time);

    INSERT INTO type (name)
    SELECT '音频提取'
    WHERE NOT EXISTS (SELECT 1 FROM type WHERE name = '音频提取');

    INSERT INTO type (name)
    SELECT '音频裁剪'
    WHERE NOT EXISTS (SELECT 1 FROM type WHERE name = '音频裁剪');

    INSERT INTO type (name)
    SELECT '汉英转译'
    WHERE NOT EXISTS (SELECT 1 FROM type WHERE name = '汉英转译');


    INSERT INTO status (name)
    SELECT '待处理'
    WHERE NOT EXISTS (SELECT 1 FROM status WHERE name = '待处理');

    INSERT INTO status (name)
    SELECT '处理中'
    WHERE NOT EXISTS (SELECT 1 FROM status WHERE name = '处理中');

    INSERT INTO status (name)
    SELECT '已完成'
    WHERE NOT EXISTS (SELECT 1 FROM status WHERE name = '已完成');

    INSERT INTO status (name)
    SELECT '已取消'
    WHERE NOT EXISTS (SELECT 1 FROM status WHERE name = '已取消');
    `)
}

ipcMain.handle('database:selectAll', (_, database: DatabaseType) => {
  if (!db) throw new Error('数据库尚未初始化')

  switch (database) {
    case 'status':
      return db.prepare('SELECT * FROM status').all()
    case 'type':
      return db.prepare('SELECT * FROM type').all()
    case 'work_history':
      return db.prepare('SELECT * FROM work_history').all()
  }
})

ipcMain.handle('database:selectStatus', (_, name: WorkStatus): number => {
  if (!db) throw new Error('数据库尚未初始化')

  const res = db.prepare<string, StatusTable>('SELECT id FROM status WHERE name = ?').get(name)

  return res?.id || -1
})

ipcMain.handle('database:selectType', (_, name: WorkType): number => {
  if (!db) throw new Error('数据库尚未初始化')

  const res = db.prepare<string, TypeTable>('SELECT id FROM type WHERE name = ?').get(name)

  return res?.id || -1
})

ipcMain.handle('database:selectWorkHistory', () => {
  if (!db) throw new Error('数据库尚未初始化')

  return db
    .prepare(
      `
        SELECT
        wh.id           AS id,
        wh.type_id      AS typeId,
        t.name          AS typeName,
        wh.name         AS name,
        wh.time         AS time,
        wh.status_id    AS statusId,
        s.name          AS statusName,
        wh.path         AS path
        FROM work_history wh
        LEFT JOIN type   t ON wh.type_id   = t.id
        LEFT JOIN status s ON wh.status_id = s.id
        ORDER BY wh.time DESC;
      `
    )
    .all()
})

ipcMain.handle('database:insertWorkHistory', (_, data: WorkHistoryInput) => {
  if (!db) throw new Error('数据库尚未初始化')

  const stmt = db.prepare(
    `
      INSERT INTO work_history (type_id, name, time, status_id, path)
      VALUES (?, ?, ?, ?, ?)
    `
  )

  const result = stmt.run(
    data.typeId,
    data.name,
    data.time || new Date().toISOString(),
    data.statusId,
    data.path
  )

  return result.lastInsertRowid
})
