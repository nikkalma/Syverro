package com.syverro.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.syverro.data.local.entity.BookEntity

@Dao
interface BookDao {

    @Query("SELECT * FROM books ORDER BY title ASC")
    fun getAll(): List<BookEntity>

    @Query("SELECT * FROM books WHERE id = :id")
    fun getById(id: String): BookEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insert(book: BookEntity)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    fun insertAll(books: List<BookEntity>)
}
