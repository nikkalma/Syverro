package com.syverro.domain.model

data class Quote(
    val id: String,
    val sessionId: String,
    val text: String,
    val createdAt: Long,
)