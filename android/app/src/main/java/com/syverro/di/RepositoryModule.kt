package com.syverro.di

import com.syverro.data.repository.RoomBookRepository
import com.syverro.data.repository.RoomPersonalBookRepository
import com.syverro.data.repository.RoomProfileRepository
import com.syverro.data.repository.RoomSessionRepository
import com.syverro.domain.repository.BookRepository
import com.syverro.domain.repository.PersonalBookRepository
import com.syverro.domain.repository.ProfileRepository
import com.syverro.domain.repository.SessionRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindBookRepository(impl: RoomBookRepository): BookRepository

    @Binds
    @Singleton
    abstract fun bindPersonalBookRepository(impl: RoomPersonalBookRepository): PersonalBookRepository

    @Binds
    @Singleton
    abstract fun bindSessionRepository(impl: RoomSessionRepository): SessionRepository

    @Binds
    @Singleton
    abstract fun bindProfileRepository(impl: RoomProfileRepository): ProfileRepository
}
