import { app } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'

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

/** 获取已初始化的数据库连接；未初始化时抛出错误。 */
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
