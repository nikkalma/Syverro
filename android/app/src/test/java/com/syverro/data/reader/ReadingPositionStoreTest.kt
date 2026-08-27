package com.syverro.data.reader

import com.syverro.domain.model.ReadingPosition
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ReadingPositionStoreTest {

    @Test
    fun record_debouncesAndPersistsOnlyTheLatest() = runBlocking {
        val persisted = mutableListOf<ReadingPosition>()
        val store = ReadingPositionStore(
            bookId = "book-1",
            scope = this,
            initialPercent = 0f,
            lastOpenedAt = 100L,
            debounceMillis = 30,
            persist = { persisted.add(it) },
        )

        store.record("locator-a", 0.2f)
        delay(10)
        store.record("locator-b", 0.5f)
        delay(100)

        assertEquals("only the latest record survives the debounce", 1, persisted.size)
        assertEquals("locator-b", persisted[0].locator)
        assertEquals(0.5f, persisted[0].percent, 0.001f)
        assertEquals("book-1", persisted[0].bookId)
        assertEquals("reader", persisted[0].source)
    }

    @Test
    fun record_coercesPercentIntoZeroOneRange() = runBlocking {
        val persisted = mutableListOf<ReadingPosition>()
        val store = ReadingPositionStore(
            bookId = "book-1",
            scope = this,
            initialPercent = 0f,
            debounceMillis = 30,
            persist = { persisted.add(it) },
        )

        store.record("locator-over", 1.7f)
        store.flush()
        store.record("locator-under", -0.3f)
        store.flush()

        assertEquals(2, persisted.size)
        assertEquals(1.0f, persisted[0].percent, 0.001f)
        assertEquals(0.0f, persisted[1].percent, 0.001f)
    }

    @Test
    fun flush_persistsImmediatelyAndDoesNotDuplicate() = runBlocking {
        val persisted = mutableListOf<ReadingPosition>()
        val store = ReadingPositionStore(
            bookId = "book-1",
            scope = this,
            initialPercent = 0.1f,
            debounceMillis = 60_000,
            persist = { persisted.add(it) },
        )

        store.record("locator-x", 0.6f)
        store.flush()
        store.flush()

        assertEquals(1, persisted.size)
        assertEquals("locator-x", persisted[0].locator)
        assertEquals(0.6f, persisted[0].percent, 0.001f)
    }

    @Test
    fun flushWithoutRecords_persistsNothing() = runBlocking {
        var persisted = 0
        val store = ReadingPositionStore(
            bookId = "book-1",
            scope = this,
            persist = { persisted++ },
        )

        store.flush()
        store.flush()

        assertEquals(0, persisted)
    }

    @Test
    fun flushAfterDebounceCancelsPendingJob() = runBlocking {
        val persisted = mutableListOf<ReadingPosition>()
        val store = ReadingPositionStore(
            bookId = "book-1",
            scope = this,
            debounceMillis = 30,
            persist = { persisted.add(it) },
        )

        store.record("locator-z", 0.9f)
        store.flush()
        delay(100)

        assertEquals("a manual flush must cancel the pending debounce", 1, persisted.size)
    }
}
