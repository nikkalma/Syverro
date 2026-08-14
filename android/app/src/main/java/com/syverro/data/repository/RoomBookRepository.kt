package com.syverro.data.repository

import com.syverro.data.local.dao.BookDao
import com.syverro.data.local.mapper.BookMapper
import com.syverro.data.local.seed.SeedBooks
import com.syverro.domain.model.Book
import com.syverro.domain.model.ReadingStatus
import com.syverro.domain.repository.BookRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RoomBookRepository @Inject constructor(
    private val bookDao: BookDao,
) : BookRepository {

    override fun getAll(): List<Book> {
        return bookDao.getLibrary().map(BookMapper::toDomain)
    }

    override fun getById(id: String): Book? {
        return bookDao.getBook(id)?.let(BookMapper::toDomain)
    }

    override fun getBooksByStatus(status: ReadingStatus): List<Book> {
        return bookDao.getBooksByStatus(status.name).map(BookMapper::toDomain)
    }

    override fun search(query: String): List<Book> {
        return bookDao.search(query).map(BookMapper::toDomain)
    }

    override fun insert(book: Book) {
        bookDao.insertBook(BookMapper.toEntity(book))
        bookDao.insertUserBook(BookMapper.toUserBook(book))
    }

    override fun insertAll(books: List<Book>) {
        val entities = books.map(BookMapper::toEntity)
        val userBooks = books.map(BookMapper::toUserBook)
        bookDao.insertBooks(entities)
        userBooks.forEach { bookDao.insertUserBook(it) }
    }

    override fun update(book: Book) {
        bookDao.updateBook(BookMapper.toEntity(book))
        bookDao.insertUserBook(BookMapper.toUserBook(book).copy(updatedAt = System.currentTimeMillis()))
    }

    override fun updateStatus(id: String, status: ReadingStatus) {
        val book = bookDao.getBook(id) ?: return
        val userBook = com.syverro.data.local.entity.UserBookEntity(
            bookId = id,
            readingStatus = status.name,
            progress = book.progress ?: 0f,
            rating = book.rating ?: 0f,
            favorite = book.favorite ?: false,
            updatedAt = System.currentTimeMillis(),
        )
        bookDao.insertUserBook(userBook)
    }

    override fun updateProgress(id: String, progress: Float) {
        val book = bookDao.getBook(id) ?: return
        bookDao.insertUserBook(
            com.syverro.data.local.entity.UserBookEntity(
                bookId = id,
                readingStatus = book.readingStatus ?: "PLANNED",
                progress = progress,
                rating = book.rating ?: 0f,
                favorite = book.favorite ?: false,
                updatedAt = System.currentTimeMillis(),
            )
        )
    }

    override fun updateRating(id: String, rating: Float) {
        val book = bookDao.getBook(id) ?: return
        bookDao.insertUserBook(
            com.syverro.data.local.entity.UserBookEntity(
                bookId = id,
                readingStatus = book.readingStatus ?: "PLANNED",
                progress = book.progress ?: 0f,
                rating = rating,
                favorite = book.favorite ?: false,
                updatedAt = System.currentTimeMillis(),
            )
        )
    }

    override fun toggleFavorite(id: String) {
        val current = bookDao.isFavorite(id)
        val book = bookDao.getBook(id) ?: return
        bookDao.insertUserBook(
            com.syverro.data.local.entity.UserBookEntity(
                bookId = id,
                readingStatus = book.readingStatus ?: "PLANNED",
                progress = book.progress ?: 0f,
                rating = book.rating ?: 0f,
                favorite = !current,
                updatedAt = System.currentTimeMillis(),
            )
        )
    }

    override fun delete(id: String) {
        val book = bookDao.getBook(id) ?: return
        bookDao.deleteBook(com.syverro.data.local.entity.BookEntity(id = id, title = "", author = ""))
    }

    override fun count(): Int = bookDao.count()

    fun seedIfEmpty() {
        if (bookDao.count() == 0) {
            bookDao.insertBooks(SeedBooks.books())
            SeedBooks.userBooks().forEach { bookDao.insertUserBook(it) }
        }
    }
}
