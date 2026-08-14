package com.syverro.presentation.session

import com.syverro.domain.model.Book

data class SessionUiState(
    val activeBook: Book? = null,
    val selectedBookId: String? = null,
    val hasReadingBooks: Boolean = false,
    val eligibleBooks: List<Book> = emptyList(),
    val showBookSelector: Boolean = false,
    val elapsedSeconds: Long = 0,
    val isRunning: Boolean = false,
    val showQuoteSheet: Boolean = false,
    val quoteText: String = "",
    val capturedQuotes: List<String> = emptyList(),
    val showFinishConfirm: Boolean = false,
)
