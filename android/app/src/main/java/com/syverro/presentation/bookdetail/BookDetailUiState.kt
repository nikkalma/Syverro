package com.syverro.presentation.bookdetail

import com.syverro.domain.model.PersonalBook

data class BookDetailUiState(
    val book: PersonalBook? = null,
    val hasActiveSession: Boolean = false,
    val showFinishConfirm: Boolean = false,
    /** Whether an EPUB file is currently attached and readable for this book. */
    val documentAvailable: Boolean = false,
    val isImporting: Boolean = false,
    val importError: Boolean = false,
)
