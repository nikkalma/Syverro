package com.syverro.presentation.library

import android.net.Uri
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class UriPermissionTakerTest {

    @Test
    fun persistablePermissionFailure_doesNotBlockImportDispatch() {
        val denied = UriPermissionTaker { throw SecurityException("persistable permission denied") }
        denied.takePersistableReadPermission(Uri.parse("content://provider/a.epub"))
    }

    @Test
    fun persistablePermissionGrant_succeedsQuietly() {
        var taken: Uri? = null
        val taker = UriPermissionTaker { uri -> taken = uri }
        taker.takePersistableReadPermission(Uri.parse("content://provider/a.epub"))
        assert(taken == Uri.parse("content://provider/a.epub"))
    }
}
