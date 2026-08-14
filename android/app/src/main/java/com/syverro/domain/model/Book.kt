package com.syverro.domain.model

data class Book(
    val id: String,
    val title: String,
    val author: String,
    val coverUrl: String = "",
    val description: String = "",
    val language: String = "en",
    val pageCount: Int = 0,
)
