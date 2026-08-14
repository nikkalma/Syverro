package com.syverro.di

import android.content.Context
import androidx.room.Room
import com.syverro.data.local.dao.BookDao
import com.syverro.data.local.dao.ProfileDao
import com.syverro.data.local.dao.QuoteDao
import com.syverro.data.local.dao.SessionDao
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
            .addMigrations(SyverroDatabase.MIGRATION_1_2)
            .build()
    }

    @Provides
    @Singleton
    fun provideBookDao(database: SyverroDatabase): BookDao {
        return database.bookDao()
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

    private object SeedCallback : androidx.room.RoomDatabase.Callback() {
        override fun onCreate(db: androidx.sqlite.db.SupportSQLiteDatabase) {
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
                    SeedBooks.userBooks().forEach { ub ->
                        db.execSQL(
                            "INSERT OR REPLACE INTO user_books (book_id, reading_status, progress, rating, favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                            arrayOf(ub.bookId, ub.readingStatus, ub.progress, ub.rating, if (ub.favorite) 1 else 0, ub.createdAt, ub.updatedAt),
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
