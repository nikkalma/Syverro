package com.syverro.presentation.profile

sealed interface ProfileEvent {
    data object OpenSettings : ProfileEvent
    data class UpdateName(val name: String) : ProfileEvent
}