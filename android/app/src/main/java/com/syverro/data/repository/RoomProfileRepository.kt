package com.syverro.data.repository

import com.syverro.data.local.dao.ProfileDao
import com.syverro.data.local.entity.UserProfileEntity
import com.syverro.domain.model.UserProfile
import com.syverro.domain.repository.ProfileRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RoomProfileRepository @Inject constructor(
    private val profileDao: ProfileDao,
) : ProfileRepository {

    override fun getProfile(): UserProfile {
        val entity = profileDao.getProfile() ?: UserProfileEntity()
        return UserProfile(
            name = entity.displayName,
            booksRead = 0,
            finishedBooks = 0,
            totalReadingTimeSeconds = 0,
            insight = "",
        )
    }

    override fun updateName(name: String) {
        val existing = profileDao.getProfile()
        val entity = if (existing != null) {
            existing.copy(displayName = name, updatedAt = System.currentTimeMillis())
        } else {
            UserProfileEntity(displayName = name)
        }
        profileDao.saveProfile(entity)
    }
}