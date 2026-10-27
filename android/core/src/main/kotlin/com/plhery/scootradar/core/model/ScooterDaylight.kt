package com.plhery.scootradar.core.model

import java.time.Instant
import kotlin.math.PI
import kotlin.math.acos
import kotlin.math.asin
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.min
import kotlin.math.sin

// ios/ScootRadar/Models/ScooterDaylight.swift, and ScooterAppearance from ScooterModels.swift.

/**
 * Day and night at a place, for the Automatic appearance: dark from half an hour after sunset to half an
 * hour before sunrise, when the sky has gone dark too. Sunrise and sunset come from the sunrise equation
 * (en.wikipedia.org/wiki/Sunrise_equation), right to a minute or two, which is all a change of colours
 * needs. Nothing leaves the phone.
 */
object ScooterDaylight {
    /** How long after sunset the app turns dark, and before sunrise light, in seconds. */
    const val twilight: Double = 30.0 * 60

    /** Dark all day in a polar night, and never under the midnight sun. */
    fun isDark(at: Instant, place: GeoPoint): Boolean {
        val day = solarDay(near = at)
        return !(day - 1..day + 1).any { lightHours(onSolarDay = it, at = place)?.contains(at) == true }
    }

    /**
     * Light from half an hour before sunrise to half an hour after sunset; all of the day under the
     * midnight sun, and none of it in a polar night.
     */
    fun lightHours(onSolarDay: Int, at: GeoPoint): ClosedRange<Instant>? {
        val sun = passage(onSolarDay, at)
        if (!(sun.hourAngle > 0)) return null
        // Half a turn is the whole day around the sun's highest.
        val halfDay = min(sun.hourAngle, 180.0) / 360
        return date(julianDay = sun.transit - halfDay, plusSeconds = -twilight)..
            date(julianDay = sun.transit + halfDay, plusSeconds = twilight)
    }

    private class Passage(val transit: Double, val hourAngle: Double)

    /**
     * When the sun is highest on a day, as a Julian day, and how far it turns from rising to then, in
     * degrees: 0 when it stays under the horizon all day, more than 180 when it stays above it.
     */
    private fun passage(day: Int, place: GeoPoint): Passage {
        val meanNoon = day.toDouble() - place.longitude / 360
        val anomaly = (357.5291 + 0.98560028 * meanNoon) % 360
        val centre = 1.9148 * sine(anomaly) + 0.0200 * sine(2 * anomaly) + 0.0003 * sine(3 * anomaly)
        val longitude = (anomaly + centre + 180 + 102.9372) % 360
        val transit = J2000 + meanNoon + 0.0053 * sine(anomaly) - 0.0069 * sine(2 * longitude)
        val declination = asin(sine(longitude) * sine(23.4397))
        // The sun's top on the horizon, as refraction raises it.
        val cosHourAngle = (sine(-0.833) - sine(place.latitude) * sin(declination)) /
            (cos(place.latitude * PI / 180) * cos(declination))
        if (cosHourAngle >= 1) return Passage(transit, 0.0)
        if (cosHourAngle <= -1) return Passage(transit, 360.0)
        return Passage(transit, acos(cosHourAngle) * 180 / PI)
    }

    /** The day since 1 January 2000 whose noon at Greenwich is the first after the date. */
    private fun solarDay(near: Instant): Int = ceil(julianDay(near) - J2000 + 0.0008).toInt()

    /** Noon at Greenwich on 1 January 2000. */
    private const val J2000 = 2_451_545.0

    /** Midnight at Greenwich on 1 January 1970. */
    private const val UNIX_EPOCH = 2_440_587.5

    private fun julianDay(date: Instant): Double = (date.epochSecond + date.nano / 1e9) / 86_400 + UNIX_EPOCH

    private fun date(julianDay: Double, plusSeconds: Double): Instant {
        val seconds = (julianDay - UNIX_EPOCH) * 86_400 + plusSeconds
        val whole = floor(seconds)
        return Instant.ofEpochSecond(whole.toLong(), ((seconds - whole) * 1e9).toLong())
    }

    private fun sine(degrees: Double): Double = sin(degrees * PI / 180)
}

/** UIUserInterfaceStyle: the colours the app is drawn in. Unspecified leaves the choice to the phone. */
enum class UserInterfaceStyle { Unspecified, Light, Dark }

/** Light by day and dark by night, whichever of the two the phone is in, light, or dark. */
enum class ScooterAppearance(val rawValue: String) {
    /** Automatic: dark from half an hour after sunset to half an hour before sunrise (ScooterDaylight). */
    Sun("sun"),

    /** Saved as "automatic", its name while it was the only automatic one. */
    System("automatic"),
    Light("light"),
    Dark("dark"),
    ;

    val id: String get() = rawValue

    val label: String
        get() = when (this) {
            Sun -> localized("Automatic")
            System -> localized("System")
            Light -> localized("Light")
            Dark -> localized("Dark")
        }

    /** Unspecified leaves the choice to the phone. */
    fun interfaceStyle(at: Instant, place: GeoPoint): UserInterfaceStyle = when (this) {
        Sun -> if (ScooterDaylight.isDark(at, place)) UserInterfaceStyle.Dark else UserInterfaceStyle.Light
        System -> UserInterfaceStyle.Unspecified
        Light -> UserInterfaceStyle.Light
        Dark -> UserInterfaceStyle.Dark
    }

    companion object {
        fun fromRawValue(rawValue: String): ScooterAppearance? = entries.firstOrNull { it.rawValue == rawValue }
    }
}
