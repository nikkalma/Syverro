package com.syverro.domain.repository

import com.syverro.domain.model.PersonalBook
import com.syverro.domain.model.ReadingStatus

interface PersonalBookRepository {
    fun getAll(): List<PersonalBook>
    fun getById(id: String): PersonalBook?
    fun getByStatus(status: ReadingStatus): List<PersonalBook>
    fun search(query: String): List<PersonalBook>
    fun insert(book: PersonalBook)
    fun updateStatus(id: String, status: ReadingStatus)
    fun updateProgress(id: String, progress: Float)
    fun reconcileCanonical(id: String, canonicalBookId: String)
    fun delete(id: String)
}
