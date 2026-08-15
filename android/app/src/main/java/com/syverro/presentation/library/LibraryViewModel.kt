package com.syverro.presentation.library

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.syverro.data.local.document.AttachmentImporter
import com.syverro.data.local.document.ImportResult
import com.syverro.domain.model.ReadingStatus
import com.syverro.domain.repository.PersonalBookRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LibraryViewModel @Inject constructor(
    private val personalBookRepository: PersonalBookRepository,
    private val attachmentImporter: AttachmentImporter,
) : ViewModel() {

    private val _uiState = MutableStateFlow(LibraryUiState())
    val uiState: StateFlow<LibraryUiState> = _uiState.asStateFlow()

    init {
        loadBooks()
    }

    fun onEvent(event: LibraryEvent) {
        when (event) {
            is LibraryEvent.SelectBook -> { /* navigation handled by Screen */ }
            is LibraryEvent.FilterByStatus -> {
                loadBooks(event.status)
            }
            is LibraryEvent.ImportEpub -> {
                importEpub(event.uri)
            }
        }
    }

    private fun importEpub(uri: Uri) {
        viewModelScope.launch {
            _uiState.update { it.copy(isImporting = true, importError = false) }
            when (val result = attachmentImporter.importEpub(uri)) {
                is ImportResult.Success -> loadBooks()
                is ImportResult.Error -> _uiState.update { it.copy(importError = true) }
            }
            _uiState.update { it.copy(isImporting = false) }
        }
    }

    private fun loadBooks(filter: ReadingStatus? = null) {
        viewModelScope.launch {
            val books = if (filter == null) {
                personalBookRepository.getAll()
            } else {
                personalBookRepository.getByStatus(filter)
            }
            _uiState.update { it.copy(books = books, filter = filter) }
        }
    }
}