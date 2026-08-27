package com.syverro.data.reader

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.readium.r2.shared.publication.Publication
import org.readium.r2.shared.util.asset.AssetRetriever
import org.readium.r2.streamer.PublicationOpener
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ReadiumPublicationFetcher @Inject constructor(
    private val assetRetriever: AssetRetriever,
    private val publicationOpener: PublicationOpener,
) : PublicationFetcher {

    override suspend fun open(file: File): Result<Publication> = try {
        val publication = withContext(Dispatchers.IO) {
            val asset = assetRetriever.retrieve(file).getOrNull()
                ?: return@withContext null
            publicationOpener.open(asset, allowUserInteraction = false).getOrNull()
        }
        if (publication != null) {
            Result.success(publication)
        } else {
            Result.failure(IllegalStateException("Failed to open publication from $file"))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }
}
