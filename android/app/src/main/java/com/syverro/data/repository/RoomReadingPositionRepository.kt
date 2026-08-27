package com.syverro.data.repository

import com.syverro.data.local.dao.ReadingPositionDao
import com.syverro.data.local.entity.ReadingPositionEntity
import com.syverro.domain.model.ReadingPosition
import com.syverro.domain.repository.ReadingPositionRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RoomReadingPositionRepository @Inject constructor(
    private val dao: ReadingPositionDao,
) : ReadingPositionRepository {

    override fun getByBook(bookId: String): ReadingPosition? =
        dao.getByBook(bookId)?.toDomain()

    override fun upsert(position: ReadingPosition) {
        dao.upsert(
            ReadingPositionEntity(
                bookId = position.bookId,
                locator = position.locator,
                percent = position.percent,
                lastOpenedAt = position.lastOpenedAt,
                updatedAt = position.updatedAt,
                source = position.source,
            ),
        )
    }
}

private fun ReadingPositionEntity.toDomain(): ReadingPosition = ReadingPosition(
    bookId = bookId,
    locator = locator,
    percent = percent,
    lastOpenedAt = lastOpenedAt,
    updatedAt = updatedAt,
    source = source,
)
