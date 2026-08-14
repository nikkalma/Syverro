package com.syverro.data.local.seed

import com.syverro.data.local.entity.BookEntity
import com.syverro.data.local.entity.PersonalBookEntity
import com.syverro.data.local.util.StableIds

object SeedBooks {

    private const val SEED_CREATED_AT = 1_700_000_000_000L
    private const val SEED_UPDATED_AT = 1_700_000_000_000L

    fun books(): List<BookEntity> = listOf(
        BookEntity("1", "The Shadow of the Wind", "Carlos Ruiz Zafón", description = "A mystery unfolds in postwar Barcelona as a young boy discovers a forgotten book in the Cemetery of Forgotten Books."),
        BookEntity("2", "Piranesi", "Susanna Clarke", description = "A man living in a mysterious infinite house begins to uncover truths about his existence."),
        BookEntity("3", "Circe", "Madeline Miller", description = "The enchantress Circe tells her own story of gods, mortals, and her journey to discover her power."),
        BookEntity("4", "The Left Hand of Darkness", "Ursula K. Le Guin", description = "An envoy travels to a planet where gender is fluid, challenging every assumption about identity."),
        BookEntity("5", "A Psalm for the Wild-Built", "Becky Chambers", description = "A tea monk and a robot explore what it means to find purpose in a world without need."),
        BookEntity("6", "Klara and the Sun", "Kazuo Ishiguro", description = "An Artificial Friend observes the world from a store shelf, waiting to be chosen by a child."),
        BookEntity("7", "The Buried Giant", "Kazuo Ishiguro", description = "An elderly couple journeys across a misty land where memory has faded into myth."),
        BookEntity("8", "Pachinko", "Min Jin Lee", description = "A sweeping saga of a Korean family living in Japan across four generations."),
        BookEntity("9", "The Overstory", "Richard Powers", description = "Nine lives intertwine in a sweeping story about trees, connection, and the natural world."),
        BookEntity("10", "Station Eleven", "Emily St. John Mandel", description = "A traveling Shakespeare troupe navigates a post-pandemic world, holding onto art and humanity."),
        BookEntity("11", "The Name of the Wind", "Patrick Rothfuss", description = "A legendary figure recounts his rise from orphan to the most infamous wizard in history."),
        BookEntity("12", "Jonathan Strange & Mr Norrell", "Susanna Clarke", description = "Two magicians bring magic back to 19th-century England with unforeseen consequences."),
    )

    fun personalBooks(): List<PersonalBookEntity> = listOf(
        personal("1", "READING", progress = 0.42f, currentPage = 210, totalPages = 500),
        personal("2", "READING", progress = 0.18f, currentPage = 55, totalPages = 300),
        personal("5", "FINISHED", progress = 1f),
        personal("8", "FINISHED", progress = 1f),
        personal("12", "FINISHED", progress = 1f),
        personal("6", "PLANNED", progress = 0f),
        personal("9", "PLANNED", progress = 0f),
    )

    private fun personal(
        canonicalId: String,
        status: String,
        progress: Float,
        currentPage: Int? = null,
        totalPages: Int? = null,
    ): PersonalBookEntity {
        val book = books().first { it.id == canonicalId }
        return PersonalBookEntity(
            id = StableIds.personalBookId(canonicalId),
            canonicalBookId = canonicalId,
            title = book.title,
            authorDisplay = book.author,
            readingStatus = status,
            progress = progress,
            currentPage = currentPage,
            totalPages = totalPages,
            provenance = "historical_import",
            createdAt = SEED_CREATED_AT,
            updatedAt = SEED_UPDATED_AT,
        )
    }
}
