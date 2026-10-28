package com.plhery.scootradar.ui

import android.app.Application
import android.app.UiModeManager
import android.content.Context
import android.content.Intent
import androidx.activity.ComponentActivity
import androidx.compose.material3.Text
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.lifecycle.Lifecycle
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.testController
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.GraphicsMode
import java.time.Instant
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone

// LOG-124 and LOG-353: Automatic goes by the sun, and the screen reads it again each minute, as the iPhone's
// TimelineView(.everyMinute) does (ScooterMapScreen.swift:210), and as the app comes back to the foreground.

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class EveryMinuteTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val context: Context = ApplicationProvider.getApplicationContext()
    private val window = shadowOf(context.getSystemService(UiModeManager::class.java))
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()

    // In Switzerland, where the map opens: noon, then eleven at night.
    private val noon = Instant.parse("2026-10-24T12:00:00+02:00")
    private val night = Instant.parse("2026-10-24T23:00:00+02:00")
    private var now = noon

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Zurich"))
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        scope.cancel()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        Locale.setDefault(locale)
        TimeZone.setDefault(timeZone)
    }

    @Test
    fun theSunIsReadAgainAtEachMinuteAndAsTheClockOrTheZoneIsChanged() {
        val model = testController(scope, now = { now })
        compose.setContent { ScooterMapScreen(controller = model, map = {}) }
        compose.waitUntil { window.applicationNightMode == UiModeManager.MODE_NIGHT_NO }

        // Night falls within the minute, and is seen as the next one starts.
        now = night
        compose.waitForIdle()
        assertEquals(UiModeManager.MODE_NIGHT_NO, window.applicationNightMode)
        receive(Intent.ACTION_TIME_TICK)
        assertEquals(UiModeManager.MODE_NIGHT_YES, window.applicationNightMode)

        now = noon
        receive(Intent.ACTION_TIME_CHANGED)
        assertEquals(UiModeManager.MODE_NIGHT_NO, window.applicationNightMode)

        now = night
        receive(Intent.ACTION_TIMEZONE_CHANGED)
        assertEquals(UiModeManager.MODE_NIGHT_YES, window.applicationNightMode)
    }

    @Test
    fun theSunIsReadAgainAsTheAppComesBackToTheForeground() {
        val model = testController(scope, now = { now })
        compose.setContent { ScooterMapScreen(controller = model, map = {}) }
        compose.waitUntil { window.applicationNightMode == UiModeManager.MODE_NIGHT_NO }

        compose.activityRule.scenario.moveToState(Lifecycle.State.CREATED)
        now = night
        compose.activityRule.scenario.moveToState(Lifecycle.State.RESUMED)
        compose.waitUntil { window.applicationNightMode == UiModeManager.MODE_NIGHT_YES }
    }

    @Test
    fun theCountGoesUpAtEachMinuteAsTheClockOrTheZoneIsSetAndAtEachStart() {
        compose.setContent { Text("minute ${everyMinute().value}") }
        compose.onNodeWithText("minute 1").assertExists()
        receive(Intent.ACTION_TIME_TICK)
        compose.onNodeWithText("minute 2").assertExists()
        receive(Intent.ACTION_TIME_CHANGED)
        compose.onNodeWithText("minute 3").assertExists()
        receive(Intent.ACTION_TIMEZONE_CHANGED)
        compose.onNodeWithText("minute 4").assertExists()
        compose.activityRule.scenario.moveToState(Lifecycle.State.CREATED)
        compose.activityRule.scenario.moveToState(Lifecycle.State.RESUMED)
        compose.onNodeWithText("minute 5").assertExists()
    }

    /** What Android sends the screen as a minute starts, or as the clock or the zone is set; then the screen draws. */
    private fun receive(action: String) {
        val receivers = shadowOf(context as Application).registeredReceivers.filter { it.intentFilter.hasAction(action) }
        assertEquals(1, receivers.size)
        receivers.single().broadcastReceiver.onReceive(receivers.single().context, Intent(action))
        compose.waitForIdle()
    }
}
