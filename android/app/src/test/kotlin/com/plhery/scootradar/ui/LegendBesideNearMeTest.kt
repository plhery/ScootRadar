package com.plhery.scootradar.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeUp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestCatalog
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ScooterCatalog
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.map.LocalMapChrome
import com.plhery.scootradar.map.MapChromeFrames
import com.plhery.scootradar.ui.chrome.ZONE_LEGEND_TAG
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.useFontScale
import com.plhery.scootradar.zurichRegion
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.time.Instant

// UI-410 on ScootRadar_Phone_Min: the locate row over the dock, ScooterMapScreen.swift:263-276.

/**
 * On the smallest phone, a street's line in the zones' legend beside the locate button: beside it where it fits, as the
 * iPhone's HStack, and over it where beside "Near me" at the largest text it would run up under the search bar.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class LegendBesideNearMeTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private lateinit var frames: MapChromeFrames

    @After
    fun tearDown() {
        controllers.close()
        resetFontScale()
    }

    /**
     * At font scale 2.0 before the first location, "Near me" takes more than half the row. Beside it the line broke
     * into about twelve lines and ran up under the search bar and the status bar; it goes over the button, at the
     * row's width, under the search bar, and the button keeps its place.
     */
    @Test
    @Config(qualifiers = PHONE_MIN)
    fun aLongLineGoesOverNearMeWhereBesideItItWouldRunUnderTheSearchBar() {
        useFontScale(2f)
        show(located = false)
        val legend = frame(frames.zoneLegend, "legend")
        val button = frame(frames.locateButton, "locate button")
        val top = frame(frames.top, "search bar")
        assertTrue("\"Near me\" ${button.width} wide, the wide pill", button.width > 150)
        assertNull("the legend $legend under the search bar $top", legend.intersection(top)?.takeUnless { it.isEmpty })
        assertTrue("the legend $legend 8 under the search bar $top", legend.minY >= top.maxY + 8 - 0.5)
        assertTrue("the legend $legend over the button $button", legend.maxY <= button.minY - 10 + 0.5)
        assertTrue("the legend $legend wider than beside the button $button", legend.width > 360 - 20 - button.width)
        assertEquals("the button's foot, the row's", frame(frames.dock, "dock").minY - 10, button.maxY, 0.5)
        // Across the row's width, the legend is what the map centres a place or the scooters above.
        assertEquals("the foot of what the map shows clear", legend.minY, checkNotNull(frames.chrome.bottomTop), 0.5)
    }

    /**
     * Three cities' lines at font scale 2.0 are taller over "Near me" than the room under the search bar: the legend
     * stops 8 under it and scrolls, down to its last line (review-app-ap R2). The map centres above its top.
     */
    @Test
    @Config(qualifiers = PHONE_MIN)
    fun linesTallerThanTheirRoomStopUnderTheSearchBarAndScroll() {
        useFontScale(2f)
        show(located = false, authorities = listOf(SEOUL, "Gangnam-gu, lines © OpenStreetMap", "Seocho-gu, lines © OpenStreetMap"))
        val legend = frame(frames.zoneLegend, "legend")
        val button = frame(frames.locateButton, "locate button")
        val bar = frame(frames.top, "search bar")
        assertEquals("the legend $legend 8 under the search bar $bar", bar.maxY + 8, legend.minY, 0.5)
        assertTrue("the legend $legend over the button $button", legend.maxY <= button.minY - 10 + 0.5)
        assertEquals("the foot of what the map shows clear", legend.minY, checkNotNull(frames.chrome.bottomTop), 0.5)
        val node = compose.onNodeWithTag(ZONE_LEGEND_TAG)
        val range = node.fetchSemanticsNode().config[SemanticsProperties.VerticalScrollAxisRange]
        assertEquals("scrolled to its top", 0f, range.value(), 0f)
        assertTrue("more below, ${range.maxValue()} px", range.maxValue() > 0f)
        node.performTouchInput { swipeUp(startY = bottom - 4f, endY = top + 4f, durationMillis = 400) }
        node.performTouchInput { swipeUp(startY = bottom - 4f, endY = top + 4f, durationMillis = 400) }
        compose.waitForIdle()
        assertEquals("scrolled to its foot", range.maxValue(), range.value(), 0.5f)
        val last = compose.onNodeWithText("Seocho-gu", substring = true).getUnclippedBoundsInRoot()
        val shown = node.getUnclippedBoundsInRoot()
        assertTrue("the last line $last inside the legend $shown", last.bottom <= shown.bottom && last.top >= shown.top)
    }

    /** At the default size the line fits beside "Near me": the iPhone's row, both on its foot. */
    @Test
    @Config(qualifiers = PHONE_MIN)
    fun theLineStaysBesideNearMeWhereItFits() {
        show(located = false)
        assertBeside()
    }

    /** At font scale 2.0 once located, beside the round button the line fits: the iPhone's row. */
    @Test
    @Config(qualifiers = PHONE_MIN)
    fun theLineStaysBesideTheRoundButtonAtTheLargestText() {
        useFontScale(2f)
        show(located = true)
        assertBeside()
    }

    /**
     * On the smallest phone in landscape at font scale 2.0, once located, the line wraps the same over the round button
     * as beside it, and over it would only reach higher, up to the status bar: it stays beside it, the iPhone's row. It
     * ran up behind the search bar, to 4 from the window's top, its kinds hidden there; it is as tall as the room under
     * the bar, and scrolls (review-app-ap R2).
     */
    @Test
    @Config(qualifiers = PHONE_MIN_LANDSCAPE)
    fun inALandscapeRowTheLineStaysBesideTheButtonWhereOverItItWouldReachHigher() {
        useFontScale(2f)
        show(located = true)
        assertBeside(scrolls = true)
    }

    private fun assertBeside(scrolls: Boolean = false) {
        val legend = frame(frames.zoneLegend, "legend")
        val button = frame(frames.locateButton, "locate button")
        val top = frame(frames.top, "search bar")
        assertTrue("the legend $legend beside the button $button", legend.maxX <= button.minX - 20 + 0.5)
        assertEquals("the legend's foot, the button's", button.maxY, legend.maxY, 0.5)
        assertTrue("the legend $legend under the search bar $top", legend.minY >= top.maxY)
        assertEquals("the foot of what the map shows clear, the button's top", button.minY, checkNotNull(frames.chrome.bottomTop), 0.5)
        val range = compose.onNodeWithTag(ZONE_LEGEND_TAG).fetchSemanticsNode().config[SemanticsProperties.VerticalScrollAxisRange]
        assertEquals("the legend $legend scrolls", scrolls, range.maxValue() > 0f)
    }

    private fun frame(frame: ScreenRect?, name: String): ScreenRect = checkNotNull(frame) { "no $name" }

    /**
     * Zürich at a street's zoom, a scooter, and a city's street with hours, not in force: its line ends "(not now)". A
     * line each for more [authorities].
     */
    private fun show(located: Boolean, authorities: List<String> = listOf(SEOUL)) {
        val clock = TestClock()
        val streets = authorities.mapIndexed { index, authority ->
            CityRuleZone(
                id = "street-$index",
                authority = authority,
                timeZone = "Asia/Seoul",
                firstDay = "2025-05-16",
                hours = listOf(CityRuleZone.Hours(fromMinute = 12 * 60, untilMinute = 23 * 60)),
                source = "https://example.com/street-$index",
                lines = listOf(listOf(GeoPoint(47.3769, 8.5417), GeoPoint(47.3779, 8.5427))),
            )
        }
        val catalog = (TestCatalog.catalog as ScooterCatalog.Listed).copy(ruleZones = streets)
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421))))
        val model = controllers.make(api, clock, defaults = InMemoryScooterDefaults(), catalog = catalog)
        if (located) {
            model.locationsUpdated(listOf(ScooterLocationFix(GeoPoint(47.3769, 8.5417), horizontalAccuracy = 5.0, timestamp = Instant.now())))
            assertTrue(controllers.waitUntil { model.hasLocatedOnce.value })
        }
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { api.calls >= 1 && model.lastUpdated.value != null && !model.isLoading.value })
        assertTrue(controllers.waitUntil { model.mapRuleZones.value.map { it.inForce } == authorities.map { false } })
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(
                    controller = model,
                    map = {
                        frames = LocalMapChrome.current!!
                        Box(Modifier.fillMaxSize())
                    },
                    glassBlurs = false,
                )
            }
        }
        compose.waitForIdle()
        assertEquals(ScooterChromeLayout.Dock, frames.layout)
        assertEquals("the located state", located, model.hasLocatedOnce.value)
    }

    private companion object {
        const val SEOUL = "Seoul, lines © OpenStreetMap"

        /** ScootRadar_Phone_Min: 720 × 1280 px at 320 dpi. */
        const val PHONE_MIN = "w360dp-h640dp-xhdpi"

        /** ScootRadar_Phone_Min turned on its side. */
        const val PHONE_MIN_LANDSCAPE = "w640dp-h360dp-xhdpi"
    }
}
