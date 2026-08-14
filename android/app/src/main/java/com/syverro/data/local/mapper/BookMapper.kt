package com.syverro.data.local.mapper

import com.syverro.data.local.dao.BookWithStatus
import com.syverro.data.local.entity.BookEntity
import com.syverro.data.local.entity.UserBookEntity
import com.syverro.domain.model.Book
import com.syverro.domain.model.ReadingStatus

object BookMapper {

    fun toDomain(dto: BookWithStatus): Book = Book(
        id = dto.id,
        title = dto.title,
        author = dto.author,
        coverUrl = dto.coverUrl,
        description = dto.description,
        language = dto.language,
        pageCount = dto.pageCount,
        readingStatus = dto.readingStatus?.let { ReadingStatus.fromString(it) } ?: ReadingStatus.PLANNED,
        progress = dto.progress ?: 0f,
        rating = dto.rating ?: 0f,
        favorite = dto.favorite ?: false,
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

    fun toUserBook(book: Book): UserBookEntity = UserBookEntity(
        bookId = book.id,
        readingStatus = book.readingStatus.name,
        progress = book.progress,
        rating = book.rating,
        favorite = book.favorite,
        createdAt = System.currentTimeMillis(),
        updatedAt = System.currentTimeMillis(),
    )
}
