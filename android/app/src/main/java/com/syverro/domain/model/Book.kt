package com.syverro.domain.model

data class Book(
    val id: String,
    val title: String,
    val author: String,
    val coverUrl: String = "",
    val description: String = "",
    val language: String = "en",
    val pageCount: Int = 0,
    val readingStatus: ReadingStatus = ReadingStatus.PLANNED,
    val progress: Float = 0f,
    val rating: Float = 0f,
    val favorite: Boolean = false,
)

enum class ReadingStatus {
    PLANNED,
    READING,
    FINISHED;

    companion object {
        fun fromString(name: String): ReadingStatus = try {
            valueOf(name)
        } catch (_: IllegalArgumentException) {
            PLANNED
        }
    }
}