package com.plhery.scootradar.map

import android.graphics.Rect
import android.view.View
import androidx.activity.ComponentActivity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.core.graphics.Insets
import androidx.core.view.DisplayCutoutCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

/**
 * What the map's markers take from the window's insets for the counts under the system's bars: on a punch-hole phone
 * held sideways, 640 by 360, its status bar 24, the camera's hole on the left.
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w640dp-h360dp-mdpi")
class MapBarsTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private lateinit var view: View
    private var bars: MapInsets? = null
    private var safeArea: MapInsets? = null

    /** The hole, 34 wide at the window's left, 160 down. */
    private val hole = Rect(0, 160, 34, 200)

    /**
     * The safe area counts the cutout's inset down the whole left side; the bars over the sides, which the counts keep
     * clear of, are the navigation bar's alone (ScooterMarkerScene.countChrome): the hole is a cutout of its own.
     */
    @Test
    fun theBarsOverTheMapLeaveACutoutsSideOut() {
        show()
        dispatch(navigation = Insets.of(0, 0, 48, 0), cutout = hole)
        assertEquals(MapInsets(top = 24.0, left = 34.0, bottom = 0.0, right = 48.0), safeArea)
        assertEquals(MapInsets(top = 24.0, left = 0.0, bottom = 0.0, right = 48.0), bars)
    }

    private fun show() {
        compose.setContent {
            view = LocalView.current
            bars = mapBars()
            safeArea = mapSafeInsets()
        }
        compose.waitForIdle()
    }

    /** The window's insets: the status bar, the navigation bar as given, and the cutout's hole, if any. */
    private fun dispatch(navigation: Insets, cutout: Rect?) {
        compose.runOnIdle {
            val insets = WindowInsetsCompat.Builder()
                .setInsets(WindowInsetsCompat.Type.statusBars(), Insets.of(0, 24, 0, 0))
                .setInsets(WindowInsetsCompat.Type.navigationBars(), navigation)
            if (cutout != null) {
                insets.setInsets(WindowInsetsCompat.Type.displayCutout(), Insets.of(cutout.right, 0, 0, 0))
                insets.setDisplayCutout(DisplayCutoutCompat(Rect(cutout.right, 0, 0, 0), listOf(cutout)))
            }
            ViewCompat.dispatchApplyWindowInsets(view, insets.build())
        }
        compose.waitForIdle()
    }
}
