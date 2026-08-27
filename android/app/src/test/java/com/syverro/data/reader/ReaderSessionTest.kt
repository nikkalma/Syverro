package com.syverro.data.reader

import com.syverro.domain.model.LocalDocument
import com.syverro.domain.model.PersonalBook
import com.syverro.domain.model.ReadingPosition
import com.syverro.domain.model.ReadingStatus
import com.syverro.domain.repository.LocalDocumentRepository
import com.syverro.domain.repository.PersonalBookRepository
import com.syverro.domain.repository.ReadingPositionRepository
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.readium.r2.shared.publication.Link
import org.readium.r2.shared.publication.Locator
import org.readium.r2.shared.publication.LocalizedString
import org.readium.r2.shared.publication.Manifest
import org.readium.r2.shared.publication.Metadata
import org.readium.r2.shared.publication.Publication
import org.readium.r2.shared.util.Url
import org.readium.r2.shared.util.data.EmptyContainer
import org.readium.r2.shared.util.mediatype.MediaType
import java.io.File

@RunWith(RobolectricTestRunner::class)
class ReaderSessionTest {

    private val bookId = "book-1"
    private val book = PersonalBook(
        id = bookId,
        title = "Title",
        authorDisplay = "Author",
        readingStatus = ReadingStatus.READING,
        hasLocalDocument = true,
    )

    private val chap1 = Link(href = Url("chap1.xhtml")!!, mediaType = MediaType.XHTML)

    private val publication: Publication = Publication.Builder(
        manifest = Manifest(
            metadata = Metadata(localizedTitle = LocalizedString("Title")),
            links = listOf(chap1),
            readingOrder = listOf(chap1),
        ),
        container = EmptyContainer(),
        servicesBuilder = Publication.ServicesBuilder(),
    ).build()

    private val validLocator = Locator(
        href = Url("chap1.xhtml")!!,
        mediaType = MediaType.XHTML,
        locations = Locator.Locations(totalProgression = 0.4),
    )

    private lateinit var existingFile: File

    @Before
    fun setUp() {
        existingFile = File.createTempFile("syverro-test", ".epub")
    }

    private val availableDocument: LocalDocument
        get() = LocalDocument(
            bookId = bookId,
            format = "EPUB",
            fileName = "book.epub",
            localPath = existingFile.absolutePath,
            isAvailable = true,
            createdAt = 0L,
        )

    private fun session(
        books: Map<String, PersonalBook> = mapOf(bookId to book),
        docs: Map<String, LocalDocument> = mapOf(bookId to availableDocument),
        stored: ReadingPosition? = null,
        fetchResult: Result<Publication> = Result.success(publication),
        codec: FakeLocatorCodec = FakeLocatorCodec(),
    ): ReadiumReaderSession {
        val booksRepo = FakePersonalBookRepository(books)
        val docsRepo = FakeLocalDocumentRepository(docs)
        val positionsRepo = FakeReadingPositionRepository(stored)
        return ReadiumReaderSession(booksRepo, docsRepo, positionsRepo, FakePublicationFetcher(fetchResult), codec)
    }

    private fun open(session: ReadiumReaderSession): ReaderSessionState = runBlocking { session.open(bookId) }

    private fun unavailable(reason: ReaderUnavailableReason) = ReaderSessionState.Unavailable(reason)

    @Test
    fun open_returnsBookNotFound_whenBookMissing() {
        val result = open(session(books = emptyMap()))
        assertEquals(unavailable(ReaderUnavailableReason.BOOK_NOT_FOUND), result)
    }

    @Test
    fun open_returnsNoDocument_whenNoAttachment() {
        val result = open(session(docs = emptyMap()))
        assertEquals(unavailable(ReaderUnavailableReason.NO_DOCUMENT), result)
    }

    @Test
    fun open_returnsDocumentUnavailable_whenAvailabilityFlagFalse() {
        val unavailableDoc = availableDocument.copy(isAvailable = false)
        val result = open(session(docs = mapOf(bookId to unavailableDoc)))
        assertEquals(unavailable(ReaderUnavailableReason.DOCUMENT_UNAVAILABLE), result)
    }

    @Test
    fun open_returnsUnsupportedFormat_whenDocumentIsNotEpub() {
        val pdfDoc = availableDocument.copy(format = "PDF")
        val result = open(session(docs = mapOf(bookId to pdfDoc)))
        assertEquals(unavailable(ReaderUnavailableReason.UNSUPPORTED_FORMAT), result)
    }

    @Test
    fun open_returnsFileMissing_whenLocalFileDoesNotExist() {
        val goneDoc = availableDocument.copy(localPath = File(System.getProperty("java.io.tmpdir"), "no-such-file.epub").absolutePath)
        val result = open(session(docs = mapOf(bookId to goneDoc)))
        assertEquals(unavailable(ReaderUnavailableReason.FILE_MISSING), result)
    }

    @Test
    fun open_returnsOpenFailed_whenPublicationFetcherFails() {
        val result = open(session(fetchResult = Result.failure(RuntimeException("broken epub"))))
        assertEquals(unavailable(ReaderUnavailableReason.OPEN_FAILED), result)
    }

    @Test
    fun open_ready_restoresStoredLocator() {
        val stored = ReadingPosition(
            bookId = bookId,
            locator = "stored-json",
            percent = 0.4f,
            lastOpenedAt = 123L,
            updatedAt = 123L,
        )
        val codec = FakeLocatorCodec(locatorByJson = mapOf("stored-json" to validLocator))
        val result = open(session(stored = stored, codec = codec))

        assertTrue(result is ReaderSessionState.Ready)
        result as ReaderSessionState.Ready
        assertEquals(book, result.book)
        assertEquals(validLocator, result.initialLocator)
        assertEquals(0.4f, result.storedPercent!!, 0.001f)
    }

    @Test
    fun open_ready_startsFromBeginning_whenNoStoredPosition() {
        val result = open(session(stored = null))
        assertTrue(result is ReaderSessionState.Ready)
        result as ReaderSessionState.Ready
        assertNull(result.initialLocator)
        assertNull(result.storedPercent)
    }

    @Test
    fun open_ready_startsFromBeginning_whenStoredLocatorUnparseable() {
        val stored = ReadingPosition(bookId = bookId, locator = "corrupt-json", percent = 0.7f, updatedAt = 123L)
        val codec = FakeLocatorCodec(locatorByJson = emptyMap())
        val result = open(session(stored = stored, codec = codec))
        assertTrue(result is ReaderSessionState.Ready)
        assertNull((result as ReaderSessionState.Ready).initialLocator)
    }

    @Test
    fun open_ready_startsFromBeginning_whenStoredLocatorPointsToMissingResource() {
        val missing = Locator(href = Url("missing.xhtml")!!, mediaType = MediaType.XHTML)
        val stored = ReadingPosition(bookId = bookId, locator = "stored-json", percent = 0.3f, updatedAt = 123L)
        val codec = FakeLocatorCodec(locatorByJson = mapOf("stored-json" to missing))
        val result = open(session(stored = stored, codec = codec))
        assertTrue(result is ReaderSessionState.Ready)
        assertNull("invalid locator must fall back to the beginning", (result as ReaderSessionState.Ready).initialLocator)
    }

    @Test
    fun percentOf_prefersTotalProgressionThenProgression() {
        val session = session()
        val total = Locator(href = Url("chap1.xhtml")!!, mediaType = MediaType.XHTML, locations = Locator.Locations(totalProgression = 0.5))
        assertEquals(0.5f, session.percentOf(total)!!, 0.001f)

        val relative = Locator(href = Url("chap1.xhtml")!!, mediaType = MediaType.XHTML, locations = Locator.Locations(progression = 0.25))
        assertEquals(0.25f, session.percentOf(relative)!!, 0.001f)

        val empty = Locator(href = Url("chap1.xhtml")!!, mediaType = MediaType.XHTML)
        assertNull(session.percentOf(empty))
    }

    @Test
    fun percentOf_coercesOutOfRangeValues() {
        val session = session()
        val over = Locator(href = Url("chap1.xhtml")!!, mediaType = MediaType.XHTML, locations = Locator.Locations(totalProgression = 2.0))
        assertEquals(1.0f, session.percentOf(over)!!, 0.001f)

        val under = Locator(href = Url("chap1.xhtml")!!, mediaType = MediaType.XHTML, locations = Locator.Locations(totalProgression = -0.5))
        assertEquals(0.0f, session.percentOf(under)!!, 0.001f)
    }

    @Test
    fun encode_serializesThroughCodec() {
        val session = session()
        val json = session.encode(validLocator)
        assertNotNull(json)
    }

    @Test
    fun open_close_open_allowsReopening() {
        assertTrue(open(session()) is ReaderSessionState.Ready)
        val session = session()
        session.close()
        assertTrue(open(session) is ReaderSessionState.Ready)
    }

    private class FakePublicationFetcher(
        private val result: Result<Publication>,
    ) : PublicationFetcher {
        override suspend fun open(file: File): Result<Publication> = result
    }

    private class FakeLocatorCodec(
        private val locatorByJson: Map<String, Locator> = emptyMap(),
    ) : LocatorCodec {
        override fun serialize(locator: Locator): String? = "serialized"
        override fun deserialize(json: String): Locator? = locatorByJson[json]
    }

    private class FakePersonalBookRepository(
        private val books: Map<String, PersonalBook>,
    ) : PersonalBookRepository {
        override fun getAll(): List<PersonalBook> = books.values.toList()
        override fun getById(id: String): PersonalBook? = books[id]
        override fun getByStatus(status: ReadingStatus): List<PersonalBook> = books.values.filter { it.readingStatus == status }
        override fun search(query: String): List<PersonalBook> = emptyList()
        override fun insert(book: PersonalBook) = Unit
        override fun updateStatus(id: String, status: ReadingStatus) = Unit
        override fun updateProgress(id: String, progress: Float) = Unit
        override fun reconcileCanonical(id: String, canonicalBookId: String) = Unit
        override fun delete(id: String) = Unit
    }

    private class FakeLocalDocumentRepository(
        private val docs: Map<String, LocalDocument>,
    ) : LocalDocumentRepository {
        override fun getByBook(bookId: String): LocalDocument? = docs[bookId]
        override fun getAvailableBookIds(): Set<String> = docs.values.filter { it.isAvailable }.map { it.bookId }.toSet()
        override fun relocate(bookId: String, sourceUri: String, localPath: String): LocalDocument? = null
        override fun markUnavailable(bookId: String): LocalDocument? = null
        override fun remove(bookId: String) = Unit
    }

    private class FakeReadingPositionRepository(
        private var stored: ReadingPosition?,
    ) : ReadingPositionRepository {
        override fun getByBook(bookId: String): ReadingPosition? = stored
        override fun upsert(position: ReadingPosition) {
            stored = position
        }
    }
}
