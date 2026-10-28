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
import kotlinx.coroutines.delay

// ios/ScootRadar/Views/ScooterMapScreen.swift: the ask for a rating, StoreKit's requestReview after the map has
// rested (ui.md UI-106).

/** What asks the rider to rate the app in the store: StoreKit's requestReview on the iPhone. */
fun interface ReviewRequester {
    fun request()

    companion object {
        /**
         * Asks nothing yet: Play's In-App Review needs Play services and an app listed in Play Console
         * (NEEDS-USER #9), and the app takes nothing from Play services.
         */
        val none = ReviewRequester { }
    }
}

/**
 * A return from a ride that is the moment to ask for a rating (ScooterReviewPrompt): after the map has rested a few
 * seconds with nothing over it, never from a button. Anything over the map or changing on it before then ends this
 * try.
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
    LaunchedEffect(moments, nothingOverTheMap, scooter, bay) {
        if (!controller.reviewDue) return@LaunchedEffect
        if (!nothingOverTheMap) return@LaunchedEffect controller.dropReviewMoment()
        try {
            delay(ScooterReviewPrompt.settle)
        } catch (cancelled: CancellationException) {
            controller.dropReviewMoment()
            throw cancelled
        }
        if (!controller.takeReviewMoment()) return@LaunchedEffect
        requester.request()
        analytics?.track("review_ask", result = "rental_return")
    }
}
