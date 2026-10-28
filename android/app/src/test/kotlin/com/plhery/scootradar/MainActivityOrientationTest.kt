package com.plhery.scootradar

import android.content.pm.ActivityInfo
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.app.ScreenOrientation
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

// The iPhone's app is upright only and the iPad's turns all four ways (INFOPLIST_KEY_UISupportedInterfaceOrientations
// and its _iPad): a phone's screen stays upright, a larger one turns, and a foldable unfolded starts turning.

@RunWith(AndroidJUnit4::class)
class MainActivityOrientationTest {
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
        val activity = Robolectric.buildActivity(MainActivity::class.java).create().get()
        assertEquals(412, ScreenOrientation.smallestWidth(activity))
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, activity.requestedOrientation)
    }

    @Test
    @Config(qualifiers = "w1280dp-h800dp-xhdpi")
    fun aTabletTurnsEveryWay() {
        val activity = Robolectric.buildActivity(MainActivity::class.java).create().get()
        assertEquals(800, ScreenOrientation.smallestWidth(activity))
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_FULL_USER, activity.requestedOrientation)
    }

    @Test
    @Config(qualifiers = "w412dp-h915dp-xxhdpi")
    fun aFoldableUnfoldedTurnsAndFoldedStaysUprightAgain() {
        val controller = Robolectric.buildActivity(MainActivity::class.java).create()
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, controller.get().requestedOrientation)

        RuntimeEnvironment.setQualifiers("w841dp-h701dp")
        controller.configurationChange(RuntimeEnvironment.getApplication().resources.configuration)
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_FULL_USER, controller.get().requestedOrientation)

        RuntimeEnvironment.setQualifiers("w412dp-h915dp")
        controller.configurationChange(RuntimeEnvironment.getApplication().resources.configuration)
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, controller.get().requestedOrientation)
    }
}
