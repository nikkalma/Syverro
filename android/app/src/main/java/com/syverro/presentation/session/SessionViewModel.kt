package com.syverro.presentation.session

import android.os.SystemClock
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.syverro.domain.model.ReadingStatus
import com.syverro.domain.model.SessionStatus
import com.syverro.domain.repository.BookRepository
import com.syverro.domain.repository.SessionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

@HiltViewModel
class SessionViewModel @Inject constructor(
    private val bookRepository: BookRepository,
    private val sessionRepository: SessionRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(SessionUiState())
    val uiState: StateFlow<SessionUiState> = _uiState.asStateFlow()

    private var currentSessionId: String? = null
    private var sessionStartWallTime: Long = 0L
    private var accumulatedSeconds: Long = 0L
    private var tickerJob: Job? = null

    init {
        restoreActiveSession()
    }

    private fun restoreActiveSession() {
        viewModelScope.launch {
            val activeSession = sessionRepository.getActive()
            if (activeSession != null) {
                val book = bookRepository.getById(activeSession.bookId)
                currentSessionId = activeSession.id
                accumulatedSeconds = activeSession.durationSeconds
                _uiState.update {
                    it.copy(
                        activeBook = book,
                        selectedBookId = activeSession.bookId,
                        elapsedSeconds = accumulatedSeconds,
                        isRunning = false,
                    )
                }
            } else {
                val readingBooks = bookRepository.getBooksByStatus(ReadingStatus.READING)
                val firstBook = readingBooks.firstOrNull()
                _uiState.update {
                    it.copy(
                        eligibleBooks = readingBooks,
                        hasReadingBooks = readingBooks.isNotEmpty(),
                        activeBook = firstBook,
                        selectedBookId = firstBook?.id,
                    )
                }
            }
        }
    }

    fun onEvent(event: SessionEvent) {
        when (event) {
            SessionEvent.StartSession -> startSession()
            SessionEvent.PauseSession -> pauseSession()
            SessionEvent.ResumeSession -> resumeSession()
            SessionEvent.FinishSession -> finishSession()
            SessionEvent.ConfirmFinish -> confirmFinish()
            SessionEvent.DismissFinish -> dismissFinish()
            SessionEvent.ShowQuoteSheet -> showQuoteSheet()
            is SessionEvent.SubmitQuote -> submitQuote(event.text)
            SessionEvent.DismissQuoteSheet -> dismissQuoteSheet()
        }
    }

    fun selectBook(bookId: String) {
        val book = bookRepository.getById(bookId)
        _uiState.update { it.copy(selectedBookId = bookId, activeBook = book) }
    }

    private fun startSession() {
        val bookId = _uiState.value.selectedBookId ?: return
        if (currentSessionId != null) return

        bookRepository.updateStatus(bookId, ReadingStatus.READING)
        sessionStartWallTime = SystemClock.elapsedRealtime()
        accumulatedSeconds = 0
        currentSessionId = sessionRepository.create(bookId, sessionStartWallTime).id
        val book = bookRepository.getById(bookId)
        _uiState.update { it.copy(isRunning = true, elapsedSeconds = 0, activeBook = book) }
        startTicker()
    }

    private fun pauseSession() {
        tickerJob?.cancel()
        tickerJob = null
        val sessionId = currentSessionId ?: return
        val elapsed = accumulatedSeconds
        val session = sessionRepository.getAll().find { it.id == sessionId }
        if (session != null) {
            sessionRepository.update(session.copy(durationSeconds = elapsed, status = SessionStatus.PAUSED))
        }
        _uiState.update { it.copy(isRunning = false) }
    }

    private fun resumeSession() {
        sessionStartWallTime = SystemClock.elapsedRealtime()
        val sessionId = currentSessionId ?: return
        val session = sessionRepository.getAll().find { it.id == sessionId }
        if (session != null) {
            sessionRepository.update(session.copy(startTime = sessionStartWallTime, status = SessionStatus.IN_PROGRESS))
        }
        _uiState.update { it.copy(isRunning = true) }
        startTicker()
    }

    private fun confirmFinish() {
        _uiState.update { it.copy(showFinishConfirm = true) }
    }

    private fun dismissFinish() {
        _uiState.update { it.copy(showFinishConfirm = false) }
    }

    private fun finishSession() {
        tickerJob?.cancel()
        tickerJob = null
        val elapsed = accumulatedSeconds
        val sessionId = currentSessionId ?: return
        val session = sessionRepository.getAll().find { it.id == sessionId }
        if (session != null) {
            sessionRepository.update(session.copy(durationSeconds = elapsed, status = SessionStatus.FINISHED))
        }
        currentSessionId = null
        accumulatedSeconds = 0

        val readingBooks = bookRepository.getBooksByStatus(ReadingStatus.READING)
        val firstBook = readingBooks.firstOrNull()
        _uiState.update {
            it.copy(
                isRunning = false,
                elapsedSeconds = 0,
                showFinishConfirm = false,
                activeBook = firstBook,
                selectedBookId = firstBook?.id,
                eligibleBooks = readingBooks,
                hasReadingBooks = readingBooks.isNotEmpty(),
                capturedQuotes = emptyList(),
            )
        }
    }

    private fun startTicker() {
        tickerJob?.cancel()
        tickerJob = viewModelScope.launch {
            while (isActive) {
                delay(1000)
                val now = SystemClock.elapsedRealtime()
                accumulatedSeconds = (now - sessionStartWallTime) / 1000
                _uiState.update { it.copy(elapsedSeconds = accumulatedSeconds) }
            }
        }
    }

    private fun showQuoteSheet() {
        _uiState.update { it.copy(showQuoteSheet = true) }
    }

    private fun dismissQuoteSheet() {
        _uiState.update { it.copy(showQuoteSheet = false, quoteText = "") }
    }

    private fun submitQuote(text: String) {
        val sessionId = currentSessionId ?: return
        if (text.isBlank()) return
        sessionRepository.addQuote(sessionId, text, System.currentTimeMillis())
        val quotes = _uiState.value.capturedQuotes + text
        _uiState.update { it.copy(capturedQuotes = quotes, showQuoteSheet = false, quoteText = "") }
    }

    override fun onCleared() {
        super.onCleared()
        tickerJob?.cancel()
    }
}
