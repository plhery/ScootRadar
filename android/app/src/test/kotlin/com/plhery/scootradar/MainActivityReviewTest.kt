package com.plhery.scootradar

import android.content.Intent
import android.os.Looper
import android.os.SystemClock
import android.view.InputDevice
import android.view.KeyEvent
import android.view.MotionEvent
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.app.LaunchArgumentDefaults
import com.plhery.scootradar.app.ScooterApplication
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.Shadows.shadowOf
import org.robolectric.shadows.ShadowLog

// UI-106, X-AD27: Google Play's rating card is shown only while the map is still at rest. The screen takes the ask
// back when something comes over the map (ReviewWaitTest); a touch, a key, a mouse's wheel or TalkBack's finger in
// the window, which MainActivity hears, takes it back too, before Play has answered (week review, finding 6.3).

@RunWith(AndroidJUnit4::class)
class MainActivityReviewTest {
    /** Play's stand-in, which a debug build launched with ReviewPromptDue asks, and the line it logs once it showed. */
    @Before
    fun debugBuild() = assumeTrue(BuildConfig.DEBUG)

    @Before
    fun standIn() {
        MainActivity.mapStandIn = { }
    }

    @After
    fun tearDown() {
        MainActivity.mapStandIn = null
    }

    private fun shown(): MainActivity {
        val application = ApplicationProvider.getApplicationContext<ScooterApplication>()
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
            .setClass(application, MainActivity::class.java)
            .putExtra(LaunchArgumentDefaults.REVIEW_PROMPT_DUE, true)
        return Robolectric.buildActivity(MainActivity::class.java, intent).setup().get()
    }

    private val cards: Int get() = ShadowLog.getLogsForTag("ScootRadar").count { it.msg == "Google Play asked for its card to rate the app" }

    private fun idle() = shadowOf(Looper.getMainLooper()).idle()

    /** Asks Play's stand-in, does [between] before it answers, and says how many cards were shown then. */
    private fun MainActivity.askThen(between: MainActivity.() -> Unit): Int {
        val before = cards
        reviewRequester.request { true }
        between()
        idle()
        return cards - before
    }

    @Test
    fun aMapAtRestUntilPlayAnswersShowsTheCard() {
        assertEquals(1, shown().askThen { })
    }

    @Test
    fun aTouchBeforePlayAnsweredShowsNoCard() {
        val activity = shown()
        val now = SystemClock.uptimeMillis()
        assertEquals(0, activity.askThen { dispatchTouchEvent(MotionEvent.obtain(now, now, MotionEvent.ACTION_DOWN, 100f, 100f, 0)) })
    }

    @Test
    fun aKeyBeforePlayAnsweredShowsNoCard() {
        val activity = shown()
        assertEquals(0, activity.askThen { dispatchKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_DPAD_DOWN)) })
    }

    @Test
    fun aMousesWheelBeforePlayAnsweredShowsNoCard() {
        val activity = shown()
        val now = SystemClock.uptimeMillis()
        val wheel = MotionEvent.obtain(now, now, MotionEvent.ACTION_SCROLL, 100f, 100f, 0).apply { source = InputDevice.SOURCE_MOUSE }
        assertEquals(0, activity.askThen { dispatchGenericMotionEvent(wheel) })
    }
}
