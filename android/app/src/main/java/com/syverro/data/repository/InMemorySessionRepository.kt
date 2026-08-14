package com.syverro.data.repository

import com.syverro.domain.model.Quote
import com.syverro.domain.model.ReadingSession
import com.syverro.domain.model.SessionStatus
import com.syverro.domain.repository.SessionRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class InMemorySessionRepository @Inject constructor() : SessionRepository {

    private val sessions = mutableListOf<ReadingSession>()
    private val quotes = mutableListOf<Quote>()
    private var nextSessionId = 1
    private var nextQuoteId = 1

    override fun getAll(): List<ReadingSession> = sessions.toList()

    override fun getActive(): ReadingSession? =
        sessions.find { it.status == SessionStatus.IN_PROGRESS }

    override fun getAllForBook(bookId: String): List<ReadingSession> =
        sessions.filter { it.bookId == bookId }

    override fun create(bookId: String, startTime: Long): ReadingSession {
        val session = ReadingSession(
            id = (nextSessionId++).toString(),
            bookId = bookId,
            startTime = startTime,
            status = SessionStatus.IN_PROGRESS,
        )
        sessions.add(session)
        return session
    }

    override fun update(session: ReadingSession) {
        val index = sessions.indexOfFirst { it.id == session.id }
        if (index >= 0) {
            sessions[index] = session
        }
    }

    override fun getAllQuotesForSession(sessionId: String): List<Quote> =
        quotes.filter { it.sessionId == sessionId }

    override fun addQuote(sessionId: String, text: String, createdAt: Long): Quote {
        val quote = Quote(
            id = (nextQuoteId++).toString(),
            sessionId = sessionId,
            text = text,
            createdAt = createdAt,
        )
        quotes.add(quote)
        return quote
    }
}