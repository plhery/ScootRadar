package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.api.ScooterAPIJson
import java.net.URI
import java.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

// ios/ScootRadarTests/ScooterZonesTests.swift: ScooterZonesTests and CityRuleZoneTests. Its
// ScooterZoneOverlayTests draw with MapKit and its ScooterZonesModelTests build a ScooterMapModel: they
// come with the map's overlay and with the map model.

private fun <T : Any> unwrap(value: T?): T {
    assertNotNull(value)
    return value!!
}

class ScooterZonesTest {
    @Test
    fun theAreaIsTheMapsRoundedOutToAFiftiethOfADegree() {
        val area = unwrap(ScooterZoneArea(covering = GeoBounds(south = 47.3694, west = 8.5342, north = 47.3844, east = 8.5492)))
        assertEquals(ScooterZoneArea(covering = GeoBounds(south = 47.361, west = 8.521, north = 47.399, east = 8.559)), area)
        assertEquals(
            listOf("south=47.36", "west=8.52", "north=47.4", "east=8.56", "zoom=14"),
            area.queryItems.map { (name, value) -> "$name=$value" },
        )
        assertTrue(area.contains(unwrap(ScooterZoneArea(covering = GeoBounds(south = 47.37, west = 8.53, north = 47.38, east = 8.55)))))
        assertFalse(area.contains(unwrap(ScooterZoneArea(covering = GeoBounds(south = 47.37, west = 8.53, north = 47.41, east = 8.55)))))
    }

    @Test
    fun degreesAreWrittenAsTheWebWritesThem() {
        assertEquals("47.36", ScooterZoneArea.degrees(2368))
        assertEquals("47.4", ScooterZoneArea.degrees(2370))
        assertEquals("47", ScooterZoneArea.degrees(2350))
        assertEquals("0.02", ScooterZoneArea.degrees(1))
        assertEquals("0", ScooterZoneArea.degrees(0))
        assertEquals("-0.02", ScooterZoneArea.degrees(-1))
        assertEquals("-0.1", ScooterZoneArea.degrees(-5))
        assertEquals("-123.4", ScooterZoneArea.degrees(-6170))
    }

    @Test
    fun noAreaIsAskedForAcrossTheDateLineOrWiderThanTheServerAnswers() {
        assertNull(ScooterZoneArea(covering = GeoBounds(south = -17.9, west = 179.9, north = -17.8, east = -179.9)))
        assertNull(ScooterZoneArea(covering = GeoBounds(south = 47.0, west = 8.0, north = 48.5, east = 8.5)))
    }

    // The request itself goes through ScooterAPI, which is not here yet: this reads the answer and checks the
    // query the area asks with.
    @Test
    fun zonesAreAskedForAndReadWithoutKindsOrRingsThisVersionCannotDraw() {
        val body = """
            {"zones":[
              {"id":"lime:0","provider":"lime","kind":"noRide","polygons":[[[[47.37,8.54],[47.38,8.54],[47.38,8.55],[47.37,8.54]],[[47.371,8.541],[47.372,8.541],[47.372,8.542],[47.371,8.541]]]]},
              {"id":"bird:3","provider":"bird","kind":"slow","maxSpeedKph":15,"polygons":[[[[47.37,8.54],[47.38,8.54],[47.38,8.55],[47.37,8.54]]]]},
              {"id":"voi:1","provider":"voi","kind":"parkingRequired","polygons":[[[[47.37,8.54],[47.38,8.54],[47.38,8.55],[47.37,8.54]]]]},
              {"id":"dott:2","provider":"dott","kind":"noParking","polygons":[[[[47.37,8.54],[47.38,8.54],[47.37,8.54]]]]}
            ],"meta":{"generatedAt":"2026-10-24T10:00:00.000Z","pending":true,"truncated":false}}
        """.trimIndent()
        val area = unwrap(ScooterZoneArea(covering = GeoBounds(south = 47.361, west = 8.521, north = 47.399, east = 8.559)))

        val response = ScooterAPIJson.decodeFromString(ScooterZoneResponse.serializer(), body)

        assertEquals(
            "south=47.36&west=8.52&north=47.4&east=8.56&zoom=14",
            area.queryItems.joinToString("&") { (name, value) -> "$name=$value" },
        )
        assertTrue(response.pending)
        assertFalse(response.truncated)
        assertEquals(listOf("lime:0", "bird:3"), response.zones.map { it.id })
        assertEquals(listOf(ScooterZoneKind.NoRide, ScooterZoneKind.Slow), response.zones.map { it.kind })
        assertEquals("The outer ring and its hole", 2, response.zones[0].polygons[0].size)
        assertEquals(GeoPoint(latitude = 47.38, longitude = 8.54), response.zones[0].polygons[0][0][1])
        assertEquals(15.0, response.zones[1].maxSpeedKph)
    }

    @Test
    fun everyLanguageNamesTheZones() {
        val keys = listOf(
            "Ride and parking zones", "Zones", "No riding", "No parking", "Slow",
            "Zoom in to see the zones", "No zones published here", "Zones unavailable right now", "not now",
        )
        for (language in listOf("de", "fr", "it", "nl", "nb", "pt", "es", "is")) {
            val strings = unwrap(ScooterLanguage.fromRawValue(language)).strings
            for (key in keys) {
                assertNotNull("$language: $key", strings[key])
            }
        }
        val german = unwrap(ScooterLanguage.fromRawValue("de")).strings
        assertEquals("Fahrverbot", german["No riding"])
    }
}

class CityRuleZoneTest {
    // Seoul is UTC+9 all year: noon there on 26 October 2026.
    private val seoulNoon = Instant.ofEpochSecond(1_792_983_600)
    private val hongdae = GeoBounds(south = 37.55, west = 126.918, north = 37.558, east = 126.93)
    private val daechi = GeoBounds(south = 37.493, west = 127.05, north = 37.5, east = 127.058)

    @Test
    fun aRuleHoldsWithinItsHoursByThePlacesClockFromItsFirstDay() {
        val rule = unwrap(CityRuleZone.all.firstOrNull { it.id == "seoul-daechi-academy-street" })
        assertTrue(rule.inForce(seoulNoon))
        assertTrue(rule.inForce(seoulNoon.plusSeconds(11 * 3600 - 60)))
        assertFalse(rule.inForce(seoulNoon.plusSeconds(11 * 3600)))
        assertFalse(rule.inForce(seoulNoon.plusSeconds(-60)))
        // 29 September, 23:59 in Seoul: the day before it started.
        assertFalse(rule.inForce(Instant.ofEpochSecond(1_790_693_940)))
        assertTrue(rule.inForce(Instant.ofEpochSecond(1_790_694_000 + 12 * 3600)))
    }

    @Test
    fun hoursPastMidnightHoldUntilTheyEnd() {
        val night = CityRuleZone.Hours(fromMinute = 22 * 60, untilMinute = 6 * 60)
        assertTrue(night.holds(atMinute = 23 * 60))
        assertTrue(night.holds(atMinute = 5 * 60))
        assertFalse(night.holds(atMinute = 12 * 60))
    }

    @Test
    fun theRulesOverTheViewAreShownFromZoom14() {
        val shown = CityRuleZone.shown(over = hongdae, zoom = 15, at = seoulNoon)
        assertEquals(listOf("seoul-hongdae-red-road"), shown.map { it.rule.id })
        assertEquals(listOf(true), shown.map { it.inForce })
        assertTrue(CityRuleZone.shown(over = hongdae, zoom = 13, at = seoulNoon).isEmpty())
        assertEquals(listOf("Gangnam-gu"), CityRuleZone.shown(over = daechi, zoom = 16, at = seoulNoon).map { it.rule.authority })
        for (rule in CityRuleZone.all) {
            assertEquals("https", URI(rule.source).scheme)
            assertFalse(rule.band.isEmpty())
        }
    }

    @Test
    fun aStreetsBandReachesHalfItsWidthEitherSideOfItsLine() {
        // About 200 m east, then 100 m north.
        val line = listOf(
            GeoPoint(latitude = 37.5, longitude = 127.0), GeoPoint(latitude = 37.5, longitude = 127.00226),
            GeoPoint(latitude = 37.5009, longitude = 127.00226),
        )
        val band = CityRuleZone.band(of = listOf(line), widthMeters = 14.0)
        fun covers(latitude: Double, longitude: Double): Boolean =
            band.any { ring(it[0], contains = GeoPoint(latitude = latitude, longitude = longitude)) }
        assertTrue(covers(37.5 + 5 / 110_540.0, 127.001))
        assertFalse(covers(37.5 + 9 / 110_540.0, 127.001))
        assertTrue(covers(37.50045, 127.00226))
    }

    // The overlay that keeps the two apart, one shape for each strength, draws with MapKit
    // (ScooterZoneOverlay) and comes with the map: this checks the zones it is handed.
    @Test
    fun aRuleOutsideItsHoursIsDrawnApartAndDimmer() {
        val rule = unwrap(CityRuleZone.all.firstOrNull { it.id == "seoul-hongdae-red-road" })
        val ring = rule.band[0][0]
        val zones = listOf(
            CityRuleZone.Shown(rule = rule, inForce = false).mapZone,
            ScooterZone(id = "lime:0", provider = "lime", kind = ScooterZoneKind.NoRide, maxSpeedKph = null, polygons = listOf(listOf(ring))),
        )
        assertEquals(setOf(CityRuleZone.dimmed, 1.0), zones.map { it.strength }.toSet())
        assertTrue(zones.all { it.kind == ScooterZoneKind.NoRide })
        assertEquals("rule:seoul-hongdae-red-road", zones[0].id)
        assertEquals(rule.band, zones[0].polygons)
        assertEquals(1.0, CityRuleZone.Shown(rule = rule, inForce = true).mapZone.strength, 0.0)
    }

    /** Ray casting. */
    private fun ring(ring: List<GeoPoint>, contains: GeoPoint): Boolean {
        var inside = false
        var previous = ring[ring.size - 1]
        for (corner in ring) {
            if ((corner.latitude > contains.latitude) != (previous.latitude > contains.latitude) &&
                contains.longitude < (previous.longitude - corner.longitude) * (contains.latitude - corner.latitude) /
                (previous.latitude - corner.latitude) + corner.longitude
            ) {
                inside = !inside
            }
            previous = corner
        }
        return inside
    }
}
