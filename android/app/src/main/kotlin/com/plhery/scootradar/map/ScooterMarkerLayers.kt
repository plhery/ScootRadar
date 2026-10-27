// The annotation views of ios/ScootRadar/Views/ScooterMapView.swift (ScooterAnnotationView, ScooterLastSeenView,
// the bays' MKMarkerAnnotationView) as MapLibre's symbol layers.

package com.plhery.scootradar.map

import android.graphics.Bitmap
import androidx.compose.animation.core.CubicBezierEasing
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterDotState
import com.plhery.scootradar.core.model.ScreenPoint

/**
 * What a layer draws of a marker: a picture at a coordinate, moved on screen by an offset in points, drawn above
 * those with a lower sort key, at a strength, maybe coming up from nothing.
 */
class MarkerFeature(
    val id: String,
    val coordinate: GeoPoint,
    /** The picture's name in the style, and how to draw it the first time it is needed. */
    val image: String,
    val picture: () -> Bitmap,
    val offset: ScreenPoint = ScreenPoint.zero,
    val sortKey: Float = 0f,
    val opacity: Double = 1.0,
    val fade: MarkerFade? = null,
    /** In the layer above the others: a selected scooter or bay, which no neighbour may cover. */
    val isRaised: Boolean = false,
)

/** What each layer draws, from the scene's marks: the iPhone's annotation views, drawn by MapLibre. */
object MarkerFeatures {
    /** The dots and the bays. */
    fun markers(scene: ScooterMarkerScene, art: ScooterMarkerArt): List<MarkerFeature> {
        val features = ArrayList<MarkerFeature>(scene.marks.size + scene.parking.size)
        for (mark in scene.drawnMarks()) features += dot(mark, art)
        for (bay in scene.parking) {
            val isSelected = bay.id == scene.appliedParkingID
            val key = ScooterMarkerArt.BayKey(bay.providerInfo, isSelected)
            features += MarkerFeature(
                id = "p:${bay.id}",
                coordinate = bay.coordinate,
                image = key.id,
                picture = { art.bayImage(key) },
                // MKAnnotationViewZPriority's defaultUnselected and defaultSelected.
                sortKey = if (isSelected) 1000f else 500f,
                isRaised = isSelected,
            )
        }
        return features
    }

    /** The dot of a scooter, with its ring and its glow, where its spread puts it. */
    fun dot(mark: ScooterMark, art: ScooterMarkerArt): MarkerFeature {
        val key = mark.art
        return MarkerFeature(
            id = "v:${mark.scooter.id}",
            coordinate = mark.scooter.coordinate,
            image = key.id,
            picture = { art.image(key) },
            offset = mark.look.offset,
            sortKey = mark.look.zPriority,
            opacity = mark.look.strength,
            fade = mark.dotFade,
            isRaised = mark.look.state == ScooterDotState.Selected,
        )
    }

    /** The names shown, in the order they are placed. */
    fun pills(scene: ScooterMarkerScene, art: ScooterMarkerArt): List<MarkerFeature> =
        scene.namedIDs.mapNotNull { id -> scene.mark(id)?.let { pill(it, art) } }

    /**
     * The name beside a dot, while it is shown, where its side puts it from the dot: the picture's frame is
     * [ScooterMarkerArt.PILL_MARGIN] in from its edges, for the shadow.
     */
    fun pill(mark: ScooterMark, art: ScooterMarkerArt): MarkerFeature? {
        val content = mark.shownPill ?: return null
        return MarkerFeature(
            id = "n:${mark.scooter.id}",
            coordinate = mark.scooter.coordinate,
            image = content.id,
            picture = { art.pillImage(content) },
            offset = ScreenPoint(
                mark.look.offset.x + mark.pillOrigin.x - ScooterMarkerArt.PILL_MARGIN,
                mark.look.offset.y + mark.pillOrigin.y - ScooterMarkerArt.PILL_MARGIN,
            ),
            sortKey = mark.look.zPriority,
            fade = mark.pillFade,
        )
    }

    /** The faded markers: a small dot for a scooter, a dashed ring with its number for a group. */
    fun lastSeen(scene: ScooterMarkerScene, art: ScooterMarkerArt): List<MarkerFeature> = scene.lastSeen.map { mark ->
        when (val kind = mark.mark) {
            is LastSeenMark.Kind.Single -> {
                val key = ScooterMarkerArt.LastSeenKey(kind.provider, scene.isDark)
                MarkerFeature(mark.id, mark.coordinate, key.id, { art.lastSeenImage(key) })
            }
            is LastSeenMark.Kind.Group -> {
                val key = ScooterMarkerArt.ClusterKey(kind.provider, ScooterMarkerScene.clusterDiameter(kind.count), scene.isDark, "${kind.count}")
                MarkerFeature(mark.id, mark.coordinate, key.lastSeenID, { art.lastSeenClusterImage(key) })
            }
        }
    }

    /**
     * The features as GeoJSON, written by hand: thousands of scooters go to MapLibre as one string rather than as
     * thousands of objects. Fades are counted from [epoch] on the uptime clock.
     */
    fun json(features: List<MarkerFeature>, epoch: Double): String = buildString(features.size * 200 + 40) {
        append("{\"type\":\"FeatureCollection\",\"features\":[")
        for ((index, feature) in features.withIndex()) {
            if (index > 0) append(',')
            append("{\"type\":\"Feature\",\"id\":")
            string(feature.id)
            append(",\"geometry\":{\"type\":\"Point\",\"coordinates\":[")
            number(GeoBounds.wrapped(feature.coordinate.longitude))
            append(',')
            number(feature.coordinate.latitude)
            append("]},\"properties\":{\"image\":")
            string(feature.image)
            append(",\"offset\":[")
            number(feature.offset.x)
            append(',')
            number(feature.offset.y)
            append("],\"sort\":")
            number(feature.sortKey.toDouble())
            append(",\"opacity\":")
            number(feature.opacity)
            if (feature.isRaised) append(",\"raised\":true")
            feature.fade?.let { fade ->
                append(",\"from\":")
                number(fade.from - epoch)
                append(",\"length\":")
                number(fade.length)
                append(",\"curve\":")
                append(fade.curve.ordinal)
            }
            append("}}")
        }
        append("]}")
    }

    private fun StringBuilder.number(value: Double) {
        append(if (value.isFinite()) value.toString() else "0")
    }

    private fun StringBuilder.string(text: String) {
        append('"')
        for (character in text) {
            when {
                character == '"' -> append("\\\"")
                character == '\\' -> append("\\\\")
                character < ' ' -> append("\\u").append(character.code.toString(16).padStart(4, '0'))
                else -> append(character)
            }
        }
        append('"')
    }
}

/** A symbol layer as data, as MapLibre is given it: what the tests read without a map. */
data class SymbolLayerSpec(
    val id: String,
    val source: String,
    /** An expression in the style's JSON. */
    val filter: String? = null,
    /** Values are booleans, numbers, words, or [Json] expressions. */
    val layout: Map<String, Any>,
    val paint: Map<String, Any>,
) {
    /** An expression, written in the style's JSON. */
    data class Json(val text: String)
}

/**
 * The markers' layers, above the whole ground, bottom to top: the faded markers under everything (MKAnnotation's
 * zPriority min), the dots and the bays in the order of their zPriority, the selected one above them, the names,
 * and the rider above all (prioritizeUserLocationView). Every one keeps every marker, overlapping or not: MapKit's
 * required display priority, without collisions (MAP-267).
 */
object ScooterMarkerLayers {
    const val LAST_SEEN = "scooters-last-seen"
    const val MARKERS = "scooters"
    const val RAISED = "scooters-selected"
    const val PILLS = "scooter-names"
    const val RIDER = "rider"

    const val LAST_SEEN_SOURCE = "scooters-last-seen"
    const val MARKERS_SOURCE = "scooters"
    const val PILLS_SOURCE = "scooter-names"

    /** A stand-in until the location lane draws the rider (MAP-186): an empty layer, above every marker. */
    const val RIDER_SOURCE = "rider"

    /** The dots' strength; the time-driven fades are written over it while they run. */
    const val STRENGTH = "[\"get\",\"opacity\"]"

    val order = listOf(LAST_SEEN, MARKERS, RAISED, PILLS, RIDER)

    /** What every marker layer shares: a picture of its own at its place, never hidden, never turned or tilted. */
    private fun pictures(anchor: String) = mapOf(
        "icon-image" to SymbolLayerSpec.Json("[\"get\",\"image\"]"),
        "icon-anchor" to anchor,
        "icon-offset" to SymbolLayerSpec.Json("[\"get\",\"offset\"]"),
        "icon-allow-overlap" to true,
        "icon-ignore-placement" to true,
        "icon-rotation-alignment" to "viewport",
        "icon-pitch-alignment" to "viewport",
        "symbol-sort-key" to SymbolLayerSpec.Json("[\"get\",\"sort\"]"),
    )

    val specs: List<SymbolLayerSpec> = listOf(
        SymbolLayerSpec(LAST_SEEN, LAST_SEEN_SOURCE, layout = pictures("center"), paint = mapOf("icon-opacity" to LastSeenBreath.STILL)),
        SymbolLayerSpec(
            MARKERS,
            MARKERS_SOURCE,
            filter = "[\"!\",[\"has\",\"raised\"]]",
            layout = pictures("center"),
            paint = mapOf("icon-opacity" to SymbolLayerSpec.Json(STRENGTH)),
        ),
        SymbolLayerSpec(
            RAISED,
            MARKERS_SOURCE,
            filter = "[\"has\",\"raised\"]",
            layout = pictures("center"),
            paint = mapOf("icon-opacity" to SymbolLayerSpec.Json(STRENGTH)),
        ),
        SymbolLayerSpec(PILLS, PILLS_SOURCE, layout = pictures("top-left"), paint = mapOf("icon-opacity" to SymbolLayerSpec.Json(STRENGTH))),
        SymbolLayerSpec(RIDER, RIDER_SOURCE, layout = pictures("center"), paint = emptyMap()),
    )

    /**
     * The strength of each marker while fades run, at [time] seconds from the epoch the features count from: it
     * comes up from nothing along its curve from its start, and is whole once its fade is over or without one.
     */
    fun fadingStrength(time: Double): String {
        val progress = "[\"/\",[\"-\",$time,[\"get\",\"from\"]],[\"get\",\"length\"]]"
        fun along(curve: String) = "[\"interpolate\",$curve,$progress,0,0,1,1]"
        val lightUp = along("[\"cubic-bezier\",0.22,1,0.36,1]")
        val eased = along("[\"cubic-bezier\",0.42,0,0.58,1]")
        val linear = along("[\"linear\"]")
        return "[\"*\",$STRENGTH,[\"case\",[\"has\",\"from\"],[\"match\",[\"get\",\"curve\"]," +
            "${MarkerFade.Curve.LightUp.ordinal},$lightUp,${MarkerFade.Curve.EaseInEaseOut.ordinal},$eased,$linear],1]]"
    }
}

/**
 * The faded markers breathe between two strengths, one way in 1.6 s and back, eased, every one in step with the
 * others whenever it appeared, as on the web; with Remove animations they stand still (ScooterLastSeenView).
 */
object LastSeenBreath {
    const val FAINTEST = 0.35f
    const val STRONGEST = 0.65f
    const val BREATH = 1.6
    const val STILL = 0.5f

    private val easeInEaseOut = CubicBezierEasing(0.42f, 0f, 0.58f, 1f)

    /** The strength at a moment of the uptime clock, in seconds: the breath begins at each multiple of 3.2 s. */
    fun strength(at: Double, animates: Boolean): Float {
        if (!animates) return STILL
        val phase = ((at % (2 * BREATH)) + 2 * BREATH) % (2 * BREATH)
        val way = if (phase < BREATH) phase / BREATH else (2 * BREATH - phase) / BREATH
        return FAINTEST + (STRONGEST - FAINTEST) * easeInEaseOut.transform(way.toFloat())
    }
}
