package com.plhery.scootradar.core.model

import java.time.Instant
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.atan
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.math.tan

// From ios/ScootRadar/Models/WalkRoute.swift.

/**
 * The distance to another point, as Core Location measures it: along the WGS 84 ellipsoid, here by Vincenty's
 * formulae. Core Location's own differs from the true geodesic by a few centimetres in a walk at the latitude
 * of Zürich, and by up to a few metres near the Arctic Circle.
 */
fun GeoPoint.distance(to: GeoPoint): Double {
    val semiMajorAxis = 6_378_137.0
    val flattening = 1 / 298.257223563
    val semiMinorAxis = semiMajorAxis * (1 - flattening)
    val radians = PI / 180
    val longitudeDelta = (to.longitude - longitude) * radians
    val reducedFrom = atan((1 - flattening) * tan(latitude * radians))
    val reducedTo = atan((1 - flattening) * tan(to.latitude * radians))
    val sinFrom = sin(reducedFrom)
    val cosFrom = cos(reducedFrom)
    val sinTo = sin(reducedTo)
    val cosTo = cos(reducedTo)
    var lambda = longitudeDelta
    var sinSigma: Double
    var cosSigma: Double
    var sigma: Double
    var cosSquaredAlpha: Double
    var cosTwiceMidpoint: Double
    var iterations = 0
    while (true) {
        val sinLambda = sin(lambda)
        val cosLambda = cos(lambda)
        sinSigma = sqrt(
            (cosTo * sinLambda) * (cosTo * sinLambda) +
                (cosFrom * sinTo - sinFrom * cosTo * cosLambda) * (cosFrom * sinTo - sinFrom * cosTo * cosLambda),
        )
        if (sinSigma == 0.0) return 0.0
        cosSigma = sinFrom * sinTo + cosFrom * cosTo * cosLambda
        sigma = atan2(sinSigma, cosSigma)
        val sinAlpha = cosFrom * cosTo * sinLambda / sinSigma
        cosSquaredAlpha = 1 - sinAlpha * sinAlpha
        // On the equator.
        cosTwiceMidpoint = if (cosSquaredAlpha != 0.0) cosSigma - 2 * sinFrom * sinTo / cosSquaredAlpha else 0.0
        val c = flattening / 16 * cosSquaredAlpha * (4 + flattening * (4 - 3 * cosSquaredAlpha))
        val previous = lambda
        lambda = longitudeDelta + (1 - c) * flattening * sinAlpha *
            (sigma + c * sinSigma * (cosTwiceMidpoint + c * cosSigma * (-1 + 2 * cosTwiceMidpoint * cosTwiceMidpoint)))
        iterations += 1
        // Points nearly opposite each other may not settle: the last value is near enough.
        if (abs(lambda - previous) < 1e-12 || iterations >= 200) break
    }
    val uSquared = cosSquaredAlpha *
        (semiMajorAxis * semiMajorAxis - semiMinorAxis * semiMinorAxis) / (semiMinorAxis * semiMinorAxis)
    val a = 1 + uSquared / 16_384 * (4_096 + uSquared * (-768 + uSquared * (320 - 175 * uSquared)))
    val b = uSquared / 1_024 * (256 + uSquared * (-128 + uSquared * (74 - 47 * uSquared)))
    val sigmaDelta = b * sinSigma * (
        cosTwiceMidpoint + b / 4 * (
            cosSigma * (-1 + 2 * cosTwiceMidpoint * cosTwiceMidpoint) -
                b / 6 * cosTwiceMidpoint * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cosTwiceMidpoint * cosTwiceMidpoint)
            )
        )
    return semiMinorAxis * a * (sigma - sigmaDelta)
}

/**
 * The walking path drawn on the map, from the rider or the searched place to a scooter or a bay: the route
 * found, joined to both ends by a short straight piece where it stops short of them. Lengths are measured on
 * a flat map in metres around the start, which is exact enough for walks of ten kilometres.
 */
class WalkRoute(points: List<GeoPoint>) {
    /** Where a location lies on the path. */
    data class Position(
        /** How far along the path, from its start. */
        val along: Double,
        /** How far the location is from the path. */
        val offset: Double,
        /** The nearest place on the path. */
        val point: GeoPoint,
        /** The piece of the path it is on: from `points[segment]` to `points[segment + 1]`. */
        val segment: Int,
    )

    // A single point is a path of no length, which still has two ends.
    val points: List<GeoPoint> = if (points.size == 1) points + points else points.toList()

    private val frame = LocalFrame(reference = this.points.firstOrNull() ?: GeoPoint(latitude = 0.0, longitude = 0.0))
    private val planar: List<Planar> = this.points.map(frame::project)

    /** From the start of the path to each of its points, in metres. */
    val distances: List<Double> = buildList(planar.size) {
        var walked = 0.0
        for (index in planar.indices) {
            if (index > 0) walked += (planar[index] - planar[index - 1]).length
            add(walked)
        }
    }

    /**
     * The route found, joined to where the walk starts and to the scooter or the bay where it stops more
     * than two metres short of them: the trail then visibly leaves the rider and reaches the dot.
     */
    constructor(origin: GeoPoint, path: List<GeoPoint>, target: GeoPoint) : this(connected(origin, path, target))

    /** The whole length of the path, connectors included. */
    val length: Double get() = distances.lastOrNull() ?: 0.0

    val start: GeoPoint? get() = points.firstOrNull()
    val end: GeoPoint? get() = points.lastOrNull()

    /** What is left of the path from a place along it. */
    fun remainingDistance(from: Double): Double = swiftMax(0.0, length - from)

    /** The path still to walk: from the place on it, through the points after it. */
    fun remainingPath(from: Position): List<GeoPoint> {
        if (from.segment + 1 >= points.size) return listOf(from.point)
        return listOf(from.point) + points.subList(from.segment + 1, points.size)
    }

    /**
     * Where a location lies on the path, searched from the rider's progress on: never more than thirty
     * metres back from it, and, of two places about as near, the earlier one. Null for a path without
     * points.
     */
    fun position(of: GeoPoint, after: Double = 0.0): Position? {
        if (points.size < 2) return null
        val target = frame.project(of)
        val earliest = after - backtrackDistance
        var bestScore = 0.0
        var best: Position? = null
        for (segment in 0 until points.size - 1) {
            // As Swift's `where distances[segment + 1] >= earliest`, which keeps no segment after a NaN.
            if (!(distances[segment + 1] >= earliest)) continue
            val start = planar[segment]
            val direction = planar[segment + 1] - start
            val segmentLength = distances[segment + 1] - distances[segment]
            val squared = direction.dot(direction)
            var share = if (squared > 0) (target - start).dot(direction) / squared else 0.0
            share = swiftMin(1.0, swiftMax(0.0, share))
            // The piece that holds the earliest place allowed starts there.
            if (segmentLength > 0 && distances[segment] + share * segmentLength < earliest) {
                share = swiftMin(1.0, (earliest - distances[segment]) / segmentLength)
            }
            val nearest = start + direction * share
            val offset = (target - nearest).length
            val along = distances[segment] + share * segmentLength
            val score = offset + aheadPenalty * swiftMax(0.0, along - after)
            if (best != null && bestScore <= score) continue
            bestScore = score
            best = Position(along = along, offset = offset, point = frame.unproject(nearest), segment = segment)
        }
        return best
    }

    // Equality here is Swift's: the frame and the flat points follow from the points.
    override fun equals(other: Any?): Boolean =
        other is WalkRoute && points == other.points && distances == other.distances

    override fun hashCode(): Int = points.hashCode()

    override fun toString(): String = "WalkRoute(points=$points, distances=$distances)"

    companion object {
        /** Further than this in a straight line is not a walk: the maps app opens instead. */
        const val longestWalk = 10_000.0

        /** Within this of the scooter or the bay, in a straight line, the rider is there. */
        const val arrivalDistance = 20.0

        /**
         * Further from the path than this, or than one and a half times the accuracy of the location, the
         * rider has left it.
         */
        const val offRouteDistance = 40.0
        const val offRouteAccuracyFactor = 1.5

        /** A scooter that moved further than this from the end of the path gets a new path. */
        const val targetMoveDistance = 25.0

        /** A new path is asked for at most this often, in seconds, and this many times a walk. */
        const val rerouteInterval = 15.0
        const val maximumReroutes = 10

        /**
         * The path found is joined to the rider and to the scooter when it begins or ends further from them
         * than this.
         */
        const val connectorDistance = 2.0

        /**
         * How far back along the path a new location may be placed: a path that passes the same street
         * twice does not send the rider back to the first time.
         */
        const val backtrackDistance = 30.0

        /** A vehicle of the same provider this close to a scooter that vanished from the data is that scooter under a new id. */
        const val rebindDistance = 15.0

        /**
         * Of two places on the path about as near, the earlier one: a metre for every twenty ahead of the
         * rider. A path that comes back beside itself does not make the rider jump to its end.
         */
        private const val aheadPenalty = 0.05

        private fun connected(origin: GeoPoint, path: List<GeoPoint>, target: GeoPoint): List<GeoPoint> {
            val points = path.toMutableList()
            val first = points.firstOrNull()
            // The route's own start is close enough.
            if (first == null || origin.distance(to = first) > connectorDistance) points.add(0, origin)
            val last = points.last()
            if (last.distance(to = target) > connectorDistance) points.add(target)
            return points
        }

        /** Whether a location this far from the path has left it. */
        fun isOffRoute(offset: Double, accuracy: Double): Boolean =
            offset > swiftMax(offRouteDistance, offRouteAccuracyFactor * swiftMax(0.0, accuracy))

        /** Whether the rider is at the scooter or the bay. */
        fun hasArrived(location: GeoPoint, at: GeoPoint): Boolean = location.distance(to = at) <= arrivalDistance

        /** Whether the way from one point to the other is a walk at all. */
        fun isWalk(from: GeoPoint, to: GeoPoint): Boolean = from.distance(to = to) <= longestWalk
    }

    /** A point in metres east (x) and north (y) of the frame's reference. */
    private data class Planar(val x: Double, val y: Double) {
        operator fun plus(other: Planar) = Planar(x + other.x, y + other.y)
        operator fun minus(other: Planar) = Planar(x - other.x, y - other.y)
        operator fun times(factor: Double) = Planar(x * factor, y * factor)
        fun dot(other: Planar): Double = x * other.x + y * other.y
        val length: Double get() = sqrt(dot(this))
    }

    /** Metres east and north of a reference point. */
    private class LocalFrame(val reference: GeoPoint) {
        val metresPerDegreeLongitude: Double = metresPerDegreeLatitude * swiftMax(0.01, cos(reference.latitude * PI / 180))

        fun project(point: GeoPoint): Planar = Planar(
            (point.longitude - reference.longitude) * metresPerDegreeLongitude,
            (point.latitude - reference.latitude) * metresPerDegreeLatitude,
        )

        fun unproject(point: Planar): GeoPoint = GeoPoint(
            latitude = reference.latitude + point.y / metresPerDegreeLatitude,
            longitude = reference.longitude + point.x / metresPerDegreeLongitude,
        )

        companion object {
            const val metresPerDegreeLatitude = 6_371_008.8 * PI / 180
        }
    }
}

/** What a walk leads to: the scooter or the bay whose card asked for it. */
sealed interface ScooterWalkTarget {
    data class Scooter(val scooter: com.plhery.scootradar.core.model.Scooter) : ScooterWalkTarget

    data class Parking(val parking: ScooterParking) : ScooterWalkTarget

    val id: String
        get() = when (this) {
            is Scooter -> scooter.id
            is Parking -> parking.id
        }

    val point: GeoPoint
        get() = when (this) {
            is Scooter -> GeoPoint(latitude = scooter.latitude, longitude = scooter.longitude)
            is Parking -> GeoPoint(latitude = parking.latitude, longitude = parking.longitude)
        }

    val provider: String
        get() = when (this) {
            is Scooter -> scooter.provider
            is Parking -> parking.provider
        }

    /** The target analytics name, as the web sends it. */
    val analyticsTarget: String
        get() = when (this) {
            is Scooter -> "vehicle"
            is Parking -> "parking"
        }

    /** The same scooter or bay, whatever has changed about it since. */
    fun isSameAs(other: ScooterWalkTarget): Boolean = when {
        this is Scooter && other is Scooter -> scooter.id == other.scooter.id
        this is Parking && other is Parking -> parking.id == other.parking.id
        else -> false
    }
}

/** Where a walk starts: the searched place, or the rider wherever they are. */
sealed interface ScooterWalkOrigin {
    data class Place(val destination: MapDestination) : ScooterWalkOrigin

    data object Rider : ScooterWalkOrigin
}

/** Why a walk has no path. */
enum class ScooterWalkFailure {
    /** There was nothing to walk from: the rider could not be located. */
    NoLocation,

    /** No way on foot was found, or the directions could not be asked. */
    NoRoute,
}

/** Where a walk stands. Without a walk the card simply offers Directions. */
sealed interface ScooterWalkPhase {
    /** Waiting for the first location to walk from. */
    data object Locating : ScooterWalkPhase

    /** The path is being found. */
    data object Finding : ScooterWalkPhase

    /** The path is on the map. */
    data object Shown : ScooterWalkPhase

    /** No path: the card offers the maps app instead. */
    data class Failed(val failure: ScooterWalkFailure) : ScooterWalkPhase

    /** The rider is at the scooter or the bay. */
    data object Arrived : ScooterWalkPhase

    /** The scooter left the data while it was walked to: someone may have taken it. */
    data object Gone : ScooterWalkPhase
}

/** What the Directions button of a card is. */
enum class ScooterDirectionsControl {
    /** Directions: draws the walking path. */
    Directions,

    /** A spinner in place of the icon while the rider is located or the path found. */
    Finding,

    /** Hide route, while the path is on the map. */
    HideRoute,

    /** Open in Maps, when no path was found. */
    OpenInMaps,

    /** No button: the scooter is gone. */
    None,
}

/** The line a card shows about its walk. */
enum class ScooterWalkNote {
    NoLocation,
    NoRoute,
    Arrived,
    Gone,
    ;

    val text: String
        get() = when (this) {
            NoLocation -> localized("Couldn’t find your location.")
            NoRoute -> localized("Couldn’t find a walking route.")
            Arrived -> localized("You’re there.")
            Gone -> localized("No longer on the map. Someone may have taken it.")
        }

    /** The SF Symbol the iPhone app shows beside it. */
    val systemImage: String
        get() = when (this) {
            NoLocation -> "location.slash"
            NoRoute -> "exclamationmark.triangle"
            Arrived -> "checkmark.circle.fill"
            Gone -> "questionmark.circle"
        }
}

/**
 * What the map draws of a walk: the path, how much of it is behind the rider, and whether it is a path just
 * found, which the camera fits and which then draws itself from the start to the scooter.
 */
data class WalkTrail(
    /** A new value means a new path; the same value, the same path walked further. */
    val revision: Int,
    val points: List<GeoPoint>,
    /** The share of the path already walked, which the trail no longer shows. */
    val walked: Double,
    val reveals: Boolean,
)

/** What TalkBack is told about the walk. Each one is new, even with the same words. */
data class ScooterWalkAnnouncement(val text: String, val serial: Int)

/**
 * The walk to the selected scooter or bay, from a tap on Directions until it is hidden, the card closes or
 * another scooter or bay is chosen.
 */
data class ScooterWalk(
    val target: ScooterWalkTarget,
    val phase: ScooterWalkPhase,
    /** Null while the rider is still being located. */
    val origin: ScooterWalkOrigin? = null,
    val route: WalkRoute? = null,
    /** How far along the route the rider is. */
    val progress: Double = 0.0,
    /** Counts the routes put on the map. */
    val routeRevision: Int = 0,
    /**
     * The route on the map was found from a new start: the camera fits it and it draws itself. A route
     * found again on the way only swaps in.
     */
    val reveals: Boolean = false,
    /** New paths asked for on the way, and when the last path was asked for. */
    val reroutes: Int = 0,
    val lastRequestAt: Instant? = null,
) {
    /**
     * Locating, finding or showing the path. The scooter or the bay stays selected and on the map wherever
     * the map goes, and a tap on the empty map leaves the card open.
     */
    val isUnderway: Boolean
        get() = when (phase) {
            ScooterWalkPhase.Locating, ScooterWalkPhase.Finding, ScooterWalkPhase.Shown -> true
            is ScooterWalkPhase.Failed, ScooterWalkPhase.Arrived, ScooterWalkPhase.Gone -> false
        }

    /** The walk keeps the card open: while under way, and once the scooter is gone, until the rider closes it. */
    val holdsCard: Boolean get() = isUnderway || phase == ScooterWalkPhase.Gone

    /** The scooter drawn on the map whatever the filters and the data leave out. */
    val heldScooter: Scooter?
        get() = if (isUnderway && target is ScooterWalkTarget.Scooter) target.scooter else null

    /** The bay drawn on the map whatever the zoom and the data leave out. */
    val heldParking: ScooterParking?
        get() = if (isUnderway && target is ScooterWalkTarget.Parking) target.parking else null

    /** What is left to walk along the route, while it is on the map. */
    val remainingDistance: Double?
        get() {
            if (phase != ScooterWalkPhase.Shown || route == null) return null
            return route.remainingDistance(from = progress)
        }

    val trail: WalkTrail?
        get() {
            if (phase != ScooterWalkPhase.Shown || route == null) return null
            return WalkTrail(
                revision = routeRevision,
                points = route.points,
                walked = if (route.length > 0) swiftMin(1.0, swiftMax(0.0, progress / route.length)) else 0.0,
                reveals = reveals,
            )
        }

    val control: ScooterDirectionsControl
        get() = when (phase) {
            ScooterWalkPhase.Locating, ScooterWalkPhase.Finding -> ScooterDirectionsControl.Finding
            ScooterWalkPhase.Shown -> ScooterDirectionsControl.HideRoute
            is ScooterWalkPhase.Failed -> ScooterDirectionsControl.OpenInMaps
            ScooterWalkPhase.Arrived -> ScooterDirectionsControl.Directions
            ScooterWalkPhase.Gone -> ScooterDirectionsControl.None
        }

    val note: ScooterWalkNote?
        get() = when (phase) {
            is ScooterWalkPhase.Failed -> when (phase.failure) {
                ScooterWalkFailure.NoLocation -> ScooterWalkNote.NoLocation
                ScooterWalkFailure.NoRoute -> ScooterWalkNote.NoRoute
            }
            ScooterWalkPhase.Arrived -> ScooterWalkNote.Arrived
            ScooterWalkPhase.Gone -> ScooterWalkNote.Gone
            ScooterWalkPhase.Locating, ScooterWalkPhase.Finding, ScooterWalkPhase.Shown -> null
        }
}
