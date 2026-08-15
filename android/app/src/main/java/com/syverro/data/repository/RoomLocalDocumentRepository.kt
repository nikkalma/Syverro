package com.syverro.data.repository

import com.syverro.data.local.dao.LocalDocumentDao
import com.syverro.data.local.entity.LocalDocumentEntity
import com.syverro.domain.model.LocalDocument
import com.syverro.domain.repository.LocalDocumentRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RoomLocalDocumentRepository @Inject constructor(
    private val dao: LocalDocumentDao,
) : LocalDocumentRepository {

    override fun getByBook(bookId: String): LocalDocument? {
        return dao.getByBook(bookId)?.toDomain()
    }

    override fun relocate(bookId: String, sourceUri: String, localPath: String): LocalDocument? {
        val current = dao.getByBook(bookId) ?: return null
        val updated = current.copy(sourceUri = sourceUri, localPath = localPath, isAvailable = true)
        dao.upsert(updated)
        return updated.toDomain()
    }

    override fun markUnavailable(bookId: String): LocalDocument? {
        val current = dao.getByBook(bookId) ?: return null
        val updated = current.copy(isAvailable = false)
        dao.upsert(updated)
        return updated.toDomain()
    }

    override fun remove(bookId: String) {
        dao.deleteByBook(bookId)
    }
}

private fun LocalDocumentEntity.toDomain(): LocalDocument = LocalDocument(
    bookId = bookId,
    format = format,
    fileName = fileName,
    localPath = localPath,
    sourceUri = sourceUri,
    fileSize = fileSize,
    mimeType = mimeType,
    isAvailable = isAvailable,
    createdAt = createdAt,
)
