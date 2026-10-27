package com.plhery.scootradar.core.api

import com.plhery.scootradar.core.model.localized

// ScooterLoadFailure from ios/ScootRadar/Services/ScooterAPI.swift; the client comes with the network layer.

/** Why loading scooters failed. Web and iOS show the same sentence for each reason. */
enum class ScooterLoadFailure(val rawValue: String) {
    Offline("offline"),
    Timeout("timeout"),
    /** HTTP 429. */
    Busy("busy"),
    /** HTTP 5xx. */
    Unavailable("unavailable"),
    Failed("failed"),
    ;

    val message: String
        get() = when (this) {
            Offline -> localized("You’re offline. Check your connection.")
            Timeout -> localized("ScootRadar took too long to respond.")
            Busy -> localized("ScootRadar is busy right now. Try again in a moment.")
            Unavailable -> localized("ScootRadar is having trouble. Try again in a moment.")
            Failed -> localized("Couldn’t load scooters.")
        }

    companion object {
        fun fromRawValue(rawValue: String): ScooterLoadFailure? = entries.firstOrNull { it.rawValue == rawValue }
    }
}
