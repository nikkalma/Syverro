package com.syverro.data.reader

import org.readium.r2.shared.publication.Publication
import java.io.File

/**
 * Opens a publication from a local file. Thin wrapper around Readium's
 * [org.readium.r2.streamer.PublicationOpener] so the reader boundary can be tested with fakes.
 */
interface PublicationFetcher {
    suspend fun open(file: File): Result<Publication>
}
