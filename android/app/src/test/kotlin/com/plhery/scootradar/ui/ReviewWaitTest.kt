package com.plhery.scootradar.ui

import androidx.activity.ComponentActivity
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshots.Snapshot
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.RecordingAnalytics
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.TrackedEvent
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.rentalOpened
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ScooterLinks
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterReviewPrompt
import com.plhery.scootradar.core.model.addingTimeInterval
import com.plhery.scootradar.scooter
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.util.TimeZone

/**
 * The screen's half of the ask for a rating (ui.md UI-106, ScooterMapScreen.swift:161-178): a return from a ride
 * that is the moment asks once the map has rested 5 seconds with nothing over it, and anything over the map
 * before then ends that try. The prompt's own rules are :core's (T346–T352).
 */
@RunWith(AndroidJUnit4::class)
class ReviewWaitTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private val controllers = TestControllers()
    private val clock = TestClock()
    private val timeZone = TimeZone.getDefault()
    private var asked = 0

    @Before
    fun setUp() {
        // The prompt counts the phone's days in its time zone.
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
    }

    @After
    fun tearDown() {
        controllers.close()
        TimeZone.setDefault(timeZone)
    }

    @Test
    fun theRatingIsAskedOnceTheMapHasRestedFiveSeconds() {
        val model = backFromARide()
        val analytics = RecordingAnalytics()
        compose.mainClock.autoAdvance = false
        compose.setContent {
            ReviewWhenTheMapRests(model, nothingOverTheMap = true, requester = { asked += 1 }, analytics = analytics.analytics)
        }
        compose.mainClock.advanceTimeBy(4_000)
        assertEquals(0, asked)
        assertEquals(emptyList<TrackedEvent>(), analytics.events)
        compose.mainClock.advanceTimeBy(1_500)
        assertEquals(1, asked)
        assertFalse(model.reviewDue)
        // LOG-330 (ScooterMapScreen.swift:177): the ask is counted, with what it came after.
        assertEquals(listOf(TrackedEvent("review_ask", result = "rental_return")), analytics.events)
    }

    /**
     * What the store needs is fetched as the rest begins, so that Play's card comes at its end, as the iPhone's sheet
     * does (app/PlayReviewRequesterTest for what Play is asked).
     */
    @Test
    fun theStoreIsReadiedAsTheRestBeginsAndAskedAtItsEnd() {
        val model = backFromARide()
        val calls = mutableListOf<String>()
        val requester = object : ReviewRequester {
            override fun prepare() {
                calls += "prepare"
            }

            override fun request(stillAsked: () -> Boolean) {
                calls += "request"
            }
        }
        compose.mainClock.autoAdvance = false
        compose.setContent { ReviewWhenTheMapRests(model, nothingOverTheMap = true, requester = requester, analytics = null) }
        compose.mainClock.advanceTimeByFrame()
        assertEquals(listOf("prepare"), calls)
        compose.mainClock.advanceTimeBy(5_500)
        assertEquals(listOf("prepare", "request"), calls)
    }

    @Test
    fun somethingOverTheMapBeforeThenEndsThisTry() {
        val model = backFromARide()
        var nothingOver by mutableStateOf(true)
        val analytics = RecordingAnalytics()
        compose.mainClock.autoAdvance = false
        compose.setContent {
            ReviewWhenTheMapRests(model, nothingOverTheMap = nothingOver, requester = { asked += 1 }, analytics = analytics.analytics)
        }
        compose.mainClock.advanceTimeBy(3_000)
        // The search opened and closed again: each a frame of its own.
        for (value in listOf(false, true)) {
            compose.runOnUiThread {
                nothingOver = value
                Snapshot.sendApplyNotifications()
            }
            compose.mainClock.advanceTimeByFrame()
        }
        compose.mainClock.advanceTimeBy(10_000)
        assertEquals(0, asked)
        assertFalse(model.reviewDue)
        assertEquals(emptyList<TrackedEvent>(), analytics.events)
    }

    /**
     * The store answers late, a bind to Play away: something over the map by then, a scooter tapped as the rest
     * ended, takes back the ask, and Play's card with it (review-app-bh2).
     */
    @Test
    fun somethingOverTheMapBeforeTheStoreAnswersTakesBackItsCard() {
        val model = backFromARide()
        var nothingOver by mutableStateOf(true)
        var stillAsked: (() -> Boolean)? = null
        compose.mainClock.autoAdvance = false
        compose.setContent {
            ReviewWhenTheMapRests(model, nothingOverTheMap = nothingOver, requester = { stillAsked = it }, analytics = null)
        }
        compose.mainClock.advanceTimeBy(5_500)
        assertTrue(stillAsked!!())
        compose.mainClock.advanceTimeBy(1_000)
        assertTrue("the map still at rest", stillAsked!!())
        compose.runOnUiThread {
            nothingOver = false
            Snapshot.sendApplyNotifications()
        }
        compose.mainClock.advanceTimeByFrame()
        assertFalse(stillAsked!!())
        // Back at rest, the card is not asked again.
        compose.runOnUiThread {
            nothingOver = true
            Snapshot.sendApplyNotifications()
        }
        compose.mainClock.advanceTimeBy(10_000)
        assertFalse(stillAsked!!())
    }

    /**
     * A controller on its third day with a fresh feed, back in front 20 minutes after "Open in" and loaded again:
     * the moment to ask.
     */
    private fun backFromARide(): ScooterMapController {
        val defaults = InMemoryScooterDefaults()
        val earlier = ScooterReviewPrompt(defaults = defaults, version = ScooterLinks.appVersion)
        earlier.noteUse(at = clock.now.addingTimeInterval(-2.0 * 86_400))
        earlier.noteUse(at = clock.now.addingTimeInterval(-86_400.0))
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "one", provider = "lime"))))
        val model = controllers.make(api, clock = clock, defaults = defaults)
        model.refresh()
        assertTrue(controllers.waitUntil { model.lastUpdated.value != null && !model.isLoading.value })

        model.rentalOpened()
        model.becameInactive()
        clock.advance(20.0 * 60)
        val calls = api.calls
        model.becameActive()
        assertTrue(controllers.waitUntil { api.calls == calls + 1 && !model.isLoading.value })
        assertTrue(model.reviewDue)
        return model
    }
}
