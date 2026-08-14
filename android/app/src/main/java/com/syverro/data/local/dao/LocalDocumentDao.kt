package com.syverro.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.syverro.data.local.entity.LocalDocumentEntity

@Dao
interface LocalDocumentDao {

    @Query("SELECT * FROM local_documents WHERE book_id = :bookId")
    fun getByBook(bookId: String): LocalDocumentEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun upsert(document: LocalDocumentEntity)

    @Query("DELETE FROM local_documents WHERE book_id = :bookId")
    fun deleteByBook(bookId: String)
}
