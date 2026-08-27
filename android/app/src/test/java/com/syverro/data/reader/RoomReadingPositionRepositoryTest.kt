package com.syverro.data.reader

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.syverro.data.local.database.SyverroDatabase
import com.syverro.data.local.entity.PersonalBookEntity
import com.syverro.data.repository.RoomReadingPositionRepository
import com.syverro.domain.model.ReadingPosition
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class RoomReadingPositionRepositoryTest {

    private lateinit var db: SyverroDatabase
    private lateinit var repository: RoomReadingPositionRepository

    @Before
    fun setUp() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        db = Room.inMemoryDatabaseBuilder(context, SyverroDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        repository = RoomReadingPositionRepository(db.readingPositionDao())
    }

    @After
    fun tearDown() {
        db.close()
    }

    private fun insertBook(id: String) {
        db.personalBookDao().insert(
            PersonalBookEntity(id = id, title = "Book $id", createdAt = 0L, updatedAt = 0L),
        )
    }

    @Test
    fun getByBook_returnsNull_whenNeverSaved() {
        assertNull(repository.getByBook("book-missing"))
    }

    @Test
    fun upsertThenGet_roundTripsAllFields() {
        insertBook("book-1")
        val position = ReadingPosition(
            bookId = "book-1",
            locator = "{\"href\":\"chap1.xhtml\"}",
            percent = 0.42f,
            lastOpenedAt = 111L,
            updatedAt = 222L,
            source = "reader",
        )

        repository.upsert(position)

        val loaded = repository.getByBook("book-1")
        assertEquals("book-1", loaded!!.bookId)
        assertEquals(position.locator, loaded.locator)
        assertEquals(0.42f, loaded.percent, 0.001f)
        assertEquals(111L, loaded.lastOpenedAt)
        assertEquals(222L, loaded.updatedAt)
        assertEquals("reader", loaded.source)
    }

    @Test
    fun upsertTwice_replacesPreviousPosition() {
        insertBook("book-1")
        repository.upsert(ReadingPosition(bookId = "book-1", locator = "first", percent = 0.1f, updatedAt = 100L))
        repository.upsert(ReadingPosition(bookId = "book-1", locator = "second", percent = 0.9f, updatedAt = 200L))

        val loaded = repository.getByBook("book-1")!!
        assertEquals("second", loaded.locator)
        assertEquals(0.9f, loaded.percent, 0.001f)
        assertEquals(200L, loaded.updatedAt)
    }

    @Test
    fun upsertTwoBooks_keepsPositionsIndependent() {
        insertBook("book-1")
        insertBook("book-2")
        repository.upsert(ReadingPosition(bookId = "book-1", locator = "a", percent = 0.1f, updatedAt = 100L))
        repository.upsert(ReadingPosition(bookId = "book-2", locator = "b", percent = 0.2f, updatedAt = 200L))

        assertEquals("a", repository.getByBook("book-1")!!.locator)
        assertEquals("b", repository.getByBook("book-2")!!.locator)
    }
}
