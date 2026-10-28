// MKOverlayLevel.aboveRoads, where ios/ScootRadar/Views/ScooterZoneOverlay.swift and
// ios/ScootRadar/Views/WalkTrailOverlay.swift put their overlays (map.md MAP-153, MAP-183).

package com.plhery.scootradar.map

import com.plhery.scootradar.core.model.GeoPoint
import org.maplibre.android.maps.Style
import org.maplibre.android.style.expressions.Expression
import org.maplibre.android.style.layers.CircleLayer
import org.maplibre.android.style.layers.FillLayer
import org.maplibre.android.style.layers.Layer
import org.maplibre.android.style.layers.LayoutPropertyValue
import org.maplibre.android.style.layers.LineLayer
import org.maplibre.android.style.layers.PaintPropertyValue
import org.maplibre.android.style.layers.PropertyValue

/**
 * What the app draws on the ground, MapKit's overlays at the level above the roads: over the streets and under
 * their names, and so under every marker. Bottom to top: the zones' fills, the strongest rule on top; their
 * edges, no riding's over the others'; then the walk's trail, its casing under its dots, a trail fading as it is
 * hidden above both, as MapKit keeps it until it has gone.
 */
object GroundOverlays {
    const val ZONES_SOURCE = "zones"
    const val ZONE_EDGES_SOURCE = "zone-edges"
    const val TRAIL_SOURCE = "walk-trail"
    const val FADING_TRAIL_SOURCE = "walk-trail-fading"

    const val TRAIL_CASING = "walk-trail-casing"
    const val TRAIL = "walk-trail"
    const val FADING_TRAIL_CASING = "walk-trail-fading-casing"
    const val FADING_TRAIL = "walk-trail-fading"

    val order: List<String> = ZoneLayers.fills + ZoneLayers.edges + listOf(TRAIL_CASING, TRAIL, FADING_TRAIL_CASING, FADING_TRAIL)

    /**
     * Adds one of the layers in its place, whichever of them came first: under the next of them already there,
     * else under the ground's names, else under the markers, else on top, on a style that has neither, as a
     * test's has.
     */
    fun add(style: Style, spec: OverlayLayerSpec) {
        val layer = spec.layer()
        val index = order.indexOf(spec.id)
        val above = order.drop(index + 1).firstOrNull { style.getLayer(it) != null }
            ?: GroundStyle.FIRST_LABEL_LAYER.takeIf { style.getLayer(it) != null }
            ?: ScooterMarkerLayers.order.firstOrNull { style.getLayer(it) != null }
        if (above == null) style.addLayer(layer) else style.addLayerBelow(layer, above)
    }

    /** Sets on the style's layers what changes from one look of them to another. */
    fun restyle(style: Style, from: List<OverlayLayerSpec>, to: List<OverlayLayerSpec>) {
        val before = from.associateBy { it.id }
        for (spec in to) {
            val old = before[spec.id]
            val layer = style.getLayer(spec.id) ?: continue
            val changed = spec.paint.filter { (name, value) -> old?.paint?.get(name) != value }
            if (changed.isEmpty()) continue
            layer.setProperties(*changed.map { (name, value) -> PaintPropertyValue(name, value(value)) }.toTypedArray<PropertyValue<*>>())
        }
    }

    /** A value of a spec as PropertyValue takes it: an expression, a number, an array of numbers, a word. */
    internal fun value(value: Any): Any = when (value) {
        is SymbolLayerSpec.Json -> Expression.raw(value.text)
        is Double -> value.toFloat()
        is List<*> -> value.map { (it as Number).toFloat() }.toTypedArray()
        else -> value
    }

    /** An empty collection, for a source with nothing to draw. */
    const val NOTHING = "{\"type\":\"FeatureCollection\",\"features\":[]}"

    /** A position in GeoJSON, longitude first. */
    internal fun StringBuilder.position(point: GeoPoint) {
        append('[').append(number(point.longitude)).append(',').append(number(point.latitude)).append(']')
    }

    internal fun number(value: Double): String = if (value.isFinite()) value.toString() else "0"
}

/** One of the ground's overlays as data, as MapLibre is given it: what the tests read without a map. */
data class OverlayLayerSpec(
    val id: String,
    val type: Type,
    val source: String,
    /** An expression in the style's JSON. */
    val filter: String? = null,
    /** Values are numbers, lists of numbers, words, or [SymbolLayerSpec.Json] expressions. */
    val layout: Map<String, Any> = emptyMap(),
    val paint: Map<String, Any>,
) {
    enum class Type { Fill, Line, Circle }

    fun layer(): Layer {
        val layer: Layer = when (type) {
            Type.Fill -> FillLayer(id, source).also { layer -> filter?.let { layer.setFilter(Expression.raw(it)) } }
            Type.Line -> LineLayer(id, source).also { layer -> filter?.let { layer.setFilter(Expression.raw(it)) } }
            Type.Circle -> CircleLayer(id, source).also { layer -> filter?.let { layer.setFilter(Expression.raw(it)) } }
        }
        val properties = layout.map { (name, value) -> LayoutPropertyValue(name, GroundOverlays.value(value)) } +
            paint.map { (name, value) -> PaintPropertyValue(name, GroundOverlays.value(value)) }
        layer.setProperties(*properties.toTypedArray<PropertyValue<*>>())
        return layer
    }
}
