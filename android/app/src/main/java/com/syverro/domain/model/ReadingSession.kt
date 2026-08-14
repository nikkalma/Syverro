package com.syverro.domain.model

data class ReadingSession(
    val id: String,
    val personalBookId: String,
    val syncId: String,
    val startTime: Long,
    val durationSeconds: Long = 0,
    val status: SessionStatus = SessionStatus.IN_PROGRESS,
)

enum class SessionStatus {
    IN_PROGRESS,
    PAUSED,
    FINISHED,
}
