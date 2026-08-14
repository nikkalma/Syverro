package com.syverro.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.syverro.data.local.entity.QuoteEntity

@Dao
interface QuoteDao {

    @Query("SELECT * FROM quotes ORDER BY created_at DESC")
    fun getQuotes(): List<QuoteEntity>

    @Query("SELECT * FROM quotes WHERE session_id = :sessionId ORDER BY created_at DESC")
    fun getQuotesBySession(sessionId: Long): List<QuoteEntity>

    @Query("SELECT * FROM quotes WHERE book_id = :bookId ORDER BY created_at DESC")
    fun getQuotesByBook(bookId: String): List<QuoteEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertQuote(quote: QuoteEntity): Long

    @Query("DELETE FROM quotes WHERE id = :id")
    fun deleteQuote(id: Long)
}
