package com.syverro.domain.repository

import com.syverro.domain.model.Book

interface BookRepository {
    fun getAll(): List<Book>
    fun getById(id: String): Book?
}
