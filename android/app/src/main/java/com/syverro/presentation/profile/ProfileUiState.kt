package com.syverro.presentation.profile

data class ProfileUiState(
    val displayName: String = "Reader",
    val insight: String = "",
    val finishedBooks: Int = 0,
    val readingBooks: Int = 0,
    val totalSessions: Int = 0,
    val totalReadingTimeSeconds: Long = 0,
)