package com.syverro.presentation.session

import com.syverro.domain.model.PersonalBook

data class SessionUiState(
    val activeBook: PersonalBook? = null,
    val selectedBookId: String? = null,
    val hasReadingBooks: Boolean = false,
    val eligibleBooks: List<PersonalBook> = emptyList(),
    val showBookSelector: Boolean = false,
    val elapsedSeconds: Long = 0,
    val isRunning: Boolean = false,
    val showQuoteSheet: Boolean = false,
    val quoteText: String = "",
    val capturedQuotes: List<String> = emptyList(),
    val showFinishConfirm: Boolean = false,
)
