package com.syverro.data.local.seed

import com.syverro.data.local.entity.BookEntity
import com.syverro.data.local.entity.UserBookEntity

object SeedBooks {

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

    fun userBooks(): List<UserBookEntity> = listOf(
        UserBookEntity("1", readingStatus = "READING"),
        UserBookEntity("2", readingStatus = "READING"),
        UserBookEntity("5", readingStatus = "FINISHED"),
        UserBookEntity("8", readingStatus = "FINISHED"),
        UserBookEntity("12", readingStatus = "FINISHED"),
    )
}
