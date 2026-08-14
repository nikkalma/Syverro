package com.syverro.domain.repository

import com.syverro.domain.model.Book
import com.syverro.domain.model.ReadingStatus

interface BookRepository {
    fun getAll(): List<Book>
    fun getById(id: String): Book?
    fun getBooksByStatus(status: ReadingStatus): List<Book>
    fun search(query: String): List<Book>
    fun insert(book: Book)
    fun insertAll(books: List<Book>)
    fun update(book: Book)
    fun updateStatus(id: String, status: ReadingStatus)
    fun updateProgress(id: String, progress: Float)
    fun toggleFavorite(id: String)
    fun delete(id: String)
    fun count(): Int
}
