package com.syverro.presentation.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.syverro.domain.model.ReadingStatus
import com.syverro.domain.repository.BookRepository
import com.syverro.domain.repository.SessionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val bookRepository: BookRepository,
    private val sessionRepository: SessionRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun onEvent(event: HomeEvent) {
        when (event) {
            HomeEvent.ContinueReading -> { }
            HomeEvent.ViewLibrary -> { }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            val activeSession = sessionRepository.getActive()
            val book = activeSession?.let { bookRepository.getById(it.bookId) }
            val readingBooks = bookRepository.getBooksByStatus(ReadingStatus.READING)
            val allBooks = bookRepository.getAll()
            val allSessions = sessionRepository.getAll()
            val finishedSessions = allSessions.filter { it.status.name == "FINISHED" }
            val recent = finishedSessions.sortedByDescending { it.startTime }.take(3)

            var lastDate = ""
            var lastDuration = ""
            if (recent.isNotEmpty()) {
                val s = recent.first()
                val df = SimpleDateFormat("MMM d", Locale.getDefault())
                lastDate = df.format(Date(s.startTime))
                val h = s.durationSeconds / 3600
                val m = (s.durationSeconds % 3600) / 60
                lastDuration = if (h > 0) "${h}h ${m}m" else "${m}m"
            }

            val activeElapsed = activeSession?.durationSeconds ?: 0

            _uiState.update {
                it.copy(
                    activeBook = book,
                    activeSession = activeSession,
                    recentSessions = recent,
                    booksInProgress = readingBooks.size,
                    totalBooks = allBooks.size,
                    lastSessionDate = lastDate,
                    lastSessionDuration = lastDuration,
                    activeSessionElapsed = activeElapsed,
                )
            }
        }
    }
}
