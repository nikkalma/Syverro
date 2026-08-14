package com.syverro.presentation.bookdetail

import com.syverro.domain.model.PersonalBook

data class BookDetailUiState(
    val book: PersonalBook? = null,
    val hasActiveSession: Boolean = false,
    val showFinishConfirm: Boolean = false,
)
