package com.plhery.scootradar.ui

import android.view.KeyEvent as AndroidKeyEvent
import android.view.KeyboardShortcutGroup
import android.view.KeyboardShortcutInfo
import androidx.compose.ui.input.key.KeyEvent
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.isAltPressed
import androidx.compose.ui.input.key.isCtrlPressed
import androidx.compose.ui.input.key.isMetaPressed
import androidx.compose.ui.input.key.isShiftPressed
import androidx.compose.ui.input.key.type
import com.plhery.scootradar.core.model.ScooterKeyCommand
import com.plhery.scootradar.core.model.ScooterMenuBar
import com.plhery.scootradar.core.model.localized

// KeyCommandButtons and ScooterCommands of ios/ScootRadar/Views/ScooterMapScreen.swift: the screen's keyboard
// shortcuts (ui.md UI-101, UI-237 to UI-248), and the iPad's menu bar, which Android lists in its keyboard shortcut
// helper (UI-102, UI-249).

/**
 * The command among [available] that a key pressed with [event] stands for, as UIKit matches a key command: Ctrl
 * stands for ⌘ and Alt for ⌥, and the key is the character it types, with Shift where the character takes it, as
 * + does on most keyboards; a letter typed with Shift is another key. Where the character matches none, a key
 * pressed without Shift is the key in that place on an American keyboard, as ⌘1 is on a French one, whose 1 takes
 * Shift. Meta is the system's.
 */
internal fun keyCommand(event: KeyEvent, available: List<ScooterKeyCommand>): ScooterKeyCommand? {
    if (event.type != KeyEventType.KeyDown || event.isMetaPressed) return null
    val held = available.filter { command ->
        (ScooterKeyCommand.Modifier.Command in command.modifiers) == event.isCtrlPressed &&
            (ScooterKeyCommand.Modifier.Option in command.modifiers) == event.isAltPressed
    }
    val native = event.nativeKeyEvent
    val typed = native.getUnicodeChar(native.metaState and AndroidKeyEvent.META_SHIFT_MASK)
    return held.firstOrNull { typed != 0 && typed.toChar() == it.key.character }
        ?: held.firstOrNull { !event.isShiftPressed && native.keyCode in it.keyCodes }
}

/** The keys that type the command's key on an American keyboard, its number pad's too; Esc types nothing. */
internal val ScooterKeyCommand.keyCodes: List<Int>
    get() = when (this) {
        ScooterKeyCommand.Search, ScooterKeyCommand.Filters -> listOf(AndroidKeyEvent.KEYCODE_F)
        ScooterKeyCommand.SearchWithSlash -> listOf(AndroidKeyEvent.KEYCODE_SLASH, AndroidKeyEvent.KEYCODE_NUMPAD_DIVIDE)
        ScooterKeyCommand.NearMe -> listOf(AndroidKeyEvent.KEYCODE_L)
        ScooterKeyCommand.ZoomIn -> listOf(AndroidKeyEvent.KEYCODE_PLUS, AndroidKeyEvent.KEYCODE_NUMPAD_ADD)
        ScooterKeyCommand.ZoomInWithoutShift -> listOf(AndroidKeyEvent.KEYCODE_EQUALS, AndroidKeyEvent.KEYCODE_NUMPAD_EQUALS)
        ScooterKeyCommand.ZoomOut -> listOf(AndroidKeyEvent.KEYCODE_MINUS, AndroidKeyEvent.KEYCODE_NUMPAD_SUBTRACT)
        ScooterKeyCommand.StandardMap -> listOf(AndroidKeyEvent.KEYCODE_1)
        ScooterKeyCommand.QuietMap -> listOf(AndroidKeyEvent.KEYCODE_2)
        ScooterKeyCommand.SatelliteMap -> listOf(AndroidKeyEvent.KEYCODE_3)
        ScooterKeyCommand.Settings -> listOf(AndroidKeyEvent.KEYCODE_COMMA)
        ScooterKeyCommand.Close -> listOf(AndroidKeyEvent.KEYCODE_ESCAPE)
        ScooterKeyCommand.Fold -> listOf(AndroidKeyEvent.KEYCODE_BACKSLASH)
    }

/**
 * The commands that stand in [situation], as :core has them, but Satellite: the app has no imagery to lay under it
 * yet, so its key is left alone and the helper doesn't list it, as Settings leaves it out (NEEDS-USER #3).
 */
internal fun offered(situation: ScooterKeyCommand.Situation): List<ScooterKeyCommand> =
    ScooterKeyCommand.available(situation) - ScooterKeyCommand.SatelliteMap

/** The keys held with the command, as KeyboardShortcutInfo has them: Ctrl for ⌘, Alt for ⌥. */
private val ScooterKeyCommand.metaState: Int
    get() = (if (ScooterKeyCommand.Modifier.Command in modifiers) AndroidKeyEvent.META_CTRL_ON else 0) or
        (if (ScooterKeyCommand.Modifier.Option in modifiers) AndroidKeyEvent.META_ALT_ON else 0)

/**
 * The screen's shortcuts as Android's keyboard shortcut helper (Meta + /) lists them, in place of the iPad's menu
 * bar, whose menus they are in: Settings in the app's, named [appName], then View's looks of the map and its panel,
 * then the Map menu. Those that stand now are listed, where the iPad dims the others, and a menu with none isn't.
 * "/", ⌘= and Esc stay off it, as they do the menus. None while the screen isn't shown.
 */
fun keyboardShortcutGroups(situation: ScooterKeyCommand.Situation?, appName: CharSequence): List<KeyboardShortcutGroup> {
    situation ?: return emptyList()
    val available = offered(situation)
    return listOf(
        appName to listOf(ScooterKeyCommand.Settings),
        localized("View") to ScooterMenuBar.view.flatten(),
        localized("Map") to ScooterMenuBar.map.flatten(),
    ).mapNotNull { (title, commands) ->
        val items = commands.filter { it in available }.map { command ->
            KeyboardShortcutInfo(command.title(situation), command.keyCodes.first(), command.metaState)
        }
        if (items.isEmpty()) null else KeyboardShortcutGroup(title, items)
    }
}

/**
 * The screen's keyboard shortcuts while it is shown: what its keys stand for now, which the activity lists when
 * Android asks it, and what they do. The screen sets both.
 */
class ScreenShortcuts {
    var situation: ScooterKeyCommand.Situation? = null
    internal var perform: ((ScooterKeyCommand) -> Unit)? = null

    /**
     * Does what a key pressed with [event] stands for, if it stands now, and says whether it did: the others are left
     * to whatever else takes the key (UI-248). None while the filters or Settings are open (UI-247).
     */
    fun handle(event: KeyEvent): Boolean {
        val situation = situation ?: return false
        val perform = perform ?: return false
        val command = keyCommand(event, offered(situation)) ?: return false
        perform(command)
        return true
    }
}
