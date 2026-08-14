package com.syverro.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.syverro.data.local.entity.ExperienceTagEntity

@Dao
interface ExperienceTagDao {

    @Query("SELECT * FROM experience_tags WHERE book_id = :bookId")
    fun getByBook(bookId: String): List<ExperienceTagEntity>

    @Query("SELECT * FROM experience_tags WHERE book_id = :bookId AND scope = :scope")
    fun getByBookAndScope(bookId: String, scope: String): List<ExperienceTagEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insert(tag: ExperienceTagEntity)

    @Query("DELETE FROM experience_tags WHERE id = :id")
    fun delete(id: String)
}
