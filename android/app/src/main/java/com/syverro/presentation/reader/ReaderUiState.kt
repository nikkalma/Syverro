package com.syverro.presentation.reader

import com.syverro.data.reader.ReaderUnavailableReason
import com.syverro.domain.model.PersonalBook
import org.readium.r2.shared.publication.Locator
import org.readium.r2.shared.publication.Publication

sealed interface ReaderUiState {
    data object Loading : ReaderUiState

    data class Ready(
        val book: PersonalBook,
        val publication: Publication,
        val initialLocator: Locator?,
    ) : ReaderUiState

    data class Error(
        val reason: ReaderUnavailableReason,
        val bookTitle: String? = null,
    ) : ReaderUiState
}
