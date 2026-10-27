package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterProviderCoverage

// The rating of ios/ScootRadar/ViewModels/ScooterMapModel.swift.

/** "Open in" took the rider to the operator's app: the return from the ride may be the moment to ask for a rating. */
fun ScooterMapController.rentalOpened() {
    reviewPrompt.noteRentalOpened(at = clock())
}

/**
 * The screen asks for a rating now, once the map has rested since the moment came: true once, while the map
 * is still calm and nothing went wrong meanwhile.
 */
fun ScooterMapController.takeReviewMoment(): Boolean {
    if (!reviewDue) return false
    reviewDue = false
    val now = clock()
    if (!reviewPrompt.isDue(at = now, calm = reviewCalm)) return false
    reviewPrompt.asked(at = now)
    return true
}

/** Something went over the map, or changed on it, before the wait was over: this return asks no more. */
fun ScooterMapController.dropReviewMoment() {
    reviewDue = false
}

/** Back in front: a return 5 minutes to 2 hours after "Open in" waits for the next load. */
internal fun ScooterMapController.noteReturnFromRide() {
    if (reviewPrompt.takeRentalReturn(at = clock())) awaitsReviewLoad = true
}

/**
 * After each load: a fresh feed counts the day with use, and trouble keeps the day from asking. A return from
 * a ride that waited for this load is the moment to ask when the map is calm.
 */
internal fun ScooterMapController.reviewAfterLoad() {
    val now = clock()
    if (loadIssue.value == null && responseMetadata.value?.stale != true) reviewPrompt.noteUse(at = now)
    if (reviewTrouble) reviewPrompt.noteBadMoment(at = now)
    if (!awaitsReviewLoad) return
    awaitsReviewLoad = false
    if (!reviewPrompt.isDue(at = now, calm = reviewCalm)) return
    reviewDue = true
    _reviewMoments.value += 1
}

/**
 * The map at rest with a healthy feed: the count and its chips, in the dock or the panel, folded or not, not a
 * card or a reason for an empty map; no location being found or gone wrong, no walk, no scooters faded while
 * they are collected again. What is over the map, the search, the sheets and the popover, is the screen's.
 */
private val ScooterMapController.reviewCalm: Boolean
    get() {
        if (dock !is ScooterDockContent.Summary || isLocating.value || locationIssue.value != null || isWalking || isFilling) {
            return false
        }
        return !reviewTrouble
    }

/**
 * What makes a bad day: the feed failed or is out of date, the data shown is delayed, every provider here is
 * down, or the rider is where no operator shares data.
 */
private val ScooterMapController.reviewTrouble: Boolean
    get() {
        if (loadIssue.value != null || responseMetadata.value?.stale == true) return true
        val down = providerHealth.downProviders.toSet()
        if (down.isNotEmpty() && down.containsAll(availableProviders)) return true
        val userLocation = userLocation.value ?: return false
        return !ScooterProviderCoverage.contains(latitude = userLocation.latitude, longitude = userLocation.longitude)
    }
