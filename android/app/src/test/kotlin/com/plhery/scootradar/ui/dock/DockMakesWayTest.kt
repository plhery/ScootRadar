package com.plhery.scootradar.ui.dock

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeUp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.LocalClock
import com.plhery.scootradar.ui.ScooterMapScreen
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.useFontScale
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
 * The dock and the locate button while the search is open (ScooterMapScreen.swift:287-290, 315-318): faded out and
 * hidden from TalkBack, but still there, so that a card is where it was scrolled to when the search closes.
 */
@RunWith(AndroidJUnit4::class)
// The smallest phone the app is for, where at the largest text a scooter's card is taller than its room and scrolls.
@Config(qualifiers = "w360dp-h640dp-xhdpi")
class DockMakesWayTest {
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
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        Locale.setDefault(locale)
        TimeZone.setDefault(timeZone)
    }

    @Test
    fun aScrolledCardIsWhereItWasWhenTheSearchCloses() {
        val clock = TestClock()
        val model = DockState.ScooterCard.make(controllers, clock)
        useFontScale(2f)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = { Box(Modifier.fillMaxSize()) }, glassBlurs = false)
            }
        }
        compose.waitForIdle()
        val card = compose.onNode(hasAnyAncestor(hasTestTag(DOCK_TAG)) and SemanticsMatcher.keyIsDefined(SemanticsProperties.VerticalScrollAxisRange))
        card.performTouchInput { swipeUp() }
        compose.waitForIdle()
        val scrolled = card.offset()
        val range = card.fetchSemanticsNode().config[SemanticsProperties.VerticalScrollAxisRange]
        assertTrue("the card scrolled to $scrolled of ${range.maxValue()}", scrolled > 0f)

        compose.onNodeWithTag(SEARCH_ISLAND_TAG).performClick()
        compose.waitForIdle()
        val hidden = SemanticsMatcher.keyIsDefined(SemanticsProperties.HideFromAccessibility)
        compose.onNodeWithTag(DOCK_TAG).assert(hasAnyAncestor(hidden))
        assertEquals(scrolled, card.offset(), 0f)

        compose.onNodeWithText("Cancel").performClick()
        compose.waitForIdle()
        compose.onNodeWithTag(DOCK_TAG).assert(!hasAnyAncestor(hidden))
        assertEquals(scrolled, card.offset(), 0f)
    }

    private fun SemanticsNodeInteraction.offset(): Float =
        fetchSemanticsNode().config[SemanticsProperties.VerticalScrollAxisRange].value()
}
