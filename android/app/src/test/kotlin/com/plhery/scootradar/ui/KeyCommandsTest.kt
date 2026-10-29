package com.plhery.scootradar.ui

import android.view.KeyEvent as AndroidKeyEvent
import android.view.KeyboardShortcutGroup
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEvent
import androidx.compose.ui.input.key.nativeKeyCode
import androidx.compose.ui.test.KeyInjectionScope
import androidx.compose.ui.test.assertIsFocused
import androidx.compose.ui.test.isFocused
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performKeyInput
import androidx.compose.ui.test.pressKey
import androidx.compose.ui.test.requestFocus
import androidx.compose.ui.test.withKeyDown
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.MainActivity
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.AppleMapStyle
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterKeyCommand
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.dock.DockState
import com.plhery.scootradar.ui.dock.PANEL_GRABBER_TAG
import com.plhery.scootradar.ui.search.SEARCH_FIELD_TAG
import com.plhery.scootradar.ui.sheet.POPOVER_TAG
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.annotation.Config
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone

// T264 on Android: the screen's keyboard shortcuts (ui.md UI-101, UI-237 to UI-248) act through the keys, as
// ScooterMapModelTests.swift's testTheScreenMakesItsShortcutsAndTheyActOnIt runs the key commands it finds, and
// Android's shortcut helper lists them as the iPad's menu bar does (UI-102, UI-249). ScooterMapControllerTest has
// :core's T253 to T259.

@RunWith(AndroidJUnit4::class)
class KeyCommandsTest {
    @get:Rule
    val compose = createComposeRule()

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

    /** T264: beside the panel, each key that stands acts on the screen, and with the filters open none does. */
    @Test
    @Config(qualifiers = "w951dp-h669dp-mdpi")
    fun theScreenMakesItsShortcutsAndTheyActOnIt() {
        val model = show()
        val atRest = shortcuts.situation!!
        assertEquals(ScooterChromeLayout.Panel, atRest.layout)
        assertTrue(ScooterKeyCommand.SearchWithSlash in ScooterKeyCommand.available(atRest))
        assertFalse(ScooterKeyCommand.Close in ScooterKeyCommand.available(atRest))

        // A keyboard's focus on the panel, where the screen takes the keys before what has the focus.
        compose.onNodeWithTag(PANEL_GRABBER_TAG).requestFocus()
        press(Key.Two, listOf(Key.CtrlLeft))
        assertEquals(AppleMapStyle.Quiet, model.mapStyle.value)
        // Satellite has no imagery on Android, so its key is left alone, as Settings leaves it out (NEEDS-USER #3).
        press(Key.Three, listOf(Key.CtrlLeft))
        assertEquals(AppleMapStyle.Quiet, model.mapStyle.value)

        press(Key.Backslash, listOf(Key.CtrlLeft))
        assertTrue(model.isPanelCollapsed.value)
        press(Key.Backslash, listOf(Key.CtrlLeft))
        assertFalse(model.isPanelCollapsed.value)

        // ⌘+ and ⌘= each ask the map for a step in, ⌘− for one out.
        press(Key.Equals, listOf(Key.CtrlLeft))
        assertEquals(1, model.zoomRequest.value?.steps)
        press(Key.Equals, listOf(Key.CtrlLeft, Key.ShiftLeft))
        assertEquals(2, model.zoomRequest.value?.token)
        press(Key.Minus, listOf(Key.CtrlLeft))
        assertEquals(-1, model.zoomRequest.value?.steps)

        // A card, then the search over it: Esc closes the search in front, then the card.
        compose.runOnIdle { model.selectScooter("lime:a") }
        press(Key.F, listOf(Key.CtrlLeft))
        compose.onNodeWithTag(SEARCH_FIELD_TAG).assertExists()
        assertFalse("the field takes a typed /", ScooterKeyCommand.SearchWithSlash in available())
        press(Key.Escape)
        compose.onNodeWithTag(SEARCH_FIELD_TAG).assertDoesNotExist()
        assertEquals("the card stays", "lime:a", model.selectedScooterID.value)
        press(Key.Escape)
        assertNull(model.selectedScooterID.value)
        assertFalse(ScooterKeyCommand.Close in available())

        // "/" opens the search too, while it is closed.
        press(Key.Slash)
        compose.onNodeWithTag(SEARCH_FIELD_TAG).assertExists()
        press(Key.Escape)
        compose.onNodeWithTag(SEARCH_FIELD_TAG).assertDoesNotExist()

        // The filters open, and the screen leaves every key to them.
        press(Key.F, listOf(Key.CtrlLeft, Key.AltLeft))
        compose.onNodeWithTag(POPOVER_TAG).assertExists()
        assertEquals(emptyList<ScooterKeyCommand>(), available())
        press(Key.One, listOf(Key.CtrlLeft))
        assertEquals(AppleMapStyle.Quiet, model.mapStyle.value)
    }

    /** UI-251: the panel's grabber, which takes its touches itself, is reached with Tab and pressed with Enter or Space. */
    @Test
    @Config(qualifiers = "w951dp-h669dp-mdpi")
    fun theGrabberIsReachedWithTheKeyboardAndPressedWithEnter() {
        val model = show()
        compose.onNodeWithTag(PANEL_GRABBER_TAG).requestFocus()
        compose.onNodeWithTag(PANEL_GRABBER_TAG).assertIsFocused()
        press(Key.Enter)
        assertTrue(model.isPanelCollapsed.value)
        compose.onNodeWithTag(PANEL_GRABBER_TAG).requestFocus()
        press(Key.Spacebar)
        assertFalse(model.isPanelCollapsed.value)
    }

    /** A phone's dock doesn't fold, so ⌘\ is left alone there; ⌘, opens Settings as on the iPhone. */
    @Test
    @Config(qualifiers = "w402dp-h874dp-mdpi")
    fun onAPhoneThePanelsKeyIsLeftAlone() {
        val model = show()
        assertEquals(ScooterChromeLayout.Dock, shortcuts.situation!!.layout)
        press(Key.Backslash, listOf(Key.CtrlLeft))
        assertFalse(model.isPanelCollapsed.value)
        press(Key.Comma, listOf(Key.CtrlLeft))
        assertTrue(shortcuts.situation!!.isPresenting)
    }

    /** The key a command takes, as UIKit tells one from another: Ctrl for ⌘, Alt for ⌥, and Shift as it types. */
    @Test
    fun aKeyIsTheCharacterItTypesWithCtrlForCommandAndAltForOption() {
        val all = ScooterKeyCommand.entries
        fun command(keyCode: Int, meta: Int = 0) = keyCommand(
            KeyEvent(AndroidKeyEvent(0, 0, AndroidKeyEvent.ACTION_DOWN, keyCode, 0, meta)),
            all,
        )
        val ctrl = AndroidKeyEvent.META_CTRL_ON or AndroidKeyEvent.META_CTRL_LEFT_ON
        val alt = AndroidKeyEvent.META_ALT_ON or AndroidKeyEvent.META_ALT_LEFT_ON
        val shift = AndroidKeyEvent.META_SHIFT_ON or AndroidKeyEvent.META_SHIFT_LEFT_ON
        assertEquals(ScooterKeyCommand.Search, command(AndroidKeyEvent.KEYCODE_F, ctrl))
        assertEquals(ScooterKeyCommand.Filters, command(AndroidKeyEvent.KEYCODE_F, ctrl or alt))
        assertNull("⇧⌘F is another key", command(AndroidKeyEvent.KEYCODE_F, ctrl or shift))
        assertNull(command(AndroidKeyEvent.KEYCODE_F))
        assertNull("Meta is the system's", command(AndroidKeyEvent.KEYCODE_F, ctrl or AndroidKeyEvent.META_META_ON))
        assertEquals(ScooterKeyCommand.SearchWithSlash, command(AndroidKeyEvent.KEYCODE_SLASH))
        assertNull("? is another key", command(AndroidKeyEvent.KEYCODE_SLASH, shift))
        assertEquals(ScooterKeyCommand.ZoomInWithoutShift, command(AndroidKeyEvent.KEYCODE_EQUALS, ctrl))
        assertEquals(ScooterKeyCommand.ZoomIn, command(AndroidKeyEvent.KEYCODE_EQUALS, ctrl or shift))
        assertEquals(ScooterKeyCommand.ZoomIn, command(AndroidKeyEvent.KEYCODE_NUMPAD_ADD, ctrl))
        assertEquals(ScooterKeyCommand.ZoomOut, command(AndroidKeyEvent.KEYCODE_MINUS, ctrl))
        assertEquals(ScooterKeyCommand.ZoomOut, command(AndroidKeyEvent.KEYCODE_NUMPAD_SUBTRACT, ctrl))
        assertEquals(ScooterKeyCommand.SatelliteMap, command(AndroidKeyEvent.KEYCODE_3, ctrl))
        assertEquals(ScooterKeyCommand.Settings, command(AndroidKeyEvent.KEYCODE_COMMA, ctrl))
        assertEquals(ScooterKeyCommand.Fold, command(AndroidKeyEvent.KEYCODE_BACKSLASH, ctrl))
        assertEquals(ScooterKeyCommand.Close, command(AndroidKeyEvent.KEYCODE_ESCAPE))
        assertNull(command(AndroidKeyEvent.KEYCODE_ESCAPE, ctrl))
        // Only what stands is made: the others are left to whatever else takes the key.
        val event = KeyEvent(AndroidKeyEvent(0, 0, AndroidKeyEvent.ACTION_DOWN, AndroidKeyEvent.KEYCODE_ESCAPE, 0))
        assertNull(keyCommand(event, all - ScooterKeyCommand.Close))
        assertNull(keyCommand(KeyEvent(AndroidKeyEvent(0, 0, AndroidKeyEvent.ACTION_UP, AndroidKeyEvent.KEYCODE_ESCAPE, 0)), all))
    }

    /**
     * The helper lists Settings in the app's group, the map's looks and the panel in View, and the Map menu, by
     * their names in the language shown; "/", ⌘= and Esc stay off it, and what doesn't stand now is left off.
     */
    @Test
    fun theHelperListsTheShortcutsAsTheMenuBarDoesInTheLanguageShown() {
        val panel = ScooterKeyCommand.Situation(layout = ScooterChromeLayout.Panel, hasCard = true)
        assertEquals(
            listOf(
                "ScootRadar" to listOf("Settings Ctrl ,"),
                "View" to listOf("Standard Ctrl 1", "Quiet Ctrl 2", "Collapse panel Ctrl \\"),
                "Map" to listOf("Search Ctrl F", "Near me Ctrl L", "Zoom in Ctrl +", "Zoom out Ctrl -", "Filters Ctrl Alt F"),
            ),
            keyboardShortcutGroups(panel, "ScootRadar").described(),
        )

        ScooterLanguage.current = ScooterLanguage.De
        val folded = panel.copy(isFolded = true, isLocating = true)
        assertEquals(
            listOf(
                "ScootRadar" to listOf("Einstellungen Ctrl ,"),
                "Darstellung" to listOf("Standard Ctrl 1", "Ruhig Ctrl 2", "Bereich ausklappen Ctrl \\"),
                "Karte" to listOf("Suchen Ctrl F", "Vergrössern Ctrl +", "Verkleinern Ctrl -", "Filter Ctrl Alt F"),
            ),
            keyboardShortcutGroups(folded, "ScootRadar").described(),
        )
        // A phone's dock doesn't fold; with the filters open, nothing stands, and before the screen shows, nothing.
        assertFalse(
            "Bereich einklappen" in keyboardShortcutGroups(ScooterKeyCommand.Situation(ScooterChromeLayout.Dock), "ScootRadar")
                .described().flatMap { it.second }.joinToString(),
        )
        assertEquals(emptyList<KeyboardShortcutGroup>(), keyboardShortcutGroups(panel.copy(isPresenting = true), "ScootRadar"))
        assertEquals(emptyList<KeyboardShortcutGroup>(), keyboardShortcutGroups(null, "ScootRadar"))
    }

    /**
     * The activity hands Android's helper what the screen says stands, under the app's name, and hands the screen a
     * key that nothing focused took.
     */
    @Test
    @Config(qualifiers = "w1280dp-h800dp-mdpi")
    fun theActivityListsTheScreensShortcutsAndHandsItTheKeysNothingTook() {
        val activity = Robolectric.buildActivity(MainActivity::class.java).create().get()
        val none = mutableListOf<KeyboardShortcutGroup>()
        activity.onProvideKeyboardShortcuts(none, null, 0)
        assertEquals(emptyList<KeyboardShortcutGroup>(), none)

        val performed = mutableListOf<ScooterKeyCommand>()
        activity.shortcuts.situation = ScooterKeyCommand.Situation(layout = ScooterChromeLayout.Dock)
        activity.shortcuts.perform = { performed += it }
        val groups = mutableListOf<KeyboardShortcutGroup>()
        activity.onProvideKeyboardShortcuts(groups, null, 0)
        assertEquals(listOf("ScootRadar", "View", "Map"), groups.map { it.label.toString() })

        val ctrl = AndroidKeyEvent.META_CTRL_ON or AndroidKeyEvent.META_CTRL_LEFT_ON
        val ctrlL = AndroidKeyEvent(0, 0, AndroidKeyEvent.ACTION_DOWN, AndroidKeyEvent.KEYCODE_L, 0, ctrl)
        assertTrue(activity.onKeyDown(ctrlL.keyCode, ctrlL))
        assertEquals(listOf(ScooterKeyCommand.NearMe), performed)
        // Esc with nothing to close does nothing, and is taken so that Android doesn't make it Back and leave the
        // app (UI-245); over a sheet it is left to be Back, which closes the sheet.
        val escape = AndroidKeyEvent(AndroidKeyEvent.ACTION_DOWN, AndroidKeyEvent.KEYCODE_ESCAPE)
        assertTrue(activity.onKeyDown(escape.keyCode, escape))
        assertEquals(listOf(ScooterKeyCommand.NearMe), performed)
        assertFalse(activity.isFinishing)
        activity.shortcuts.situation = ScooterKeyCommand.Situation(layout = ScooterChromeLayout.Dock, isPresenting = true)
        assertFalse(activity.onKeyDown(escape.keyCode, escape))
    }

    /** A phone's helper lists none of the screen's shortcuts, as an iPhone has no menu bar, but its keys still act. */
    @Test
    @Config(qualifiers = "w402dp-h874dp-mdpi")
    fun aPhoneListsNoShortcutsButItsKeysStillAct() {
        val activity = Robolectric.buildActivity(MainActivity::class.java).create().get()
        val performed = mutableListOf<ScooterKeyCommand>()
        activity.shortcuts.situation = ScooterKeyCommand.Situation(layout = ScooterChromeLayout.Dock)
        activity.shortcuts.perform = { performed += it }
        val groups = mutableListOf<KeyboardShortcutGroup>()
        activity.onProvideKeyboardShortcuts(groups, null, 0)
        assertEquals(emptyList<String>(), groups.map { it.label.toString() })

        val ctrl = AndroidKeyEvent.META_CTRL_ON or AndroidKeyEvent.META_CTRL_LEFT_ON
        val ctrlL = AndroidKeyEvent(0, 0, AndroidKeyEvent.ACTION_DOWN, AndroidKeyEvent.KEYCODE_L, 0, ctrl)
        assertTrue(activity.onKeyDown(ctrlL.keyCode, ctrlL))
        assertEquals(listOf(ScooterKeyCommand.NearMe), performed)
    }

    private fun List<KeyboardShortcutGroup>.described(): List<Pair<String, List<String>>> = map { group ->
        group.label.toString() to group.items.map { item ->
            val keys = listOfNotNull(
                "Ctrl".takeIf { item.modifiers and AndroidKeyEvent.META_CTRL_ON != 0 },
                "Alt".takeIf { item.modifiers and AndroidKeyEvent.META_ALT_ON != 0 },
            )
            val key = when (item.keycode) {
                AndroidKeyEvent.KEYCODE_F -> "F"
                AndroidKeyEvent.KEYCODE_L -> "L"
                AndroidKeyEvent.KEYCODE_1 -> "1"
                AndroidKeyEvent.KEYCODE_2 -> "2"
                AndroidKeyEvent.KEYCODE_3 -> "3"
                AndroidKeyEvent.KEYCODE_PLUS -> "+"
                AndroidKeyEvent.KEYCODE_MINUS -> "-"
                AndroidKeyEvent.KEYCODE_COMMA -> ","
                AndroidKeyEvent.KEYCODE_BACKSLASH -> "\\"
                else -> "${item.keycode}"
            }
            (listOf(item.label.toString()) + keys + key).joinToString(" ")
        }
    }

    private fun available(): List<ScooterKeyCommand> = ScooterKeyCommand.available(shortcuts.situation!!)

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

    /**
     * [key] pressed with [held] down, as a hardware keyboard sends it, and the screen at rest after it: to what has
     * the focus, through the screen first, or, with nothing focused, to the activity, which hands it to the screen
     * (MainActivity.onKeyDown). A focus with no semantics, as a popover's, counts as none: the screen leaves every key
     * to the popover either way.
     */
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
            Key.ShiftLeft to (AndroidKeyEvent.META_SHIFT_ON or AndroidKeyEvent.META_SHIFT_LEFT_ON),
        )
    }
}
