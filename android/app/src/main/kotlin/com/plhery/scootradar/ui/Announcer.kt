package com.plhery.scootradar.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

// UIAccessibility.post(notification: .announcement) in ios/ScootRadar/Views/ScooterControls.swift (ui.md UI-273,
// UI-274, UI-286 to UI-288).

/** Something TalkBack is to say once: the same text said again is a new [serial]. */
data class Announcement(val text: String, val serial: Int = 0)

/**
 * Says [announcement] with TalkBack, as the iPhone posts an announcement to VoiceOver: each one is a new pane,
 * whose title TalkBack reads as it appears. View.announceForAccessibility is deprecated from API 36, and a pane
 * says nothing while TalkBack is off, as an announcement does while VoiceOver is. The pane is a point with nothing
 * in it, which TalkBack's focus never stops on; put it in a Box, over what it speaks of.
 */
@Composable
fun Announcer(announcement: Announcement?) {
    if (announcement == null) return
    key(announcement) {
        Box(Modifier.size(1.dp).semantics { paneTitle = announcement.text })
    }
}

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
