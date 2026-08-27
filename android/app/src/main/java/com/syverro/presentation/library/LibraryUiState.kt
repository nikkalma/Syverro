package com.syverro.presentation.library

import com.syverro.domain.model.PersonalBook
import com.syverro.domain.model.ReadingStatus

data class LibraryUiState(
    val books: List<PersonalBook> = emptyList(),
    val filter: ReadingStatus? = null,
    val isImporting: Boolean = false,
    val importError: Boolean = false,
    /** Ids of books with an available local EPUB; these open the reader directly. */
    val availableBookIds: Set<String> = emptySet(),
)
