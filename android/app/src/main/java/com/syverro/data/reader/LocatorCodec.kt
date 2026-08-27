package com.syverro.data.reader

import org.json.JSONObject
import org.readium.r2.shared.publication.Locator
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Serializes/deserializes a Readium [Locator] to the opaque string stored in
 * `reading_position.locator`. Kept behind an interface so the reader boundary stays testable
 * without Android's `org.json`.
 */
interface LocatorCodec {
    fun serialize(locator: Locator): String?
    fun deserialize(json: String): Locator?
}

@Singleton
class ReadiumLocatorCodec @Inject constructor() : LocatorCodec {
    override fun serialize(locator: Locator): String? =
        runCatching { locator.toJSON().toString() }.getOrNull()

    override fun deserialize(json: String): Locator? =
        runCatching { Locator.fromJSON(JSONObject(json)) }.getOrNull()
}
