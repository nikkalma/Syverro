package com.syverro.data.repository

import com.syverro.data.local.dao.LocalDocumentDao
import com.syverro.data.local.dao.PersonalBookDao
import com.syverro.data.local.entity.LocalDocumentEntity
import com.syverro.domain.model.LocalDocument
import com.syverro.domain.repository.LocalDocumentRepository
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RoomLocalDocumentRepository @Inject constructor(
    private val dao: LocalDocumentDao,
    private val bookDao: PersonalBookDao,
) : LocalDocumentRepository {

    override fun getByBook(bookId: String): LocalDocument? {
        val current = dao.getByBook(bookId) ?: return null
        if (current.isAvailable && current.localPath.isNotBlank() && !File(current.localPath).exists()) {
            val unavailable = current.copy(isAvailable = false)
            dao.upsert(unavailable)
            return unavailable.toDomain()
        }
        return current.toDomain()
    }

    override fun getAvailableBookIds(): Set<String> =
        dao.getAvailableBookIds()
            .asSequence()
            .mapNotNull { id -> getByBook(id)?.takeIf { it.isAvailable }?.bookId }
            .toSet()

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
        bookDao.getById(bookId)?.let { book ->
            bookDao.update(book.copy(hasLocalDocument = false, updatedAt = System.currentTimeMillis()))
        }
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
