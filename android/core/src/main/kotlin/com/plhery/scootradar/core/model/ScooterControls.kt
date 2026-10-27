package com.plhery.scootradar.core.model

import java.math.BigDecimal
import java.net.URI
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

// RidePriceFormatter, ScooterCreditsList's sources, ScooterLinks and PartsFlow's frames from
// ios/ScootRadar/Views/ScooterControls.swift; the rest of that file is views.

object RidePriceFormatter {
    private val isoDay = Regex("([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})")

    /** "5.20": the amount without its currency, which the label under a figure names. */
    fun amount(minorUnits: Int, currency: String): String =
        ScooterNumberFormat.decimal(
            BigDecimal.valueOf(minorUnits.toLong(), 2),
            fractionDigits(currency),
            ScooterLanguage.current.locale,
        )

    fun string(minorUnits: Int, currency: String): String {
        val amount = BigDecimal.valueOf(minorUnits.toLong(), 2)
        return ScooterNumberFormat.currency(
            amount,
            currency.uppercase(),
            fractionDigits(currency),
            ScooterLanguage.current.locale,
        ) ?: "${currency.uppercase()} ${amount.withoutTrailingZeros().toPlainString()}"
    }

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

    /** Two decimals, or none for a currency that has no cents: "ISK 350", "HUF 272". */
    fun fractionDigits(currency: String): Int = if (currency.uppercase() in wholeUnitCurrencies) 0 else 2

    /**
     * The currencies Foundation's currency style writes without decimals (NumberFormatter, probed for every
     * ISO code on macOS 27 / iOS 26), as the iPhone asks it. Neither the JVM's ISO 4217 data nor Android's
     * CLDR data gives the same set (both give COP and IDR two decimals), so it is written out here.
     * Forints are among them, as the iPhone also lists them itself: the fillér left circulation in 1999, yet
     * ISO 4217 still gives HUF two decimals, and some systems follow it ("HUF 272.00"). src/lib/ridePrice.ts
     * lists the same.
     */
    private val wholeUnitCurrencies = setOf(
        "ADP", "AFN", "ALL", "BIF", "BYR", "CLP", "COP", "DJF", "ESP", "GNF", "HUF", "IDR", "IQD", "IRR", "ISK",
        "ITL", "JPY", "KMF", "KPW", "KRW", "LAK", "LBP", "LUF", "MGA", "MGF", "MMK", "MRO", "PKR", "PYG", "RSD",
        "RWF", "SLL", "SOS", "STD", "SYP", "TMM", "TRL", "UGX", "UYI", "VND", "VUV", "XAF", "XOF", "XPF", "YER",
        "ZMK", "ZWD",
    )
}

/** Settings › About › Map & data credits: where the map and the data come from. */
object ScooterCreditsList {
    data class Source(val title: String, val url: URI) {
        /** Two sources may share a licence's address, never a title. */
        val id: String get() = title
    }

    /** The same sources as the credits list on the web. Names of feeds and operators are not translated. */
    val sources: List<Source>
        get() {
            // Each country's own, from data/countries.json.
            val countries = ScooterCountryCatalog.credits.map { (title, url) -> Source(title = title, url = URI(url)) }
            return listOf(
                Source(
                    title = localized("Mobility data sources"),
                    url = URI("https://opentransportdata.swiss/en/cookbook/shared-mobility/"),
                ),
                Source(
                    title = localized("French mobility data"),
                    url = URI("https://transport.data.gouv.fr/datasets?type=vehicles-sharing"),
                ),
            ) + countries + listOf(
                Source(
                    title = localized("Address search by Geoapify"),
                    url = URI("https://www.geoapify.com/"),
                ),
                Source(
                    title = localized("Address data © OpenStreetMap contributors"),
                    url = URI("https://www.openstreetmap.org/copyright"),
                ),
                Source(
                    title = stringFormat(
                        localized("%1\$@ · %2\$@"),
                        localized("Parking"),
                        "Métropole Européenne de Lille",
                    ),
                    url = URI("https://data.lillemetropole.fr/"),
                ),
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

/**
 * Lays out its parts as the words of a paragraph: side by side while they fit, and the next on a new row when it
 * doesn't. A part is never broken, unless it is wider than a row on its own; it then takes a row of its own and
 * wraps inside it. The folded panel's line lays out its parts so.
 */
object PartsFlow {
    /**
     * Where each part goes, row after row, in a `width`, from the size each takes on one line and the size
     * `wrapped` gives one wrapped to a width.
     */
    fun frames(
        of: List<ScreenSize>,
        width: Double,
        spacing: Double,
        wrapped: (Int, Double) -> ScreenSize,
    ): List<ScreenRect> {
        val frames = mutableListOf<ScreenRect>()
        var x = 0.0
        var y = 0.0
        var rowHeight = 0.0
        for ((index, oneLine) in of.withIndex()) {
            var size = oneLine
            if (x > 0 && x + spacing + size.width > width) {
                y += rowHeight
                x = 0.0
                rowHeight = 0.0
            }
            if (size.width > width) {
                // Wider than a row: it wraps, in a row of its own.
                size = wrapped(index, width)
            }
            val originX = if (x > 0) x + spacing else 0.0
            frames += ScreenRect(originX, y, size.width, size.height)
            x = originX + size.width
            rowHeight = swiftMax(rowHeight, size.height)
        }
        return frames
    }
}
