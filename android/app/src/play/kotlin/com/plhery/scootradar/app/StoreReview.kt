package com.plhery.scootradar.app

import android.app.Activity
import com.google.android.play.core.review.ReviewManagerFactory
import com.google.android.play.core.review.testing.FakeReviewManager
import com.plhery.scootradar.ui.ReviewRequester

/**
 * The store's card to rate the app in the build for Google Play: Play's own ([PlayReviewRequester]), made at the first
 * ask. Where [standIn] says so then (a debug build launched with ReviewPromptDue), Play's stand-in answers as Play
 * would, as Play shows its card only in a copy it installed. The fdroid flavor's StoreReview has none.
 */
internal fun storeReviewRequester(activity: Activity, standIn: () -> Boolean): ReviewRequester? =
    PlayReviewRequester(activity) {
        val context = activity.applicationContext
        if (standIn()) FakeReviewManager(context) else ReviewManagerFactory.create(context)
    }
