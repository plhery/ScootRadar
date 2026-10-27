package com.plhery.scootradar.core.model

import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.sin
import kotlin.time.Duration
import kotlin.time.Duration.Companion.milliseconds

// WalkTrailLook and the camera's fit of a route from ios/ScootRadar/Views/WalkTrailOverlay.swift; the rest of
// that file draws the trail on the map.

/**
 * How the walking route looks on the map: round dots in the blue of the selected scooter's ring, each on a
 * slightly larger dot of the map's own ground, so that the trail reads over roads, parks and buildings alike.
 */
object WalkTrailLook {
    const val dotWidth: Double = 6.0
    const val casingWidth: Double = 9.0

    /**
     * One dot every 11 points along the route, as the web draws it with a dash of no length between round
     * caps. MapKit draws dashed lines two to three times too wide and too far apart, so each dot is a stroke
     * of its own, this short, with round caps, laid out again when the map zooms.
     */
    const val dotSpacing: Double = 11.0
    const val dotStroke: Double = 0.05

    /** A long route seen up close has its dots further apart rather than more of them. */
    const val maximumDots: Int = 3_000

    /** The trail draws itself from the start of the walk to the scooter in this time, once the map shows the whole route. */
    val revealDuration: Duration = 700.milliseconds

    /** A trail that is hidden, or walked to its end, fades in this time. */
    val fadeDuration: Duration = 250.milliseconds

    /**
     * The camera move that fits a route lasts about this long; the trail draws itself after it, or after
     * this at the latest.
     */
    val fitDuration: Duration = 700.milliseconds

    /** Room around the route inside the part of the map left visible. */
    const val fitMargin: Double = 40.0

    /**
     * The map never comes closer than this many metres across to show a route: about street level, where
     * locating also brings it.
     */
    const val closestFitWidth: Double = 350.0

    const val dotColor: Long = ScooterMapLook.selectionRing

    /** White on a light map; on a dark map and on satellite pictures, the dark ground the dots are drawn on there. */
    fun casingColor(isDark: Boolean): Long = if (isDark) ScooterMapLook.darkGround else ScooterMapLook.white

    /** Quick at first, settling as it reaches the scooter: a cubic ease-out. */
    fun easeOut(progress: Double): Double {
        val remaining = 1 - swiftMin(1.0, swiftMax(0.0, progress))
        return 1 - remaining * remaining * remaining
    }

    /**
     * Where the dots of a route go: one every `spacing` map points from its start, in the part of it between
     * `from` and `to`, shares of its length. Counted from the start, a dot stays where it is while the trail
     * draws itself and while the part behind the rider goes.
     */
    fun dots(along: List<MapPoint>, spacing: Double, from: Double = 0.0, to: Double = 1.0): List<MapPoint> {
        val points = along
        if (!(points.size > 1 && spacing > 0 && spacing.isFinite() && to > from)) return emptyList()
        val lengths = mutableListOf(0.0)
        for ((start, end) in points.zipWithNext()) {
            lengths += lengths.last() + hypot(end.x - start.x, end.y - start.y)
        }
        val total = lengths.last()
        if (!(total > 0)) return emptyList()
        val step = swiftMax(spacing, total / maximumDots)
        val first = swiftMax(0.0, from) * total
        val last = swiftMin(1.0, to) * total
        val dots = mutableListOf<MapPoint>()
        var segment = 0
        var index = ceil(first / step)
        while (index * step <= last) {
            val distance = index * step
            while (segment < points.size - 2 && lengths[segment + 1] < distance) segment += 1
            val start = points[segment]
            val end = points[segment + 1]
            val length = lengths[segment + 1] - lengths[segment]
            val share = if (length > 0) swiftMin(1.0, (distance - lengths[segment]) / length) else 0.0
            dots += MapPoint(x = start.x + (end.x - start.x) * share, y = start.y + (end.y - start.y) * share)
            index += 1
        }
        return dots
    }

    /** How many map points one screen point spans in the middle of the map. */
    fun mapPointsPerPoint(on: ScooterMapProjection): Double? {
        val mapView = on
        val bounds = mapView.bounds
        val width = abs(bounds.width)
        if (!(width > 0 && abs(bounds.height) > 0)) return null
        val left = MapPoint(mapView.coordinate(ScreenPoint(bounds.midX - 50, bounds.midY)))
        val right = MapPoint(mapView.coordinate(ScreenPoint(bounds.midX + 50, bounds.midY)))
        val measured = hypot(right.x - left.x, right.y - left.y) / 100
        if (measured.isFinite() && measured > 0) return measured
        val overall = mapView.visibleMapRect.width / width
        return if (overall.isFinite() && overall > 0) overall else null
    }
}

/**
 * The map rect, in map points and without the map's turn, that shows a whole route in `visible`: the part
 * of a map of `size`, turned by `heading` degrees, that nothing covers. The route is as large as fits, but
 * never larger than `minimumScale` map points a screen point allows. Its centre lands on the centre of
 * `visible`, not of the map.
 */
fun ScooterMapCameraPolicy.rect(
    fitting: List<MapPoint>,
    heading: Double,
    size: ScreenSize,
    visible: ScreenRect,
    minimumScale: Double,
): MapRect? {
    val points = fitting
    val reference = points.firstOrNull() ?: return null
    if (!(size.width > 0 && size.height > 0 && abs(visible.width) > 0 && abs(visible.height) > 0)) return null
    // Along the screen: u to the right, v down, in map points.
    val angle = heading * PI / 180
    val cosine = cos(angle)
    val sine = sin(angle)
    var minimumU = Double.POSITIVE_INFINITY
    var maximumU = Double.NEGATIVE_INFINITY
    var minimumV = Double.POSITIVE_INFINITY
    var maximumV = Double.NEGATIVE_INFINITY
    for (point in points) {
        val x = point.x - reference.x
        val y = point.y - reference.y
        val u = x * cosine + y * sine
        val v = -x * sine + y * cosine
        minimumU = swiftMin(minimumU, u)
        maximumU = swiftMax(maximumU, u)
        minimumV = swiftMin(minimumV, v)
        maximumV = swiftMax(maximumV, v)
    }
    // Swift's max of three, max(max(a, b), c).
    val scale = swiftMax(
        swiftMax(minimumScale, (maximumU - minimumU) / abs(visible.width)),
        (maximumV - minimumV) / abs(visible.height),
    )
    if (!(scale.isFinite() && scale > 0)) return null
    // The camera looks at the middle of the map; the route's middle goes to the middle of what is visible.
    val centreU = (minimumU + maximumU) / 2 + (size.width / 2 - visible.midX) * scale
    val centreV = (minimumV + maximumV) / 2 + (size.height / 2 - visible.midY) * scale
    val centreX = reference.x + centreU * cosine - centreV * sine
    val centreY = reference.y + centreU * sine + centreV * cosine
    val width = size.width * scale
    val height = size.height * scale
    return MapRect(x = centreX - width / 2, y = centreY - height / 2, width = width, height = height)
}
