package com.plhery.scootradar.ui.filters

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.LocalClock
import com.plhery.scootradar.ui.ScooterMapScreen
import com.plhery.scootradar.ui.dock.DOCK_TAG
import com.plhery.scootradar.ui.dock.DockState
import com.plhery.scootradar.ui.dock.PANEL_GRABBER_TAG
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

// UI-060 and UI-128: ScooterMapScreen.swift:181-184 gives the dock's Filters sheet the large detent only in a window
// under 700 points tall (`windowHeight < 700 ? [.large] : [.medium, .large]`), the whole window's height.

/**
 * In a tablet's and a fold's windows that have the dock (ui.md UI-115: under 480 dp tall, or under 760 wide), Filters
 * opens at the large height in a window under 700 dp tall, its providers in view, and has no medium height there to
 * stop at; it opens halfway in a window 700 tall or taller.
 */
@RunWith(AndroidJUnit4::class)
class FiltersDetentTest {
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

    /** The Tablet across, split top and bottom: the dock, 400 dp tall, where Filters opens at the large height. */
    @Test
    @Config(qualifiers = "w1280dp-h400dp-mdpi")
    fun inATabletsHalfAcrossFiltersOpenAtTheLargeHeight() {
        openFilters()
        // The large detent's top, 10 under the top of the window.
        assertEquals(10f, sheetTop, 1f)
    }

    /** The Fold folded and on its side: the dock, 443 dp tall, where Filters opens at the large height. */
    @Test
    @Config(qualifiers = "w970dp-h443dp-mdpi")
    fun onAFoldFoldedOnItsSideFiltersOpenAtTheLargeHeight() {
        openFilters()
        assertEquals(10f, sheetTop, 1f)
    }

    /** The Tablet across, split side by side: the dock, 800 dp tall, where Filters opens halfway. */
    @Test
    @Config(qualifiers = "w640dp-h800dp-mdpi")
    fun inATabletsHalfSideBySideFiltersOpenHalfway() {
        openFilters()
        // Half the large height, (800 − 10) / 2, under the large detent's top.
        assertEquals(800 - 790 / 2f, sheetTop, 1f)
    }

    /** A dock's window 699 dp tall, one short of iOS's 700: Filters opens at the large height. */
    @Test
    @Config(qualifiers = "w640dp-h699dp-mdpi")
    fun inAWindowOneShortOf700FiltersOpenAtTheLargeHeight() {
        openFilters()
        assertEquals(10f, sheetTop, 1f)
    }

    /** A dock's window 700 dp tall, iOS's first with the medium detent: Filters opens halfway. */
    @Test
    @Config(qualifiers = "w640dp-h700dp-mdpi")
    fun inAWindow700TallFiltersOpenHalfway() {
        openFilters()
        assertEquals(700 - 690 / 2f, sheetTop, 1f)
    }

    /**
     * A short window's sheet has the large detent only: dragged down nearer where a medium one would be, (699 − 10) / 2
     * under the large one's top, than the large one, and let go still, it goes back up to the large height, as UIKit's
     * goes to the closest detent it has.
     */
    @Test
    @Config(qualifiers = "w640dp-h699dp-mdpi")
    fun inAShortWindowFiltersDraggedDownDontStopHalfway() {
        openFilters()
        compose.onNode(sheet).performTouchInput { down(Offset(centerX, 12.dp.toPx())) }
        // Down a step a frame until the sheet's top is past 250: nearer a medium detent's 354.5 than the large one's 10.
        repeat(100) {
            if (sheetTop < 250) compose.onNode(sheet).performTouchInput { moveBy(Offset(0f, 10.dp.toPx())) }
        }
        assertTrue("the sheet dragged down to $sheetTop", sheetTop in 250f..354f)
        compose.onNode(sheet).performTouchInput {
            // Held there a moment, so that it is let go without a fling.
            advanceEventTime(300)
            up()
        }
        compose.waitForIdle()
        assertTrue("the sheet is open", shows(sheet))
        assertEquals(10f, sheetTop, 1f)
    }

    /** The screen with its dock, and Filters opened from the search bar's button. */
    private fun openFilters() {
        val clock = TestClock()
        val model = DockState.Summary.make(controllers, clock)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = {}, glassBlurs = false)
            }
        }
        compose.waitForIdle()
        assertTrue("the dock", shows(hasTestTag(DOCK_TAG)) && !shows(hasTestTag(PANEL_GRABBER_TAG)))
        compose.onNodeWithContentDescription("Filters").performClick()
        compose.waitForIdle()
    }

    private fun shows(matcher: SemanticsMatcher) = compose.onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty()

    /** The sheet's top, in dp from the window's. */
    private val sheetTop get() = compose.onNode(sheet).fetchSemanticsNode().boundsInRoot.top / compose.density.density

    private companion object {
        val sheet = SemanticsMatcher.expectValue(SemanticsProperties.PaneTitle, "Filters")
    }
}
