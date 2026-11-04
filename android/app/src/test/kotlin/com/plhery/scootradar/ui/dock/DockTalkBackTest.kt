package com.plhery.scootradar.ui.dock

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.dockLead
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.LocalClock
import com.plhery.scootradar.ui.ScooterMapScreen
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

/**
 * What TalkBack reads of the dock's buttons that the iPhone's VoiceOver reads with a hint since 4 November
 * (ee9874f6): the nearest scooter's button and the price cell are named alone, and what a double tap does is said in
 * TalkBack's own sentence, "Double-tap to show scooter details", where their labels ended with "Show details." and
 * "Change duration." (ScooterControls.swift:1479 and 1707).
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = PHONE)
class DockTalkBackTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale

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
    fun theNearestScootersButtonIsNamedAloneAndHintsWhatItDoes() {
        val model = show(DockState.Nearest)
        val lead = checkNotNull(model.dockLead)
        val button = compose.onNode(SemanticsMatcher.expectValue(SemanticsProperties.ContentDescription, listOf(lead.accessibilityLabel)) and hasClickAction())
            .fetchSemanticsNode()
        assertTrue(lead.accessibilityLabel, lead.accessibilityLabel.startsWith("Nearest scooter: ") && lead.accessibilityLabel.endsWith("min on foot"))
        assertEquals(Role.Button, button.config.getOrNull(SemanticsProperties.Role))
        assertEquals("show scooter details", button.config[SemanticsActions.OnClick].label)
    }

    @Test
    fun thePriceCellIsNamedByTheLengthReadsTheFareAndHintsWhatItDoes() {
        show(DockState.ScooterCard)
        val cell = compose.onNode(SemanticsMatcher.expectValue(SemanticsProperties.ContentDescription, listOf("Ride estimate, 10 minutes")) and hasClickAction())
            .fetchSemanticsNode()
        // The fare is its state, as VoiceOver reads it as the cell's value.
        assertEquals("≈ CHF\u00A04.50 for 10 min", cell.config.getOrNull(SemanticsProperties.StateDescription))
        assertEquals("change the ride duration", cell.config[SemanticsActions.OnClick].label)
    }

    private fun show(state: DockState): ScooterMapController {
        val clock = TestClock()
        val model = state.make(controllers, clock)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = {}, glassBlurs = false)
            }
        }
        compose.waitForIdle()
        return model
    }
}
