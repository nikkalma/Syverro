package com.syverro.domain.model

enum class ReadingStatus {
    PLANNED,
    READING,
    FINISHED,
    POSTPONED,
    ABANDONED,
    REREADING;

    companion object {
        fun fromString(name: String): ReadingStatus = try {
            valueOf(name)
        } catch (_: IllegalArgumentException) {
            PLANNED
        }
    }
}
