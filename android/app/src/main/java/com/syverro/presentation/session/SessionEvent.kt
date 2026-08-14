package com.syverro.presentation.session

sealed interface SessionEvent {
    data object StartSession : SessionEvent
    data object PauseSession : SessionEvent
    data object ResumeSession : SessionEvent
    data object FinishSession : SessionEvent
    data object ConfirmFinish : SessionEvent
    data object DismissFinish : SessionEvent
    data object ShowQuoteSheet : SessionEvent
    data class SubmitQuote(val text: String) : SessionEvent
    data object DismissQuoteSheet : SessionEvent
}