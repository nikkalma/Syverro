package com.syverro.domain.model

enum class Provenance(val storageValue: String) {
    READER_OBSERVED("reader_observed"),
    MANUAL_TRACKED("manual_tracked"),
    HISTORICAL_IMPORT("historical_import");

    companion object {
        fun fromStorage(value: String): Provenance = when (value) {
            READER_OBSERVED.storageValue -> READER_OBSERVED
            MANUAL_TRACKED.storageValue -> MANUAL_TRACKED
            HISTORICAL_IMPORT.storageValue -> HISTORICAL_IMPORT
            else -> MANUAL_TRACKED
        }
    }
}
