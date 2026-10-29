package com.plhery.scootradar.map

import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraUpdateFactory

/**
 * Where the compass sits and when it shows, from the chrome the screen measures (MAP-021, MAP-022): 12 under the
 * search bar in the dock's layout, level with the panel's top beside it, under a desktop window's caption buttons,
 * and gone while the search is open on a phone. The map is turned so that the compass shows. Its place is in the
 * map's points, which the chrome's frames are in.
 */
@RunWith(AndroidJUnit4::class)
class MapCompassPlaceTest {
    @get:Rule
    val compose = createEmptyComposeRule()

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val language = ScooterLanguage.current

    @Before
    fun setUp() {
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        scope.cancel()
        ScooterLanguage.current = language
    }

    /** On a phone, or any window with the dock: a large window's panel has no search bar over the map. */
    @Test
    fun theCompassSitsUnderTheSearchBarAndMakesWayForTheOpenSearchOnAPhone() = withAppMap(testController(scope)) { phone ->
        // The chrome as the screen measures it, once it has: the rule runs the screen's effects while it waits.
        val chrome = { phone.onMain { phone.view.camera!!.currentChrome?.invoke() } }
        runCatching { compose.waitUntil(10_000) { chrome()?.let { it.top != null || it.panel != null } == true } }
        assumeTrue("the dock's layout: ${chrome()}", chrome()?.panel == null)
        phone.onMain { phone.map.moveCamera(CameraUpdateFactory.bearingTo(30.0)) }
        compose.waitUntil(5_000) { compassShown() }
        compose.waitForIdle()
        val search = phone.onMain { phone.view.camera!!.currentChrome!!.invoke().top }
        assertNotNull("the search bar's frame", search)
        assertEquals(search!!.maxY + 12, compass(phone).minY, 0.5)

        // The screen tells the map the search is open: the compass makes way for it, and comes back once it closes.
        compose.onNodeWithTag(SEARCH_ISLAND_TAG).performClick()
        compose.waitUntil(5_000) { !compassShown() }
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        // Back puts the keyboard away, then closes the search.
        repeat(2) {
            if (!compassShown()) {
                device.pressBack()
                runCatching { compose.waitUntil(2_000) { compassShown() } }
            }
        }
        assertTrue("the compass back", compassShown())
    }

    @Test
    fun theCompassSitsLevelWithThePanelUnderTheCaptionButtonsAndUnderNoSearchBarBesideIt() {
        val frames = MapChromeFrames()
        withScooterMap(testController(scope), zurichStart, width = null, height = null, chrome = frames) { shown ->
            val phone = shown.phone
            phone.onMain { phone.map.moveCamera(CameraUpdateFactory.bearingTo(30.0)) }
            compose.waitUntil(5_000) { compassShown() }
            fun placed(change: MapChromeFrames.() -> Unit): Double {
                phone.onMain { frames.change() }
                compose.waitForIdle()
                return compass(phone).minY
            }

            // No search bar: 80 under the safe area's top.
            val noSearch = placed { }
            // The dock's search bar: 12 under it.
            val bar = ScreenRect(12.0, noSearch - 50, 336.0, 62.0)
            assertEquals(bar.maxY + 12, placed { top = bar }, 0.5)
            // The open search on a phone: no compass.
            phone.onMain { frames.isSearching = true }
            compose.waitUntil(5_000) { !compassShown() }

            // Beside a panel, level with its top, while the search is open too: it is far from the search.
            val panel = ScreenRect(16.0, noSearch - 64, 200.0, 400.0)
            assertEquals(panel.minY, placed { layout = ScooterChromeLayout.Panel; this.panel = panel }, 0.5)
            assertTrue("the compass beside the panel with the search open", compassShown())
            // Under a desktop window's caption buttons it would meet there: 12 under them.
            val buttons = ScreenRect(phone.onMain { phone.view.width / phone.view.resources.displayMetrics.density } - 160.0, 0.0, 160.0, panel.minY + 14)
            assertEquals(buttons.maxY + 12, placed { captionButtons = listOf(buttons) }, 0.5)

            // The dock's search bar is no measure beside a panel, even before the panel has a frame: as with none.
            val low = ScreenRect(12.0, 300.0, 336.0, 56.0)
            assertEquals(noSearch, placed { captionButtons = emptyList(); top = low; this.panel = null; isSearching = false }, 0.5)
        }
    }

    /** Whether the compass shows: it is named for TalkBack only then. */
    private fun compassShown(): Boolean = compose.onAllNodesWithContentDescription("Compass").fetchSemanticsNodes().isNotEmpty()

    /** The compass's frame in the map's points. */
    private fun compass(phone: PhoneMap): ScreenRect {
        val bounds = compose.onNodeWithTag(COMPASS_TAG).fetchSemanticsNode().boundsInWindow
        return phone.onMain {
            val density = phone.view.resources.displayMetrics.density
            val map = IntArray(2).also { phone.view.getLocationInWindow(it) }
            ScreenRect(
                ((bounds.left - map[0]) / density).toDouble(),
                ((bounds.top - map[1]) / density).toDouble(),
                (bounds.width / density).toDouble(),
                (bounds.height / density).toDouble(),
            )
        }
    }
}
