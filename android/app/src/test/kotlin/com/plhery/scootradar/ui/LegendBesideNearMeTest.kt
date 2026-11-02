package com.plhery.scootradar.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.click
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeLeft
import androidx.compose.ui.test.swipeUp
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestCatalog
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.FakeLocationManager
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.model.ScooterLocationIssue
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
import com.plhery.scootradar.ui.theme.screenshot
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

    // What reaches the map under the chrome: presses and moves.
    private var mapPresses = 0
    private var mapMoves = 0

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
     * ran up behind the search bar, to 4 from the window's top, its first lines hidden there; it is 64 tall, the floor,
     * 2 more than the room under the bar, and scrolls (review-app-ap R2).
     */
    @Test
    @Config(qualifiers = PHONE_MIN_LANDSCAPE)
    fun inALandscapeRowTheLineStaysBesideTheButtonWhereOverItItWouldReachHigher() {
        useFontScale(2f)
        show(located = true)
        assertBeside(scrolls = true)
        val legend = frame(frames.zoneLegend, "legend")
        val bar = frame(frames.top, "search bar")
        assertEquals("the legend $legend 64 tall, the floor", 64.0, legend.height, 0.5)
        assertTrue("the legend $legend at most 2 above 8 under the bar $bar", legend.minY >= bar.maxY + 8 - 2 - 0.5)
    }

    /**
     * The same row before the first location, "Near me" the wide pill: over it, the legend would be the floor's 64 over
     * the button, from 61, under the search bar's foot at 80, its first line never in view. Beside it the legend stands
     * 8 under the bar, as tall as its room there, and scrolls (review-legend-cap B2).
     */
    @Test
    @Config(qualifiers = PHONE_MIN_LANDSCAPE)
    fun inALandscapeRowBeforeTheFirstLocationTheLineStaysBesideNearMeUnderTheSearchBar() {
        useFontScale(2f)
        show(located = false)
        assertTrue("\"Near me\" ${frames.locateButton} the wide pill", frame(frames.locateButton, "locate button").width > 150)
        assertBeside(scrolls = true)
        val bar = frame(frames.top, "search bar")
        assertEquals("the legend 8 under the search bar $bar", bar.maxY + 8, frame(frames.zoneLegend, "legend").minY, 0.5)
    }

    /**
     * With the card of a location that was denied under the search bar, and "Near me" the pill, two lines at font scale
     * 2.0 stand 8 under the card, not under it, where their first lines were out of reach of the scroll
     * (review-legend-cap R1). Beside the pill the legend was about 125 wide, its lines cut inside their words, each
     * taller than the legend; it goes over the button at the row's width, in the 53 left over it, and scrolls to its
     * last line. The screenshot is the screen as it then is.
     */
    @Test
    @Config(qualifiers = PHONE_MIN)
    fun underALocationCardTheLinesGoOverNearMeAtTheRowsWidthAndScroll() {
        useFontScale(2f)
        show(located = false, denied = true, authorities = listOf(SEOUL, GANGNAM))
        val legend = frame(frames.zoneLegend, "legend")
        val button = frame(frames.locateButton, "locate button")
        val card = frame(frames.top, "search bar and card")
        assertTrue("the card under the bar: $card", card.height > 150)
        assertTrue("\"Near me\" ${button.width} wide, the wide pill", button.width > 150)
        assertTrue("the legend $legend 8 under the card $card", legend.minY >= card.maxY + 8 - 0.5)
        assertTrue("the legend $legend over the button $button", legend.maxY <= button.minY - 10 + 0.5)
        assertTrue("the legend $legend at the row's width, wider than beside the button $button", legend.width > 360 - 20 - button.width + 100)
        assertEquals("the foot of what the map shows clear", legend.minY, checkNotNull(frames.chrome.bottomTop), 0.5)
        val node = compose.onNodeWithTag(ZONE_LEGEND_TAG)
        val range = node.fetchSemanticsNode().config[SemanticsProperties.VerticalScrollAxisRange]
        assertEquals("scrolled to its top", 0f, range.value(), 0f)
        val first = compose.onNodeWithText("Seoul", substring = true).getUnclippedBoundsInRoot()
        val shown = node.getUnclippedBoundsInRoot()
        assertTrue("the first line $first starts inside the legend $shown", first.top >= shown.top)
        compose.screenshot("zones/underLocationCard_lightLargeText")
        // A short room: a swipe the legend's height scrolls a few dozen pixels.
        repeat(30) {
            if (range.value() < range.maxValue()) node.performTouchInput { swipeUp(startY = bottom - 4f, endY = top + 4f, durationMillis = 400) }
            compose.waitForIdle()
        }
        assertEquals("scrolled to its foot", range.maxValue(), range.value(), 0.5f)
        // Each line is taller than the room left to the legend: its foot is in view.
        val last = compose.onNodeWithText("Gangnam-gu", substring = true).getUnclippedBoundsInRoot()
        assertTrue("the last line's foot $last in the legend $shown", last.bottom <= shown.bottom && last.bottom > shown.top + 7.dp)
    }

    /**
     * A legend that fits its room is no scroll: a tap and a drag on it, with no city's line, reach the map under it, as
     * the legend's KDoc says (review-legend-cap B1: a scroll turned off took them all).
     */
    @Test
    @Config(qualifiers = PHONE_MIN)
    fun onThePhoneATapAndADragOnALegendThatFitsReachTheMap() {
        show(located = true, authorities = emptyList())
        assertTapAndDragReachTheMap()
    }

    /** The same in the panel's corner of a large window. */
    @Test
    @Config(qualifiers = TABLET)
    fun inThePanelATapAndADragOnALegendThatFitsReachTheMap() {
        show(located = true, authorities = emptyList(), layout = ScooterChromeLayout.Panel)
        assertTapAndDragReachTheMap()
    }

    private fun assertTapAndDragReachTheMap() {
        val node = compose.onNodeWithTag(ZONE_LEGEND_TAG)
        assertNull("no scroll", node.fetchSemanticsNode().config.getOrNull(SemanticsProperties.VerticalScrollAxisRange))
        mapPresses = 0
        mapMoves = 0
        node.performTouchInput { click(center) }
        compose.waitForIdle()
        assertEquals("the tap's press on the map", 1, mapPresses)
        node.performTouchInput { swipeLeft(startX = right - 4f, endX = left + 4f, durationMillis = 300) }
        compose.waitForIdle()
        assertEquals("the drag's press on the map", 2, mapPresses)
        assertTrue("the drag's moves on the map: $mapMoves", mapMoves > 5)
    }

    private fun assertBeside(scrolls: Boolean = false) {
        val legend = frame(frames.zoneLegend, "legend")
        val button = frame(frames.locateButton, "locate button")
        val top = frame(frames.top, "search bar")
        assertTrue("the legend $legend beside the button $button", legend.maxX <= button.minX - 20 + 0.5)
        assertEquals("the legend's foot, the button's", button.maxY, legend.maxY, 0.5)
        assertTrue("the legend $legend under the search bar $top", legend.minY >= top.maxY)
        assertEquals("the foot of what the map shows clear, the button's top", button.minY, checkNotNull(frames.chrome.bottomTop), 0.5)
        // A legend that fits its room is no scroll (review-legend-cap B1).
        val range = compose.onNodeWithTag(ZONE_LEGEND_TAG).fetchSemanticsNode().config.getOrNull(SemanticsProperties.VerticalScrollAxisRange)
        assertEquals("the legend $legend scrolls", scrolls, range != null && range.maxValue() > 0f)
    }

    private fun frame(frame: ScreenRect?, name: String): ScreenRect = checkNotNull(frame) { "no $name" }

    /**
     * Zürich at a street's zoom, a scooter, and a city's street with hours, not in force: its line ends "(not now)". A
     * line each for more [authorities]. [denied]: the card of a location that was denied under the search bar.
     */
    private fun show(
        located: Boolean,
        authorities: List<String> = listOf(SEOUL),
        denied: Boolean = false,
        layout: ScooterChromeLayout = ScooterChromeLayout.Dock,
    ) {
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
        val model = if (denied) {
            controllers.make(api, clock, defaults = InMemoryScooterDefaults(), catalog = catalog, locationManager = FakeLocationManager(ScooterAuthorizationStatus.Denied))
        } else {
            controllers.make(api, clock, defaults = InMemoryScooterDefaults(), catalog = catalog)
        }
        if (denied) {
            model.focusOnUser()
            assertTrue(controllers.waitUntil(attempts = 700) { model.locationIssue.value == ScooterLocationIssue.Denied && !model.isLocating.value })
        }
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
                        Box(
                            Modifier.fillMaxSize().pointerInput(Unit) {
                                awaitPointerEventScope {
                                    while (true) {
                                        when (awaitPointerEvent().type) {
                                            PointerEventType.Press -> mapPresses++
                                            PointerEventType.Move -> mapMoves++
                                        }
                                    }
                                }
                            },
                        )
                    },
                    glassBlurs = false,
                )
            }
        }
        compose.waitForIdle()
        assertEquals(layout, frames.layout)
        assertEquals("the located state", located, model.hasLocatedOnce.value)
    }

    private companion object {
        const val SEOUL = "Seoul, lines © OpenStreetMap"
        const val GANGNAM = "Gangnam-gu, lines © OpenStreetMap"

        /** ScootRadar_Phone_Min: 720 × 1280 px at 320 dpi. */
        const val PHONE_MIN = "w360dp-h640dp-xhdpi"

        /** ScootRadar_Phone_Min turned on its side. */
        const val PHONE_MIN_LANDSCAPE = "w640dp-h360dp-xhdpi"

        /** ScootRadar_Tablet: 2560 × 1600 px at 320 dpi. */
        const val TABLET = "w1280dp-h800dp-xhdpi"
    }
}
