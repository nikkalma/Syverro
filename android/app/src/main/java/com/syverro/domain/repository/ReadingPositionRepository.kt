package com.syverro.domain.repository

import com.syverro.domain.model.ReadingPosition

interface ReadingPositionRepository {
    fun getByBook(bookId: String): ReadingPosition?
    fun upsert(position: ReadingPosition)
}
