package com.syverro.presentation.home

sealed interface HomeEvent {
    data object ContinueReading : HomeEvent
    data object ViewLibrary : HomeEvent
}