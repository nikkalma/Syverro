package com.syverro.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "experience_tags",
    foreignKeys = [
        ForeignKey(
            entity = PersonalBookEntity::class,
            parentColumns = ["id"],
            childColumns = ["book_id"],
            onDelete = ForeignKey.CASCADE,
        ),
    ],
    indices = [
        Index(value = ["book_id"]),
        Index(value = ["scope"]),
    ],
)
data class ExperienceTagEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "book_id") val bookId: String,
    val scope: String,
    val label: String,
    @ColumnInfo(name = "normalized_label") val normalizedLabel: String? = null,
    @ColumnInfo(name = "editorial_node_id") val editorialNodeId: String? = null,
    @ColumnInfo(name = "created_at") val createdAt: Long,
)
