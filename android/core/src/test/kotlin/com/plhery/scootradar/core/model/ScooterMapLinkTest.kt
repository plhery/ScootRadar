package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.map.TestCatalog
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
        assertEquals(listOf(0, 30, 30, null, null, 0, 30, 60), listOf("0x10", "47.", " 45", "5d", "1e400", "4.9e-400", "45.9", "\u00A060\t").map(ScooterMapLink::battery))
        assertEquals(GeoPoint(latitude = 47.3, longitude = 8.5), ScooterMapLink.coordinate("47.3,\t8.5"))
        assertNull(ScooterMapLink.coordinate("47.3,8.5\n"))
        assertEquals(GeoPoint(latitude = 0.5, longitude = -0.5), ScooterMapLink.coordinate(".5,-.5"))
        assertEquals(GeoPoint(latitude = 47.0, longitude = -8.0), ScooterMapLink.coordinate("+47,-8."))
        assertNull(ScooterMapLink.coordinate("inf,8"))
        assertEquals(GeoPoint(latitude = 0.0, longitude = 16.0), ScooterMapLink.coordinate("1e-400,0x10"))
    }

    @Test
    fun findsTheCityWhoseCentreALinkNames() {
        // Among the tests' own cities (TestCatalog): data/ moves the catalog's centres and adds cities (LOG-370).
        val cities = TestCatalog.catalog.cities
        val zurich = TestCatalog.zurich
        val near = GeoPoint(latitude = zurich.center.latitude + 0.0001, longitude = zurich.center.longitude - 0.0001)
        assertEquals("ch:zurich", ScooterCityCatalog.city(linkedAt = near, among = cities)?.id)
        assertNull(
            ScooterCityCatalog.city(
                linkedAt = GeoPoint(latitude = zurich.center.latitude + 0.01, longitude = zurich.center.longitude),
                among = cities,
            ),
        )
        // The app's reads the generated catalog's.
        val city = ScooterCityCatalog.cities.first()
        assertEquals(city.center, ScooterCityCatalog.city(linkedAt = city.center)?.center)
    }

    /**
     * LOG-267: of two cities whose centres are both within a link's reach, the nearer by the summed differences, as
     * Swift's min(by:) picks (ScooterMapLink.swift:72-83), whichever comes first; on a tie the first in the catalog,
     * as min(by:) keeps the first of equals. The offsets are powers of two, so the tie is exact.
     */
    @Test
    fun ofTwoCitiesWithinALinksReachTheNearerAndOnATieTheFirst() {
        fun town(id: String, longitude: Double) =
            ScooterCity(id, id, "CH", GeoPoint(latitude = 47.0, longitude = longitude), GeoBounds(46.9, 7.9, 47.1, 8.1))
        val step = 1.0 / 8192 // About 0.000122°, a quarter of the reach.
        val west = town("ch:west", 8.0)
        val east = town("ch:east", 8.0 + 2 * step)
        fun city(longitude: Double, among: List<ScooterCity>) =
            ScooterCityCatalog.city(linkedAt = GeoPoint(latitude = 47.0, longitude = longitude), among = among)?.id

        for (among in listOf(listOf(west, east), listOf(east, west))) {
            assertEquals("ch:west", city(8.0 - step / 2, among))
            assertEquals("ch:west", city(8.0 + step / 2, among))
            assertEquals("ch:east", city(8.0 + 3 * step / 2, among))
            assertEquals("ch:east", city(8.0 + 3 * step, among))
        }
        // Halfway, both are as near.
        assertEquals("ch:west", city(8.0 + step, listOf(west, east)))
        assertEquals("ch:east", city(8.0 + step, listOf(east, west)))
    }

    @Test
    fun aLinkIsRepairedAsFoundationRepairsIt() {
        // What URL(string:) makes of each on the iPhone, checked with Foundation on a Mac.
        assertEquals(
            "https://scootradar.com/map?a=%25zz&origin=47%20,8",
            ScooterMapLink.url("https://scootradar.com/map?a=%zz&origin=47 ,8").toString(),
        )
        assertEquals(GeoPoint(latitude = 47.0, longitude = 8.0), ScooterMapLink("https://scootradar.com/map?a=%zz&origin=47 ,8")?.origin)
        assertEquals(
            "https://scootradar.com/map?a=%5B1%5D%7C%7Bx%7D%5E%60%22%3C%3E%5Cb",
            ScooterMapLink.url("https://scootradar.com/map?a=[1]|{x}^`\"<>\\b").toString(),
        )
        assertEquals(
            "https://scootradar.com/map?origin=47.1,8#frag%232",
            ScooterMapLink.url("https://scootradar.com/map?origin=47.1,8#frag#2").toString(),
        )
        assertEquals(
            "https://scootradar.com/m%C3%A4p?origin=Z%C3%BCrich%20%C3%A9",
            ScooterMapLink.url("https://scootradar.com/m\u00E4p?origin=Z\u00FCrich \u00E9").toString(),
        )
        assertEquals("https://scootradar.com/map?a=%254", ScooterMapLink.url("https://scootradar.com/map?a=%4").toString())
        assertEquals("https://scootradar.com/map?x=%e2%82%ac", ScooterMapLink.url("https://scootradar.com/map?x=%e2%82%ac").toString())
        assertNull(ScooterMapLink.url("https://scoot radar.com/map"))
        assertNull(ScooterMapLink("https://scoot radar.com/map?origin=47,8"))
    }
}
