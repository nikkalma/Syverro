package com.syverro.domain.model

data class UserProfile(
    val name: String,
    val booksRead: Int,
    val finishedBooks: Int,
    val totalReadingTimeSeconds: Long,
    val insight: String = "",
)