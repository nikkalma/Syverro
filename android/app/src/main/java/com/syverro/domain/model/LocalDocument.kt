package com.syverro.domain.model

data class LocalDocument(
    val bookId: String,
    val format: String,
    val fileName: String,
    val localPath: String,
    val sourceUri: String? = null,
    val fileSize: Long? = null,
    val mimeType: String? = null,
    val isAvailable: Boolean = true,
    val createdAt: Long,
)
