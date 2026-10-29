package com.plhery.scootradar.map

import android.animation.ValueAnimator
import android.os.SystemClock
import android.view.View
import androidx.compose.animation.core.Animatable
import androidx.compose.ui.MotionDurationScale
import androidx.compose.animation.core.tween
import com.plhery.scootradar.core.IosMotion
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
import com.plhery.scootradar.ui.theme.easing
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapLibreMap
import kotlin.coroutines.EmptyCoroutineContext
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
    /** Each side within `within` points of the other's. */
    fun nearlyEquals(other: MapInsets, within: Double): Boolean =
        abs(top - other.top) < within && abs(left - other.left) < within &&
            abs(bottom - other.bottom) < within && abs(right - other.right) < within

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
 * fold moves its margins, and :core's camera rules measure from there. Beside a large window's panel the map's
 * leading margin reaches past the panel, and MapLibre's padding stands in for it: the map shows its centre in the
 * middle of the part beside the panel, and fits a place there. Beside the fold of a partly open foldable the
 * margin on its far side from the map reaches past it too, and the map shows its centre in the half it shows on.
 */
class MapCamera(
    private val map: MapLibreMap,
    private val view: ScooterMapView,
    private val controller: ScooterMapController,
    private val memory: MapCameraMemory,
    /** The composition's scope, whose frames the moves are drawn on. */
    private val scope: CoroutineScope,
    /** Whether the phone has its animations on, as Remove animations leaves them; a test may turn them off. */
    private val animationsOn: () -> Boolean = { ValueAnimator.areAnimatorsEnabled() },
) {
    private val projection = MapLibreProjection(map, view)

    /**
     * How MapKit's camera would stand on this map, which sets the zoom its distances give, the tilt it allows and
     * the time its moves take: the iPad's in a window regular both ways, the iPhone's in any other (MAP-005).
     */
    var mapKit: MapKitCamera = MapKitCamera.IPhone
        set(value) {
            if (value == field) return
            field = value
            holdTilt()
        }

    /** The safe area, which a focus on a place keeps the place out from under at the top. */
    private var safeArea = MapInsets.zero
    private var chrome = MapChrome()

    /** The chrome over the map as the screen has it at this moment, read as the map takes a new size. */
    var currentChrome: (() -> MapChrome)? = null

    /** The margins set beside a panel or a fold, in points from the map's edges; none while nothing moves them. */
    private var movedMargins: MapInsets? = null

    /** The map's margins: those set beside a panel or a fold, or none. */
    val margins: MapInsets get() = movedMargins ?: MapInsets.zero

    /** How many moves to a place were made, again or not: what the tests count, as the iPhone's coordinator's. */
    var movesToPlaces = 0
        private set

    /** The scooter or bay chosen last, and until when, in the uptime's milliseconds, the map keeps it clear of the panel. */
    private var watchedSelection: Pair<String, Long>? = null

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

    private val idle = MapLibreMap.OnCameraIdleListener { if (!moving) regionDidChange(animated = false) }

    /**
     * What else the map's rest moves, first, as regionDidChange begins (MAP-053): the walk's trail, and the zones'
     * edges. It is told whether the camera came there in a move of its own, MapKit's `animated`.
     */
    var rested: ((animated: Boolean) -> Unit)? = null

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
        if (right - left != oldRight - oldLeft || bottom - top != oldBottom - oldTop) {
            // The screen has laid out its chrome for the new size by now, a panel gone or not yet placed, which the
            // camera would hear of only after the frame: a panel's margin left on a phone's width would show the
            // map's centre past its edge, and the scooter chosen there would count as out of view.
            currentChrome?.invoke()?.let { chromeDidChange(it) }
            // A panel's margin on the right of a right-to-left map is measured from the map's right edge.
            updateMargins()
            regionDidChange(animated = false)
        }
    }

    init {
        map.addOnCameraIdleListener(idle)
        map.addOnCameraMoveStartedListener(moveStarted)
        map.addOnCameraMoveListener(tiltCap)
        view.addOnLayoutChangeListener(resized)
        // A camera remembered from before the activity was made again comes with the margins of its chrome, which
        // the chrome now gives again.
        if (map.cameraPosition.padding?.any { it != 0.0 } == true) {
            jump(CameraPosition.Builder(map.cameraPosition).padding(0.0, 0.0, 0.0, 0.0).build())
        }
        holdTilt()
        // MapKit reports the region it opens on; MapLibre may already be at rest.
        view.post { regionDidChange(animated = false) }
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
        val most = MapZoom.mostTilt(camera.zoom, camera.target?.latitude ?: return, mapKit)
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
        focusUnderWay = FocusUnderWay(request, margins)
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
        // MapKit frames a region within the map's margins, which a panel moves past it, and which hold the safe
        // area then.
        val frame = if (movedMargins != null) withinSafeArea() else frame()
        when (move) {
            is CameraMove.Region -> animate(
                CameraPosition.Builder(map.cameraPosition)
                    .target(LatLng(move.region.center.latitude, move.region.center.longitude))
                    .zoom(MapZoom.fitting(move.region, frame.width, frame.height))
                    .build(),
            )
            // On a phone MapKit shows a cluster's scooters in motion whatever Reduce Motion says (MAP-327).
            is CameraMove.Fit -> fit(move.coordinates, move.animated, inMotion = move.ofCluster && movedMargins == null)
        }
    }

    /**
     * The compass's tap: MKCompassButton turns the map north about its centre, in MapKit's time and curve, at once
     * under Remove animations (MAP-211). A rider's tap, as a hand on the map, ends the move to a place under way.
     */
    fun turnNorth() {
        if (!(projection.bounds.width > 0 && projection.bounds.height > 0)) return
        focusUnderWay = null
        animate(CameraPosition.Builder(map.cameraPosition).bearing(0.0).build())
    }

    /**
     * Fits places in the part of the map left visible, 40 dp in from its edges, never closer than 350 m across
     * the map, tilted and turned as the map is: the iPhone's fit of a route, which a phone's cluster takes here in
     * place of MapKit's showAnnotations, whose insets are its own (MAP-176, MAP-177, MAP-302).
     */
    private fun fit(coordinates: List<GeoPoint>, animated: Boolean, inMotion: Boolean = false) {
        val first = coordinates.firstOrNull() ?: return
        val bounds = projection.bounds
        // The map shows its centre in the middle of its margins, which a panel moves past it: the rect is fitted
        // to the part of the map inside them, and the places kept inside the safe area, which iOS's margins hold.
        val frame = frame()
        val within = if (movedMargins != null) withinSafeArea() else frame
        var band = visibleRect()
        if (movedMargins != null) band = band.intersection(within) ?: within
        var visible = band.insetBy(WalkTrailLook.fitMargin, WalkTrailLook.fitMargin) ?: band
        // With very little room left, the margin goes first.
        if (visible.width < 88 || visible.height < 88) visible = band
        if (visible.width < 44 || visible.height < 44) visible = within
        // Street level is a phone's: measured across the map's width.
        val minimumScale = WalkTrailLook.closestFitWidth / ScooterMarkerScene.metresPerMapPoint(first.latitude) *
            ScooterMapCameraPolicy.spanScale(across = bounds.width) / bounds.width
        val rect = ScooterMapCameraPolicy.rect(
            fitting = coordinates.map { MapPoint(it) },
            heading = map.cameraPosition.bearing,
            size = ScreenSize(frame.width, frame.height),
            visible = ScreenRect(visible.x - frame.x, visible.y - frame.y, visible.width, visible.height),
            minimumScale = minimumScale,
        ) ?: return
        // The rect has the frame's shape, so the frame shows it whole: rect.width / frame.width map points a point.
        val centre = MapPoint(rect.midX, rect.midY).coordinate
        val zoom = log2(MapPoint.worldSize / (512 * rect.width / frame.width))
        animate(
            CameraPosition.Builder(map.cameraPosition)
                .target(LatLng(centre.latitude, centre.longitude))
                .zoom(min(MapZoom.maximum, max(MapZoom.minimum, zoom)))
                .build(),
            animated,
            inMotion,
        )
    }

    /** Moves the map to show the place asked for in the middle of the part of it left in view. */
    private fun move(request: MapFocusRequest) {
        movesToPlaces += 1
        val bounds = projection.bounds
        focusUnderWay?.let {
            it.width = bounds.width
            it.height = bounds.height
            it.safeArea = safeArea
        }
        val current = map.cameraPosition
        val visible = visibleRect()
        if (request.keepsZoom) {
            val centre = ScooterMapCameraPolicy.center(
                showing = request.point,
                on = projection,
                visible = visible,
                marginsMoved = movedMargins != null,
            )
            animate(CameraPosition.Builder(current).target(LatLng(centre.latitude, centre.longitude)).build())
            return
        }
        // A span fits the map's shorter side; the region keeps to the middle of the map's margins, tilted and
        // turned as it is.
        val scale = ScooterMapCameraPolicy.spanScale(across = min(bounds.width, bounds.height))
        val region = MapRegion.around(
            center = request.point,
            latitudinalMeters = request.latitudinalMeters * scale,
            longitudinalMeters = request.longitudinalMeters * scale,
        )
        val frame = frame()
        var target = CameraPosition.Builder(current)
            .target(LatLng(request.point.latitude, request.point.longitude))
            .zoom(MapZoom.fitting(region, frame.width, frame.height))
            .build()
        // Beside a panel the place goes to the middle of the part of the map beside it, across, and of the whole
        // map up and down: where the centre goes is measured on the map as the camera will show it.
        val beside = ScooterMapCameraPolicy.aside(visible, bounds)
        if (beside != null) {
            jump(target)
            val centre = ScooterMapCameraPolicy.center(showing = request.point, on = projection, visible = beside)
            target = CameraPosition.Builder(target).target(LatLng(centre.latitude, centre.longitude)).build()
            jump(current)
        }
        animate(target)
    }

    /**
     * The part of the map between the search bar and the locate button over the dock, and beside the panel of a
     * large window; until the chrome is there, between the status bar and the map's bottom edge. Beside the fold of a
     * partly open foldable, only the part on the side where the map shows.
     */
    private fun visibleRect(): ScreenRect {
        val bounds = projection.bounds
        val top = chrome.top?.takeIf { !it.isEmpty }?.maxY ?: safeArea.top
        val visible = ScooterMapCameraPolicy.visibleRectIn(bounds, top = top, bottom = chrome.bottomTop ?: bounds.maxY, beside = panel())
        val fold = fold() ?: return visible
        return ScooterMapCameraPolicy.visibleRect(visible, safeTop = safeArea.top, beside = fold, on = foldSide(fold))
    }

    /** The panel of a large window, in the map's points; none on a phone. */
    private fun panel(): ScreenRect? = chrome.panel?.takeIf { !it.isEmpty }

    /** The fold of a partly open foldable, in the map's points; none where it misses the map. */
    private fun fold(): ScreenRect? = chrome.fold?.takeIf { !it.isEmpty && it.intersects(projection.bounds) }

    private fun foldSide(fold: ScreenRect): ScooterMapCameraPolicy.FoldSide =
        ScooterMapCameraPolicy.side(of = fold, panel = panel(), rightToLeft = view.layoutDirection == View.LAYOUT_DIRECTION_RTL)

    /** The part of the map inside its margins, where it shows its centre and fits a region. */
    private fun frame(): ScreenRect {
        val bounds = projection.bounds
        val margins = margins
        return ScreenRect(
            bounds.x + margins.left,
            bounds.y + margins.top,
            max(0.0, bounds.width - margins.left - margins.right),
            max(0.0, bounds.height - margins.top - margins.bottom),
        )
    }

    /**
     * The frame inside the safe area too. UIKit reads a map's margins back with its safe area added, and iOS fits a
     * route or a region beside a panel within them: a side the panel moves is past the safe area already, and the
     * others are the safe area's.
     */
    private fun withinSafeArea(): ScreenRect = within(projection.bounds, margins, safeArea)

    /**
     * The chrome over the map: the search bar above, and the locate button with the dock under it, or the panel; and
     * the fold of a partly open foldable.
     */
    fun chromeDidChange(chrome: MapChrome) {
        if (chrome == this.chrome) return
        this.chrome = chrome
        // The margins first: a move is measured with the margins it is shown with.
        updateMargins()
        keepSelectionClearOfPanel()
    }

    /**
     * The map's leading margin reaches past a panel, 16 dp past it, so that the credits stay in view beside it and
     * the map shows its centre in the middle of the part beside it. Beside the fold of a partly open foldable the
     * margin on its far side from the map reaches past it too: the bottom one above a fold across the map, so that the
     * map centres what it shows in the upright half, a side one beside a fold down it. Without either the margins go.
     */
    private fun updateMargins() {
        val panel = panel()
        val fold = fold()
        if (panel == null && fold == null) {
            if (movedMargins != null) {
                movedMargins = null
                setMargins(MapInsets.zero)
            }
            return
        }
        val margins = beside(
            panel,
            fold,
            projection.bounds,
            safeTop = safeArea.top,
            rightToLeft = view.layoutDirection == View.LAYOUT_DIRECTION_RTL,
        )
        // A frame measured again may differ in its last digits: that is no move of the panel or the fold.
        movedMargins?.let { if (it.nearlyEquals(margins, within = 0.5)) return }
        movedMargins = margins
        setMargins(margins)
    }

    /**
     * MapLibre shows the map's centre in the middle of its padding and leaves the centre where it is when the
     * padding changes: what was in the middle of the part left in view goes to the middle of the part left in view
     * now, as a panel comes or goes.
     *
     * A move to a place may still be under way: the rider's first fix can come before the panel has its place.
     * Until the person moves the map or chooses something else, the map goes on to the place, measured beside the
     * panel; keeping the centre would stop it short. It is made again only when the leading margin really moves,
     * once for each time, and six times at most: nothing the camera shows, such as the dock or a card, moves it.
     * A map without a size yet only takes the margins, and the move waits for its first region change.
     */
    private fun setMargins(margins: MapInsets) {
        val ratio = view.pixelRatio.toDouble()
        jump(
            CameraPosition.Builder(map.cameraPosition)
                .padding(margins.left * ratio, margins.top * ratio, margins.right * ratio, margins.bottom * ratio)
                .build(),
        )
        if (view.width == 0 || view.height == 0) {
            if (focusUnderWay != null) {
                memory.focusToken = null
                focusUnderWay = null
            }
            return
        }
        val focus = focusUnderWay ?: return
        // Margins much as the move had them leave it on its way.
        if (margins.nearlyEquals(focus.margins, within = 1.0)) return
        val leadingMoved = abs(margins.left - focus.margins.left) >= 1 || abs(margins.right - focus.margins.right) >= 1
        if (!leadingMoved || focus.madeAgain >= MOST_MOVES_AGAIN) {
            focusUnderWay = null
            return
        }
        focus.margins = margins
        focus.madeAgain += 1
        move(focus.request)
    }

    /**
     * A scooter or bay doesn't move the map when it is chosen. Beside a panel, though, its card opens in the
     * panel, which may then grow over it: the map brings it out once, in the second after it was chosen. A choice
     * ends a move to a place under way, as the map now shows what was chosen.
     */
    fun keepSelectionClearOfPanel() {
        val scooterID = controller.selectedScooterID.value
        val parkingID = controller.selectedParkingID.value
        val key = scooterID?.let { "scooter:$it" } ?: parkingID?.let { "parking:$it" }
        val now = SystemClock.uptimeMillis()
        if (key != watchedSelection?.first) {
            watchedSelection = key?.let { it to now + 1_000 }
            if (key != null) focusUnderWay = null
        }
        val watched = watchedSelection ?: return
        if (now >= watched.second) return
        val panel = panel() ?: return
        if (view.width == 0 || view.height == 0) return
        val coordinate = scooterID?.let { id -> controller.mapScooters.value.firstOrNull { it.id == id }?.coordinate }
            ?: parkingID?.let { id -> controller.mapParking.firstOrNull { it.id == id }?.coordinate }
            ?: return
        if (!panel.contains(projection.point(coordinate))) return
        watchedSelection = watched.first to 0L
        val centre = ScooterMapCameraPolicy.center(
            showing = coordinate,
            on = projection,
            visible = visibleRect(),
            marginsMoved = movedMargins != null,
        )
        animate(CameraPosition.Builder(map.cameraPosition).target(LatLng(centre.latitude, centre.longitude)).build())
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
    private fun regionDidChange(animated: Boolean) {
        if (view.width == 0 || view.height == 0) return
        memory.position = map.cameraPosition
        rested?.invoke(animated)
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

    /**
     * Moves the camera, in MapKit's time and curve, or at once where it is asked to or the phone has animations off,
     * unless the move is [inMotion] whatever they say: then in MapKit's time still, at full speed.
     */
    private fun animate(to: CameraPosition, animated: Boolean = true, inMotion: Boolean = false) {
        stopMotion()
        // A tilt the camera can't keep where it lands is the most it can (MAP-322).
        val target = CameraPosition.Builder(to).tilt(min(to.tilt, MapZoom.mostTilt(to.zoom, to.target!!.latitude, mapKit))).build()
        if (!animated || !(inMotion || animationsOn())) {
            jump(target)
            regionDidChange(animated = false)
            return
        }
        val from = map.cameraPosition
        val millis = moveMillis(from, target, projection.bounds.height, mapKit)
        moving = true
        motion = scope.launch(if (inMotion) FullSpeed else EmptyCoroutineContext) {
            Animatable(0f).animateTo(1f, tween(millis, easing = easeInEaseOut)) { jump(between(from, target, value.toDouble())) }
            moving = false
            motion = null
            regionDidChange(animated = true)
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
    private class FocusUnderWay(val request: MapFocusRequest, /** The margins the move was last made with. */ var margins: MapInsets) {
        /** The map's size and safe area the move was last made at. */
        var width = 0.0
        var height = 0.0
        var safeArea = MapInsets.zero

        /** How many times it was made again since. */
        var madeAgain = 0
    }

    companion object {
        /**
         * The most times a move is made again: each is a real change of the leading margin, or of the map's size
         * or safe area, which a move of the camera doesn't change. Past this the move is over.
         */
        private const val MOST_MOVES_AGAIN = 6

        /** Between the panel or the fold and the credits beside it. */
        private const val PANEL_GAP = 16.0

        /**
         * The map's margins beside a `panel` down one side of a map of `bounds`, in points from its edges: the
         * leading one 16 past the panel, the others none, as on a phone.
         */
        fun beside(panel: ScreenRect, bounds: ScreenRect, rightToLeft: Boolean): MapInsets =
            beside(panel, fold = null, bounds, safeTop = 0.0, rightToLeft)

        /**
         * The map's margins beside a `panel` down one side of a map of `bounds`, and the `fold` of a partly open
         * foldable, in points from its edges: the leading one 16 past the panel, and the one on the fold's far side
         * from where the map shows 16 past the fold. Above a fold across the map the top one is the safe area's,
         * `safeTop`, which UIKit's margins hold: MapKit centres a region in the upright half, between the status bar
         * and the fold. The others are none, as on a phone.
         */
        fun beside(panel: ScreenRect?, fold: ScreenRect?, bounds: ScreenRect, safeTop: Double, rightToLeft: Boolean): MapInsets {
            var top = 0.0
            var left = 0.0
            var bottom = 0.0
            var right = 0.0
            if (panel != null) {
                if (rightToLeft) right = max(0.0, bounds.maxX - panel.minX + PANEL_GAP) else left = max(0.0, panel.maxX - bounds.minX + PANEL_GAP)
            }
            if (fold != null) {
                when (ScooterMapCameraPolicy.side(of = fold, panel = panel, rightToLeft = rightToLeft)) {
                    ScooterMapCameraPolicy.FoldSide.Above -> {
                        top = safeTop
                        bottom = max(0.0, bounds.maxY - fold.minY + PANEL_GAP)
                    }
                    ScooterMapCameraPolicy.FoldSide.Right -> left = max(left, fold.maxX - bounds.minX + PANEL_GAP)
                    ScooterMapCameraPolicy.FoldSide.Left -> right = max(right, bounds.maxX - fold.minX + PANEL_GAP)
                }
            }
            return MapInsets(top, left, bottom, right)
        }

        /**
         * The part of a map of `bounds` inside both its `margins` and its `safeArea`, each measured from its edges,
         * as UIKit reads a map's layout margins back.
         */
        fun within(bounds: ScreenRect, margins: MapInsets, safeArea: MapInsets): ScreenRect {
            val left = max(margins.left, safeArea.left)
            val top = max(margins.top, safeArea.top)
            return ScreenRect(
                bounds.x + left,
                bounds.y + top,
                max(0.0, bounds.width - left - max(margins.right, safeArea.right)),
                max(0.0, bounds.height - top - max(margins.bottom, safeArea.bottom)),
            )
        }

        /** UIKit's ease in, ease out. */
        private val easeInEaseOut = IosMotion.easeInOut.easing

        /**
         * Where the map opens: the start region fitted in the iPhone's opening frame, as MapKit fits it before the
         * map has a size of its own, then tilted to the opening pitch, north up (MAP-002–004). A debug build's
         * screenshot camera takes its place, at the distance MapKit's camera would stand from it as `mapKit` stands
         * (MAP-005).
         */
        fun opening(start: ScooterMapStart, mapKit: MapKitCamera, screenshot: ScooterScreenshotCamera.Camera? = null): CameraPosition {
            val frame = ScooterMapCameraPolicy.openingFrame
            if (screenshot != null) {
                return CameraPosition.Builder()
                    .target(LatLng(screenshot.center.latitude, screenshot.center.longitude))
                    .zoom(MapZoom.atDistance(screenshot.distance, screenshot.center.latitude, frame.height, mapKit))
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
         * measured on the iOS 27 simulator, on the iPhone and the iPad. The map is `height` dp tall, and MapKit's
         * camera would stand over it as `mapKit` stands.
         */
        internal fun moveMillis(from: CameraPosition, to: CameraPosition, height: Double, mapKit: MapKitCamera): Int {
            val levels = max(1.0, ceil(abs(to.zoom - from.zoom) - 1e-6))
            val start = from.target!!
            val end = to.target!!
            val ground = GeoPoint(start.latitude, start.longitude).distance(to = GeoPoint(end.latitude, end.longitude))
            val altitude = MapZoom.mapKitDistance(to.zoom, end.latitude, height, mapKit) * cos(to.tilt * PI / 180)
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

/** A move at full speed, whatever the phone's animator duration scale, which Compose reads as its motion's. */
private object FullSpeed : MotionDurationScale {
    override val scaleFactor = 1f
}
