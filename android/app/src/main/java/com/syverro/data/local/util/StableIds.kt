package com.syverro.data.local.util

import java.util.UUID

object StableIds {

    fun personalBookId(canonicalBookId: String): String =
        UUID.nameUUIDFromBytes("personal:$canonicalBookId".toByteArray(Charsets.UTF_8)).toString()

    fun sessionSyncId(sessionId: Long): String =
        UUID.nameUUIDFromBytes("session:$sessionId".toByteArray(Charsets.UTF_8)).toString()

    fun quoteSyncId(quoteId: Long): String =
        UUID.nameUUIDFromBytes("quote:$quoteId".toByteArray(Charsets.UTF_8)).toString()
}
