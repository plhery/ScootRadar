package com.plhery.scootradar.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.dock.DOCK_TAG
import com.plhery.scootradar.ui.dock.DockState
import com.plhery.scootradar.ui.dock.PANEL_GRABBER_TAG
import com.plhery.scootradar.ui.search.SEARCH_FIELD_TAG
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import com.plhery.scootradar.ui.sheet.FORM_SHEET_TAG
import com.plhery.scootradar.ui.sheet.POPOVER_TAG
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone

/**
 * The dock and the panel switch as the screen changes size (UI-114, UI-127, UI-130), with the search, Filters or
 * Settings open: the scooter chosen stays chosen and the search stays open, Filters move between the dock's sheet
 * and the panel's popover, and Settings between the sheet and the form at the trailing side. The screen narrows to a
 * phone's width inside a tablet's window across, as a window does that is resized on a desktop.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "w1280dp-h800dp-mdpi")
class LayoutSwitchTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale

    /** How wide the screen is: a phone's, or the whole window. */
    private var width by mutableStateOf(PHONE_WIDTH)

    @Before
    fun setUp() {
        val swiss = Locale.forLanguageTag("en-CH")
        Locale.setDefault(swiss)
        ScooterLanguage.launchLocale = { swiss }
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Zurich"))
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        Locale.setDefault(locale)
        TimeZone.setDefault(timeZone)
    }

    @Test
    fun theSearchStaysOpenAndTheScooterChosenAcrossASwitch() {
        val model = show()
        assertLayout(dock = true)
        compose.onAllNodes(hasClickAction() and hasAnyAncestor(hasTestTag(SEARCH_ISLAND_TAG)))[0].performClick()
        compose.waitUntil { shows(hasTestTag(SEARCH_FIELD_TAG)) }

        width = WINDOW_WIDTH
        compose.waitForIdle()
        assertLayout(dock = false)
        assertEquals(true, shows(hasTestTag(SEARCH_FIELD_TAG)))
        assertEquals(CHOSEN, model.selectedScooterID.value)

        width = PHONE_WIDTH
        compose.waitForIdle()
        assertLayout(dock = true)
        assertEquals(true, shows(hasTestTag(SEARCH_FIELD_TAG)))
        compose.onNodeWithText("Cancel").performClick()
        compose.waitUntil { !shows(hasTestTag(SEARCH_FIELD_TAG)) }
        assertEquals(CHOSEN, model.selectedScooterID.value)
    }

    @Test
    fun openFiltersMoveBetweenTheSheetAndThePopover() {
        val model = show()
        compose.onNodeWithContentDescription("Filters").performClick()
        compose.waitForIdle()
        assertFilters(inSheet = true)

        width = WINDOW_WIDTH
        compose.waitForIdle()
        assertFilters(inSheet = false)
        assertEquals(CHOSEN, model.selectedScooterID.value)

        width = PHONE_WIDTH
        compose.waitForIdle()
        assertFilters(inSheet = true)
        assertEquals(CHOSEN, model.selectedScooterID.value)

        // Closed, by a tap on the dimmed map, the dock is back.
        compose.onNodeWithContentDescription("Close").performClick()
        compose.waitForIdle()
        assertEquals(false, shows(sheetGrabber))
        assertLayout(dock = true)
    }

    @Test
    fun openSettingsMoveBetweenTheFormAndTheSheet() {
        width = WINDOW_WIDTH
        val model = show()
        assertLayout(dock = false)
        compose.onNodeWithContentDescription("Settings").performClick()
        compose.waitForIdle()
        assertSettings(inForm = true)

        width = PHONE_WIDTH
        compose.waitForIdle()
        assertSettings(inForm = false)
        assertEquals(CHOSEN, model.selectedScooterID.value)

        width = WINDOW_WIDTH
        compose.waitForIdle()
        assertSettings(inForm = true)

        // Closed, by a tap beside the form, the panel is back, with the scooter's card.
        compose.onNodeWithContentDescription("Close").performClick()
        compose.waitForIdle()
        assertEquals(false, shows(hasTestTag(FORM_SHEET_TAG)))
        assertLayout(dock = false)
        assertEquals(CHOSEN, model.selectedScooterID.value)
    }

    /** The screen with Lime's scooter chosen, its card in the dock or the panel. */
    private fun show(): ScooterMapController {
        val clock = TestClock()
        val model = DockState.ScooterCard.make(controllers, clock)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                Box(Modifier.width(width).fillMaxHeight()) {
                    ScooterMapScreen(controller = model, map = {}, glassBlurs = false)
                }
            }
        }
        compose.waitForIdle()
        return model
    }

    private fun shows(matcher: SemanticsMatcher) = compose.onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty()

    private fun assertLayout(dock: Boolean) {
        assertEquals("the dock", dock, shows(hasTestTag(DOCK_TAG)) && !shows(hasTestTag(PANEL_GRABBER_TAG)))
        assertEquals("the panel", !dock, shows(hasTestTag(PANEL_GRABBER_TAG)))
    }

    private fun assertFilters(inSheet: Boolean) {
        assertEquals("Filters' sheet", inSheet, shows(sheetGrabber))
        assertEquals("Filters' popover", !inSheet, shows(hasTestTag(POPOVER_TAG)))
    }

    private fun assertSettings(inForm: Boolean) {
        assertEquals("Settings' form", inForm, shows(hasTestTag(FORM_SHEET_TAG)))
        assertEquals("Settings' sheet", !inForm, shows(sheetGrabber))
    }

    private companion object {
        /** A phone's width, which has the dock, and the tablet's window across, which has the panel. */
        val PHONE_WIDTH = 402.dp
        val WINDOW_WIDTH = 1280.dp

        const val CHOSEN = "lime:a"

        /** The dock's sheet's drag indicator, which a popover and a form don't have. */
        val sheetGrabber = hasContentDescription("Sheet Grabber")
    }
}
