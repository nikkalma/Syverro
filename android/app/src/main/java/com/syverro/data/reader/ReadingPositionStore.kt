package com.syverro.data.reader

import com.syverro.domain.model.ReadingPosition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Throttles reading-position persistence for a single book.
 *
 * Navigator location updates are reported frequently while reading; this store coalesces them with
 * a debounce and exposes a synchronous [flush] used at lifecycle-safe moments (pause/stop/close).
 */
class ReadingPositionStore(
    private val bookId: String,
    private val scope: CoroutineScope,
    private val initialPercent: Float = 0f,
    private val lastOpenedAt: Long? = null,
    private val debounceMillis: Long = 1000L,
    private val now: () -> Long = System::currentTimeMillis,
    private val persist: suspend (ReadingPosition) -> Unit,
) {
    private var latestLocator: String? = null
    private var latestPercent: Float = initialPercent
    private var dirty = false
    private var debounceJob: Job? = null

    fun record(locatorJson: String?, percent: Float?) {
        if (locatorJson != null) latestLocator = locatorJson
        if (percent != null) latestPercent = percent.coerceIn(0f, 1f)
        dirty = true
        debounceJob?.cancel()
        debounceJob = scope.launch {
            delay(debounceMillis)
            flush()
        }
    }

    suspend fun flush() {
        debounceJob?.cancel()
        debounceJob = null
        if (!dirty) return
        dirty = false
        persist(
            ReadingPosition(
                bookId = bookId,
                locator = latestLocator,
                percent = latestPercent,
                lastOpenedAt = lastOpenedAt,
                updatedAt = now(),
                source = SOURCE_READER,
            ),
        )
    }

    private companion object {
        const val SOURCE_READER = "reader"
    }
}
