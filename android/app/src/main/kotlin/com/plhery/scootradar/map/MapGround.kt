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
import org.maplibre.android.style.layers.FillLayer
import org.maplibre.android.style.layers.LayoutPropertyValue
import org.maplibre.android.style.layers.LineLayer
import org.maplibre.android.style.layers.PaintPropertyValue
import org.maplibre.android.style.layers.SymbolLayer
import org.maplibre.android.style.sources.TileSet
import org.maplibre.android.style.sources.VectorSource

// The ground layer of MapComponent (src/components/MapComponent.tsx), where the iPhone sets its map's
// preferredConfiguration (ios/ScootRadar/Views/ScooterMapView.swift).

/**
 * The ground on MapLibre's map. Its style is loaded once, with the land and the ground's layers; the tiles come
 * when their address does, asked for again until it can be had, and until then the map is the plain colour of
 * the land. Another look, from the appearance, the map style or the language, is set on the layers in place, as
 * the iPhone keeps its annotations and overlays through a new configuration (MAP-008, MAP-009).
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

    init {
        val url = tiles.known
        map.setStyle(Style.Builder().fromJson(GroundStyle.json(look, url, imagery))) { loaded ->
            style = loaded
            restyle()
            if (url == null) waitForTiles()
        }
    }

    fun show(look: GroundLook) {
        wanted = look
        restyle()
    }

    fun close() {
        waiting?.cancel()
        style = null
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
