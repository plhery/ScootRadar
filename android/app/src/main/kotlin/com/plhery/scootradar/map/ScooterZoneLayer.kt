// ScooterZoneLayer and ScooterZoneRenderer's drawing from ios/ScootRadar/Views/ScooterZoneOverlay.swift, with
// ScooterMapView's applyZones (map.md MAP-151 to MAP-165).

package com.plhery.scootradar.map

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.util.DisplayMetrics
import androidx.core.graphics.createBitmap
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.ScooterZone
import com.plhery.scootradar.core.model.ScooterZoneKind
import com.plhery.scootradar.core.model.ScooterZoneLook
import com.plhery.scootradar.core.model.ScooterZoneOverlay
import com.plhery.scootradar.core.model.ScooterZoneRenderer
import com.plhery.scootradar.map.GroundOverlays.position
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.Style
import org.maplibre.android.style.sources.GeoJsonSource
import java.util.Locale
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sqrt

/**
 * The zones on MapLibre's map, as ScooterZoneLayer puts them on the iPhone's: :core's overlay merges the
 * controller's zones off the main thread, and both sources take them on it, in one frame, so that a new set takes
 * the last one's place without a blink and without the iPhone's overlap of 100 ms (MAP-163). They are drawn
 * above the roads and under the names, the walk's trail and the markers (MAP-153). A change of appearance sets
 * the layers' colours, as MapKit draws them again in the other ones.
 *
 * No parking's and slow zones' edges give way to no riding (MAP-161). MapKit erases them with a clear blend,
 * which MapLibre has not: :core's renderer cuts their lines 3 points from no riding at the scale the map rests
 * at, and cuts them again, off the main thread, where it comes to rest a tenth closer or further. Between rests
 * the cut keeps the scale it was made at.
 *
 * The zones take no tap (MAP-164): the map's tap and its TalkBack nodes pass them by, and the legend tells
 * them apart.
 */
class ScooterZoneLayer(
    private val map: MapLibreMap,
    private val view: ScooterMapView,
    private val controller: ScooterMapController,
    /** The composition's scope, on the main thread. */
    private val scope: CoroutineScope,
    /** Where the zones are merged and their edges cut. */
    private val work: CoroutineDispatcher = Dispatchers.Default,
) {
    private var style: Style? = null
    private var isDark = false

    /** The look the layers have. */
    private var shownDark = false

    /** The revision asked for, and the zones drawn for the last one merged. */
    private var asked: Int? = null
    private var drawing: ZoneDrawing? = null

    /** The scale the drawn edges were cut at, or are being cut at: map points a point. */
    private var cutAt = 0.0
    private var building: Job? = null
    private var cutting: Job? = null
    private val updates: Job

    init {
        map.getStyle { loaded ->
            if (style != null) return@getStyle
            style = loaded
            addLayers(loaded)
            update()
        }
        updates = scope.launch { controller.mapZonesRevision.collect { update() } }
    }

    fun close() {
        updates.cancel()
        building?.cancel()
        cutting?.cancel()
        style = null
    }

    /** The zones in the colours of the map: lighter on a dark map and on satellite (MAP-156). */
    fun setDark(dark: Boolean) {
        isDark = dark
        val style = style ?: return
        if (dark == shownDark) return
        GroundOverlays.restyle(style, ZoneLayers.specs(shownDark), ZoneLayers.specs(dark))
        shownDark = dark
    }

    /** The map at rest: the edges are cut again for a scale a tenth away from theirs. */
    fun mapDidRest() {
        val drawing = drawing ?: return
        if (!drawing.hasEdgesToCut) return
        val scale = scale()
        if (!(scale > 0) || abs(scale / cutAt - 1) <= RECUT) return
        cutAt = scale
        cutting?.cancel()
        cutting = scope.launch {
            val edges = withContext(work) { drawing.edges(scale) }
            if (this@ScooterZoneLayer.drawing !== drawing) return@launch
            style?.getSourceAs<GeoJsonSource>(GroundOverlays.ZONE_EDGES_SOURCE)?.setGeoJson(edges)
        }
    }

    /** What updateUIView's applyZones does: the zones drawn again for a new revision. */
    private fun update() {
        val style = style ?: return
        val revision = controller.mapZonesRevision.value
        if (revision == asked) return
        asked = revision
        // Set before the revision, as the controller publishes them.
        val zones = controller.mapZones.value
        val scale = scale()
        building?.cancel()
        cutting?.cancel()
        building = scope.launch {
            val (drawn, edges) = withContext(work) { ZoneDrawing(zones).let { it to it.edges(scale) } }
            if (this@ScooterZoneLayer.style !== style || asked != revision) return@launch
            drawing = drawn
            cutAt = scale
            style.getSourceAs<GeoJsonSource>(GroundOverlays.ZONES_SOURCE)?.setGeoJson(drawn.fills)
            style.getSourceAs<GeoJsonSource>(GroundOverlays.ZONE_EDGES_SOURCE)?.setGeoJson(edges)
            // The map may have come to rest closer or further while they were merged.
            mapDidRest()
        }
    }

    /** Map points a point at the middle of the map, MapKit's 1 / zoomScale: MapLibre's world is 512 points at zoom 0. */
    private fun scale(): Double = MapPoint.worldSize / (512 * 2.0.pow(map.cameraPosition.zoom))

    private fun addLayers(style: Style) {
        style.addSource(GeoJsonSource(GroundOverlays.ZONES_SOURCE))
        style.addSource(GeoJsonSource(GroundOverlays.ZONE_EDGES_SOURCE))
        for (dark in listOf(false, true)) style.addImage(ZoneHatch.name(dark), ZoneHatch.image(dark, view.pixelRatio))
        shownDark = isDark
        for (spec in ZoneLayers.specs(isDark)) GroundOverlays.add(style, spec)
    }

    companion object {
        /** The change of scale, a share of it, that has the edges cut again (MAP-161: about a tenth). */
        const val RECUT = 0.1
    }
}

/**
 * The zones' layers, bottom to top: the fills of slow zones, no parking and no riding, the strongest rule on top,
 * each kind's of one strength at the opacity of its whole layer (MAP-154, MAP-155); then the edges, no parking's
 * and slow zones' first and no riding's over them (MAP-159, MAP-160). Each feature carries its kind and its
 * opacity, which a zone drawn dimmer lowers.
 */
object ZoneLayers {
    /** The edges in the order they are stroked. */
    val edgeOrder = listOf(ScooterZoneKind.NoParking, ScooterZoneKind.Slow, ScooterZoneKind.NoRide)

    val fills: List<String> = ScooterZoneKind.belowFirst.map(::fillID)
    val edges: List<String> = edgeOrder.map(::edgeID)

    fun fillID(kind: ScooterZoneKind) = "zones-${kind.rawValue}"

    fun edgeID(kind: ScooterZoneKind) = "zone-edges-${kind.rawValue}"

    /** The layers in a look, in the order they are drawn. */
    fun specs(isDark: Boolean): List<OverlayLayerSpec> =
        ScooterZoneKind.belowFirst.map { fill(it, isDark) } + edgeOrder.map { edge(it, isDark) }

    /** A feature's opacity, which its layer reads. */
    private val opacity = SymbolLayerSpec.Json("[\"get\",\"opacity\"]")

    private fun ofKind(kind: ScooterZoneKind) = "[\"==\",[\"get\",\"kind\"],\"${kind.rawValue}\"]"

    /** No riding is hatched, its colour in the pattern's picture; the others are flat. */
    fun fill(kind: ScooterZoneKind, isDark: Boolean) = OverlayLayerSpec(
        id = fillID(kind),
        type = OverlayLayerSpec.Type.Fill,
        source = GroundOverlays.ZONES_SOURCE,
        filter = ofKind(kind),
        paint = if (kind == ScooterZoneKind.NoRide) {
            mapOf("fill-pattern" to ZoneHatch.name(isDark), "fill-opacity" to opacity)
        } else {
            mapOf("fill-color" to color(kind, isDark), "fill-opacity" to opacity)
        },
    )

    /** MapLibre measures dashes in widths of the line, where Core Graphics measures them in points. */
    fun edge(kind: ScooterZoneKind, isDark: Boolean): OverlayLayerSpec {
        val edge = ScooterZoneLook.edge(kind)
        return OverlayLayerSpec(
            id = edgeID(kind),
            type = OverlayLayerSpec.Type.Line,
            source = GroundOverlays.ZONE_EDGES_SOURCE,
            filter = ofKind(kind),
            layout = mapOf("line-join" to "round", "line-cap" to if (edge.roundCaps) "round" else "butt"),
            paint = buildMap {
                put("line-color", color(kind, isDark))
                put("line-width", edge.width)
                put("line-opacity", opacity)
                if (edge.dashes.isNotEmpty()) put("line-dasharray", edge.dashes.map { it / edge.width })
            },
        )
    }

    /** A kind's colour as the style writes it. */
    fun color(kind: ScooterZoneKind, isDark: Boolean): String =
        String.format(Locale.ROOT, "#%06X", ScooterZoneLook.color(kind, isDark) and 0xFFFFFF)
}

/**
 * The zones as the map's sources take them: :core's overlay, the controller's zones merged, and its renderer's
 * fills and edges in GeoJSON, in the order they are laid down. The colours are the layers', so the zones are
 * merged once for both appearances. It takes a while on a large set of zones: make it off the main thread.
 */
class ZoneDrawing(zones: List<ScooterZone>) {
    val overlay = ScooterZoneOverlay(zones, isDark = false)
    private val renderer = ScooterZoneRenderer(overlay)

    /** Each piece's outline and holes as a polygon, with its kind and its whole layer's opacity. */
    val fills: String = buildString {
        append("{\"type\":\"FeatureCollection\",\"features\":[")
        var first = true
        for (fill in renderer.fills(overlay.shapes)) {
            for (shape in fill.shapes) {
                if (!first) append(',')
                first = false
                feature(fill.kind, fill.opacity) { polygon(overlay.rings(of = shape)) }
            }
        }
        append("]}")
    }

    /** Whether there are edges to give way: no riding and another kind both. */
    val hasEdgesToCut: Boolean = overlay.shapes.any { it.kind == ScooterZoneKind.NoRide } &&
        overlay.shapes.any { it.kind != ScooterZoneKind.NoRide }

    /**
     * Each piece's edge as it is stroked at a scale, map points a point: no parking's and slow zones' cut where no
     * riding's reach, no riding's whole. A ring left whole is a polygon, which MapLibre's line joins all round as
     * Core Graphics does a closed path; what is left of a cut one is a line.
     */
    fun edges(scale: Double): String = buildString {
        append("{\"type\":\"FeatureCollection\",\"features\":[")
        var first = true
        for (stroke in renderer.strokes(overlay.shapes, scale)) {
            val (rings, lines) = overlay.lines(of = stroke.lines).filter { it.size > 1 }.partition { it.size > 3 && it.first() == it.last() }
            if (rings.isNotEmpty()) {
                if (!first) append(',')
                first = false
                feature(stroke.shape.kind, stroke.opacity) {
                    append("{\"type\":\"MultiPolygon\",\"coordinates\":[")
                    rings.forEachIndexed { index, ring ->
                        if (index > 0) append(',')
                        append('[')
                        line(ring)
                        append(']')
                    }
                    append("]}")
                }
            }
            if (lines.isNotEmpty()) {
                if (!first) append(',')
                first = false
                feature(stroke.shape.kind, stroke.opacity) {
                    append("{\"type\":\"MultiLineString\",\"coordinates\":[")
                    lines.forEachIndexed { index, line ->
                        if (index > 0) append(',')
                        line(line)
                    }
                    append("]}")
                }
            }
        }
        append("]}")
    }

    private inline fun StringBuilder.feature(kind: ScooterZoneKind, opacity: Double, geometry: StringBuilder.() -> Unit) {
        append("{\"type\":\"Feature\",\"geometry\":")
        geometry()
        append(",\"properties\":{\"kind\":\"").append(kind.rawValue).append("\",\"opacity\":")
        append(GroundOverlays.number(opacity)).append("}}")
    }

    private fun StringBuilder.polygon(rings: List<List<GeoPoint>>) {
        append("{\"type\":\"Polygon\",\"coordinates\":[")
        rings.forEachIndexed { index, ring ->
            if (index > 0) append(',')
            line(ring)
        }
        append("]}")
    }

    private fun StringBuilder.line(points: List<GeoPoint>) {
        append('[')
        points.forEachIndexed { index, point ->
            if (index > 0) append(',')
            position(point)
        }
        append(']')
    }
}

/**
 * No riding's hatching as MapLibre's fill pattern (MAP-157): the iPhone's ground of the colour at 0.4 and lines
 * of it across at 45°, rising to the right, 8 points apart across them and 2 wide. One turn of the pattern is a
 * square 8√2 points across with a line from corner to corner and the corners of the next two, so that it runs on
 * from one square to the next. MapLibre lays it on the world's grid, as MapKit lays the iPhone's on the
 * overlay's, turned and tilted with the map (MAP-158).
 */
object ZoneHatch {
    const val LIGHT = "zone-hatch-light"
    const val DARK = "zone-hatch-dark"

    /** How far the lines repeat along either axis, in points. */
    val period: Double = ScooterZoneLook.hatchSpacing * sqrt(2.0)

    fun name(isDark: Boolean) = if (isDark) DARK else LIGHT

    /** The picture's side in pixels at a pixel ratio. */
    fun side(pixelRatio: Float): Int = max(2, (period * pixelRatio).roundToInt())

    /** The picture's density, which MapLibre reads its pixel ratio from: the side in pixels spans one period in points. */
    fun density(side: Int): Int = (side * DisplayMetrics.DENSITY_DEFAULT / period).roundToInt()

    /** One turn of the pattern in no riding's colour for an appearance. */
    fun image(isDark: Boolean, pixelRatio: Float): Bitmap {
        val side = side(pixelRatio)
        val bitmap = createBitmap(side, side)
        bitmap.density = density(side)
        val color = ScooterZoneLook.color(ScooterZoneKind.NoRide, isDark).toInt()
        val canvas = Canvas(bitmap)
        canvas.drawColor(color and 0xFFFFFF or ((ScooterZoneLook.hatchGroundOpacity * 255).roundToInt() shl 24))
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            this.color = color
            style = Paint.Style.STROKE
            // The width across the lines, in this picture's pixels.
            strokeWidth = (ScooterZoneLook.hatchWidth * side / period).toFloat()
        }
        // x + y = 0, side and twice the side, run past the picture's edges, where it is cut.
        val s = side.toFloat()
        for (c in listOf(0f, s, 2 * s)) canvas.drawLine(c + s, -s, c - 2 * s, 2 * s, paint)
        return bitmap
    }
}
