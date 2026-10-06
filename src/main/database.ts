import { app, ipcMain } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'
import {
  Database as DatabaseType,
  StatusTable,
  TypeTable,
  WorkHistoryInsert,
  WorkHistoryTable,
  WorkHistoryUnion,
  WorkStatus,
  WorkType
} from '../shared/type'

let db: Database.Database | null = null

/**
 * 打开（不存在则创建）主进程的 SQLite 数据库，返回连接。
 * 仅负责建库与连接，不包含任何增删改查。
 */
export const initDatabase = (): Database.Database => {
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
    SELECT '已中断'
    WHERE NOT EXISTS (SELECT 1 FROM status WHERE name = '已中断');
    `)
}

export const selectAll = (
  database: DatabaseType
): StatusTable[] | TypeTable[] | WorkHistoryTable[] => {
  if (!db) throw new Error('数据库尚未初始化')

  switch (database) {
    case 'status':
      return db.prepare('SELECT * FROM status').all() as StatusTable[]
    case 'type':
      return db.prepare('SELECT * FROM type').all() as TypeTable[]
    case 'work_history':
      return db.prepare('SELECT * FROM work_history').all() as WorkHistoryTable[]
  }
}

export const selectStatus = (name: WorkStatus): number => {
  if (!db) throw new Error('数据库尚未初始化')

  const res = db.prepare<string, StatusTable>('SELECT id FROM status WHERE name = ?').get(name)

  return res?.id || -1
}

export const selectType = (name: WorkType): number => {
  if (!db) throw new Error('数据库尚未初始化')

  const res = db.prepare<string, TypeTable>('SELECT id FROM type WHERE name = ?').get(name)

  return res?.id || -1
}

export const selectWorkHistoryUnion = (): WorkHistoryUnion[] => {
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
    .all() as WorkHistoryUnion[]
}

export const insertWorkHistory = (data: WorkHistoryInsert): number => {
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

  return result.lastInsertRowid as number
}

export const updateWorkHistory = (
  id: number,
  data: Partial<Omit<WorkHistoryTable, 'id'>>
): void => {
  if (!db) throw new Error('数据库尚未初始化')

  // 字段名 -> 数据库列名的映射（防止调用方传入任意 key）
  const columnMap: Record<string, string> = {
    typeId: 'type_id',
    name: 'name',
    time: 'time',
    statusId: 'status_id',
    path: 'path'
  }

  const sets: string[] = []
  const values: unknown[] = []

  for (const [key, column] of Object.entries(columnMap)) {
    const value = (data as Record<string, unknown>)[key]
    if (value !== undefined) {
      sets.push(`${column} = ?`)
      values.push(value)
    }
  }

  // 没有任何字段需要更新，直接返回
  if (sets.length === 0) return

  values.push(id)

  db.prepare(`UPDATE work_history SET ${sets.join(', ')} WHERE id = ?`).run(...values)
}

ipcMain.handle('database:selectAll', (_, database: DatabaseType) => {
  return selectAll(database)
})

ipcMain.handle('database:selectStatus', (_, name: WorkStatus): number => {
  return selectStatus(name)
})

ipcMain.handle('database:selectType', (_, name: WorkType): number => {
  return selectType(name)
})

ipcMain.handle('database:selectWorkHistoryUnion', (): WorkHistoryUnion[] => {
  return selectWorkHistoryUnion()
})

ipcMain.handle('database:insertWorkHistory', (_, data: WorkHistoryInsert): number => {
  return insertWorkHistory(data)
})

ipcMain.handle(
  'database:updateWorkHistory',
  (_, id: number, data: Partial<Omit<WorkHistoryTable, 'id'>>): void => {
    updateWorkHistory(id, data)
  }
)

ipcMain.handle('database:deleteAll', (_, database: DatabaseType): void => {
  if (!db) throw new Error('数据库尚未初始化')

  db.prepare(`DELETE FROM ${database}`).run()
})

ipcMain.handle('database:deleteById', (_, database: DatabaseType, id: number): void => {
  if (!db) throw new Error('数据库尚未初始化')

  const stmt = db.prepare(`
    DELETE FROM ${database}
    WHERE id = ?
  `)

  stmt.run(id)
})

ipcMain.handle('database:deleteBatchByIds', (_, database: DatabaseType, ids: number[]): void => {
  if (!db) throw new Error('数据库尚未初始化')
  if (ids.length === 0) return

  const placeholders = ids.map(() => '?').join(', ')
  const stmt = db.prepare(`
    DELETE FROM ${database}
    WHERE id IN (${placeholders})
  `)

  stmt.run(...ids)
})
