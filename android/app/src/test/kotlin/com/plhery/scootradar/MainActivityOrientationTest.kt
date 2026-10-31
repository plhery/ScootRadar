package com.plhery.scootradar

import android.content.pm.ActivityInfo
import android.util.DisplayMetrics
import android.view.Display
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.app.ScreenOrientation
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

// The iPhone's app is upright only and the iPad's turns all four ways (INFOPLIST_KEY_UISupportedInterfaceOrientations
// and its _iPad): a phone's screen stays upright, a larger one turns, and a foldable unfolded starts turning. Display
// size changes neither: an iPad stays an iPad under Display Zoom (X-M25).

@RunWith(AndroidJUnit4::class)
class MainActivityOrientationTest {
    /** The device's own density, which Display size leaves alone: Robolectric leaves it at 160 whatever the test's. */
    private val stable = DisplayMetrics::class.java.getField("DENSITY_DEVICE_STABLE")
    private val stableAtStart = stable.getInt(null)

    @After
    fun restoreTheStableDensity() {
        stable.setInt(null, stableAtStart)
    }

    /** A device whose screen is `dpi` at its default Display size. */
    private fun screenOwnDensity(dpi: Int) = stable.setInt(null, dpi)

    @Test
    fun aScreenUnder600DpAcrossItsShorterSideIsAPhones() {
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, ScreenOrientation.requested(smallestWidth = 360))
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, ScreenOrientation.requested(smallestWidth = 599))
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_FULL_USER, ScreenOrientation.requested(smallestWidth = 600))
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_FULL_USER, ScreenOrientation.requested(smallestWidth = 800))
    }

    @Test
    @Config(qualifiers = "w412dp-h915dp-xxhdpi")
    fun aPhoneStaysUpright() {
        screenOwnDensity(480)
        val activity = Robolectric.buildActivity(MainActivity::class.java).create().get()
        assertEquals(412, ScreenOrientation.smallestWidth(activity))
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, activity.requestedOrientation)
    }

    @Test
    @Config(qualifiers = "w1280dp-h800dp-xhdpi")
    fun aTabletTurnsEveryWay() {
        screenOwnDensity(320)
        val activity = Robolectric.buildActivity(MainActivity::class.java).create().get()
        assertEquals(800, ScreenOrientation.smallestWidth(activity))
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_FULL_USER, activity.requestedOrientation)
    }

    @Test
    @Config(qualifiers = "w412dp-h915dp-xxhdpi")
    fun aFoldableUnfoldedTurnsAndFoldedStaysUprightAgain() {
        screenOwnDensity(480)
        val controller = Robolectric.buildActivity(MainActivity::class.java).create()
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, controller.get().requestedOrientation)

        RuntimeEnvironment.setQualifiers("w841dp-h701dp-xxhdpi")
        controller.configurationChange(RuntimeEnvironment.getApplication().resources.configuration)
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_FULL_USER, controller.get().requestedOrientation)

        RuntimeEnvironment.setQualifiers("w412dp-h915dp-xxhdpi")
        controller.configurationChange(RuntimeEnvironment.getApplication().resources.configuration)
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, controller.get().requestedOrientation)
    }

    // The Tablet, 2560 x 1600 px at 320 dpi, with Display size at its largest, 480 dpi: 854 x 534 dp, which Android
    // counts as a phone's; the app was asked upright and drawn in a box between two black bands (X-M25).
    @Test
    @Config(qualifiers = "w854dp-h534dp-xxhdpi")
    fun aTabletAtTheLargestDisplaySizeStillTurnsEveryWay() {
        screenOwnDensity(320)
        val activity = Robolectric.buildActivity(MainActivity::class.java).create().get()
        assertEquals(801, ScreenOrientation.smallestWidth(activity))
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_FULL_USER, activity.requestedOrientation)
    }

    // Phone_Min, 720 x 1280 px at 320 dpi, with Display size at its largest, 360 dpi: 320 x 569 dp, upright as ever.
    @Test
    @Config(qualifiers = "w320dp-h569dp-360dpi")
    fun aPhoneAtTheLargestDisplaySizeStaysUpright() {
        screenOwnDensity(320)
        val activity = Robolectric.buildActivity(MainActivity::class.java).create().get()
        assertEquals(360, ScreenOrientation.smallestWidth(activity))
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, activity.requestedOrientation)
    }

    @Test
    fun aMonitorCountsAtItsCurrentDensityAndTheBuiltInScreenAtItsOwn() {
        assertEquals(320, ScreenOrientation.screenDensity(Display.DEFAULT_DISPLAY, current = 480, stable = 320))
        assertEquals(160, ScreenOrientation.screenDensity(displayId = 2, current = 160, stable = 420))
    }
}
