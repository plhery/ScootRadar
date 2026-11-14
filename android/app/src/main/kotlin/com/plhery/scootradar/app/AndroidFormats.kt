package com.plhery.scootradar.app

import android.content.Context
import android.icu.number.NumberFormatter
import android.icu.number.Precision
import android.icu.text.DateFormat
import android.icu.text.ListFormatter
import android.icu.util.Currency
import android.icu.util.MeasureUnit
import android.icu.util.TimeZone
import android.provider.Settings
import com.plhery.scootradar.core.model.ScooterLengthUnit
import java.math.BigDecimal
import java.math.RoundingMode
import java.text.CharacterIterator
import java.time.Instant
import java.time.ZoneId
import java.util.Date
import java.util.Locale

/** The fields of a time of day, which a line does not break between. */
private val timeOfDay: Set<DateFormat.Field> = setOf(
    DateFormat.Field.HOUR0,
    DateFormat.Field.HOUR1,
    DateFormat.Field.HOUR_OF_DAY0,
    DateFormat.Field.HOUR_OF_DAY1,
    DateFormat.Field.MINUTE,
    DateFormat.Field.AM_PM,
    DateFormat.Field.AM_PM_MIDNIGHT_NOON,
    DateFormat.Field.FLEXIBLE_DAY_PERIOD,
)

/**
 * Numbers, lengths, dates and lists as Android's ICU writes them in a locale, as Foundation writes the
 * iPhone's from its own: the formats :core asks the app for (ScooterNumberFormat, ScooterMeasureFormat,
 * ScooterDateFormat, ScooterListFormat).
 */
class AndroidFormats(private val context: Context) {
    /** A whole number with the locale's grouping, and its minimum grouping digits: 1005 but 12.345 in Spanish. */
    fun integer(number: Long, locale: Locale): String = NumberFormatter.withLocale(locale).format(number).toString()

    /**
     * An amount of the currency of that ISO code without its symbol, with that many digits after its point: the
     * currency's own format with its unit hidden, so its separators are money's ("5.00" in Swiss French, where a
     * plain number has a comma). Any code not of three capital letters takes the locale's own currency, and a
     * locale without one writes a plain number.
     */
    fun amount(amount: BigDecimal, code: String, fractionDigits: Int, locale: Locale): String {
        val currency = if (Regex("[A-Z]{3}").matches(code)) Currency.getInstance(code) else Currency.getInstance(locale)
        return NumberFormatter.withLocale(locale)
            .let { if (currency != null) it.unit(currency).unitWidth(NumberFormatter.UnitWidth.HIDDEN) else it }
            .precision(Precision.fixedFraction(fractionDigits))
            .roundingMode(RoundingMode.HALF_EVEN)
            .format(amount)
            .toString()
            .trim()
    }

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
     * 12- or 24-hour setting where one is chosen, as the iPhone's follows its own (UI-401), and otherwise the
     * locale's, which carries the phone's region: an English app in Switzerland writes 16:13. Android's
     * is24HourFormat would ask the app's own locale, "en", without the region.
     */
    fun skeleton(skeleton: String, instant: Instant, zone: ZoneId, locale: Locale): String {
        val hour = when (Settings.System.getString(context.contentResolver, Settings.System.TIME_12_24)) {
            "24" -> "H"
            "12" -> "h"
            else -> null
        }
        val pattern = if (hour == null) skeleton else skeleton.replace("j", hour)
        val format = DateFormat.getInstanceForSkeleton(pattern, locale).apply { timeZone = TimeZone.getTimeZone(zone.id) }
        return withTimeOnOneLine(format, Date.from(instant))
    }

    /**
     * The date as [format] writes it, with no line break inside its time: from its first field of the time of day
     * to its last, the hour, the minutes and the day period, its plain spaces become no-break ones of the same width.
     * Android 12's ICU writes "10:13 AM" with a plain space, and the dock's offline line broke before "AM" at 360 dp
     * (the lane's device notes of 14 November 2026); Portugal's "10:13 da manhã" and Canadian French's "10 h 13" have
     * them inside. Newer ICU writes a narrow no-break space before the day period, except in Dutch, and keeps it. A
     * weekday or a zone beside the time may still go to a line of its own.
     */
    private fun withTimeOnOneLine(format: DateFormat, date: Date): String {
        val text = StringBuilder()
        var first = -1
        var last = -1
        val iterator = format.formatToCharacterIterator(date)
        var char = iterator.first()
        while (char != CharacterIterator.DONE) {
            if (iterator.attributes.keys.any { it in timeOfDay }) {
                if (first < 0) first = text.length
                last = text.length
            }
            text.append(char)
            char = iterator.next()
        }
        for (index in maxOf(first, 0)..last) {
            if (text[index] == ' ') text.setCharAt(index, '\u00A0')
        }
        return text.toString()
    }

    /** The phone's time zone, read each time, as Android changes it when the phone does. */
    fun timeZone(): ZoneId = java.util.TimeZone.getDefault().toZoneId()

    /** The items joined with the locale's "and". */
    fun and(items: List<String>, locale: Locale): String = ListFormatter.getInstance(locale).format(items)
}
