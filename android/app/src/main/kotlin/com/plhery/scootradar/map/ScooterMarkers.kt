// The markers' part of ScooterMapView's updateUIView and of its coordinator's map delegate, from
// ios/ScootRadar/Views/ScooterMapView.swift.

package com.plhery.scootradar.map

import android.animation.ValueAnimator
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.Choreographer
import android.view.View
import androidx.core.view.ViewCompat
import com.plhery.scootradar.core.api.ScooterAnalytics
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.isWalking
import com.plhery.scootradar.core.map.mapOrigin
import com.plhery.scootradar.core.map.walkRemainingMetres
import com.plhery.scootradar.core.model.ScooterMapProjection
import com.plhery.scootradar.core.model.ScreenPoint
import kotlin.math.max
import kotlin.math.roundToLong
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.merge
import kotlinx.coroutines.launch
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.MapView
import org.maplibre.android.maps.Style
import org.maplibre.android.style.expressions.Expression
import org.maplibre.android.style.layers.LayoutPropertyValue
import org.maplibre.android.style.layers.PaintPropertyValue
import org.maplibre.android.style.layers.PropertyValue
import org.maplibre.android.style.layers.SymbolLayer
import org.maplibre.android.style.layers.TransitionOptions
import org.maplibre.android.style.sources.GeoJsonOptions
import org.maplibre.android.style.sources.GeoJsonSource

/**
 * The scooters, the bays and the faded markers on MapLibre's map. Once the ground's style is loaded it adds their
 * layers above it; then, whenever the controller's scooters, bays, selection or origin change, and as the map
 * moves, the scene works out the look and the layers draw it. A tap on the map is the scene's to answer, and
 * TalkBack reads the markers through virtual views over the map (ScooterMarkerAccessibility). The few
 * things that move on their own, the dots lighting up, a name coming, the faded markers breathing, are drawn a
 * frame at a time by changing a layer's strength, never by writing the scooters again (MAP-319): those fading
 * alike are drawn meanwhile by a layer of their own, a band, whose strength is one number (MAP-119).
 */
class ScooterMarkers(
    private val map: MapLibreMap,
    private val view: ScooterMapView,
    private val controller: ScooterMapController,
    analytics: ScooterAnalytics?,
    /** The composition's scope. */
    private val scope: CoroutineScope,
    /** The camera's move to what an opened cluster holds. */
    move: (CameraMove) -> Unit,
) {
    private val projection = MapLibreProjection(map, view)
    val art = ScooterMarkerArt(view.pixelRatio, MarkerFonts.of(view.context))
    val scene = ScooterMarkerScene(
        art,
        onSelectionChange = controller::selectScooter,
        onParkingSelectionChange = controller::selectParking,
        track = { name, provider -> analytics?.track(name, provider = provider) },
        move = move,
    )

    private var style: Style? = null
    private var safeArea = MapInsets.zero

    /** The uptime the bands are counted from, in seconds: small numbers. */
    private val epoch = SystemClock.uptimeMillis() / 1000.0

    /** The versions of the scene last written to each source. */
    private var writtenMarkers = -1
    private var writtenPills = -1
    private var writtenLastSeen = -1

    /** The pictures in the style, and those each source draws now. */
    private val images = HashSet<String>()
    private val used = HashMap<String, Set<String>>()

    private var updates: Job? = null
    private var framesWanted = false
    private var breathing: Float? = null

    /** The sources whose markers fade, with the layers drawing them otherwise. */
    private val fadings = listOf(
        Fading(ScooterMarkerLayers.MARKERS_SOURCE, ScooterMarkerLayers.MARKERS, ScooterMarkerLayers.RAISED),
        Fading(ScooterMarkerLayers.PILLS_SOURCE, ScooterMarkerLayers.PILLS, raised = null),
    ).associateBy { it.source }
    private var nextBand = 0

    /**
     * The fades' clock. While the first scooters of a light-up wait for MapLibre to draw them, it stands at the
     * moment they were written; then it runs behind the scene's by as long as they waited, so that every dot
     * lights up from nothing, as the iPhone's views do once they are on screen.
     */
    private var held: Double? = null
    private var holds = 0
    private var late = 0.0

    /** How long the last light-up waited for its scooters to be drawn, in seconds. */
    internal var lightUpLate = 0.0
        private set

    /**
     * What waits for MapLibre to take in what the style has been told: past the main thread's queue, then a frame
     * begun since, and some a frame drawn whole after it.
     */
    private val main = Handler(Looper.getMainLooper())
    private val queued = ArrayList<Pair<Boolean, () -> Unit>>()
    private val begun = ArrayList<() -> Unit>()
    private val frameStarts = MapView.OnWillStartRenderingFrameListener {
        val started = queued.toList()
        queued.clear()
        for ((drawn, action) in started) if (drawn) begun += action else action()
    }
    private val frameEnds = MapView.OnDidFinishRenderingFrameListener { fully, _, _ ->
        if (fully && begun.isNotEmpty()) {
            val drawn = begun.toList()
            begun.clear()
            for (action in drawn) action()
        }
    }

    /**
     * The scooters MapLibre has taken in, on the main thread, laid out from the next frame. Once drawn, they come
     * up from nothing over MapLibre's fade of new symbols, the style's 0.3 s, unseen: the light-up starts then.
     */
    private val sourceChanged = MapView.OnSourceChangedListener { id ->
        if (id != ScooterMarkerLayers.MARKERS_SOURCE || held == null) return@OnSourceChangedListener
        val hold = holds
        whenDrawn {
            main.postDelayed({
                if (holds == hold) release()
                wantFrames()
            }, PLACEMENT_FADE)
        }
    }

    private val markerMap = object : MarkerMap {
        override val projection: ScooterMapProjection get() = this@ScooterMarkers.projection
        override val heading: Double get() = map.cameraPosition.bearing
        override val isShown: Boolean get() = view.isAttachedToWindow && view.windowVisibility == View.VISIBLE
        override val safeTop: Double get() = safeArea.top
    }

    /** TalkBack's virtual views of the markers. */
    private val accessibility = ScooterMarkerAccessibility(view, scene, markerMap, view.pixelRatio) { flush() }

    /** The visible region changing, a frame at a time while the map moves: mapViewDidChangeVisibleRegion. */
    private val moved = MapLibreMap.OnCameraMoveListener {
        // The clusters are made again as the map's whole zoom changes, as the web's are.
        scene.updateClusters(MapZoom.level(on = projection))
        scene.updateLook(markerMap)
        scene.movePills(markerMap)
        flush()
    }

    /** The map at rest: regionDidChange's part for the markers. */
    private val idle = MapLibreMap.OnCameraIdleListener {
        val level = MapZoom.level(on = projection)
        scene.updateClusteringMode(level, markerMap)
        scene.updateClusters(level)
        scene.updateLook(markerMap)
        val written = writtenMarkers
        flush()
        // TalkBack finds the markers where the map came to rest.
        if (writtenMarkers == written) accessibility.refresh()
    }

    private val frame = Choreographer.FrameCallback { onFrame() }

    init {
        map.getStyle { loaded ->
            if (style != null) return@getStyle
            style = loaded
            addLayers(loaded)
            update()
        }
        map.addOnCameraMoveListener(moved)
        map.addOnCameraIdleListener(idle)
        view.tap = { x, y -> tap(x, y) }
        ViewCompat.setAccessibilityDelegate(view, accessibility)
        view.hover = { accessibility.dispatchHoverEvent(it) }
        view.addOnWillStartRenderingFrameListener(frameStarts)
        view.addOnDidFinishRenderingFrameListener(frameEnds)
        view.addOnSourceChangedListener(sourceChanged)
        updates = scope.launch {
            merge(
                controller.mapScootersRevision,
                controller.mapClustersRevision,
                controller.mapLastSeenRevision,
                controller.parking,
                controller.viewport,
                controller.viewportZoom,
                controller.enabledProviders,
                controller.walk,
                controller.selectedScooterID,
                controller.selectedParkingID,
                controller.responseMetadata,
                controller.userLocation,
                controller.searchedDestination,
                controller.language,
            ).collect { update() }
        }
    }

    fun close() {
        updates?.cancel()
        Choreographer.getInstance().removeFrameCallback(frame)
        framesWanted = false
        map.removeOnCameraMoveListener(moved)
        map.removeOnCameraIdleListener(idle)
        view.tap = null
        view.hover = null
        ViewCompat.setAccessibilityDelegate(view, null)
        view.removeOnWillStartRenderingFrameListener(frameStarts)
        view.removeOnDidFinishRenderingFrameListener(frameEnds)
        view.removeOnSourceChangedListener(sourceChanged)
        main.removeCallbacksAndMessages(null)
        queued.clear()
        begun.clear()
        style = null
    }

    /** Dark appearance, and the satellite picture in either appearance, which the dots are drawn for. */
    fun setDark(dark: Boolean) {
        if (scene.isDark == dark) return
        scene.isDark = dark
        update()
    }

    /** The safe area, whose top the names stay below. */
    fun safeAreaDidChange(insets: MapInsets) {
        if (insets == safeArea) return
        safeArea = insets
        scene.movePills(markerMap)
        flush()
    }

    /** What updateUIView does for the markers, in its order. */
    private fun update() {
        if (style == null) return
        scene.parent = MarkerParent(
            origin = controller.mapOrigin,
            walkRemainingMetres = controller.walkRemainingMetres,
            isWalking = controller.isWalking,
            usesServerClusters = controller.responseMetadata.value?.mode == "clusters",
            language = controller.language.value,
            userLocation = controller.userLocation.value,
        )
        val level = MapZoom.level(on = projection)
        scene.updateClusteringMode(level, markerMap)
        val added = scene.reconcile(controller.mapScooters.value, controller.mapScootersRevision.value)
        scene.reconcileClusters(controller.mapClusters.value, controller.mapClustersRevision.value)
        scene.reconcileLastSeen(controller.mapLastSeenScooters.value, controller.mapLastSeenClusters.value, controller.mapLastSeenRevision.value)
        scene.reconcileParking(controller.mapParking)
        scene.applySelection(controller.selectedScooterID.value, markerMap)
        scene.applyParkingSelection(controller.selectedParkingID.value)
        scene.updateClusters(level)
        scene.updateLook(markerMap)
        // MapKit hands the new views over once they are added.
        scene.lightUp(added, markerMap)
        // The dock may have grown over a name.
        scene.movePills(markerMap)
        flush()
    }

    /** A tap answered as the finger lifts, at a point of the view in pixels. */
    private fun tap(x: Float, y: Float) {
        val ratio = view.pixelRatio.toDouble()
        scene.tap(ScreenPoint(x / ratio, y / ratio), markerMap)
        flush()
    }

    /** Writes each source whose marks changed, with the pictures it needs, and starts what moves on its own. */
    private fun flush() {
        val style = style ?: return
        if (scene.markersVersion != writtenMarkers) {
            writtenMarkers = scene.markersVersion
            write(style, ScooterMarkerLayers.MARKERS_SOURCE, MarkerFeatures.markers(scene, art))
            // What TalkBack reads of them, and where, may have changed with them.
            accessibility.refresh()
        }
        if (scene.pillsVersion != writtenPills) {
            writtenPills = scene.pillsVersion
            write(style, ScooterMarkerLayers.PILLS_SOURCE, MarkerFeatures.pills(scene, art))
        }
        if (scene.lastSeenVersion != writtenLastSeen) {
            writtenLastSeen = scene.lastSeenVersion
            write(style, ScooterMarkerLayers.LAST_SEEN_SOURCE, MarkerFeatures.lastSeen(scene, art))
        }
        wantFrames()
    }

    private fun write(style: Style, source: String, features: List<MarkerFeature>) {
        val needed = HashMap<String, android.graphics.Bitmap>()
        val names = HashSet<String>(features.size)
        for (feature in features) {
            names += feature.image
            if (feature.image !in images && feature.image !in needed) needed[feature.image] = feature.picture()
        }
        if (needed.isNotEmpty()) {
            style.addImages(needed)
            images += needed.keys
        }
        used[source] = names
        // Zooming through every scale draws many sizes; the style does not keep them all (MAP-247).
        if (images.size > MOST_IMAGES) {
            val inUse = used.values.flatMapTo(HashSet()) { it }
            val unused = images.filter { it !in inUse }
            for (name in unused) style.removeImage(name)
            images.removeAll(unused.toSet())
        }
        val bands = fadings[source]?.let { fading ->
            val now = SystemClock.uptimeMillis() / 1000.0
            // The first dots of a light-up are held until they are drawn.
            if (source == ScooterMarkerLayers.MARKERS_SOURCE && held == null && fadings.values.none { it.isFading }) {
                late = 0.0
                if (features.any { MarkerBand.of(it, epoch, now - epoch) != null }) hold(now)
            }
            fading.assign(style, features, fadeTime(now))
        }
        // A band's layer draws its markers in the order they are written in.
        val written = if (bands.isNullOrEmpty()) features else features.sortedBy { it.sortKey }
        style.getSourceAs<GeoJsonSource>(source)?.setGeoJson(MarkerFeatures.json(written, bands.orEmpty()))
    }

    private fun addLayers(style: Style) {
        style.addSource(GeoJsonSource(ScooterMarkerLayers.LAST_SEEN_SOURCE))
        style.addSource(GeoJsonSource(ScooterMarkerLayers.MARKERS_SOURCE))
        // The names are few and move with their dots: written at once, they are never a frame behind them.
        style.addSource(GeoJsonSource(ScooterMarkerLayers.PILLS_SOURCE, GeoJsonOptions().withSynchronousUpdate(true)))
        style.addSource(GeoJsonSource(ScooterMarkerLayers.RIDER_SOURCE))
        for (spec in ScooterMarkerLayers.specs) addLayer(style, spec)
    }

    private fun addLayer(style: Style, spec: SymbolLayerSpec, below: String? = null) {
        val layer = SymbolLayer(spec.id, spec.source)
        spec.filter?.let { layer.setFilter(Expression.raw(it)) }
        val properties = spec.layout.map { (name, value) -> LayoutPropertyValue(name, value(value)) } +
            spec.paint.map { (name, value) -> PaintPropertyValue(name, value(value)) }
        layer.setProperties(*properties.toTypedArray<PropertyValue<*>>())
        // A strength set each frame is shown at once, not eased over the style's 0.3 s.
        layer.iconOpacityTransition = TransitionOptions(0, 0)
        if (below == null) style.addLayer(layer) else style.addLayerBelow(layer, below)
    }

    private fun value(value: Any): Any = when (value) {
        is SymbolLayerSpec.Json -> Expression.raw(value.text)
        is Double -> value.toFloat()
        else -> value
    }

    // Frames

    /**
     * Sets what moves on its own as it is at this moment, and asks for the next frame while anything still moves.
     * A fade's strength is set with the features that carry it, so that none shows whole for a frame first.
     */
    private fun wantFrames() {
        val style = style ?: return
        if (drawFrame(style) && !framesWanted) {
            framesWanted = true
            Choreographer.getInstance().postFrameCallback(frame)
        }
    }

    private fun onFrame() {
        framesWanted = false
        wantFrames()
    }

    /** The faded markers breathe while there are some, on screen, with animations on. */
    private fun breathes(): Boolean = scene.lastSeen.isNotEmpty() && ValueAnimator.areAnimatorsEnabled() && markerMap.isShown

    /** A frame of the fades and of the breath. Returns whether anything still moves. */
    private fun drawFrame(style: Style): Boolean {
        val now = SystemClock.uptimeMillis() / 1000.0
        held?.let { if (now - it > MOST_HELD) release() }
        val time = fadeTime(now)
        var fades = false
        for (fading in fadings.values) fades = fading.frame(style, time) || fades
        if (!fades && held == null) late = 0.0
        val breathes = breathes()
        val strength = LastSeenBreath.strength(at = now, animates = breathes)
        if (strength != breathing) {
            breathing = strength
            style.getLayer(ScooterMarkerLayers.LAST_SEEN)?.setProperties(PaintPropertyValue("icon-opacity", strength))
        }
        return fades || breathes
    }

    /** The fades' clock, in seconds from the epoch. */
    private fun fadeTime(now: Double): Double = (held ?: (now - late)) - epoch

    private fun hold(now: Double) {
        held = now
        holds += 1
    }

    /** The light-up's scooters are drawn, or have been waited for long enough: their fades start. */
    private fun release() {
        val since = held ?: return
        late = SystemClock.uptimeMillis() / 1000.0 - since
        lightUpLate = late
        held = null
        val style = style ?: return
        for (fading in fadings.values) fading.release(style)
    }

    /** Runs an action once MapLibre has begun a frame after it was asked for. */
    private fun whenBegun(action: () -> Unit) {
        main.post { queued += false to action }
    }

    /** Runs an action once MapLibre has drawn, with every tile laid out, a frame begun after it was asked for. */
    private fun whenDrawn(action: () -> Unit) {
        main.post { queued += true to action }
    }

    /**
     * A source's fading markers: each band's layer, over the source's own layers, which leave its markers to it
     * meanwhile. Once every band's fade is over, the markers are handed back to the source's layers, which kept
     * them in their places all along; the bands' layers, drawing nothing, are taken out once MapLibre has drawn
     * them back.
     */
    private inner class Fading(val source: String, val layer: String, val raised: String?) {
        private val bands = HashMap<MarkerBand, Band>()
        private var besideBands = false

        val isFading: Boolean get() = bands.isNotEmpty()

        /** Puts each marker fading at [time] in its band, adding the bands' layers it needs. */
        fun assign(style: Style, features: List<MarkerFeature>, time: Double): Map<MarkerFeature, Int> {
            val keys = HashMap<MarkerFeature, MarkerBand>()
            for (feature in features) MarkerBand.of(feature, epoch, time)?.let { keys[feature] = it }
            if (keys.isEmpty()) return emptyMap()
            if (!besideBands) {
                besideBands = true
                beside(style, ScooterMarkerLayers.STRENGTH_BESIDE_BANDS, ScooterMarkerLayers.SORT_BESIDE_BANDS)
            }
            val added = keys.entries.filter { it.value !in bands }.groupBy({ it.value }, { it.key })
            for ((key, members) in added) {
                val base = if (key.isRaised && raised != null) raised else layer
                val index = nextBand++
                val spec = ScooterMarkerLayers.band(base, index)
                val sortKey = members.map { it.sortKey.toDouble() }.average().toFloat()
                addLayer(style, spec, below = ScooterMarkerLayers.below(base, sortKey, bands.values.map { it.layer }))
                val band = Band(index, MarkerBand.Layer(spec.id, base, sortKey))
                bands[key] = band
                // MapLibre eases a band from nothing once it has taken it in at nothing.
                if (key.eased != null && held == null) whenBegun { ease(style, key, band) }
            }
            return keys.mapValues { bands.getValue(it.value).index }
        }

        /** The light-up's scooters are drawn: MapLibre eases their bands from now. */
        fun release(style: Style) {
            for ((key, band) in bands) if (key.eased != null) ease(style, key, band)
        }

        /** Has MapLibre ease a band to its strength from its start, in one change of its layer. */
        private fun ease(style: Style, key: MarkerBand, band: Band) {
            if (band.eased || bands[key] !== band || this@ScooterMarkers.style !== style) return
            band.eased = true
            val eased = key.eased ?: return
            val delay = max(0.0, key.start * MarkerBand.STEP - fadeTime(SystemClock.uptimeMillis() / 1000.0))
            val layer = style.getLayer(band.layer.id) as? SymbolLayer ?: return
            layer.iconOpacityTransition = TransitionOptions((eased * 1000).roundToLong(), (delay * 1000).roundToLong())
            layer.setProperties(PaintPropertyValue("icon-opacity", key.opacity))
        }

        /** Sets each band's strength at [time], and hands the markers back once all are over. Returns whether any fades. */
        fun frame(style: Style, time: Double): Boolean {
            if (bands.isEmpty()) return false
            for ((key, band) in bands) {
                if (key.eased != null) continue
                val opacity = key.opacity(time)
                if (opacity == band.opacity) continue
                band.opacity = opacity
                style.getLayer(band.layer.id)?.setProperties(PaintPropertyValue("icon-opacity", opacity))
            }
            if (bands.keys.any { !it.isOver(time) }) return true
            // In the same layout, the markers come back to the source's layers and leave the bands'.
            beside(style, ScooterMarkerLayers.STRENGTH, ScooterMarkerLayers.SORT)
            besideBands = false
            val emptied = bands.values.map { it.layer.id }
            for (id in emptied) (style.getLayer(id) as? SymbolLayer)?.setFilter(Expression.raw(ScooterMarkerLayers.NOTHING))
            bands.clear()
            whenDrawn { if (this@ScooterMarkers.style === style) for (id in emptied) style.removeLayer(id) }
            return false
        }

        /** The strength and the order of the source's own layers. */
        private fun beside(style: Style, strength: String, sort: String) {
            for (id in listOfNotNull(layer, raised)) {
                style.getLayer(id)?.setProperties(
                    PaintPropertyValue("icon-opacity", Expression.raw(strength)),
                    LayoutPropertyValue("symbol-sort-key", Expression.raw(sort)),
                )
            }
        }
    }

    /** A band's layer, and the strength it was last given, or whether MapLibre was given its ease. */
    private class Band(val index: Int, val layer: MarkerBand.Layer) {
        var opacity = MarkerBand.FAINTEST
        var eased = false
    }

    companion object {
        /** The pictures the style keeps before those no layer draws are taken out. */
        private const val MOST_IMAGES = 600

        /** The longest the light-up waits for its scooters to be drawn and faded in by MapLibre, in seconds. */
        private const val MOST_HELD = 1.5

        /** MapLibre's fade of new symbols, the style's default transition, in ms. */
        private const val PLACEMENT_FADE = 300L
    }
}
