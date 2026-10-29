package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ScooterDefaults
import com.plhery.scootradar.core.model.ScooterResponse
import java.util.TimeZone
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * LOG-312 (ScooterReviewPrompt.swift:23-27, ScooterMapModel.swift:419-421): a debug build launched with
 * `ReviewPromptDue` makes every calm moment due, and its first load one, with no day of use and the version asked
 * already; a release build, or a debug build launched without it, asks as ever. The days are counted in UTC.
 */
class ReviewPromptDueTest {
    @Test
    fun aDebugBuildLaunchedWithItAsksAtItsFirstLoadAndAtEveryCalmMoment() = inUTC {
        runTest {
            val clock = TestClock()
            val (model, api) = loaded(clock, InMemoryScooterDefaults().apply { set(true, forKey = "ReviewPromptDue") }, debug = true)
            assertEquals(1, model.reviewMoments.value)
            assertTrue(model.reviewDue)
            assertTrue(model.takeReviewMoment())

            // This version asked, on its first day: still due once the map is calm again.
            returnFromRide(model, api, clock)
            assertEquals(2, model.reviewMoments.value)
            assertTrue(model.takeReviewMoment())
        }
    }

    @Test
    fun aReleaseBuildLaunchedWithItAsksAsEver() = inUTC {
        runTest {
            val clock = TestClock()
            val (model, api) = loaded(clock, InMemoryScooterDefaults().apply { set(true, forKey = "ReviewPromptDue") }, debug = false)
            assertEquals(0, model.reviewMoments.value)
            returnFromRide(model, api, clock)
            assertEquals("not on the first day of use", 0, model.reviewMoments.value)
            assertFalse(model.takeReviewMoment())
        }
    }

    @Test
    fun aDebugBuildLaunchedWithoutItAsksAsEver() = inUTC {
        runTest {
            val clock = TestClock()
            val (model, api) = loaded(clock, InMemoryScooterDefaults(), debug = true)
            assertEquals(0, model.reviewMoments.value)
            returnFromRide(model, api, clock)
            assertEquals(0, model.reviewMoments.value)
        }
    }

    /** A controller of a fresh feed, its first load in, on the first day it is used. */
    private fun TestScope.loaded(clock: TestClock, defaults: ScooterDefaults, debug: Boolean): Pair<ScooterMapController, StubScooterAPI> {
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "one", provider = "lime"))))
        val model = makeController(api, clock = clock, defaults = defaults, debug = debug)
        model.refresh()
        assertTrue(waitUntil { model.lastUpdated.value != null && !model.isLoading.value })
        return model to api
    }

    /** "Open in", 20 minutes away, then the app in front again until the refresh is in. */
    private fun TestScope.returnFromRide(model: ScooterMapController, api: StubScooterAPI, clock: TestClock) {
        model.rentalOpened()
        model.becameInactive()
        clock.advance(20.0 * 60)
        val calls = api.calls
        model.becameActive()
        assertTrue(waitUntil { api.calls == calls + 1 && !model.isLoading.value })
    }

    /** Runs `body` with the JVM's time zone, which ZoneId.systemDefault reads, set to UTC. */
    private fun inUTC(body: () -> Unit) {
        val zone = TimeZone.getDefault()
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
        try {
            body()
        } finally {
            TimeZone.setDefault(zone)
        }
    }
}
