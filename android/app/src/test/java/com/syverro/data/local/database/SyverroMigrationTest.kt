package com.syverro.data.local.database

import android.database.Cursor
import androidx.room.testing.MigrationTestHelper
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.test.platform.app.InstrumentationRegistry
import com.syverro.data.local.util.StableIds
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SyverroMigrationTest {

    private val dbName = "migration-test.db"

    @get:Rule
    val helper = MigrationTestHelper(
        InstrumentationRegistry.getInstrumentation(),
        SyverroDatabase::class.java,
    )

    @Test
    fun migrate2To3_reparentsSessionsAndQuotesOntoPersonalBooks() {
        val v2 = helper.createDatabase(dbName, 2)
        v2.insertV2Data()
        v2.close()

        val db = helper.runMigrationsAndValidate(dbName, 3, true, SyverroDatabase.MIGRATION_2_3)

        val personalPiranesi = StableIds.personalBookId("1")
        val personalOrphan = StableIds.personalBookId("99")

        db.singleRow("SELECT canonical_book_id, title, author_display, reading_status, progress, provenance FROM personal_books WHERE id = ?", arrayOf(personalPiranesi)) { cursor ->
            assertEquals("1", cursor.getString(0))
            assertEquals("Piranesi", cursor.getString(1))
            assertEquals("Susanna Clarke", cursor.getString(2))
            assertEquals("READING", cursor.getString(3))
            assertEquals(0.42f, cursor.getFloat(4), 0.001f)
            assertEquals("historical_import", cursor.getString(5))
        }

        db.singleRow("SELECT reading_status, provenance FROM personal_books WHERE id = ?", arrayOf(personalOrphan)) { cursor ->
            assertEquals("PLANNED", cursor.getString(0))
            assertEquals("historical_import", cursor.getString(1))
        }

        db.singleRow("SELECT book_id, sync_id, duration_seconds, status FROM sessions WHERE id = ?", arrayOf(1L)) { cursor ->
            assertEquals(personalPiranesi, cursor.getString(0))
            assertEquals(StableIds.sessionSyncId(1L), cursor.getString(1))
            assertEquals(3600L, cursor.getLong(2))
            assertEquals("IN_PROGRESS", cursor.getString(3))
        }

        db.singleRow("SELECT book_id, sync_id, session_id, text, provenance FROM quotes WHERE id = ?", arrayOf(1L)) { cursor ->
            assertEquals(personalPiranesi, cursor.getString(0))
            assertEquals(StableIds.quoteSyncId(1L), cursor.getString(1))
            assertEquals(1L, cursor.getLong(2))
            assertEquals("A beautiful sentence.", cursor.getString(3))
            assertEquals("reader_observed", cursor.getString(4))
        }

        db.singleRow("SELECT book_id FROM sessions WHERE id = ?", arrayOf(2L)) { cursor ->
            assertEquals(personalOrphan, cursor.getString(0))
        }

        db.singleRow("SELECT book_id, session_id FROM quotes WHERE id = ?", arrayOf(2L)) { cursor ->
            assertEquals(personalOrphan, cursor.getString(0))
            assertEquals(2L, cursor.getLong(1))
        }

        assertFalse("user_books should be dropped", tableExists(db, "user_books"))
        for (table in listOf("text_notes", "voice_notes", "reading_position", "local_documents", "experience_tags")) {
            assertTrue("expected $table to exist", tableExists(db, table))
        }

        assertForeignKeysClean(db)

        db.execSQL("PRAGMA foreign_keys = ON")
        db.execSQL("DELETE FROM sessions WHERE id = 2")
        db.singleRow("SELECT session_id FROM quotes WHERE id = 2") { cursor ->
            assertNull("quote should detach from deleted session", if (cursor.isNull(0)) null else cursor.getLong(0))
        }

        db.close()
    }

    private fun SupportSQLiteDatabase.insertV2Data() {
        execSQL(
            "INSERT INTO books (id, title, author, cover_url, description, language, page_count) VALUES (?, ?, ?, ?, ?, ?, ?)",
            arrayOf("1", "Piranesi", "Susanna Clarke", "", "A man in a house.", "en", 250),
        )
        execSQL(
            "INSERT INTO user_books (book_id, reading_status, progress, rating, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            arrayOf("1", "READING", 0.42f, 4.5, 1, 1_700_000_000_000L, 1_700_100_000_000L),
        )
        execSQL(
            "INSERT INTO sessions (id, book_id, started_at, finished_at, duration_seconds, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            arrayOf(1L, "1", 1_700_200_000_000L, null, 3600L, "IN_PROGRESS", 1_700_200_000_000L),
        )
        execSQL(
            "INSERT INTO quotes (id, session_id, book_id, text, created_at) VALUES (?, ?, ?, ?, ?)",
            arrayOf(1L, 1L, "1", "A beautiful sentence.", 1_700_300_000_000L),
        )
        execSQL(
            "INSERT INTO sessions (id, book_id, started_at, finished_at, duration_seconds, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            arrayOf(2L, "99", 1_700_400_000_000L, null, 60L, "FINISHED", 1_700_400_000_000L),
        )
        execSQL(
            "INSERT INTO quotes (id, session_id, book_id, text, created_at) VALUES (?, ?, ?, ?, ?)",
            arrayOf(2L, 2L, "99", "An orphaned quote.", 1_700_500_000_000L),
        )
    }

    private fun tableExists(db: SupportSQLiteDatabase, table: String): Boolean {
        var exists = false
        db.singleRow("SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = ?", arrayOf(table)) { cursor ->
            exists = cursor.getInt(0) > 0
        }
        return exists
    }

    private fun assertForeignKeysClean(db: SupportSQLiteDatabase) {
        db.query("PRAGMA foreign_key_check").use { cursor ->
            assertFalse("expected no foreign key violations", cursor.moveToFirst())
        }
    }

    private fun SupportSQLiteDatabase.singleRow(
        sql: String,
        bindArgs: Array<Any?> = arrayOfNulls(0),
        assertBlock: (Cursor) -> Unit,
    ) {
        query(sql, bindArgs).use { cursor ->
            assertTrue("expected a row for: $sql", cursor.moveToFirst())
            assertBlock(cursor)
        }
    }
}
