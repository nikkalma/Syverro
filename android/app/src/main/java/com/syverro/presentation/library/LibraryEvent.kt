package com.syverro.presentation.library

import com.syverro.domain.model.Book
import com.syverro.domain.model.ReadingStatus

sealed interface LibraryEvent {
    data class SelectBook(val bookId: String) : LibraryEvent
    data class FilterByStatus(val status: ReadingStatus?) : LibraryEvent
}