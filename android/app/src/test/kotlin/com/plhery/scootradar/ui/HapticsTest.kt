package com.plhery.scootradar.ui

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.hapticfeedback.HapticFeedback
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.AppleMapStyle
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.ui.dock.DockState
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import java.time.ZoneId
import java.util.Locale

// `.sensoryFeedback(.selection, trigger:)` in ScooterControls.swift:218, 2020-2021 and 2400-2402 (ui.md UI-216 to
// UI-218), as the screen asks Android for its segment tick.

/** The selection tick: once for each choice changed while its sheet is open, never as a sheet first shows. */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w390dp-h844dp-xhdpi")
class HapticsTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val haptics = RecordingHaptics()

    @Before
    fun setUp() {
        Locale.setDefault(Locale.forLanguageTag("en-CH"))
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        Locale.setDefault(locale)
    }

    private fun show(): ScooterMapController {
        val clock = TestClock()
        val model = DockState.Summary.make(controllers, clock)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }, LocalHapticFeedback provides haptics) {
                ScooterMapScreen(controller = model, map = { }, glassBlurs = false)
            }
        }
        compose.waitForIdle()
        return model
    }

    /** What the controller is told, as a tap in an open sheet tells it, and the screen at rest after it. */
    private fun change(block: () -> Unit) {
        compose.runOnIdle(block)
        compose.waitForIdle()
    }

    /**
     * UI-216 and UI-217: with the filters open over the dock, a provider shown or hidden ticks once, not once for the
     * dock and once for the sheet, and so does a battery minimum chosen.
     */
    @Test
    fun theFiltersTickOnceForEachChoice() {
        val model = show()
        assertEquals("the screen's first showing", 0, haptics.ticks)

        compose.onNodeWithContentDescription("Filters").performClick()
        compose.waitForIdle()
        assertEquals("the sheet's first showing", 0, haptics.ticks)

        change { model.toggle(ScooterProvider.Lime) }
        assertEquals(1, haptics.ticks)
        change { model.toggle(ScooterProvider.Lime) }
        assertEquals(2, haptics.ticks)
        change { model.setMinimumBattery(30.0) }
        assertEquals(3, haptics.ticks)
        // The same minimum again is no change.
        change { model.setMinimumBattery(30.0) }
        assertEquals(3, haptics.ticks)
        assertEquals(listOf(HapticFeedbackType.SegmentTick), haptics.types.distinct())
    }

    /**
     * UI-218: with Settings open, the appearance, the map's style and the language each tick once as they change; the
     * style changed from the keyboard with Settings closed doesn't.
     */
    @Test
    fun settingsTickOnceForEachChoiceAndTheKeyboardsStyleDoesnt() {
        val model = show()
        change { model.setMapStyle(AppleMapStyle.Standard) }
        assertEquals("Settings closed", 0, haptics.ticks)

        compose.onNodeWithContentDescription("Settings").performClick()
        compose.waitForIdle()
        assertEquals("the sheet's first showing", 0, haptics.ticks)

        change { model.setAppearance(ScooterAppearance.Dark) }
        assertEquals(1, haptics.ticks)
        change { model.setMapStyle(AppleMapStyle.Quiet) }
        assertEquals(2, haptics.ticks)
        change { model.setLanguageChoice(ScooterLanguageChoice.Language(ScooterLanguage.Fr)) }
        assertEquals(3, haptics.ticks)
        assertEquals(listOf(HapticFeedbackType.SegmentTick), haptics.types.distinct())
    }
}

/** A phone's haptics that keep what they were asked for. */
private class RecordingHaptics : HapticFeedback {
    val types = mutableListOf<HapticFeedbackType>()
    val ticks: Int get() = types.count { it == HapticFeedbackType.SegmentTick }

    override fun performHapticFeedback(hapticFeedbackType: HapticFeedbackType) {
        types += hapticFeedbackType
    }
}
