package com.syverro.presentation.bookdetail

import com.syverro.domain.model.Book

data class BookDetailUiState(
    val book: Book? = null,
    val hasActiveSession: Boolean = false,
    val showFinishConfirm: Boolean = false,
)
