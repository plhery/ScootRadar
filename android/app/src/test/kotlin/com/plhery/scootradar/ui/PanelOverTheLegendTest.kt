package com.plhery.scootradar.ui

import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.click
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performTouchInput
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestCatalog
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ScooterCatalog
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterZone
import com.plhery.scootradar.core.model.ScooterZoneArea
import com.plhery.scootradar.core.model.ScooterZoneKind
import com.plhery.scootradar.core.model.ScooterZoneResponse
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.map.LocalMapChrome
import com.plhery.scootradar.map.MapChromeFrames
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.dock.PANEL_GRABBER_TAG
import com.plhery.scootradar.zurichRegion
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.util.Locale
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

// UI-007: ScooterMapScreen.swift:396 puts the panel at zIndex 20, over the zones' legend and the locate button in the
// map's trailing corner (:398-412), which have none (review-app-ac 1).

/**
 * In a panel window from 760 to about 920 dp wide, French's legend reaches in under the panel's foot: the panel is
 * drawn over it and takes the taps where both are.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class PanelOverTheLegendTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale
    private lateinit var frames: MapChromeFrames
    private var mapTaps = 0

    @Before
    fun setUp() {
        val swiss = Locale.forLanguageTag("fr-CH")
        Locale.setDefault(swiss)
        ScooterLanguage.launchLocale = { swiss }
        ScooterLanguage.current = ScooterLanguage.Fr
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        Locale.setDefault(locale)
    }

    /**
     * Where the legend's first label lies under the panel's foot, beside its grabber, the panel's glass is drawn over
     * it: the label shows through it only dimly, as the map does (a tenth of it in the light, 6% in the dark).
     */
    @Test
    @Config(qualifiers = WINDOW)
    fun thePanelIsDrawnOverTheZonesLegendWhereBothAre() {
        show()
        val panel = rect(frames.panel)
        val label = drawn(compose.onNode(hasText("Circulation interdite"), useUnmergedTree = true))
        // Clear of the grabber, 36 wide in the middle of the panel's foot.
        val left = max(label.left, panel.center.x + 40)
        val right = min(label.right, panel.right)
        val top = max(label.top, panel.top)
        val bottom = min(label.bottom, panel.bottom)
        assertTrue("the legend's label $label under the panel $panel", right - left >= 40 && bottom - top >= 10)
        val image = compose.onRoot().captureToImage().toPixelMap()
        val density = compose.density.density
        val levels = mutableListOf<Int>()
        for (y in (top * density).roundToInt() until (bottom * density).roundToInt()) {
            for (x in (left * density).roundToInt() until (right * density).roundToInt()) {
                val color = image[x, y]
                levels += ((color.red * 0.299f + color.green * 0.587f + color.blue * 0.114f) * 255).roundToInt()
            }
        }
        val spread = levels.max() - levels.min()
        assertTrue("the legend's label under the panel's glass, its grey levels from ${levels.min()} to ${levels.max()}", spread < 40)
    }

    /**
     * A tap where the legend, with a city's line, lies under the panel's foot is the panel's: its grabber's, which
     * folds it. The legend takes the taps on it only with a city's line, whose authority is a link.
     */
    @Test
    @Config(qualifiers = WINDOW)
    fun thePanelTakesTheTapsWhereItIsOverTheZonesLegend() {
        val model = show()
        val panel = rect(frames.panel)
        val legend = rect(frames.zoneLegend)
        val both = panel.intersect(legend)
        assertTrue("the legend $legend under the panel $panel", both.width >= 40 && both.height >= 10)
        val grabber = drawn(compose.onNodeWithTag(PANEL_GRABBER_TAG))
        assertTrue("the grabber $grabber where both are, $both", grabber.contains(both.center))
        val density = compose.density.density
        compose.onRoot().performTouchInput { click(both.center * density) }
        compose.waitForIdle()
        assertTrue("the panel folded", model.isPanelCollapsed.value)
        assertEquals("the map's taps", 0, mapTaps)
    }

    private fun rect(frame: ScreenRect?): Rect {
        val it = checkNotNull(frame)
        return Rect(it.minX.toFloat(), it.minY.toFloat(), it.maxX.toFloat(), it.maxY.toFloat())
    }

    /** Where [node] is drawn, in dp. */
    private fun drawn(node: SemanticsNodeInteraction): Rect {
        val bounds = node.fetchSemanticsNode().boundsInRoot
        val density = compose.density.density
        return Rect(bounds.left / density, bounds.top / density, bounds.right / density, bounds.bottom / density)
    }

    /** The screen in the panel's layout, Zürich at a street's zoom with the operators' zones and a city's zone. */
    private fun show(): ScooterMapController {
        val clock = TestClock()
        val providers = listOf("bolt", "bird", "dott", "hopp", "lime", "voi", "publibike")
        val scooters = providers.mapIndexed { index, provider ->
            scooter(id = "$index", provider = provider, latitude = 47.3765 + index * 0.0002, longitude = 8.5410 + index * 0.0002)
        }
        val api = ZonedAPI(StubScooterAPI(ScooterResponse(vehicles = scooters)), listOf(zurichZone))
        val catalog = (TestCatalog.catalog as ScooterCatalog.Listed).copy(ruleZones = listOf(cityZone))
        val model = controllers.make(api, clock, defaults = InMemoryScooterDefaults(), catalog = catalog)
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { model.lastUpdated.value != null && !model.isLoading.value })
        assertTrue(controllers.waitUntil { model.zoneState.value == ScooterZoneState.Shown })
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(
                    controller = model,
                    map = {
                        frames = LocalMapChrome.current!!
                        Box(Modifier.fillMaxSize().pointerInput(Unit) { detectTapGestures { mapTaps++ } })
                    },
                    glassBlurs = false,
                )
            }
        }
        compose.waitForIdle()
        assertEquals(ScooterChromeLayout.Panel, frames.layout)
        return model
    }

    /** The stub's scooters, and the zones it is given for any area. */
    private class ZonedAPI(scooters: StubScooterAPI, private val zones: List<ScooterZone>) : ScooterAPIClient by scooters {
        override suspend fun zonesIn(area: ScooterZoneArea) = ScooterZoneResponse(zones = zones, pending = false, truncated = false)
    }

    private companion object {
        /**
         * The Tablet in a free window, 800 dp wide: the panel opens from 780, and French's legend, about 437 dp wide
         * with the kinds on one line, reaches 214 dp in under it.
         */
        const val WINDOW = "w800dp-h576dp-mdpi"

        /** A square of 0.002° a side in Zürich's centre. */
        val zurichZone = ScooterZone(
            id = "voi:slow",
            provider = "voi",
            kind = ScooterZoneKind.Slow,
            polygons = listOf(listOf(square(GeoPoint(47.3760, 8.5400), 0.002))),
        )

        /** One of the city's parking places, which makes the legend a link and takes the taps on it. */
        val cityZone = CityRuleZone(
            id = "zurich-parking-1",
            authority = "Stadt Zürich",
            timeZone = "Europe/Zurich",
            kind = ScooterZoneKind.Parking,
            source = "https://example.com/zurich",
            ring = square(GeoPoint(47.3769, 8.5417), 0.0001),
        )

        fun square(at: GeoPoint, side: Double) = listOf(
            at, GeoPoint(at.latitude, at.longitude + side), GeoPoint(at.latitude + side, at.longitude + side),
            GeoPoint(at.latitude + side, at.longitude), at,
        )
    }
}
