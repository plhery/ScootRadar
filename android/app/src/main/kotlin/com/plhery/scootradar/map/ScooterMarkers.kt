// The markers' part of ScooterMapView's updateUIView and of its coordinator's map delegate, from
// ios/ScootRadar/Views/ScooterMapView.swift.

package com.plhery.scootradar.map

import android.animation.ValueAnimator
import android.os.SystemClock
import android.view.Choreographer
import android.view.View
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
 * moves, the scene works out the look and the layers draw it. A tap on the map is the scene's to answer. The few
 * things that move on their own, the dots lighting up, a name coming, the faded markers breathing, are drawn a
 * frame at a time by changing a layer's strength, never by writing the scooters again (MAP-319).
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

    /** The uptime the features' fades are counted from, in seconds: small numbers for the style's floats. */
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
    private val fadingLayers = HashSet<String>()
    private var breathing: Float? = null

    private val markerMap = object : MarkerMap {
        override val projection: ScooterMapProjection get() = this@ScooterMarkers.projection
        override val heading: Double get() = map.cameraPosition.bearing
        override val isShown: Boolean get() = view.isAttachedToWindow && view.windowVisibility == View.VISIBLE
        override val safeTop: Double get() = safeArea.top
    }

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
        flush()
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
        style.getSourceAs<GeoJsonSource>(source)?.setGeoJson(MarkerFeatures.json(features, epoch))
    }

    private fun addLayers(style: Style) {
        style.addSource(GeoJsonSource(ScooterMarkerLayers.LAST_SEEN_SOURCE))
        style.addSource(GeoJsonSource(ScooterMarkerLayers.MARKERS_SOURCE))
        // The names are few and move with their dots: written at once, they are never a frame behind them.
        style.addSource(GeoJsonSource(ScooterMarkerLayers.PILLS_SOURCE, GeoJsonOptions().withSynchronousUpdate(true)))
        style.addSource(GeoJsonSource(ScooterMarkerLayers.RIDER_SOURCE))
        for (spec in ScooterMarkerLayers.specs) {
            val layer = SymbolLayer(spec.id, spec.source)
            spec.filter?.let { layer.setFilter(Expression.raw(it)) }
            val properties = spec.layout.map { (name, value) -> LayoutPropertyValue(name, value(value)) } +
                spec.paint.map { (name, value) -> PaintPropertyValue(name, value(value)) }
            layer.setProperties(*properties.toTypedArray<PropertyValue<*>>())
            // A strength set each frame is shown at once, not eased over the style's 0.3 s.
            layer.iconOpacityTransition = TransitionOptions(0, 0)
            style.addLayer(layer)
        }
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
        val time = SystemClock.uptimeMillis() / 1000.0
        val dotsFade = scene.marks.any { it.dotFade?.isOver(time) == false }
        val pillsFade = scene.marks.any { it.pillFade?.isOver(time) == false }
        fade(style, ScooterMarkerLayers.MARKERS, dotsFade, time)
        fade(style, ScooterMarkerLayers.RAISED, dotsFade, time)
        fade(style, ScooterMarkerLayers.PILLS, pillsFade, time)
        val breathes = breathes()
        val strength = LastSeenBreath.strength(at = time, animates = breathes)
        if (strength != breathing) {
            breathing = strength
            style.getLayer(ScooterMarkerLayers.LAST_SEEN)?.setProperties(PaintPropertyValue("icon-opacity", strength))
        }
        return dotsFade || pillsFade || breathes
    }

    private fun fade(style: Style, layer: String, fading: Boolean, time: Double) {
        if (!fading && layer !in fadingLayers) return
        val opacity = if (fading) {
            fadingLayers += layer
            ScooterMarkerLayers.fadingStrength(time - epoch)
        } else {
            fadingLayers -= layer
            ScooterMarkerLayers.STRENGTH
        }
        style.getLayer(layer)?.setProperties(PaintPropertyValue("icon-opacity", Expression.raw(opacity)))
    }

    companion object {
        /** The pictures the style keeps before those no layer draws are taken out. */
        private const val MOST_IMAGES = 600
    }
}
