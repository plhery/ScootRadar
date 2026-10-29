package com.plhery.scootradar.map

import android.graphics.Color
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.ScooterZone
import com.plhery.scootradar.core.model.ScooterZoneKind
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.double
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode
import kotlin.math.floor
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.pow
import kotlin.math.sqrt

// MAP-152 to MAP-161: ScooterZoneRenderer's fills, hatch and edges as MapLibre's layers draw them.

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ScooterZoneLayersTest {
    @Test
    fun drawsTheFillsStrongestOnTopThenTheEdgesNoRidingsLastAllUnderTheTrail() {
        assertEquals(
            listOf(
                "zones-parking", "zones-slow", "zones-noParking", "zones-noRide",
                "zone-edges-noParking", "zone-edges-slow", "zone-edges-parking", "zone-edges-noRide",
                "walk-trail-fading-casing", "walk-trail-fading", "walk-trail-casing", "walk-trail",
            ),
            GroundOverlays.order,
        )
        assertEquals(GroundOverlays.order.take(8), ZoneLayers.specs(isDark = false).map { it.id })
        for (spec in ZoneLayers.specs(isDark = false)) {
            val kind = spec.id.substringAfterLast('-')
            assertEquals("[\"==\",[\"get\",\"kind\"],\"$kind\"]", spec.filter)
        }
    }

    @Test
    fun coloursTheZonesAsTheWebDoesLighterOnADarkMap() {
        val light = ZoneLayers.specs(isDark = false).associateBy { it.id }
        val dark = ZoneLayers.specs(isDark = true).associateBy { it.id }
        assertEquals("#3E63DD", light.getValue("zones-slow").paint["fill-color"])
        assertEquals("#C05600", light.getValue("zones-noParking").paint["fill-color"])
        assertEquals("zone-hatch-light", light.getValue("zones-noRide").paint["fill-pattern"])
        assertEquals("#D92D20", light.getValue("zone-edges-noRide").paint["line-color"])
        assertEquals("#7C9CFF", dark.getValue("zones-slow").paint["fill-color"])
        assertEquals("#FFB340", dark.getValue("zone-edges-noParking").paint["line-color"])
        assertEquals("zone-hatch-dark", dark.getValue("zones-noRide").paint["fill-pattern"])
        assertEquals("#FF6961", dark.getValue("zone-edges-noRide").paint["line-color"])
        // Another appearance sets their colours, nothing else.
        for ((id, spec) in light) {
            val changed = spec.paint.keys.filter { spec.paint[it] != dark.getValue(id).paint[it] }
            assertEquals(id, listOf(if (spec.type == OverlayLayerSpec.Type.Line) "line-color" else if (id == "zones-noRide") "fill-pattern" else "fill-color"), changed)
            assertEquals(spec.layout, dark.getValue(id).layout)
        }
    }

    @Test
    fun strokesTheEdgesInPointsWithTheirDashesInWidths() {
        val specs = ZoneLayers.specs(isDark = false).associateBy { it.id }
        val noRide = specs.getValue("zone-edges-noRide")
        assertEquals(ZoneLayers.width(1.5), noRide.paint["line-width"])
        assertEquals(null, noRide.paint["line-dasharray"])
        assertEquals(mapOf("line-join" to "round", "line-cap" to "butt"), noRide.layout)
        val noParking = specs.getValue("zone-edges-noParking")
        assertEquals(ZoneLayers.width(1.5), noParking.paint["line-width"])
        // [6, 4] points.
        assertEquals(listOf(4.0, 4.0 / 1.5), noParking.paint["line-dasharray"])
        assertEquals("butt", noParking.layout["line-cap"])
        val slow = specs.getValue("zone-edges-slow")
        assertEquals(ZoneLayers.width(2.0), slow.paint["line-width"])
        // [0.1, 4] points between round caps: dots 4 points apart.
        assertEquals(listOf(0.05, 2.0), slow.paint["line-dasharray"])
        assertEquals("round", slow.layout["line-cap"])
        for (spec in specs.values) {
            val opacity = spec.paint[if (spec.type == OverlayLayerSpec.Type.Line) "line-opacity" else "fill-opacity"]
            assertEquals(SymbolLayerSpec.Json("[\"get\",\"opacity\"]"), opacity)
        }
    }

    @Test
    fun widthsAndTheCutAreAsMapKitShowsThemHalfAtAWholeZoomGrowingToTheWholeBeforeTheNext() {
        val stops = Json.parseToJsonElement(ZoneLayers.width(1.5).text).jsonArray
        assertEquals(listOf("interpolate", "[\"exponential\",2]", "[\"zoom\"]"), stops.take(3).map { it.toString().trim('"') })
        val pairs = stops.drop(3).map { it.jsonPrimitive.double }.chunked(2) { (zoom, width) -> zoom to width }
        // MapLibre's exponential interpolation between the stops about a zoom.
        fun width(zoom: Double): Double {
            val upper = pairs.indexOfFirst { it.first > zoom }
            if (upper <= 0) return if (upper == 0) pairs.first().second else pairs.last().second
            val (z0, w0) = pairs[upper - 1]
            val (z1, w1) = pairs[upper]
            return w0 + (w1 - w0) * (2.0.pow(zoom - z0) - 1) / (2.0.pow(z1 - z0) - 1)
        }
        for (zoom in listOf(0.0, 12.0, 15.0, 15.3, 15.5, 15.9, 16.0, 16.999, 21.0, 21.5)) {
            val expected = 1.5 * 2.0.pow(zoom - floor(zoom) - 1)
            assertEquals("at $zoom", expected, width(zoom), 1e-9)
            // The clearance's scale grows with the map as the width does: a point drawn is so many map points.
            assertEquals("at $zoom", MapPoint.worldSize / (512 * 2.0.pow(zoom)) * expected / 1.5, ZoneLayers.scale(zoom), 1e-9)
        }
        assertEquals(0.75, width(17.0), 1e-9)
        assertEquals(1.5 * 2.0.pow(-ZoneLayers.DROP), width(17.0 - ZoneLayers.DROP), 1e-9)
        assertEquals(pairs.map { it.first }.sorted(), pairs.map { it.first })
        assertEquals(pairs.size, pairs.map { it.first }.toSet().size)
        assertEquals(MapZoom.maximum, pairs.last().first, 1.0)
    }

    @Test
    fun givesEachFillItsKindsOpacityTimesItsStrengthDimmerFirst() {
        val drawing = ZoneDrawing(
            listOf(
                zone(ScooterZoneKind.Slow, square(0.0, 0.0, 400.0)),
                zone(ScooterZoneKind.NoParking, square(1_000.0, 0.0, 400.0)),
                zone(ScooterZoneKind.NoRide, square(2_000.0, 0.0, 400.0)),
                zone(ScooterZoneKind.NoRide, square(3_000.0, 0.0, 400.0), strength = 0.35),
            ),
        )
        val features = features(drawing.fills)
        assertEquals(listOf("slow", "noParking", "noRide", "noRide"), features.map { it.kind })
        assertEquals(listOf(0.12, 0.16, 0.4 * 0.35, 0.4), features.map { it.opacity })
        assertTrue(features.all { it.type == "Polygon" })
        val edges = features(drawing.edges(scale = 1.0))
        assertEquals(listOf("noParking", "slow", "noRide", "noRide"), edges.map { it.kind })
        assertEquals(listOf(0.9, 0.9, 0.9 * 0.35, 0.9), edges.map { it.opacity })
        // Rings left whole are polygons, joined all round.
        assertTrue(edges.all { it.type == "MultiPolygon" })
    }

    @Test
    fun cutsTheEdgesThatGiveWayThreePointsFromNoRiding() {
        val noRide = square(0.0, 0.0, 1_000.0)
        val drawing = ZoneDrawing(
            listOf(
                zone(ScooterZoneKind.NoRide, noRide),
                // Half over no riding.
                zone(ScooterZoneKind.NoParking, square(500.0, 200.0, 1_000.0, 600.0)),
                // Far from it.
                zone(ScooterZoneKind.Slow, square(5_000.0, 0.0, 300.0)),
            ),
        )
        assertTrue(drawing.hasEdgesToCut)
        for (scale in listOf(1.0, 20.0)) {
            val edges = features(drawing.edges(scale))
            val noParking = edges.single { it.kind == "noParking" }
            assertEquals("a cut edge is a line", "MultiLineString", noParking.type)
            val nearest = noParking.points.minOf { distance(it, from = 0.0, 0.0, 1_000.0, 1_000.0) }
            assertTrue("$nearest at $scale", nearest > 2.9 * scale && nearest < 3.1 * scale)
            // What is left runs on outside no riding: 3 sides and a bit of 500 map points.
            val length = noParking.lines.sumOf { line -> line.zipWithNext().sumOf { (a, b) -> hypot(b.x - a.x, b.y - a.y) } }
            assertEquals(500.0 + 600 + 500 - 2 * 3 * scale, length, 1.0 * scale)
            assertEquals("MultiPolygon", edges.single { it.kind == "noRide" }.type)
            assertEquals("MultiPolygon", edges.single { it.kind == "slow" }.type)
        }
        val alone = ZoneDrawing(listOf(zone(ScooterZoneKind.NoParking, noRide), zone(ScooterZoneKind.Slow, noRide)))
        assertTrue("nothing to give way to", !alone.hasEdgesToCut)
    }

    @Test
    fun hatchesNoRidingEightPointsApartTwoWideAt45DegreesLaidAtHalfThat() {
        assertEquals(8 * sqrt(2.0), ZoneHatch.period, 1e-12)
        assertEquals(4 * sqrt(2.0), ZoneHatch.laid, 1e-12)
        for (ratio in listOf(1f, 2f, 2.625f, 3f, 3.5f)) {
            val side = ZoneHatch.side(ratio)
            // MapLibre lays the picture's pixels as the screen's: half a period, within a whole pixel's rounding.
            assertEquals("at $ratio", ZoneHatch.laid, side / ratio.toDouble(), 0.5 / ratio + 1e-9)
            // Its density says as much, within the whole density's rounding.
            val density = ZoneHatch.density(side)
            assertEquals("at $ratio", ZoneHatch.laid, side / (density / 160.0), ZoneHatch.laid * 0.5 / density + 1e-9)
        }
        val image = ZoneHatch.image(isDark = false, pixelRatio = 4f)
        val side = image.width
        assertEquals(23, side)
        assertEquals(side, image.height)
        assertEquals(ZoneHatch.density(side), image.density)
        // On the line from corner to corner, and at the corners, the colour; halfway between lines, its ground at 0.4.
        val red = 0xFFD92D20.toInt()
        for ((x, y) in listOf(side / 2 to side / 2, 0 to 0, side - 1 to side - 1, side - 1 to 0, 3 to side - 4)) {
            assertEquals("($x, $y)", red, image.getPixel(x, y))
        }
        for ((x, y) in listOf(side / 4 to side / 4, 3 * side / 4 to 3 * side / 4)) {
            val pixel = image.getPixel(x, y)
            assertEquals(102.0, Color.alpha(pixel).toDouble(), 1.0)
            assertEquals(0xD9.toDouble(), Color.red(pixel).toDouble(), 2.0)
        }
        // The lines are laid 1 point wide across them, half the iPhone's 2, so √2 along a row: 4 pixels a point here.
        val across = (0 until side).count { x -> Color.alpha(image.getPixel(x, side / 2)) > (102 + 255) / 2 }
        assertEquals(sqrt(2.0) * 4, across.toDouble(), 1.0)
        // Rising to the right: the line meets the top row at its right end.
        assertEquals(red, image.getPixel(side - 1, 0))
        assertTrue(Color.alpha(image.getPixel(0, side / 4)) < 200)
        assertEquals(0xFFFF6961.toInt(), ZoneHatch.image(isDark = true, pixelRatio = 4f).getPixel(side / 2, side / 2))
    }

    private class Feature(val type: String, val kind: String, val opacity: Double, val lines: List<List<MapPoint>>) {
        val points: List<MapPoint> get() = lines.flatten()
    }

    private fun features(json: String): List<Feature> = Json.parseToJsonElement(json).jsonObject.getValue("features").jsonArray.map {
        val feature = it.jsonObject
        val geometry = feature.getValue("geometry").jsonObject
        val properties = feature.getValue("properties").jsonObject
        val type = geometry.getValue("type").jsonPrimitive.content
        val coordinates = geometry.getValue("coordinates").jsonArray
        val lines = when (type) {
            "Polygon", "MultiLineString" -> coordinates.map(::line)
            "MultiPolygon" -> coordinates.flatMap { polygon -> polygon.jsonArray.map(::line) }
            else -> error(type)
        }
        Feature(type, properties.getValue("kind").jsonPrimitive.content, properties.getValue("opacity").jsonPrimitive.double, lines)
    }

    private fun line(json: JsonElement): List<MapPoint> = (json as JsonArray).map { position ->
        val (longitude, latitude) = position.jsonArray.map { it.jsonPrimitive.double }
        MapPoint(GeoPoint(latitude, longitude)).let { MapPoint(it.x - origin.x, it.y - origin.y) }
    }

    /** How far a point is from a box, in map points: 0 within it. */
    private fun distance(point: MapPoint, from: Double, top: Double, right: Double, bottom: Double): Double {
        val dx = max(max(from - point.x, 0.0), point.x - right)
        val dy = max(max(top - point.y, 0.0), point.y - bottom)
        return hypot(dx, dy)
    }

    /** Zürich, in map points. */
    private val origin = MapPoint(GeoPoint(47.3769, 8.5417))

    /** A box from a corner, in map points from Zürich. */
    private fun square(x: Double, y: Double, width: Double, height: Double = width): List<GeoPoint> =
        listOf(MapPoint(x, y), MapPoint(x + width, y), MapPoint(x + width, y + height), MapPoint(x, y + height), MapPoint(x, y))
            .map { MapPoint(origin.x + it.x, origin.y + it.y).coordinate }

    private fun zone(kind: ScooterZoneKind, ring: List<GeoPoint>, strength: Double = 1.0) =
        ScooterZone(id = "${kind.rawValue}-${ring.first()}", provider = "test", kind = kind, polygons = listOf(listOf(ring)), strength = strength)
}
