package com.plhery.scootradar.map

import android.animation.ValueAnimator
import android.view.View
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.tween
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapFocusRequest
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.MapZoomRequest
import com.plhery.scootradar.core.model.ScooterMapCameraPolicy
import com.plhery.scootradar.core.model.ScooterMapStart
import com.plhery.scootradar.core.model.ScooterScreenshotCamera
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.ScreenRect
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapLibreMap
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.round

// The camera of ScooterMapView's coordinator, from ios/ScootRadar/Views/ScooterMapView.swift.

/** The room the system's bars and cut-outs take at the map's edges, in points. */
data class MapInsets(val top: Double, val left: Double, val bottom: Double, val right: Double) {
    companion object {
        val zero = MapInsets(0.0, 0.0, 0.0, 0.0)
    }
}

/**
 * What the iPhone's map coordinator does with the camera. It moves the map to the places the controller asks
 * for, and a step in or out from the keyboard; a move under way is made again when the map changes size; and
 * each place the map comes to rest on goes to the controller, as regionDidChange sends it, with the region and
 * zoom the iPhone measures.
 *
 * On a phone the map keeps no margins: MapKit shows the centre in the middle of the whole map until a panel or a
 * fold moves its margins, and :core's camera rules measure from there. Those margins come with large windows.
 */
class MapCamera(
    private val map: MapLibreMap,
    private val view: ScooterMapView,
    private val controller: ScooterMapController,
    private val memory: MapCameraMemory,
    /** The composition's scope, whose frames the moves are drawn on. */
    private val scope: CoroutineScope,
) {
    private val projection = MapLibreProjection(map, view)

    /** The safe area, which a focus on a place keeps the place out from under at the top. */
    private var safeArea = MapInsets.zero

    private var focusUnderWay: FocusUnderWay? = null
    private var moveForNewSizeWaiting: Job? = null

    /** The camera's own move under way, drawn a frame at a time. */
    private var motion: Job? = null

    /** The camera is being moved by this class: MapLibre's idle after each step isn't the map at rest. */
    private var moving = false

    /**
     * The viewport last told to the controller. MapLibre's idle for a move's last step comes after the move has
     * told it, and tells it the same again: the iPhone's regionDidChange comes once a move (MAP-053).
     */
    private var lastViewport: Triple<MapRegion, Int, Double>? = null

    private val idle = MapLibreMap.OnCameraIdleListener { if (!moving) regionDidChange() }
    private val moveStarted = MapLibreMap.OnCameraMoveStartedListener { reason ->
        // A hand on the map ends a move under way and the focus with it (MAP-047).
        if (reason == MapLibreMap.OnCameraMoveStartedListener.REASON_API_GESTURE) {
            stopMotion()
            focusUnderWay = null
        }
    }
    private val resized = View.OnLayoutChangeListener { _, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom ->
        if (right - left != oldRight - oldLeft || bottom - top != oldBottom - oldTop) regionDidChange()
    }

    init {
        map.addOnCameraIdleListener(idle)
        map.addOnCameraMoveStartedListener(moveStarted)
        view.addOnLayoutChangeListener(resized)
        // MapKit reports the region it opens on; MapLibre may already be at rest.
        view.post { regionDidChange() }
    }

    fun close() {
        stopMotion()
        moveForNewSizeWaiting?.cancel()
        map.removeOnCameraIdleListener(idle)
        map.removeOnCameraMoveStartedListener(moveStarted)
        view.removeOnLayoutChangeListener(resized)
    }

    /**
     * MapKit makes no region change when only the safe area changes, as the status bar's room does after a move
     * has landed: a move under way is made again then too.
     */
    fun safeAreaDidChange(insets: MapInsets) {
        if (insets == safeArea) return
        safeArea = insets
        val focus = focusUnderWay ?: return
        val bounds = projection.bounds
        if (abs(bounds.width - focus.width) < 1 && abs(bounds.height - focus.height) < 1) moveAgainForNewSize()
    }

    /** Moves the map to the place asked for, once per token, as soon as the map has a size (MAP-039–041). */
    fun applyFocus(request: MapFocusRequest?) {
        if (request == null || request.token == memory.focusToken) return
        // The request waits for the layout; the first region change then applies it (MAP-040).
        if (view.width == 0 || view.height == 0) return
        memory.focusToken = request.token
        focusUnderWay = FocusUnderWay(request)
        move(request)
    }

    /**
     * A step in or out from the keyboard (MAP-049): the camera comes closer or goes further, keeps its tilt and
     * its turn, and what is shown where a move to a place shows it stays there.
     */
    fun applyZoom(request: MapZoomRequest?) {
        if (request == null || request.token == memory.zoomToken) return
        memory.zoomToken = request.token
        if (view.width == 0 || view.height == 0) return
        // A step from the keyboard moves the map as the person's hand does.
        focusUnderWay = null
        stopMotion()
        val middle = ScooterMapCameraPolicy.focus(on = projection, visible = visibleRect())
        val kept = projection.coordinate(middle)
        val starting = map.cameraPosition
        val zoom = min(map.maxZoomLevel, max(map.minZoomLevel, starting.zoom + request.steps))
        var target = CameraPosition.Builder(starting).zoom(zoom).build()
        // Where the middle goes is measured on the map as the camera will show it.
        jump(target)
        val shown = projection.point(kept)
        val lookedAt = projection.point(projection.centerCoordinate)
        val centre = projection.coordinate(ScreenPoint(lookedAt.x + shown.x - middle.x, lookedAt.y + shown.y - middle.y))
        target = CameraPosition.Builder(target).target(LatLng(centre.latitude, centre.longitude)).build()
        jump(starting)
        animate(target)
    }

    /** Moves the map to show the place asked for in the middle of the part of it left in view. */
    private fun move(request: MapFocusRequest) {
        val bounds = projection.bounds
        focusUnderWay?.let {
            it.width = bounds.width
            it.height = bounds.height
            it.safeArea = safeArea
        }
        val current = map.cameraPosition
        if (request.keepsZoom) {
            val centre = ScooterMapCameraPolicy.center(showing = request.point, on = projection, visible = visibleRect())
            animate(CameraPosition.Builder(current).target(LatLng(centre.latitude, centre.longitude)).build())
            return
        }
        // A span fits the map's shorter side; the region keeps to the middle of the whole map, tilted and turned
        // as it is.
        val scale = ScooterMapCameraPolicy.spanScale(across = min(bounds.width, bounds.height))
        val region = MapRegion.around(
            center = request.point,
            latitudinalMeters = request.latitudinalMeters * scale,
            longitudinalMeters = request.longitudinalMeters * scale,
        )
        animate(
            CameraPosition.Builder(current)
                .target(LatLng(request.point.latitude, request.point.longitude))
                .zoom(MapZoom.fitting(region, bounds.width, bounds.height))
                .build(),
        )
    }

    /**
     * The part of the map between the search bar and the dock; until the chrome is there, between the status
     * bar and the map's bottom edge.
     */
    private fun visibleRect(): ScreenRect {
        val bounds = projection.bounds
        return ScooterMapCameraPolicy.visibleRectIn(bounds, top = safeArea.top, bottom = bounds.maxY, beside = null)
    }

    /**
     * MapKit reports the new size, then scales its camera to it: a move under way is made again once a tenth of a
     * second has passed without another change, at most six times (MAP-046).
     */
    private fun moveAgainForNewSize() {
        val focus = focusUnderWay ?: return
        if (!hasNewSize(focus)) return
        moveForNewSizeWaiting?.cancel()
        moveForNewSizeWaiting = scope.launch {
            delay(100)
            moveForNewSizeWaiting = null
            val current = focusUnderWay ?: return@launch
            if (!hasNewSize(current)) return@launch
            if (current.madeAgain >= MOST_MOVES_AGAIN) {
                focusUnderWay = null
                return@launch
            }
            current.madeAgain += 1
            move(current.request)
        }
    }

    /** Whether the map has another size or safe area than the move under way was last made at. */
    private fun hasNewSize(focus: FocusUnderWay): Boolean {
        val bounds = projection.bounds
        if (!(bounds.width > 0 && bounds.height > 0)) return false
        val safe = focus.safeArea
        return abs(bounds.width - focus.width) >= 1 || abs(bounds.height - focus.height) >= 1 ||
            abs(safeArea.top - safe.top) >= 1 || abs(safeArea.bottom - safe.bottom) >= 1 ||
            abs(safeArea.left - safe.left) >= 1 || abs(safeArea.right - safe.right) >= 1
    }

    /** The map at rest, in the order the iPhone's regionDidChange keeps (MAP-053). */
    private fun regionDidChange() {
        if (view.width == 0 || view.height == 0) return
        memory.position = map.cameraPosition
        moveAgainForNewSize()
        applyFocus(controller.focusRequest.value)
        val region = MapZoom.region(of = projection.visibleMapRect)
        val zoomLevel = MapZoom.level(on = projection)
        val zoom = MapZoom.apiZoom(zoomLevel)
        val viewport = Triple(region, zoom, zoomLevel)
        if (viewport == lastViewport) return
        lastViewport = viewport
        // After the map's own work, as the iPhone's Task on the main actor.
        view.post { controller.updateViewport(region, zoom, zoomLevel) }
    }

    /** Moves the camera, in MapKit's time and curve, or at once where the phone has animations off. */
    private fun animate(to: CameraPosition) {
        stopMotion()
        if (!ValueAnimator.areAnimatorsEnabled()) {
            jump(to)
            regionDidChange()
            return
        }
        val from = map.cameraPosition
        moving = true
        motion = scope.launch {
            Animatable(0f).animateTo(1f, tween(MOVE_MILLIS, easing = easeInEaseOut)) { jump(between(from, to, value.toDouble())) }
            moving = false
            motion = null
            regionDidChange()
        }
    }

    private fun stopMotion() {
        motion?.cancel()
        motion = null
        moving = false
    }

    /** A move of the camera at once, which MapLibre reports as at rest straight after. */
    private fun jump(position: CameraPosition) {
        val was = moving
        moving = true
        try {
            map.moveCamera(CameraUpdateFactory.newCameraPosition(position))
        } finally {
            moving = was
        }
    }

    /** A move to a place asked for, made on a map with a size, with what it was measured with. */
    private class FocusUnderWay(val request: MapFocusRequest) {
        /** The map's size and safe area the move was last made at. */
        var width = 0.0
        var height = 0.0
        var safeArea = MapInsets.zero

        /** How many times it was made again since. */
        var madeAgain = 0
    }

    companion object {
        /** The most times a move is made again for a new size. */
        private const val MOST_MOVES_AGAIN = 6

        /**
         * How long a move to a place takes. MapKit doesn't say, and none was measured: the lane's spike settled on
         * 0.35 s, within the 0.35–0.7 s MapKit's moves seem to take (MAP-277).
         */
        private const val MOVE_MILLIS = 350

        /** UIKit's ease in, ease out. */
        private val easeInEaseOut = CubicBezierEasing(0.42f, 0f, 0.58f, 1f)

        /**
         * Where the map opens: the start region fitted in the iPhone's opening frame, as MapKit fits it before the
         * map has a size of its own, then tilted to the opening pitch, north up (MAP-002–004). A debug build's
         * screenshot camera takes its place (MAP-005).
         */
        fun opening(start: ScooterMapStart, screenshot: ScooterScreenshotCamera.Camera? = null): CameraPosition {
            val frame = ScooterMapCameraPolicy.openingFrame
            if (screenshot != null) {
                return CameraPosition.Builder()
                    .target(LatLng(screenshot.center.latitude, screenshot.center.longitude))
                    .zoom(MapZoom.atDistance(screenshot.distance, screenshot.center.latitude, frame.height))
                    .tilt(screenshot.pitch)
                    .bearing(screenshot.heading)
                    .build()
            }
            return CameraPosition.Builder()
                .target(LatLng(start.region.center.latitude, start.region.center.longitude))
                .zoom(MapZoom.fitting(start.region, frame.width, frame.height))
                .tilt(ScooterMapCameraPolicy.openingPitch)
                .bearing(0.0)
                .build()
        }

        /**
         * The camera a `fraction` of the way from one to another: across the flat map in a straight line, the
         * zoom evenly, and the turn the short way round.
         */
        internal fun between(from: CameraPosition, to: CameraPosition, fraction: Double): CameraPosition {
            val start = MapPoint(GeoPoint(from.target!!.latitude, from.target!!.longitude))
            val end = MapPoint(GeoPoint(to.target!!.latitude, to.target!!.longitude))
            // The short way round the world, too.
            val endX = end.x + MapPoint.worldSize * round((start.x - end.x) / MapPoint.worldSize)
            val centre = MapPoint(start.x + (endX - start.x) * fraction, start.y + (end.y - start.y) * fraction).coordinate
            val turn = ((to.bearing - from.bearing) % 360 + 540) % 360 - 180
            return CameraPosition.Builder()
                .target(LatLng(centre.latitude, centre.longitude))
                .zoom(from.zoom + (to.zoom - from.zoom) * fraction)
                .tilt(from.tilt + (to.tilt - from.tilt) * fraction)
                .bearing(from.bearing + turn * fraction)
                .build()
        }
    }
}
