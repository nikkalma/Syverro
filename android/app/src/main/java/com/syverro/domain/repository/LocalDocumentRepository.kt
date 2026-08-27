package com.syverro.domain.repository

import com.syverro.domain.model.LocalDocument

interface LocalDocumentRepository {
    fun getByBook(bookId: String): LocalDocument?

    /** Ids of books whose local file is currently available for reading. */
    fun getAvailableBookIds(): Set<String>

    fun relocate(bookId: String, sourceUri: String, localPath: String): LocalDocument?

    fun markUnavailable(bookId: String): LocalDocument?

    fun remove(bookId: String)
}
