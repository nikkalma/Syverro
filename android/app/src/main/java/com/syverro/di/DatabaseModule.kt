package com.syverro.di

import android.content.Context
import androidx.room.Room
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
import com.syverro.BuildConfig
import com.syverro.data.local.database.SyverroDatabase
import com.syverro.data.local.seed.SeedBooks
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): SyverroDatabase {
        return Room.databaseBuilder(
            context,
            SyverroDatabase::class.java,
            "syverro.db",
        ).addCallback(SeedCallback)
            .addMigrations(SyverroDatabase.MIGRATION_1_2, SyverroDatabase.MIGRATION_2_3)
            .build()
    }

    @Provides
    @Singleton
    fun provideBookDao(database: SyverroDatabase): BookDao {
        return database.bookDao()
    }

    @Provides
    @Singleton
    fun providePersonalBookDao(database: SyverroDatabase): PersonalBookDao {
        return database.personalBookDao()
    }

    @Provides
    @Singleton
    fun provideSessionDao(database: SyverroDatabase): SessionDao {
        return database.sessionDao()
    }

    @Provides
    @Singleton
    fun provideQuoteDao(database: SyverroDatabase): QuoteDao {
        return database.quoteDao()
    }

    @Provides
    @Singleton
    fun provideProfileDao(database: SyverroDatabase): ProfileDao {
        return database.profileDao()
    }

    @Provides
    @Singleton
    fun provideTextNoteDao(database: SyverroDatabase): TextNoteDao {
        return database.textNoteDao()
    }

    @Provides
    @Singleton
    fun provideVoiceNoteDao(database: SyverroDatabase): VoiceNoteDao {
        return database.voiceNoteDao()
    }

    @Provides
    @Singleton
    fun provideReadingPositionDao(database: SyverroDatabase): ReadingPositionDao {
        return database.readingPositionDao()
    }

    @Provides
    @Singleton
    fun provideLocalDocumentDao(database: SyverroDatabase): LocalDocumentDao {
        return database.localDocumentDao()
    }

    @Provides
    @Singleton
    fun provideExperienceTagDao(database: SyverroDatabase): ExperienceTagDao {
        return database.experienceTagDao()
    }

    private object SeedCallback : androidx.room.RoomDatabase.Callback() {
        override fun onCreate(db: androidx.sqlite.db.SupportSQLiteDatabase) {
            if (!BuildConfig.DEBUG) return
            db.beginTransaction()
            try {
                val cursor = db.query("SELECT COUNT(*) FROM books")
                val count = if (cursor.moveToFirst()) cursor.getInt(0) else 1
                cursor.close()
                if (count == 0) {
                    SeedBooks.books().forEach { book ->
                        db.execSQL(
                            "INSERT OR IGNORE INTO books (id, title, author, cover_url, description, language, page_count) VALUES (?, ?, ?, ?, ?, ?, ?)",
                            arrayOf(book.id, book.title, book.author, book.coverUrl, book.description, book.language, book.pageCount),
                        )
                    }
                    SeedBooks.personalBooks().forEach { pb ->
                        db.execSQL(
                            "INSERT OR IGNORE INTO personal_books (id, canonical_book_id, title, author_display, local_cover_path, reading_status, progress, current_page, total_pages, start_date, end_date, provenance, has_local_document, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            arrayOf(
                                pb.id, pb.canonicalBookId, pb.title, pb.authorDisplay, pb.localCoverPath, pb.readingStatus,
                                pb.progress, pb.currentPage, pb.totalPages, pb.startDate, pb.endDate, pb.provenance,
                                if (pb.hasLocalDocument) 1 else 0, pb.createdAt, pb.updatedAt,
                            ),
                        )
                    }
                }
                db.setTransactionSuccessful()
            } finally {
                db.endTransaction()
            }
        }
    }
}
