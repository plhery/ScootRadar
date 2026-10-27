package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.api.WalkingDirectionsError
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterDirectionsControl
import com.plhery.scootradar.core.model.ScooterMapLook
import com.plhery.scootradar.core.model.ScooterProviderHealth
import com.plhery.scootradar.core.model.ScooterResponseMetadata
import com.plhery.scootradar.core.model.ScooterWalk
import com.plhery.scootradar.core.model.ScooterWalkAnnouncement
import com.plhery.scootradar.core.model.ScooterWalkFailure
import com.plhery.scootradar.core.model.ScooterWalkNote
import com.plhery.scootradar.core.model.ScooterWalkOrigin
import com.plhery.scootradar.core.model.ScooterWalkPhase
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.WalkRoute
import com.plhery.scootradar.core.model.WalkTrail
import com.plhery.scootradar.core.model.distance
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.core.model.timeIntervalSince
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

// The walking route of ios/ScootRadar/ViewModels/ScooterMapModel.swift.

/** What the Directions button of the card of this scooter or bay is. */
fun ScooterMapController.directionsControl(target: ScooterWalkTarget): ScooterDirectionsControl {
    val walk = walk.value
    if (walk == null || !walk.target.isSameAs(target)) return ScooterDirectionsControl.Directions
    return walk.control
}

/** The line the card of this scooter or bay shows about its walk, if any. */
fun ScooterMapController.walkNote(target: ScooterWalkTarget): ScooterWalkNote? {
    val walk = walk.value
    if (walk == null || !walk.target.isSameAs(target)) return null
    return walk.note
}

/** The route the map draws, while there is one. */
val ScooterMapController.walkTrail: WalkTrail? get() = walk.value?.trail

/** A walk is under way: the scooter or the bay stays selected and on the map wherever the map goes, and a tap on the empty map keeps its card open. */
val ScooterMapController.isWalking: Boolean get() = walk.value?.isUnderway == true

/** What is left to walk along the route on the map. */
val ScooterMapController.walkRemainingMetres: Double? get() = walk.value?.remainingDistance

/**
 * Directions on a card: the way on foot from the searched place, or from the rider, to the scooter or the
 * bay, drawn on the map. A rider not yet located is located first, and the map stays where it is meanwhile.
 */
fun ScooterMapController.showWalkingRoute(target: ScooterWalkTarget) {
    analytics?.track("directions_open", provider = target.provider, target = target.analyticsTarget)
    cancelRouteRequest()
    val origin = activeOrigin
    if (origin == null) {
        setWalk(ScooterWalk(target = target, phase = ScooterWalkPhase.Locating))
        announceWalk(localized("Finding the way…"))
        // A location already on its way is waited for.
        if (!isLocating.value) locateForWalkingTime()
        return
    }
    startWalk(target, origin = origin, asked = true)
}

/** Hide route: the trail fades and the card offers Directions again. */
fun ScooterMapController.hideWalkingRoute() {
    endWalk()
}

/** Open in Maps, once no route was found: the maps app takes over, as Directions did before the route was drawn in the app. */
fun ScooterMapController.openWalkInMaps(target: ScooterWalkTarget) {
    analytics?.track("directions_open", provider = target.provider, target = target.analyticsTarget)
    openInMaps(target)
}

/**
 * `asked` when the rider is waiting for this route: a tap on Directions, and the location it waited for. Only
 * that route is reported, and only a walk too long for that opens the maps app.
 */
private fun ScooterMapController.startWalk(target: ScooterWalkTarget, origin: NearbyOrigin, asked: Boolean) {
    cancelRouteRequest()
    val start = walkOrigin(origin)
    if (!WalkRoute.isWalk(from = origin.point, to = target.point)) {
        setWalk(null)
        if (asked) {
            trackRouteResult("too_far", target)
            openInMaps(target)
        }
        return
    }
    if (start == ScooterWalkOrigin.Rider && WalkRoute.hasArrived(origin.point, at = target.point)) {
        // Already there: nothing to find.
        setWalk(ScooterWalk(target = target, phase = ScooterWalkPhase.Arrived, origin = ScooterWalkOrigin.Rider))
        reportArrival(target)
        return
    }
    setWalk(ScooterWalk(target = target, phase = ScooterWalkPhase.Finding, origin = start))
    announceWalk(localized("Finding the way…"))
    requestRoute(origin.point, reveals = true, reports = asked)
}

/**
 * Asks for the way. A route that `reveals` is fitted on the map and draws itself; a route found again on the
 * way only takes the old one's place, which stays on the map meanwhile.
 */
private fun ScooterMapController.requestRoute(origin: GeoPoint, reveals: Boolean, reports: Boolean) {
    val walk = walk.value ?: return
    cancelRouteRequest()
    routeRequests += 1
    val request = routeRequests
    val target = walk.target
    setWalk(walk.copy(lastRequestAt = clock()))
    val directions = directions
    routeTask = scope.launch {
        var tooFar = false
        val path = try {
            directions.walkingPath(from = origin, to = target.point)
        } catch (_: CancellationException) {
            null
        } catch (error: WalkingDirectionsError) {
            tooFar = error.reason == WalkingDirectionsError.Reason.TooFar
            null
        } catch (_: Exception) {
            null
        }
        // A request that was replaced or cancelled answers nothing.
        if (!isActive || request != routeRequests) return@launch
        routeTask = null
        if (tooFar) {
            routeTooFar(target, reports = reports)
        } else {
            routeFound(path, origin = origin, target = target, reveals = reveals, reports = reports)
        }
    }
}

/**
 * The site measures its ten kilometres on a sphere, a little longer than the map does on the Earth's own shape,
 * so it can refuse a walk the map let through: such a walk is too long, as the iPhone, whose maps route it,
 * never says no route for it.
 */
private fun ScooterMapController.routeTooFar(target: ScooterWalkTarget, reports: Boolean) {
    val walk = walk.value ?: return
    // A route asked for again on the way keeps the one on the map.
    if (walk.phase != ScooterWalkPhase.Finding) return
    setWalk(null)
    if (reports) {
        trackRouteResult("too_far", target)
        openInMaps(target)
    }
}

private fun ScooterMapController.routeFound(
    path: List<GeoPoint>?,
    origin: GeoPoint,
    target: ScooterWalkTarget,
    reveals: Boolean,
    reports: Boolean,
) {
    val walk = walk.value ?: return
    if (walk.phase != ScooterWalkPhase.Finding && walk.phase != ScooterWalkPhase.Shown) return
    if (path.isNullOrEmpty()) {
        // A route asked for again on the way keeps the one on the map.
        if (walk.phase != ScooterWalkPhase.Finding) return
        setWalk(walk.copy(phase = ScooterWalkPhase.Failed(ScooterWalkFailure.NoRoute), route = null))
        if (reports) trackRouteResult("error", walk.target)
        announceWalk(ScooterWalkNote.NoRoute.text)
        return
    }
    val route = WalkRoute(origin = origin, path = path, target = target.point)
    routeRevisions += 1
    val shown = walk.copy(
        route = route,
        routeRevision = routeRevisions,
        reveals = reveals,
        progress = 0.0,
        phase = ScooterWalkPhase.Shown,
    )
    setWalk(shown)
    if (reports) trackRouteResult("success", shown.target)
    if (reveals) {
        announceWalk(
            stringFormat(
                localized("Route shown: ≈%1\$lld min walk · %2\$@"),
                ScooterMapLook.walkingMinutes(metres = route.length).toLong(),
                Scooter.formattedLength(route.length),
            ),
        )
    }
    // The rider may have walked on while the way was found.
    val userLocation = userLocation.value
    if (shown.origin == ScooterWalkOrigin.Rider && userLocation != null) riderMoved(userLocation)
}

/**
 * The searched place or the rider changed. A walk waiting for a location begins; a walk under way follows the
 * rider, or begins again from another place; a walk that ended goes once its origin is another.
 */
internal fun ScooterMapController.walkOriginDidChange() {
    val walk = walk.value ?: return
    val origin = activeOrigin
    when (walk.phase) {
        ScooterWalkPhase.Locating -> {
            origin ?: return
            startWalk(walk.target, origin = origin, asked = true)
        }
        ScooterWalkPhase.Finding, ScooterWalkPhase.Shown -> {
            if (origin == null) return endWalk()
            if (walkOrigin(origin) != walk.origin) {
                // Fitted and drawn again, from where the walk now starts.
                startWalk(walk.target, origin = origin, asked = false)
            } else if (walk.origin == ScooterWalkOrigin.Rider) {
                riderMoved(origin.point)
            }
        }
        is ScooterWalkPhase.Failed, ScooterWalkPhase.Arrived -> {
            if (origin?.let { walkOrigin(it) } != walk.origin) setWalk(null)
        }
        ScooterWalkPhase.Gone -> {}
    }
}

/**
 * The rider walked on. The route behind them goes; a rider who left the route, or whose scooter moved away
 * from its end, gets a new one, at most every fifteen seconds. The camera never follows.
 */
private fun ScooterMapController.riderMoved(point: GeoPoint) {
    val walk = walk.value ?: return
    if (walk.origin != ScooterWalkOrigin.Rider || !walk.isUnderway) return
    if (WalkRoute.hasArrived(point, at = walk.target.point)) return arrive()
    val route = walk.route
    if (walk.phase != ScooterWalkPhase.Shown || route == null) return
    val position = route.position(of = point, after = walk.progress) ?: return
    if (WalkRoute.isOffRoute(position.offset, accuracy = locationAccuracy)) {
        rerouteIfAllowed(point)
        return
    }
    if (position.along != walk.progress) {
        setWalk(walk.copy(progress = position.along))
    }
    if (walkTargetLeftRoute) rerouteIfAllowed(point)
}

/** The scooter is further from the end of the route than a scooter standing where it stood. */
private val ScooterMapController.walkTargetLeftRoute: Boolean
    get() {
        val walk = walk.value ?: return false
        val end = walk.route?.end ?: return false
        return end.distance(to = walk.target.point) > WalkRoute.targetMoveDistance
    }

private fun ScooterMapController.rerouteIfAllowed(point: GeoPoint) {
    val walk = walk.value ?: return
    if (walk.phase != ScooterWalkPhase.Shown || walk.origin != ScooterWalkOrigin.Rider || routeTask != null ||
        walk.reroutes >= WalkRoute.maximumReroutes
    ) {
        return
    }
    val last = walk.lastRequestAt
    if (last != null && clock().timeIntervalSince(last) < WalkRoute.rerouteInterval) return
    setWalk(walk.copy(reroutes = walk.reroutes + 1))
    requestRoute(point, reveals = false, reports = false)
}

/** The rider is at the scooter or the bay: the trail fades and the card says so. */
private fun ScooterMapController.arrive() {
    cancelRouteRequest()
    val walk = walk.value ?: return
    setWalk(walk.copy(phase = ScooterWalkPhase.Arrived, route = null))
    reportArrival(walk.target)
}

private fun ScooterMapController.reportArrival(target: ScooterWalkTarget) {
    analytics?.track("route_arrived", provider = target.provider, target = target.analyticsTarget)
    announceWalk(ScooterWalkNote.Arrived.text)
}

/**
 * Fresh data about the scooter walked to. It may have moved, and the route then follows it; or data that
 * would list it no longer does, which mostly means someone took it. Scooters get new ids now and then, so one
 * of the same provider standing where it stood is that scooter.
 */
internal fun ScooterMapController.followWalkTarget(meta: ScooterResponseMetadata?, loadedFor: GeoBounds) {
    val walk = walk.value ?: return
    if (!walk.holdsCard) return
    val scooter = (walk.target as? ScooterWalkTarget.Scooter)?.scooter ?: return
    val fresh = vehiclesByID[scooter.id]
    if (fresh != null) {
        if (walk.phase == ScooterWalkPhase.Gone) {
            // Back on the map: its card is a scooter's card again.
            setWalk(null)
            return
        }
        if (fresh == scooter) return
        setWalk(walk.copy(target = ScooterWalkTarget.Scooter(fresh)))
        val userLocation = userLocation.value
        if (walkTargetLeftRoute && walk.origin == ScooterWalkOrigin.Rider && userLocation != null) rerouteIfAllowed(userLocation)
        return
    }
    val point = scooter.coordinate
    if (!walk.isUnderway || !listsEveryScooter(scooter.provider, at = point, meta = meta, loadedFor = loadedFor)) {
        return
    }
    val successor = vehicles.value
        .filter { it.provider == scooter.provider }
        .map { it to it.distance(from = point) }
        .filter { it.second <= WalkRoute.rebindDistance }
        .minByOrNull { it.second }
        ?.first
    if (successor != null) {
        setWalk(walk.copy(target = ScooterWalkTarget.Scooter(successor)))
        setSelectedScooterID(successor.id)
        val userLocation = userLocation.value
        if (walkTargetLeftRoute && walk.origin == ScooterWalkOrigin.Rider && userLocation != null) rerouteIfAllowed(userLocation)
        return
    }
    cancelRouteRequest()
    setWalk(walk.copy(phase = ScooterWalkPhase.Gone, route = null))
    announceWalk(ScooterWalkNote.Gone.text)
}

/**
 * Whether data would list the scooter if it were still there: single scooters, not cut short, loaded around
 * it, with every feed of its provider in. A failed feed nobody can name might be its provider's.
 */
private fun listsEveryScooter(provider: String, at: GeoPoint, meta: ScooterResponseMetadata?, loadedFor: GeoBounds): Boolean {
    if (!loadedFor.contains(at)) return false
    meta ?: return true
    if (meta.mode == "clusters" || meta.overview || meta.truncated) return false
    return meta.failedSources.all { source ->
        val failed = ScooterProviderHealth.provider(forSource = source) ?: return@all false
        failed.rawValue != provider
    }
}

/** Closing the card or choosing another scooter or bay ends the walk. */
internal fun ScooterMapController.endWalkIfTargetLeftSelection() {
    val walk = walk.value ?: return
    val isSelected = when (val target = walk.target) {
        is ScooterWalkTarget.Scooter -> selectedScooterID.value == target.scooter.id
        is ScooterWalkTarget.Parking -> selectedParkingID.value == target.parking.id
    }
    if (!isSelected) endWalk()
}

private fun ScooterMapController.endWalk() {
    cancelRouteRequest()
    setWalk(null)
}

private fun ScooterMapController.cancelRouteRequest() {
    routeTask?.cancel()
    routeTask = null
}

internal fun ScooterMapController.walkDidChange(old: ScooterWalk?) {
    if (old?.heldScooter != walk.value?.heldScooter) rebuildMapScooters()
    val filter = if (walk.value?.isUnderway == true && walk.value?.origin == ScooterWalkOrigin.Rider) {
        ScooterMapController.WALKING_DISTANCE_FILTER
    } else {
        ScooterMapController.DISTANCE_FILTER
    }
    if (locationManager.distanceFilter != filter) locationManager.distanceFilter = filter
}

/** What is left of the route on the map to this scooter or bay. */
internal fun ScooterMapController.routeDistance(target: ScooterWalkTarget): Double? {
    val walk = walk.value
    if (walk == null || !walk.target.isSameAs(target)) return null
    return walk.remainingDistance
}

internal fun ScooterMapController.announceWalk(text: String) {
    walkAnnouncements += 1
    _walkAnnouncement.value = ScooterWalkAnnouncement(text = text, serial = walkAnnouncements)
}

private fun ScooterMapController.trackRouteResult(result: String, target: ScooterWalkTarget) {
    analytics?.track("route_result", provider = target.provider, result = result, target = target.analyticsTarget)
}

private fun walkOrigin(origin: NearbyOrigin): ScooterWalkOrigin = when (origin) {
    is NearbyOrigin.SearchedDestination -> ScooterWalkOrigin.Place(origin.destination)
    is NearbyOrigin.UserLocation -> ScooterWalkOrigin.Rider
}
