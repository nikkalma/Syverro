package com.syverro.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "personal_books",
    foreignKeys = [
        ForeignKey(
            entity = BookEntity::class,
            parentColumns = ["id"],
            childColumns = ["canonical_book_id"],
            onDelete = ForeignKey.SET_NULL,
        ),
    ],
    indices = [
        Index(value = ["canonical_book_id"]),
        Index(value = ["reading_status"]),
    ],
)
data class PersonalBookEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "canonical_book_id") val canonicalBookId: String? = null,
    val title: String,
    @ColumnInfo(name = "author_display") val authorDisplay: String? = null,
    @ColumnInfo(name = "local_cover_path") val localCoverPath: String? = null,
    @ColumnInfo(name = "reading_status") val readingStatus: String = "PLANNED",
    val progress: Float = 0f,
    @ColumnInfo(name = "current_page") val currentPage: Int? = null,
    @ColumnInfo(name = "total_pages") val totalPages: Int? = null,
    @ColumnInfo(name = "start_date") val startDate: Long? = null,
    @ColumnInfo(name = "end_date") val endDate: Long? = null,
    val provenance: String = "manual_tracked",
    @ColumnInfo(name = "has_local_document", defaultValue = "0") val hasLocalDocument: Boolean = false,
    @ColumnInfo(name = "created_at") val createdAt: Long,
    @ColumnInfo(name = "updated_at") val updatedAt: Long,
)
