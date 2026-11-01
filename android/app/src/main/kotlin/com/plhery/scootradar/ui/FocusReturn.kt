package com.plhery.scootradar.ui

import android.view.View
import android.view.accessibility.AccessibilityNodeInfo
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.node.RootForTest
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.getAllSemanticsNodes

// TalkBack's focus as a menu, popover or sheet closes (PLAN §10; app-ai's TalkBack pass, F10 and SH3).

/**
 * TalkBack's focus back on the control it was on as a menu, popover or sheet opened, once that closes (PLAN §10:
 * UIKit is believed to put VoiceOver back on a closed modal's presenter, which no Apple document settles, and a marker
 * or the search bar is a lost place either way). TalkBack 16.2 puts it back itself, 550 ms after the change, on the
 * node it last focused under the window's title and pane title: the opener, now that announcements leave the window's
 * title alone (review-app-ai R2; Filters on Phone_Min, 1 Nov). TalkBack files only the focus it moves, so its own
 * comes after this one, and a frame after a sheet closes the opener is still under it and this one fails. Without
 * TalkBack nothing is kept or moved.
 */
class AccessibilityFocusReturn internal constructor(private val view: View) {
    /** The node of [view] TalkBack's focus was on as something opened. */
    private var opener: Int? = null

    private var isOpen = false

    /** Something opens over the screen: the node TalkBack's focus is on now is where it goes back to. */
    fun opening() {
        opener = view.accessibilityFocusedNode()
    }

    /** What opened has closed: TalkBack's focus goes back to the node it was on, once the screen shows it again. */
    fun closed() {
        val node = opener ?: return
        opener = null
        view.post { view.accessibilityNodeProvider?.performAction(node, AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS, null) }
    }

    /** Whether what opens is open: [opening] as it opens, [closed] as it closes. */
    fun showing(open: Boolean) {
        if (open == isOpen) return
        isOpen = open
        if (open) opening() else closed()
    }
}

/** The screen's [AccessibilityFocusReturn], for what opens over it. */
@Composable
fun rememberAccessibilityFocusReturn(): AccessibilityFocusReturn {
    val view = LocalView.current
    return remember(view) { AccessibilityFocusReturn(view) }
}

/**
 * TalkBack's focus back where it was as a window of its own, a menu or a dialog, closes: shown while [open]. The
 * screen under it keeps its nodes meanwhile, so the one the focus is on is found once the window is up.
 */
@Composable
fun ReturnsAccessibilityFocus(open: Boolean) {
    val focus = rememberAccessibilityFocusReturn()
    SideEffect { focus.showing(open) }
}

/** The node of this Compose view TalkBack's focus is on, found as Compose gives it to TalkBack. */
private fun View.accessibilityFocusedNode(): Int? {
    val provider = accessibilityNodeProvider ?: return null
    if (provider.findFocus(AccessibilityNodeInfo.FOCUS_ACCESSIBILITY) == null) return null
    val root = this as? RootForTest ?: return null
    return root.semanticsOwner.getAllSemanticsNodes(mergingEnabled = false)
        .firstOrNull { provider.createAccessibilityNodeInfo(it.id)?.isAccessibilityFocused == true }?.id
}
