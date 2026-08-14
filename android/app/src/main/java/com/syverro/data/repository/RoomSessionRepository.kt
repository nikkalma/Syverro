package com.syverro.data.repository

import com.syverro.data.local.dao.QuoteDao
import com.syverro.data.local.dao.SessionDao
import com.syverro.data.local.entity.QuoteEntity
import com.syverro.data.local.entity.SessionEntity
import com.syverro.domain.model.Quote
import com.syverro.domain.model.ReadingSession
import com.syverro.domain.model.SessionStatus
import com.syverro.domain.repository.SessionRepository
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

    override fun getAllForBook(bookId: String): List<ReadingSession> {
        return sessionDao.getSessionsByBook(bookId).map { it.toDomain() }
    }

    override fun create(bookId: String, startTime: Long): ReadingSession {
        val now = System.currentTimeMillis()
        val entity = SessionEntity(
            bookId = bookId,
            startedAt = now,
            durationSeconds = 0,
            status = SessionStatus.IN_PROGRESS.name,
            createdAt = now,
        )
        val id = sessionDao.insertSession(entity)
        return ReadingSession(
            id = id.toString(),
            bookId = bookId,
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

    override fun addQuote(sessionId: String, text: String, createdAt: Long): Quote {
        val id = sessionId.toLongOrNull()
        val session = id?.let { sessionDao.getSessionById(it) }
        val entity = QuoteEntity(
            sessionId = id ?: 0L,
            bookId = session?.bookId ?: "",
            text = text,
            createdAt = createdAt,
        )
        val quoteId = quoteDao.insertQuote(entity)
        return Quote(
            id = quoteId.toString(),
            sessionId = sessionId,
            text = text,
            createdAt = createdAt,
        )
    }

    private fun SessionEntity.toDomain(): ReadingSession = ReadingSession(
        id = id.toString(),
        bookId = bookId,
        startTime = startedAt,
        durationSeconds = durationSeconds,
        status = SessionStatus.valueOf(status),
    )

    private fun QuoteEntity.toDomain(): Quote = Quote(
        id = id.toString(),
        sessionId = sessionId.toString(),
        text = text,
        createdAt = createdAt,
    )
}