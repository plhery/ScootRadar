package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.api.ScooterAPI
import java.net.URI
import java.time.Instant
import java.util.Locale
import java.util.Random
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt
import kotlinx.coroutines.runBlocking
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.locationtech.jts.geom.LineString

// ios/ScootRadarTests/ScooterZonesTests.swift: ScooterZonesTests, ScooterZoneOverlayTests and
// CityRuleZoneTests. Its ScooterZonesModelTests run the map's model: they are with the map's controller.

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

    // The app's server is one on this machine: the address asked is its path and query.
    @Test
    fun zonesAreAskedForAndReadWithoutKindsOrRingsThisVersionCannotDraw() = runBlocking<Unit> {
        val body = """
            {"zones":[
              {"id":"lime:0","provider":"lime","kind":"noRide","polygons":[[[[47.37,8.54],[47.38,8.54],[47.38,8.55],[47.37,8.54]],[[47.371,8.541],[47.372,8.541],[47.372,8.542],[47.371,8.541]]]]},
              {"id":"bird:3","provider":"bird","kind":"slow","maxSpeedKph":15,"polygons":[[[[47.37,8.54],[47.38,8.54],[47.38,8.55],[47.37,8.54]]]]},
              {"id":"voi:1","provider":"voi","kind":"parkingRequired","polygons":[[[[47.37,8.54],[47.38,8.54],[47.38,8.55],[47.37,8.54]]]]},
              {"id":"dott:2","provider":"dott","kind":"noParking","polygons":[[[[47.37,8.54],[47.38,8.54],[47.37,8.54]]]]}
            ],"meta":{"generatedAt":"2026-10-24T10:00:00.000Z","pending":true,"truncated":false}}
        """.trimIndent()
        MockWebServer().use { server ->
            server.start()
            server.enqueue(MockResponse.Builder().code(200).addHeader("Content-Type", "application/json").body(body).build())
            val api = ScooterAPI(baseURL = server.url("/"))
            val area = unwrap(ScooterZoneArea(covering = GeoBounds(south = 47.361, west = 8.521, north = 47.399, east = 8.559)))

            val response = api.zonesIn(area = area)

            val url = server.takeRequest().url
            assertEquals("/api/zones?south=47.36&west=8.52&north=47.4&east=8.56&zoom=14", "${url.encodedPath}?${url.encodedQuery}")
            assertTrue(response.pending)
            assertFalse(response.truncated)
            assertEquals(listOf("lime:0", "bird:3"), response.zones.map { it.id })
            assertEquals(listOf(ScooterZoneKind.NoRide, ScooterZoneKind.Slow), response.zones.map { it.kind })
            assertEquals("The outer ring and its hole", 2, response.zones[0].polygons[0].size)
            assertEquals(GeoPoint(latitude = 47.38, longitude = 8.54), response.zones[0].polygons[0][0][1])
            assertEquals(15.0, response.zones[1].maxSpeedKph)
        }
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

class ScooterZoneOverlayTest {
    @Test
    fun theSameRuleOfSeveralOperatorsIsOneShapeWithinOneEdge() {
        val overlay = ScooterZoneOverlay(
            zones = listOf(
                zone("lime:0", ScooterZoneKind.NoParking, square(47.37, 8.54)),
                // The same street, a little further east, and the very same square again.
                zone("voi:0", ScooterZoneKind.NoParking, square(47.37, 8.5405)),
                zone("bird:0", ScooterZoneKind.NoParking, square(47.37, 8.54)),
            ),
            isDark = false,
        )
        assertEquals(listOf(ScooterZoneKind.NoParking), overlay.shapes.map { it.kind })
        assertExtent(unwrap(overlay.shapes.firstOrNull()), listOf(47.37, 8.54, 47.371, 8.5415))
    }

    @Test
    fun eachKindIsKeptItsOwnZonesApartApartAndHolesOpen() {
        val frame = listOf(
            square(47.37, 8.54, size = 0.003)[0],
            listOf(
                GeoPoint(latitude = 47.371, longitude = 8.541), GeoPoint(latitude = 47.372, longitude = 8.541),
                GeoPoint(latitude = 47.372, longitude = 8.542), GeoPoint(latitude = 47.371, longitude = 8.542),
                GeoPoint(latitude = 47.371, longitude = 8.541),
            ),
        )
        val overlay = ScooterZoneOverlay(
            zones = listOf(
                zone("dott:0", ScooterZoneKind.NoRide, square(47.37, 8.54)),
                zone("bolt:0", ScooterZoneKind.NoParking, square(47.37, 8.54)),
                zone("bolt:1", ScooterZoneKind.Slow, square(47.37, 8.54), square(47.38, 8.55)),
                zone("voi:0", ScooterZoneKind.NoRide, frame),
            ),
            isDark = false,
        )
        assertEquals(
            listOf(ScooterZoneKind.NoRide, ScooterZoneKind.NoParking, ScooterZoneKind.Slow, ScooterZoneKind.Slow),
            overlay.shapes.map { it.kind },
        )
        // Dott's square lies within the frame of Voi's, whose hole stays open.
        val noRide = overlay.shapes[0]
        assertExtent(noRide, listOf(47.37, 8.54, 47.373, 8.543))
        assertTrue(covers(noRide, overlay, 47.3705, 8.5405))
        assertTrue(covers(noRide, overlay, 47.3725, 8.5425))
        assertFalse(covers(noRide, overlay, 47.3715, 8.5415))
    }

    @Test
    fun onlyTheZonesHandedInAreMergedSoOneProviderShownShowsItsOwn() {
        val zones = listOf(zone("lime:0", ScooterZoneKind.NoRide, square(47.37, 8.54)), zone("voi:0", ScooterZoneKind.NoRide, square(47.37, 8.5405)))
        assertExtent(unwrap(ScooterZoneOverlay(zones = zones, isDark = false).shapes.firstOrNull()), listOf(47.37, 8.54, 47.371, 8.5415))
        val lime = ScooterZoneOverlay(zones = zones.filter { it.provider == "lime" }, isDark = false)
        assertExtent(unwrap(lime.shapes.firstOrNull()), listOf(47.37, 8.54, 47.371, 8.541))
        assertTrue(ScooterZoneOverlay(zones = emptyList(), isDark = false).shapes.isEmpty())
    }

    // What the renderer decides, which the map draws (Android only).

    @Test
    fun aShapeAndItsEdgesGoBackToTheMapAsCoordinates() {
        val frame = listOf(square(47.37, 8.54, size = 0.003)[0], square(47.371, 8.541)[0])
        val overlay = ScooterZoneOverlay(zones = listOf(zone("voi:0", ScooterZoneKind.NoRide, frame)), isDark = false)
        val shape = overlay.shapes.single()
        fun extent(ring: List<GeoPoint>) =
            listOf(ring.minOf { it.latitude }, ring.minOf { it.longitude }, ring.maxOf { it.latitude }, ring.maxOf { it.longitude })

        // Its outline and then its hole, each closed.
        val rings = overlay.rings(of = shape)
        assertEquals(2, rings.size)
        for ((ring, wanted) in rings.zip(listOf(listOf(47.37, 8.54, 47.373, 8.543), listOf(47.371, 8.541, 47.372, 8.542)))) {
            assertEquals(5, ring.size)
            assertEquals(ring.first(), ring.last())
            for ((value, expected) in extent(ring).zip(wanted)) assertEquals(expected, value, 1e-9)
        }
        // Its edge, lines of the outline and of the hole.
        val lines = overlay.lines(of = ScooterZoneRenderer(overlay).strokes(overlay.shapes, scale = 1.0).single().lines)
        assertEquals(2, lines.size)
        for ((line, ring) in lines.zip(rings)) {
            for ((value, expected) in extent(line).zip(extent(ring))) assertEquals(expected, value, 1e-9)
        }
    }

    @Test
    fun theColoursAreTheIPhonesOwn() {
        // ScooterZoneLook.color's components (ScooterZones.swift), red, green and blue, each to the nearest of
        // 255 steps.
        val iPhone = mapOf(
            (ScooterZoneKind.NoRide to false) to listOf(0.851, 0.176, 0.125),
            (ScooterZoneKind.NoParking to false) to listOf(0.753, 0.337, 0.0),
            (ScooterZoneKind.Slow to false) to listOf(0.243, 0.388, 0.867),
            (ScooterZoneKind.NoRide to true) to listOf(1.0, 0.412, 0.38),
            (ScooterZoneKind.NoParking to true) to listOf(1.0, 0.702, 0.251),
            (ScooterZoneKind.Slow to true) to listOf(0.486, 0.612, 1.0),
        )
        for ((key, components) in iPhone) {
            val (kind, isDark) = key
            val color = ScooterZoneLook.color(kind, isDark = isDark)
            assertEquals("$key", 0xFFL, color shr 24 and 0xFF)
            for ((index, component) in components.withIndex()) {
                assertEquals("$key $index", component * 255, (color shr (16 - 8 * index) and 0xFF).toDouble(), 0.5)
            }
        }
        for (isDark in listOf(false, true)) {
            val renderer = ScooterZoneRenderer(ScooterZoneOverlay(zones = emptyList(), isDark = isDark))
            assertEquals(ScooterZoneKind.entries.associateWith { ScooterZoneLook.color(it, isDark = isDark) }, renderer.colors)
        }
    }

    @Test
    fun theKindsAreLaidDownTheStrongestOnTopAndTheEdgesOverTheFills() {
        val overlay = ScooterZoneOverlay(
            zones = listOf(
                zone("lime:0", ScooterZoneKind.NoRide, rect(0.0, 0.0, 100.0, 100.0)),
                zone("bolt:0", ScooterZoneKind.Slow, rect(200.0, 0.0, 300.0, 100.0)),
                zone("voi:0", ScooterZoneKind.NoParking, rect(400.0, 0.0, 500.0, 100.0)),
                ScooterZone(
                    id = "rule:street", provider = "city", kind = ScooterZoneKind.NoRide, polygons = listOf(rect(600.0, 0.0, 700.0, 100.0)),
                    strength = CityRuleZone.dimmed,
                ),
            ),
            isDark = false,
        )
        val renderer = ScooterZoneRenderer(overlay)

        val fills = renderer.fills(overlay.shapes)
        assertEquals(
            listOf(ScooterZoneKind.Slow, ScooterZoneKind.NoParking, ScooterZoneKind.NoRide, ScooterZoneKind.NoRide),
            fills.map { it.kind },
        )
        assertEquals(listOf(1.0, 1.0, CityRuleZone.dimmed, 1.0), fills.map { it.strength })
        assertEquals(listOf(0.12, 0.16, 0.4 * CityRuleZone.dimmed, 0.4), fills.map { it.opacity })
        assertEquals(listOf(false, false, true, true), fills.map { it.hatched })
        assertEquals(listOf(0xFF3E63DD, 0xFFC05600, 0xFFD92D20, 0xFFD92D20), fills.map { it.color })

        // No parking's and slow zones' edges first, in the overlay's order, then no riding's over them.
        val strokes = renderer.strokes(overlay.shapes, scale = 1.0)
        assertEquals(
            listOf(ScooterZoneKind.NoParking, ScooterZoneKind.Slow, ScooterZoneKind.NoRide, ScooterZoneKind.NoRide),
            strokes.map { it.shape.kind },
        )
        assertEquals(listOf(0.9, 0.9, 0.9 * CityRuleZone.dimmed, 0.9), strokes.map { it.opacity })
        assertEquals(strokes.map { ScooterZoneLook.edge(it.shape.kind) }, strokes.map { it.edge })
        // Too far apart to give way: each edge is its whole outline.
        for (stroke in strokes) assertEquals(400.0, stroke.lines.length, 1e-6)
    }

    @Test
    fun aTileDrawsThePiecesWithinFourPointsOfIt() {
        val overlay = ScooterZoneOverlay(
            zones = listOf(zone("lime:0", ScooterZoneKind.NoRide, rect(0.0, 0.0, 1000.0, 1000.0)), zone("voi:0", ScooterZoneKind.Slow, rect(5000.0, 0.0, 6000.0, 1000.0))),
            isDark = false,
        )
        val renderer = ScooterZoneRenderer(overlay)
        // At 10 map points a point, 4 points are 40 map points.
        fun near(minX: Double) = renderer.near(MapRect(origin.x + minX, origin.y, 1000.0, 1000.0), scale = 10.0).map { it.kind }
        assertEquals(listOf(ScooterZoneKind.NoRide), near(1039.0))
        assertEquals(emptyList<ScooterZoneKind>(), near(1041.0))
        assertEquals(listOf(ScooterZoneKind.Slow), near(3961.0))
        assertEquals(emptyList<ScooterZoneKind>(), near(3959.0))
    }

    @Test
    fun noParkingsAndSlowZonesEdgesGiveWayToNoRidingWithinThreePoints() {
        // No riding's frame, its hole open, over the east of a no parking zone; a slow zone in the frame's hole,
        // and another within the frame itself. At 10 map points a point, the edges give way within 30 map
        // points of no riding, and within it.
        val frame = listOf(rect(600.0, 200.0, 1600.0, 800.0)[0], rect(1100.0, 300.0, 1500.0, 700.0)[0])
        val overlay = ScooterZoneOverlay(
            zones = listOf(
                zone("lime:0", ScooterZoneKind.NoParking, rect(0.0, 0.0, 1000.0, 1000.0)),
                zone("dott:0", ScooterZoneKind.NoRide, frame),
                zone("voi:0", ScooterZoneKind.Slow, rect(1200.0, 400.0, 1400.0, 600.0)),
                zone("bolt:0", ScooterZoneKind.Slow, rect(650.0, 250.0, 700.0, 300.0)),
            ),
            isDark = false,
        )
        val strokes = ScooterZoneRenderer(overlay).strokes(overlay.shapes, scale = 10.0)
        val corner = unwrap(overlay.boundingMapRect)
        assertEquals(0.0, corner.x - origin.x, 1e-6)
        assertEquals(0.0, corner.y - origin.y, 1e-6)

        // No parking's west, north and south edges stay whole; its east edge, at x = 1000, is cut from 30 map
        // points north of the frame to 30 south of it: 1000 × 3 + 170 + 170.
        val noParking = strokes.single { it.shape.kind == ScooterZoneKind.NoParking }
        assertEquals(3340.0, noParking.lines.length, 1e-6)
        val ends = (0 until noParking.lines.numGeometries).flatMap { index ->
            val line = noParking.lines.getGeometryN(index) as LineString
            listOf(line.startPoint.coordinate, line.endPoint.coordinate)
        }.filter { abs(it.x - 1000) < 1e-6 && (abs(it.y - 170) < 1e-6 || abs(it.y - 830) < 1e-6) }
        assertEquals(2, ends.size)
        // The slow zone in the hole is 100 map points from its edge, and keeps its edge; the other is gone.
        val slow = strokes.filter { it.shape.kind == ScooterZoneKind.Slow }
        assertEquals(800.0, slow.sumOf { it.lines.length }, 1e-6)
        assertEquals(listOf(true), slow.filter { it.lines.isEmpty }.map { it.shape.bounds.width < 100 })
        // No riding's own edge, its outline and its hole's, is all drawn.
        assertEquals(3200.0 + 1600.0, strokes.single { it.shape.kind == ScooterZoneKind.NoRide }.lines.length, 1e-6)
        // Nothing of the edges that give way comes within 30 map points of no riding.
        val noRide = overlay.shapes.single { it.kind == ScooterZoneKind.NoRide }.polygon
        for (stroke in strokes.filter { it.shape.kind != ScooterZoneKind.NoRide && !it.lines.isEmpty }) {
            assertTrue(stroke.lines.distance(noRide) > 30 - 1e-6)
        }
    }

    @Test
    fun noRidingIsHatchedAcrossAtFortyFiveDegreesOnTheOverlaysGrid() {
        val overlay = ScooterZoneOverlay(zones = listOf(zone("lime:0", ScooterZoneKind.NoRide, rect(0.0, 0.0, 100.0, 100.0))), isDark = false)
        val renderer = ScooterZoneRenderer(overlay)
        // A tile over the middle of the piece, grown by a point, 2 map points at this scale: x and y from 18 to 62.
        val lines = renderer.hatch(overlay.shapes[0], tile = MapRect(origin.x + 20, origin.y + 20, 40.0, 40.0), scale = 2.0)
        // Lines x + y = c, 8 points, here 16 map points, apart across them: c steps by 16√2 from the multiple
        // below 18 + 18 to the last within 62 + 62.
        val step = 16 * sqrt(2.0)
        assertEquals(5, lines.numGeometries)
        for (index in 0 until lines.numGeometries) {
            val (start, end) = lines.getGeometryN(index).coordinates
            assertEquals((index + 1) * step, start.x + start.y, 1e-6)
            assertEquals((index + 1) * step, end.x + end.y, 1e-6)
            assertEquals(18.0, start.y, 1e-6)
            assertEquals(62.0, end.y, 1e-6)
        }
        // A tile more than a point off the piece hatches nothing.
        assertTrue(renderer.hatch(overlay.shapes[0], tile = MapRect(origin.x + 103, origin.y, 40.0, 40.0), scale = 2.0).isEmpty)
    }

    /**
     * What MapLibre's layer would do when the scale changes: no parking's and slow zones' edges giving way to
     * no riding, on a few hundred zones of a city. It only logs how long that takes.
     */
    @Test
    fun theEdgesGiveWayOnAFewHundredZones() {
        val random = Random(7)
        val kinds = List(120) { ScooterZoneKind.NoRide } + List(120) { ScooterZoneKind.NoParking } + List(60) { ScooterZoneKind.Slow }
        // Wobbly discs of 30 to 250 m, 16 to 64 corners, over 4 km by 4 km of Zürich, many of them overlapping.
        val zones = kinds.mapIndexed { index, kind ->
            val centre = GeoPoint(latitude = 47.36 + random.nextDouble() * 0.036, longitude = 8.51 + random.nextDouble() * 0.053)
            val radius = 30 + random.nextDouble() * 220
            val corners = 16 + random.nextInt(49)
            val ring = (0..corners).map { corner ->
                val angle = (corner % corners).toDouble() / corners * 2 * PI
                val reach = radius * (0.75 + 0.25 * sin(angle * 3 + index))
                GeoPoint(
                    latitude = centre.latitude + reach * sin(angle) / 110_540,
                    longitude = centre.longitude + reach * cos(angle) / (111_320 * cos(centre.latitude * PI / 180)),
                )
            }
            zone("op:$index", kind, listOf(ring))
        }
        fun millis(block: () -> Unit): Double {
            val start = System.nanoTime()
            block()
            return (System.nanoTime() - start) / 1e6
        }
        lateinit var overlay: ScooterZoneOverlay
        val merging = List(3) { millis { overlay = ScooterZoneOverlay(zones = zones, isDark = false) } }
        val renderer = ScooterZoneRenderer(overlay)
        val log = StringBuilder("${zones.size} zones (${zones.sumOf { it.polygons[0][0].size }} points) merged into ${overlay.shapes.size} pieces in ${merging.map { "%.1f".format(Locale.ROOT, it) }} ms\n")
        // One of MapLibre's points, 512 to a tile, spans 2^(19 - zoom) map points.
        for (zoom in listOf(14, 16, 18)) {
            val scale = 2.0.pow(19 - zoom)
            lateinit var strokes: List<ScooterZoneRenderer.Stroke>
            val giving = List(3) { millis { strokes = renderer.strokes(overlay.shapes, scale = scale) } }
            assertEquals(overlay.shapes.size, strokes.size)
            log.append("zoom $zoom: edges give way in ${giving.map { "%.1f".format(Locale.ROOT, it) }} ms\n")
        }
        println(log)
    }

    /** Where the hand-worked shapes start, south-west of Zürich's main station. */
    private val origin = MapPoint(GeoPoint(latitude = 47.37, longitude = 8.54))

    /** A rectangle of the flat map, in map points east and south of `origin`, as a zone's polygon. */
    private fun rect(minX: Double, minY: Double, maxX: Double, maxY: Double): List<List<GeoPoint>> {
        fun point(x: Double, y: Double) = MapPoint(origin.x + x, origin.y + y).coordinate
        return listOf(listOf(point(minX, maxY), point(maxX, maxY), point(maxX, minY), point(minX, minY), point(minX, maxY)))
    }

    /** A square of about 110 m by 110 m in Zürich, from its south-west corner. */
    private fun square(south: Double, west: Double, size: Double = 0.001): List<List<GeoPoint>> = listOf(
        listOf(
            GeoPoint(latitude = south, longitude = west), GeoPoint(latitude = south, longitude = west + size),
            GeoPoint(latitude = south + size, longitude = west + size), GeoPoint(latitude = south + size, longitude = west),
            GeoPoint(latitude = south, longitude = west),
        ),
    )

    private fun zone(id: String, kind: ScooterZoneKind, vararg polygons: List<List<GeoPoint>>): ScooterZone =
        ScooterZone(id = id, provider = id.takeWhile { it != ':' }, kind = kind, maxSpeedKph = null, polygons = polygons.toList())

    /** South, west, north and east, to the centimetre or so. */
    private fun assertExtent(shape: ScooterZoneOverlay.Shape, expected: List<Double>) {
        val southWest = MapPoint(x = shape.bounds.minX, y = shape.bounds.maxY).coordinate
        val northEast = MapPoint(x = shape.bounds.maxX, y = shape.bounds.minY).coordinate
        val extent = listOf(southWest.latitude, southWest.longitude, northEast.latitude, northEast.longitude)
        for ((value, wanted) in extent.zip(expected)) {
            assertEquals("$extent", wanted, value, 1e-7)
        }
    }

    /** Even-odd, as Core Graphics fills a path: across every ring of the shape, its outline and its holes alike. */
    private fun covers(shape: ScooterZoneOverlay.Shape, overlay: ScooterZoneOverlay, latitude: Double, longitude: Double): Boolean {
        val point = MapPoint(GeoPoint(latitude = latitude, longitude = longitude))
        val corner = unwrap(overlay.boundingMapRect)
        val x = point.x - corner.x
        val y = point.y - corner.y
        val polygon = shape.polygon
        var inside = false
        for (ring in listOf(polygon.exteriorRing) + (0 until polygon.numInteriorRing).map { polygon.getInteriorRingN(it) }) {
            val corners = ring.coordinates
            for (index in 1 until corners.size) {
                val start = corners[index - 1]
                val end = corners[index]
                if ((end.y > y) != (start.y > y) && x < (start.x - end.x) * (y - end.y) / (start.y - end.y) + end.x) {
                    inside = !inside
                }
            }
        }
        return inside
    }
}

class CityRuleZoneTest {
    // Seoul is UTC+9 all year: noon there on 26 October 2026.
    private val seoulNoon = Instant.ofEpochSecond(1_792_983_600)
    private val hongdae = GeoBounds(south = 37.55, west = 126.918, north = 37.558, east = 126.93)
    private val daechi = GeoBounds(south = 37.493, west = 127.05, north = 37.5, east = 127.058)

    // Two of Seoul's streets closed to scooters from noon until 23:00, as data/ had them on 28 October 2026, a stretch
    // of each: data/ adds rules and changes them (LOG-370). The catalog's own are checked as they come.
    private val hongdaeRedRoad = CityRuleZone(
        id = "seoul-hongdae-red-road",
        authority = "Seoul",
        timeZone = "Asia/Seoul",
        firstDay = "2025-05-16",
        hours = listOf(CityRuleZone.Hours(fromMinute = 12 * 60, untilMinute = 23 * 60)),
        source = "https://news.seoul.go.kr/traffic/archives/514266",
        lines = listOf(
            listOf(
                GeoPoint(37.555766, 126.927544), GeoPoint(37.555763, 126.927014), GeoPoint(37.555734, 126.926735),
                GeoPoint(37.55554, 126.925521),
            ),
        ),
    )
    private val daechiAcademyStreet = CityRuleZone(
        id = "seoul-daechi-academy-street",
        authority = "Gangnam-gu",
        timeZone = "Asia/Seoul",
        firstDay = "2026-09-30",
        hours = listOf(CityRuleZone.Hours(fromMinute = 12 * 60, untilMinute = 23 * 60)),
        source = "https://www.gangnam.go.kr/board/B_000031/1075336/view.do?mid=ID01_0313",
        lines = listOf(
            listOf(
                GeoPoint(37.498804, 127.051628), GeoPoint(37.499543, 127.054321), GeoPoint(37.49975, 127.055092),
                GeoPoint(37.499761, 127.055173),
            ),
        ),
    )
    private val rules = listOf(hongdaeRedRoad, daechiAcademyStreet)

    @Test
    fun aRuleHoldsWithinItsHoursByThePlacesClockFromItsFirstDay() {
        val rule = daechiAcademyStreet
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
        val shown = CityRuleZone.shown(over = hongdae, zoom = 15, at = seoulNoon, among = rules)
        assertEquals(listOf("seoul-hongdae-red-road"), shown.map { it.rule.id })
        assertEquals(listOf(true), shown.map { it.inForce })
        assertTrue(CityRuleZone.shown(over = hongdae, zoom = 13, at = seoulNoon, among = rules).isEmpty())
        assertEquals(
            listOf("Gangnam-gu"),
            CityRuleZone.shown(over = daechi, zoom = 16, at = seoulNoon, among = rules).map { it.rule.authority },
        )
        // The catalog's own, as the app reads them: each over its own streets.
        for (rule in CityRuleZone.all) {
            assertEquals("https", URI(rule.source).scheme)
            assertFalse(rule.band.isEmpty())
            assertTrue(rule.id, CityRuleZone.shown(over = rule.bounds, zoom = 16, at = seoulNoon).any { it.rule == rule })
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

    @Test
    fun aRuleOutsideItsHoursIsDrawnApartAndDimmer() {
        val rule = hongdaeRedRoad
        val ring = rule.band[0][0]
        val overlay = ScooterZoneOverlay(
            zones = listOf(
                CityRuleZone.Shown(rule = rule, inForce = false).mapZone,
                ScooterZone(id = "lime:0", provider = "lime", kind = ScooterZoneKind.NoRide, maxSpeedKph = null, polygons = listOf(listOf(ring))),
            ),
            isDark = false,
        )
        assertEquals(setOf(CityRuleZone.dimmed, 1.0), overlay.shapes.map { it.strength }.toSet())
        assertTrue(overlay.shapes.all { it.kind == ScooterZoneKind.NoRide })
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
