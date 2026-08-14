package com.syverro.data.local.database

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.syverro.data.local.dao.BookDao
import com.syverro.data.local.dao.ProfileDao
import com.syverro.data.local.dao.QuoteDao
import com.syverro.data.local.dao.SessionDao
import com.syverro.data.local.entity.BookEntity
import com.syverro.data.local.entity.QuoteEntity
import com.syverro.data.local.entity.SessionEntity
import com.syverro.data.local.entity.UserBookEntity
import com.syverro.data.local.entity.UserProfileEntity

@Database(
    entities = [BookEntity::class, UserBookEntity::class, SessionEntity::class, QuoteEntity::class, UserProfileEntity::class],
    version = 2,
    exportSchema = false,
)
abstract class SyverroDatabase : RoomDatabase() {
    abstract fun bookDao(): BookDao
    abstract fun sessionDao(): SessionDao
    abstract fun quoteDao(): QuoteDao
    abstract fun profileDao(): ProfileDao

    companion object {
        val MIGRATION_1_2 = Migration(1, 2) { db ->
            db.execSQL("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    book_id TEXT NOT NULL,
                    started_at INTEGER NOT NULL,
                    finished_at INTEGER,
                    duration_seconds INTEGER NOT NULL DEFAULT 0,
                    status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
                    created_at INTEGER NOT NULL,
                    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
                )
            """)
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_sessions_book_id ON sessions(book_id)")
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status)")
            db.execSQL("""
                CREATE TABLE IF NOT EXISTS quotes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    session_id INTEGER NOT NULL,
                    book_id TEXT NOT NULL,
                    text TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
                )
            """)
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_quotes_session_id ON quotes(session_id)")
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_quotes_book_id ON quotes(book_id)")
            db.execSQL("""
                CREATE TABLE IF NOT EXISTS user_profile (
                    id TEXT PRIMARY KEY NOT NULL DEFAULT 'default',
                    display_name TEXT NOT NULL DEFAULT 'Reader',
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                )
            """)
            db.execSQL("""
                INSERT OR IGNORE INTO user_profile (id, display_name, created_at, updated_at)
                VALUES ('default', 'Reader', ${System.currentTimeMillis()}, ${System.currentTimeMillis()})
            """)
        }
    }
}
