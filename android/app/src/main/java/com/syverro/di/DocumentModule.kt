package com.syverro.di

import android.content.Context
import com.syverro.data.local.document.AppDocumentStorage
import com.syverro.data.local.document.DocumentStorage
import com.syverro.data.local.document.PublicationMetadataExtractor
import com.syverro.data.local.document.ReadiumPublicationMetadataExtractor
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import org.readium.r2.shared.util.asset.AssetRetriever
import org.readium.r2.shared.util.http.DefaultHttpClient
import org.readium.r2.shared.util.http.HttpClient
import org.readium.r2.streamer.PublicationOpener
import org.readium.r2.streamer.parser.DefaultPublicationParser
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DocumentModule {

    @Provides
    @Singleton
    fun provideHttpClient(): HttpClient = DefaultHttpClient()

    @Provides
    @Singleton
    fun provideAssetRetriever(
        @ApplicationContext context: Context,
        httpClient: HttpClient,
    ): AssetRetriever = AssetRetriever(context.contentResolver, httpClient)

    @Provides
    @Singleton
    fun providePublicationOpener(
        @ApplicationContext context: Context,
        httpClient: HttpClient,
        assetRetriever: AssetRetriever,
    ): PublicationOpener = PublicationOpener(
        DefaultPublicationParser(context, httpClient, assetRetriever, pdfFactory = null),
    )

    @Provides
    @Singleton
    fun provideDocumentStorage(@ApplicationContext context: Context): DocumentStorage {
        return AppDocumentStorage(context)
    }

    @Provides
    @Singleton
    fun providePublicationMetadataExtractor(
        assetRetriever: AssetRetriever,
        publicationOpener: PublicationOpener,
    ): PublicationMetadataExtractor {
        return ReadiumPublicationMetadataExtractor(assetRetriever, publicationOpener)
    }
}
