package com.syverro.domain.repository

import com.syverro.domain.model.Quote
import com.syverro.domain.model.ReadingSession

interface SessionRepository {
    fun getAll(): List<ReadingSession>
    fun getActive(): ReadingSession?
    fun getAllForBook(bookId: String): List<ReadingSession>
    fun create(bookId: String, startTime: Long): ReadingSession
    fun update(session: ReadingSession)
    fun getAllQuotesForSession(sessionId: String): List<Quote>
    fun addQuote(sessionId: String, text: String, createdAt: Long): Quote
}