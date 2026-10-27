package com.plhery.scootradar.core.model

import java.math.BigDecimal
import java.math.RoundingMode
import java.text.NumberFormat
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

// Lengths, dates and times as Foundation writes them on the iPhone. Each goes through a hook the app sets
// to Android's own ICU data, as ScooterNumberFormat does for whole numbers; the defaults read the JDK's
// CLDR data, for the tests and the JVM.

/** Locale.MeasurementSystem */
enum class ScooterMeasurementSystem {
    Metric,
    /** Miles and feet. */
    Us,
    /** Miles and yards. */
    Uk,
}

/**
 * Locale.measurementSystem: the one the locale names ("en-US-u-ms-metric"), or else its region's: miles and
 * feet in the US and Liberia, miles and yards in the UK and Myanmar, metres everywhere else. A locale
 * without a region is in the one its language most likely means, as English is in the US.
 */
val Locale.measurementSystem: ScooterMeasurementSystem
    get() {
        when (getUnicodeLocaleType("ms")) {
            "metric" -> return ScooterMeasurementSystem.Metric
            "ussystem" -> return ScooterMeasurementSystem.Us
            "uksystem" -> return ScooterMeasurementSystem.Uk
        }
        val region = country.ifEmpty { if (language == "en") "US" else "" }
        return when (region) {
            "US", "LR" -> ScooterMeasurementSystem.Us
            "GB", "MM" -> ScooterMeasurementSystem.Uk
            else -> ScooterMeasurementSystem.Metric
        }
    }

/** The units of UnitLength the app writes lengths in. */
enum class ScooterLengthUnit { Meters, Kilometers, Feet, Yards, Miles }

object ScooterMeasureFormat {
    /**
     * A length in its unit, abbreviated, as Measurement.formatted(.measurement(width: .abbreviated, usage:
     * .asProvided)) writes it in the locale: "1,000 ft", "0.62 mi", "1.3 km", "320 m" in French. The value
     * comes rounded and is written with all its decimals and the locale's grouping. The app sets one that
     * reads Android's ICU (MeasureFormat, short width), as Foundation reads the iPhone's.
     */
    @Volatile
    var length: (value: BigDecimal, unit: ScooterLengthUnit, locale: Locale) -> String = ::jvmLength

    /** The units' short names as Foundation writes them in the app's languages. */
    private fun jvmLength(value: BigDecimal, unit: ScooterLengthUnit, locale: Locale): String {
        val number = NumberFormat.getNumberInstance(locale).apply {
            minimumFractionDigits = 0
            maximumFractionDigits = maxOf(0, value.scale())
            roundingMode = RoundingMode.HALF_EVEN
        }.format(value)
        val separator = when {
            locale.language == "fr" && locale.country == "CA" -> " "
            locale.language == "fr" -> " "
            else -> " "
        }
        val name = when (unit) {
            ScooterLengthUnit.Meters -> "m"
            ScooterLengthUnit.Kilometers -> "km"
            ScooterLengthUnit.Feet -> when (locale.language) {
                "fr" -> "pi"
                "nb", "no" -> "fot"
                "is" -> "fet"
                else -> "ft"
            }
            ScooterLengthUnit.Yards -> if (locale.language == "nb" || locale.language == "no") "yard" else "yd"
            ScooterLengthUnit.Miles -> when (locale.language) {
                "nb", "no" -> if (value.compareTo(BigDecimal.ONE) == 0 && value.scale() <= 0) "mile" else "miles"
                "is" -> "mí"
                else -> "mi"
            }
        }
        return number + separator + name
    }
}

object ScooterDateFormat {
    /**
     * TimeZone.current: the phone's time zone, read each time as Foundation's autoupdating one is. Tests
     * set their own.
     */
    @Volatile
    var timeZone: () -> ZoneId = ZoneId::systemDefault

    /**
     * The instant as Date.FormatStyle writes the fields it is given, by the locale's pattern for the ICU
     * skeleton in the zone: "jm" for the time ("4:13 PM", "16:13"), "Ejm" with the weekday ("Mon 4:13 PM"),
     * "jmz" with the zone's short name ("4:13 PM GMT+2", "16:13 CEST"), "MMMd" for a day ("Oct 18"). The app
     * sets one that reads Android's ICU (DateFormat.getInstanceForSkeleton) and the phone's 12- or 24-hour
     * setting, as Foundation reads the iPhone's. This one reads the JDK's, which has no short names of
     * zones: it writes a zone as its offset from GMT.
     */
    @Volatile
    var skeleton: (skeleton: String, instant: Instant, zone: ZoneId, locale: Locale) -> String = ::jvmSkeleton

    private fun jvmSkeleton(skeleton: String, instant: Instant, zone: ZoneId, locale: Locale): String {
        val withoutZone = skeleton.trimEnd('z')
        val text = DateTimeFormatter.ofLocalizedPattern(withoutZone).withLocale(locale).withZone(zone).format(instant)
        if (withoutZone == skeleton) return text
        return text + " " + DateTimeFormatter.ofPattern("O", locale).withZone(zone).format(instant)
    }
}

/** Double.rounded(): to the nearest whole number, halves away from zero. */
internal fun Double.roundedAwayFromZero(): Double =
    if (isFinite()) BigDecimal(this).setScale(0, RoundingMode.HALF_UP).toDouble() else this

/** The decimal with no zeros after its last digit, and none of its whole digits written as a power of ten. */
internal fun BigDecimal.withoutTrailingZeros(): BigDecimal =
    stripTrailingZeros().let { if (it.scale() < 0) it.setScale(0) else it }
