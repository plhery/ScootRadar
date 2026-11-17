package com.plhery.scootradar.app

import android.app.Activity
import com.plhery.scootradar.ui.ReviewRequester

/**
 * None in the build for F-Droid's catalog, which takes no library that isn't free software, as Google Play's review
 * library isn't: the map waits for no moment to ask, and asks and counts nothing (ScooterMapScreen). The play flavor's
 * StoreReview asks Google Play.
 */
@Suppress("UNUSED_PARAMETER")
internal fun storeReviewRequester(activity: Activity, standIn: () -> Boolean): ReviewRequester? = null
