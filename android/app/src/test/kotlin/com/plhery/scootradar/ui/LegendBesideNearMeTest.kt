package com.plhery.scootradar.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.click
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeLeft
import androidx.compose.ui.test.swipeUp
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.FakeLocationManager
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestCatalog
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ScooterCatalog
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.ScooterRentalURIs
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterRidePricing
import com.plhery.scootradar.core.model.ScooterUnits
import com.plhery.scootradar.core.model.ScooterZone
import com.plhery.scootradar.core.model.ScooterZoneArea
import com.plhery.scootradar.core.model.ScooterZoneKind
import com.plhery.scootradar.core.model.ScooterZoneResponse
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.map.LocalMapChrome
import com.plhery.scootradar.map.MapChromeFrames
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.chrome.ZONE_LEGEND_TAG
import com.plhery.scootradar.ui.chrome.kindLabel
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.screenshot
import com.plhery.scootradar.ui.theme.useFontScale
import com.plhery.scootradar.ui.theme.weight
import com.plhery.scootradar.zurichRegion
import java.time.Instant
import java.util.Locale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

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
     * ran up behind the search bar, to 4 from the window's top, its first lines hidden there; it is 62 tall, the room
     * 8 under the bar, and scrolls (review-app-ap R2). The floor was 64, a banner's, 2 more than that room; it is the
     * iPhone's 44 since f80a9728.
     */
    @Test
    @Config(qualifiers = PHONE_MIN_LANDSCAPE)
    fun inALandscapeRowTheLineStaysBesideTheButtonWhereOverItItWouldReachHigher() {
        useFontScale(2f)
        show(located = true)
        assertBeside(scrolls = true)
        val legend = frame(frames.zoneLegend, "legend")
        val bar = frame(frames.top, "search bar")
        assertEquals("the legend $legend 62 tall, its room", 62.0, legend.height, 0.5)
        assertEquals("the legend $legend 8 under the bar $bar", bar.maxY + 8, legend.minY, 0.5)
    }

    /**
     * The same row before the first location, "Near me" the wide pill: over it, the legend would be at least the floor
     * over the button, 44 (the iPhone's, f80a9728; 64 before, from 61, under the search bar's foot at 80), with no gap
     * under the bar. Beside it the legend stands 8 under the bar, as tall as its room there, and scrolls
     * (review-legend-cap B2).
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
     * With very large text the zones' legend over a tall card keeps between the card and the search bar, and scrolls
     * there: at font scale 2.0, Zürich's kinds, a slow zone's speed and the city's credit over the card of a scooter
     * with its battery, range and price. Taller than that room, the iPhone's went up under the search bar, and the
     * chrome, taller than the window, pushed the dock past the window's foot (f80a9728, 4 November 2026). Android's
     * keeps to the locate row's ceiling, as it did (UI-410); app-ay's capture card-dark-font2.png shows it scrolled,
     * its credit cut at its own foot, 10 above the card.
     */
    @Test
    @Config(qualifiers = PHONE_MIN)
    fun theZonesLegendKeepsBetweenTheSearchBarAndATallCardWithVeryLargeText() {
        useFontScale(2f)
        showTallCard()
        val search = frame(frames.top, "search bar")
        val legend = frame(frames.zoneLegend, "legend")
        val dock = frame(frames.dock, "dock")
        assertTrue("The legend $legend under the search bar $search", legend.minY >= search.maxY)
        assertTrue("The legend $legend over the dock $dock", legend.maxY <= dock.minY)
        assertTrue("The dock $dock past the window's foot", dock.maxY <= 640.0)
        // Its lines are taller than that room, and scroll in it.
        val range = compose.onNodeWithTag(ZONE_LEGEND_TAG).fetchSemanticsNode().config[SemanticsProperties.VerticalScrollAxisRange]
        assertTrue("more below, ${range.maxValue()} px", range.maxValue() > 0f)
        compose.screenshot("zones/overATallCard_lightLargeText")
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
     * street for each of more [authorities], each from an hour later, so a line each, and each credited at the foot. [denied]: the card of a location that was denied under the search bar.
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
                hours = listOf(CityRuleZone.Hours(fromMinute = (12 + index) * 60, untilMinute = 23 * 60)),
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

    /**
     * Zürich at a street's zoom, the rider beside its centre, the operators' zones of every kind and a slow one's
     * speed, the city's parking places, and the card of a Voi with its battery, range and price open: the iPhone's test
     * of a tall card under Zürich's legend.
     */
    private fun showTallCard() {
        val clock = TestClock()
        val tall = scooter(
            id = "tall",
            provider = "voi",
            latitude = 47.3769,
            longitude = 8.5417,
            battery = 28,
            rangeMeters = 22_000,
            rentalURIs = ScooterRentalURIs(ios = "https://voi.com/ride", android = null, web = null),
            pricing = ScooterRidePricing(currency = "CHF", unlockFeeMinorUnits = 100, minuteFeeMinorUnits = 35),
        )
        val zones = ScooterZoneKind.operatorKinds.mapIndexed { index, kind ->
            ScooterZone(
                id = "voi:$index",
                provider = "voi",
                kind = kind,
                polygons = listOf(listOf(square(GeoPoint(47.3760 + index * 0.0003, 8.5400), 0.0002))),
                maxSpeedKph = if (kind == ScooterZoneKind.Slow) 10.0 else null,
            )
        }
        val city = CityRuleZone(
            id = "zurich-parking-1",
            authority = "Stadt Zürich",
            timeZone = "Europe/Zurich",
            kind = ScooterZoneKind.Parking,
            source = "https://example.com/zurich",
            ring = square(GeoPoint(47.3769, 8.5417), 0.0001),
        )
        val api = ZonedAPI(StubScooterAPI(ScooterResponse(vehicles = listOf(tall))), zones)
        val catalog = (TestCatalog.catalog as ScooterCatalog.Listed).copy(ruleZones = listOf(city))
        val model = controllers.make(api, clock, defaults = InMemoryScooterDefaults(), catalog = catalog)
        model.locationsUpdated(listOf(ScooterLocationFix(GeoPoint(47.3779, 8.5417), horizontalAccuracy = 5.0, timestamp = Instant.now())))
        assertTrue(controllers.waitUntil { model.hasLocatedOnce.value })
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { api.calls >= 1 && model.lastUpdated.value != null && !model.isLoading.value })
        assertTrue(controllers.waitUntil { model.zoneState.value == ScooterZoneState.Shown && model.mapRuleZones.value.isNotEmpty() })
        model.selectScooter("voi:tall")
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = { frames = LocalMapChrome.current!! }, glassBlurs = false)
            }
        }
        compose.waitForIdle()
        assertEquals(ScooterChromeLayout.Dock, frames.layout)
        assertTrue("the scooter's card", model.selectedScooterID.value == "voi:tall")
    }

    /** The stub's scooters, and the zones it is given for any area. */
    private class ZonedAPI(private val scooters: StubScooterAPI, private val zones: List<ScooterZone>) : ScooterAPIClient by scooters {
        val calls: Int get() = scooters.calls

        override suspend fun zonesIn(area: ScooterZoneArea) = ScooterZoneResponse(zones = zones, pending = false, truncated = false)
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

        fun square(at: GeoPoint, side: Double) = listOf(
            at, GeoPoint(at.latitude, at.longitude + side), GeoPoint(at.latitude + side, at.longitude + side),
            GeoPoint(at.latitude + side, at.longitude), at,
        )
    }
}

/**
 * The operators' kinds named in the languages whose one-word names run longest, at large text on the smallest phones:
 * where beside the locate button a name would break inside its word, the legend goes over the button, where it fits
 * whole under the search bar, even where its top is then higher (8e3c649a's promise; week review, finding 6.2). Beside
 * "In mijn buurt" and "Nær meg" at font scale 1.3, and beside the round button in Norwegian at 2.0, it stayed beside,
 * "Parkeerver" over "bod" and "Parkeringsforb" over "ud", as over the button its top was 5 (61) higher. Each name is
 * laid out in the legend's style at the width its text has in the legend as drawn (the legend's frame less its 12 + 12
 * padding, the 16 swatch and the 6 between), and a line that ends between two letters is a word broken inside.
 */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "w360dp-h640dp-xhdpi")
class KindNamesWholeBesideNearMeTest(
    private val language: String,
    private val scale: Float,
    private val located: Boolean,
    private val window: String,
    /** Whether the legend is over the button, or beside it, where every name fits whole. */
    private val over: Boolean,
    /**
     * As on ScootRadar_Phone_Min in Zürich: a city's rules on the map too, their authority's line under the kinds,
     * lengths in miles, as the emulator's US region has them ("Lav fart: 3 miles/t" in two lines), and the data 9
     * minutes old, which the location card says in a line of its own.
     */
    private val asOnTheEmulator: Boolean,
) {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale
    private lateinit var frames: MapChromeFrames
    private lateinit var measurer: TextMeasurer

    @After
    fun tearDown() {
        controllers.close()
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        Locale.setDefault(locale)
    }

    @Test
    fun noKindsNameBreaksInsideItsWord() {
        RuntimeEnvironment.setQualifiers(window)
        val region = Locale.forLanguageTag(language)
        ScooterLanguage.launchLocale = { region }
        ScooterLanguage.current = checkNotNull(ScooterLanguage.fromRawValue(region.language))
        Locale.setDefault(region)
        val clock = TestClock()
        val zones = ScooterZoneKind.operatorKinds.mapIndexed { index, kind ->
            ScooterZone(
                id = "voi:$index",
                provider = "voi",
                kind = kind,
                polygons = listOf(listOf(square(GeoPoint(47.3760 + index * 0.0003, 8.5400), 0.0002))),
                maxSpeedKph = if (kind == ScooterZoneKind.Slow) 10.0 else null,
            )
        }
        val api = ZonedAPI(StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421)))), zones)
        val city = CityRuleZone(
            id = "zurich-parking-1",
            authority = "Stadt Zürich",
            timeZone = "Europe/Zurich",
            kind = ScooterZoneKind.Parking,
            source = "https://example.com/zurich",
            ring = square(GeoPoint(47.3769, 8.5417), 0.0001),
        )
        val catalog = (TestCatalog.catalog as ScooterCatalog.Listed).copy(ruleZones = if (asOnTheEmulator) listOf(city) else emptyList())
        val model = controllers.make(api, clock, defaults = InMemoryScooterDefaults(), catalog = catalog)
        if (located) {
            model.locationsUpdated(listOf(ScooterLocationFix(GeoPoint(47.3779, 8.5417), horizontalAccuracy = 5.0, timestamp = Instant.now())))
            assertTrue(controllers.waitUntil { model.hasLocatedOnce.value })
        }
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { model.lastUpdated.value != null && !model.isLoading.value })
        assertTrue(controllers.waitUntil { model.zoneState.value == ScooterZoneState.Shown && model.mapOperatorZoneCount.value > 0 })
        if (asOnTheEmulator) {
            assertTrue(controllers.waitUntil { model.mapRuleZones.value.isNotEmpty() })
            model.setUnits(ScooterUnits.Imperial)
            clock.advance(9 * 60.0)
        }
        useFontScale(scale)
        val speeds = model.mapOperatorSlowSpeeds.value
        compose.setContent {
            measurer = rememberTextMeasurer()
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = { frames = LocalMapChrome.current!! }, glassBlurs = false)
            }
        }
        compose.waitForIdle()
        val legend = checkNotNull(frames.zoneLegend) { "no legend" }
        val button = checkNotNull(frames.locateButton) { "no locate button" }
        val top = checkNotNull(frames.top) { "no search bar" }
        // xhdpi: 2 pixels a point.
        val textWidth = ((legend.width - 12 - 12 - 16 - 6) * 2).toInt()
        val style = ScootType.caption.weight(FontWeight.Medium)
        val drawn = ScooterZoneKind.operatorKinds.map { kind ->
            val label = kindLabel(kind, speeds)
            val layout = measurer.measure(label, style, constraints = Constraints(maxWidth = textWidth))
            (0 until layout.lineCount).map { label.substring(layout.getLineStart(it), layout.getLineEnd(it)) }
        }
        val broken = drawn.filter { lines ->
            lines.zipWithNext().any { (line, next) -> line.lastOrNull()?.isLetter() == true && next.firstOrNull()?.isLetter() == true }
        }
        val names = drawn.joinToString(" / ") { it.joinToString(" | ") }
        assertTrue("a name broken inside its word in the legend $legend, beside the button $button: $names", broken.isEmpty())
        assertTrue("the legend $legend under the search bar $top", legend.minY >= top.maxY)
        if (over) {
            assertTrue("the legend $legend over the button $button", legend.maxY <= button.minY - 10 + 0.5)
        } else {
            assertTrue("the legend $legend beside the button $button", legend.maxX <= button.minX - 20 + 0.5)
        }
    }

    /** The stub's scooters, and the zones it is given for any area. */
    private class ZonedAPI(private val scooters: StubScooterAPI, private val zones: List<ScooterZone>) : ScooterAPIClient by scooters {
        override suspend fun zonesIn(area: ScooterZoneArea) = ScooterZoneResponse(zones = zones, pending = false, truncated = false)
    }

    companion object {
        /** ScootRadar_Phone_Min: 720 × 1280 px at 320 dpi. */
        private const val PHONE_MIN = "w360dp-h640dp-xhdpi"

        /** A phone a little wider: 768 × 1664 px at 320 dpi. */
        private const val PHONE_384 = "w384dp-h832dp-xhdpi"

        private fun square(at: GeoPoint, side: Double) = listOf(
            GeoPoint(at.latitude - side, at.longitude - side),
            GeoPoint(at.latitude - side, at.longitude + side),
            GeoPoint(at.latitude + side, at.longitude + side),
            GeoPoint(at.latitude + side, at.longitude - side),
            GeoPoint(at.latitude - side, at.longitude - side),
        )

        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0} {1} located={2} {3} over={4} asOnTheEmulator={5}")
        fun parameters(): List<Array<Any>> = listOf(
            arrayOf("nl-NL", 1.3f, false, PHONE_MIN, true, false),
            arrayOf("nl-NL", 1.3f, false, PHONE_384, true, false),
            arrayOf("nb-NO", 1.3f, false, PHONE_MIN, true, false),
            arrayOf("nb-NO", 2f, true, PHONE_MIN, true, false),
            // As on ScootRadar_Phone_Min in Zürich: "Stadt Zürich" under the kinds makes the legend taller than the
            // room over the button, where it then scrolls; beside it "Parkeringsforbu" stood over "d".
            arrayOf("nb-NO", 2f, true, PHONE_MIN, true, true),
            // 8e3c649a's own case, and bef9f112's beside the round button.
            arrayOf("fr-CH", 1.3f, false, PHONE_MIN, true, false),
            arrayOf("pt-PT", 1.3f, true, PHONE_MIN, false, false),
            // Every name whole beside "In mijn buurt" at the default size: the iPhone's row.
            arrayOf("nl-NL", 1f, false, PHONE_MIN, false, false),
        )
    }
}
