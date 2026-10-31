package com.plhery.scootradar.app

import android.app.Activity
import android.content.pm.ActivityInfo
import android.util.DisplayMetrics
import android.view.Display
import androidx.core.content.ContextCompat
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
     * unfolded on its inner one. It is counted at the screen's own density, not at the one the rider's Display size
     * sets, so that a tablet stays a tablet at every Display size, as an iPad stays one under Display Zoom: a 2560 by
     * 1600 tablet at 320 dpi is 800 dp across, which its largest Display size would make 533 (X-M25).
     */
    fun smallestWidth(activity: Activity): Int {
        val bounds = activity.windowManager.maximumWindowMetrics.bounds
        val screen = ContextCompat.getDisplayOrDefault(activity).displayId
        val dpi = screenDensity(screen, current = activity.resources.configuration.densityDpi)
        return (min(bounds.width(), bounds.height()) * DisplayMetrics.DENSITY_DEFAULT / dpi.toFloat()).toInt()
    }

    /**
     * The density a screen counts as its own: for the device's built-in screen the one it was made with, which
     * Display size leaves alone; for another, a monitor's, the `current` one, as Android keeps no other for it.
     */
    internal fun screenDensity(displayId: Int, current: Int, stable: Int = DisplayMetrics.DENSITY_DEVICE_STABLE): Int =
        if (displayId == Display.DEFAULT_DISPLAY) stable else current

    /** Asks for the orientation of the screen the activity is on now, if it isn't asked for already. */
    fun apply(activity: Activity) {
        val orientation = requested(smallestWidth(activity))
        if (activity.requestedOrientation != orientation) activity.requestedOrientation = orientation
    }
}
