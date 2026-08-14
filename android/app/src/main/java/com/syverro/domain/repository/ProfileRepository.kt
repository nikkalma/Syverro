package com.syverro.domain.repository

import com.syverro.domain.model.UserProfile

interface ProfileRepository {
    fun getProfile(): UserProfile
    fun updateName(name: String)
}