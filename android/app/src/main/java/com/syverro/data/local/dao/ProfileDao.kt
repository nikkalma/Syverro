package com.syverro.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.syverro.data.local.entity.UserProfileEntity

@Dao
interface ProfileDao {

    @Query("SELECT * FROM user_profile WHERE id = 'default' LIMIT 1")
    fun getProfile(): UserProfileEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun saveProfile(profile: UserProfileEntity)
}