package com.plhery.scootradar.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.plhery.scootradar.core.api.ScooterAnalytics
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.dropReviewMoment
import com.plhery.scootradar.core.map.takeReviewMoment
import com.plhery.scootradar.core.model.ScooterReviewPrompt
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.delay

// ios/ScootRadar/Views/ScooterMapScreen.swift: the ask for a rating, StoreKit's requestReview after the map has
// rested (ui.md UI-106).

/**
 * What asks the rider to rate the app in the store: StoreKit's requestReview on the iPhone, Google Play's card here
 * (app/PlayReviewRequester).
 */
fun interface ReviewRequester {
    /**
     * Asks the store to show its card, which it may not: it shows it only so often, and says nothing either way.
     * The store may answer late: it shows none once [stillAsked] says no.
     */
    fun request(stillAsked: () -> Boolean)

    /**
     * The map has started to rest at a moment to ask: what the store needs for its card may be fetched now, so the
     * card comes when the rest ends, as the iPhone's sheet does.
     */
    fun prepare() {}

    companion object {
        /** Asks nothing: a test's screen, or a preview's. */
        val none = ReviewRequester { }
    }
}

/**
 * A calm map that is the moment to ask for a rating (ScooterReviewPrompt): after it has rested a few seconds with
 * nothing over it and no touch, never from a button. Anything over the map or changing on it before then ends this
 * try, as does a touch (the controller's noteInteraction), and the next fresh load brings another, which this try,
 * ended by it, leaves waiting; so does anything over the map before the store answers its card, as the iPhone's sheet
 * comes at once, and a touch then, which Play's requester hears from the activity (PlayReviewRequester.noteInteraction).
 */
@Composable
internal fun ReviewWhenTheMapRests(
    controller: ScooterMapController,
    nothingOverTheMap: Boolean,
    requester: ReviewRequester,
    analytics: ScooterAnalytics?,
) {
    val moments by controller.reviewMoments.collectAsStateWithLifecycle()
    val scooter by controller.selectedScooterID.collectAsStateWithLifecycle()
    val bay by controller.selectedParkingID.collectAsStateWithLifecycle()
    // The moment this try waits for, as the keys saw it.
    val moment = moments
    LaunchedEffect(moments, nothingOverTheMap, scooter, bay) {
        if (!controller.reviewDue) return@LaunchedEffect
        if (!nothingOverTheMap) return@LaunchedEffect controller.dropReviewMoment(moment)
        requester.prepare()
        try {
            delay(ScooterReviewPrompt.settle)
        } catch (cancelled: CancellationException) {
            controller.dropReviewMoment(moment)
            throw cancelled
        }
        if (!controller.takeReviewMoment()) return@LaunchedEffect
        var asking = true
        requester.request { asking }
        analytics?.track("review_ask", result = "calm_map")
        try {
            awaitCancellation()
        } finally {
            asking = false
        }
    }
}
