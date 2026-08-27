package com.syverro.presentation.reading

import com.syverro.domain.model.PersonalBook
import com.syverro.domain.model.ReadingSession

data class ReadingUiState(
    val activeBook: PersonalBook? = null,
    val activeSession: ReadingSession? = null,
    val documentAvailable: Boolean = false,
    val recentSessions: List<ReadingSession> = emptyList(),
    val booksInProgress: Int = 0,
    val totalBooks: Int = 0,
    val lastSessionDate: String = "",
    val lastSessionDuration: String = "",
    val activeSessionElapsed: Long = 0,
) {
    val hasRecentActivity: Boolean get() = recentSessions.isNotEmpty()

    /** Displayed as a whole-number percentage for the currently reading book. */
    val progressPercent: Int get() = ((activeBook?.progress ?: 0f) * 100).toInt().coerceIn(0, 100)
}
