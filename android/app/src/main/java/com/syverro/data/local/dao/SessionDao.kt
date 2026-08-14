package com.syverro.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.syverro.data.local.entity.SessionEntity

@Dao
interface SessionDao {

    @Query("SELECT * FROM sessions WHERE status = 'IN_PROGRESS' ORDER BY started_at DESC LIMIT 1")
    fun getActiveSession(): SessionEntity?

    @Query("SELECT * FROM sessions ORDER BY started_at DESC")
    fun getSessions(): List<SessionEntity>

    @Query("SELECT * FROM sessions WHERE book_id = :bookId ORDER BY started_at DESC")
    fun getSessionsByBook(bookId: String): List<SessionEntity>

    @Query("SELECT * FROM sessions WHERE id = :id")
    fun getSessionById(id: Long): SessionEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertSession(session: SessionEntity): Long

    @Update
    fun updateSession(session: SessionEntity)

    @Query("DELETE FROM sessions WHERE id = :id")
    fun deleteSession(id: Long)
}