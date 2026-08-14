package com.syverro.data.repository

import com.syverro.data.local.dao.QuoteDao
import com.syverro.data.local.dao.SessionDao
import com.syverro.data.local.entity.QuoteEntity
import com.syverro.data.local.entity.SessionEntity
import com.syverro.domain.model.Provenance
import com.syverro.domain.model.Quote
import com.syverro.domain.model.ReadingSession
import com.syverro.domain.model.SessionStatus
import com.syverro.domain.repository.SessionRepository
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RoomSessionRepository @Inject constructor(
    private val sessionDao: SessionDao,
    private val quoteDao: QuoteDao,
) : SessionRepository {

    override fun getAll(): List<ReadingSession> {
        return sessionDao.getSessions().map { it.toDomain() }
    }

    override fun getActive(): ReadingSession? {
        return sessionDao.getActiveSession()?.toDomain()
    }

    override fun getAllForBook(personalBookId: String): List<ReadingSession> {
        return sessionDao.getSessionsByBook(personalBookId).map { it.toDomain() }
    }

    override fun create(personalBookId: String, startTime: Long): ReadingSession {
        val now = System.currentTimeMillis()
        val entity = SessionEntity(
            bookId = personalBookId,
            syncId = UUID.randomUUID().toString(),
            startedAt = now,
            durationSeconds = 0,
            status = SessionStatus.IN_PROGRESS.name,
            createdAt = now,
        )
        val id = sessionDao.insertSession(entity)
        return ReadingSession(
            id = id.toString(),
            personalBookId = personalBookId,
            syncId = entity.syncId,
            startTime = now,
            durationSeconds = 0,
            status = SessionStatus.IN_PROGRESS,
        )
    }

    override fun update(session: ReadingSession) {
        val entity = sessionDao.getSessionById(session.id.toLongOrNull() ?: return) ?: return
        sessionDao.updateSession(
            entity.copy(
                durationSeconds = session.durationSeconds,
                status = session.status.name,
                finishedAt = if (session.status == SessionStatus.FINISHED) System.currentTimeMillis() else entity.finishedAt,
            )
        )
    }

    override fun getAllQuotesForSession(sessionId: String): List<Quote> {
        val id = sessionId.toLongOrNull() ?: return emptyList()
        return quoteDao.getQuotesBySession(id).map { it.toDomain() }
    }

    override fun getAllQuotesForBook(personalBookId: String): List<Quote> {
        return quoteDao.getQuotesByBook(personalBookId).map { it.toDomain() }
    }

    override fun addQuote(personalBookId: String, sessionId: String?, text: String, createdAt: Long): Quote {
        val entity = QuoteEntity(
            bookId = personalBookId,
            syncId = UUID.randomUUID().toString(),
            sessionId = sessionId?.toLongOrNull(),
            text = text,
            provenance = Provenance.READER_OBSERVED.storageValue,
            createdAt = createdAt,
        )
        val quoteId = quoteDao.insertQuote(entity)
        return Quote(
            id = quoteId.toString(),
            personalBookId = personalBookId,
            syncId = entity.syncId,
            sessionId = sessionId,
            text = text,
            provenance = Provenance.READER_OBSERVED,
            createdAt = createdAt,
        )
    }

    private fun SessionEntity.toDomain(): ReadingSession = ReadingSession(
        id = id.toString(),
        personalBookId = bookId,
        syncId = syncId,
        startTime = startedAt,
        durationSeconds = durationSeconds,
        status = SessionStatus.valueOf(status),
    )

    private fun QuoteEntity.toDomain(): Quote = Quote(
        id = id.toString(),
        personalBookId = bookId,
        syncId = syncId,
        sessionId = sessionId?.toString(),
        text = text,
        locator = locator,
        page = page,
        note = note,
        provenance = Provenance.fromStorage(provenance),
        createdAt = createdAt,
    )
}
