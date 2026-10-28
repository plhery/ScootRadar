package com.plhery.scootradar.app

import android.app.Activity
import android.content.pm.ActivityInfo
import kotlin.math.min

// INFOPLIST_KEY_UISupportedInterfaceOrientations and its _iPad, from ios/ScootRadar.xcodeproj/project.pbxproj.

/**
 * The ways up the app's screen turns, as the iPhone's and the iPad's lists have them: a phone's stays upright, as
 * the iPhone's does, and a tablet's, an unfolded foldable's or a large screen's turns all four ways, as the iPad's
 * does, unless the rider has locked the rotation.
 */
object ScreenOrientation {
    /** A screen less than this many dp across its shorter side is a phone's: Android's own line for a tablet. */
    const val PHONE_UNDER = 600

    /** The orientation the activity asks for on a screen `smallestWidth` dp across its shorter side. */
    fun requested(smallestWidth: Int): Int =
        if (smallestWidth < PHONE_UNDER) ActivityInfo.SCREEN_ORIENTATION_PORTRAIT else ActivityInfo.SCREEN_ORIENTATION_FULL_USER

    /**
     * The shorter side of the screen the activity is on, in dp: of the largest window it could have there, so that
     * a small window on a tablet's screen turns as the tablet does. A foldable folded shows on its outer screen and
     * unfolded on its inner one.
     */
    fun smallestWidth(activity: Activity): Int {
        val bounds = activity.windowManager.maximumWindowMetrics.bounds
        val density = activity.resources.configuration.densityDpi / 160f
        return (min(bounds.width(), bounds.height()) / density).toInt()
    }

    /** Asks for the orientation of the screen the activity is on now, if it isn't asked for already. */
    fun apply(activity: Activity) {
        val orientation = requested(smallestWidth(activity))
        if (activity.requestedOrientation != orientation) activity.requestedOrientation = orientation
    }
}
