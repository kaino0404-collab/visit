// Web shim for expo-sqlite using sql.js (SQLite compiled to WebAssembly)
import initSqlJs, { Database } from 'sql.js'

type RunResult = { lastInsertRowId: number; changes: number }

let _db: Database | null = null
const DB_KEY = 'medvisit_sqlite_data'

function persist(db: Database) {
  const data = db.export()
  const buf = Buffer.from(data)
  localStorage.setItem(DB_KEY, buf.toString('base64'))
}

function load(): Uint8Array | null {
  const stored = localStorage.getItem(DB_KEY)
  if (!stored) return null
  const buf = Buffer.from(stored, 'base64')
  return new Uint8Array(buf)
}

async function getDb(): Promise<Database> {
  if (_db) return _db
  const SQL = await initSqlJs({
    locateFile: () =>
      'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.14.1/sql-wasm.wasm',
  })
  const saved = load()
  _db = saved ? new SQL.Database(saved) : new SQL.Database()
  return _db
}

// Sync wrapper — initialises once, then works synchronously via cached _db
function getDbSync(): Database {
  if (!_db) throw new Error('DB not initialized. Call initDatabase() first.')
  return _db
}

export function openDatabaseSync(_name: string) {
  return {
    execSync(sql: string) {
      const db = getDbSync()
      db.run(sql)
      persist(db)
    },

    runSync(sql: string, params: any[] = []): RunResult {
      const db = getDbSync()
      db.run(sql, params)
      const lastId = db.exec('SELECT last_insert_rowid()')[0]?.values[0][0]
      persist(db)
      return {
        lastInsertRowId: typeof lastId === 'number' ? lastId : Number(lastId) ?? 0,
        changes: 1,
      }
    },

    getAllSync<T>(sql: string, params: any[] = []): T[] {
      const db = getDbSync()
      const result = db.exec(sql, params)
      if (!result.length) return []
      const { columns, values } = result[0]
      return values.map((row) => {
        const obj: any = {}
        columns.forEach((col, i) => { obj[col] = row[i] })
        return obj as T
      })
    },

    getFirstSync<T>(sql: string, params: any[] = []): T | null {
      const db = getDbSync()
      const result = db.exec(sql, params)
      if (!result.length || !result[0].values.length) return null
      const { columns, values } = result[0]
      const obj: any = {}
      columns.forEach((col, i) => { obj[col] = values[0][i] })
      return obj as T
    },
  }
}

// Called once at app start to initialize the async DB before any sync calls
export async function initDbAsync() {
  await getDb()
}
