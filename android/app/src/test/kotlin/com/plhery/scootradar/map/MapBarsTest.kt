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
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.ScooterCluster
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * What the map's markers take from the window's insets for the counts under the system's bars: on a phone held
 * sideways, 640 by 360, its status bar 24, with gesture navigation or a 3-button bar, and a camera's hole on the left.
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w640dp-h360dp-mdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MapBarsTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private val art = ScooterMarkerArt(3f, MarkerFonts.of(ApplicationProvider.getApplicationContext()))

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
        dispatch(navigation = Insets.of(0, 0, 48, 0), tappable = Insets.of(0, 24, 48, 0), cutout = hole)
        assertEquals(MapInsets(top = 24.0, left = 34.0, bottom = 0.0, right = 48.0), safeArea)
        assertEquals(MapInsets(top = 24.0, left = 0.0, bottom = 0.0, right = 48.0), bars)
    }

    /**
     * The phone's bottom corners: gesture navigation's inset, 24 at the foot, covers nothing but the thin handle, and
     * hides no count there; the 3-button bar's, which takes taps, at the foot or at a side, still does.
     */
    @Test
    fun gestureNavigationsInsetHidesNoCountAtTheFootThe3ButtonBarsDoes() {
        show()
        fun hiddenAtTheCorners(): List<String> {
            val bars = checkNotNull(bars)
            val map = FlatMarkerMap(width = 640.0, height = 360.0, safeTop = 24.0, safeBottom = 24.0, bars = bars)
            val scene = ScooterMarkerScene(art, now = { 100.0 }, animates = { false })
            scene.parent = MarkerParent(isOverview = true)
            scene.reconcileClusters(
                listOf(
                    ScooterCluster("leading", map.at(40.0, 345.0).latitude, map.at(40.0, 345.0).longitude, count = 63, providers = mapOf("lime" to 63)),
                    ScooterCluster("trailing", map.at(600.0, 345.0).latitude, map.at(600.0, 345.0).longitude, count = 63, providers = mapOf("lime" to 63)),
                ),
                revision = 1,
            )
            scene.clearCounts(map)
            return scene.clusters().filter { it.isHidden }.map { it.id }.sorted()
        }
        dispatch(navigation = Insets.of(0, 0, 0, 24), tappable = Insets.of(0, 24, 0, 0), cutout = null)
        assertEquals(MapInsets(top = 24.0, left = 0.0, bottom = 0.0, right = 0.0), bars)
        assertEquals(emptyList<String>(), hiddenAtTheCorners())
        dispatch(navigation = Insets.of(0, 0, 0, 48), tappable = Insets.of(0, 24, 0, 48), cutout = null)
        assertEquals(listOf("leading", "trailing"), hiddenAtTheCorners())
        dispatch(navigation = Insets.of(0, 0, 48, 0), tappable = Insets.of(0, 24, 48, 0), cutout = null)
        assertEquals(listOf("trailing"), hiddenAtTheCorners())
    }

    private fun show() {
        compose.setContent {
            view = LocalView.current
            bars = mapBars()
            safeArea = mapSafeInsets()
        }
        compose.waitForIdle()
    }

    /**
     * The window's insets: the status bar, the navigation bar as given, what of them takes taps (the status bar, and a
     * 3-button bar, not the gesture handle's strip), and the cutout's hole, if any.
     */
    private fun dispatch(navigation: Insets, tappable: Insets, cutout: Rect?) {
        compose.runOnIdle {
            val insets = WindowInsetsCompat.Builder()
                .setInsets(WindowInsetsCompat.Type.statusBars(), Insets.of(0, 24, 0, 0))
                .setInsets(WindowInsetsCompat.Type.navigationBars(), navigation)
                .setInsets(WindowInsetsCompat.Type.tappableElement(), tappable)
            if (cutout != null) {
                insets.setInsets(WindowInsetsCompat.Type.displayCutout(), Insets.of(cutout.right, 0, 0, 0))
                insets.setDisplayCutout(DisplayCutoutCompat(Rect(cutout.right, 0, 0, 0), listOf(cutout)))
            }
            ViewCompat.dispatchApplyWindowInsets(view, insets.build())
        }
        compose.waitForIdle()
    }
}
