package com.plhery.scootradar.app

import android.content.Context
import android.icu.number.NumberFormatter
import android.icu.number.Precision
import android.icu.text.DateFormat
import android.icu.text.ListFormatter
import android.icu.util.Currency
import android.icu.util.MeasureUnit
import android.icu.util.TimeZone
import com.plhery.scootradar.core.model.ScooterLengthUnit
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.Instant
import java.time.ZoneId
import java.util.Date
import java.util.Locale

/**
 * Numbers, lengths, dates and lists as Android's ICU writes them in a locale, as Foundation writes the
 * iPhone's from its own: the formats :core asks the app for (ScooterNumberFormat, ScooterMeasureFormat,
 * ScooterDateFormat, ScooterListFormat).
 */
class AndroidFormats(private val context: Context) {
    /** A whole number with the locale's grouping, and its minimum grouping digits: 1005 but 12.345 in Spanish. */
    fun integer(number: Long, locale: Locale): String = NumberFormatter.withLocale(locale).format(number).toString()

    /** A decimal with that many digits after its point, halves going to the even neighbour. */
    fun decimal(number: BigDecimal, fractionDigits: Int, locale: Locale): String =
        NumberFormatter.withLocale(locale)
            .precision(Precision.fixedFraction(fractionDigits))
            .roundingMode(RoundingMode.HALF_EVEN)
            .format(number)
            .toString()

    /**
     * An amount of the currency of that ISO code, with that many digits after its point: a code of three
     * capital letters is written even when it names no currency ICU knows ("XYZ 1.00"), any other gives the
     * locale's own currency, and a locale without one writes nothing.
     */
    fun currency(amount: BigDecimal, code: String, fractionDigits: Int, locale: Locale): String? {
        val currency = if (Regex("[A-Z]{3}").matches(code)) {
            Currency.getInstance(code)
        } else {
            Currency.getInstance(locale) ?: return null
        }
        return NumberFormatter.withLocale(locale)
            .unit(currency)
            .precision(Precision.fixedFraction(fractionDigits))
            .roundingMode(RoundingMode.HALF_EVEN)
            .format(amount)
            .toString()
    }

    /** A length in its unit, abbreviated, with all the decimals it comes with. */
    fun length(value: BigDecimal, unit: ScooterLengthUnit, locale: Locale): String =
        NumberFormatter.withLocale(locale)
            .unit(
                when (unit) {
                    ScooterLengthUnit.Meters -> MeasureUnit.METER
                    ScooterLengthUnit.Kilometers -> MeasureUnit.KILOMETER
                    ScooterLengthUnit.Feet -> MeasureUnit.FOOT
                    ScooterLengthUnit.Yards -> MeasureUnit.YARD
                    ScooterLengthUnit.Miles -> MeasureUnit.MILE
                },
            )
            .unitWidth(NumberFormatter.UnitWidth.SHORT)
            .precision(Precision.minMaxFraction(0, maxOf(0, value.scale())))
            .roundingMode(RoundingMode.HALF_EVEN)
            .format(value)
            .toString()

    /**
     * The instant by the locale's pattern for the ICU skeleton, in the zone. The hour of "j" follows the phone's
     * 12- or 24-hour setting, as the iPhone's follows its own (UI-401).
     */
    fun skeleton(skeleton: String, instant: Instant, zone: ZoneId, locale: Locale): String {
        val hour = if (android.text.format.DateFormat.is24HourFormat(context)) "H" else "h"
        return DateFormat.getInstanceForSkeleton(skeleton.replace("j", hour), locale)
            .apply { timeZone = TimeZone.getTimeZone(zone.id) }
            .format(Date.from(instant))
    }

    /** The phone's time zone, read each time, as Android changes it when the phone does. */
    fun timeZone(): ZoneId = java.util.TimeZone.getDefault().toZoneId()

    /** The items joined with the locale's "and". */
    fun and(items: List<String>, locale: Locale): String = ListFormatter.getInstance(locale).format(items)
}
