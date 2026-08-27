package com.syverro.presentation.reader

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.syverro.data.reader.ReaderSession
import com.syverro.data.reader.ReaderSessionState
import com.syverro.data.reader.ReadingPositionStore
import com.syverro.domain.model.ReadingPosition
import com.syverro.domain.repository.PersonalBookRepository
import com.syverro.domain.repository.ReadingPositionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.readium.r2.shared.publication.Locator
import javax.inject.Inject

@HiltViewModel
class ReaderViewModel @Inject constructor(
    private val readerSession: ReaderSession,
    private val readingPositionRepository: ReadingPositionRepository,
    private val personalBookRepository: PersonalBookRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<ReaderUiState>(ReaderUiState.Loading)
    val uiState: StateFlow<ReaderUiState> = _uiState.asStateFlow()

    private var store: ReadingPositionStore? = null

    fun open(bookId: String) {
        _uiState.value = ReaderUiState.Loading
        viewModelScope.launch {
            when (val result = readerSession.open(bookId)) {
                is ReaderSessionState.Ready -> {
                    recordOpen(result)
                    _uiState.value = ReaderUiState.Ready(
                        book = result.book,
                        publication = result.publication,
                        initialLocator = result.initialLocator,
                    )
                }
                is ReaderSessionState.Unavailable -> {
                    _uiState.value = ReaderUiState.Error(reason = result.reason)
                }
            }
        }
    }

    /** Called by the navigator host whenever the current location changes. */
    fun onLocator(locator: Locator) {
        store?.record(readerSession.encode(locator), readerSession.percentOf(locator))
    }

    /** Persists any pending location immediately. Called at lifecycle-safe moments. */
    fun flush() {
        viewModelScope.launch { store?.flush() }
    }

    override fun onCleared() {
        readerSession.close()
        super.onCleared()
    }

    private fun recordOpen(result: ReaderSessionState.Ready) {
        val now = System.currentTimeMillis()
        readingPositionRepository.upsert(
            ReadingPosition(
                bookId = result.book.id,
                locator = result.initialLocator?.let { readerSession.encode(it) },
                percent = result.storedPercent ?: 0f,
                lastOpenedAt = now,
                updatedAt = now,
                source = "reader",
            ),
        )
        store = ReadingPositionStore(
            bookId = result.book.id,
            scope = viewModelScope,
            initialPercent = result.storedPercent ?: 0f,
            lastOpenedAt = now,
        ) { position ->
            readingPositionRepository.upsert(position)
            personalBookRepository.updateProgress(position.bookId, position.percent)
        }
    }
}
