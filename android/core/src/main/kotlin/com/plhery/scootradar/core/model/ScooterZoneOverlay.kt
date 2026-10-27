package com.plhery.scootradar.core.model

import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.Geometry
import org.locationtech.jts.geom.GeometryFactory
import org.locationtech.jts.geom.LinearRing
import org.locationtech.jts.geom.Polygon
import org.locationtech.jts.geom.TopologyException
import org.locationtech.jts.geom.util.GeometryFixer
import org.locationtech.jts.operation.overlayng.OverlayNG
import org.locationtech.jts.operation.overlayng.OverlayNGRobust

// ScooterZoneOverlay and what ScooterZoneRenderer decides from ios/ScootRadar/Views/ScooterZoneOverlay.swift;
// the rest of that file draws the zones on the map.

/**
 * The operators' zones as one overlay on the map, drawn above the roads and under their names, the walking
 * route and the scooters. Each kind's zones are merged into one shape, as on the web (zoneShapes.ts): where
 * several operators forbid the same over a street, it is drawn once, within one edge. Only the zones handed
 * in are merged, those of the providers shown, so a filter on one provider leaves its own. Zones drawn
 * dimmer, a city's rules outside their hours, are merged apart from the others.
 *
 * The shapes are JTS's polygons, where the iPhone has Core Graphics' paths. The union takes a while on a
 * large set of zones: make the overlay off the main thread.
 */
class ScooterZoneOverlay(zones: List<ScooterZone>, val isDark: Boolean) {
    /** One piece of a kind's merged zones, its outline and its holes, in map points from the corner of the overlay. */
    class Shape(
        val kind: ScooterZoneKind,
        val strength: Double,
        val polygon: Polygon,
        val bounds: MapRect,
    )

    val shapes: List<Shape>

    /** Null with no zones, where MapKit's is MKMapRect.null. */
    val boundingMapRect: MapRect?

    val coordinate: GeoPoint?
        get() = boundingMapRect?.let { MapPoint(it.midX, it.midY).coordinate }

    private val corner: MapPoint

    /** A zone's polygons in map points. */
    private class Drawn(val kind: ScooterZoneKind, val strength: Double, val points: List<List<List<MapPoint>>>)

    init {
        val polygons = zones.map { zone ->
            Drawn(zone.kind, zone.strength, zone.polygons.map { polygon -> polygon.map { ring -> ring.map { MapPoint(it) } } })
        }
        val points = polygons.flatMap { it.points.flatten().flatten() }
        val corner = MapPoint(x = points.minOfOrNull { it.x } ?: 0.0, y = points.minOfOrNull { it.y } ?: 0.0)
        this.corner = corner
        boundingMapRect = if (points.isEmpty()) null else MapRect(
            x = corner.x, y = corner.y,
            width = (points.maxOfOrNull { it.x } ?: 0.0) - corner.x, height = (points.maxOfOrNull { it.y } ?: 0.0) - corner.y,
        )
        // Near the corner, where a double has its centimetres to spare.
        shapes = ScooterZoneKind.entries.flatMap { kind ->
            val ofKind = polygons.filter { it.kind == kind }
            ofKind.map { it.strength }.distinct().sorted().flatMap { strength ->
                val areas = ofKind.filter { it.strength == strength }.flatMap { it.points }.mapNotNull { polygon ->
                    area(polygon.map { ring -> ring.map { Coordinate(it.x - corner.x, it.y - corner.y) } })
                }
                if (areas.isEmpty()) return@flatMap emptyList()
                val merged = union(areas)
                (0 until merged.numGeometries).mapNotNull { index ->
                    val piece = merged.getGeometryN(index) as? Polygon ?: return@mapNotNull null
                    if (piece.isEmpty) return@mapNotNull null
                    val box = piece.envelopeInternal
                    Shape(
                        kind = kind, strength = strength, polygon = piece,
                        bounds = MapRect(x = corner.x + box.minX, y = corner.y + box.minY, width = box.width, height = box.height),
                    )
                }
            }
        }
    }

    /** A shape's outline and then its holes, each ring closed, as coordinates for the map to draw. */
    fun rings(of: Shape): List<List<GeoPoint>> {
        val polygon = of.polygon
        return (listOf(polygon.exteriorRing) + (0 until polygon.numInteriorRing).map { polygon.getInteriorRingN(it) })
            .map { ring -> ring.coordinates.map { coordinate(it) } }
    }

    /** Lines in map points from the corner of the overlay, as coordinates: each line its points in order. */
    fun lines(of: Geometry): List<List<GeoPoint>> =
        (0 until of.numGeometries).map { of.getGeometryN(it) }.filter { !it.isEmpty }
            .map { line -> line.coordinates.map { coordinate(it) } }

    private fun coordinate(point: Coordinate): GeoPoint = MapPoint(corner.x + point.x, corner.y + point.y).coordinate

    companion object {
        internal val factory = GeometryFactory()

        /**
         * A polygon's rings as one area, even-odd, so that a hole is one whichever way its ring turns. A ring
         * is closed as a path's subpath is, and one of fewer than three points covers nothing.
         */
        private fun area(polygon: List<List<Coordinate>>): Geometry? {
            val rings = polygon.mapNotNull { ring ->
                val closed = if (ring.isNotEmpty() && ring.first() != ring.last()) ring + ring.first() else ring
                if (closed.size < 4) null else factory.createLinearRing(closed.toTypedArray())
            }
            val outline = rings.firstOrNull() ?: return null
            val whole = factory.createPolygon(outline, rings.drop(1).toTypedArray<LinearRing>())
            if (whole.isValid) return whole
            // Rings that cross themselves or each other, or a hole out of its outline: each ring's area, every
            // other one taken away again.
            return try {
                rings.map { GeometryFixer.fix(factory.createPolygon(it)) }
                    .reduce { area, ring -> OverlayNGRobust.overlay(area, ring, OverlayNG.SYMDIFFERENCE) }
            } catch (_: TopologyException) {
                GeometryFixer.fix(whole)
            }
        }

        /**
         * One shape of them all. A union that floating-point round-off defeats, which Core Graphics' never is,
         * leaves the zones as they came, as on the web.
         */
        private fun union(areas: List<Geometry>): Geometry = try {
            OverlayNGRobust.union(areas)
        } catch (_: TopologyException) {
            factory.buildGeometry(areas.flatMap { area -> (0 until area.numGeometries).map { area.getGeometryN(it) } })
        }
    }
}
