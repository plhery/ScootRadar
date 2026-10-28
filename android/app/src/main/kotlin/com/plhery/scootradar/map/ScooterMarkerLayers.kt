// The annotation views of ios/ScootRadar/Views/ScooterMapView.swift (ScooterAnnotationView, ScooterLastSeenView,
// the bays' MKMarkerAnnotationView) as MapLibre's symbol layers.

package com.plhery.scootradar.map

import android.graphics.Bitmap
import androidx.compose.animation.core.CubicBezierEasing
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterDotState
import com.plhery.scootradar.core.model.ScreenPoint
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.roundToInt
import kotlin.math.roundToLong

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
    /** The dots, the bays and the clusters. */
    fun markers(scene: ScooterMarkerScene, art: ScooterMarkerArt): List<MarkerFeature> {
        val clusters = scene.clusters()
        val features = ArrayList<MarkerFeature>(scene.marks.size + scene.parking.size + clusters.size)
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
        for (cluster in clusters) features += cluster(cluster, scene.isDark, art)
        scene.destination?.let { place ->
            val isDark = scene.isDark
            features += MarkerFeature(
                id = "a:${place.point.latitude}:${place.point.longitude}",
                coordinate = place.point,
                image = "address/${if (isDark) 1 else 0}",
                picture = { art.addressImage(isDark) },
                // MKAnnotationViewZPriority's defaultUnselected (MAP-124, MAP-125).
                sortKey = 500f,
            )
        }
        return features
    }

    /** A cluster's disc, glowing in its leading provider's colour, with its number written in it. */
    fun cluster(cluster: ClusterMark, isDark: Boolean, art: ScooterMarkerArt): MarkerFeature {
        val key = ScooterMarkerArt.ClusterKey(cluster.provider, cluster.diameter, isDark, "${cluster.cluster.count}")
        return MarkerFeature(
            id = (if (cluster.isServer) "g:" else "c:") + cluster.id,
            coordinate = cluster.cluster.coordinate,
            image = key.id,
            picture = { art.clusterImage(key) },
            sortKey = cluster.sortKey,
        )
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
     * thousands of objects. Those fading carry the index of their band, whose layer draws them meanwhile.
     */
    fun json(features: List<MarkerFeature>, bands: Map<MarkerFeature, Int> = emptyMap()): String = buildString(features.size * 200 + 40) {
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
            bands[feature]?.let { append(",\"band\":").append(it) }
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

    /** The rider's accuracy halo, compass beam and white ring, under its blue dot, [RIDER] (ScooterRider). */
    const val RIDER_HALO = "rider-halo"
    const val RIDER_BEAM = "rider-beam"
    const val RIDER_RING = "rider-ring"
    const val RIDER = "rider"

    const val LAST_SEEN_SOURCE = "scooters-last-seen"
    const val MARKERS_SOURCE = "scooters"
    const val PILLS_SOURCE = "scooter-names"

    /** Where the rider is, while the controller knows (MAP-186): one point, or none. */
    const val RIDER_SOURCE = "rider"

    /** The dots' strength. */
    const val STRENGTH = "[\"get\",\"opacity\"]"

    /** The order they are drawn in: MapLibre draws each sort key on its own. */
    const val SORT = "[\"get\",\"sort\"]"

    /**
     * Their strength and their order while bands fade: those of a band are drawn by its layer, and kept here in
     * their places, unseen, drawn together.
     */
    const val STRENGTH_BESIDE_BANDS = "[\"case\",[\"has\",\"band\"],0,$STRENGTH]"
    const val SORT_BESIDE_BANDS = "[\"case\",[\"has\",\"band\"],-1,$SORT]"

    /** A band's filter once its markers are handed back to their layer, until its own is taken out. */
    const val NOTHING = "[\"boolean\",false]"

    /** The rider's layers, bottom to top, which ScooterRider adds above the markers'. */
    val riderLayers = listOf(RIDER_HALO, RIDER_BEAM, RIDER_RING, RIDER)

    val order = listOf(LAST_SEEN, MARKERS, RAISED, PILLS) + riderLayers

    /** What every marker layer shares: a picture of its own at its place, never hidden, never turned or tilted. */
    private fun pictures(anchor: String) = mapOf(
        "icon-image" to SymbolLayerSpec.Json("[\"get\",\"image\"]"),
        "icon-anchor" to anchor,
        "icon-offset" to SymbolLayerSpec.Json("[\"get\",\"offset\"]"),
        "icon-allow-overlap" to true,
        "icon-ignore-placement" to true,
        "icon-rotation-alignment" to "viewport",
        "icon-pitch-alignment" to "viewport",
        "symbol-sort-key" to SymbolLayerSpec.Json(SORT),
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
    )

    /**
     * The layer drawing a band of [base]'s markers while they fade: the same pictures, those of the band alone, at
     * one strength for all of them, [opacity] to start with. They are drawn in the order they are written in, all
     * together, not each on its own by its sort key.
     */
    fun band(base: String, index: Int, opacity: Float = MarkerBand.FAINTEST): SymbolLayerSpec {
        val layer = specs.first { it.id == base }
        return SymbolLayerSpec(
            id = "$base-band-$index",
            source = layer.source,
            filter = "[\"==\",[\"get\",\"band\"],$index]",
            layout = layer.layout - "symbol-sort-key" + ("symbol-z-order" to "source"),
            paint = mapOf("icon-opacity" to opacity),
        )
    }

    /**
     * The layer a band's goes under: the lowest of its base's bands whose markers sort above its own, else the
     * base layer above its base. A band's markers are drawn over its base's, and in the order of their sort keys
     * among the other bands.
     */
    fun below(base: String, sortKey: Float, bands: List<MarkerBand.Layer>): String =
        bands.filter { it.base == base && it.sortKey > sortKey }.minByOrNull { it.sortKey }?.id
            ?: order[order.indexOf(base) + 1]
}

/**
 * The markers that fade alike: their fades start within the same [STEP] and run alike, and their strengths are the
 * same to [STRENGTH_STEP]. A band is drawn by a layer of its own whose strength is one number, so that a fade never
 * asks MapLibre to lay the scooters out again, as a strength read off each marker and changing with time would at
 * every frame (MAP-119). The dots' bands are eased by MapLibre itself, their layers changed once.
 */
data class MarkerBand(
    /** Its start, in steps from the epoch the bands are counted from: no marker's fade starts after it. */
    val start: Int,
    /** Its strength once faded in, in steps. */
    val strength: Int,
    val length: Double,
    val curve: MarkerFade.Curve,
    val isRaised: Boolean,
) {
    /** A band's layer, under its base layer's next, among the bands of its base by its markers' sort keys. */
    data class Layer(val id: String, val base: String, val sortKey: Float)

    /** Its strength at [time] seconds from the epoch: from nothing at its start to its own at its end. */
    fun opacity(time: Double): Float {
        val progress = ((time - start * STEP) / length).coerceIn(0.0, 1.0).toFloat()
        val easing = when (curve) {
            MarkerFade.Curve.LightUp -> lightUp
            MarkerFade.Curve.EaseInEaseOut -> easeInEaseOut
            MarkerFade.Curve.Linear -> null
        }
        return max(FAINTEST, opacity * (easing?.transform(progress) ?: progress))
    }

    fun isOver(time: Double): Boolean = time >= start * STEP + length

    /** Its strength once faded in. */
    val opacity: Float get() = (strength * STRENGTH_STEP).toFloat()

    /**
     * How long MapLibre's own ease takes to follow its curve, when it can: then MapLibre eases the band from
     * nothing to its strength, and its layer is changed once, not at every frame, which would have MapLibre make
     * its pictures again each time.
     */
    val eased: Double? get() = if (curve == MarkerFade.Curve.LightUp) length * EASED_LIGHT_UP else null

    companion object {
        /** A twentieth of a second: three frames of a phone's sixty a second. */
        const val STEP = 0.05
        const val STRENGTH_STEP = 0.05

        /**
         * A band's least strength, unseen: at none, MapLibre would stop drawing its layer, and lay it out again to
         * draw it once more.
         */
        const val FAINTEST = 0.001f

        /**
         * MapLibre's transitions ease along (0, 0, 0.25, 1): over 0.37 s, the iPhone's light-up, (0.22, 1, 0.36, 1)
         * over 0.62 s, to within 2.5 %.
         */
        const val EASED_LIGHT_UP = 0.37 / 0.62

        private val lightUp = CubicBezierEasing(0.22f, 1f, 0.36f, 1f)
        private val easeInEaseOut = CubicBezierEasing(0.42f, 0f, 0.58f, 1f)

        /** The band of a marker fading at [time] seconds from the epoch, or none once its fade is over. */
        fun of(feature: MarkerFeature, epoch: Double, time: Double): MarkerBand? {
            val fade = feature.fade ?: return null
            if (fade.from + fade.length - epoch <= time) return null
            return MarkerBand(
                start = ceil((fade.from - epoch) / STEP - 1e-6).toInt(),
                strength = (feature.opacity / STRENGTH_STEP).roundToInt(),
                length = fade.length,
                curve = fade.curve,
                isRaised = feature.isRaised,
            )
        }
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

/**
 * A source's markers while they fade: the band drawing each, and the bands' layers, over the source's own [layer]
 * and, for the selected, its [raised] one. Kept apart from the style, so that what MapLibre is told can be checked
 * off the phone.
 */
class MarkerBands(private val layer: String, private val raised: String?) {
    /** A band and its layer, under [below]: the strength it was last given, and whether MapLibre has its ease. */
    class Band(val key: MarkerBand, val index: Int, val spec: SymbolLayerSpec, val layer: MarkerBand.Layer, val below: String, opacity: Float) {
        var opacity = opacity
            internal set
        var isEased = false
            internal set
    }

    /** MapLibre's ease of a band's layer, from what it shows to [opacity]: after a delay, over a length, in ms. */
    data class Ease(val length: Long, val delay: Long, val opacity: Float)

    private val bands = HashMap<MarkerBand, Band>()
    private var next = 0

    val all: Collection<Band> get() = bands.values

    val isFading: Boolean get() = bands.isNotEmpty()

    /**
     * Puts each marker fading at [time] seconds from [epoch] in its band, adding the bands it needs: returns the band
     * of each, and those added. A band starts where its curve has got to. One added after its start is for markers
     * whose strength or layer changed mid-fade, a dot selected or a rider come closer, and they go on from there, as
     * the iPhone's animation goes on to a view's new strength rather than starting again (MAP-119).
     */
    fun assign(features: List<MarkerFeature>, epoch: Double, time: Double): Pair<Map<MarkerFeature, Band>, List<Band>> {
        val keys = HashMap<MarkerFeature, MarkerBand>()
        for (feature in features) MarkerBand.of(feature, epoch, time)?.let { keys[feature] = it }
        val added = ArrayList<Band>()
        for ((key, members) in keys.entries.filter { it.value !in bands }.groupBy({ it.value }, { it.key })) {
            val base = if (key.isRaised && raised != null) raised else layer
            val index = next++
            val opacity = key.opacity(time)
            val spec = ScooterMarkerLayers.band(base, index, opacity)
            val sortKey = members.map { it.sortKey.toDouble() }.average().toFloat()
            val below = ScooterMarkerLayers.below(base, sortKey, bands.values.map { it.layer })
            val band = Band(key, index, spec, MarkerBand.Layer(spec.id, base, sortKey), below, opacity)
            bands[key] = band
            added += band
        }
        return keys.mapValues { bands.getValue(it.value) } to added
    }

    /**
     * MapLibre's ease of a band, seen at [time]: from what its layer shows, from its start or from now if that has
     * passed, to its strength by the end of its curve. None for a band set at each frame, eased already, or gone.
     */
    fun ease(band: Band, time: Double): Ease? {
        val length = band.key.eased ?: return null
        if (band.isEased || bands[band.key] !== band) return null
        band.isEased = true
        val start = band.key.start * MarkerBand.STEP
        val left = max(0.0, start + length - max(start, time))
        return Ease((left * 1000).roundToLong(), (max(0.0, start - time) * 1000).roundToLong(), band.key.opacity)
    }

    /** Gives each band set at each frame its strength at [time]: returns those whose strength changed. */
    fun frame(time: Double): List<Band> = bands.values.filter { band ->
        if (band.key.eased != null) return@filter false
        val opacity = band.key.opacity(time)
        if (opacity == band.opacity) return@filter false
        band.opacity = opacity
        true
    }

    fun isOver(time: Double): Boolean = bands.keys.all { it.isOver(time) }

    /** Hands every band's markers back to the source's layers: returns the bands, whose layers draw nothing now. */
    fun clear(): List<Band> = bands.values.toList().also { bands.clear() }
}
