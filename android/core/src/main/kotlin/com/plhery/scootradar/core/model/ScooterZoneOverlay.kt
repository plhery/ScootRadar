package com.plhery.scootradar.core.model

import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.Geometry
import org.locationtech.jts.geom.GeometryFactory
import org.locationtech.jts.geom.LineString
import org.locationtech.jts.geom.LinearRing
import org.locationtech.jts.geom.MultiLineString
import org.locationtech.jts.geom.Polygon
import org.locationtech.jts.geom.prep.PreparedGeometry
import org.locationtech.jts.geom.prep.PreparedGeometryFactory
import org.locationtech.jts.geom.util.GeometryFixer
import org.locationtech.jts.index.strtree.STRtree
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
        // Near the corner, as on the iPhone, where the union's round-off is the least.
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
            } catch (_: RuntimeException) {
                GeometryFixer.fix(whole)
            }
        }

        /**
         * One shape of them all. A union that floating-point round-off defeats, which Core Graphics' never is,
         * leaves the zones as they came, as on the web. JTS rethrows what its first try met when its retries
         * fail too, so any failure is caught, not only a TopologyException.
         */
        private fun union(areas: List<Geometry>): Geometry = try {
            OverlayNGRobust.union(areas)
        } catch (_: RuntimeException) {
            factory.buildGeometry(areas.flatMap { area -> (0 until area.numGeometries).map { area.getGeometryN(it) } })
        }
    }
}

/**
 * The zones as the map draws them, as the web does (MapComponent.tsx): each kind's fills as one translucent
 * layer, the strongest rule on top, those drawn dimmer in a fainter layer of their own; then every edge. This
 * decides what the map draws, without drawing, in the overlay's map points from its corner. A scale is how
 * many map points one point spans, MapKit's 1 / zoomScale.
 */
class ScooterZoneRenderer(zones: ScooterZoneOverlay) {
    /** A kind's fills of one strength, laid down as one translucent layer, so that its zones are no darker where they meet. */
    data class Fill(
        val kind: ScooterZoneKind,
        val strength: Double,
        val color: Long,
        /** The whole layer's opacity. */
        val opacity: Double,
        /** No riding is not filled flat: a ground and lines across it (hatch). */
        val hatched: Boolean,
        val shapes: List<ScooterZoneOverlay.Shape>,
    )

    /** A piece's edge as it is stroked, its lines in map points from the corner of the overlay. */
    data class Stroke(
        val shape: ScooterZoneOverlay.Shape,
        val color: Long,
        val opacity: Double,
        val edge: ScooterZoneLook.Edge,
        val lines: Geometry,
    )

    private val overlay = zones
    private val shapes: List<ScooterZoneOverlay.Shape> = zones.shapes
    val colors: Map<ScooterZoneKind, Long> =
        ScooterZoneKind.entries.associateWith { ScooterZoneLook.color(it, isDark = zones.isDark) }

    /** The pieces a tile of the map draws, its map rect: those whose bounds meet it grown by 4 points. */
    fun near(mapRect: MapRect, scale: Double): List<ScooterZoneOverlay.Shape> {
        // A screen point, in map points.
        val unit = scale
        val reach = mapRect.insetBy(dx = -4 * unit, dy = -4 * unit)
        return shapes.filter { it.bounds.intersects(reach) }
    }

    /** The fills in the order they are laid down: the kinds below first, and within a kind the dimmer first. */
    fun fills(near: List<ScooterZoneOverlay.Shape>): List<Fill> = ScooterZoneKind.belowFirst.flatMap { kind ->
        val ofKind = near.filter { it.kind == kind }
        val color = colors[kind] ?: return@flatMap emptyList()
        ofKind.map { it.strength }.distinct().sorted().map { strength ->
            Fill(
                kind = kind, strength = strength, color = color,
                opacity = ScooterZoneLook.fillOpacity(kind) * strength, hatched = kind == ScooterZoneKind.NoRide,
                shapes = ofKind.filter { it.strength == strength },
            )
        }
    }

    /**
     * The edges in the order they are stroked: no parking's and slow zones', then no riding's over them.
     *
     * Where riding is forbidden, nothing more needs saying: no parking's and slow zones' edges give way within
     * no riding's zones and along their edge, which other operators' zones of the same street often follow to
     * the metre. MapKit erases them there with a clear blend, which MapLibre has not: their lines are cut
     * instead, less each piece of no riding grown by ScooterZoneLook.edgeClearance points, with the round
     * corners of the stroke that erases them. That takes a while on a large set of zones: run it off the main
     * thread, again as the scale changes, and on every move too when `near` holds only the view's pieces
     * rather than all the overlay's shapes.
     */
    fun strokes(near: List<ScooterZoneOverlay.Shape>, scale: Double): List<Stroke> {
        val noRide = near.filter { it.kind == ScooterZoneKind.NoRide }
        val giving = near.filter { it.kind != ScooterZoneKind.NoRide }
        val clearance = ScooterZoneLook.edgeClearance * scale
        val cleared = STRtree()
        for (shape in noRide) {
            val area = shape.polygon.buffer(clearance)
            cleared.insert(area.envelopeInternal, PreparedGeometryFactory.prepare(area))
        }
        return giving.map { stroke(it, lines = givingWay(it.polygon.boundary, cleared)) } +
            noRide.map { stroke(it, lines = it.polygon.boundary) }
    }

    /**
     * No riding's hatching over a piece in a tile of the map: lines across it at 45°, laid on the overlay's own
     * grid so that they run on from one tile to the next. They are the lines x + y = c,
     * ScooterZoneLook.hatchSpacing points apart across them, over the piece's bounds within the tile grown by a
     * point; they are drawn clipped to the piece, on a ground of its colour. The map's fill pattern draws lines
     * of the same spacing and angle, laid on the world's grid instead.
     */
    fun hatch(shape: ScooterZoneOverlay.Shape, tile: MapRect, scale: Double): MultiLineString {
        val unit = scale
        val corner = overlay.boundingMapRect ?: return ScooterZoneOverlay.factory.createMultiLineString()
        val reach = MapRect(x = tile.x - corner.x, y = tile.y - corner.y, width = tile.width, height = tile.height)
            .insetBy(dx = -unit, dy = -unit)
        val bounds = shape.polygon.envelopeInternal
        val minX = max(bounds.minX, reach.minX)
        val minY = max(bounds.minY, reach.minY)
        val maxX = min(bounds.maxX, reach.maxX)
        val maxY = min(bounds.maxY, reach.maxY)
        // Core Graphics' intersection, neither null nor empty.
        if (!(maxX > minX && maxY > minY)) return ScooterZoneOverlay.factory.createMultiLineString()
        // Lines x + y = c, ScooterZoneLook.hatchSpacing apart across them.
        val step = ScooterZoneLook.hatchSpacing * unit * sqrt(2.0)
        if (!(step > 0)) return ScooterZoneOverlay.factory.createMultiLineString()
        val lines = mutableListOf<LineString>()
        var c = floor((minX + minY) / step) * step
        while (c <= maxX + maxY) {
            lines += ScooterZoneOverlay.factory.createLineString(arrayOf(Coordinate(c - minY, minY), Coordinate(c - maxY, maxY)))
            c += step
        }
        return ScooterZoneOverlay.factory.createMultiLineString(lines.toTypedArray())
    }

    private fun stroke(shape: ScooterZoneOverlay.Shape, lines: Geometry): Stroke = Stroke(
        shape = shape, color = colors.getValue(shape.kind),
        opacity = ScooterZoneLook.edgeOpacity * shape.strength, edge = ScooterZoneLook.edge(shape.kind), lines = lines,
    )

    /**
     * A piece's edge less no riding's grown pieces that reach it. One that round-off defeats is kept whole,
     * and drawn over no riding's edge.
     */
    private fun givingWay(lines: Geometry, cleared: STRtree): Geometry {
        // Most pieces near an edge, by their bounds, do not reach it; one may hide it all.
        val reaching = cleared.query(lines.envelopeInternal).filterIsInstance<PreparedGeometry>().filter { it.intersects(lines) }
        if (reaching.isEmpty()) return lines
        if (reaching.any { it.covers(lines) }) return ScooterZoneOverlay.factory.createMultiLineString()
        return try {
            val area = reaching.singleOrNull()?.geometry ?: OverlayNGRobust.union(reaching.map { it.geometry })
            OverlayNGRobust.overlay(lines, area, OverlayNG.DIFFERENCE)
        } catch (_: RuntimeException) {
            lines
        }
    }
}
