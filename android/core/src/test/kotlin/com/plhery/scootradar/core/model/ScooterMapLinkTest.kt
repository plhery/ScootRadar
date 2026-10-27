package com.plhery.scootradar.core.model

import java.net.URI
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

// ios/ScootRadarTests/ScooterMapLinkTests.swift.
class ScooterMapLinkTest {
    private fun link(address: String): ScooterMapLink? = ScooterMapLink(URI(address))

    private fun <T : Any> unwrap(value: T?): T {
        assertNotNull(value)
        return value!!
    }

    @Test
    fun readsTheMapLinksOfTheSite() {
        val link = unwrap(link("https://scootradar.com/map?origin=47.3769,8.5417&minBattery=45&theme=dark"))
        assertEquals(GeoPoint(latitude = 47.3769, longitude = 8.5417), link.origin)
        assertEquals("A slider-era value snaps down to a preset", 30, link.minimumBattery)

        assertEquals(ScooterMapLink(), link("https://scootradar.com/map"))
        assertEquals(
            GeoPoint(latitude = 46.2, longitude = 6.15),
            link("https://www.scootradar.com/map/?origin=%2046.2%2C%206.15")?.origin,
        )
        // The map was at "/" before the landing page: such a link carries what only the map reads.
        assertEquals(GeoPoint(latitude = 46.9481, longitude = 7.4474), link("https://scootradar.com/?origin=46.9481,7.4474")?.origin)
        assertEquals(ScooterMapLink(), link("https://scootradar.com/?tile=dark"))
    }

    @Test
    fun leavesOtherPagesAndHostsAlone() {
        for (address in listOf(
            "https://scootradar.com/",
            "https://scootradar.com/de",
            "https://scootradar.com/guides/zurich?origin=47.3769,8.5417",
            "https://scootradar.com/privacy",
            "https://scooters.plhery.com/map?origin=47.3769,8.5417",
            "http://scootradar.com/map",
            "scootradar://map",
        )) {
            assertNull(address, link(address))
        }
    }

    @Test
    fun ignoresWhatTheWebIgnores() {
        for (origin in listOf("", "47.3", "47.3,", ",8.5", "91,8.5", "47.3,181", "abc,8.5", "47.3,8.5,1", "nan,8.5")) {
            assertNull(origin, ScooterMapLink.coordinate(origin))
        }
        assertNull(ScooterMapLink.battery(""))
        assertNull(ScooterMapLink.battery("lots"))
        assertEquals(80, ScooterMapLink.battery("150"))
        assertEquals(0, ScooterMapLink.battery("-5"))
    }

    // Not an iPhone test: what ScooterMapLink.swift gives for these, compiled on a Mac, where Foundation's
    // URLComponents and Double(_:) read them otherwise than the JVM would.
    @Test
    fun readsWhatFoundationReads() {
        // The first of a name counts, with no value without "=", none for bytes that are not UTF-8, and "+" kept.
        assertEquals(ScooterMapLink(), link("https://scootradar.com/map?origin&origin=3,4"))
        assertEquals(ScooterMapLink(minimumBattery = 30), link("https://scootradar.com/map?minBattery=4e+1"))
        assertNull(link("https://scootradar.com/?origin=%FF"))
        assertEquals(ScooterMapLink(minimumBattery = 30), link("https://scootradar.com/map?origin=%FF&minBattery=4%35"))
        assertEquals(GeoPoint(latitude = 1.0, longitude = 2.0), link("https://scootradar.com/map?ori%67in=1,2")?.origin)
        assertEquals(ScooterMapLink(), link("https://scootradar.com/?origin="))
        assertNull(link("https://scootradar.com/?"))
        // Scheme and host in any case; the path decoded.
        for (address in listOf("https://SCOOTRADAR.com/map", "HTTPS://scootradar.com/map", "https://scootradar.com/%6Dap")) {
            assertEquals(address, ScooterMapLink(), link(address))
        }
        // Numbers as Swift reads them: hexadecimal too, no suffix, spaces and tabs trimmed but not line breaks.
        assertEquals(GeoPoint(latitude = 47.0, longitude = 8.0), link("https://scootradar.com/map?origin=0x2F,0x1p3")?.origin)
        assertEquals(listOf(0, 30, 30, null, null, 0, 30, 60), listOf("0x10", "47.", " 45", "5d", "1e400", "4.9e-400", "45.9", " 60\t").map(ScooterMapLink::battery))
        assertEquals(GeoPoint(latitude = 47.3, longitude = 8.5), ScooterMapLink.coordinate("47.3,\t8.5"))
        assertNull(ScooterMapLink.coordinate("47.3,8.5\n"))
        assertEquals(GeoPoint(latitude = 0.5, longitude = -0.5), ScooterMapLink.coordinate(".5,-.5"))
        assertEquals(GeoPoint(latitude = 47.0, longitude = -8.0), ScooterMapLink.coordinate("+47,-8."))
        assertNull(ScooterMapLink.coordinate("inf,8"))
        assertEquals(GeoPoint(latitude = 0.0, longitude = 16.0), ScooterMapLink.coordinate("1e-400,0x10"))
    }

    @Test
    fun findsTheCityWhoseCentreALinkNames() {
        val zurich = unwrap(ScooterCityCatalog.cities.firstOrNull { it.id == "ch:zurich" })
        val near = GeoPoint(latitude = zurich.center.latitude + 0.0001, longitude = zurich.center.longitude - 0.0001)
        assertEquals("ch:zurich", ScooterCityCatalog.city(linkedAt = near)?.id)
        assertNull(
            ScooterCityCatalog.city(
                linkedAt = GeoPoint(latitude = zurich.center.latitude + 0.01, longitude = zurich.center.longitude),
            ),
        )
    }
}
