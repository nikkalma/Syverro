package com.syverro.data.local.database

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.syverro.data.local.dao.BookDao
import com.syverro.data.local.dao.ExperienceTagDao
import com.syverro.data.local.dao.LocalDocumentDao
import com.syverro.data.local.dao.PersonalBookDao
import com.syverro.data.local.dao.ProfileDao
import com.syverro.data.local.dao.QuoteDao
import com.syverro.data.local.dao.ReadingPositionDao
import com.syverro.data.local.dao.SessionDao
import com.syverro.data.local.dao.TextNoteDao
import com.syverro.data.local.dao.VoiceNoteDao
import com.syverro.data.local.entity.BookEntity
import com.syverro.data.local.entity.ExperienceTagEntity
import com.syverro.data.local.entity.LocalDocumentEntity
import com.syverro.data.local.entity.PersonalBookEntity
import com.syverro.data.local.entity.QuoteEntity
import com.syverro.data.local.entity.ReadingPositionEntity
import com.syverro.data.local.entity.SessionEntity
import com.syverro.data.local.entity.TextNoteEntity
import com.syverro.data.local.entity.UserProfileEntity
import com.syverro.data.local.entity.VoiceNoteEntity
import com.syverro.data.local.util.StableIds

@Database(
    entities = [
        BookEntity::class,
        PersonalBookEntity::class,
        SessionEntity::class,
        QuoteEntity::class,
        UserProfileEntity::class,
        TextNoteEntity::class,
        VoiceNoteEntity::class,
        ReadingPositionEntity::class,
        LocalDocumentEntity::class,
        ExperienceTagEntity::class,
    ],
    version = 3,
    exportSchema = true,
)
abstract class SyverroDatabase : RoomDatabase() {
    abstract fun bookDao(): BookDao
    abstract fun personalBookDao(): PersonalBookDao
    abstract fun sessionDao(): SessionDao
    abstract fun quoteDao(): QuoteDao
    abstract fun profileDao(): ProfileDao
    abstract fun textNoteDao(): TextNoteDao
    abstract fun voiceNoteDao(): VoiceNoteDao
    abstract fun readingPositionDao(): ReadingPositionDao
    abstract fun localDocumentDao(): LocalDocumentDao
    abstract fun experienceTagDao(): ExperienceTagDao

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

        val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                val now = System.currentTimeMillis()

                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS `personal_books` (
                        `id` TEXT NOT NULL,
                        `canonical_book_id` TEXT,
                        `title` TEXT NOT NULL,
                        `author_display` TEXT,
                        `local_cover_path` TEXT,
                        `reading_status` TEXT NOT NULL,
                        `progress` REAL NOT NULL,
                        `current_page` INTEGER,
                        `total_pages` INTEGER,
                        `start_date` INTEGER,
                        `end_date` INTEGER,
                        `provenance` TEXT NOT NULL,
                        `has_local_document` INTEGER NOT NULL DEFAULT 0,
                        `created_at` INTEGER NOT NULL,
                        `updated_at` INTEGER NOT NULL,
                        PRIMARY KEY(`id`),
                        FOREIGN KEY(`canonical_book_id`) REFERENCES `books`(`id`) ON UPDATE NO ACTION ON DELETE SET NULL
                    )
                """)
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_personal_books_canonical_book_id` ON `personal_books`(`canonical_book_id`)")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_personal_books_reading_status` ON `personal_books`(`reading_status`)")

                val canonicalBooks = mutableMapOf<String, Pair<String, String>>()
                db.query("SELECT id, title, author FROM books").use { cursor ->
                    while (cursor.moveToNext()) {
                        canonicalBooks[cursor.getString(0)] = cursor.getString(1) to cursor.getString(2)
                    }
                }

                val mapping = mutableMapOf<String, String>()

                db.query("SELECT book_id, reading_status, progress, created_at, updated_at FROM user_books").use { cursor ->
                    while (cursor.moveToNext()) {
                        val canonicalId = cursor.getString(0)
                        val status = cursor.getString(1)
                        val progress = cursor.getFloat(2)
                        val createdAt = cursor.getLong(3)
                        val updatedAt = cursor.getLong(4)
                        val known = canonicalBooks[canonicalId]
                        val title = known?.first ?: "Unknown book"
                        val author = known?.second
                        val uuid = StableIds.personalBookId(canonicalId)
                        mapping[canonicalId] = uuid
                        db.execSQL(
                            "INSERT INTO personal_books (id, canonical_book_id, title, author_display, local_cover_path, reading_status, progress, current_page, total_pages, start_date, end_date, provenance, has_local_document, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            arrayOf(
                                uuid, if (known != null) canonicalId else null, title, author, null, status, progress, null, null, null, null,
                                "historical_import", 0, createdAt, updatedAt,
                            ),
                        )
                    }
                }

                fun ensurePersonalBook(canonicalId: String?): String? {
                    if (canonicalId == null) return null
                    mapping[canonicalId]?.let { return it }
                    val known = canonicalBooks[canonicalId]
                    val title = known?.first ?: "Unknown book"
                    val author = known?.second
                    val uuid = StableIds.personalBookId(canonicalId)
                    mapping[canonicalId] = uuid
                    db.execSQL(
                        "INSERT INTO personal_books (id, canonical_book_id, title, author_display, local_cover_path, reading_status, progress, current_page, total_pages, start_date, end_date, provenance, has_local_document, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        arrayOf(
                            uuid, if (known != null) canonicalId else null, title, author, null, "PLANNED", 0f, null, null, null, null,
                            "historical_import", 0, now, now,
                        ),
                    )
                    return uuid
                }

                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS `sessions_new` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `book_id` TEXT NOT NULL,
                        `sync_id` TEXT NOT NULL,
                        `started_at` INTEGER NOT NULL,
                        `finished_at` INTEGER,
                        `duration_seconds` INTEGER NOT NULL,
                        `status` TEXT NOT NULL,
                        `created_at` INTEGER NOT NULL,
                        FOREIGN KEY(`book_id`) REFERENCES `personal_books`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE
                    )
                """)
                db.query("SELECT id, book_id, started_at, finished_at, duration_seconds, status, created_at FROM sessions").use { cursor ->
                    while (cursor.moveToNext()) {
                        val id = cursor.getLong(0)
                        val personalId = ensurePersonalBook(cursor.getString(1)) ?: continue
                        db.execSQL(
                            "INSERT INTO sessions_new (id, book_id, sync_id, started_at, finished_at, duration_seconds, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                            arrayOf(
                                id,
                                personalId,
                                StableIds.sessionSyncId(id),
                                cursor.getLong(2),
                                if (cursor.isNull(3)) null else cursor.getLong(3),
                                cursor.getLong(4),
                                cursor.getString(5),
                                cursor.getLong(6),
                            ),
                        )
                    }
                }

                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS `quotes_backup` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `session_id` INTEGER NOT NULL,
                        `book_id` TEXT NOT NULL,
                        `text` TEXT NOT NULL,
                        `created_at` INTEGER NOT NULL
                    )
                """)
                db.query("SELECT id, session_id, book_id, text, created_at FROM quotes").use { cursor ->
                    while (cursor.moveToNext()) {
                        db.execSQL(
                            "INSERT INTO quotes_backup (id, session_id, book_id, text, created_at) VALUES (?, ?, ?, ?, ?)",
                            arrayOf(
                                cursor.getLong(0),
                                cursor.getLong(1),
                                cursor.getString(2),
                                cursor.getString(3),
                                cursor.getLong(4),
                            ),
                        )
                    }
                }
                db.execSQL("DROP TABLE quotes")
                db.execSQL("DROP TABLE sessions")
                db.execSQL("ALTER TABLE sessions_new RENAME TO sessions")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_sessions_book_id` ON `sessions`(`book_id`)")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_sessions_status` ON `sessions`(`status`)")
                db.execSQL("CREATE UNIQUE INDEX IF NOT EXISTS `index_sessions_sync_id` ON `sessions`(`sync_id`)")

                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS `quotes_new` (
                        `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        `book_id` TEXT NOT NULL,
                        `sync_id` TEXT NOT NULL,
                        `session_id` INTEGER,
                        `text` TEXT NOT NULL,
                        `locator` TEXT,
                        `page` INTEGER,
                        `note` TEXT,
                        `provenance` TEXT NOT NULL,
                        `created_at` INTEGER NOT NULL,
                        FOREIGN KEY(`book_id`) REFERENCES `personal_books`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
                        FOREIGN KEY(`session_id`) REFERENCES `sessions`(`id`) ON UPDATE NO ACTION ON DELETE SET NULL
                    )
                """)
                db.query("SELECT id, session_id, book_id, text, created_at FROM quotes_backup").use { cursor ->
                    while (cursor.moveToNext()) {
                        val id = cursor.getLong(0)
                        val sessionId = if (cursor.isNull(1)) null else cursor.getLong(1)
                        val personalId = ensurePersonalBook(cursor.getString(2)) ?: continue
                        db.execSQL(
                            "INSERT INTO quotes_new (id, book_id, sync_id, session_id, text, locator, page, note, provenance, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            arrayOf(
                                id,
                                personalId,
                                StableIds.quoteSyncId(id),
                                sessionId,
                                cursor.getString(3),
                                null,
                                null,
                                null,
                                "reader_observed",
                                cursor.getLong(4),
                            ),
                        )
                    }
                }
                db.execSQL("DROP TABLE quotes_backup")
                db.execSQL("ALTER TABLE quotes_new RENAME TO quotes")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_quotes_session_id` ON `quotes`(`session_id`)")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_quotes_book_id` ON `quotes`(`book_id`)")
                db.execSQL("CREATE UNIQUE INDEX IF NOT EXISTS `index_quotes_sync_id` ON `quotes`(`sync_id`)")

                db.execSQL("DROP TABLE IF EXISTS user_books")

                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS `text_notes` (
                        `id` TEXT NOT NULL,
                        `book_id` TEXT NOT NULL,
                        `session_id` INTEGER,
                        `text` TEXT NOT NULL,
                        `locator` TEXT,
                        `page` INTEGER,
                        `provenance` TEXT NOT NULL,
                        `created_at` INTEGER NOT NULL,
                        `updated_at` INTEGER NOT NULL,
                        PRIMARY KEY(`id`),
                        FOREIGN KEY(`book_id`) REFERENCES `personal_books`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
                        FOREIGN KEY(`session_id`) REFERENCES `sessions`(`id`) ON UPDATE NO ACTION ON DELETE SET NULL
                    )
                """)
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_text_notes_book_id` ON `text_notes`(`book_id`)")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_text_notes_session_id` ON `text_notes`(`session_id`)")

                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS `voice_notes` (
                        `id` TEXT NOT NULL,
                        `book_id` TEXT NOT NULL,
                        `session_id` INTEGER,
                        `local_audio_path` TEXT NOT NULL,
                        `audio_duration_ms` INTEGER,
                        `locator` TEXT,
                        `page` INTEGER,
                        `provenance` TEXT NOT NULL,
                        `created_at` INTEGER NOT NULL,
                        `updated_at` INTEGER NOT NULL,
                        PRIMARY KEY(`id`),
                        FOREIGN KEY(`book_id`) REFERENCES `personal_books`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
                        FOREIGN KEY(`session_id`) REFERENCES `sessions`(`id`) ON UPDATE NO ACTION ON DELETE SET NULL
                    )
                """)
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_voice_notes_book_id` ON `voice_notes`(`book_id`)")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_voice_notes_session_id` ON `voice_notes`(`session_id`)")

                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS `reading_position` (
                        `book_id` TEXT NOT NULL,
                        `locator` TEXT,
                        `percent` REAL NOT NULL,
                        `last_opened_at` INTEGER,
                        `updated_at` INTEGER NOT NULL,
                        `source` TEXT NOT NULL,
                        PRIMARY KEY(`book_id`),
                        FOREIGN KEY(`book_id`) REFERENCES `personal_books`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE
                    )
                """)

                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS `local_documents` (
                        `book_id` TEXT NOT NULL,
                        `format` TEXT NOT NULL,
                        `file_name` TEXT NOT NULL,
                        `local_path` TEXT NOT NULL,
                        `source_uri` TEXT,
                        `file_size` INTEGER,
                        `mime_type` TEXT,
                        `is_available` INTEGER NOT NULL DEFAULT 1,
                        `created_at` INTEGER NOT NULL,
                        PRIMARY KEY(`book_id`),
                        FOREIGN KEY(`book_id`) REFERENCES `personal_books`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE
                    )
                """)

                db.execSQL("""
                    CREATE TABLE IF NOT EXISTS `experience_tags` (
                        `id` TEXT NOT NULL,
                        `book_id` TEXT NOT NULL,
                        `scope` TEXT NOT NULL,
                        `label` TEXT NOT NULL,
                        `normalized_label` TEXT,
                        `editorial_node_id` TEXT,
                        `created_at` INTEGER NOT NULL,
                        PRIMARY KEY(`id`),
                        FOREIGN KEY(`book_id`) REFERENCES `personal_books`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE
                    )
                """)
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_experience_tags_book_id` ON `experience_tags`(`book_id`)")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_experience_tags_scope` ON `experience_tags`(`scope`)")
            }
        }
    }
}
