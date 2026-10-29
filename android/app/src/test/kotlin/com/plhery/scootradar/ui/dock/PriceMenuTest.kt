package com.plhery.scootradar.ui.dock

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performKeyInput
import androidx.compose.ui.test.pressKey
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.ui.LocalClock
import com.plhery.scootradar.ui.ScooterMapScreen
import com.plhery.scootradar.ui.sheet.MENU_TAG
import com.plhery.scootradar.ui.theme.PHONE
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone

// UI-056, UI-227 and UI-404: the price cell's menu of ride lengths, as the iPhone's Menu works.

@RunWith(AndroidJUnit4::class)
@Config(qualifiers = PHONE)
@OptIn(ExperimentalTestApi::class)
class PriceMenuTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale
    private lateinit var model: ScooterMapController

    @Before
    fun setUp() {
        val swiss = Locale.forLanguageTag("en-CH")
        Locale.setDefault(swiss)
        ScooterLanguage.launchLocale = { swiss }
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Zurich"))
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
        ScooterLanguage.current = ScooterLanguage.En
        val clock = TestClock()
        model = DockState.ScooterCard.make(controllers, clock)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = {}, glassBlurs = false)
            }
        }
        compose.waitForIdle()
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

    /** Five lengths, each a button at least 44 points high, the chosen one ticked: TalkBack reads it selected. */
    @Test
    fun thePriceCellOpensTheLengthsWithTheChosenOneTicked() {
        open(minutes = 10)
        val rows = compose.onAllNodes(hasAnyAncestor(hasTestTag(MENU_TAG)) and hasClickAction()).fetchSemanticsNodes()
        assertEquals(
            listOf("5 min", "10 min", "15 min", "20 min", "30 min"),
            rows.map { it.config[SemanticsProperties.Text].joinToString() },
        )
        val density = compose.density.density
        for (row in rows) {
            val title = row.config[SemanticsProperties.Text].joinToString()
            assertEquals(title, Role.Button, row.config.getOrNull(SemanticsProperties.Role))
            // Not "Not selected" on the others: VoiceOver gives no row a selected trait.
            assertEquals(title, if (title == "10 min") true else null, row.config.getOrNull(SemanticsProperties.Selected))
            assertTrue("$title is ${row.size.height / density} high", row.size.height >= 44 * density)
        }
    }

    /** A length chosen is the card's from then on, and the menu closes. */
    @Test
    fun choosingALengthSetsItAndClosesTheMenu() {
        open(minutes = 10)
        compose.onNode(hasText("20 min") and hasClickAction()).performClick()
        compose.waitForIdle()
        assertEquals(20, model.rideEstimateMinutes.value)
        compose.onNodeWithTag(MENU_TAG).assertDoesNotExist()

        open(minutes = 20)
        val chosen = compose.onAllNodes(hasAnyAncestor(hasTestTag(MENU_TAG)) and hasClickAction()).fetchSemanticsNodes()
            .filter { it.config.getOrNull(SemanticsProperties.Selected) == true }
            .map { it.config[SemanticsProperties.Text].joinToString() }
        assertEquals(listOf("20 min"), chosen)
    }

    /** A hardware keyboard's Esc closes the menu, leaving the length as it was. */
    @Test
    fun escClosesTheMenuLeavingTheLength() {
        open(minutes = 10)
        compose.onNodeWithTag(MENU_TAG).performKeyInput { pressKey(Key.Escape) }
        compose.waitForIdle()
        compose.onNodeWithTag(MENU_TAG).assertDoesNotExist()
        assertEquals(10, model.rideEstimateMinutes.value)
    }

    /** Taps the price cell, which reads the length chosen now. */
    private fun open(minutes: Long) {
        val label = stringFormat(localized("Ride estimate, %lld minutes. Change duration."), minutes)
        compose.onNode(hasContentDescription(label) and hasClickAction()).performClick()
        compose.waitForIdle()
        compose.onNodeWithTag(MENU_TAG).assertExists()
    }
}
