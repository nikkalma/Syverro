package com.syverro.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.syverro.data.local.entity.BookEntity
import com.syverro.data.local.entity.UserBookEntity

@Dao
interface BookDao {

    @Query("""
        SELECT b.*, u.reading_status, u.progress, u.rating, u.favorite
        FROM books b
        LEFT JOIN user_books u ON b.id = u.book_id
        ORDER BY u.created_at DESC, b.title ASC
    """)
    fun getLibrary(): List<BookWithStatus>

    @Query("""
        SELECT b.*, u.reading_status, u.progress, u.rating, u.favorite
        FROM books b
        LEFT JOIN user_books u ON b.id = u.book_id
        WHERE b.id = :bookId
    """)
    fun getBook(bookId: String): BookWithStatus?

    @Query("""
        SELECT b.*, u.reading_status, u.progress, u.rating, u.favorite
        FROM books b
        LEFT JOIN user_books u ON b.id = u.book_id
        WHERE b.title LIKE '%' || :query || '%' OR b.author LIKE '%' || :query || '%'
        ORDER BY b.title ASC
    """)
    fun search(query: String): List<BookWithStatus>

    @Query("""
        SELECT b.*, u.reading_status, u.progress, u.rating, u.favorite
        FROM books b
        INNER JOIN user_books u ON b.id = u.book_id
        WHERE u.reading_status = :status
        ORDER BY u.updated_at DESC
    """)
    fun getBooksByStatus(status: String): List<BookWithStatus>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertBook(book: BookEntity)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    fun insertBooks(books: List<BookEntity>)

    @Update
    fun updateBook(book: BookEntity)

    @Delete
    fun deleteBook(book: BookEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertUserBook(userBook: UserBookEntity)

    @Update
    fun updateUserBook(userBook: UserBookEntity)

    @Query("SELECT COUNT(*) FROM books")
    fun count(): Int

    @Query("""
        SELECT EXISTS(SELECT 1 FROM user_books WHERE book_id = :bookId AND favorite = 1)
    """)
    fun isFavorite(bookId: String): Boolean
}
