package com.plhery.scootradar.core.model

import java.time.Instant
import java.time.ZoneId
import java.time.ZoneOffset
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

// ios/ScootRadarTests/ScooterReviewPromptTests.swift.

/**
 * When the app asks for a rating: on a calm return from a ride, from the third day with a fresh feed, never on a
 * day something went wrong, once per version and a month apart at the soonest.
 */
class ScooterReviewPromptTest {
    /** 09:00 UTC: the hours added below stay on the same day. */
    private val start = Instant.parse("2026-10-01T09:00:00Z")

    /** A store of its own, so that the tests write nothing to the app's. */
    private fun withDefaults(body: (ScooterDefaults) -> Unit) {
        body(InMemoryScooterDefaults())
    }

    private fun prompt(defaults: ScooterDefaults, version: String = "1.0.1"): ScooterReviewPrompt =
        ScooterReviewPrompt(defaults, version, timeZone = { ZoneOffset.UTC })

    private fun day(days: Int, hours: Double = 0.0): Instant = start.plusSeconds((days * 86_400 + hours * 3_600).toLong())

    /** `start` and so many seconds. */
    private fun later(seconds: Double): Instant = start.plusSeconds(seconds.toLong())

    /** A fresh feed at `date`, then whether a calm moment then is the one to ask. */
    private fun isDue(prompt: ScooterReviewPrompt, date: Instant, calm: Boolean = true): Boolean {
        prompt.noteUse(date)
        return prompt.isDue(date, calm)
    }

    @Test
    fun asksOnTheThirdDayWithAFreshFeedThenNotAgain() = withDefaults { defaults ->
        val prompt = prompt(defaults)
        assertFalse(isDue(prompt, day(0)))
        // Days without a fresh feed do not count.
        assertFalse(isDue(prompt, day(4)))
        assertTrue(isDue(prompt, day(9)))
        prompt.asked(day(9))
        assertFalse(isDue(prompt, day(10)))
        assertFalse(isDue(prompt, day(90)))
    }

    @Test
    fun staysDueUntilTheAppAsks() = withDefaults { defaults ->
        val prompt = prompt(defaults)
        assertFalse(isDue(prompt, day(0)))
        assertFalse(isDue(prompt, day(1)))
        assertTrue(isDue(prompt, day(2)))
        assertTrue(isDue(prompt, day(2, hours = 1.0)))
        prompt.asked(day(2, hours = 1.0))
        assertFalse(isDue(prompt, day(2, hours = 2.0)))
    }

    @Test
    fun countsTheRidersOwnDays() = withDefaults { defaults ->
        val zurich = ScooterReviewPrompt(defaults, version = "1.0.1", timeZone = { ZoneId.of("Europe/Zurich") })
        fun at(text: String): Instant = Instant.parse(text)
        // 23:30 and 00:30 in Zürich: two days there, one in UTC.
        assertFalse(isDue(zurich, at("2026-10-01T21:30:00Z")))
        assertFalse(isDue(zurich, at("2026-10-01T22:30:00Z")))
        // The afternoon of that second day: it counts once.
        assertFalse(isDue(zurich, at("2026-10-02T12:00:00Z")))
        // 00:30 in Zürich: the third day there, still the second in UTC.
        assertTrue(isDue(zurich, at("2026-10-02T22:30:00Z")))
        zurich.asked(at("2026-10-02T22:30:00Z"))
        // The next version counts the month in Zürich's days too, winter time by then.
        val next = ScooterReviewPrompt(defaults, version = "1.0.2", timeZone = { ZoneId.of("Europe/Zurich") })
        assertFalse(isDue(next, at("2026-11-01T22:30:00Z")))
        assertTrue(isDue(next, at("2026-11-01T23:30:00Z")))
    }

    @Test
    fun waitsForACalmMoment() = withDefaults { defaults ->
        val prompt = prompt(defaults)
        assertFalse(isDue(prompt, day(0)))
        assertFalse(isDue(prompt, day(1)))
        assertFalse(isDue(prompt, day(2), calm = false))
        assertTrue(isDue(prompt, day(2, hours = 2.0)))
    }

    @Test
    fun eachVersionAsksOnceAMonthAfterTheLastAsk() = withDefaults { defaults ->
        val first = prompt(defaults, version = "1.0.1")
        assertFalse(isDue(first, day(0)))
        assertFalse(isDue(first, day(1)))
        assertTrue(isDue(first, day(2)))
        first.asked(day(2))

        // A new version the next day waits for the month to pass.
        val next = prompt(defaults, version = "1.1")
        assertFalse(isDue(next, day(3)))
        assertFalse(isDue(next, day(2 + ScooterReviewPrompt.gap - 1)))
        assertTrue(isDue(next, day(2 + ScooterReviewPrompt.gap)))
        next.asked(day(2 + ScooterReviewPrompt.gap))
        assertFalse(isDue(next, day(2 + 3 * ScooterReviewPrompt.gap)))
    }

    @Test
    fun aBadMomentKeepsTheRestOfTheDayFromAsking() = withDefaults { defaults ->
        val prompt = prompt(defaults)
        assertFalse(isDue(prompt, day(0)))
        assertFalse(isDue(prompt, day(1)))
        // A failed refresh in the morning: the calm evening asks nothing.
        prompt.noteBadMoment(day(2, hours = 1.0))
        assertFalse(isDue(prompt, day(2, hours = 2.0)))
        assertFalse(isDue(prompt, day(2, hours = 12.0)))
        // The bad day still counted as a day with use, and the next one asks.
        assertTrue(isDue(prompt, day(3)))
    }

    @Test
    fun onlyAReturnFiveMinutesToTwoHoursAfterOpenInIsTheEndOfARide() = withDefaults { defaults ->
        val prompt = prompt(defaults)
        // Nothing was opened.
        assertFalse(prompt.takeRentalReturn(start))

        // Back within minutes: the rental mostly did not happen, and the tap is used up.
        prompt.noteRentalOpened(start)
        assertFalse(prompt.takeRentalReturn(later(4.0 * 60 + 59)))
        assertFalse(prompt.takeRentalReturn(later(20.0 * 60)))

        for (minutes in listOf(5.0, 20.0, 120.0)) {
            prompt.noteRentalOpened(start)
            assertTrue("$minutes min", prompt.takeRentalReturn(later(minutes * 60)))
            // One try per return.
            assertFalse(prompt.takeRentalReturn(later(minutes * 60 + 1)))
        }

        // Later, it is another trip.
        prompt.noteRentalOpened(start)
        assertFalse(prompt.takeRentalReturn(later(2.0 * 3_600 + 1)))

        // The last tap is the one that counts, and it survives the app being closed.
        prompt.noteRentalOpened(start)
        prompt.noteRentalOpened(later(30.0 * 60))
        val reopened = ScooterReviewPrompt(defaults, version = "1.0.1", timeZone = { ZoneOffset.UTC })
        assertFalse(reopened.takeRentalReturn(later(33.0 * 60)))
        prompt.noteRentalOpened(later(30.0 * 60))
        assertTrue(reopened.takeRentalReturn(later(40.0 * 60)))
    }
}
