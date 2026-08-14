package com.syverro.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.PrimaryKey

@Entity(
    tableName = "local_documents",
    foreignKeys = [
        ForeignKey(
            entity = PersonalBookEntity::class,
            parentColumns = ["id"],
            childColumns = ["book_id"],
            onDelete = ForeignKey.CASCADE,
        ),
    ],
)
data class LocalDocumentEntity(
    @PrimaryKey @ColumnInfo(name = "book_id") val bookId: String,
    val format: String,
    @ColumnInfo(name = "file_name") val fileName: String,
    @ColumnInfo(name = "local_path") val localPath: String,
    @ColumnInfo(name = "source_uri") val sourceUri: String? = null,
    @ColumnInfo(name = "file_size") val fileSize: Long? = null,
    @ColumnInfo(name = "mime_type") val mimeType: String? = null,
    @ColumnInfo(name = "is_available", defaultValue = "1") val isAvailable: Boolean = true,
    @ColumnInfo(name = "created_at") val createdAt: Long,
)
