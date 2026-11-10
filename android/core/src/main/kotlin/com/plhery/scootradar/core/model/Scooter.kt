package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterProvider
import java.math.BigDecimal
import java.math.RoundingMode
import java.net.URI
import java.util.Locale

// Scooter, its battery level and its links, from ios/ScootRadar/Models/ScooterModels.swift.

data class Scooter(
    val provider: String,
    val latitude: Double,
    val longitude: Double,
    val battery: Int? = null,
    val rangeMeters: Int? = null,
    val vehicleID: String? = null,
    val deepLink: String? = null,
    val rentalURIs: ScooterRentalURIs? = null,
    val distanceMeters: Double? = null,
    val pricing: ScooterRidePricing? = null,
) {
    val id: String
        get() = if (vehicleID != null) "$provider:$vehicleID" else "$provider:${latitude.swiftDescription}:${longitude.swiftDescription}"

    val coordinate: GeoPoint get() = GeoPoint(latitude, longitude)

    val providerInfo: ScooterProvider? get() = ScooterProvider.fromRawValue(provider)

    /** The provider's name as its card writes it: the catalog's, or the feed's word for it capitalized. */
    val providerName: String get() = providerInfo?.displayName ?: provider.capitalized

    val batteryLevel: ScooterBatteryLevel? get() = battery?.let(ScooterBatteryLevel::of)

    /** In metres, along the ellipsoid as CLLocation measures it. */
    fun distance(from: GeoPoint): Double = from.distance(to = coordinate)

    fun formattedDistance(from: GeoPoint): String = formattedLength(distance(from))

    val formattedRange: String? get() = rangeMeters?.let { formattedLength(it.toDouble()) }

    val rentalURL: URI? get() = rentalURLs.firstOrNull()

    /** The safe links to the scooter, in the order they are tried. */
    val rentalURLs: List<URI>
        get() = ScooterRentalLinkPolicy.rentalURLs(provider = provider, rentalURIs = rentalURIs, legacyLink = deepLink)

    /**
     * The operator's app, where the feed links no scooter: Lime's, Bird's, PubliBike's and Spin's never do, nor Voi's,
     * Dott's and Bolt's rider maps.
     */
    val operatorApp: ScooterProvider.OperatorApp? get() = if (rentalURLs.isEmpty()) providerInfo?.app else null

    /**
     * "Open in": the scooter in its provider's app, each link with [openRentalLink]. A link in the app's own scheme
     * opens nothing when the app is not installed, so the next link, the provider's web page, is tried then. Where no
     * link opens, as Bolt's feed gives only bolt:// ones, and where the feed links no scooter, the operator's app
     * opens on its link with [openLink], which with `appOnly` opens only an installed app
     * (FLAG_ACTIVITY_REQUIRE_NON_BROWSER); without the app, its page on Google Play opens, in the Play Store
     * (market://) or else on the web, as the iPhone opens the App Store's ([storePages]). Nothing asks Android which
     * apps are installed. Returns what opened: null for nothing, as for an operator the catalog gives no app.
     */
    suspend fun openRental(
        openRentalLink: suspend (URI) -> Boolean,
        openLink: suspend (url: URI, appOnly: Boolean) -> Boolean,
    ): ScooterRentalOpening? {
        for (url in rentalURLs) {
            if (openRentalLink(url)) return ScooterRentalOpening.Link(url)
        }
        val app = providerInfo?.app ?: return null
        val link = URI(app.link)
        if (openLink(link, true)) return ScooterRentalOpening.App(link)
        return app.storePages.firstOrNull { openLink(it, false) }?.let(ScooterRentalOpening::Store)
    }

    companion object {
        /**
         * "320 m" below a kilometre; "1.4 km" and "24 km" from there, as on the web. The system's rounding
         * for roads would say "300 m" for the same scooter. Where the region measures in miles, as in the US
         * and the UK, or miles are chosen in Settings (ScooterUnits), the system writes it as it does on its own
         * roads: "1,000 ft" or "350 yd" under half a mile, "1.9 mi" from there. src/lib/walking.ts rounds the
         * same way.
         */
        fun formattedLength(meters: Double, locale: Locale = ScooterLanguage.current.locale): String {
            val system = locale.measurementSystem
            val formatted = if (system == ScooterMeasurementSystem.Metric) {
                if (meters < 1_000) {
                    ScooterMeasureFormat.length(BigDecimal(meters.roundedAwayFromZero()), ScooterLengthUnit.Meters, locale)
                } else {
                    // Halves go up, as the web rounds them: 1 250 m is "1.3 km".
                    val kilometers = BigDecimal.valueOf(meters / 1_000).setScale(1, RoundingMode.HALF_UP)
                    ScooterMeasureFormat.length(kilometers.withoutTrailingZeros(), ScooterLengthUnit.Kilometers, locale)
                }
            } else {
                roadLength(meters, system, locale)
            }
            // A line never breaks between the number and its unit.
            return formatted.replace(' ', '\u00A0')
        }

        /**
         * Measurement's .road usage where the region measures in miles: feet or yards under half a mile, to 1
         * below 10, to 10 below 100 and to 50 from there; miles with two decimals below 1, one below 10 and
         * none from there. Halves go to the even neighbour, as Foundation rounds them: 125 ft is "100 ft".
         */
        private fun roadLength(meters: Double, system: ScooterMeasurementSystem, locale: Locale): String {
            val miles = meters / 1_609.344
            if (miles >= 0.5) {
                val digits = if (miles < 1) 2 else if (miles < 10) 1 else 0
                val value = BigDecimal.valueOf(miles).setScale(digits, RoundingMode.HALF_EVEN)
                return ScooterMeasureFormat.length(value.withoutTrailingZeros(), ScooterLengthUnit.Miles, locale)
            }
            val unit = if (system == ScooterMeasurementSystem.Us) ScooterLengthUnit.Feet else ScooterLengthUnit.Yards
            val short = meters / (if (unit == ScooterLengthUnit.Feet) 0.304_8 else 0.914_4)
            val step = BigDecimal.valueOf(if (short < 10) 1L else if (short < 100) 10L else 50L)
            val value = BigDecimal.valueOf(short).divide(step).setScale(0, RoundingMode.HALF_EVEN).multiply(step)
            return ScooterMeasureFormat.length(value, unit, locale)
        }

        /**
         * The same length with its number and its unit apart, for a figure whose unit is set smaller than its number,
         * each as the locale writes it. They are apart at the last space between them: a no-break one where the
         * locale wrote a plain one, the narrow one French writes ("24 m", U+202F, in ICU as in Foundation), or a thin
         * one. A space before it is inside the number, grouping its digits, as French and Norwegian do ("1 234 km").
         * The iPhone splits at the last U+00A0 or U+202F (ScooterModels.swift:153-162), the only spaces its lengths
         * have there; the thin and plain ones, and a unit written first, are this one's own guards.
         */
        fun lengthParts(meters: Double, locale: Locale = ScooterLanguage.current.locale): Pair<String, String?> {
            val length = formattedLength(meters, locale)
            val space = length.indexOfLast { it in UNIT_SPACES }
            if (space <= 0 || space == length.lastIndex) return length to null
            val unit = length.substring(space + 1)
            // A locale that wrote its unit first keeps the length whole.
            if (unit.any(Char::isDigit)) return length to null
            return length.substring(0, space) to unit
        }

        /**
         * Whole kilometres or miles, "61 km" or "38 mi": the closest cities and the range filter's steps, which never
         * come in metres, feet or yards.
         */
        fun formattedWhole(value: Int, unit: ScooterLengthUnit, locale: Locale = ScooterLanguage.current.locale): String =
            // A line never breaks between the number and its unit.
            ScooterMeasureFormat.length(BigDecimal(value), unit, locale).replace(' ', '\u00A0')

        /** The spaces a locale writes between a number and its unit: no-break, narrow no-break, thin and plain. */
        private const val UNIT_SPACES = "\u00A0\u202F\u2009 "
    }
}

/** What "Open in" opened. */
sealed interface ScooterRentalOpening {
    val url: URI

    /** One of the scooter's links: in its operator's app, or a web link in the browser where no app takes it. */
    data class Link(override val url: URI) : ScooterRentalOpening

    /** The operator's app, on the link it claims. */
    data class App(override val url: URI) : ScooterRentalOpening

    /**
     * The app's page on Google Play, the app not being installed, as the App Store page opens on the iPhone; or, for
     * an operator whose package the catalog does not give, its link in the browser, whose page sends the phone to the
     * store.
     */
    data class Store(override val url: URI) : ScooterRentalOpening
}

/**
 * Where "Open in" sends a phone without the operator's app, in turn: its page in the Play Store, or another store that
 * takes market:// links, then on Google Play's website, which the Play Store takes where it is installed and the
 * browser otherwise (Android's "Linking to Google Play"); the operator's link alone where the catalog gives no package
 * (data/providers.json, googlePlayId).
 */
internal val ScooterProvider.OperatorApp.storePages: List<URI>
    get() = googlePlayId?.let { id ->
        listOf(URI("market://details?id=$id"), URI("https://play.google.com/store/apps/details?id=$id"))
    } ?: listOf(URI(link))

enum class ScooterBatteryLevel {
    Good,
    Low,
    Critical,
    ;

    companion object {
        /** Good from 50%, low from 20% to 49%, critical under 20%, as on the web. */
        fun of(percent: Int): ScooterBatteryLevel = when {
            percent >= 50 -> Good
            percent >= 20 -> Low
            else -> Critical
        }
    }
}

data class ScooterRentalURIs(
    val ios: String? = null,
    val android: String? = null,
    val web: String? = null,
)

/**
 * Double.description, as Swift writes a number into a string: "47.1", "8.0", "-0.0005", and "1e-05" below
 * a ten-thousandth.
 */
internal val Double.swiftDescription: String
    get() {
        if (isNaN()) return "nan"
        if (isInfinite()) return if (this > 0) "inf" else "-inf"
        if (this == 0.0) return if (1 / this < 0) "-0.0" else "0.0"
        val decimal = BigDecimal.valueOf(this)
        val magnitude = kotlin.math.abs(this)
        if (magnitude >= 1e-4 && magnitude < 1e16) {
            val plain = decimal.withoutTrailingZeros().toPlainString()
            return if ('.' in plain) plain else "$plain.0"
        }
        val digits = decimal.unscaledValue().abs().toString().trimEnd('0').ifEmpty { "0" }
        val exponent = decimal.precision() - decimal.scale() - 1
        val mantissa = if (digits.length == 1) digits else digits[0] + "." + digits.substring(1)
        val sign = if (this < 0) "-" else ""
        val exponentSign = if (exponent < 0) "-" else "+"
        return sign + mantissa + "e" + exponentSign + kotlin.math.abs(exponent).toString().padStart(2, '0')
    }
