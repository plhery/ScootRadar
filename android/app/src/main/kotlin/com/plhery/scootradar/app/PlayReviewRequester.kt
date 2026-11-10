package com.plhery.scootradar.app

import android.annotation.SuppressLint
import android.app.Activity
import android.util.Log
import com.google.android.gms.tasks.Task
import com.google.android.play.core.review.ReviewInfo
import com.google.android.play.core.review.ReviewManager
import com.plhery.scootradar.BuildConfig
import com.plhery.scootradar.ui.ReviewRequester

// ios/ScootRadar/Views/ScooterMapScreen.swift: `@Environment(\.requestReview)` (ui.md UI-106, PARITY X-AD27, LOG-310).

/**
 * Google Play's card to rate the app, where the iPhone's app asks StoreKit's requestReview. Play shows it only so
 * often, and not at all in a copy of the app it didn't install or on a phone without its store; it never says
 * whether it showed or what was given, so nothing that fails is told to the rider. What the card needs is asked for
 * as the map starts to rest at a moment to ask ([prepare]), so that the card comes when the rest ends, in [activity];
 * a rest that a touch or something over the map ends early leaves it unused, and the next rest asks for it again.
 * A touch or a key after the ask, before Play has answered, takes it back ([noteInteraction]): the card is shown only
 * while the map is still at rest. Play's manager, from [managerOf], is made at the first of these, not as the app
 * starts.
 */
class PlayReviewRequester(
    private val activity: Activity,
    managerOf: () -> ReviewManager,
) : ReviewRequester {
    private val manager by lazy(LazyThreadSafetyMode.NONE, managerOf)

    /** What Play was asked for as the map began to rest, used by the ask at its end. */
    private var prepared: Task<ReviewInfo>? = null

    /** How many touches and keys there have been, which an ask compares when Play answers. */
    private var interactions = 0

    /**
     * A touch or a key anywhere in the window, a mouse's wheel, or TalkBack's finger finding its way (MainActivity, as
     * the controller's noteInteraction): an ask Play has not answered yet shows no card, as the rider is panning or
     * typing by then (week review, finding 6.3).
     */
    fun noteInteraction() {
        interactions += 1
    }

    override fun prepare() {
        prepared = manager.requestReviewFlow()
    }

    // The app keeps no log of its own, nor Timber: one line, in debug builds only, says the ask went (LOG-312).
    @SuppressLint("LogNotTimber")
    override fun request(stillAsked: () -> Boolean) {
        // One Play failed to answer is asked again.
        val asked = prepared?.takeUnless { it.isComplete && !it.isSuccessful } ?: manager.requestReviewFlow()
        prepared = null
        val touched = interactions
        // Heard only while the activity shows: one left before Play answered shows no card, nor does a map with
        // something come over it or a touch on it by then.
        asked.addOnCompleteListener(activity) { answer ->
            if (!answer.isSuccessful || !stillAsked() || interactions != touched || activity.isFinishing || activity.isDestroyed) {
                return@addOnCompleteListener
            }
            manager.launchReviewFlow(activity, answer.result).addOnCompleteListener {
                if (BuildConfig.DEBUG) Log.i(TAG, "Google Play asked for its card to rate the app")
            }
        }
    }

    private companion object {
        const val TAG = "ScootRadar"
    }
}
