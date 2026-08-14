package com.syverro.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "quotes",
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
        Index(value = ["session_id"]),
        Index(value = ["book_id"]),
        Index(value = ["sync_id"], unique = true),
    ],
)
data class QuoteEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "book_id") val bookId: String,
    @ColumnInfo(name = "sync_id") val syncId: String,
    @ColumnInfo(name = "session_id") val sessionId: Long? = null,
    val text: String,
    val locator: String? = null,
    val page: Int? = null,
    val note: String? = null,
    val provenance: String = "reader_observed",
    @ColumnInfo(name = "created_at") val createdAt: Long,
)
