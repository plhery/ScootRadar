package com.plhery.scootradar.ui

import android.view.View
import android.view.accessibility.AccessibilityManager
import android.view.accessibility.AccessibilityNodeInfo
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.node.RootForTest
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getAllSemanticsNodes
import androidx.compose.ui.semantics.getOrNull

// TalkBack's focus as a menu, popover, sheet or the search closes (PLAN §10; app-ai's TalkBack pass, F10, F11 and SH3).

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

    /**
     * TalkBack's focus onto the node tagged [tag], once the screen shows it: the search bar as the search closes, by
     * a place chosen, Cancel or Back. The row the focus was on goes with the panel, and TalkBack, finding no focus once
     * the keyboard's window had gone, put it on the first node it found, a cluster on an open Fold (app-ai's F11); a
     * focus already on the bar keeps TalkBack's own away. Nothing else on the screen is heard while the search is
     * open, so the focus is taken from nowhere else.
     */
    fun moveTo(tag: String) {
        if (view.context.getSystemService(AccessibilityManager::class.java)?.isTouchExplorationEnabled != true) return
        view.post {
            val root = view as? RootForTest ?: return@post
            val node = root.semanticsOwner.getAllSemanticsNodes(mergingEnabled = false)
                .firstOrNull { it.config.getOrNull(SemanticsProperties.TestTag) == tag } ?: return@post
            view.accessibilityNodeProvider?.performAction(node.id, AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS, null)
        }
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
