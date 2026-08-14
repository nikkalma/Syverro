package com.syverro.domain.model

data class Quote(
    val id: String,
    val personalBookId: String,
    val syncId: String,
    val sessionId: String? = null,
    val text: String,
    val locator: String? = null,
    val page: Int? = null,
    val note: String? = null,
    val provenance: Provenance = Provenance.READER_OBSERVED,
    val createdAt: Long,
)
