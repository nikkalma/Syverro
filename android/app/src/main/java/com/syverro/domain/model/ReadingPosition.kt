package com.syverro.domain.model

/**
 * Persisted reading position for a personal book.
 *
 * [locator] is an opaque serialized Readium locator owned by the reader. [percent] is the
 * publication progression (0..1) reported by the reader, and is the authoritative progress value.
 */
data class ReadingPosition(
    val bookId: String,
    val locator: String? = null,
    val percent: Float = 0f,
    val lastOpenedAt: Long? = null,
    val updatedAt: Long,
    val source: String = "reader",
)
