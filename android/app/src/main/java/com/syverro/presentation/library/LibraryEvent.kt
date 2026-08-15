package com.syverro.presentation.library

import android.net.Uri
import com.syverro.domain.model.Book
import com.syverro.domain.model.ReadingStatus

sealed interface LibraryEvent {
    data class SelectBook(val bookId: String) : LibraryEvent
    data class FilterByStatus(val status: ReadingStatus?) : LibraryEvent
    data class ImportEpub(val uri: Uri) : LibraryEvent
}