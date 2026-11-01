package com.plhery.scootradar.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

// UIAccessibility.post(notification: .announcement) in ios/ScootRadar/Views/ScooterControls.swift (ui.md UI-273,
// UI-274, UI-286 to UI-288).

/** Something TalkBack is to say once: the same text said again is a new [serial]. */
data class Announcement(val text: String, val serial: Int = 0)

/**
 * Where the announcements are said: a pane whose title TalkBack reads each time it changes.
 * View.announceForAccessibility is deprecated from API 36, and a pane says nothing while TalkBack is off, as an
 * announcement does while VoiceOver is. The screen keeps one for as long as it shows: a pane that goes makes TalkBack
 * say the window's title, "ScootRadar", where VoiceOver says nothing (app-ai's TalkBack pass), so what was said is
 * withdrawn by an empty title, which TalkBack doesn't read.
 */
@Stable
class Announcements {
    /** The pane's title: none before anything is said, empty once what was said is withdrawn. */
    var title by mutableStateOf<String?>(null)
        private set

    /**
     * The words TalkBack last took from the pane. An empty title isn't any: TalkBack drops it and keeps the words
     * before as the window's title, so the same words said after a withdraw would be no change to it (review-app-ai 1).
     */
    private var shown: String? = null
    private var said: Announcement? = null

    fun say(announcement: Announcement) {
        said = announcement
        // The same words said again are a new title, which TalkBack reads: a zero-width space tells them apart.
        title = if (announcement.text == shown) announcement.text + "\u200B" else announcement.text
    }

    /** [announcement] is no longer to be heard: the pane says nothing, if it was the last said. */
    fun withdraw(announcement: Announcement) {
        if (announcement != said) return
        said = null
        title = ""
    }

    /** The pane, a point with nothing in it, which TalkBack's focus never stops on. */
    @Composable
    fun Pane() {
        val title = title ?: return
        Box(Modifier.size(1.dp).semantics { paneTitle = title })
        SideEffect { if (title.isNotEmpty()) shown = title }
    }
}

/** The screen's announcements: none where a part of it is shown alone, which then says its own. */
val LocalAnnouncements = staticCompositionLocalOf<Announcements?> { null }

/**
 * Says [announcement] with TalkBack, as the iPhone posts an announcement to VoiceOver, in the screen's pane; and
 * withdraws it once it is null or the announcer goes. Shown alone, the announcer has a pane of its own: put it in a
 * Box, over what it speaks of.
 */
@Composable
fun Announcer(announcement: Announcement?) {
    val screen = LocalAnnouncements.current
    val announcements = screen ?: remember { Announcements() }
    val current by rememberUpdatedState(announcement)
    DisposableEffect(announcements, announcement) {
        announcement?.let(announcements::say)
        onDispose {
            // Another follows at once, which takes the pane's title: withdrawn only when none does, or as it goes.
            val next = current
            if (announcement != null && (next == null || next == announcement)) announcements.withdraw(announcement)
        }
    }
    if (screen == null) announcements.Pane()
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
