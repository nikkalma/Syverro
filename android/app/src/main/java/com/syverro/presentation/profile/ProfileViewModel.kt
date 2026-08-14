package com.syverro.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.syverro.domain.model.ReadingStatus
import com.syverro.domain.model.SessionStatus
import com.syverro.domain.repository.PersonalBookRepository
import com.syverro.domain.repository.ProfileRepository
import com.syverro.domain.repository.SessionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val profileRepository: ProfileRepository,
    private val personalBookRepository: PersonalBookRepository,
    private val sessionRepository: SessionRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun onEvent(event: ProfileEvent) {
        when (event) {
            ProfileEvent.OpenSettings -> { /* navigation handled by Screen */ }
            is ProfileEvent.UpdateName -> updateName(event.name)
        }
    }

    fun refresh() {
        viewModelScope.launch {
            val profile = profileRepository.getProfile()
            val finished = personalBookRepository.getByStatus(ReadingStatus.FINISHED)
            val reading = personalBookRepository.getByStatus(ReadingStatus.READING)
            val allSessions = sessionRepository.getAll()
            val allBooks = personalBookRepository.getAll()
            val readingBooks = reading.size
            val finishedBooks = finished.size
            val booksRead = allBooks.size - personalBookRepository.getByStatus(ReadingStatus.PLANNED).size
            val totalReadingTimeSeconds = allSessions.sumOf { it.durationSeconds }

            val insight = generateInsight(booksRead, finishedBooks, totalReadingTimeSeconds)

            _uiState.update {
                it.copy(
                    displayName = profile.name,
                    insight = insight,
                    finishedBooks = finishedBooks,
                    readingBooks = readingBooks,
                    totalSessions = allSessions.size,
                    totalReadingTimeSeconds = totalReadingTimeSeconds,
                )
            }
        }
    }

    private fun generateInsight(booksRead: Int, finishedBooks: Int, totalSeconds: Long): String {
        if (booksRead == 0) return "You haven't started reading yet. Open a book and begin."
        if (totalSeconds < 3600) return "You're just getting started. Every page adds to your story."
        val hours = totalSeconds / 3600
        return when {
            hours < 5 -> "You usually read in short bursts. A quiet corner and a few minutes is all you need."
            finishedBooks >= 2 -> "You have a habit of finishing what you start. A deliberate reader."
            else -> "You read with intention. Let the rhythm carry you."
        }
    }

    private fun updateName(name: String) {
        profileRepository.updateName(name)
        _uiState.update { it.copy(displayName = name) }
    }
}