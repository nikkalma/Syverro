package com.syverro.presentation.bookdetail

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.syverro.data.local.document.AttachmentImporter
import com.syverro.data.local.document.ImportResult
import com.syverro.domain.model.ReadingStatus
import com.syverro.domain.repository.LocalDocumentRepository
import com.syverro.domain.repository.PersonalBookRepository
import com.syverro.domain.repository.SessionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class BookDetailViewModel @Inject constructor(
    private val personalBookRepository: PersonalBookRepository,
    private val localDocumentRepository: LocalDocumentRepository,
    private val sessionRepository: SessionRepository,
    private val attachmentImporter: AttachmentImporter,
) : ViewModel() {

    private val _uiState = MutableStateFlow(BookDetailUiState())
    val uiState: StateFlow<BookDetailUiState> = _uiState.asStateFlow()

    fun loadBook(bookId: String) {
        viewModelScope.launch {
            val book = personalBookRepository.getById(bookId)
            val hasActive = sessionRepository.getActive()?.personalBookId == bookId
            val documentAvailable = book != null &&
                localDocumentRepository.getByBook(bookId)?.isAvailable == true
            _uiState.update {
                it.copy(
                    book = book,
                    hasActiveSession = hasActive,
                    documentAvailable = documentAvailable,
                )
            }
        }
    }

    fun startReading() {
        val book = _uiState.value.book ?: return
        personalBookRepository.updateStatus(book.id, ReadingStatus.READING)
        _uiState.update { it.copy(hasActiveSession = true) }
    }

    /** Re-attaches an EPUB to this book (import into the existing personal book). */
    fun importEpub(uri: Uri) {
        val book = _uiState.value.book ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isImporting = true, importError = false) }
            val result = attachmentImporter.importEpub(uri, bookId = book.id)
            _uiState.update { it.copy(isImporting = false) }
            when (result) {
                is ImportResult.Success -> loadBook(book.id)
                is ImportResult.Error -> _uiState.update { it.copy(importError = true) }
            }
        }
    }

    fun startFinishConfirm() {
        _uiState.update { it.copy(showFinishConfirm = true) }
    }

    fun dismissFinishConfirm() {
        _uiState.update { it.copy(showFinishConfirm = false) }
    }

    fun markFinished() {
        val book = _uiState.value.book ?: return
        personalBookRepository.updateStatus(book.id, ReadingStatus.FINISHED)
        val activeSession = sessionRepository.getActive()
        if (activeSession?.personalBookId == book.id) {
            sessionRepository.update(activeSession.copy(status = com.syverro.domain.model.SessionStatus.FINISHED))
        }
        _uiState.update { it.copy(hasActiveSession = false, showFinishConfirm = false) }
    }
}
