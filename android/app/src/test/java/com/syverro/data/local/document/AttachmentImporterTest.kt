package com.syverro.data.local.document

import android.content.Context
import android.net.Uri
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.syverro.data.local.dao.ExperienceTagDao
import com.syverro.data.local.dao.LocalDocumentDao
import com.syverro.data.local.dao.PersonalBookDao
import com.syverro.data.local.dao.QuoteDao
import com.syverro.data.local.dao.ReadingPositionDao
import com.syverro.data.local.dao.SessionDao
import com.syverro.data.local.dao.TextNoteDao
import com.syverro.data.local.dao.VoiceNoteDao
import com.syverro.data.local.database.SyverroDatabase
import com.syverro.data.local.entity.ExperienceTagEntity
import com.syverro.data.local.entity.PersonalBookEntity
import com.syverro.data.local.entity.QuoteEntity
import com.syverro.data.local.entity.ReadingPositionEntity
import com.syverro.data.local.entity.SessionEntity
import com.syverro.data.local.entity.TextNoteEntity
import com.syverro.data.local.entity.VoiceNoteEntity
import com.syverro.data.repository.RoomLocalDocumentRepository
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File
import java.io.IOException
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import java.util.UUID

@RunWith(RobolectricTestRunner::class)
class AttachmentImporterTest {

    private lateinit var db: SyverroDatabase
    private lateinit var bookDao: PersonalBookDao
    private lateinit var documentDao: LocalDocumentDao
    private lateinit var sessionDao: SessionDao
    private lateinit var quoteDao: QuoteDao
    private lateinit var positionDao: ReadingPositionDao
    private lateinit var textNoteDao: TextNoteDao
    private lateinit var voiceNoteDao: VoiceNoteDao
    private lateinit var experienceTagDao: ExperienceTagDao
    private lateinit var storage: FakeDocumentStorage

    @Before
    fun setUp() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        db = Room.inMemoryDatabaseBuilder(context, SyverroDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        bookDao = db.personalBookDao()
        documentDao = db.localDocumentDao()
        sessionDao = db.sessionDao()
        quoteDao = db.quoteDao()
        positionDao = db.readingPositionDao()
        textNoteDao = db.textNoteDao()
        voiceNoteDao = db.voiceNoteDao()
        experienceTagDao = db.experienceTagDao()
        storage = FakeDocumentStorage()
    }

    @After
    fun tearDown() {
        db.close()
    }

    private fun context(): Context = ApplicationProvider.getApplicationContext()

    private fun importer(
        extractor: PublicationMetadataExtractor = FakeMetadataExtractor(),
        storageOverride: DocumentStorage = storage,
    ): AttachmentImporter = DefaultAttachmentImporter(
        context(),
        bookDao,
        documentDao,
        storageOverride,
        extractor,
    )

    private fun import(
        importer: AttachmentImporter,
        uri: Uri,
        fileName: String? = null,
        bookId: String? = null,
    ): ImportResult = runBlocking {
        importer.importEpub(uri, fileName = fileName, bookId = bookId)
    }

    @Test
    fun importEpub_createsNewPersonalBookWithRandomUuid_whenNoExistingBook() {
        val first = import(importer(), Uri.parse("content://provider/one.epub"), fileName = "Piranesi.epub")
        assertTrue(first is ImportResult.Success)
        val firstBookId = (first as ImportResult.Success).bookId

        val second = import(importer(), Uri.parse("content://provider/two.epub"), fileName = "Other.epub")
        assertTrue(second is ImportResult.Success)
        val secondBookId = (second as ImportResult.Success).bookId

        assertNotEquals("each import must create an independent random UUID", firstBookId, secondBookId)
        UUID.fromString(firstBookId)

        val book = bookDao.getById(firstBookId)!!
        assertEquals("Extracted Title", book.title)
        assertEquals("Extracted Author", book.authorDisplay)
        assertTrue(book.hasLocalDocument)
        assertEquals("PLANNED", book.readingStatus)
        assertEquals("manual_tracked", book.provenance)
        assertNull(book.canonicalBookId)

        val doc = documentDao.getByBook(firstBookId)!!
        assertEquals("EPUB", doc.format)
        assertTrue(doc.isAvailable)
        assertNotNull(doc.localPath)
        assertNotNull(doc.sourceUri)
    }

    @Test
    fun importEpub_attachToExistingBook_preservesReadingArtifacts() {
        val bookId = "book-existing"
        bookDao.insert(
            PersonalBookEntity(
                id = bookId,
                title = "Original Title",
                authorDisplay = "Original Author",
                readingStatus = "READING",
                progress = 0.42f,
                provenance = "reader_observed",
                hasLocalDocument = false,
                createdAt = 1000L,
                updatedAt = 1000L,
            ),
        )
        val sessionId = sessionDao.insertSession(
            SessionEntity(bookId = bookId, syncId = "s1", startedAt = 2000L, durationSeconds = 3600L),
        )
        quoteDao.insertQuote(
            QuoteEntity(bookId = bookId, syncId = "q1", sessionId = sessionId, text = "A quote.", createdAt = 3000L),
        )
        positionDao.upsert(
            ReadingPositionEntity(
                bookId = bookId,
                locator = "epubcfi(/6/4)",
                percent = 0.5f,
                lastOpenedAt = 4000L,
                updatedAt = 4000L,
                source = "EPUB",
            ),
        )
        textNoteDao.insert(
            TextNoteEntity(id = "tn1", bookId = bookId, sessionId = sessionId, text = "A note.", provenance = "reader_observed", createdAt = 5000L, updatedAt = 5000L),
        )
        voiceNoteDao.insert(
            VoiceNoteEntity(id = "vn1", bookId = bookId, sessionId = sessionId, localAudioPath = "/x.m4a", provenance = "reader_observed", createdAt = 6000L, updatedAt = 6000L),
        )
        experienceTagDao.insert(
            ExperienceTagEntity(id = "et1", bookId = bookId, scope = "MOOD", label = "Cozy", createdAt = 7000L),
        )

        val result = import(importer(), Uri.parse("content://provider/new.epub"), fileName = "Replaced.epub", bookId = bookId)
        assertTrue(result is ImportResult.Success)
        assertEquals(bookId, (result as ImportResult.Success).bookId)

        val book = bookDao.getById(bookId)!!
        assertEquals("Original Title", book.title)
        assertEquals("READING", book.readingStatus)
        assertEquals(0.42f, book.progress, 0.001f)
        assertTrue(book.hasLocalDocument)

        assertEquals(1, sessionDao.getSessionsByBook(bookId).size)
        assertEquals(1, quoteDao.getQuotesByBook(bookId).size)
        assertNotNull("reading position must be preserved", positionDao.getByBook(bookId))
        assertNotNull("text note must be preserved", textNoteDao.getById("tn1"))
        assertNotNull("voice note must be preserved", voiceNoteDao.getById("vn1"))
        assertEquals(1, experienceTagDao.getByBook(bookId).size)

        val doc = documentDao.getByBook(bookId)!!
        assertEquals("Replaced.epub", doc.fileName)
        assertTrue(doc.isAvailable)
    }

    @Test
    fun importEpub_withoutCanonicalMatch_succeedsWithNullCanonicalLink() {
        assertNull("no canonical book should exist for the fixture", bookDao.getById("book-missing"))

        val result = import(importer(), Uri.parse("content://provider/standalone.epub"), fileName = "Standalone.epub")
        assertTrue(result is ImportResult.Success)

        val book = bookDao.getById((result as ImportResult.Success).bookId)!!
        assertNull("canonical matching is non-blocking; link stays null", book.canonicalBookId)
        assertTrue(book.hasLocalDocument)
    }

    @Test
    fun importEpub_copyFailure_keepsExistingBookAndArtifacts() {
        val bookId = "book-fragile"
        bookDao.insert(PersonalBookEntity(id = bookId, title = "Fragile", readingStatus = "READING", createdAt = 1000L, updatedAt = 1000L))
        sessionDao.insertSession(SessionEntity(bookId = bookId, syncId = "s1", startedAt = 2000L))
        quoteDao.insertQuote(QuoteEntity(bookId = bookId, syncId = "q1", text = "Kept.", createdAt = 3000L))

        val failing = FakeDocumentStorage(failOnCopy = true)
        val result = import(importer(storageOverride = failing), Uri.parse("content://provider/x.epub"), fileName = "X.epub", bookId = bookId)

        assertTrue(result is ImportResult.Error)
        assertEquals(ImportError.COPY_FAILED, (result as ImportResult.Error).reason)

        val book = bookDao.getById(bookId)!!
        assertFalse("failed import must not mark the book as having a document", book.hasLocalDocument)
        assertEquals(1, sessionDao.getSessionsByBook(bookId).size)
        assertEquals(1, quoteDao.getQuotesByBook(bookId).size)
        assertNull("no document row may be created on copy failure", documentDao.getByBook(bookId))
    }

    @Test
    fun localDocumentAvailability_marksUnavailableThenRelocates() {
        val result = import(importer(), Uri.parse("content://provider/a.epub"), fileName = "a.epub")
        val bookId = (result as ImportResult.Success).bookId
        val repository = RoomLocalDocumentRepository(documentDao, bookDao)

        assertTrue(repository.getByBook(bookId)!!.isAvailable)

        val unavailable = repository.markUnavailable(bookId)!!
        assertFalse(unavailable.isAvailable)

        val relocated = repository.relocate(bookId, sourceUri = "content://provider/new.epub", localPath = "/data/documents/new.epub")!!
        assertTrue(relocated.isAvailable)
        assertEquals("content://provider/new.epub", relocated.sourceUri)
        assertEquals("/data/documents/new.epub", relocated.localPath)

        val persisted = documentDao.getByBook(bookId)!!
        assertTrue(persisted.isAvailable)
        assertEquals("content://provider/new.epub", persisted.sourceUri)
    }

    @Test
    fun importEpub_metadataFallback_usesFileNameTitle_whenExtractionFails() {
        val failingExtractor = FakeMetadataExtractor(fail = true)
        val result = import(importer(extractor = failingExtractor), Uri.parse("content://provider/u.epub"), fileName = "Untitled.epub")
        assertTrue(result is ImportResult.Success)

        val book = bookDao.getById((result as ImportResult.Success).bookId)!!
        assertEquals("Untitled", book.title)
        assertTrue(book.hasLocalDocument)
    }

    @Test
    fun importEpub_replaceOnExistingBook_overwritesDocumentAndKeepsBook() {
        val first = import(importer(), Uri.parse("content://provider/one.epub"), fileName = "First.epub")
        val bookId = (first as ImportResult.Success).bookId

        val second = import(importer(), Uri.parse("content://provider/two.epub"), fileName = "Second.epub", bookId = bookId)
        assertTrue(second is ImportResult.Success)
        assertEquals(bookId, (second as ImportResult.Success).bookId)

        val doc = documentDao.getByBook(bookId)!!
        assertEquals("Second.epub", doc.fileName)
        assertEquals("content://provider/two.epub", doc.sourceUri)
        assertTrue(bookDao.getById(bookId)!!.hasLocalDocument)
    }

    @Test
    fun importEpub_invalidPublicationAfterCopy_isRejectedWithoutAttachment() {
        val bookId = "book-invalid"
        bookDao.insert(
            PersonalBookEntity(
                id = bookId,
                title = "Existing",
                authorDisplay = "Existing Author",
                readingStatus = "READING",
                createdAt = 1000L,
                updatedAt = 1000L,
            ),
        )
        val unreadable = FakeMetadataExtractor(opened = false)
        val result = import(importer(extractor = unreadable), Uri.parse("content://provider/corrupt.epub"), fileName = "Corrupt.epub", bookId = bookId)

        assertTrue(result is ImportResult.Error)
        assertEquals(ImportError.VALIDATION_FAILED, (result as ImportResult.Error).reason)
        assertNull("no attachment may be committed for an invalid EPUB", documentDao.getByBook(bookId))
        val book = bookDao.getById(bookId)!!
        assertFalse("book must not be marked as having a document", book.hasLocalDocument)
        assertFalse("no destination file may be left behind", storage.exists(storage.destinationFor(bookId).absolutePath))
    }

    @Test
    fun importEpub_failedReplacement_preservesPreviousAttachmentAndDbState() {
        val first = import(importer(), Uri.parse("content://provider/one.epub"), fileName = "First.epub")
        val bookId = (first as ImportResult.Success).bookId
        val destination = storage.destinationFor(bookId)
        assertTrue(destination.exists())

        val result = import(importer(extractor = FakeMetadataExtractor(opened = false)), Uri.parse("content://provider/bad.epub"), fileName = "Bad.epub", bookId = bookId)
        assertTrue(result is ImportResult.Error)
        assertEquals(ImportError.VALIDATION_FAILED, (result as ImportResult.Error).reason)

        assertTrue("previous attachment file must remain intact", destination.exists())
        val doc = documentDao.getByBook(bookId)!!
        assertEquals("First.epub", doc.fileName)
        assertTrue(doc.isAvailable)
        assertTrue(bookDao.getById(bookId)!!.hasLocalDocument)
        val staged = File(destination.parentFile, "${destination.name}.staging")
        assertFalse("staged file must be cleaned up", staged.exists())
    }

    @Test
    fun detach_removesDocumentRowAndClearsHasLocalDocument() {
        val result = import(importer(), Uri.parse("content://provider/a.epub"), fileName = "a.epub")
        val bookId = (result as ImportResult.Success).bookId
        val repository = RoomLocalDocumentRepository(documentDao, bookDao)

        repository.remove(bookId)

        assertNull("local_documents row must be removed on detach", documentDao.getByBook(bookId))
        val book = bookDao.getById(bookId)!!
        assertFalse("has_local_document must be cleared on detach", book.hasLocalDocument)
        assertTrue("personal book itself must be kept", bookDao.getById(bookId) != null)
    }

    @Test
    fun getByBook_marksUnavailable_whenUnderlyingFileIsMissing() {
        val result = import(importer(), Uri.parse("content://provider/a.epub"), fileName = "a.epub")
        val bookId = (result as ImportResult.Success).bookId
        val repository = RoomLocalDocumentRepository(documentDao, bookDao)

        assertTrue(repository.getByBook(bookId)!!.isAvailable)

        val doc = documentDao.getByBook(bookId)!!
        assertTrue("fixture requires a real file for the availability check", File(doc.localPath).delete())

        val after = repository.getByBook(bookId)!!
        assertFalse("availability must reflect a missing file, not only the DB flag", after.isAvailable)
        assertFalse(documentDao.getByBook(bookId)!!.isAvailable)
    }

    private class FakeDocumentStorage(
        val failOnCopy: Boolean = false,
    ) : DocumentStorage {
        private val root = File(System.getProperty("java.io.tmpdir"), "syverro-test-docs-${System.nanoTime()}")

        override fun destinationFor(bookId: String): File = File(root, "$bookId.epub")

        override fun copy(uri: Uri, destination: File) {
            if (failOnCopy) throw IOException("simulated copy failure")
            destination.parentFile?.mkdirs()
            destination.writeBytes("fake-epub-bytes-${uri.toString()}".toByteArray())
        }

        override fun promote(staged: File, destination: File): Boolean {
            val atomic = runCatching {
                Files.move(staged.toPath(), destination.toPath(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
            }
            if (atomic.isSuccess) return true
            return runCatching {
                Files.move(staged.toPath(), destination.toPath(), StandardCopyOption.REPLACE_EXISTING)
            }.isSuccess
        }

        override fun delete(path: String): Boolean = File(path).delete()

        override fun exists(path: String): Boolean = File(path).exists()
    }

    private class FakeMetadataExtractor(
        private val title: String = "Extracted Title",
        private val author: String? = "Extracted Author",
        private val fail: Boolean = false,
        private val opened: Boolean = true,
    ) : PublicationMetadataExtractor {
        override suspend fun extract(file: File, fallbackTitle: String): ExtractedMetadata {
            return if (fail) {
                ExtractedMetadata(fallbackTitle, opened = opened)
            } else {
                ExtractedMetadata(title = title, author = author, language = "en", opened = opened)
            }
        }
    }
}
