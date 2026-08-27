package com.syverro.di

import com.syverro.data.local.document.AttachmentImporter
import com.syverro.data.local.document.DefaultAttachmentImporter
import com.syverro.data.reader.LocatorCodec
import com.syverro.data.reader.PublicationFetcher
import com.syverro.data.reader.ReadiumLocatorCodec
import com.syverro.data.reader.ReadiumPublicationFetcher
import com.syverro.data.reader.ReadiumReaderSession
import com.syverro.data.reader.ReaderSession
import com.syverro.data.repository.RoomBookRepository
import com.syverro.data.repository.RoomLocalDocumentRepository
import com.syverro.data.repository.RoomPersonalBookRepository
import com.syverro.data.repository.RoomProfileRepository
import com.syverro.data.repository.RoomReadingPositionRepository
import com.syverro.data.repository.RoomSessionRepository
import com.syverro.domain.repository.BookRepository
import com.syverro.domain.repository.LocalDocumentRepository
import com.syverro.domain.repository.PersonalBookRepository
import com.syverro.domain.repository.ProfileRepository
import com.syverro.domain.repository.ReadingPositionRepository
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

    @Binds
    @Singleton
    abstract fun bindLocalDocumentRepository(impl: RoomLocalDocumentRepository): LocalDocumentRepository

    @Binds
    @Singleton
    abstract fun bindReadingPositionRepository(impl: RoomReadingPositionRepository): ReadingPositionRepository

    @Binds
    @Singleton
    abstract fun bindAttachmentImporter(impl: DefaultAttachmentImporter): AttachmentImporter

    @Binds
    @Singleton
    abstract fun bindReaderSession(impl: ReadiumReaderSession): ReaderSession

    @Binds
    @Singleton
    abstract fun bindPublicationFetcher(impl: ReadiumPublicationFetcher): PublicationFetcher

    @Binds
    @Singleton
    abstract fun bindLocatorCodec(impl: ReadiumLocatorCodec): LocatorCodec
}
