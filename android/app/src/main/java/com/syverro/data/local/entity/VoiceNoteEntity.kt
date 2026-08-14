package com.syverro.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "voice_notes",
    foreignKeys = [
        ForeignKey(
            entity = PersonalBookEntity::class,
            parentColumns = ["id"],
            childColumns = ["book_id"],
            onDelete = ForeignKey.CASCADE,
        ),
        ForeignKey(
            entity = SessionEntity::class,
            parentColumns = ["id"],
            childColumns = ["session_id"],
            onDelete = ForeignKey.SET_NULL,
        ),
    ],
    indices = [
        Index(value = ["book_id"]),
        Index(value = ["session_id"]),
    ],
)
data class VoiceNoteEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "book_id") val bookId: String,
    @ColumnInfo(name = "session_id") val sessionId: Long? = null,
    @ColumnInfo(name = "local_audio_path") val localAudioPath: String,
    @ColumnInfo(name = "audio_duration_ms") val audioDurationMs: Int? = null,
    val locator: String? = null,
    val page: Int? = null,
    val provenance: String,
    @ColumnInfo(name = "created_at") val createdAt: Long,
    @ColumnInfo(name = "updated_at") val updatedAt: Long,
)
