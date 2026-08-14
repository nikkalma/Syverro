package com.syverro.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.syverro.data.local.entity.PersonalBookEntity

@Dao
interface PersonalBookDao {

    @Query("SELECT * FROM personal_books ORDER BY updated_at DESC, title ASC")
    fun getAll(): List<PersonalBookEntity>

    @Query("SELECT * FROM personal_books WHERE id = :id")
    fun getById(id: String): PersonalBookEntity?

    @Query("SELECT * FROM personal_books WHERE reading_status = :status ORDER BY updated_at DESC, title ASC")
    fun getByStatus(status: String): List<PersonalBookEntity>

    @Query("SELECT * FROM personal_books WHERE title LIKE '%' || :query || '%' OR author_display LIKE '%' || :query || '%' ORDER BY title ASC")
    fun search(query: String): List<PersonalBookEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insert(book: PersonalBookEntity)

    @Update
    fun update(book: PersonalBookEntity)

    @Query("UPDATE personal_books SET reading_status = :status, updated_at = :updatedAt WHERE id = :id")
    fun updateStatus(id: String, status: String, updatedAt: Long)

    @Query("UPDATE personal_books SET progress = :progress, updated_at = :updatedAt WHERE id = :id")
    fun updateProgress(id: String, progress: Float, updatedAt: Long)

    @Query("UPDATE personal_books SET canonical_book_id = :canonicalId, updated_at = :updatedAt WHERE id = :id")
    fun updateCanonicalBook(id: String, canonicalId: String?, updatedAt: Long)

    @Query("DELETE FROM personal_books WHERE id = :id")
    fun delete(id: String)
}
