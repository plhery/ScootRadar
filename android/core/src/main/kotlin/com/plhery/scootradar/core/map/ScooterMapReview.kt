package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.model.ScooterDockContent

// The rating of ios/ScootRadar/ViewModels/ScooterMapModel.swift.

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

/**
 * Something went over the map, or changed on it, before the wait for [moment] was over: that moment asks no more, and
 * the next fresh load is the next one. A wait ended by the next moment leaves that one waiting.
 */
fun ScooterMapController.dropReviewMoment(moment: Int) {
    if (moment != reviewMoments.value) return
    reviewDue = false
}

/**
 * After each load: a feed that answered, its data not delayed, counts the day with use, and trouble keeps the day
 * from asking. A calm map in front, from the third day with such a feed, is then the moment to ask, once the screen
 * has seen it rest; a moment already waiting goes on waiting.
 */
internal fun ScooterMapController.reviewAfterLoad() {
    val now = clock()
    if (loadIssue.value == null && delayedStatus == null) reviewPrompt.noteUse(at = now)
    if (reviewTrouble) reviewPrompt.noteBadMoment(at = now)
    if (!isSceneActive || reviewDue || !reviewPrompt.isDue(at = now, calm = reviewCalm)) return
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
 * What makes a bad day: the feed failed or is out of date, the data shown is delayed as the dock says it, every
 * provider here is down, or the rider is where no operator shares data. An answer of feeds being collected again, as
 * the first of a view mostly is outside Switzerland, is none while none of its apps is late.
 */
private val ScooterMapController.reviewTrouble: Boolean
    get() {
        if (loadIssue.value != null || delayedStatus != null) return true
        val down = providerHealth.downProviders.toSet()
        if (down.isNotEmpty() && down.containsAll(availableProviders)) return true
        val userLocation = userLocation.value ?: return false
        return !catalog.contains(userLocation)
    }
