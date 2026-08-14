package com.syverro.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.syverro.data.local.entity.ReadingPositionEntity

@Dao
interface ReadingPositionDao {

    @Query("SELECT * FROM reading_position WHERE book_id = :bookId")
    fun getByBook(bookId: String): ReadingPositionEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun upsert(position: ReadingPositionEntity)
}
