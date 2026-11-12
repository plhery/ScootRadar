package com.plhery.scootradar

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.os.Looper
import android.os.SystemClock
import android.view.InputDevice
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityManager
import android.view.accessibility.AccessibilityNodeInfo
import androidx.compose.ui.node.RootForTest
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getAllSemanticsNodes
import androidx.compose.ui.semantics.getOrNull
import androidx.core.view.children
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
// back when something comes over the map (ReviewWaitTest); a touch, a key, a mouse's wheel, TalkBack's finger or focus
// in the window, or a control clicked through accessibility, which MainActivity hears, takes it back too, before Play
// has answered (week review, finding 6.3).

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

    /**
     * An accessibility event of [type] from the screen, on its way up to TalkBack through the window's own view, as
     * every view's goes.
     */
    private fun MainActivity.sendsUp(type: Int) {
        val window = window.decorView as ViewGroup
        window.onRequestSendAccessibilityEvent(window.getChildAt(0), AccessibilityEvent(type))
    }

    /** TalkBack's focus moved by a swipe, which no touch reaches the window for (the iPhone, 664938c0). */
    @Test
    fun aTalkBackFocusMoveBeforePlayAnsweredShowsNoCard() {
        assertEquals(0, shown().askThen { sendsUp(AccessibilityEvent.TYPE_VIEW_ACCESSIBILITY_FOCUSED) })
    }

    /**
     * TalkBack puts its focus on the Settings button, as after a swipe: it asks the screen's node to take it, and
     * Compose tells the window through every view above it, the way TalkBack hears of it. With TalkBack's service on,
     * which Compose gives its nodes and events to only then.
     */
    @Test
    fun talkBacksFocusPutOnAButtonByTheScreenBeforePlayAnsweredShowsNoCard() {
        val accessibility = ApplicationProvider.getApplicationContext<Context>().getSystemService(AccessibilityManager::class.java)
        shadowOf(accessibility).setEnabled(true)
        shadowOf(accessibility).setTouchExplorationEnabled(true)
        shadowOf(accessibility).setEnabledAccessibilityServiceList(listOf(AccessibilityServiceInfo()))
        val activity = shown()
        idle()
        val screen = checkNotNull(activity.window.decorView.composeRoot())
        val settings = (screen as RootForTest).semanticsOwner.getAllSemanticsNodes(mergingEnabled = false)
            .first { it.config.getOrNull(SemanticsProperties.ContentDescription)?.contains("Settings") == true }
        assertEquals(
            0,
            activity.askThen {
                check(screen.accessibilityNodeProvider.performAction(settings.id, AccessibilityNodeInfo.ACTION_ACCESSIBILITY_FOCUS, null))
            },
        )
    }

    /** The view Compose draws the screen in, among [this] and the views it holds. */
    private fun View.composeRoot(): View? =
        if (this is RootForTest) this else (this as? ViewGroup)?.children?.firstNotNullOfOrNull { it.composeRoot() }

    /** A control clicked through accessibility, as Switch Access and Voice Access click. */
    @Test
    fun aControlClickedThroughAccessibilityBeforePlayAnsweredShowsNoCard() {
        assertEquals(0, shown().askThen { sendsUp(AccessibilityEvent.TYPE_VIEW_CLICKED) })
    }

    /** What the screen says of itself, a count changed, a list scrolled or a sheet opened, is not the rider. */
    @Test
    fun theScreenChangingBeforePlayAnsweredStillShowsTheCard() {
        assertEquals(
            1,
            shown().askThen {
                sendsUp(AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED)
                sendsUp(AccessibilityEvent.TYPE_VIEW_SCROLLED)
                sendsUp(AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED)
            },
        )
    }
}
