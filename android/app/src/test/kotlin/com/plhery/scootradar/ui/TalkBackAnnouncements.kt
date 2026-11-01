package com.plhery.scootradar.ui

import android.content.Context
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityManager
import androidx.test.core.app.ApplicationProvider
import org.robolectric.Shadows.shadowOf

/** TalkBack turned on, as the views see it: they send it what they announce, which it speaks as it comes. */
class TalkBackAnnouncements {
    private val accessibility =
        shadowOf(ApplicationProvider.getApplicationContext<Context>().getSystemService(AccessibilityManager::class.java))

    init {
        accessibility.setEnabled(true)
    }

    /** What TalkBack was sent to announce, in turn: the words it says of each. */
    @Suppress("DEPRECATION")
    fun heard(): List<String> = accessibility.sentAccessibilityEvents
        .filter { it.eventType == AccessibilityEvent.TYPE_ANNOUNCEMENT }
        .map { it.text.joinToString("") }
}
