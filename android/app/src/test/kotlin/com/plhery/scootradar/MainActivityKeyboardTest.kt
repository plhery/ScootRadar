package com.plhery.scootradar

import android.content.pm.ActivityInfo
import android.content.res.Configuration
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.After
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertSame
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.annotation.Config

// X-AD17: the iPhone's and the iPad's screen is never made again, and the activity takes the changes a window goes
// through itself (the manifest's configChanges). A keyboard is one: a tablet's keyboard cover clipped on, or one
// paired over Bluetooth, for the app's key commands (KeyCommands). Up to Android 16 (here 13) the activity
// was made again for it, the map drawn again from its ground up and an open menu or date picker gone; Android 17 no
// longer makes it again for an app made for it.

@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "en-rUS-w800dp-h1280dp-xhdpi", sdk = [33, Config.NEWEST_SDK])
class MainActivityKeyboardTest {
    @Before
    fun setUp() {
        MainActivity.mapStandIn = { }
    }

    @After
    fun tearDown() {
        MainActivity.mapStandIn = null
    }

    /** A keyboard plugged in, with its arrow keys, then unplugged: the activity is kept as it is through both. */
    @Test
    fun aKeyboardPluggedInAndOutKeepsTheActivity() {
        val activity = Robolectric.buildActivity(MainActivity::class.java).setup()
        try {
            val shown = activity.get()
            for (plugged in listOf(true, false)) {
                val now = Configuration(shown.resources.configuration)
                val next = Configuration(now).apply {
                    keyboard = if (plugged) Configuration.KEYBOARD_QWERTY else Configuration.KEYBOARD_NOKEYS
                    hardKeyboardHidden = if (plugged) Configuration.HARDKEYBOARDHIDDEN_NO else Configuration.HARDKEYBOARDHIDDEN_YES
                    navigation = if (plugged) Configuration.NAVIGATION_DPAD else Configuration.NAVIGATION_NONAV
                    navigationHidden = if (plugged) Configuration.NAVIGATIONHIDDEN_NO else Configuration.NAVIGATIONHIDDEN_YES
                }
                val changed = ActivityInfo.CONFIG_KEYBOARD or ActivityInfo.CONFIG_NAVIGATION
                assertNotEquals("plugged in: $plugged, a change to the keyboard", 0, now.diff(next) and changed)
                activity.configurationChange(next)
                assertSame("plugged in: $plugged, the activity kept", shown, activity.get())
            }
        } finally {
            activity.pause().stop().destroy()
        }
    }
}
