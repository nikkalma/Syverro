package com.syverro.data.local.document

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import com.syverro.data.local.dao.LocalDocumentDao
import com.syverro.data.local.dao.PersonalBookDao
import com.syverro.data.local.entity.LocalDocumentEntity
import com.syverro.data.local.entity.PersonalBookEntity
import com.syverro.domain.model.Provenance
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.File
import java.io.IOException
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

sealed interface ImportResult {
    data class Success(val bookId: String, val isNewBook: Boolean) : ImportResult
    data class Error(val reason: ImportError) : ImportResult
}

enum class ImportError {
    COPY_FAILED,
    UNKNOWN,
}

interface AttachmentImporter {
    suspend fun importEpub(
        uri: Uri,
        fileName: String? = null,
        mimeType: String? = null,
        bookId: String? = null,
    ): ImportResult
}

@Singleton
class DefaultAttachmentImporter @Inject constructor(
    @ApplicationContext private val context: Context,
    private val bookDao: PersonalBookDao,
    private val documentDao: LocalDocumentDao,
    private val storage: DocumentStorage,
    private val metadataExtractor: PublicationMetadataExtractor,
) : AttachmentImporter {

    override suspend fun importEpub(
        uri: Uri,
        fileName: String?,
        mimeType: String?,
        bookId: String?,
    ): ImportResult {
        var copied: File? = null
        return try {
            val existing = bookId?.let { bookDao.getById(it) }
            val targetBookId = existing?.id ?: UUID.randomUUID().toString()
            val destination = storage.destinationFor(targetBookId)
            storage.copy(uri, destination)
            copied = destination

            val resolvedFileName = (fileName ?: queryDisplayName(uri))
                ?.trim()
                ?.takeIf { it.isNotEmpty() }
                ?: "imported.epub"
            val fallbackTitle = resolvedFileName.substringBeforeLast('.').ifBlank { "Imported book" }
            val metadata = metadataExtractor.extract(destination, fallbackTitle)
            val resolvedMimeType = mimeType?.takeIf { it.isNotBlank() }
                ?: runCatching { context.contentResolver.getType(uri) }.getOrNull()
            val now = System.currentTimeMillis()

            val book = existing ?: PersonalBookEntity(
                id = targetBookId,
                canonicalBookId = null,
                title = metadata.title,
                authorDisplay = metadata.author,
                readingStatus = "PLANNED",
                provenance = Provenance.MANUAL_TRACKED.storageValue,
                hasLocalDocument = true,
                createdAt = now,
                updatedAt = now,
            ).also { bookDao.insert(it) }

            if (existing != null) {
                bookDao.update(existing.copy(hasLocalDocument = true, updatedAt = now))
            }

            documentDao.upsert(
                LocalDocumentEntity(
                    bookId = book.id,
                    format = "EPUB",
                    fileName = resolvedFileName,
                    localPath = destination.absolutePath,
                    sourceUri = uri.toString(),
                    fileSize = destination.length().takeIf { it > 0 },
                    mimeType = resolvedMimeType,
                    isAvailable = true,
                    createdAt = now,
                ),
            )

            ImportResult.Success(book.id, isNewBook = existing == null)
        } catch (e: IOException) {
            copied?.delete()
            ImportResult.Error(ImportError.COPY_FAILED)
        } catch (e: Exception) {
            copied?.delete()
            ImportResult.Error(ImportError.UNKNOWN)
        }
    }

    private fun queryDisplayName(uri: Uri): String? = runCatching {
        context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
            if (cursor.moveToFirst() && !cursor.isNull(0)) cursor.getString(0) else null
        }
    }.getOrNull()
}
