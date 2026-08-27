package com.syverro.presentation.library

import android.net.Uri

class UriPermissionTaker(
    private val takePersistablePermission: (Uri) -> Unit,
) {
    fun takePersistableReadPermission(uri: Uri) {
        runCatching { takePersistablePermission(uri) }
    }
}
