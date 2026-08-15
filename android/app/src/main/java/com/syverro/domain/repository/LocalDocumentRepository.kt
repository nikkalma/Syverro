package com.syverro.domain.repository

import com.syverro.domain.model.LocalDocument

interface LocalDocumentRepository {
    fun getByBook(bookId: String): LocalDocument?

    fun relocate(bookId: String, sourceUri: String, localPath: String): LocalDocument?

    fun markUnavailable(bookId: String): LocalDocument?

    fun remove(bookId: String)
}
