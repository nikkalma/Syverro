package com.syverro.data.reader

import com.syverro.domain.model.PersonalBook
import org.readium.r2.shared.publication.Locator
import org.readium.r2.shared.publication.Publication

enum class ReaderUnavailableReason {
    BOOK_NOT_FOUND,
    NO_DOCUMENT,
    DOCUMENT_UNAVAILABLE,
    FILE_MISSING,
    UNSUPPORTED_FORMAT,
    OPEN_FAILED,
}

sealed interface ReaderSessionState {
    /**
     * The publication is open and ready to render.
     *
     * @param initialLocator the persisted location to restore, or `null` to start from the
     * beginning (also used when the stored locator is invalid/corrupt).
     * @param storedPercent the last persisted progression, used to seed the UI and mirrors.
     */
    data class Ready(
        val book: PersonalBook,
        val publication: Publication,
        val initialLocator: Locator?,
        val storedPercent: Float?,
    ) : ReaderSessionState

    data class Unavailable(val reason: ReaderUnavailableReason) : ReaderSessionState
}

/**
 * Small reader boundary: owns opening/restoring/closing a local publication and mapping
 * navigator locations to persisted data. Kept independent of the UI so that adding a PDF navigator
 * later does not require rewriting navigation or data ownership.
 */
interface ReaderSession {
    suspend fun open(bookId: String): ReaderSessionState

    /** Publication progression (0..1) for a navigator location, or `null` when not available. */
    fun percentOf(locator: Locator): Float?

    /** Opaque serialized locator for persistence. */
    fun encode(locator: Locator): String?

    /** Releases the currently open publication. */
    fun close()
}
