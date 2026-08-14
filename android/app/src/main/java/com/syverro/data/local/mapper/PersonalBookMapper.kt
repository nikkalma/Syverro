package com.syverro.data.local.mapper

import com.syverro.data.local.entity.PersonalBookEntity
import com.syverro.domain.model.PersonalBook
import com.syverro.domain.model.Provenance
import com.syverro.domain.model.ReadingStatus

object PersonalBookMapper {

    fun toDomain(entity: PersonalBookEntity): PersonalBook = PersonalBook(
        id = entity.id,
        canonicalBookId = entity.canonicalBookId,
        title = entity.title,
        authorDisplay = entity.authorDisplay,
        localCoverPath = entity.localCoverPath,
        readingStatus = ReadingStatus.fromString(entity.readingStatus),
        progress = entity.progress,
        currentPage = entity.currentPage,
        totalPages = entity.totalPages,
        startDate = entity.startDate,
        endDate = entity.endDate,
        provenance = Provenance.fromStorage(entity.provenance),
        hasLocalDocument = entity.hasLocalDocument,
        createdAt = entity.createdAt,
        updatedAt = entity.updatedAt,
    )

    fun toEntity(book: PersonalBook): PersonalBookEntity = PersonalBookEntity(
        id = book.id,
        canonicalBookId = book.canonicalBookId,
        title = book.title,
        authorDisplay = book.authorDisplay,
        localCoverPath = book.localCoverPath,
        readingStatus = book.readingStatus.name,
        progress = book.progress,
        currentPage = book.currentPage,
        totalPages = book.totalPages,
        startDate = book.startDate,
        endDate = book.endDate,
        provenance = book.provenance.storageValue,
        hasLocalDocument = book.hasLocalDocument,
        createdAt = book.createdAt,
        updatedAt = book.updatedAt,
    )
}
