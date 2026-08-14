package com.syverro.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.syverro.data.local.entity.VoiceNoteEntity

@Dao
interface VoiceNoteDao {

    @Query("SELECT * FROM voice_notes WHERE book_id = :bookId ORDER BY created_at DESC")
    fun getByBook(bookId: String): List<VoiceNoteEntity>

    @Query("SELECT * FROM voice_notes WHERE id = :id")
    fun getById(id: String): VoiceNoteEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insert(note: VoiceNoteEntity)

    @Query("DELETE FROM voice_notes WHERE id = :id")
    fun delete(id: String)
}
