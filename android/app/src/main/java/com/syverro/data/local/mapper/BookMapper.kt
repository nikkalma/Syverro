package com.syverro.data.local.mapper

import com.syverro.data.local.entity.BookEntity
import com.syverro.domain.model.Book

object BookMapper {

    fun toDomain(entity: BookEntity): Book = Book(
        id = entity.id,
        title = entity.title,
        author = entity.author,
        coverUrl = entity.coverUrl,
        description = entity.description,
        language = entity.language,
        pageCount = entity.pageCount,
    )

    fun toEntity(book: Book): BookEntity = BookEntity(
        id = book.id,
        title = book.title,
        author = book.author,
        coverUrl = book.coverUrl,
        description = book.description,
        language = book.language,
        pageCount = book.pageCount,
    )
}
