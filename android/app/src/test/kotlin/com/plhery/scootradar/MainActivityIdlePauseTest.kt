package com.plhery.scootradar

import android.os.Looper
import android.os.SystemClock
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.ViewGroup
import android.view.accessibility.AccessibilityEvent
import androidx.lifecycle.ViewModelProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.app.ScooterMapViewModel
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterResponse
import org.junit.After
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.Shadows.shadowOf

// The half-hour pause (ScooterMapController.noteInteraction, the iPhone's ScooterMapModel.noteInteraction), ended
// by what the activity hears of the rider: a touch, a key, TalkBack's focus moved or a control clicked through
// accessibility (33cd5b28, the iPhone's 664938c0). The controller's own tests end it by calling noteInteraction;
// these hold that the activity calls it, which only MainActivityReviewTest's withdrawn rating card held before.

@RunWith(AndroidJUnit4::class)
class MainActivityIdlePauseTest {
    private val clock = TestClock()
    private val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "lime-1", provider = "lime"))))

    @Before
    fun standIns() {
        MainActivity.mapStandIn = { }
        MainActivity.mapServerStandIn = api
        MainActivity.mapClockStandIn = { clock.now }
    }

    @After
    fun tearDown() {
        MainActivity.mapStandIn = null
        MainActivity.mapServerStandIn = null
        MainActivity.mapClockStandIn = null
    }

    private fun idle() = shadowOf(Looper.getMainLooper()).idle()

    /** The screen, its first answer in, left half an hour and a minute without a touch: the map has stopped asking. */
    private fun paused(): Pair<MainActivity, ScooterMapController> {
        val activity = Robolectric.buildActivity(MainActivity::class.java).setup().get()
        idle()
        val controller = ViewModelProvider(activity)[ScooterMapViewModel::class.java].controller
        assertNotNull("the first answer", controller.lastUpdated.value)
        clock.advance(31 * 60.0)
        controller.autoRefreshIfNeeded()
        idle()
        assertTrue("paused half an hour after the last touch", controller.isPausedForIdle.value)
        return activity to controller
    }

    /** An accessibility event of [type] from the screen, on its way up to TalkBack through the window's own view. */
    private fun MainActivity.sendsUp(type: Int) {
        val window = window.decorView as ViewGroup
        window.onRequestSendAccessibilityEvent(window.getChildAt(0), AccessibilityEvent(type))
    }

    @Test
    fun aTouchEndsThePause() {
        val (activity, controller) = paused()
        val now = SystemClock.uptimeMillis()
        activity.dispatchTouchEvent(MotionEvent.obtain(now, now, MotionEvent.ACTION_DOWN, 100f, 100f, 0))
        idle()
        assertFalse(controller.isPausedForIdle.value)
    }

    @Test
    fun aKeyEndsThePause() {
        val (activity, controller) = paused()
        activity.dispatchKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_DPAD_DOWN))
        idle()
        assertFalse(controller.isPausedForIdle.value)
    }

    /** TalkBack's focus moved by a swipe, which no touch reaches the window for. */
    @Test
    fun talkBacksFocusMovedEndsThePause() {
        val (activity, controller) = paused()
        activity.sendsUp(AccessibilityEvent.TYPE_VIEW_ACCESSIBILITY_FOCUSED)
        idle()
        assertFalse(controller.isPausedForIdle.value)
    }

    /** A control clicked through accessibility, as Switch Access and Voice Access click. */
    @Test
    fun aControlClickedThroughAccessibilityEndsThePause() {
        val (activity, controller) = paused()
        activity.sendsUp(AccessibilityEvent.TYPE_VIEW_CLICKED)
        idle()
        assertFalse(controller.isPausedForIdle.value)
    }

    /** What the screen says of itself, a count changed, a list scrolled or a sheet opened, is not the rider. */
    @Test
    fun theScreenChangingLeavesItPaused() {
        val (activity, controller) = paused()
        activity.sendsUp(AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED)
        activity.sendsUp(AccessibilityEvent.TYPE_VIEW_SCROLLED)
        activity.sendsUp(AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED)
        idle()
        assertTrue(controller.isPausedForIdle.value)
    }
}
