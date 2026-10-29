package com.plhery.scootradar.map

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshots.Snapshot
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.github.takahirom.roborazzi.captureRoboImage
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.theme.Look
import com.plhery.scootradar.ui.theme.PHONE
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.drawWindowAgain
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.screenshotOptions
import com.plhery.scootradar.ui.theme.useFontScale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

// MAP-021, MAP-211 and MAP-225: MapKit's compass as the app adds it, shown while the map is turned, read by TalkBack
// as MapKit's word, and turning the map north at a tap.

@RunWith(AndroidJUnit4::class)
@Config(qualifiers = PHONE)
class MapCompassTest {
    @get:Rule
    val compose = createComposeRule()

    @After
    fun tearDown() {
        ScooterLanguage.current = ScooterLanguage.atLaunch
    }

    @Test
    fun itShowsWhileTheMapIsTurnedAndATapTurnsItNorth() {
        ScooterLanguage.current = ScooterLanguage.En
        var bearing by mutableDoubleStateOf(0.0)
        var taps = 0
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                MapCompass(bearing = { bearing }, showsMapCompass = true, dark = false, onTap = { taps += 1 })
            }
        }
        assertEquals(0, compose.onAllNodesWithTag(COMPASS_TAG).fetchSemanticsNodes().size)

        bearing = 30.0
        compose.onNodeWithContentDescription("Compass").assertHasClickAction().performClick()
        assertEquals(1, taps)
        compose.onNodeWithTag(COMPASS_TAG).assertHasClickAction()

        // Back at north, gone at once under Remove animations.
        bearing = 360.0
        compose.waitForIdle()
        assertEquals(0, compose.onAllNodesWithTag(COMPASS_TAG).fetchSemanticsNodes().size)
    }

    @Test
    fun itMakesWayWhereTheMapShowsNoCompass() {
        var shows by mutableStateOf(false)
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                MapCompass(bearing = { 45.0 }, showsMapCompass = shows, dark = false, onTap = {})
            }
        }
        assertEquals(0, compose.onAllNodesWithTag(COMPASS_TAG).fetchSemanticsNodes().size)
        shows = true
        compose.waitForIdle()
        assertEquals(1, compose.onAllNodesWithTag(COMPASS_TAG).fetchSemanticsNodes().size)
    }

    /** It fades out over a quarter of a second, taking no taps meanwhile; turned again it is back at once. */
    @Test
    fun itFadesOutAtNorth() {
        var bearing by mutableDoubleStateOf(30.0)
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = false) {
                MapCompass(bearing = { bearing }, showsMapCompass = true, dark = false, onTap = {})
            }
        }
        compose.waitForIdle()
        compose.mainClock.autoAdvance = false
        compose.runOnUiThread {
            bearing = 0.0
            Snapshot.sendApplyNotifications()
        }
        compose.mainClock.advanceTimeByFrame()
        compose.mainClock.advanceTimeBy(100)
        val fading = compose.onAllNodesWithTag(COMPASS_TAG).fetchSemanticsNodes()
        assertEquals(1, fading.size)
        assertEquals("no taps while it fades", null, fading.single().config.getOrNull(SemanticsProperties.ContentDescription))
        compose.mainClock.advanceTimeBy(300)
        assertEquals(0, compose.onAllNodesWithTag(COMPASS_TAG).fetchSemanticsNodes().size)
    }

    @Test
    fun talkBackReadsMapKitsWordInTheAppsLanguage() {
        ScooterLanguage.current = ScooterLanguage.De
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                MapCompass(bearing = { 30.0 }, showsMapCompass = true, dark = false, onTap = {})
            }
        }
        compose.onNodeWithContentDescription("Kompass").assertHasClickAction()
    }
}

/** The compass turned 30°, as the map turned 30° east of north shows it, light and dark, at font scale 1.0 and 2.0. */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = PHONE)
class MapCompassScreenshotTest(private val look: Look) {
    @get:Rule
    val compose = createComposeRule()

    @After
    fun tearDown() {
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
    }

    @Test
    fun turned() {
        ScooterLanguage.current = ScooterLanguage.En
        useFontScale(look.fontScale)
        compose.setContent {
            ScootTheme(dark = look.dark, reduceMotion = true) {
                Box(Modifier.testTag(FRAME).background(ground(look.dark)).padding(12.dp)) {
                    MapCompass(bearing = { 30.0 }, showsMapCompass = true, dark = look.dark, onTap = {})
                }
            }
        }
        compose.waitForIdle()
        compose.drawWindowAgain()
        compose.onNodeWithTag(FRAME).captureRoboImage("src/test/screenshots/compass/turned_${look.suffix}.png", roborazziOptions = screenshotOptions)
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
