package com.syverro.data.reader

import com.syverro.domain.repository.LocalDocumentRepository
import com.syverro.domain.repository.PersonalBookRepository
import com.syverro.domain.repository.ReadingPositionRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.readium.r2.navigator.extensions.normalizeLocator
import org.readium.r2.shared.DelicateReadiumApi
import org.readium.r2.shared.publication.Locator
import org.readium.r2.shared.publication.Publication
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ReadiumReaderSession @Inject constructor(
    private val personalBookRepository: PersonalBookRepository,
    private val localDocumentRepository: LocalDocumentRepository,
    private val readingPositionRepository: ReadingPositionRepository,
    private val publicationFetcher: PublicationFetcher,
    private val locatorCodec: LocatorCodec,
) : ReaderSession {

    private var openPublication: Publication? = null

    override suspend fun open(bookId: String): ReaderSessionState {
        val book = personalBookRepository.getById(bookId)
            ?: return ReaderSessionState.Unavailable(ReaderUnavailableReason.BOOK_NOT_FOUND)

        val document = localDocumentRepository.getByBook(bookId)
            ?: return ReaderSessionState.Unavailable(ReaderUnavailableReason.NO_DOCUMENT)

        if (!document.isAvailable) {
            return ReaderSessionState.Unavailable(ReaderUnavailableReason.DOCUMENT_UNAVAILABLE)
        }
        if (document.format != FORMAT_EPUB) {
            return ReaderSessionState.Unavailable(ReaderUnavailableReason.UNSUPPORTED_FORMAT)
        }
        if (!File(document.localPath).exists()) {
            return ReaderSessionState.Unavailable(ReaderUnavailableReason.FILE_MISSING)
        }

        val publication = withContext(Dispatchers.IO) {
            publicationFetcher.open(File(document.localPath)).getOrNull()
        } ?: return ReaderSessionState.Unavailable(ReaderUnavailableReason.OPEN_FAILED)

        openPublication = publication

        val stored = readingPositionRepository.getByBook(bookId)
        return ReaderSessionState.Ready(
            book = book,
            publication = publication,
            initialLocator = restoreLocator(publication, stored?.locator),
            storedPercent = stored?.percent,
        )
    }

    override fun percentOf(locator: Locator): Float? {
        val progression = locator.locations.totalProgression ?: locator.locations.progression
            ?: return null
        return progression.toFloat().coerceIn(0f, 1f)
    }

    override fun encode(locator: Locator): String? = locatorCodec.serialize(locator)

    override fun close() {
        openPublication?.close()
        openPublication = null
    }

    /**
     * Restores the persisted location, falling back to the start of the publication when the
     * stored locator is missing, unparseable, or does not point to an existing resource.
     */
    @OptIn(DelicateReadiumApi::class)
    private fun restoreLocator(publication: Publication, storedJson: String?): Locator? {
        val stored = storedJson?.let { locatorCodec.deserialize(it) } ?: return null
        val normalized = publication.normalizeLocator(stored)
        val href = normalized.href.removeFragment()
        return if (publication.linkWithHref(href) != null) normalized else null
    }

    private companion object {
        const val FORMAT_EPUB = "EPUB"
    }
}
