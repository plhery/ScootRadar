package com.plhery.scootradar.map

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.doubleOrNull
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.Style
import org.maplibre.android.style.expressions.Expression
import org.maplibre.android.style.layers.FillExtrusionLayer
import org.maplibre.android.style.layers.FillLayer
import org.maplibre.android.style.layers.LayoutPropertyValue
import org.maplibre.android.style.layers.LineLayer
import org.maplibre.android.style.layers.PaintPropertyValue
import org.maplibre.android.style.layers.SymbolLayer
import org.maplibre.android.style.layers.TransitionOptions
import org.maplibre.android.style.sources.TileSet
import org.maplibre.android.style.sources.VectorSource

// The ground layer of MapComponent (src/components/MapComponent.tsx), where the iPhone sets its map's
// preferredConfiguration (ios/ScootRadar/Views/ScooterMapView.swift).

/**
 * The ground on MapLibre's map. Its style is loaded once, with the land and the ground's layers; the tiles come
 * when their address does, asked for again until it can be had, and until then the map is the plain colour of
 * the land. Another look, from the appearance, the map style or the language, is set on the layers in place, as
 * the iPhone keeps its annotations and overlays through a new configuration (MAP-008, MAP-009). The buildings stand
 * while the map is tilted and lie flat once it rests seen from straight above, as MapKit's do (MAP-254).
 */
class MapGround(
    private val map: MapLibreMap,
    look: GroundLook,
    private val tiles: GroundTiles,
    private val imagery: SatelliteSource?,
    /** The composition's scope. */
    private val scope: CoroutineScope,
) {
    private var style: Style? = null

    /** The look the style has. */
    private var shown = look

    /** The look asked for. */
    private var wanted = look

    private var waiting: Job? = null

    /** Whether the raised buildings are shown, or the flat ones, as the style has them. */
    private var raised = false

    /** The map tilting: the buildings rise with it, from the first move. */
    private val tilting = MapLibreMap.OnCameraMoveListener { if (!raised) stand() }

    /** The map at rest: seen from straight above, the buildings lie flat. */
    private val rested = MapLibreMap.OnCameraIdleListener { stand() }

    init {
        map.addOnCameraMoveListener(tilting)
        map.addOnCameraIdleListener(rested)
        val url = tiles.known
        map.setStyle(Style.Builder().fromJson(GroundStyle.json(look, url, imagery))) { loaded ->
            // Nothing eased by the style itself; what eases says so, as the markers' light-up does. MapLibre draws
            // every frame while anything eases, and a write to a layer eases all its paint properties again, if only
            // to the same value, and fades in the names placed anew: the rider's breath, a write every 66 ms, would
            // have the map drawn every frame for as long as the dot shows. The ground's names appear at once.
            loaded.transition = TransitionOptions(0, 0, false)
            // But the buildings, which rise as the map tilts and lie flat again as it rests seen from above.
            val rise = TransitionOptions(GroundStyle.BUILDINGS_RISE, 0, false)
            (loaded.getLayer(GroundStyle.BUILDINGS) as? FillLayer)?.fillOpacityTransition = rise
            (loaded.getLayer(GroundStyle.BUILDING_LINES) as? LineLayer)?.lineOpacityTransition = rise
            (loaded.getLayer(GroundStyle.RAISED_BUILDINGS) as? FillExtrusionLayer)?.fillExtrusionOpacityTransition = rise
            style = loaded
            restyle()
            stand()
            if (url == null) waitForTiles()
        }
    }

    fun show(look: GroundLook) {
        wanted = look
        restyle()
    }

    fun close() {
        waiting?.cancel()
        map.removeOnCameraMoveListener(tilting)
        map.removeOnCameraIdleListener(rested)
        style = null
    }

    /**
     * The raised buildings shown while the map is tilted, and the flat ones while it is seen from straight above,
     * MapLibre easing each into the other. Their strengths alone change: nothing is laid out again, and the zones
     * and the walk's trail stay where they are, over the flat buildings and under the raised ones (GroundOverlays).
     */
    private fun stand() {
        val style = style ?: return
        val tilted = map.cameraPosition.tilt >= GroundStyle.LEAST_RAISED_TILT
        if (tilted == raised) return
        raised = tilted
        for (strength in GroundStyle.buildingStrengths(raised)) {
            style.getLayer(strength.layer)?.setProperties(PaintPropertyValue(strength.property, strength.opacity.toFloat()))
        }
    }

    private fun waitForTiles() {
        waiting = scope.launch {
            val url = tiles.urlWhenReachable()
            val style = style?.takeIf { it.isFullyLoaded } ?: return@launch
            if (style.getSource(GroundStyle.SOURCE) == null) {
                val tileSet = TileSet("2.2.0", url).apply {
                    minZoom = 0f
                    maxZoom = GroundStyle.MAX_DATA_ZOOM.toFloat()
                }
                style.addSource(VectorSource(GroundStyle.SOURCE, tileSet))
            }
        }
    }

    private fun restyle() {
        val style = style ?: return
        if (wanted == shown) return
        for (change in GroundStyle.changes(shown, wanted, imagery != null)) {
            val layer = style.getLayer(change.layer) ?: continue
            when (change.kind) {
                GroundStyle.Change.Kind.Paint -> layer.setProperties(PaintPropertyValue(change.name, value(change.value)))
                GroundStyle.Change.Kind.Layout -> layer.setProperties(LayoutPropertyValue(change.name, value(change.value)))
                GroundStyle.Change.Kind.Filter -> {
                    val filter = Expression.raw(change.value.toString())
                    when (layer) {
                        is FillLayer -> layer.setFilter(filter)
                        is LineLayer -> layer.setFilter(filter)
                        is SymbolLayer -> layer.setFilter(filter)
                    }
                }
            }
        }
        shown = wanted
    }

    /** A value of the style as PropertyValue takes it: an expression, a colour or other text, a number. */
    private fun value(element: JsonElement): Any? = when {
        element is JsonArray -> Expression.raw(element.toString())
        element is JsonNull -> null
        element is JsonPrimitive && element.isString -> element.content
        element is JsonPrimitive -> element.booleanOrNull ?: element.doubleOrNull?.toFloat()
        else -> null
    }
}
