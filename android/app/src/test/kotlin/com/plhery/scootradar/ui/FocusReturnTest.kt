package com.plhery.scootradar.ui

import android.content.Context
import android.view.View
import android.view.accessibility.AccessibilityManager
import android.view.accessibility.AccessibilityNodeInfo
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performKeyInput
import androidx.compose.ui.test.pressKey
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.EmptyScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.ui.dock.DockState
import com.plhery.scootradar.ui.sheet.MENU_TAG
import com.plhery.scootradar.ui.sheet.POPOVER_TAG
import com.plhery.scootradar.ui.theme.PHONE
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone

/**
 * TalkBack's focus goes back to the control that opened a menu, popover or sheet as it closes: the price's duration
 * button, Filters' and Settings' buttons, on a phone's sheets and beside a large window's panel (PLAN §10, 1 Nov).
 * TalkBack itself put it on the search bar or on a marker (app-ai's pass, F10 and SH3). TalkBack is played here: its
 * focus moves as its swipes and double taps move it, cleared where it was, as Android clears it.
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = PHONE)
@OptIn(ExperimentalTestApi::class)
class FocusReturnTest {
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
        // TalkBack on: touch exploration, under which Compose moves the accessibility focus.
        val accessibility = ApplicationProvider.getApplicationContext<Context>().getSystemService(AccessibilityManager::class.java)
        shadowOf(accessibility).setEnabled(true)
        shadowOf(accessibility).setTouchExplorationEnabled(true)
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

    private fun show(model: ScooterMapController, clock: TestClock = TestClock()) {
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = {}, glassBlurs = false)
            }
        }
        compose.waitForIdle()
    }

    /** Where TalkBack's focus is: a node's view and its id. */
    private var focused: Pair<View, Int>? = null

    private val SemanticsNode.view: View get() = (checkNotNull(root) as ViewRootForTest).view

    /**
     * TalkBack's focus moves to the node, as a swipe moves it. Android takes it from a window it leaves; within a
     * window Compose moves it.
     */
    private fun SemanticsNodeInteraction.focusedByTalkBack(): SemanticsNodeInteraction {
        val node = fetchSemanticsNode()
        compose.runOnIdle {
            focused?.let { (view, id) ->
                if (view != node.view && view.isAttachedToWindow) {
                    view.accessibilityNodeProvider.performAction(id, AccessibilityNodeInfo.ACTION_CLEAR_ACCESSIBILITY_FOCUS, null)
                }
            }
            assertTrue(node.view.accessibilityNodeProvider.performAction(node.id, AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS, null))
            focused = node.view to node.id
        }
        return this
    }

    /** TalkBack's double tap on the node it focuses. */
    private fun SemanticsNodeInteraction.doubleTapped() {
        val node = fetchSemanticsNode()
        compose.runOnIdle { assertTrue(node.view.accessibilityNodeProvider.performAction(node.id, AccessibilityNodeInfo.ACTION_CLICK, null)) }
        compose.waitForIdle()
    }

    /** Whether TalkBack's focus is on the node. */
    private fun SemanticsNodeInteraction.isFocusedByTalkBack(): Boolean {
        val node = fetchSemanticsNode()
        return compose.runOnIdle { node.view.accessibilityNodeProvider.createAccessibilityNodeInfo(node.id)!!.isAccessibilityFocused }
    }

    private fun button(label: String) = compose.onNode(hasContentDescription(label) and hasClickAction())

    /** Settings' Done, a checkmark TalkBack reads by its label. */
    private fun done() = button(localized("Done"))

    /** What closes a sheet or a popover from outside it: the dimmed map, or the room around the popover. */
    private fun outside() = button(localized("Close"))

    @Test
    fun filtersClosedPutsTheFocusBackOnItsButton() {
        show(controllers.make(EmptyScooterAPI))
        button("Filters").focusedByTalkBack().doubleTapped()
        compose.onAllNodes(hasText("Battery")).onFirst().focusedByTalkBack()
        outside().focusedByTalkBack().doubleTapped()
        compose.waitForIdle()
        assertTrue("TalkBack's focus on Filters' button", button("Filters").isFocusedByTalkBack())
    }

    @Test
    fun settingsClosedPutsTheFocusBackOnItsButton() {
        show(controllers.make(EmptyScooterAPI))
        button("Settings").focusedByTalkBack().doubleTapped()
        done().focusedByTalkBack().doubleTapped()
        compose.waitForIdle()
        assertTrue("TalkBack's focus on Settings' button", button("Settings").isFocusedByTalkBack())
    }

    /** Beside a large window's panel: Filters' popover, closed by a double tap outside it, and Settings' form. */
    @Test
    @Config(qualifiers = "w1280dp-h800dp-mdpi")
    fun besideThePanelThePopoverAndTheFormGiveTheFocusBack() {
        show(controllers.make(EmptyScooterAPI))
        button("Filters").focusedByTalkBack().doubleTapped()
        compose.onNodeWithTag(POPOVER_TAG).assertExists()
        compose.onAllNodes(hasText("Battery")).onFirst().focusedByTalkBack()
        outside().focusedByTalkBack().doubleTapped()
        compose.waitForIdle()
        compose.onNodeWithTag(POPOVER_TAG).assertDoesNotExist()
        assertTrue("TalkBack's focus on Filters' button", button("Filters").isFocusedByTalkBack())

        button("Settings").focusedByTalkBack().doubleTapped()
        done().focusedByTalkBack().doubleTapped()
        compose.waitForIdle()
        assertTrue("TalkBack's focus on Settings' button", button("Settings").isFocusedByTalkBack())
    }

    /**
     * The card's price menu, a window of its own: a length chosen, or the menu closed by Esc, puts the focus back on
     * the duration button, read with the length chosen.
     */
    @Test
    fun thePriceMenuClosedPutsTheFocusBackOnTheDurationButton() {
        val clock = TestClock()
        val model = DockState.ScooterCard.make(controllers, clock)
        show(model, clock)
        price(10).focusedByTalkBack().doubleTapped()
        compose.onNode(hasText("20 min") and hasAnyAncestor(hasTestTag(MENU_TAG))).focusedByTalkBack().doubleTapped()
        compose.onNodeWithTag(MENU_TAG).assertDoesNotExist()
        assertEquals(20, model.rideEstimateMinutes.value)
        assertTrue("TalkBack's focus on the duration button", price(20).isFocusedByTalkBack())

        price(20).doubleTapped()
        compose.onNode(hasText("5 min") and hasAnyAncestor(hasTestTag(MENU_TAG))).focusedByTalkBack()
        compose.onNodeWithTag(MENU_TAG).performKeyInput { pressKey(Key.Escape) }
        compose.waitForIdle()
        compose.onNodeWithTag(MENU_TAG).assertDoesNotExist()
        assertTrue("TalkBack's focus on the duration button", price(20).isFocusedByTalkBack())
    }

    /** The price cell, which reads the length chosen now. */
    private fun price(minutes: Long) =
        compose.onNode(hasContentDescription(stringFormat(localized("Ride estimate, %lld minutes. Change duration."), minutes)) and hasClickAction())
}
