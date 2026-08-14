package com.syverro.presentation.library

import com.syverro.domain.model.Book
import com.syverro.domain.model.ReadingStatus

data class LibraryUiState(
    val books: List<Book> = emptyList(),
    val filter: ReadingStatus? = null,
)