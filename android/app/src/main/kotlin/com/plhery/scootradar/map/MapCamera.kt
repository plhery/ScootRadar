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
import com.plhery.scootradar.core.model.ScreenSize
import com.plhery.scootradar.core.model.WalkTrailLook
import com.plhery.scootradar.core.model.distance
import com.plhery.scootradar.core.model.rect
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapLibreMap
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.log2
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.round
import kotlin.math.roundToInt

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

    /** The tilt the map was last held to. */
    private var tiltHeldTo = -1.0

    /** The map tilts no more than MapKit's camera would at the height it stands (MAP-322). */
    private val tiltCap = MapLibreMap.OnCameraMoveListener { holdTilt() }
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
        map.addOnCameraMoveListener(tiltCap)
        view.addOnLayoutChangeListener(resized)
        holdTilt()
        // MapKit reports the region it opens on; MapLibre may already be at rest.
        view.post { regionDidChange() }
    }

    fun close() {
        stopMotion()
        moveForNewSizeWaiting?.cancel()
        map.removeOnCameraIdleListener(idle)
        map.removeOnCameraMoveStartedListener(moveStarted)
        map.removeOnCameraMoveListener(tiltCap)
        view.removeOnLayoutChangeListener(resized)
    }

    private fun holdTilt() {
        val camera = map.cameraPosition
        val most = MapZoom.mostTilt(camera.zoom, camera.target?.latitude ?: return)
        if (most == tiltHeldTo) return
        tiltHeldTo = most
        map.setMaxPitchPreference(most)
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

    /**
     * Takes the camera to what an opened cluster holds: a region shown whole, as setRegionPreservingPerspective
     * shows it, or places fitted as a route is (MAP-050–052). The move to a place under way ends.
     */
    fun show(move: CameraMove) {
        val bounds = projection.bounds
        if (!(bounds.width > 0 && bounds.height > 0)) return
        focusUnderWay = null
        when (move) {
            is CameraMove.Region -> animate(
                CameraPosition.Builder(map.cameraPosition)
                    .target(LatLng(move.region.center.latitude, move.region.center.longitude))
                    .zoom(MapZoom.fitting(move.region, bounds.width, bounds.height))
                    .build(),
            )
            is CameraMove.Fit -> fit(move.coordinates)
        }
    }

    /**
     * Fits places in the part of the map left visible, 40 dp in from its edges, never closer than 350 m across
     * the map, tilted and turned as the map is: the iPhone's fit of a route, which a phone's cluster takes here in
     * place of MapKit's showAnnotations, whose insets are its own (MAP-176, MAP-177, MAP-302).
     */
    private fun fit(coordinates: List<GeoPoint>) {
        val first = coordinates.firstOrNull() ?: return
        val bounds = projection.bounds
        val band = visibleRect()
        var visible = band.insetBy(WalkTrailLook.fitMargin, WalkTrailLook.fitMargin) ?: band
        // With very little room left, the margin goes first.
        if (visible.width < 88 || visible.height < 88) visible = band
        if (visible.width < 44 || visible.height < 44) visible = bounds
        // Street level is a phone's: measured across the map's width.
        val minimumScale = WalkTrailLook.closestFitWidth / ScooterMarkerScene.metresPerMapPoint(first.latitude) *
            ScooterMapCameraPolicy.spanScale(across = bounds.width) / bounds.width
        val rect = ScooterMapCameraPolicy.rect(
            fitting = coordinates.map { MapPoint(it) },
            heading = map.cameraPosition.bearing,
            size = ScreenSize(bounds.width, bounds.height),
            visible = visible,
            minimumScale = minimumScale,
        ) ?: return
        // The rect has the map's shape, so the map shows it whole: rect.width / bounds.width map points a point.
        val centre = MapPoint(rect.midX, rect.midY).coordinate
        val zoom = log2(MapPoint.worldSize / (512 * rect.width / bounds.width))
        animate(
            CameraPosition.Builder(map.cameraPosition)
                .target(LatLng(centre.latitude, centre.longitude))
                .zoom(min(MapZoom.maximum, max(MapZoom.minimum, zoom)))
                .build(),
        )
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
        // A tilt the camera can't keep where it lands is the most it can (MAP-322).
        val target = CameraPosition.Builder(to).tilt(min(to.tilt, MapZoom.mostTilt(to.zoom, to.target!!.latitude))).build()
        if (!ValueAnimator.areAnimatorsEnabled()) {
            jump(target)
            regionDidChange()
            return
        }
        val from = map.cameraPosition
        val millis = moveMillis(from, target, projection.bounds.height)
        moving = true
        motion = scope.launch {
            Animatable(0f).animateTo(1f, tween(millis, easing = easeInEaseOut)) { jump(between(from, target, value.toDouble())) }
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
         * How long MapKit takes to move its camera, in milliseconds (MAP-277): a quarter of a second for each zoom
         * level begun, or for each height of the camera above the ground, as it stands at the end, that the move
         * crosses, whichever is longer; from a quarter of a second to two seconds. MapKit doesn't say; this was
         * measured on the iOS 27 simulator, on the iPhone and the iPad. The map is `height` dp tall.
         */
        internal fun moveMillis(from: CameraPosition, to: CameraPosition, height: Double): Int {
            val levels = max(1.0, ceil(abs(to.zoom - from.zoom) - 1e-6))
            val start = from.target!!
            val end = to.target!!
            val ground = GeoPoint(start.latitude, start.longitude).distance(to = GeoPoint(end.latitude, end.longitude))
            val altitude = MapZoom.mapKitDistance(to.zoom, end.latitude, height) * cos(to.tilt * PI / 180)
            val heights = if (altitude > 0) ground / altitude else 0.0
            return (min(2.0, max(0.25, 0.25 * max(levels, heights))) * 1000).roundToInt()
        }

        /**
         * The camera a `fraction` of the way from one to another: across the flat map in a straight line, the
         * camera's distance from the ground evenly, as MapKit's comes closer, and the turn the short way round.
         */
        internal fun between(from: CameraPosition, to: CameraPosition, fraction: Double): CameraPosition {
            val start = MapPoint(GeoPoint(from.target!!.latitude, from.target!!.longitude))
            val end = MapPoint(GeoPoint(to.target!!.latitude, to.target!!.longitude))
            // The short way round the world, too.
            val endX = end.x + MapPoint.worldSize * round((start.x - end.x) / MapPoint.worldSize)
            val centre = MapPoint(start.x + (endX - start.x) * fraction, start.y + (end.y - start.y) * fraction).coordinate
            val turn = ((to.bearing - from.bearing) % 360 + 540) % 360 - 180
            // A metre's share of the flat map at either end, which the camera's distance follows.
            val near = cos(from.target!!.latitude * PI / 180) / 2.0.pow(from.zoom)
            val far = cos(to.target!!.latitude * PI / 180) / 2.0.pow(to.zoom)
            return CameraPosition.Builder()
                .target(LatLng(centre.latitude, centre.longitude))
                .zoom(log2(cos(centre.latitude * PI / 180) / (near + (far - near) * fraction)))
                .tilt(from.tilt + (to.tilt - from.tilt) * fraction)
                .bearing(from.bearing + turn * fraction)
                .build()
        }
    }
}
