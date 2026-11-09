package com.plhery.scootradar.app

import android.app.Activity
import com.google.android.gms.tasks.Task
import com.google.android.play.core.review.ReviewInfo
import com.google.android.play.core.review.ReviewManager
import com.plhery.scootradar.ui.ReviewRequester

// ios/ScootRadar/Views/ScooterMapScreen.swift: `@Environment(\.requestReview)` (ui.md UI-106, PARITY X-AD27, LOG-310).

/**
 * Google Play's card to rate the app, where the iPhone's app asks StoreKit's requestReview. Play shows it only so
 * often, and not at all in a copy of the app it didn't install or on a phone without its store; it never says
 * whether it showed or what was given, so nothing that fails is told to the rider. What the card needs is asked for
 * as the map starts to rest ([prepare]), as Google asks, and the card is shown in [activity] when the rest ends.
 */
class PlayReviewRequester(
    private val manager: ReviewManager,
    private val activity: Activity,
) : ReviewRequester {
    /** What Play was asked for as the map began to rest, used by the ask at its end. */
    private var prepared: Task<ReviewInfo>? = null

    override fun prepare() {
        prepared = manager.requestReviewFlow()
    }

    override fun request() {
        val asked = prepared ?: manager.requestReviewFlow()
        prepared = null
        // Heard only while the activity shows: one left before Play answered shows no card.
        asked.addOnCompleteListener(activity) { answer ->
            if (!answer.isSuccessful || activity.isFinishing || activity.isDestroyed) return@addOnCompleteListener
            manager.launchReviewFlow(activity, answer.result)
        }
    }
}
