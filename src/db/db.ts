import { Platform } from 'react-native'

let _db: any

if (Platform.OS === 'web') {
  const { openDatabaseSync } = require('./expo-sqlite-web')
  _db = openDatabaseSync('medvisit.db')
} else {
  const SQLite = require('expo-sqlite')
  _db = SQLite.openDatabaseSync('medvisit.db')
}

export const db = _db

export function initDatabase(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS hospitals (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL UNIQUE,
      doctor_name TEXT,
      personality TEXT,
      phone       TEXT,
      address     TEXT,
      notes       TEXT,
      last_visit  TEXT,
      next_visit  TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS visits (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
      visit_date  TEXT NOT NULL,
      visit_type  TEXT NOT NULL DEFAULT 'visit',
      time        TEXT,
      location    TEXT,
      content     TEXT NOT NULL DEFAULT '',
      is_completed INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_visits_hospital ON visits(hospital_id);
    CREATE INDEX IF NOT EXISTS idx_visits_date     ON visits(visit_date);
    CREATE INDEX IF NOT EXISTS idx_hospitals_name  ON hospitals(name);
  `)
}
