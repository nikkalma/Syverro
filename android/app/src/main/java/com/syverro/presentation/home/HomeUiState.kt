package com.syverro.presentation.home

import com.syverro.domain.model.Book
import com.syverro.domain.model.ReadingSession

data class HomeUiState(
    val activeBook: Book? = null,
    val activeSession: ReadingSession? = null,
    val recentSessions: List<ReadingSession> = emptyList(),
    val booksInProgress: Int = 0,
    val totalBooks: Int = 0,
    val lastSessionDate: String = "",
    val lastSessionDuration: String = "",
    val activeSessionElapsed: Long = 0,
) {
    val hasRecentActivity: Boolean get() = recentSessions.isNotEmpty()
}
