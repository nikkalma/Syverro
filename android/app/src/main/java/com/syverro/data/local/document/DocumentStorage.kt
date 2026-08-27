package com.syverro.data.local.document

import android.content.Context
import android.net.Uri
import java.io.File
import java.io.IOException
import java.nio.file.Files
import java.nio.file.StandardCopyOption

interface DocumentStorage {

    fun destinationFor(bookId: String): File

    fun copy(uri: Uri, destination: File)

    fun promote(staged: File, destination: File): Boolean

    fun delete(path: String): Boolean

    fun exists(path: String): Boolean
}

fun atomicReplace(staged: File, destination: File): Boolean {
    val atomic = runCatching {
        Files.move(staged.toPath(), destination.toPath(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
    }
    if (atomic.isSuccess) return true
    return runCatching {
        Files.move(staged.toPath(), destination.toPath(), StandardCopyOption.REPLACE_EXISTING)
    }.isSuccess
}

class AppDocumentStorage(private val context: Context) : DocumentStorage {

    private val documentsDir = File(context.filesDir, "documents").apply { mkdirs() }

    override fun destinationFor(bookId: String): File = File(documentsDir, "$bookId.epub")

    override fun copy(uri: Uri, destination: File) {
        val input = context.contentResolver.openInputStream(uri)
            ?: throw IOException("Cannot open source: $uri")
        input.use { source ->
            destination.parentFile?.mkdirs()
            destination.outputStream().use { target -> source.copyTo(target) }
        }
    }

    override fun promote(staged: File, destination: File): Boolean = atomicReplace(staged, destination)

    override fun delete(path: String): Boolean = runCatching { File(path).delete() }.getOrDefault(false)

    override fun exists(path: String): Boolean = File(path).exists()
}
