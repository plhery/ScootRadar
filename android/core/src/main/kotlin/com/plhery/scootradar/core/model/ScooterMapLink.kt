package com.plhery.scootradar.core.model

import java.io.ByteArrayOutputStream
import java.net.URI
import java.nio.ByteBuffer
import java.nio.charset.CharacterCodingException
import java.nio.charset.CodingErrorAction
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

// ios/ScootRadar/Models/ScooterMapLink.swift.

/**
 * A link to the map on scootradar.com that the phone opened in the app rather than in the browser (App
 * Links, as the iPhone's universal links: public/.well-known/apple-app-site-association). It reads what
 * the web map reads from a link (src/lib/clientParams.ts): the place to open on and the battery filter.
 * The appearance and map style in a link are the website's own and are left out.
 */
data class ScooterMapLink(
    /** The place the map opens on: a city's centre on the site's own links. */
    val origin: GeoPoint? = null,
    /** A battery preset, or null to keep the rider's own. */
    val minimumBattery: Int? = null,
) {
    companion object {
        val hosts: Set<String> = setOf("scootradar.com", "www.scootradar.com")

        /**
         * What a link to the map can carry, as on the web: the map at "/" before the landing page took its
         * place is a link to the map with one of them.
         */
        val parameters: List<String> = listOf("origin", "minBattery", "theme", "map", "tile")

        /** Null for anything but a link to the map on the site. */
        operator fun invoke(url: URI): ScooterMapLink? {
            if (url.scheme?.lowercase() != "https") return null
            val host = url.host?.lowercase() ?: return null
            if (host !in hosts) return null

            val items = queryItems(url.rawQuery)
            fun value(name: String): String? = items.firstOrNull { it.first == name }?.second

            when (url.path) {
                "/map", "/map/" -> Unit
                "", "/" -> if (parameters.none { value(it) != null }) return null
                else -> return null
            }

            return ScooterMapLink(
                origin = value("origin")?.let(::coordinate),
                minimumBattery = value("minBattery")?.let(::battery),
            )
        }

        /** "47.3769,8.5417" as the web reads it: two finite numbers in range. */
        fun coordinate(text: String): GeoPoint? {
            val parts = text.split(",").map { it.trim(::isWhitespace) }
            if (parts.size != 2) return null
            val latitude = finiteNumber(parts[0]) ?: return null
            val longitude = finiteNumber(parts[1]) ?: return null
            if (latitude !in -90.0..90.0 || longitude !in -180.0..180.0) return null
            return GeoPoint(latitude = latitude, longitude = longitude)
        }

        /** Links from the slider era hold any multiple of five; they snap down to a preset. */
        fun battery(text: String): Int? {
            val value = finiteNumber(text.trim(::isWhitespace)) ?: return null
            return ScooterBatteryFilter.snapped(min(100.0, max(0.0, value)).toInt())
        }

        /** Swift's CharacterSet.whitespaces: spaces and the tab, not line breaks. */
        private fun isWhitespace(character: Char): Boolean =
            character == '\t' || character.category == CharCategory.SPACE_SEPARATOR

        private val decimal = Regex("[+-]?([0-9]+\\.?[0-9]*|\\.[0-9]+)([eE][+-]?[0-9]+)?")
        private val hexadecimal = Regex("([+-]?0[xX](?:[0-9a-fA-F]+\\.?[0-9a-fA-F]*|\\.[0-9a-fA-F]+))([pP][+-]?[0-9]+)?")

        /**
         * Double(text) when it is finite. Swift reads decimal and hexadecimal numbers ("0x10" too), with no
         * space around them; its "nan" and "inf" are never finite.
         */
        private fun finiteNumber(text: String): Double? {
            val value = if (decimal.matches(text)) {
                text.toDouble()
            } else {
                // The JVM reads a hexadecimal number only with its exponent.
                hexadecimal.matchEntire(text)?.destructured?.let { (number, exponent) -> (number + exponent.ifEmpty { "p0" }).toDouble() }
            }
            return value?.takeIf { it.isFinite() }
        }

        /**
         * URLComponents.queryItems: each item's name and value, percent-decoded, "+" kept as it is; no value
         * without "=", and none where the decoded bytes are not UTF-8.
         */
        private fun queryItems(query: String?): List<Pair<String, String?>> {
            if (query.isNullOrEmpty()) return emptyList()
            return query.split("&").map { item ->
                val equals = item.indexOf('=')
                if (equals < 0) {
                    (percentDecoded(item) ?: item) to null
                } else {
                    val name = item.substring(0, equals)
                    (percentDecoded(name) ?: name) to percentDecoded(item.substring(equals + 1))
                }
            }
        }

        private fun percentDecoded(text: String): String? {
            val bytes = ByteArrayOutputStream()
            var index = 0
            while (index < text.length) {
                if (text[index] == '%') {
                    val high = text.getOrNull(index + 1)?.digitToIntOrNull(16) ?: return null
                    val low = text.getOrNull(index + 2)?.digitToIntOrNull(16) ?: return null
                    bytes.write(high * 16 + low)
                    index += 3
                } else {
                    val end = text.indexOf('%', index).takeIf { it >= 0 } ?: text.length
                    bytes.write(text.substring(index, end).toByteArray())
                    index = end
                }
            }
            return try {
                Charsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes.toByteArray()))
                    .toString()
            } catch (_: CharacterCodingException) {
                null
            }
        }
    }
}

/**
 * The city whose centre a link names. The site writes the centre as JavaScript prints the number, so a
 * hair's difference is allowed.
 */
fun ScooterCityCatalog.city(linkedAt: GeoPoint): ScooterCity? =
    cities
        .filter {
            abs(it.center.latitude - linkedAt.latitude) < 0.000_5 &&
                abs(it.center.longitude - linkedAt.longitude) < 0.000_5
        }
        .minByOrNull { abs(it.center.latitude - linkedAt.latitude) + abs(it.center.longitude - linkedAt.longitude) }
