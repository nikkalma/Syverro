package com.syverro.data.local.document

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.readium.r2.shared.util.asset.AssetRetriever
import org.readium.r2.streamer.PublicationOpener
import java.io.File

data class ExtractedMetadata(
    val title: String,
    val author: String? = null,
    val language: String? = null,
    val opened: Boolean = true,
)

interface PublicationMetadataExtractor {
    suspend fun extract(file: File, fallbackTitle: String): ExtractedMetadata
}

class ReadiumPublicationMetadataExtractor(
    private val assetRetriever: AssetRetriever,
    private val publicationOpener: PublicationOpener,
) : PublicationMetadataExtractor {

    override suspend fun extract(file: File, fallbackTitle: String): ExtractedMetadata {
        return try {
            withContext(Dispatchers.IO) {
                val asset = assetRetriever.retrieve(file).getOrNull()
                    ?: return@withContext ExtractedMetadata(fallbackTitle, opened = false)
                val publication = publicationOpener.open(asset, allowUserInteraction = false).getOrNull()
                    ?: return@withContext ExtractedMetadata(fallbackTitle, opened = false)
                val metadata = publication.metadata
                ExtractedMetadata(
                    title = metadata.title?.trim()?.takeIf { it.isNotEmpty() } ?: fallbackTitle,
                    author = metadata.authors
                        .mapNotNull { it.name?.trim()?.takeIf(String::isNotEmpty) }
                        .firstOrNull(),
                    language = metadata.languages.firstOrNull(),
                    opened = true,
                )
            }
        } catch (_: Exception) {
            ExtractedMetadata(fallbackTitle, opened = false)
        }
    }
}
