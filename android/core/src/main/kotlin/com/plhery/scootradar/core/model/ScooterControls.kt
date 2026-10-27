package com.plhery.scootradar.core.model

import java.net.URI
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

// RidePriceFormatter.listedDay and ScooterLinks from ios/ScootRadar/Views/ScooterControls.swift; the rest of
// that file is views.

object RidePriceFormatter {
    private val isoDay = Regex("([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})")

    /**
     * "18 Oct", or "18 Oct 2026" when that is not this year: the day, "2026-10-18", a price copied from an
     * operator's price list was last checked there. Read as Foundation's ISO 8601 parsing reads it: a
     * month past its last day runs on into the next.
     */
    fun listedDay(day: String, now: Instant = Instant.now()): String? {
        val (year, month, dayOfMonth) = isoDay.matchEntire(day)?.destructured ?: return null
        if (month.toInt() !in 1..12 || dayOfMonth.toInt() !in 1..31) return null
        val date = LocalDate.of(year.toInt(), month.toInt(), 1).plusDays(dayOfMonth.toLong() - 1)
        val skeleton = if (date.year != now.atZone(ZoneOffset.UTC).year) "yMMMd" else "MMMd"
        return ScooterDateFormat.skeleton(
            skeleton,
            date.atStartOfDay(ZoneOffset.UTC).toInstant(),
            ZoneOffset.UTC,
            ScooterLanguage.current.locale,
        )
    }
}

object ScooterLinks {
    val privacyNotice: URI = URI("https://scootradar.com/privacy")
    val sourceCode: URI = URI("https://github.com/plhery/ScootRadar")

    /** The version on sale, such as "1.0.1": the app sets its versionName as it starts. */
    @Volatile
    var appVersion: String = ""

    /** A mail to ScootRadar whose subject names the version: "ScootRadar 1.0.1 feedback", with an empty body. */
    val feedback: URI
        get() = URI("mailto:hello@scootradar.com?subject=" + queryValue("ScootRadar $appVersion feedback"))

    /** A value of a query as URLComponents writes it: "&" and "=" escaped with the rest a query may not hold; "+" kept. */
    private fun queryValue(value: String): String = buildString {
        for (byte in value.encodeToByteArray()) {
            val character = (byte.toInt() and 0xFF).toChar()
            if (character.code < 0x80 && (character.isLetterOrDigit() || character in "-._~!$'()*+,;:@/?")) {
                append(character)
            } else {
                append('%').append("%02X".format(byte.toInt() and 0xFF))
            }
        }
    }
}
