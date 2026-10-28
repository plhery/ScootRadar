package com.plhery.scootradar.map

import android.animation.ValueAnimator
import android.os.SystemClock
import androidx.compose.runtime.withFrameNanos
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.walkTrail
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.WalkTrail
import com.plhery.scootradar.core.model.WalkTrailLook
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.Style
import org.maplibre.android.style.expressions.Expression
import org.maplibre.android.style.layers.CircleLayer
import org.maplibre.android.style.layers.PropertyFactory
import org.maplibre.android.style.layers.TransitionOptions
import org.maplibre.android.style.sources.GeoJsonSource
import java.util.Locale
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.hypot
import kotlin.math.min

// WalkTrailOverlay and WalkTrailAnimation from ios/ScootRadar/Views/WalkTrailOverlay.swift, and the coordinator's
// applyTrail and its reveal from ios/ScootRadar/Views/ScooterMapView.swift (map.md MAP-162 to MAP-185).

/**
 * The walking route on the map: a row of casing dots and a row of blue dots over it, 11 points apart. A new route
 * is fitted, then draws itself from the start of the walk to the scooter; a route found again on the way takes the
 * old one's place as it is; the part the rider walked disappears; a route no longer wanted fades.
 *
 * Every dot of the route at its spacing is in the trail's source once, numbered from the start, and a filter on
 * the numbers shows the part between what is walked and what is drawn: the reveal and the walk move the filter,
 * and the source is written again only for another route or another spacing.
 */
class WalkTrailLayer(
    private val map: MapLibreMap,
    private val view: ScooterMapView,
    private val controller: ScooterMapController,
    /** The composition's scope, on whose frame clock the trail draws itself and fades. */
    private val scope: CoroutineScope,
    /** The camera's fit of a route between the search bar and the dock. */
    private val fit: (CameraMove.Fit) -> Unit,
) {
    private val projection = MapLibreProjection(map, view)
    private var style: Style? = null
    private var isDark = false

    /** The route on the map, in map points, the share of it walked, and the share drawn. */
    private var revision: Int? = null
    private var points: List<MapPoint> = emptyList()
    private var walked = 0.0
    private var drawn = 0.0

    /** Map points between two dots: 11 points at the zoom of the map. */
    private var spacing = 0.0

    /** The dots in the source, and the ones the filter shows. */
    private var dots: TrailDots? = null
    private var shown: IntRange? = null
    private var reveal: Job? = null
    private var fade: Job? = null

    /** The route fitted, which draws itself once the camera is there. */
    private var pendingReveal: PendingReveal? = null
    private var revealFallback: Job? = null
    private val updates: Job

    /** How many times the trail's source has been written: a test's count. */
    internal var writes = 0
        private set

    init {
        map.getStyle { loaded ->
            if (style != null) return@getStyle
            style = loaded
            addLayers(loaded)
            applyTrail(controller.walkTrail)
        }
        updates = scope.launch {
            controller.walk.map { it?.trail }.distinctUntilChanged().collect { if (style != null) applyTrail(it) }
        }
    }

    fun close() {
        updates.cancel()
        reveal?.cancel()
        fade?.cancel()
        revealFallback?.cancel()
        style = null
    }

    /**
     * A new route is fitted on the map and then draws itself; a route found again on the way takes the old one's
     * place as it is; the part walked goes; a route no longer wanted fades. The controller's walk calls it; a
     * test may, with a trail of its own.
     */
    internal fun applyTrail(trail: WalkTrail?) {
        if (trail == null) {
            pendingReveal = null
            revealFallback?.cancel()
            hide()
            return
        }
        if (trail.revision == revision) {
            setWalked(trail.walked)
            return
        }
        val animated = ValueAnimator.areAnimatorsEnabled() && view.isAttachedToWindow
        val reveals = trail.reveals && animated
        show(trail, drawn = if (reveals) 0.0 else 1.0)
        pendingReveal = null
        revealFallback?.cancel()
        if (!trail.reveals) return
        fit(CameraMove.Fit(trail.points, animated))
        if (!reveals) {
            // Fitted at once: the dots are spaced for where the camera is now.
            mapDidMove()
            return
        }
        pendingReveal = PendingReveal(trail.revision, SystemClock.uptimeMillis())
        revealFallback = scope.launch {
            delay(WalkTrailLook.fitDuration)
            revealPendingRoute()
        }
    }

    /**
     * The map at rest. A route fitted draws itself now, but not on what the fit itself does at once, before its
     * move; then the dots are laid out again for the zoom.
     */
    fun mapDidRest(animated: Boolean) {
        val pending = pendingReveal
        if (pending != null && pending.revision == revision &&
            (animated || SystemClock.uptimeMillis() - pending.since > REVEAL_AFTER_MILLIS)
        ) {
            revealPendingRoute()
        }
        mapDidMove()
    }

    /** The casing in the ground colour of the map. */
    fun setDark(dark: Boolean) {
        if (dark == isDark) return
        isDark = dark
        val color = TrailLayers.color(WalkTrailLook.casingColor(dark))
        style?.getLayer(GroundOverlays.TRAIL_CASING)?.setProperties(PropertyFactory.circleColor(color))
    }

    private fun revealPendingRoute() {
        if (pendingReveal == null) return
        pendingReveal = null
        revealFallback?.cancel()
        revealFallback = null
        revealRoute(animated = ValueAnimator.areAnimatorsEnabled())
    }

    /** Puts a route on the map in place of the one there, drawn up to `drawn` of its length: 0 for a route about to draw itself. */
    private fun show(trail: WalkTrail, drawn: Double) {
        reveal?.cancel()
        reveal = null
        points = trail.points.map { MapPoint(it) }
        revision = trail.revision
        walked = trail.walked
        this.drawn = drawn
        measure()
        redraw()
    }

    /** Draws the route from the start of the walk to its end, its dots spaced for the map the camera settled on. */
    private fun revealRoute(animated: Boolean) {
        if (revision == null) return
        reveal?.cancel()
        reveal = null
        measure()
        if (!animated) {
            drawn = 1.0
            redraw()
            return
        }
        reveal = animate(WalkTrailLook.revealDuration.inWholeNanoseconds, step = { progress ->
            drawn = WalkTrailLook.easeOut(progress)
            redraw()
        }) { reveal = null }
    }

    /** The share of the route the rider has walked, which no longer shows. */
    private fun setWalked(walked: Double) {
        if (revision == null || walked == this.walked) return
        this.walked = walked
        redraw()
    }

    /** After a zoom the dots are laid out again, 11 points apart; not while the route draws itself. */
    private fun mapDidMove() {
        if (revision == null || reveal != null) return
        val perPoint = WalkTrailLook.mapPointsPerPoint(projection) ?: return
        val next = WalkTrailLook.dotSpacing * perPoint
        if (!TrailLayers.respaces(spacing, next)) return
        spacing = next
        redraw()
    }

    /** The route fades from the map, quickly, and is then taken off it. Off screen it goes at once. */
    private fun hide() {
        if (revision == null) return
        revision = null
        points = emptyList()
        reveal?.cancel()
        reveal = null
        val leaving = dots?.takeIf { shown?.isEmpty() == false }
        val range = shown
        dots = null
        shown = null
        val style = style ?: return
        write(style, GroundOverlays.TRAIL_SOURCE, GroundOverlays.NOTHING)
        if (leaving == null || range == null || !view.isAttachedToWindow) return
        // A fade under way gives way to this one.
        fade?.cancel()
        write(style, GroundOverlays.FADING_TRAIL_SOURCE, leaving.json)
        val filter = Expression.raw(TrailLayers.filter(range))
        for (id in listOf(GroundOverlays.FADING_TRAIL_CASING, GroundOverlays.FADING_TRAIL)) {
            (style.getLayer(id) as? CircleLayer)?.setFilter(filter)
        }
        style.getLayer(GroundOverlays.FADING_TRAIL_CASING)
            ?.setProperties(PropertyFactory.circleColor(TrailLayers.color(WalkTrailLook.casingColor(isDark))))
        fade = animate(WalkTrailLook.fadeDuration.inWholeNanoseconds, step = { progress ->
            val opacity = PropertyFactory.circleOpacity((1 - progress).toFloat())
            for (id in listOf(GroundOverlays.FADING_TRAIL_CASING, GroundOverlays.FADING_TRAIL)) style.getLayer(id)?.setProperties(opacity)
        }) {
            fade = null
            this.style?.let { write(it, GroundOverlays.FADING_TRAIL_SOURCE, GroundOverlays.NOTHING) }
        }
    }

    private fun measure() {
        val perPoint = WalkTrailLook.mapPointsPerPoint(projection) ?: return
        spacing = WalkTrailLook.dotSpacing * perPoint
    }

    /** Puts the dots of the route at its spacing in the source, if they changed, and shows the part to be seen. */
    private fun redraw() {
        val style = style ?: return
        val revision = revision ?: return
        if (dots?.revision != revision || dots?.spacing != spacing) {
            val next = TrailDots(revision, points, spacing)
            dots = next
            write(style, GroundOverlays.TRAIL_SOURCE, next.json)
        }
        val range = dots?.shown(from = walked, to = drawn) ?: IntRange.EMPTY
        if (range == shown) return
        shown = range
        val filter = Expression.raw(TrailLayers.filter(range))
        for (id in listOf(GroundOverlays.TRAIL_CASING, GroundOverlays.TRAIL)) (style.getLayer(id) as? CircleLayer)?.setFilter(filter)
    }

    private fun write(style: Style, source: String, json: String) {
        (style.getSource(source) as? GeoJsonSource)?.setGeoJson(json)
        if (source == GroundOverlays.TRAIL_SOURCE) writes += 1
    }

    private fun addLayers(style: Style) {
        for (id in listOf(GroundOverlays.TRAIL_SOURCE, GroundOverlays.FADING_TRAIL_SOURCE)) {
            if (style.getSource(id) == null) style.addSource(GeoJsonSource(id, GroundOverlays.NOTHING))
        }
        for (spec in TrailLayers.specs(isDark)) {
            if (style.getLayer(spec.id) != null) continue
            GroundOverlays.add(style, spec)
            (style.getLayer(spec.id) as? CircleLayer)?.apply {
                // The fade is drawn a frame at a time, and a new appearance comes at once, as MapKit's renderers do.
                circleOpacityTransition = TransitionOptions(0, 0)
                circleColorTransition = TransitionOptions(0, 0)
            }
        }
    }

    /**
     * Calls `step` with the share of `nanos` elapsed, once a frame, until it reaches 1, then `completion`: at
     * once with 0, then from the first frame's time to the time each frame shows, as CADisplayLink's
     * targetTimestamp has it.
     */
    private fun animate(nanos: Long, step: (Double) -> Unit, completion: () -> Unit): Job {
        step(0.0)
        val frames = TrailFrames(nanos, intervalNanos = (1e9 / (view.display?.refreshRate ?: 60f)).toLong())
        return scope.launch {
            while (true) {
                val progress = withFrameNanos { frames.progress(it) }
                step(progress)
                if (progress >= 1) break
            }
            completion()
        }
    }

    private class PendingReveal(val revision: Int, val since: Long)

    private companion object {
        /** A rest this soon after the fit is the fit's own, before its move. */
        const val REVEAL_AFTER_MILLIS = 100
    }
}

/** The trail's layers and their parts, as data: what the tests read without a map. */
object TrailLayers {
    /** Under the zones' edges and the labels, as MapKit's overlays at the level above the roads, a route fading under a new one. */
    fun specs(isDark: Boolean): List<OverlayLayerSpec> = listOf(
        circle(GroundOverlays.FADING_TRAIL_CASING, GroundOverlays.FADING_TRAIL_SOURCE, WalkTrailLook.casingWidth, WalkTrailLook.casingColor(isDark)),
        circle(GroundOverlays.FADING_TRAIL, GroundOverlays.FADING_TRAIL_SOURCE, WalkTrailLook.dotWidth, WalkTrailLook.dotColor),
        circle(GroundOverlays.TRAIL_CASING, GroundOverlays.TRAIL_SOURCE, WalkTrailLook.casingWidth, WalkTrailLook.casingColor(isDark)),
        circle(GroundOverlays.TRAIL, GroundOverlays.TRAIL_SOURCE, WalkTrailLook.dotWidth, WalkTrailLook.dotColor),
    )

    /**
     * A dot of a stroke `width` wide, MapKit's round caps on a stroke of no length: lying on the ground, as
     * MapKit draws its overlays, whatever the tilt. None show until the filter says which.
     */
    private fun circle(id: String, source: String, width: Double, color: Long) = OverlayLayerSpec(
        id = id,
        type = OverlayLayerSpec.Type.Circle,
        source = source,
        filter = filter(IntRange.EMPTY),
        paint = mapOf(
            "circle-radius" to width / 2,
            "circle-color" to color(color),
            "circle-opacity" to 1.0,
            "circle-pitch-alignment" to "map",
            "circle-pitch-scale" to "map",
        ),
    )

    /** The dots numbered within `range`, counted from the start of the route; none for an empty range. */
    fun filter(range: IntRange): String = if (range.isEmpty()) {
        "[\"all\",[\">=\",[\"get\",\"i\"],0],[\"<=\",[\"get\",\"i\"],-1]]"
    } else {
        "[\"all\",[\">=\",[\"get\",\"i\"],${range.first}],[\"<=\",[\"get\",\"i\"],${range.last}]]"
    }

    /** The dots are laid out again for a zoom that moves them more than 3% closer or further apart. */
    fun respaces(spacing: Double, next: Double): Boolean = spacing <= 0 || abs(next / spacing - 1) > 0.03

    fun color(argb: Long): String = String.format(Locale.ROOT, "#%06X", argb and 0xFFFFFF)
}

/**
 * Every dot of a route at a spacing, numbered from its start, where WalkTrailLook.dots puts them: the part of the
 * route between two shares of its length is the dots from the first at or after the one to the last at or before
 * the other.
 */
class TrailDots(val revision: Int, points: List<MapPoint>, val spacing: Double) {
    val positions: List<MapPoint> = WalkTrailLook.dots(along = points, spacing = spacing)
    private val total: Double = points.zipWithNext { a, b -> hypot(b.x - a.x, b.y - a.y) }.sum()
    private val step: Double = maxOf(spacing, total / WalkTrailLook.maximumDots)

    /** The numbers of WalkTrailLook.dots(along, spacing, from, to). */
    fun shown(from: Double, to: Double): IntRange {
        if (positions.isEmpty() || !(to > from) || !(total > 0)) return IntRange.EMPTY
        val first = maxOf(0.0, from) * total
        val last = min(1.0, to) * total
        val low = ceil(first / step).toInt()
        // The last whole number of steps within `last`, as the iPhone's loop counts them.
        var high = floor(last / step).toInt()
        while ((high + 1) * step <= last) high += 1
        while (high >= 0 && high * step > last) high -= 1
        return low..min(high, positions.lastIndex)
    }

    /** The dots as GeoJSON points, each with its number. */
    val json: String by lazy {
        buildString {
            append("{\"type\":\"FeatureCollection\",\"features\":[")
            positions.forEachIndexed { index, point ->
                if (index > 0) append(',')
                val coordinate = point.coordinate
                append("{\"type\":\"Feature\",\"properties\":{\"i\":").append(index)
                append("},\"geometry\":{\"type\":\"Point\",\"coordinates\":[")
                append(GroundOverlays.number(coordinate.longitude)).append(',').append(GroundOverlays.number(coordinate.latitude)).append("]}}")
            }
            append("]}")
        }
    }
}

/**
 * The share of an animation drawn at each frame: from the first frame's time to the time the frame shows, a frame
 * after its own, as WalkTrailAnimation reads CADisplayLink's timestamp and targetTimestamp.
 */
class TrailFrames(private val durationNanos: Long, private val intervalNanos: Long) {
    private var startedAt: Long? = null

    fun progress(frameNanos: Long): Double {
        val start = startedAt ?: frameNanos.also { startedAt = it }
        return if (durationNanos > 0) min(1.0, (frameNanos + intervalNanos - start).toDouble() / durationNanos) else 1.0
    }
}
