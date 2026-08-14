package com.syverro.data.repository

import com.syverro.domain.model.Book
import com.syverro.domain.model.ReadingStatus
import com.syverro.domain.repository.BookRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class InMemoryBookRepository @Inject constructor() : BookRepository {

    private val books = mutableListOf(
        Book("1", "The Shadow of the Wind", "Carlos Ruiz Zafón", readingStatus = ReadingStatus.READING),
        Book("2", "Piranesi", "Susanna Clarke", readingStatus = ReadingStatus.READING),
        Book("3", "Circe", "Madeline Miller", readingStatus = ReadingStatus.PLANNED),
        Book("4", "The Left Hand of Darkness", "Ursula K. Le Guin", readingStatus = ReadingStatus.PLANNED),
        Book("5", "A Psalm for the Wild-Built", "Becky Chambers", readingStatus = ReadingStatus.FINISHED),
        Book("6", "Klara and the Sun", "Kazuo Ishiguro", readingStatus = ReadingStatus.PLANNED),
        Book("7", "The Buried Giant", "Kazuo Ishiguro", readingStatus = ReadingStatus.PLANNED),
        Book("8", "Pachinko", "Min Jin Lee", readingStatus = ReadingStatus.FINISHED),
        Book("9", "The Overstory", "Richard Powers", readingStatus = ReadingStatus.PLANNED),
        Book("10", "Station Eleven", "Emily St. John Mandel", readingStatus = ReadingStatus.PLANNED),
        Book("11", "The Name of the Wind", "Patrick Rothfuss", readingStatus = ReadingStatus.PLANNED),
        Book("12", "Jonathan Strange & Mr Norrell", "Susanna Clarke", readingStatus = ReadingStatus.FINISHED),
    )

    override fun getAll(): List<Book> = books.toList()

    override fun getById(id: String): Book? = books.find { it.id == id }

    override fun search(query: String): List<Book> = books.filter {
        it.title.contains(query, ignoreCase = true) || it.author.contains(query, ignoreCase = true)
    }

    override fun insert(book: Book) {
        books.add(book)
    }

    override fun insertAll(books: List<Book>) {
        this.books.addAll(books)
    }

    override fun update(book: Book) {
        val index = books.indexOfFirst { it.id == book.id }
        if (index >= 0) books[index] = book
    }

    override fun updateStatus(id: String, status: ReadingStatus) {
        val index = books.indexOfFirst { it.id == id }
        if (index >= 0) {
            books[index] = books[index].copy(readingStatus = status)
        }
    }

    override fun updateProgress(id: String, progress: Float) {
        val index = books.indexOfFirst { it.id == id }
        if (index >= 0) {
            books[index] = books[index].copy(progress = progress)
        }
    }

    override fun updateRating(id: String, rating: Float) {
        val index = books.indexOfFirst { it.id == id }
        if (index >= 0) {
            books[index] = books[index].copy(rating = rating)
        }
    }

    override fun toggleFavorite(id: String) {
        val index = books.indexOfFirst { it.id == id }
        if (index >= 0) {
            books[index] = books[index].copy(favorite = !books[index].favorite)
        }
    }

    override fun delete(id: String) {
        books.removeAll { it.id == id }
    }

    override fun count(): Int = books.size

    override fun getBooksByStatus(status: ReadingStatus): List<Book> =
        books.filter { it.readingStatus == status }
}