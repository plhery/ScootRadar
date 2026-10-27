package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterTimeZones
import java.io.File
import kotlin.math.abs
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** TimeZones.kt holds the table of the iPhone app's TimeZones.generated.swift, written by hand from tzdata. */
class TimeZonesParityTest {
    private val swift: List<String> =
        File(System.getProperty("scootradar.repo"), "ios/ScootRadar/Models/TimeZones.generated.swift").readLines()

    private fun number(value: Double) =
        if (value == Math.rint(value) && abs(value) < 1e15) value.toLong().toString() else value.toString()

    @Test
    fun theTableIsTheSwiftOne() {
        assertTrue("    static let version = \"${ScooterTimeZones.version}\"" in swift)
        assertEquals(
            swift.filter { it.contains(": ScooterTimeZonePlace(countryCode: ") },
            ScooterTimeZones.places.map { (name, place) ->
                "        \"$name\": ScooterTimeZonePlace(countryCode: \"${place.countryCode}\", point: GeoPoint(" +
                    "latitude: ${number(place.point.latitude)}, longitude: ${number(place.point.longitude)})),"
            },
        )
        val aliases = swift.subList(swift.indexOf("    static let aliases: [String: String] = [") + 1, swift.lastIndexOf("    ]"))
        assertEquals(aliases, ScooterTimeZones.aliases.map { (alias, zone) -> "        \"$alias\": \"$zone\"," })
        assertTrue(ScooterTimeZones.places.size > 400)
    }
}
