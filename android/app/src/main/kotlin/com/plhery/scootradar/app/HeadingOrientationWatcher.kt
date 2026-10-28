package com.plhery.scootradar.app

import android.app.Activity
import android.hardware.display.DisplayManager
import android.os.Handler
import android.os.Looper
import android.view.Surface
import androidx.core.content.ContextCompat
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import com.plhery.scootradar.core.map.ScooterDeviceOrientation
import com.plhery.scootradar.core.map.ScooterHeadingPolicy
import com.plhery.scootradar.core.map.ScooterInterfaceOrientation

// ios/ScootRadar/Views/ScooterMapScreen.swift's heading orientation, which follows the window's interface
// orientation as it turns (X.md X-AD13).

/**
 * Tells [changed] which way up the window shows, from the display's rotation, for the heading to be the way the
 * rider faces: as the activity starts, and as the display turns, upside down included, which brings no
 * configuration change. A phone's rotation 0 is portrait; a tablet's, landscape, but the heading is read from
 * the phone's own axes, which turn with that rotation alike.
 */
class HeadingOrientationWatcher(
    private val activity: Activity,
    private val changed: (ScooterDeviceOrientation) -> Unit,
) : DefaultLifecycleObserver, DisplayManager.DisplayListener {
    /** Read once the activity has started: an activity has no system services before its onCreate. */
    private val displays by lazy { activity.getSystemService(DisplayManager::class.java) }

    override fun onStart(owner: LifecycleOwner) {
        displays?.registerDisplayListener(this, Handler(Looper.getMainLooper()))
        displayChanged()
    }

    override fun onStop(owner: LifecycleOwner) {
        displays?.unregisterDisplayListener(this)
    }

    override fun onDisplayAdded(displayId: Int) = Unit

    override fun onDisplayRemoved(displayId: Int) = Unit

    override fun onDisplayChanged(displayId: Int) {
        if (displayId == display.displayId) displayChanged()
    }

    /** The window may have turned, or moved to another display. */
    fun displayChanged() {
        changed(ScooterHeadingPolicy.deviceOrientation(interfaceOrientation(display.rotation)))
    }

    /** The display the window shows on; the phone's own while it has none yet. */
    private val display get() = ContextCompat.getDisplayOrDefault(activity)

    companion object {
        /** UIInterfaceOrientation of Surface's rotation, which turns the other way from the phone. */
        fun interfaceOrientation(rotation: Int): ScooterInterfaceOrientation = when (rotation) {
            Surface.ROTATION_0 -> ScooterInterfaceOrientation.Portrait
            Surface.ROTATION_90 -> ScooterInterfaceOrientation.LandscapeRight
            Surface.ROTATION_180 -> ScooterInterfaceOrientation.PortraitUpsideDown
            Surface.ROTATION_270 -> ScooterInterfaceOrientation.LandscapeLeft
            else -> ScooterInterfaceOrientation.Unknown
        }
    }
}
