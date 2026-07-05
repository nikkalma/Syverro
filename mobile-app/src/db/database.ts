import * as SQLite from 'expo-sqlite';

// ============================================
// SYVERRO — SQLite Database Layer
// ============================================

// ✅ ИСПРАВЛЕНО: openDatabaseSync вместо openDatabase
export const db = SQLite.openDatabaseSync('syverro.db');

export const initDatabase = async () => {
  console.log('📦 Initializing database...');

  // ✅ ИСПРАВЛЕНО: execAsync вместо transaction + executeSql
  await db.execAsync(`
    -- BOOKS
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT,
      author TEXT,
      status TEXT,
      rating INTEGER,
      current_page INTEGER,
      updated_at INTEGER,
      deleted_at INTEGER
    );

    -- QUOTES
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY NOT NULL,
      book_id TEXT,
      text TEXT,
      page INTEGER,
      updated_at INTEGER,
      deleted_at INTEGER
    );

    -- SESSIONS
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      book_id TEXT,
      start_page INTEGER,
      end_page INTEGER,
      duration_seconds INTEGER,
      updated_at INTEGER,
      deleted_at INTEGER
    );
  `);

  console.log('✅ Database initialized');
};