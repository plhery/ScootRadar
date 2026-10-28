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
import org.maplibre.android.tile.TileOperation

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
    private var chrome = MapChrome()

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
        listen()
    }
    private val frameEnds = MapView.OnDidFinishRenderingFrameListener { fully, _, _ ->
        if (fully && begun.isNotEmpty()) {
            val drawn = begun.toList()
            begun.clear()
            for (action in drawn) action()
        }
        listen()
    }

    /** Whether MapLibre's frames are listened to: only while something waits for them, never at rest. */
    private var listening = false

    /**
     * The scooters' tiles MapLibre is laying out while a light-up is held. MapLibre shows a source's new symbols at
     * once, with no fade of their own, so the light-up starts once their tiles are laid out: drawn from the next
     * frame. A frame drawn whole does not say so: the tiles take the new scooters in a while after the source has
     * changed, each on its own, after a layout of the old ones for the new bands, and the frames between are
     * whole. The tiles say when each starts and ends a layout: the light-up waits for those laid out for the
     * bands to start on the new scooters, then for none to be left.
     */
    private val laying = HashSet<String>()

    /** The tiles that have started a layout while the light-up is held. */
    private val seen = HashSet<String>()

    /** The tiles laid out for the bands that have not started on the new scooters since. */
    private val behind = HashSet<String>()
    private var changed = false
    private var takenIn = false

    /** Whether the scooters have had long enough to be taken in: the layouts under way, if any, are the last. */
    private var overdue = false

    private val tiles = MapView.OnTileActionListener { operation, x, y, z, wrap, overscaledZ, source ->
        if (source != ScooterMarkerLayers.MARKERS_SOURCE || held == null) return@OnTileActionListener
        val tile = "$overscaledZ/$wrap/$z/$x/$y"
        when (operation) {
            TileOperation.StartParse -> {
                laying += tile
                // A tile's first layout in the hold is of the old scooters for the new bands, even one begun after
                // the source changed: a busy frame can start it that late. Its next, once the source has changed,
                // takes the new scooters in. A tile that takes both in one layout is waited for until overdue.
                if (seen.add(tile)) {
                    behind += tile
                } else if (changed && behind.remove(tile)) {
                    takenIn = true
                }
            }
            TileOperation.EndParse, TileOperation.Error, TileOperation.Cancelled -> {
                laying -= tile
                if (laying.isEmpty() && (overdue || (takenIn && behind.isEmpty()))) {
                    release()
                    wantFrames()
                }
            }
            else -> Unit
        }
    }

    /**
     * The scooters MapLibre has taken in, on the main thread. Should a tile take them in with a layout under way,
     * it says nothing of them: they are given [LAID_OUT] from the next frame, then the layouts under way.
     */
    private val sourceChanged = MapView.OnSourceChangedListener { id ->
        if (id != ScooterMarkerLayers.MARKERS_SOURCE || held == null) return@OnSourceChangedListener
        changed = true
        val hold = holds
        whenBegun {
            main.postDelayed({
                if (holds != hold || held == null) return@postDelayed
                overdue = true
                if (laying.isEmpty()) {
                    release()
                    wantFrames()
                }
            }, LAID_OUT)
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
        view.removeOnSourceChangedListener(sourceChanged)
        view.removeOnTileActionListener(tiles)
        main.removeCallbacksAndMessages(null)
        queued.clear()
        begun.clear()
        listen()
        style = null
    }

    /** Dark appearance, and the satellite picture in either appearance, which the dots are drawn for. */
    fun setDark(dark: Boolean) {
        if (scene.isDark == dark) return
        scene.isDark = dark
        update()
    }

    /** The chrome over the map: names keep clear of it, and wait while their dot is under it. */
    fun chromeDidChange(chrome: MapChrome) {
        if (chrome == this.chrome) return
        this.chrome = chrome
        // The dock springs to a new height a frame at a time: only the names move with it.
        scene.parent = scene.parent.copy(
            interactionExclusionFrame = chrome.top,
            bottomChromeTop = chrome.bottomTop,
            bottomChromeFrames = chrome.bottomFrames,
        )
        scene.movePills(markerMap)
        flush()
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
            interactionExclusionFrame = chrome.top,
            bottomChromeTop = chrome.bottomTop,
            bottomChromeFrames = chrome.bottomFrames,
        )
        scene.applyDestination(controller.searchedDestination.value)
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
        laying.clear()
        seen.clear()
        behind.clear()
        changed = false
        takenIn = false
        overdue = false
        view.addOnTileActionListener(tiles)
    }

    /** The light-up's scooters are laid out, or have been waited for long enough: their fades start. */
    private fun release() {
        val since = held ?: return
        late = SystemClock.uptimeMillis() / 1000.0 - since
        lightUpLate = late
        held = null
        view.removeOnTileActionListener(tiles)
        val style = style ?: return
        for (fading in fadings.values) fading.release(style)
    }

    /** Runs an action once MapLibre has begun a frame after it was asked for. */
    private fun whenBegun(action: () -> Unit) {
        main.post {
            queued += false to action
            listen()
        }
    }

    /** Runs an action once MapLibre has drawn, with every tile laid out, a frame begun after it was asked for. */
    private fun whenDrawn(action: () -> Unit) {
        main.post {
            queued += true to action
            listen()
        }
    }

    /** Listens to MapLibre's frames while an action waits for one, and stops once none does. */
    private fun listen() {
        val wanted = queued.isNotEmpty() || begun.isNotEmpty()
        if (wanted == listening) return
        listening = wanted
        if (wanted) {
            view.addOnWillStartRenderingFrameListener(frameStarts)
            view.addOnDidFinishRenderingFrameListener(frameEnds)
        } else {
            view.removeOnWillStartRenderingFrameListener(frameStarts)
            view.removeOnDidFinishRenderingFrameListener(frameEnds)
        }
    }

    /**
     * A source's fading markers: each band's layer, over the source's own layers, which leave its markers to it
     * meanwhile. Once every band's fade is over, the markers are handed back to the source's layers, which kept
     * them in their places all along; the bands' layers, drawing nothing, are taken out once MapLibre has drawn
     * them back.
     */
    private inner class Fading(val source: String, val layer: String, val raised: String?) {
        private val bands = MarkerBands(layer, raised)

        val isFading: Boolean get() = bands.isFading

        /** Puts each marker fading at [time] in its band, adding the bands' layers it needs. */
        fun assign(style: Style, features: List<MarkerFeature>, time: Double): Map<MarkerFeature, Int> {
            val wasFading = bands.isFading
            val (members, added) = bands.assign(features, epoch, time)
            if (members.isEmpty()) return emptyMap()
            if (!wasFading) beside(style, ScooterMarkerLayers.STRENGTH_BESIDE_BANDS, ScooterMarkerLayers.SORT_BESIDE_BANDS)
            for (band in added) {
                addLayer(style, band.spec, below = band.below)
                // MapLibre eases a band from where it starts once it has taken it in there.
                if (band.key.eased != null && held == null) whenBegun { ease(style, band) }
            }
            return members.mapValues { it.value.index }
        }

        /** The light-up's scooters are laid out: MapLibre eases their bands from now. */
        fun release(style: Style) {
            for (band in bands.all.toList()) ease(style, band)
        }

        /** Has MapLibre ease a band to its strength, in one change of its layer. */
        private fun ease(style: Style, band: MarkerBands.Band) {
            if (this@ScooterMarkers.style !== style) return
            val ease = bands.ease(band, fadeTime(SystemClock.uptimeMillis() / 1000.0)) ?: return
            val layer = style.getLayer(band.layer.id) as? SymbolLayer ?: return
            layer.iconOpacityTransition = TransitionOptions(ease.length, ease.delay)
            layer.setProperties(PaintPropertyValue("icon-opacity", ease.opacity))
        }

        /** Sets each band's strength at [time], and hands the markers back once all are over. Returns whether any fades. */
        fun frame(style: Style, time: Double): Boolean {
            if (!bands.isFading) return false
            for (band in bands.frame(time)) style.getLayer(band.layer.id)?.setProperties(PaintPropertyValue("icon-opacity", band.opacity))
            if (!bands.isOver(time)) return true
            // In the same layout, the markers come back to the source's layers and leave the bands'.
            beside(style, ScooterMarkerLayers.STRENGTH, ScooterMarkerLayers.SORT)
            val emptied = bands.clear().map { it.layer.id }
            for (id in emptied) (style.getLayer(id) as? SymbolLayer)?.setFilter(Expression.raw(ScooterMarkerLayers.NOTHING))
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

    companion object {
        /** The pictures the style keeps before those no layer draws are taken out. */
        private const val MOST_IMAGES = 600

        /** The longest the light-up waits for its scooters to be drawn, in seconds. */
        private const val MOST_HELD = 1.5

        /**
         * How long MapLibre's tiles are given to start on new scooters, from a frame begun after it took them in, in
         * ms. An emulator's start on 5,000 within some 55 ms, and have them laid out within 115.
         */
        private const val LAID_OUT = 200L
    }
}
