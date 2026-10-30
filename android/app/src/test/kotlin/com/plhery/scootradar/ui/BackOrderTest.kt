package com.plhery.scootradar.ui

import android.view.KeyEvent as AndroidKeyEvent
import androidx.activity.BackEventCompat
import androidx.activity.ComponentActivity
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEvent
import androidx.compose.ui.input.key.nativeKeyCode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.KeyInjectionScope
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isFocused
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performKeyInput
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.pressKey
import androidx.compose.ui.test.withKeyDown
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.dock.DockState
import com.plhery.scootradar.ui.search.SEARCH_FIELD_TAG
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone

// X.md X-AD01: Android's Back closes the layer in front, in the order Esc closes them on the iPad
// (ScooterMapScreen.swift's key commands, UI-245), and with nothing open is left to Android, which takes the rider
// home. Each layer's own Back is tested beside it: IosSheetTest (a sheet), SettingsSheetTest (a page of Settings),
// SearchAndLanguageTest (the keyboard, the search and the card, on the device); PredictiveBackTest has a sheet, the form
// and a page under the gesture drawn out (X-AD02), and the search's is here.

@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w402dp-h874dp-mdpi")
class BackOrderTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private val controllers = TestControllers()
    private val shortcuts = ScreenShortcuts()
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

    /**
     * Over a scooter's card: the search, then Settings with a pass open, then the filters, each closed by Back
     * without the card; then the card; then nothing takes Back, which leaves the app.
     */
    @Test
    fun backClosesWhatIsInFrontOneLayerAtATimeThenLeavesTheApp() = backClosesOneLayerAtATime()

    /** Beside the panel, where Settings is a form at the window's end and the filters a popover, in the same order. */
    @Test
    @Config(qualifiers = "w1280dp-h800dp-mdpi")
    fun besideThePanelBackClosesThePopoverAndTheFormInTheSameOrder() = backClosesOneLayerAtATime(beside = true)

    /**
     * The search beside the panel, under a back gesture drawn out: iOS has no gesture for it, only Cancel and Esc, so
     * it stays as it is while the gesture is drawn, stays open when it is called off, and closes as Cancel closes it
     * when it is let go. Android draws nothing for it meanwhile, as the app takes the gesture.
     */
    @Test
    @Config(qualifiers = "w1280dp-h800dp-mdpi")
    fun theSearchStaysAsItIsUnderABackGestureAndClosesWhenItIsLetGo() {
        show()
        press(Key.F, listOf(Key.CtrlLeft))
        val field = compose.onNodeWithTag(SEARCH_FIELD_TAG)
        val frame = field.fetchSemanticsNode().boundsInRoot

        drawOut(0.5f)
        assertEquals(frame, field.fetchSemanticsNode().boundsInRoot)
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.dispatchOnBackCancelled() }
        compose.waitForIdle()
        assertEquals(frame, field.fetchSemanticsNode().boundsInRoot)

        drawOut(0.5f)
        back()
        field.assertDoesNotExist()
    }

    /** A back gesture from the window's start edge, drawn out to [progress], as Android 14 and later send it. */
    private fun drawOut(progress: Float) {
        val dispatcher = compose.activity.onBackPressedDispatcher
        compose.runOnUiThread { dispatcher.dispatchOnBackStarted(BackEventCompat(0f, 400f, 0f, BackEventCompat.EDGE_LEFT)) }
        compose.runOnUiThread { dispatcher.dispatchOnBackProgressed(BackEventCompat(0f, 400f, progress, BackEventCompat.EDGE_LEFT)) }
        compose.waitForIdle()
    }

    private fun backClosesOneLayerAtATime(beside: Boolean = false) {
        val model = show()
        if (beside) assertEquals(ScooterChromeLayout.Panel, shortcuts.situation!!.layout)
        compose.runOnIdle { model.selectScooter("lime:a") }

        press(Key.F, listOf(Key.CtrlLeft))
        compose.onNodeWithTag(SEARCH_FIELD_TAG).assertExists()
        back()
        compose.onNodeWithTag(SEARCH_FIELD_TAG).assertDoesNotExist()
        assertEquals("the card stays", "lime:a", model.selectedScooterID.value)

        press(Key.Comma, listOf(Key.CtrlLeft))
        assertTrue(shortcuts.situation!!.isPresenting)
        compose.onNode(hasText("Lime") and hasClickAction()).performScrollTo().performClick()
        compose.waitForIdle()
        compose.onNode(heading("Lime pass")).assertExists()
        back()
        compose.onNode(heading("Settings")).assertExists()
        assertTrue("Settings stays open under the page", shortcuts.situation!!.isPresenting)
        back()
        assertFalse(shortcuts.situation!!.isPresenting)
        assertEquals("the card stays", "lime:a", model.selectedScooterID.value)

        press(Key.F, listOf(Key.CtrlLeft, Key.AltLeft))
        assertTrue(shortcuts.situation!!.isPresenting)
        back()
        assertFalse(shortcuts.situation!!.isPresenting)
        assertEquals("the card stays", "lime:a", model.selectedScooterID.value)

        back()
        assertNull(model.selectedScooterID.value)
        assertFalse("nothing keeps Back from Android", compose.activity.onBackPressedDispatcher.hasEnabledCallbacks())
    }

    private fun heading(text: String) = SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading) and hasText(text)

    /** The phone's Back, and the screen at rest after it. */
    private fun back() {
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.onBackPressed() }
        compose.waitForIdle()
    }

    /** The screen on the list of providers, with the map's stand-in, saying what its keys stand for. */
    private fun show(): ScooterMapController {
        val clock = TestClock()
        val model = DockState.Summary.make(controllers, clock)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = { }, glassBlurs = false, shortcuts = shortcuts)
            }
        }
        compose.waitForIdle()
        return model
    }

    /** [key] with [held] down, as KeyCommandsTest presses it: to what has the focus, or else to the screen's shortcuts. */
    private fun press(key: Key, held: List<Key> = emptyList()) {
        if (compose.onAllNodes(isFocused()).fetchSemanticsNodes().isNotEmpty()) {
            fun KeyInjectionScope.down(keys: List<Key>) {
                if (keys.isEmpty()) pressKey(key) else withKeyDown(keys.first()) { down(keys.drop(1)) }
            }
            compose.onRoot().performKeyInput { down(held) }
        } else {
            val meta = held.fold(0) { meta, down -> meta or META.getValue(down) }
            compose.runOnIdle { shortcuts.handle(KeyEvent(AndroidKeyEvent(0, 0, AndroidKeyEvent.ACTION_DOWN, key.nativeKeyCode, 0, meta))) }
        }
        compose.waitForIdle()
    }

    private companion object {
        val META = mapOf(
            Key.CtrlLeft to (AndroidKeyEvent.META_CTRL_ON or AndroidKeyEvent.META_CTRL_LEFT_ON),
            Key.AltLeft to (AndroidKeyEvent.META_ALT_ON or AndroidKeyEvent.META_ALT_LEFT_ON),
        )
    }
}
