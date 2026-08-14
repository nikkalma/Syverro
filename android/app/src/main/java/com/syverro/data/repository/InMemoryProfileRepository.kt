package com.syverro.data.repository

import com.syverro.domain.model.UserProfile
import com.syverro.domain.repository.ProfileRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class InMemoryProfileRepository @Inject constructor() : ProfileRepository {

    private var profile = UserProfile(
        name = "Reader",
        booksRead = 0,
        finishedBooks = 0,
        totalReadingTimeSeconds = 0,
        insight = "You haven't started reading yet. Open a book and begin — your reading portrait will emerge naturally.",
    )

    override fun getProfile(): UserProfile = profile

    override fun updateName(name: String) {
        profile = profile.copy(name = name)
    }

    fun updateStats(booksRead: Int, finishedBooks: Int, totalSeconds: Long) {
        val insight = generateInsight(booksRead, finishedBooks, totalSeconds)
        profile = profile.copy(
            booksRead = booksRead,
            finishedBooks = finishedBooks,
            totalReadingTimeSeconds = totalSeconds,
            insight = insight,
        )
    }

    private fun generateInsight(booksRead: Int, finishedBooks: Int, totalSeconds: Long): String {
        if (booksRead == 0) return "You haven't started reading yet. Open a book and begin."
        if (totalSeconds < 3600) return "You're just getting started. Every page adds to your story."
        val hours = totalSeconds / 3600
        return when {
            hours < 5 -> "You usually read in short bursts. A quiet corner and a few minutes is all you need."
            finishedBooks >= 2 -> "You have a habit of finishing what you start. A deliberate reader."
            else -> "You read with intention. Let the rhythm carry you."
        }
    }
}