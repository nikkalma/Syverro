package com.syverro.domain.repository

import com.syverro.domain.model.Quote
import com.syverro.domain.model.ReadingSession

interface SessionRepository {
    fun getAll(): List<ReadingSession>
    fun getActive(): ReadingSession?
    fun getAllForBook(personalBookId: String): List<ReadingSession>
    fun create(personalBookId: String, startTime: Long): ReadingSession
    fun update(session: ReadingSession)
    fun getAllQuotesForSession(sessionId: String): List<Quote>
    fun getAllQuotesForBook(personalBookId: String): List<Quote>
    fun addQuote(personalBookId: String, sessionId: String?, text: String, createdAt: Long): Quote
}
