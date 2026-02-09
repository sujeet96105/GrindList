import { getDb } from './db';

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    category_id TEXT,
    recurrence_rule TEXT,
    recurrence_interval INTEGER,
    recurrence_end_date TEXT,
    location_lat REAL,
    location_lng REAL,
    location_radius REAL,
    completion_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS subtasks (
    id TEXT PRIMARY KEY NOT NULL,
    task_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    order_index INTEGER,
    completion_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS task_tags (
    task_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (task_id, tag_id)
  );`,
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY NOT NULL,
    task_id TEXT NOT NULL,
    remind_at TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS focus_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    task_id TEXT,
    duration_minutes INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS user_achievements (
    id TEXT PRIMARY KEY NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS user_stats (
    id TEXT PRIMARY KEY NOT NULL,
    current_streak INTEGER NOT NULL,
    longest_streak INTEGER NOT NULL,
    xp_total INTEGER NOT NULL,
    level INTEGER NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    payload TEXT,
    status TEXT NOT NULL,
    retries INTEGER NOT NULL,
    last_error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
];

async function getSchemaVersion() {
  const db = await getDb();
  await db.executeSql(schemaStatements[0]);
  const [results] = await db.executeSql(`SELECT value FROM meta WHERE key = 'schema_version'`);
  if (results.rows.length === 0) return 0;
  const value = results.rows.item(0).value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function setSchemaVersion(version: number) {
  const db = await getDb();
  await db.executeSql(`INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', ?)`, [
    String(version),
  ]);
}

const migrations: Array<() => Promise<void>> = [
  // v1: initial schema
  async () => {
    const db = await getDb();
    for (const statement of schemaStatements) {
      await db.executeSql(statement);
    }
  },
  // v2: add indexes for task lookup/sync
  async () => {
    const db = await getDb();
    await db.executeSql(`CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at)`);
    await db.executeSql(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
    await db.executeSql(`CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)`);
  },
  // v3: sync queue table
  async () => {
    const db = await getDb();
    await db.executeSql(`CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      payload TEXT,
      status TEXT NOT NULL,
      retries INTEGER NOT NULL,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`);
    await db.executeSql(
      `CREATE INDEX IF NOT EXISTS idx_sync_queue_status_created_at ON sync_queue(status, created_at)`
    );
  },
  // v4: recurring tasks
  async () => {
    const db = await getDb();
    try {
      await db.executeSql(`ALTER TABLE tasks ADD COLUMN recurrence_rule TEXT`);
    } catch {}
    try {
      await db.executeSql(`ALTER TABLE tasks ADD COLUMN recurrence_interval INTEGER`);
    } catch {}
    try {
      await db.executeSql(`ALTER TABLE tasks ADD COLUMN recurrence_end_date TEXT`);
    } catch {}
  },
  // v5: location reminders
  async () => {
    const db = await getDb();
    try {
      await db.executeSql(`ALTER TABLE tasks ADD COLUMN location_lat REAL`);
    } catch {}
    try {
      await db.executeSql(`ALTER TABLE tasks ADD COLUMN location_lng REAL`);
    } catch {}
    try {
      await db.executeSql(`ALTER TABLE tasks ADD COLUMN location_radius REAL`);
    } catch {}
  },
];

export async function initDb() {
  const db = await getDb();
  const currentVersion = await getSchemaVersion();
  for (let v = currentVersion; v < migrations.length; v += 1) {
    await migrations[v]();
    await setSchemaVersion(v + 1);
  }
  return db;
}
