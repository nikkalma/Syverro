package com.syverro.domain.model

data class PersonalBook(
    val id: String,
    val canonicalBookId: String? = null,
    val title: String,
    val authorDisplay: String? = null,
    val localCoverPath: String? = null,
    val readingStatus: ReadingStatus = ReadingStatus.PLANNED,
    val progress: Float = 0f,
    val currentPage: Int? = null,
    val totalPages: Int? = null,
    val startDate: Long? = null,
    val endDate: Long? = null,
    val provenance: Provenance = Provenance.MANUAL_TRACKED,
    val hasLocalDocument: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
)
