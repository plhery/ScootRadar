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
     * Opens the scooter in its provider's app. A link in the app's own scheme opens nothing when the app is
     * not installed, so the next link, the provider's web page, is tried then. Returns the link that opened.
     */
    suspend fun openRental(open: suspend (URI) -> Boolean): URI? {
        for (url in rentalURLs) {
            if (open(url)) return url
        }
        return null
    }

    /**
     * The operator's app, where the feed links no scooter: Lime's, Bird's, PubliBike's and Spin's never do, nor Voi's,
     * Dott's and Bolt's rider maps.
     */
    val operatorApp: ScooterProvider.OperatorApp? get() = if (rentalURLs.isEmpty()) providerInfo?.app else null

    /**
     * Opens the operator's app on its link, which with `appOnly` opens only an installed app
     * (FLAG_ACTIVITY_REQUIRE_NON_BROWSER); without the app, the same link opens in the browser, whose page
     * sends a phone to its store, as no operator's package is known yet. Nothing asks Android which apps
     * are installed. Returns the link that opened.
     */
    suspend fun openOperatorApp(open: suspend (url: URI, appOnly: Boolean) -> Boolean): URI? {
        val app = operatorApp ?: return null
        val link = URI(app.link)
        if (open(link, true)) return link
        return if (open(link, false)) link else null
    }

    companion object {
        /**
         * "320 m" below a kilometre; "1.4 km" and "24 km" from there, as on the web. The system's rounding
         * for roads would say "300 m" for the same scooter. Where the region measures in miles, as in the US
         * and the UK, the system writes it as it does on its own roads: "1,000 ft" or "350 yd" under half a
         * mile, "1.9 mi" from there. src/lib/walking.ts rounds the same way.
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

        /** The same length with its number and its unit apart, for a figure whose unit is set smaller than its number. */
        fun lengthParts(meters: Double, locale: Locale = ScooterLanguage.current.locale): Pair<String, String?> {
            val length = formattedLength(meters, locale)
            val space = length.indexOf('\u00A0')
            if (space <= 0 || space == length.lastIndex) return length to null
            return length.substring(0, space) to length.substring(space + 1)
        }
    }
}

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
