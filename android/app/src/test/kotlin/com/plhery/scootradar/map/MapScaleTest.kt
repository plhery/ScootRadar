package com.plhery.scootradar.map

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshots.Snapshot
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.github.takahirom.roborazzi.captureRoboImage
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLengthUnit
import com.plhery.scootradar.core.model.ScooterMeasureFormat
import com.plhery.scootradar.ui.theme.Look
import com.plhery.scootradar.ui.theme.PHONE
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.drawWindowAgain
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.screenshotOptions
import com.plhery.scootradar.ui.theme.useFontScale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.math.BigDecimal
import java.util.Locale
import kotlin.math.PI

// MAP-023, MAP-275 and MAP-292: MapKit's scale as the app adds it, in a region that measures in miles, while the map
// zooms, in feet below a tenth of a mile and in miles from there.

@RunWith(AndroidJUnit4::class)
@Config(qualifiers = PHONE)
class MapScaleTest {
    @get:Rule
    val compose = createComposeRule()

    private val us = Locale.forLanguageTag("en-US")
    private val uk = Locale.forLanguageTag("en-GB")
    private val swiss = Locale.forLanguageTag("de-CH")

    @Test
    fun onlyWhereTheRegionMeasuresInMiles() {
        assertTrue(MapScale.showsScale(us))
        assertTrue(MapScale.showsScale(uk))
        // Spanish in the United States: the region's measures, not the language's.
        assertTrue(MapScale.showsScale(Locale.forLanguageTag("es-US")))
        assertFalse(MapScale.showsScale(swiss))
        assertFalse(MapScale.showsScale(Locale.forLanguageTag("fr-FR")))
        assertFalse(MapScale.showsScale(Locale.forLanguageTag("en-CH")))
        assertFalse(MapScale.showsScale(Locale.forLanguageTag("en-CA")))
    }

    /** The longest round length within 120 points: feet below a tenth of a mile, miles from there. */
    @Test
    fun aRoundLengthInFeetThenInMiles() {
        assertStep("200", ScooterLengthUnit.Feet, 60.96, MapScale.step(1.0))
        assertStep("2", ScooterLengthUnit.Feet, 60.96, MapScale.step(0.01))
        // 500 ft is 152.4 m, a tenth of a mile 160.9 m.
        assertStep("500", ScooterLengthUnit.Feet, 117.23, MapScale.step(1.3))
        assertStep("0.1", ScooterLengthUnit.Miles, 119.21, MapScale.step(1.35))
        assertStep("0.5", ScooterLengthUnit.Miles, 80.47, MapScale.step(10.0))
        assertStep("1", ScooterLengthUnit.Miles, 107.29, MapScale.step(15.0))
        assertStep("5000", ScooterLengthUnit.Miles, 80.47, MapScale.step(100_000.0))
        // Not even a foot.
        assertNull(MapScale.step(0.001))
        assertNull(MapScale.step(0.0))
        assertNull(MapScale.step(Double.NaN))
    }

    @Test
    fun aPointOfTheMapAtItsCentre() {
        assertEquals(2 * PI * 6_378_137.0 / 512, MapScale.metresPerPoint(0.0, 0.0), 1e-6)
        // Half as long a zoom further in, and at 60° north.
        assertEquals(PI * 6_378_137.0 / 512 / 2, MapScale.metresPerPoint(1.0, 60.0), 1e-6)
    }

    @Test
    fun theLegendInTheRegionsWords() {
        assertEquals("200 ft", ScooterMeasureFormat.length(BigDecimal("200"), ScooterLengthUnit.Feet, us))
        assertEquals("0.5 mi", ScooterMeasureFormat.length(BigDecimal("0.5"), ScooterLengthUnit.Miles, uk))
        assertEquals("200 feet", spokenLength(MapScale.Step(BigDecimal("200"), ScooterLengthUnit.Feet, 60.96), us))
        assertEquals("1 mile", spokenLength(MapScale.Step(BigDecimal("1"), ScooterLengthUnit.Miles, 107.29), uk))
        assertEquals("0.5 miles", spokenLength(MapScale.Step(BigDecimal("0.5"), ScooterLengthUnit.Miles, 80.47), us))
    }

    /** It shows as the zoom changes, in the United States and the United Kingdom; in Switzerland never. */
    @Test
    fun itShowsAsTheMapZoomsInTheUnitedStates() = assertShows(us, shows = true)

    @Test
    fun itShowsAsTheMapZoomsInTheUnitedKingdom() = assertShows(uk, shows = true)

    @Test
    fun inSwitzerlandItNeverShows() = assertShows(swiss, shows = false)

    /**
     * UI-121: the height the credits keep under, measured without the scale on screen, is the scale's own as drawn,
     * short or long.
     */
    @Test
    fun itsHeightIsTheOneTheCreditsKeepUnder() = assertHeight()

    /** At the phone's largest text too, as the scale keeps its size. */
    @Test
    fun itsHeightKeepsAtTheLargestText() {
        useFontScale(2f)
        try {
            assertHeight()
        } finally {
            resetFontScale()
        }
    }

    private fun assertHeight() {
        var measured = 0.0
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                val measurer = rememberTextMeasurer()
                val density = LocalDensity.current
                measured = remember(measurer, density) { scaleHeight(measurer, density) }
                Column {
                    Box(Modifier.testTag("short")) { ScaleArt(MapScale.Step(BigDecimal("500"), ScooterLengthUnit.Feet, 60.0), us, dark = false) }
                    Box(Modifier.testTag("long")) { ScaleArt(MapScale.Step(BigDecimal("0.5"), ScooterLengthUnit.Miles, 80.47), us, dark = false) }
                }
            }
        }
        compose.waitForIdle()
        for (tag in listOf("short", "long")) {
            val drawn = compose.onNodeWithTag(tag).fetchSemanticsNode().size.height / compose.density.density
            assertEquals("the scale $tag", drawn.toDouble(), measured, 0.5)
        }
        // A line of its 11-point legend over the bar's 2 and 6.
        assertEquals(22.0, measured, 4.0)
    }

    /** A second after the zoom last changed it fades out over a quarter of a second. */
    @Test
    fun itFadesASecondAfterTheZoomStops() = assertFades(reduceMotion = false)

    /** Under Remove animations it goes at once, a second after. */
    @Test
    fun underRemoveAnimationsItGoesAtOnce() = assertFades(reduceMotion = true)

    private fun assertShows(locale: Locale, shows: Boolean) {
        var changes by mutableIntStateOf(0)
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                MapScaleBar(metresPerPoint = { 1.0 }, zoomChanges = { changes }, locale = locale, dark = false)
            }
        }
        // The map as it opened.
        assertEquals(0, compose.onAllNodesWithTag(SCALE_TAG).fetchSemanticsNodes().size)
        changes += 1
        compose.waitForIdle()
        assertEquals("$locale", if (shows) 1 else 0, compose.onAllNodesWithTag(SCALE_TAG).fetchSemanticsNodes().size)
        if (shows) compose.onNodeWithContentDescription("200 feet").assertExists()
    }

    private fun assertFades(reduceMotion: Boolean) {
        var changes by mutableIntStateOf(0)
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = reduceMotion) {
                MapScaleBar(metresPerPoint = { 1.0 }, zoomChanges = { changes }, locale = us, dark = false)
            }
        }
        compose.waitForIdle()
        compose.mainClock.autoAdvance = false
        fun zoom() {
            compose.runOnUiThread {
                changes += 1
                Snapshot.sendApplyNotifications()
            }
            compose.mainClock.advanceTimeByFrame()
        }
        zoom()
        compose.mainClock.advanceTimeBy(600)
        // Still zooming: it stays.
        zoom()
        compose.mainClock.advanceTimeBy(900)
        assertEquals("held after the last change", 1, compose.onAllNodesWithTag(SCALE_TAG).fetchSemanticsNodes().size)
        compose.mainClock.advanceTimeBy(200)
        assertEquals("fading", if (reduceMotion) 0 else 1, compose.onAllNodesWithTag(SCALE_TAG).fetchSemanticsNodes().size)
        compose.mainClock.advanceTimeBy(300)
        assertEquals(0, compose.onAllNodesWithTag(SCALE_TAG).fetchSemanticsNodes().size)
    }

    private fun assertStep(value: String, unit: ScooterLengthUnit, points: Double, step: MapScale.Step?) {
        assertEquals(BigDecimal(value), step?.value)
        assertEquals(unit, step?.unit)
        assertEquals(points, step!!.points, 0.01)
    }
}

/** The scale at 200 ft in the United States, light and dark, at font scale 1.0 and 2.0: its words keep their size. */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = PHONE)
class MapScaleScreenshotTest(private val look: Look) {
    @get:Rule
    val compose = createComposeRule()

    @After
    fun tearDown() {
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
    }

    @Test
    fun enUS() {
        ScooterLanguage.current = ScooterLanguage.En
        useFontScale(look.fontScale)
        val step = MapScale.step(1.0)!!
        compose.setContent {
            ScootTheme(dark = look.dark, reduceMotion = true) {
                Box(Modifier.testTag(FRAME).background(ground(look.dark)).padding(12.dp)) {
                    ScaleArt(step, Locale.forLanguageTag("en-US"), dark = look.dark)
                }
            }
        }
        compose.waitForIdle()
        compose.drawWindowAgain()
        compose.onNodeWithTag(FRAME).captureRoboImage("src/test/screenshots/scale/enUS_${look.suffix}.png", roborazziOptions = screenshotOptions)
    }

    companion object {
        private const val FRAME = "frame"

        /** The calm ground's land, day and night (src/lib/quietGround.ts). */
        private fun ground(dark: Boolean) = if (dark) Color(0xFF0B0E14) else Color(0xFFEEF0F4)

        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0}")
        fun parameters(): List<Array<Any>> = Look.entries.map { arrayOf(it) }
    }
}
