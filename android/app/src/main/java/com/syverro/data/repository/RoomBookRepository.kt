package com.syverro.data.repository

import com.syverro.data.local.dao.BookDao
import com.syverro.data.local.mapper.BookMapper
import com.syverro.domain.model.Book
import com.syverro.domain.repository.BookRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RoomBookRepository @Inject constructor(
    private val bookDao: BookDao,
) : BookRepository {

    override fun getAll(): List<Book> {
        return bookDao.getAll().map(BookMapper::toDomain)
    }

    override fun getById(id: String): Book? {
        return bookDao.getById(id)?.let(BookMapper::toDomain)
    }
}
