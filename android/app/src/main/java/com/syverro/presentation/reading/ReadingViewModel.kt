package com.syverro.presentation.reading

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject

@HiltViewModel
class ReadingViewModel @Inject constructor(
    private val personalBookRepository: PersonalBookRepository,
    private val sessionRepository: SessionRepository,
    private val localDocumentRepository: LocalDocumentRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(ReadingUiState())
    val uiState: StateFlow<ReadingUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            val activeSession = sessionRepository.getActive()
            val activeBook = activeSession?.let { personalBookRepository.getById(it.personalBookId) }
                ?: personalBookRepository.getByStatus(ReadingStatus.READING).firstOrNull()

            val document = activeBook?.let { localDocumentRepository.getByBook(it.id) }
            val documentAvailable = activeBook != null && document?.isAvailable == true

            val readingBooks = personalBookRepository.getByStatus(ReadingStatus.READING)
            val allBooks = personalBookRepository.getAll()
            val finishedSessions = sessionRepository.getAll().filter { it.status.name == "FINISHED" }
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

            _uiState.update {
                it.copy(
                    activeBook = activeBook,
                    activeSession = activeSession,
                    documentAvailable = documentAvailable,
                    recentSessions = recent,
                    booksInProgress = readingBooks.size,
                    totalBooks = allBooks.size,
                    lastSessionDate = lastDate,
                    lastSessionDuration = lastDuration,
                    activeSessionElapsed = activeSession?.durationSeconds ?: 0,
                )
            }
        }
    }
}
