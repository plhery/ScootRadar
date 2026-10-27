package com.plhery.scootradar.core.model

import java.time.Instant
import java.time.ZoneId
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds

// ios/ScootRadar/Models/ScooterReviewPrompt.swift.

/**
 * When the app asks for a rating with the system's prompt, which the store shows only so often: when the
 * rider is back from the operator's app 5 minutes to 2 hours after "Open in", the end of a ride, and the
 * map shows a healthy feed. Only from the third day with a fresh feed, once per version of the app, a month
 * after the last ask at the soonest, and never on a day the feed or the rider's place had a problem. The
 * days are counted on this device, in its time zone.
 */
class ScooterReviewPrompt(
    val defaults: ScooterDefaults,
    /** The app's version name: each version asks once. */
    val version: String,
    /** The phone's time zone, read each time, as TimeZone.autoupdatingCurrent follows it. */
    val timeZone: () -> ZoneId = ZoneId::systemDefault,
) {
    /**
     * Debug builds only: every calm moment is the one to ask, so that an emulator shows the store's sheet.
     * The app sets it only in a debug build.
     */
    var alwaysDue: Boolean = false

    /** A fresh feed then: its calendar day counts as a day with use, once. */
    fun noteUse(at: Instant) {
        val day = day(of = at)
        if (defaults.int(LAST_DAY_KEY) == day) return
        defaults.set(day, forKey = LAST_DAY_KEY)
        defaults.set(defaults.integer(DAYS_KEY) + 1, forKey = DAYS_KEY)
    }

    /** Something went wrong then: nothing asks for the rest of that day. */
    fun noteBadMoment(at: Instant) {
        defaults.set(day(of = at), forKey = BAD_DAY_KEY)
    }

    /**
     * True when the moment is the one to ask: `calm`, from the third day with a fresh feed, on a day
     * with nothing wrong, for a version that has not asked, a month after the last ask. Nothing is asked
     * until `asked`.
     */
    fun isDue(at: Instant, calm: Boolean): Boolean {
        if (alwaysDue) return calm
        val day = day(of = at)
        if (!calm || defaults.integer(DAYS_KEY) < days ||
            defaults.int(BAD_DAY_KEY) == day ||
            defaults.string(ASKED_KEY) == version
        ) {
            return false
        }
        val askedDay = defaults.int(ASKED_DAY_KEY)
        if (askedDay != null && day - askedDay < gap) return false
        return true
    }

    /** The app asked then: this version asks no more, and the next one waits for the gap. */
    fun asked(at: Instant) {
        defaults.set(version, forKey = ASKED_KEY)
        defaults.set(day(of = at), forKey = ASKED_DAY_KEY)
    }

    /** "Open in" took the rider to the operator's app then. Kept on disk: Android may close the app meanwhile. */
    fun noteRentalOpened(at: Instant) {
        defaults.set(at, forKey = RENTAL_OPENED_KEY)
    }

    /**
     * The app is in front again then: true when this is the end of a ride, 5 minutes to 2 hours after
     * "Open in". Each return is one try, so the time of the tap goes, whatever the answer.
     */
    fun takeRentalReturn(at: Instant): Boolean {
        val opened = defaults.date(RENTAL_OPENED_KEY) ?: return false
        defaults.removeObject(RENTAL_OPENED_KEY)
        val seconds = (at.epochSecond - opened.epochSecond) + (at.nano - opened.nano) / 1e9
        return seconds in rentalReturn
    }

    /** The calendar day of the instant in the rider's time zone, as days since 1970. */
    private fun day(of: Instant): Int = of.atZone(timeZone()).toLocalDate().toEpochDay().toInt()

    companion object {
        /** Days with a fresh feed before the first ask. */
        const val days = 3

        /** Days from one ask to the next, whatever the version. */
        const val gap = 30

        /**
         * How long after "Open in", in seconds, a return is the end of a ride: sooner, the rental mostly did
         * not happen; later, it is another trip.
         */
        val rentalReturn: ClosedFloatingPointRange<Double> = 5.0 * 60..2.0 * 3_600

        /** How long the map rests with nothing over it before the ask. */
        val settle: Duration = 5.seconds

        private const val DAYS_KEY = "review-use-days"
        private const val LAST_DAY_KEY = "review-last-use-day"
        private const val BAD_DAY_KEY = "review-bad-day"
        private const val ASKED_KEY = "review-asked-version"
        private const val ASKED_DAY_KEY = "review-asked-day"
        private const val RENTAL_OPENED_KEY = "review-rental-opened-at"
    }
}
