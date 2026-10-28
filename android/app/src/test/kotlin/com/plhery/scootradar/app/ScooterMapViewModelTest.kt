package com.plhery.scootradar.app

import android.content.Context
import android.os.Looper
import androidx.activity.ComponentActivity
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelStore
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.RecordingAnalytics
import com.plhery.scootradar.TrackedEvent
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.core.model.ScooterLinks
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterReviewPrompt
import com.plhery.scootradar.scooter
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.awaitCancellation
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.Shadows.shadowOf
import java.time.Instant
import java.util.TimeZone

// LOG-324, LOG-371, LOG-372, LOG-376, LOG-378 and LOG-379: the screen's model as the activity's lifecycle drives it,
// as the scene's phase drives the iPhone's (ScooterMapScreen.swift:117-128). The location service's part is
// AndroidLocationManagerTest's.

@RunWith(AndroidJUnit4::class)
class ScooterMapViewModelTest {
    private val context: Context = ApplicationProvider.getApplicationContext()
    private val analytics = RecordingAnalytics()
    private val api = RecordingAPI()
    private val defaults = InMemoryScooterDefaults()
    private val store = ViewModelStore()
    private val timeZone = TimeZone.getDefault()

    @Before
    fun setUp() {
        // The map opens where the zone says, and the rating counts the days in it.
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
    }

    @After
    fun tearDown() {
        store.clear()
        TimeZone.setDefault(timeZone)
    }

    @Test
    fun theFirstStartOpensTheAppEachReturnComesToTheForegroundAndARecreationIsNeither() {
        // Two days of use before this one: a return from a ride is the moment to ask for a rating.
        val prompt = ScooterReviewPrompt(defaults = defaults, version = ScooterLinks.appVersion)
        prompt.noteUse(at = Instant.now().minusSeconds(2 * 86_400))
        prompt.noteUse(at = Instant.now().minusSeconds(86_400))
        val model = model()
        val activity = Robolectric.buildActivity(ComponentActivity::class.java).create()
        activity.get().lifecycle.addObserver(model)
        // With no data: iOS sends none with these.
        val pageView = TrackedEvent(null)
        val open = TrackedEvent("app_open")
        val foreground = TrackedEvent("app_foreground")

        // The page view and app_open, then the controller starts: its first load.
        activity.start().resume()
        idle()
        assertEquals(listOf(pageView, open), analytics.events)
        assertEquals(1, api.calls)
        assertNotNull(model.controller.lastUpdated.value)

        // Out on a ride for 20 minutes: the return is the moment, and it is taken at once with the data there.
        activity.pause().stop()
        prompt.noteRentalOpened(at = Instant.now().minusSeconds(20 * 60))
        activity.restart().resume()
        idle()
        assertEquals(listOf(pageView, open, foreground), analytics.events)
        assertTrue(model.controller.reviewDue)

        // The activity made again, as a change of font size or display size does (the manifest keeps it through a
        // rotation), keeps the scene's phase: it neither leaves nor returns.
        activity.recreate()
        activity.get().lifecycle.addObserver(model)
        idle()
        assertEquals(listOf(pageView, open, foreground), analytics.events)
        assertTrue(model.controller.reviewDue)
        assertEquals(1, api.calls)

        // Leaving ends the moment; each return is app_foreground again, never app_open.
        activity.pause().stop()
        assertFalse(model.controller.reviewDue)
        activity.restart().resume()
        idle()
        assertEquals(listOf(pageView, open, foreground, foreground), analytics.events)
    }

    /** On the main thread, after the call that asked returns, as a Swift Task on the main actor. */
    @Test
    fun theControllerWorksOnTheMainThreadOnceTheCallThatAskedForItReturns() {
        val model = model()
        model.controller.refresh()
        assertEquals(0, api.calls)
        idle()
        assertEquals(listOf(Looper.getMainLooper().thread), api.threads)
    }

    @Test
    fun clearingTheScreenCancelsTheRequestInFlight() {
        api.holds = true
        val model = model()
        model.controller.refresh()
        idle()
        assertEquals(1, api.calls)
        assertEquals(0, api.cancelled)

        store.clear()
        idle()
        assertEquals(1, api.cancelled)
    }

    private fun model(): ScooterMapViewModel {
        val container = AppContainer(context)
        val factory = viewModelFactory {
            initializer {
                ScooterMapViewModel(
                    container = container,
                    defaults = defaults,
                    languageAtLaunch = ScooterLanguageChoice.Automatic,
                    analytics = analytics.analytics,
                    api = api,
                )
            }
        }
        return ViewModelProvider(store, factory)[ScooterMapViewModel::class.java]
    }

    private fun idle() = shadowOf(Looper.getMainLooper()).idle()

    /** A server with one scooter, which keeps the thread each request came on, or holds it until it is cancelled. */
    private class RecordingAPI : ScooterAPIClient {
        var holds = false
        val threads = mutableListOf<Thread>()
        var cancelled = 0
            private set
        val calls: Int get() = threads.size

        override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int): ScooterResponse {
            threads += Thread.currentThread()
            if (holds) {
                try {
                    awaitCancellation()
                } catch (e: CancellationException) {
                    cancelled += 1
                    throw e
                }
            }
            return ScooterResponse(vehicles = listOf(scooter(id = "one", provider = "lime")))
        }
    }
}
