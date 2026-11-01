package com.plhery.scootradar.ui

import android.view.View
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalView

// UIAccessibility.post(notification: .announcement) in ios/ScootRadar/Views/ScooterControls.swift (ui.md UI-273,
// UI-274, UI-286 to UI-288).

/** Something TalkBack is to say once: the same text said again is a new [serial]. */
data class Announcement(val text: String, val serial: Int = 0)

/**
 * Says [announcement] with TalkBack, as the iPhone posts an announcement to VoiceOver: as it is given, and again for
 * each new one, the same words included. Once said it isn't taken back, as VoiceOver's isn't, and nothing is said
 * while TalkBack is off.
 *
 * An announcement, though Android's calls for one are deprecated in API 37 (PLAN §10, app-ai F9). A pane's title
 * becomes the window's title for TalkBack 16.2, which then says "ScootRadar" at the next window change, and files
 * the focus under the announcement, where it isn't found again as a sheet or a menu closes (review-app-ai R2). A
 * live region is a node TalkBack's swipes stop on.
 */
@Composable
fun Announcer(announcement: Announcement?) {
    val view = LocalView.current
    LaunchedEffect(view, announcement) { announcement?.let { view.announce(it.text) } }
}

// iOS's contract is a spoken announcement, which TalkBack 16.2 still speaks (PLAN §10).
@Suppress("DEPRECATION")
private fun View.announce(text: String) = announceForAccessibility(text)

/**
 * What to announce when [value] changes, as `.onChange(of: value)`: [text] read at the change, or nothing when it
 * is null. The value the view first shows is not a change.
 */
@Composable
fun <T> rememberAnnouncementOnChange(value: T, text: () -> String?): Announcement? {
    var announcement by remember { mutableStateOf<Announcement?>(null) }
    var changes by remember { mutableIntStateOf(-1) }
    LaunchedEffect(value) {
        changes += 1
        if (changes > 0) announcement = text()?.let { Announcement(it, changes) }
    }
    return announcement
}
