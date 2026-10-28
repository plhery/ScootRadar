package com.plhery.scootradar.map

import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.WalkTrailLook
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.double
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

// MAP-162 to MAP-185: WalkTrailOverlay's dots as MapLibre's circle layers draw them, by their numbers.

class WalkTrailLayersTest {
    /** A walk through Zürich's old town in map points: a turn, a step of no length, and a long street. */
    private val route = listOf(
        GeoPoint(47.3769, 8.5417), GeoPoint(47.3772, 8.5431), GeoPoint(47.3772, 8.5431), GeoPoint(47.3791, 8.5440),
        GeoPoint(47.3804, 8.5426),
    ).map { MapPoint(it) }

    @Test
    fun drawsTheCasingUnderTheDotsAndAFadingTrailUnderTheOneShown() {
        val specs = TrailLayers.specs(isDark = false)
        assertEquals(GroundOverlays.order.takeLast(4), specs.map { it.id })
        assertEquals(
            listOf("walk-trail-fading", "walk-trail-fading", "walk-trail", "walk-trail"),
            specs.map { it.source },
        )
        val byId = specs.associateBy { it.id }
        assertEquals(4.5, byId.getValue("walk-trail-casing").paint["circle-radius"])
        assertEquals(3.0, byId.getValue("walk-trail").paint["circle-radius"])
        assertEquals("#FFFFFF", byId.getValue("walk-trail-casing").paint["circle-color"])
        assertEquals("#0A84FF", byId.getValue("walk-trail").paint["circle-color"])
        assertEquals("#0B0E14", TrailLayers.specs(isDark = true).associateBy { it.id }.getValue("walk-trail-casing").paint["circle-color"])
        assertEquals("#0A84FF", TrailLayers.specs(isDark = true).associateBy { it.id }.getValue("walk-trail").paint["circle-color"])
        for (spec in specs) {
            assertEquals(OverlayLayerSpec.Type.Circle, spec.type)
            // On the ground, as MapKit's overlays are, and none until the filter says which.
            assertEquals("map", spec.paint["circle-pitch-alignment"])
            assertEquals("map", spec.paint["circle-pitch-scale"])
            assertEquals(1.0, spec.paint["circle-opacity"])
            assertEquals(TrailLayers.filter(IntRange.EMPTY), spec.filter)
        }
    }

    @Test
    fun showsTheDotsOfEachPartOfTheRouteByTheirNumbers() {
        for (spacing in listOf(3.0, 11.0, 37.5)) {
            val dots = TrailDots(revision = 1, route, spacing)
            assertEquals(WalkTrailLook.dots(along = route, spacing = spacing), dots.positions)
            assertTrue(dots.positions.size > 10)
            val shares = listOf(-0.2, 0.0, 0.001, 0.1, 0.25, 1.0 / 3, 0.5, 0.7731, 0.999, 1.0, 1.4)
            for (from in shares) {
                for (to in shares) {
                    val range = dots.shown(from = from, to = to)
                    val expected = WalkTrailLook.dots(along = route, spacing = spacing, from = from, to = to)
                    val drawn = if (range.isEmpty()) emptyList() else dots.positions.subList(range.first, range.last + 1)
                    assertEquals("$spacing from $from to $to", expected, drawn)
                }
            }
        }
        // Nothing drawn yet, and nothing left to walk.
        val dots = TrailDots(revision = 1, route, 11.0)
        assertTrue(dots.shown(from = 0.0, to = 0.0).isEmpty())
        assertTrue(dots.shown(from = 1.0, to = 1.0).isEmpty())
        assertEquals(0..dots.positions.lastIndex, dots.shown(from = 0.0, to = 1.0))
    }

    @Test
    fun spacesTheDotsOfALongRouteFurtherApartRatherThanDrawMore() {
        val long = listOf(MapPoint(0.0, 0.0), MapPoint(100_000.0, 0.0))
        val dots = TrailDots(revision = 1, long, spacing = 1.0)
        assertEquals(WalkTrailLook.maximumDots + 1, dots.positions.size)
        val range = dots.shown(from = 0.25, to = 0.5)
        assertEquals(750..1500, range)
        assertEquals(WalkTrailLook.dots(along = long, spacing = 1.0, from = 0.25, to = 0.5), dots.positions.subList(750, 1501))
        // A route of no length, or of one point, has none.
        assertTrue(TrailDots(revision = 1, listOf(MapPoint(5.0, 5.0), MapPoint(5.0, 5.0)), 1.0).shown(0.0, 1.0).isEmpty())
        assertTrue(TrailDots(revision = 1, listOf(MapPoint(5.0, 5.0)), 1.0).shown(0.0, 1.0).isEmpty())
    }

    @Test
    fun writesEachDotAsAPointWithItsNumber() {
        val dots = TrailDots(revision = 4, route, 11.0)
        val features = Json.parseToJsonElement(dots.json).jsonObject.getValue("features").jsonArray
        assertEquals(dots.positions.size, features.size)
        features.forEachIndexed { index, element ->
            val feature = element.jsonObject
            assertEquals(index, feature.getValue("properties").jsonObject.getValue("i").jsonPrimitive.int)
            val geometry = feature.getValue("geometry").jsonObject
            assertEquals("Point", geometry.getValue("type").jsonPrimitive.content)
            val (longitude, latitude) = geometry.getValue("coordinates").jsonArray.map { it.jsonPrimitive.double }
            val expected = dots.positions[index].coordinate
            assertEquals(expected.longitude, longitude, 1e-12)
            assertEquals(expected.latitude, latitude, 1e-12)
        }
    }

    @Test
    fun filtersTheDotsByTheirNumbers() {
        assertEquals("[\"all\",[\">=\",[\"get\",\"i\"],3],[\"<=\",[\"get\",\"i\"],41]]", TrailLayers.filter(3..41))
        assertEquals("[\"all\",[\">=\",[\"get\",\"i\"],0],[\"<=\",[\"get\",\"i\"],0]]", TrailLayers.filter(0..0))
        // None: no number is both.
        assertEquals("[\"all\",[\">=\",[\"get\",\"i\"],0],[\"<=\",[\"get\",\"i\"],-1]]", TrailLayers.filter(IntRange.EMPTY))
        assertEquals(TrailLayers.filter(IntRange.EMPTY), TrailLayers.filter(5..2))
    }

    @Test
    fun laysTheDotsOutAgainOnlyForAZoomThatMovesThemMoreThanThreePercent() {
        assertTrue(TrailLayers.respaces(spacing = 0.0, next = 11.0))
        assertFalse(TrailLayers.respaces(spacing = 100.0, next = 100.0))
        assertFalse(TrailLayers.respaces(spacing = 100.0, next = 102.9))
        assertFalse(TrailLayers.respaces(spacing = 100.0, next = 97.1))
        assertTrue(TrailLayers.respaces(spacing = 100.0, next = 103.1))
        assertTrue(TrailLayers.respaces(spacing = 100.0, next = 96.9))
        // A zoom step doubles or halves them.
        assertTrue(TrailLayers.respaces(spacing = 100.0, next = 200.0))
        assertTrue(TrailLayers.respaces(spacing = 100.0, next = 50.0))
    }

    @Test
    fun drawsEachFrameAtTheTimeItShowsFromTheFirstFramesTime() {
        val interval = 16_666_667L
        val start = 5_000_000_000L
        val reveal = TrailFrames(WalkTrailLook.revealDuration.inWholeNanoseconds, interval)
        // The first frame is drawn for the time it shows, a frame on: not at 0, which the start drew.
        assertEquals(interval / 700e6, reveal.progress(start), 1e-12)
        assertEquals((interval + 350_000_000L) / 700e6, reveal.progress(start + 350_000_000L), 1e-12)
        // A frame late draws as far as the time it shows.
        assertEquals((interval + 400_000_000L) / 700e6, reveal.progress(start + 400_000_000L), 1e-12)
        val frames = generateSequence(start) { it + interval }.map(reveal::progress).takeWhile { it < 1 }.toList()
        assertEquals(41, frames.size)
        assertEquals(1.0, reveal.progress(start + 41 * interval), 0.0)
        assertEquals(1.0, reveal.progress(start + 900_000_000L), 0.0)
        // The fade: a quarter of a second, linear, whatever Reduce Motion says.
        val fade = TrailFrames(WalkTrailLook.fadeDuration.inWholeNanoseconds, interval)
        assertEquals(1 - interval / 250e6, 1 - fade.progress(start), 1e-12)
        assertEquals(0.0, 1 - fade.progress(start + 250_000_000L - interval), 1e-12)
        // Not quite at the start or the end, the reveal's ease-out.
        assertEquals(0.0, WalkTrailLook.easeOut(0.0), 0.0)
        assertEquals(0.875, WalkTrailLook.easeOut(0.5), 1e-12)
        assertEquals(1.0, WalkTrailLook.easeOut(1.0), 0.0)
    }
}
