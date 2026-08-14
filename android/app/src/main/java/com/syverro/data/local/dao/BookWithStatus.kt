package com.syverro.data.local.dao

import androidx.room.ColumnInfo

data class BookWithStatus(
    val id: String,
    val title: String,
    val author: String,
    @ColumnInfo(name = "cover_url") val coverUrl: String = "",
    val description: String = "",
    val language: String = "en",
    @ColumnInfo(name = "page_count") val pageCount: Int = 0,
    @ColumnInfo(name = "reading_status") val readingStatus: String? = null,
    val progress: Float? = null,
    val rating: Float? = null,
    val favorite: Boolean? = null,
)
