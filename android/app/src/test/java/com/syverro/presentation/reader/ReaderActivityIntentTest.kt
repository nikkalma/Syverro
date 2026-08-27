package com.syverro.presentation.reader

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * Verifies the `reader/{personalBookId}` entry contract: [ReaderActivity.intent] always carries the
 * personal book id so the reader can open the right publication.
 */
@RunWith(RobolectricTestRunner::class)
class ReaderActivityIntentTest {

    private fun context(): Context = ApplicationProvider.getApplicationContext()

    @Test
    fun intent_targetsReaderActivity() {
        val intent = ReaderActivity.intent(context(), "book-1")
        assertEquals(ReaderActivity::class.java.name, intent.component?.className)
        assertNotNull(intent.component)
    }

    @Test
    fun intent_carriesPersonalBookId() {
        val intent = ReaderActivity.intent(context(), "book-abc")
        assertEquals("book-abc", intent.getStringExtra(ReaderActivity.EXTRA_BOOK_ID))
    }

    @Test
    fun intent_withoutExtra_returnsNullBookId() {
        val intent = ReaderActivity.intent(context(), "book-1")
        intent.removeExtra(ReaderActivity.EXTRA_BOOK_ID)
        assertNull(intent.getStringExtra(ReaderActivity.EXTRA_BOOK_ID))
    }
}
