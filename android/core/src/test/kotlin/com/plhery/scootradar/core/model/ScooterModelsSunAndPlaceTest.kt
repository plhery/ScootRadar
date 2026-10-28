package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterTimeZones
import java.time.Instant
import java.time.OffsetDateTime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

// ios/ScootRadarTests/ScooterModelsTests.swift: the Automatic appearance, and where the map opens when it
// may not use the phone's location. The rest of that file's tests are in ScooterModelsTest.kt.
class ScooterModelsSunAndPlaceTest {
    private fun date(text: String): Instant = OffsetDateTime.parse(text).toInstant()

    @Test
    fun automaticIsDarkFromHalfAnHourAfterSunsetToHalfAnHourBeforeSunrise() {
        fun isDark(time: String, place: GeoPoint): Boolean = ScooterDaylight.isDark(date(time), place)

        // In Zurich the sun sets at 18:23 on 24 October 2026 and rises at
        // 06:58 the next morning, once the clocks have gone back.
        val zurich = GeoPoint(latitude = 47.3769, longitude = 8.5417)
        assertFalse(isDark("2026-10-24T12:00:00+02:00", zurich))
        assertFalse(isDark("2026-10-24T18:45:00+02:00", zurich))
        assertTrue(isDark("2026-10-24T19:00:00+02:00", zurich))
        assertTrue(isDark("2026-10-25T03:00:00+01:00", zurich))
        assertTrue(isDark("2026-10-25T06:15:00+01:00", zurich))
        assertFalse(isDark("2026-10-25T06:40:00+01:00", zurich))

        // In Trondheim at midsummer it sets at 23:37 and rises at 03:02: dark for two and a half hours.
        val trondheim = GeoPoint(latitude = 63.4305, longitude = 10.3951)
        assertFalse(isDark("2026-06-20T23:55:00+02:00", trondheim))
        assertTrue(isDark("2026-06-21T01:00:00+02:00", trondheim))
        assertFalse(isDark("2026-06-21T02:45:00+02:00", trondheim))

        // In Tromsø it never sets at midsummer and never rises at midwinter.
        val tromso = GeoPoint(latitude = 69.6492, longitude = 18.9553)
        assertFalse(isDark("2026-06-21T00:30:00+02:00", tromso))
        assertTrue(isDark("2026-12-21T12:00:00+01:00", tromso))
        // Days before, an hour and three quarters of sun, from 10:39 to 12:23, and light half an hour either side.
        assertTrue(isDark("2026-11-25T10:00:00+01:00", tromso))
        assertFalse(isDark("2026-11-25T10:15:00+01:00", tromso))
        assertFalse(isDark("2026-11-25T12:45:00+01:00", tromso))
        assertTrue(isDark("2026-11-25T13:00:00+01:00", tromso))
    }

    @Test
    fun onlyAutomaticGoesByTheSun() {
        val zurich = GeoPoint(latitude = 47.3769, longitude = 8.5417)
        val night = date("2026-10-24T23:00:00+02:00")
        val noon = date("2026-10-24T12:00:00+02:00")
        assertEquals(UserInterfaceStyle.Dark, ScooterAppearance.Sun.interfaceStyle(night, zurich))
        assertEquals(UserInterfaceStyle.Light, ScooterAppearance.Sun.interfaceStyle(noon, zurich))
        for (date in listOf(night, noon)) {
            assertEquals(UserInterfaceStyle.Unspecified, ScooterAppearance.System.interfaceStyle(date, zurich))
            assertEquals(UserInterfaceStyle.Light, ScooterAppearance.Light.interfaceStyle(date, zurich))
            assertEquals(UserInterfaceStyle.Dark, ScooterAppearance.Dark.interfaceStyle(date, zurich))
        }
    }

    // Where the map opens when it may not use the phone's location.

    private fun city(id: String, countryCode: String, latitude: Double, longitude: Double): ScooterCity =
        ScooterCity(
            id = id,
            name = id,
            countryCode = countryCode,
            center = GeoPoint(latitude = latitude, longitude = longitude),
            bounds = GeoBounds(south = latitude - 0.1, west = longitude - 0.1, north = latitude + 0.1, east = longitude + 0.1),
        )

    // North America, Oceania and the Middle East as country agents may add them, beside a few cities of Europe.
    // The tests build their own catalog: one a data/ change cannot break.
    private val startCities: List<ScooterCity>
        get() = listOf(
            city("ch:zurich", "CH", 47.3769, 8.5417),
            city("ch:st-gallen", "CH", 47.4245, 9.3767),
            city("de:Berlin", "DE", 52.52, 13.405),
            city("fr:Nice", "FR", 43.7031, 7.2661),
            city("fr:Houilles", "FR", 48.9261, 2.1892),
            city("ua:Kyiv", "UA", 50.4501, 30.5234),
            city("ca:on:toronto", "CA", 43.6532, -79.3832),
            city("ca:qc:montreal", "CA", 45.5019, -73.5674),
            city("us:tx:austin", "US", 30.2672, -97.7431),
            city("us:or:portland", "US", 45.5152, -122.6784),
            city("mx:cdmx", "MX", 19.4326, -99.1332),
            city("nz:Auckland", "NZ", -36.8485, 174.7633),
            city("au:Sydney", "AU", -33.8688, 151.2093),
            city("au:Melbourne", "AU", -37.8136, 144.9631),
            city("il:Tel Aviv", "IL", 32.0853, 34.7818),
        )

    private fun startID(timeZone: String): String? = ScooterStartPlace.city(timeZone, startCities)?.id

    @Test
    fun mapOpensOnTheCoveredCityNearestTheTimeZone() {
        assertEquals("de:Berlin", startID("Europe/Berlin"))
        assertEquals("ch:zurich", startID("Europe/Zurich"))
        // Without Paris among the cities: the nearest town that has scooters.
        assertEquals("fr:Houilles", startID("Europe/Paris"))
        // An older name the phone may still report.
        assertEquals("ua:Kyiv", startID("Europe/Kiev"))

        assertEquals("ca:on:toronto", startID("America/Toronto"))
        assertEquals("mx:cdmx", startID("America/Mexico_City"))
        assertEquals("us:tx:austin", startID("America/Chicago"))
        assertEquals("us:or:portland", startID("America/Los_Angeles"))
        assertEquals("ca:qc:montreal", startID("America/Halifax"))
        assertEquals("ca:on:toronto", startID("America/Montreal"))
        assertEquals("us:tx:austin", startID("US/Central"))

        assertEquals("nz:Auckland", startID("Pacific/Auckland"))
        assertEquals("il:Tel Aviv", startID("Asia/Tel_Aviv"))
        assertEquals("au:Sydney", startID("Australia/Sydney"))
        // Perth has no city of its own: the nearest of Australia's.
        assertEquals("au:Melbourne", startID("Australia/Perth"))
        assertEquals("AE", ScooterStartPlace.country("Asia/Dubai"))
    }

    @Test
    fun mapCrossesABorderOnlyToACityWithin150Kilometres() {
        assertEquals("fr:Nice", startID("Europe/Monaco"))
        assertEquals("ch:st-gallen", startID("Europe/Vaduz"))
        assertNull(startID("Europe/Vienna"))
    }

    @Test
    fun mapKeepsSwitzerlandForZonesWithNothingNear() {
        // Zones that are no place, and Antarctica's Troll station, far from any covered city.
        for (zone in listOf("UTC", "GMT", "Etc/UTC", "Factory", "Etc/GMT+5", "Antarctica/Troll", "")) {
            assertNull(zone, ScooterStartPlace.city(zone, startCities))
            val start = ScooterStartPlace.start(zone, startCities)
            assertEquals(zone, ScooterMapStart.switzerland.zoom, start.zoom)
            assertEquals(zone, ScooterMapStart.switzerlandCenter, start.center)
        }
        // North America before any of its cities is covered.
        assertNull(
            ScooterStartPlace.city(
                "America/New_York",
                startCities.filter { it.countryCode !in listOf("CA", "US", "MX") },
            ),
        )
    }

    // Not an iPhone test: the spans MKCoordinateRegion(center:latitudinalMeters:longitudinalMeters:) gave for
    // these on a Mac, to a millionth.
    @Test
    fun theStartRegionsSpanWhatMapKitMakesOfTheirMetres() {
        val switzerland = ScooterMapStart.switzerland.region
        assertEquals(2.698636262619094, switzerland.latitudeDelta, 2.698636262619094 * 1e-6)
        assertEquals(6.551915073958902, switzerland.longitudeDelta, 6.551915073958902 * 1e-6)

        val zurich = ScooterStartPlace.start("Europe/Zurich", startCities).region
        assertEquals(GeoPoint(latitude = 47.3769, longitude = 8.5417), zurich.center)
        assertEquals(0.08010206662222637, zurich.latitudeDelta, 0.08010206662222637 * 1e-6)
        assertEquals(0.11978292057806572, zurich.longitudeDelta, 0.11978292057806572 * 1e-6)
        assertEquals(ScooterStartPlace.cityZoom, ScooterStartPlace.start("Europe/Zurich", startCities).zoom)
    }

    @Test
    fun timeZoneTableComesFromANamedReleaseAndItsOlderNamesPointAtListedZones() {
        assertTrue(Regex("^\\d{4}[a-z]$").containsMatchIn(ScooterTimeZones.version))
        assertEquals("NO", ScooterTimeZones.places["Europe/Oslo"]?.countryCode)
        assertEquals("CA", ScooterTimeZones.places["America/Toronto"]?.countryCode)
        assertEquals("NZ", ScooterTimeZones.places["Pacific/Auckland"]?.countryCode)
        assertEquals("JP", ScooterTimeZones.places["Asia/Tokyo"]?.countryCode)
        assertEquals("Asia/Jerusalem", ScooterTimeZones.aliases["Asia/Tel_Aviv"])
        assertNull(ScooterTimeZones.places["Etc/UTC"])
        for ((alias, zone) in ScooterTimeZones.aliases) {
            assertNotNull(alias, ScooterTimeZones.places[zone])
        }
    }
}
