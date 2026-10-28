// The markers of ScooterMapView's coordinator, from ios/ScootRadar/Views/ScooterMapView.swift: its annotations,
// reconcile, updateLook, placePills, handleMapTap and the clusters' didSelect.

package com.plhery.scootradar.map

import android.animation.ValueAnimator
import android.os.SystemClock
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.MapPoint
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterCluster
import com.plhery.scootradar.core.model.ScooterClusteringPolicy
import com.plhery.scootradar.core.model.ScooterDistance
import com.plhery.scootradar.core.model.ScooterDotLook
import com.plhery.scootradar.core.model.ScooterDotState
import com.plhery.scootradar.core.model.ScooterGridClustering
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterMapCameraPolicy
import com.plhery.scootradar.core.model.ScooterMapLook
import com.plhery.scootradar.core.model.ScooterMapProjection
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.ScooterPillRequest
import com.plhery.scootradar.core.model.ScooterPillSide
import com.plhery.scootradar.core.model.ScooterSpreadDot
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.core.model.briefName
import com.plhery.scootradar.core.model.distance
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.floor
import kotlin.math.ln
import kotlin.math.log10
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

/**
 * A scooter on the map, as the coordinator keeps it (ScooterMapAnnotation). The scene sets how its dot looks and
 * where its name sits; the layers draw what they find.
 */
class ScooterMark(scooter: Scooter) {
    var scooter: Scooter = scooter
        private set

    var mapPoint: MapPoint = MapPoint(scooter.coordinate)
        private set

    var look = ScooterDotLook()
    var isStyled = false
    var usesDarkArt = false

    /** From the origin; null without one. */
    var metres: Double? = null

    /** The name beside the dot, and where it sits from the centre of the dot. */
    var pill: ScooterMarkerArt.PillContent? = null
    var pillOrigin = ScreenPoint.zero

    /** The dot is off the map or under the dock, or its name would be cut or lie on another: the name is not shown. */
    var pillIsCovered = false

    /** The dot lighting up, and the name coming in, while they last. */
    var dotFade: MarkerFade? = null
    var pillFade: MarkerFade? = null

    /** The name was shown when the look was last drawn: one that comes eases in. */
    internal var wasPillShown = false

    /** Takes the scooter as the server now has it. Returns whether anything changed. */
    fun update(with: Scooter): Boolean {
        if (scooter == with) return false
        val moved = scooter.latitude != with.latitude || scooter.longitude != with.longitude
        scooter = with
        if (moved) mapPoint = MapPoint(with.coordinate)
        return true
    }

    /** The picture of the dot as it is drawn now. */
    val art: ScooterMarkerArt.Key
        get() = ScooterMarkerArt.Key(scooter.providerInfo, look.diameter, look.state, look.showsInitials, usesDarkArt)

    /** The name as it is shown now: none while covered. */
    val shownPill: ScooterMarkerArt.PillContent? get() = if (pillIsCovered) null else pill
}

/**
 * A scooter, or a group of them, where it was last seen while the server collects it again
 * (ScooterLastSeenAnnotation): faded under every other marker, neither tapped nor read.
 */
class LastSeenMark(
    /** "v:" and the scooter's id, or "c:" and the group's. */
    val id: String,
    coordinate: GeoPoint,
    mark: Kind,
) {
    sealed interface Kind {
        data class Single(val provider: ScooterProvider?) : Kind

        /** The number in the ring, and the provider with the most of them, whose colour the ring takes. */
        data class Group(val count: Int, val provider: ScooterProvider?) : Kind

        companion object {
            fun group(of: ScooterCluster): Group = Group(of.count, ScooterMarkerScene.leadingProvider(of.providers))
        }
    }

    var coordinate: GeoPoint = coordinate
        private set
    var mark: Kind = mark
        private set

    fun update(coordinate: GeoPoint, mark: Kind): Boolean {
        val moved = this.coordinate.latitude != coordinate.latitude || this.coordinate.longitude != coordinate.longitude
        if (!moved && this.mark == mark) return false
        if (moved) this.coordinate = coordinate
        this.mark = mark
        return true
    }
}

/**
 * A group of scooters drawn as one disc with its number (ScooterClusterAnnotationView): the server's, city totals
 * among them (ScooterServerClusterAnnotation), or the app's own while zoomed out, in place of MapKit's
 * MKClusterAnnotation, which keeps its scooters.
 */
class ClusterMark(cluster: ScooterCluster, members: List<Scooter>?) {
    var cluster: ScooterCluster = cluster
        private set

    /** The scooters in it, for the app's own; null for the server's. */
    var members: List<Scooter>? = members
        private set

    val id: String get() = cluster.id
    val isServer: Boolean get() = members == null

    /** The provider with the most scooters in it lends its colour to the glow. */
    val provider: ScooterProvider? get() = ScooterMarkerScene.leadingProvider(cluster.providers)
    val diameter: Double get() = ScooterMarkerScene.clusterDiameter(cluster.count)

    /** Where totals touch, as neighbouring countries do zoomed out, the larger is drawn over the smaller. */
    val sortKey: Float get() = (500 + log10(cluster.count + 1.0) * 60).toFloat()

    fun update(with: ScooterCluster, members: List<Scooter>?): Boolean {
        if (cluster == with && this.members == members) return false
        cluster = with
        this.members = members
        return true
    }
}

/** Where a cluster that is opened takes the camera. */
sealed interface CameraMove {
    /** A region shown whole, tilted and turned as the map is: setRegionPreservingPerspective. */
    data class Region(val region: MapRegion) : CameraMove

    /** Places fitted in the part of the map left visible, as a route is fitted (MAP-052, MAP-302). */
    data class Fit(val coordinates: List<GeoPoint>) : CameraMove
}

/** A marker coming up from nothing: from a moment of the uptime clock, in seconds, over a length, along a curve. */
data class MarkerFade(val from: Double, val length: Double, val curve: Curve) {
    enum class Curve {
        /** The dots' light-up, CAMediaTimingFunction(0.22, 1, 0.36, 1). */
        LightUp,

        /** UIView.animate's ease in, ease out. */
        EaseInEaseOut,
        Linear,
    }

    fun isOver(at: Double): Boolean = at >= from + length
}

/** What the markers need of the map: where it shows a place, which way it faces, and whether it is on screen. */
interface MarkerMap {
    val projection: ScooterMapProjection

    /** The way the camera faces, in degrees clockwise from north. */
    val heading: Double

    /** The map is in a window: what changes on it eases in only there. */
    val isShown: Boolean

    /** The top of the map's safe area, in points. */
    val safeTop: Double
}

/**
 * What the screen around the map tells the markers, as the iPhone's ScooterMapView takes it from its screen.
 * Frames are in the map's points; the chrome's are empty until it is drawn over the map (milestone 4).
 */
data class MarkerParent(
    val origin: GeoPoint? = null,
    val walkRemainingMetres: Double? = null,
    val isWalking: Boolean = false,
    val usesServerClusters: Boolean = false,
    val language: ScooterLanguage = ScooterLanguage.En,
    /** The rider's place, while the rider is shown: names keep off it. */
    val userLocation: GeoPoint? = null,
    /** The search bar of the dock's layout, whose touches are not the map's. */
    val interactionExclusionFrame: ScreenRect? = null,
    /** Where the dock begins, in the dock's layout. */
    val bottomChromeTop: Double? = null,
    /** The locate button, the zone legend and the dock: what floats over the bottom of the map. */
    val bottomChromeFrames: List<ScreenRect> = emptyList(),
    /** The panel of a large window. */
    val panelFrame: ScreenRect? = null,
)

/**
 * The scooters, the bays and the faded markers of the iPhone's map coordinator, without a map of their own: it
 * keeps a mark for each, sizes the dots for their distance and the map's scale, names the nearest of each
 * provider, spreads the scooters that stand on one spot, chooses a side for each name, and works out what a tap
 * means. The layers draw what it keeps; the tests read it as they read the iPhone's annotations.
 */
class ScooterMarkerScene(
    private val art: ScooterMarkerArt,
    /** The controller's selectScooter, as the iPhone's onSelectionChange. */
    private val onSelectionChange: (String?) -> Unit = {},
    /** The controller's selectParking, as onParkingSelectionChange. */
    private val onParkingSelectionChange: (String?) -> Unit = {},
    /** The app's analytics: an event's name, and its provider. */
    private val track: (name: String, provider: String?) -> Unit = { _, _ -> },
    /** The camera's move to what a cluster holds. */
    private val move: (CameraMove) -> Unit = {},
    /** The uptime clock, in seconds. */
    private val now: () -> Double = { SystemClock.uptimeMillis() / 1000.0 },
    /** Whether the phone draws animations: off with Remove animations, the iPhone's Reduce Motion. */
    private val animates: () -> Boolean = { ValueAnimator.areAnimatorsEnabled() },
) {
    var parent = MarkerParent()

    /** Dark appearance, and the satellite picture in either appearance. */
    var isDark = false

    private val marksByID = HashMap<String, ScooterMark>()
    private var reconciledScooters: List<Scooter> = emptyList()
    private val serverClustersByID = LinkedHashMap<String, ClusterMark>()
    private var reconciledClusterRevision: Int? = null
    private val parkingByID = LinkedHashMap<String, ScooterParking>()
    private var reconciledParking: List<ScooterParking> = emptyList()
    private val lastSeenByID = HashMap<String, LastSeenMark>()
    private var reconciledLastSeenRevision: Int? = null
    private var reconciledScooterRevision: Int? = null

    var appliedSelectionID: String? = null
        private set
    var appliedParkingID: String? = null
        private set

    /** Zoomed out, the scooters gather into clusters; null until the map has a size. */
    var clusteringEnabled: Boolean? = null
        private set

    /** The app's own clusters, and the scooters in them, which are not drawn on their own. */
    private var clientClusters: List<ClusterMark> = emptyList()
    private var clusteredIDs: Set<String> = emptySet()
    private var clusterInputs: ClusterInputs? = null

    private data class ClusterInputs(val revision: Int?, val zoom: Int?, val heldID: String?)

    private var appliedLook: LookInputs? = null

    /** The scooters that carry their name, in the order the names are placed. */
    var namedIDs: List<String> = emptyList()
        private set
    private val pillSides = HashMap<String, ScooterPillSide>()

    /** The dots without a name around each named one, from its centre. */
    private var pillNeighbours = HashMap<String, List<ScreenRect>>()

    /** The dots light up once, the first time they appear. */
    private var lightUpEnds: Double? = null

    /**
     * Bumped when what a layer draws has changed: the dots and the bays, the names, the faded markers. The
     * layers write a source again only then.
     */
    var markersVersion = 0
        private set
    var pillsVersion = 0
        private set
    var lastSeenVersion = 0
        private set

    /** The searched place's pin (SearchedAddressAnnotation): one at most, replaced when the place changes. */
    var destination: MapDestination? = null
        private set

    fun applyDestination(destination: MapDestination?) {
        if (destination == this.destination) return
        this.destination = destination
        markersVersion += 1
    }

    /** Where the pin is, from its place: what names keep off, and what TalkBack outlines. */
    fun destinationFrame(projection: ScooterMapProjection): ScreenRect? {
        val place = destination ?: return null
        val point = projection.point(place.point)
        return ScreenRect(point.x - 16, point.y - 44, 32.0, 46.0)
    }

    val marks: Collection<ScooterMark> get() = marksByID.values
    val parking: Collection<ScooterParking> get() = parkingByID.values
    val lastSeen: Collection<LastSeenMark> get() = lastSeenByID.values

    fun mark(id: String): ScooterMark? = marksByID[id]

    /** The server's clusters and city totals, then the app's own clusters. */
    fun clusters(): List<ClusterMark> =
        if (clientClusters.isEmpty()) serverClustersByID.values.toList() else serverClustersByID.values + clientClusters

    /** The scooter walked to stands on its own, outside the clusters (applyWalking). */
    private val heldScooterID: String? get() = if (parent.isWalking) appliedSelectionID else null

    /** Everything the look of the dots depends on. */
    private data class LookInputs(
        val revision: Int?,
        val origin: GeoPoint?,
        val selectedID: String?,
        /** Along the route to the selected scooter, while one is shown. */
        val walkMinutes: Int?,
        val isDark: Boolean,
        val isStreetLevel: Boolean,
        val usesServerClusters: Boolean,
        val scaleStep: Int,
        val headingStep: Int,
        val language: ScooterLanguage,
    )

    /** The scooters of a revision: a mark kept for each scooter that stays, and a new one for each that comes. */
    fun reconcile(scooters: List<Scooter>, revision: Int): List<ScooterMark> {
        if (revision == reconciledScooterRevision) return emptyList()
        reconciledScooterRevision = revision
        reconciledScooters = scooters
        val incomingIDs = scooters.mapTo(HashSet()) { it.id }
        val removed = marksByID.keys.filter { it !in incomingIDs }
        for (id in removed) marksByID.remove(id)
        val additions = mutableListOf<ScooterMark>()
        var changed = removed.isNotEmpty()
        for (scooter in scooters) {
            val mark = marksByID[scooter.id]
            if (mark != null) {
                if (mark.update(with = scooter)) changed = true
            } else {
                val added = ScooterMark(scooter)
                marksByID[scooter.id] = added
                additions += added
            }
        }
        if (changed || additions.isNotEmpty()) {
            markersVersion += 1
            pillsVersion += 1
        }
        return additions
    }

    /** The server's clusters and city totals of a revision: a mark kept for each that stays, drawn again if it changed. */
    fun reconcileClusters(clusters: List<ScooterCluster>, revision: Int) {
        if (revision == reconciledClusterRevision) return
        reconciledClusterRevision = revision
        val incomingIDs = clusters.mapTo(HashSet()) { it.id }
        var changed = serverClustersByID.keys.retainAll(incomingIDs)
        for (cluster in clusters) {
            val mark = serverClustersByID[cluster.id]
            if (mark != null) {
                if (mark.update(with = cluster, members = null)) changed = true
            } else {
                serverClustersByID[cluster.id] = ClusterMark(cluster, members = null)
                changed = true
            }
        }
        if (changed) markersVersion += 1
    }

    /**
     * The app's own clusters, while the map clusters: the web's grid at the map's whole zoom, made again when the
     * scooters, that zoom or the scooter walked to change (MAP-139). The scooter walked to is left out of them.
     */
    fun updateClusters(zoomLevel: Double) {
        val heldID = heldScooterID
        val zoom = if (clusteringEnabled == true && zoomLevel.isFinite()) floor(zoomLevel).toInt() else null
        val inputs = ClusterInputs(reconciledScooterRevision, zoom, heldID)
        if (inputs == clusterInputs) return
        clusterInputs = inputs
        if (zoom == null) {
            if (clientClusters.isEmpty()) return
            clientClusters = emptyList()
            clusteredIDs = emptySet()
            markersVersion += 1
            return
        }
        val gathered = ScooterGridClustering.cluster(reconciledScooters.filter { it.id != heldID }, zoom.toDouble())
        val previous = clientClusters.associateBy { it.id }
        clientClusters = gathered.clusters.map { cluster ->
            val members = gathered.members.getValue(cluster.id)
            previous[cluster.id]?.also { it.update(with = cluster, members = members) } ?: ClusterMark(cluster, members)
        }
        clusteredIDs = gathered.members.values.flatMapTo(HashSet()) { members -> members.map { it.id } }
        markersVersion += 1
        pillsVersion += 1
    }

    /** The bays drawn now. A bay that changes is taken off and put back, and selected again if it still is. */
    fun reconcileParking(locations: List<ScooterParking>) {
        if (locations == reconciledParking) return
        reconciledParking = locations
        val incoming = HashMap<String, ScooterParking>()
        for (location in locations) incoming[location.id] = location
        val removed = parkingByID.values.filter { incoming[it.id] != it }
        // A bay that is still selected is selected again once it is back on the map.
        if (removed.any { it.id == appliedParkingID }) appliedParkingID = null
        for (bay in removed) parkingByID.remove(bay.id)
        for (location in locations) {
            if (location.id !in parkingByID) parkingByID[location.id] = location
        }
        markersVersion += 1
    }

    /** The faded markers, one for each scooter and group, moved or drawn again in place when they change. */
    fun reconcileLastSeen(scooters: List<Scooter>, clusters: List<ScooterCluster>, revision: Int) {
        if (revision == reconciledLastSeenRevision) return
        reconciledLastSeenRevision = revision
        val incoming = HashMap<String, Pair<GeoPoint, LastSeenMark.Kind>>(scooters.size + clusters.size)
        for (scooter in scooters) incoming["v:${scooter.id}"] = scooter.coordinate to LastSeenMark.Kind.Single(scooter.providerInfo)
        for (cluster in clusters) incoming["c:${cluster.id}"] = cluster.coordinate to LastSeenMark.Kind.group(of = cluster)
        var changed = lastSeenByID.keys.retainAll(incoming.keys)
        for ((id, entry) in incoming) {
            val mark = lastSeenByID[id]
            if (mark != null) {
                if (mark.update(entry.first, entry.second)) changed = true
            } else {
                lastSeenByID[id] = LastSeenMark(id, entry.first, entry.second)
                changed = true
            }
        }
        if (changed) lastSeenVersion += 1
    }

    /** The scooter the controller has selected, which takes its ring. */
    fun applySelection(selectedID: String?, map: MarkerMap) {
        if (selectedID == appliedSelectionID) return
        appliedSelectionID = selectedID
        updateLook(map)
    }

    /** The bay the controller has selected, which takes MapKit's larger balloon. */
    fun applyParkingSelection(selectedID: String?) {
        if (selectedID == appliedParkingID) return
        appliedParkingID = selectedID
        markersVersion += 1
    }

    /**
     * Zoomed out, without the server's groups, the scooters gather into clusters; at street level each is a dot.
     * Returns whether that changed.
     */
    fun updateClusteringMode(zoomLevel: Double, map: MarkerMap): Boolean {
        val bounds = map.projection.bounds
        if (!(bounds.width > 0)) return false
        val shouldCluster = !parent.usesServerClusters && ScooterClusteringPolicy.shouldCluster(zoomLevel)
        if (shouldCluster == clusteringEnabled) return false
        clusteringEnabled = shouldCluster
        markersVersion += 1
        pillsVersion += 1
        return true
    }

    /**
     * Sizes every dot for its distance and for the scale of the map, names the nearest of each provider and
     * spreads the scooters that stand on one spot. It is called whenever something may have changed and works
     * only when something has.
     */
    fun updateLook(map: MarkerMap) {
        val metresPerPoint = metresPerPoint(map.projection) ?: return
        val heading = heading(map)
        val inputs = LookInputs(
            revision = reconciledScooterRevision,
            origin = parent.origin,
            selectedID = appliedSelectionID,
            walkMinutes = parent.walkRemainingMetres?.let { ScooterMapLook.walkingMinutes(it) },
            isDark = isDark,
            // Zoomed out, the scooters gather into clusters.
            isStreetLevel = clusteringEnabled == false,
            usesServerClusters = parent.usesServerClusters,
            scaleStep = rounded(ln(metresPerPoint) / SCALE_STEP),
            headingStep = rounded(heading / 3),
            language = parent.language,
        )
        if (inputs == appliedLook) return
        val previous = appliedLook
        appliedLook = inputs

        val marks = marksByID.values.toList()
        if (previous?.revision != inputs.revision || previous?.origin != inputs.origin) {
            for (mark in marks) {
                mark.metres = inputs.origin?.let { mark.scooter.distance(from = it) }
            }
        }
        if (previous?.isDark != inputs.isDark) {
            // The bays keep their colours; the clusters and the faded markers take the dark art.
            markersVersion += 1
            lastSeenVersion += 1
        }

        // A name needs single scooters to stand beside and an origin to be near.
        val heads = if (inputs.isStreetLevel) {
            ScooterMapLook.heads(
                among = marks.mapNotNull { mark -> mark.metres?.let { ScooterDistance(mark.scooter.id, mark.scooter.provider, it) } },
                countedInGroups = inputs.usesServerClusters,
            )
        } else {
            emptyList()
        }
        val headIDs = heads.mapTo(HashSet()) { it.id }
        val named = heads.mapTo(mutableListOf()) { it.id }
        val selectedID = inputs.selectedID
        if (inputs.isStreetLevel && selectedID != null && selectedID !in headIDs && marksByID[selectedID] != null) {
            named.add(0, selectedID)
        }
        val namedSet = named.toHashSet()

        // The plane of the screen without its tilt: the scale and the directions are right, which is all that
        // spreading needs.
        val scale = exp(inputs.scaleStep * SCALE_STEP)
        val pointsPerMapPoint = metresPerMapPoint(map.projection.centerCoordinate.latitude) / scale
        val turn = -heading * PI / 180
        val looks = HashMap<String, ScooterDotLook>(marks.size)
        val dots = ArrayList<ScooterSpreadDot>(if (inputs.isStreetLevel) marks.size else 0)
        for (mark in marks) {
            val id = mark.scooter.id
            val state = when {
                id == inputs.selectedID -> ScooterDotState.Selected
                id in headIDs -> ScooterDotState.Head
                else -> ScooterDotState.Plain
            }
            val look = ScooterMapLook.look(metres = mark.metres, state = state, metresPerPoint = scale)
            looks[id] = look
            if (!inputs.isStreetLevel) continue
            val x = mark.mapPoint.x * pointsPerMapPoint
            val y = mark.mapPoint.y * pointsPerMapPoint
            dots += ScooterSpreadDot(
                id = id,
                point = ScreenPoint(x * cos(turn) - y * sin(turn), x * sin(turn) + y * cos(turn)),
                footprint = look.footprint,
            )
        }
        val offsets = ScooterMapLook.spread(dots)

        pillNeighbours = HashMap()
        for (namedDot in dots.filter { it.id in namedSet }) {
            val offset = offsets[namedDot.id] ?: ScreenPoint.zero
            val centreX = namedDot.point.x + offset.x
            val centreY = namedDot.point.y + offset.y
            pillNeighbours[namedDot.id] = dots.mapNotNull { dot ->
                if (dot.id in namedSet) return@mapNotNull null
                val dotOffset = offsets[dot.id] ?: ScreenPoint.zero
                val x = dot.point.x + dotOffset.x - centreX
                val y = dot.point.y + dotOffset.y - centreY
                if (!(abs(x) < 160 && abs(y) < 60)) return@mapNotNull null
                ScreenRect(x, y, 0.0, 0.0).insetBy(-dot.footprint / 2, -dot.footprint / 2)
            }
        }

        val changed = mutableListOf<ScooterMark>()
        // A scooter drawn for the first time has no earlier look to ease from.
        val fresh = HashSet<String>()
        for (mark in marks) {
            val id = mark.scooter.id
            val look = looks[id]?.copy(offset = offsets[id] ?: ScreenPoint.zero) ?: continue
            if (!mark.isStyled) {
                mark.isStyled = true
                fresh += id
            }
            // The scooter walked to says the time along its route.
            val minutes = (if (id == inputs.selectedID) inputs.walkMinutes else null)
                ?: mark.metres?.let { ScooterMapLook.walkingMinutes(it) }
            val pill = if (id in namedSet) {
                val provider = mark.scooter.providerInfo
                ScooterMarkerArt.PillContent(
                    provider = provider,
                    name = provider?.briefName ?: capitalized(mark.scooter.provider),
                    time = minutes?.let { stringFormat(localized("%lld min"), it.toLong()) },
                    isFilled = id == inputs.selectedID,
                    isDark = inputs.isDark,
                )
            } else {
                null
            }
            if (mark.look == look && mark.usesDarkArt == inputs.isDark && mark.pill == pill) continue
            mark.look = look
            mark.usesDarkArt = inputs.isDark
            mark.pill = pill
            changed += mark
        }
        namedIDs = named
        pillSides.keys.retainAll(namedSet)
        if (changed.isNotEmpty()) markersVersion += 1
        changed += placePills(map)

        // A change of scale is drawn at once; anything else eases in.
        val animated = previous != null && previous.scaleStep == inputs.scaleStep &&
            previous.headingStep == inputs.headingStep && map.isShown && animates()
        for (mark in changed.distinct()) refreshLook(mark, animated && mark.scooter.id !in fresh)
    }

    /**
     * What the iPhone's marker view does when its look is drawn again: a name that comes eases in. The dot's
     * picture, its strength and its place change at once (MAP-097, MAP-098).
     */
    private fun refreshLook(mark: ScooterMark, animated: Boolean) {
        pillsVersion += 1
        val shown = mark.shownPill != null
        if (!shown) {
            mark.pillFade = null
            mark.wasPillShown = false
            return
        }
        if (!mark.wasPillShown && animated) {
            mark.pillFade = MarkerFade(now(), PILL_FADE, MarkerFade.Curve.EaseInEaseOut)
        }
        mark.wasPillShown = true
    }

    /**
     * The names travel with their dots; what changes while the map moves is the side a name is on, when its own
     * gets covered or leaves the screen.
     */
    fun movePills(map: MarkerMap) {
        val animated = animates()
        for (mark in placePills(map)) refreshLook(mark, animated)
    }

    /** Chooses a side for each name. Returns the scooters whose name moved. */
    private fun placePills(map: MarkerMap): List<ScooterMark> {
        if (namedIDs.isEmpty()) return emptyList()
        val projection = map.projection
        val bounds = projection.bounds
        // A panel covers only as far down as it reaches: below it the names show as anywhere else.
        val chrome = (parent.bottomChromeFrames + listOfNotNull(parent.panelFrame)).filter { !it.isEmpty }
        // Beside the locate button the map is free down to the dock.
        var visible = visibleRect(map)
        if (chrome.isNotEmpty()) visible = ScreenRect(visible.x, visible.y, visible.width, bounds.maxY - visible.minY)

        val requests = mutableListOf<ScooterPillRequest>()
        val neighbours = mutableListOf<ScreenRect>()
        // A name without its dot says nothing: off the screen or under the dock it waits.
        val covered = HashSet<String>()
        for (id in namedIDs) {
            val mark = marksByID[id] ?: continue
            val pill = mark.pill ?: continue
            val point = projection.point(mark.scooter.coordinate)
            val anchor = ScreenPoint(point.x + mark.look.offset.x, point.y + mark.look.offset.y)
            if (!visible.contains(anchor) || chrome.any { it.contains(anchor) }) {
                covered += id
                continue
            }
            requests += ScooterPillRequest(
                id = id,
                anchor = anchor,
                reach = mark.look.footprint / 2,
                width = art.pillWidth(pill),
                preferred = pillSides[id],
            )
            neighbours += pillNeighbours[id].orEmpty().map { it.offsetBy(anchor.x, anchor.y) }
        }

        val obstacles = chrome.toMutableList()
        parent.userLocation?.let { rider ->
            val point = projection.point(rider)
            obstacles += ScreenRect(point.x - 15, point.y - 15, 30.0, 30.0)
        }
        // The pin stands on its place.
        destinationFrame(projection)?.let { obstacles += it }

        val moved = LinkedHashSet<ScooterMark>()
        val placements = ScooterMapLook.placePills(requests, avoiding = obstacles, sparing = neighbours, inside = visible)
        val frames = mutableListOf<Pair<String, ScreenRect>>()
        for ((request, placement) in requests.zip(placements)) {
            pillSides[placement.id] = placement.side
            frames += placement.id to ScreenRect(
                request.anchor.x + placement.origin.x,
                request.anchor.y + placement.origin.y,
                request.width,
                ScooterMapLook.pillHeight,
            )
            val mark = marksByID[placement.id] ?: continue
            if (mark.pillOrigin == placement.origin) continue
            mark.pillOrigin = placement.origin
            moved += mark
        }
        // Nor does a name that would be cut by the edge of the map or by the dock, or that found no place but on
        // another name.
        covered += ScooterMapLook.unreadablePills(frames, inside = visible, under = chrome)
        for (id in namedIDs) {
            val mark = marksByID[id] ?: continue
            if (mark.pillIsCovered == (id in covered)) continue
            mark.pillIsCovered = !mark.pillIsCovered
            moved += mark
        }
        return moved.toList()
    }

    /**
     * The one moment of motion: the first time scooters appear, they light up from the rider outwards, 1.5 ms a
     * metre, and the names follow once the dots are there. Never again, and not with Remove animations.
     */
    fun lightUp(added: List<ScooterMark>, map: MarkerMap) {
        val time = now()
        // The first scooters may come in more than one go.
        lightUpEnds?.let { if (time > it) return }
        if (added.isEmpty()) return
        if (lightUpEnds == null) lightUpEnds = time + 0.3
        if (parent.origin == null || !animates()) return
        // The distances the delays are counted from.
        updateLook(map)
        for (mark in added) {
            val delay = min(1.2, max(0.0, mark.metres ?: 0.0) * 0.0015)
            mark.dotFade = MarkerFade(time + delay, LIGHT_UP, MarkerFade.Curve.LightUp)
            if (mark.shownPill != null) mark.pillFade = MarkerFade(time + 0.9, NAME_IN, MarkerFade.Curve.Linear)
        }
        markersVersion += 1
        pillsVersion += 1
    }

    // Taps

    /**
     * A tap on the map, at a point of it: the name or the dot nearest the finger, else the bay under it, else
     * nothing, which closes the card unless a walk is under way.
     */
    fun tap(point: ScreenPoint, map: MarkerMap) {
        if (isExcludedFromMapInteraction(point)) return
        // MapKit selects the topmost marker under the finger as well: a cluster there opens, whatever the app's own
        // tap does, so a tap on a cluster with a dot in reach selects the dot and zooms in (MAP-209).
        val cluster = topCluster(at = point, map = map)
        val scooter = scooterMark(at = point, map = map)
        val bay = bay(at = point, beside = scooter, map = map)
        val mark = scooter?.first
        when {
            bay != null -> select(bay)
            mark != null -> select(mark, map)
            // During a walk the card stays open: the map is for looking around.
            !parent.isWalking -> clearSelection(map)
        }
        cluster?.let { open(it, map) }
    }

    /** A bay under the touch is meant, unless the touch is on the dot of the scooter it means. */
    fun bay(at: ScreenPoint, beside: Pair<ScooterMark, Double>?, map: MarkerMap): ScooterParking? {
        val isOnDot = beside?.let { it.second <= it.first.look.footprint / 2 + 4 } ?: false
        return if (isOnDot) null else parking(at = at, map = map)
    }

    /** A scooter chosen, by a tap or by TalkBack: its card opens and its dot takes the ring. */
    fun select(mark: ScooterMark, map: MarkerMap) {
        publishSelection(mark)
        updateLook(map)
    }

    /** A bay chosen: it opens in the dock. */
    fun select(bay: ScooterParking) = publishParkingSelection(bay)

    /**
     * The cluster MapKit would select under a point: the one whose 48 pt frame holds it, if no dot's 44 pt square
     * or bay's balloon there is drawn above it. The selected dot and bay are above everything.
     */
    fun topCluster(at: ScreenPoint, map: MarkerMap): ClusterMark? {
        val projection = map.projection
        var top: ClusterMark? = null
        var topRank = Float.NEGATIVE_INFINITY
        fun consider(frame: ScreenRect, rank: Float, cluster: ClusterMark?) {
            if (!frame.contains(at) || rank < topRank) return
            topRank = rank
            top = cluster
        }
        for (mark in drawnMarks()) {
            val centre = dotCentre(mark, projection)
            val half = MARKER_SIZE / 2
            val rank = mark.look.zPriority + if (mark.look.state == ScooterDotState.Selected) RAISED else 0f
            consider(ScreenRect(centre.x - half, centre.y - half, MARKER_SIZE, MARKER_SIZE), rank, null)
        }
        for (bay in parkingByID.values) {
            val isSelected = bay.id == appliedParkingID
            consider(bayFrame(bay, projection), if (isSelected) 1000f + RAISED else 500f, null)
        }
        // Drawn after the dots and the bays, a cluster is above those of the same rank.
        for (cluster in clusters()) {
            val point = projection.point(cluster.cluster.coordinate)
            val half = CLUSTER_SIZE / 2
            consider(ScreenRect(point.x - half, point.y - half, CLUSTER_SIZE, CLUSTER_SIZE), cluster.sortKey, cluster)
        }
        return top
    }

    /**
     * A cluster opens onto what it holds. A group of the server's opens onto its cities, each a total of its own
     * again; a city total or a cluster of the server's two zoom levels closer, or to a city's span; the app's own
     * onto its scooters (MAP-050–052).
     */
    fun open(cluster: ClusterMark, map: MarkerMap) {
        track("cluster_select", null)
        val members = cluster.members
        if (members != null) {
            move(CameraMove.Fit(members.map { it.coordinate }))
            return
        }
        val projection = map.projection
        val bounds = projection.bounds
        if (!(bounds.width > 0 && bounds.height > 0)) return
        // A city's span is a phone's, as when a city is chosen.
        val city = ScooterMapCameraPolicy.spanScale(across = min(bounds.width, bounds.height))
        val group = cluster.cluster.bounds
        val region = if (group != null) {
            MapRegion(
                center = group.center,
                latitudeDelta = max((group.north - group.south) * 1.6, 0.08 * city),
                longitudeDelta = max(group.longitudeSpan * 1.6, 0.12 * city),
            )
        } else {
            val span = MapZoom.region(of = projection.visibleMapRect)
            val isCity = cluster.cluster.city != null
            MapRegion(
                center = cluster.cluster.coordinate,
                latitudeDelta = if (isCity) 0.08 * city else span.latitudeDelta / 4,
                longitudeDelta = if (isCity) 0.12 * city else span.longitudeDelta / 4,
            )
        }
        move(CameraMove.Region(region))
    }

    private fun isExcludedFromMapInteraction(point: ScreenPoint): Boolean =
        isInside(point, parent.interactionExclusionFrame) || isInside(point, parent.panelFrame)

    private fun isInside(point: ScreenPoint, frame: ScreenRect?): Boolean =
        frame != null && frame.width > 0 && frame.height > 0 && frame.contains(point)

    /**
     * The scooter a touch means, and how far from the centre of its dot the touch is. Dots are small and stand
     * close together, so the first marker under the finger is often the wrong one: the nearest centre wins. A
     * name stands for its dot.
     */
    fun scooterMark(at: ScreenPoint, map: MarkerMap): Pair<ScooterMark, Double>? {
        val projection = map.projection
        val pills = shownPillFrames(projection)
        pills.firstOrNull { it.second.contains(at) }?.let { return it.first to 0.0 }

        val dots = mutableListOf<ScooterMapLook.TouchableDot>()
        val bounds = projection.bounds
        for (mark in drawnMarks()) {
            val centre = dotCentre(mark, projection)
            // MapKit keeps views only for the scooters on the map.
            if (!isNear(centre, bounds)) continue
            dots += ScooterMapLook.TouchableDot(mark.scooter.id, centre, max(TAP_REACH, mark.look.footprint / 2 + 6))
        }
        ScooterMapLook.nearestDot(to = at, among = dots)?.let { nearest ->
            marksByID[nearest.id]?.let { return it to nearest.distance }
        }

        // A name is 26 pt high; its target is 44.
        pills.firstOrNull { it.second.insetBy(-4.0, -9.0)?.contains(at) == true }?.let { return it.first to 0.0 }
        return null
    }

    /** The scooters drawn as dots of their own: all but those in the app's own clusters. */
    fun drawnMarks(): Collection<ScooterMark> =
        if (clusteredIDs.isEmpty()) marksByID.values else marksByID.values.filter { it.scooter.id !in clusteredIDs }

    /** Where a dot is drawn on the map: at its scooter, moved by its spread. */
    fun dotCentre(mark: ScooterMark, projection: ScooterMapProjection): ScreenPoint {
        val point = projection.point(mark.scooter.coordinate)
        return ScreenPoint(point.x + mark.look.offset.x, point.y + mark.look.offset.y)
    }

    /** The names shown now, in the order they are placed, with their frames on the map. */
    fun shownPillFrames(projection: ScooterMapProjection): List<Pair<ScooterMark, ScreenRect>> = namedIDs.mapNotNull { id ->
        val mark = marksByID[id] ?: return@mapNotNull null
        val pill = mark.shownPill ?: return@mapNotNull null
        val centre = dotCentre(mark, projection)
        mark to ScreenRect(centre.x + mark.pillOrigin.x, centre.y + mark.pillOrigin.y, art.pillWidth(pill), ScooterMapLook.pillHeight)
    }

    /** The bay under a point: its balloon, the selected one first, as it is drawn above the others. */
    fun parking(at: ScreenPoint, map: MarkerMap): ScooterParking? {
        val projection = map.projection
        return parkingByID.values
            .filter { bayFrame(it, projection).contains(at) }
            .maxByOrNull { if (it.id == appliedParkingID) 1 else 0 }
    }

    /** Where a bay's balloon is on the map. */
    fun bayFrame(bay: ScooterParking, projection: ScooterMapProjection): ScreenRect {
        val point = projection.point(bay.coordinate)
        return ScooterMarkerArt.BayShape.of(bay.id == appliedParkingID).frame.offsetBy(point.x, point.y)
    }

    private fun publishSelection(mark: ScooterMark) {
        val id = mark.scooter.id
        if (appliedSelectionID == id) return
        appliedSelectionID = id
        onSelectionChange(id)
    }

    private fun publishParkingSelection(bay: ScooterParking) {
        if (appliedParkingID == bay.id) return
        appliedParkingID = bay.id
        markersVersion += 1
        track("parking_select", bay.provider)
        onParkingSelectionChange(bay.id)
    }

    /** Closes what is selected, the bay and the scooter, each told once. */
    fun clearSelection(map: MarkerMap) {
        if (appliedParkingID != null) {
            appliedParkingID = null
            markersVersion += 1
            onParkingSelectionChange(null)
        }
        if (appliedSelectionID == null) return
        appliedSelectionID = null
        onSelectionChange(null)
        updateLook(map)
    }

    /**
     * The part of the map between the search bar and the dock; until the chrome is there, between the status bar
     * and the map's bottom edge. Beside a panel it is the whole height: names show below the panel.
     */
    private fun visibleRect(map: MarkerMap): ScreenRect {
        val bounds = map.projection.bounds
        val top = parent.interactionExclusionFrame?.takeIf { !it.isEmpty }?.maxY ?: map.safeTop
        val bottom = parent.bottomChromeTop ?: bounds.maxY
        return ScooterMapCameraPolicy.visibleRectIn(bounds, top = top, bottom = bottom, beside = null)
    }

    companion object {
        /** The dots are sized again when the scale of the map has changed by this much. */
        const val SCALE_STEP = 0.04

        /** Half of the 44 pt a target needs. */
        const val TAP_REACH = 22.0

        /** The dots' light-up, the names' fade after it, and a name's fade as it comes. */
        const val LIGHT_UP = 0.62
        const val NAME_IN = 0.52
        const val PILL_FADE = 0.2

        /** The side of the marker of a scooter, MapKit's annotation view: far larger than its dot. */
        const val MARKER_SIZE = 44.0

        /** The side of a cluster's view, larger than its disc. */
        const val CLUSTER_SIZE = 48.0

        /** What lifts the selected dot or bay above every other marker. */
        private const val RAISED = 10_000f

        /** A cluster's disc grows with the digits of its number. */
        fun clusterDiameter(count: Int): Double = if (count < 100) 36.0 else if (count < 1_000) 40.0 else 44.0

        /** Metres across one point in the middle of the map, whatever its tilt. */
        fun metresPerPoint(projection: ScooterMapProjection): Double? {
            val bounds = projection.bounds
            if (!(bounds.width > 0 && bounds.height > 0)) return null
            val left = projection.coordinate(ScreenPoint(bounds.midX - 50, bounds.midY))
            val right = projection.coordinate(ScreenPoint(bounds.midX + 50, bounds.midY))
            val metres = left.distance(to = right)
            if (!(metres.isFinite() && metres > 0)) return null
            return metres / 100
        }

        /** MKMetersPerMapPointAtLatitude. */
        fun metresPerMapPoint(latitude: Double): Double =
            2 * PI * EARTH_RADIUS * cos(latitude * PI / 180) / MapPoint.worldSize

        private const val EARTH_RADIUS = 6_378_137.0

        /** The way the camera faces, or north while there is no number for it. */
        private fun heading(map: MarkerMap): Double = map.heading.takeIf { it.isFinite() } ?: 0.0

        /** Double.rounded(): halves away from zero. */
        private fun rounded(value: Double): Int =
            (if (value >= 0) floor(value + 0.5) else ceil(value - 0.5)).toInt()

        private fun isNear(point: ScreenPoint, bounds: ScreenRect): Boolean =
            point.x >= bounds.minX - MARKER_SIZE && point.x <= bounds.maxX + MARKER_SIZE &&
                point.y >= bounds.minY - MARKER_SIZE && point.y <= bounds.maxY + MARKER_SIZE

        /**
         * The provider with the most scooters, the first of the catalog's order among equals; none when it has
         * none of them.
         */
        fun leadingProvider(counts: Map<String, Int>): ScooterProvider? {
            val leading = ScooterProvider.entries.maxByOrNull { counts[it.rawValue] ?: 0 } ?: return null
            return leading.takeIf { counts[it.rawValue] != null }
        }

        /**
         * String.capitalized: each word with its first letter in upper case and the rest in lower case, a word
         * starting after anything but a letter or an apostrophe. :core keeps its own to itself.
         */
        fun capitalized(text: String): String = buildString {
            var startsWord = true
            var index = 0
            while (index < text.length) {
                val codePoint = text.codePointAt(index)
                val character = String(Character.toChars(codePoint))
                if (Character.isLetter(codePoint)) {
                    append(if (startsWord) character.uppercase() else character.lowercase())
                    startsWord = false
                } else {
                    append(character)
                    startsWord = character != "'" && character != "’"
                }
                index += Character.charCount(codePoint)
            }
        }
    }
}
