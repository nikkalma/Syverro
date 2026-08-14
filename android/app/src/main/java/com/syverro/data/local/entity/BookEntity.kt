package com.syverro.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "books")
data class BookEntity(
    @PrimaryKey val id: String,
    val title: String,
    val author: String,
    @ColumnInfo(name = "cover_url") val coverUrl: String = "",
    val description: String = "",
    val language: String = "en",
    @ColumnInfo(name = "page_count") val pageCount: Int = 0,
)
