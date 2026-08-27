package com.syverro.presentation.reader

import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.fragment.app.FragmentActivity
import androidx.fragment.app.FragmentFactory
import com.syverro.ui.theme.SyverroTheme
import dagger.hilt.android.AndroidEntryPoint
import org.readium.r2.navigator.epub.EpubNavigatorFragment

/**
 * Full-screen EPUB reader hosting the Readium navigator fragment.
 *
 * The reader is opened through the `reader/{personalBookId}` route in the navigation graph; this
 * separate activity hosts the navigator so the fragment factory can be installed before Android
 * restores fragment state (see [onCreate]).
 */
@AndroidEntryPoint
class ReaderActivity : FragmentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // EpubNavigatorFragment has no no-arg constructor. Install a dummy factory before the
        // FragmentManager restores its state, otherwise process-death restoration would crash.
        supportFragmentManager.fragmentFactory = EpubNavigatorFragment.createDummyFactory()
        super.onCreate(savedInstanceState)

        if (savedInstanceState != null) {
            // A killed process is being restored. The dummy fragment cannot render and would throw
            // in onResume; remove it now and reload from the persisted reading position instead.
            supportFragmentManager.fragmentFactory = FragmentFactory()
            val transaction = supportFragmentManager.beginTransaction()
            supportFragmentManager.fragments.forEach { transaction.remove(it) }
            transaction.commitNow()
        }

        enableEdgeToEdge()
        val bookId = intent.getStringExtra(EXTRA_BOOK_ID)
        setContent {
            SyverroTheme {
                ReaderScreen(
                    bookId = bookId,
                    onBack = { finish() },
                )
            }
        }
    }

    companion object {
        const val EXTRA_BOOK_ID = "extra_book_id"

        fun intent(context: Context, bookId: String): Intent =
            Intent(context, ReaderActivity::class.java).putExtra(EXTRA_BOOK_ID, bookId)
    }
}
