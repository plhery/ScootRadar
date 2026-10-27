package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.api.ScooterLoadFailure
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.RentalCurfew
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterCardContent
import com.plhery.scootradar.core.model.ScooterCityCatalog
import com.plhery.scootradar.core.model.ScooterCityDistance
import com.plhery.scootradar.core.model.ScooterClusteringPolicy
import com.plhery.scootradar.core.model.ScooterCountContext
import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterDockHint
import com.plhery.scootradar.core.model.ScooterDockLead
import com.plhery.scootradar.core.model.ScooterDockLine
import com.plhery.scootradar.core.model.ScooterDockNotice
import com.plhery.scootradar.core.model.ScooterDockStatus
import com.plhery.scootradar.core.model.ScooterDockSummary
import com.plhery.scootradar.core.model.ScooterFilterSummary
import com.plhery.scootradar.core.model.ScooterFiltering
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLoadIssue
import com.plhery.scootradar.core.model.ScooterMapLook
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.ScooterPlural
import com.plhery.scootradar.core.model.ScooterProviderCoverage
import com.plhery.scootradar.core.model.ScooterProviderEntry
import com.plhery.scootradar.core.model.ScooterProviderHealth
import com.plhery.scootradar.core.model.ScooterSearchBarState
import com.plhery.scootradar.core.model.ScooterSeasonalPause
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.core.model.briefName
import com.plhery.scootradar.core.model.capitalized
import com.plhery.scootradar.core.model.formatted
import com.plhery.scootradar.core.model.isolated
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.roundedAwayFromZero
import com.plhery.scootradar.core.model.stringFormat
import java.time.Instant

// What the screen reads of ios/ScootRadar/ViewModels/ScooterMapModel.swift: the selection, the dock and its cards, and the walk to each.

/**
 * The selected scooter. A walk keeps it on the card when the data no longer lists it: zoomed out, where
 * the data counts scooters in clusters, or gone, when someone may have taken it.
 */
val ScooterMapController.selectedScooter: Scooter?
    get() {
        val id = selectedScooterID.value ?: return null
        vehiclesByID[id]?.let { return it }
        val walk = walk.value ?: return null
        if (!walk.holdsCard) return null
        val target = walk.target as? ScooterWalkTarget.Scooter ?: return null
        return target.scooter.takeIf { it.id == id }
    }

/** The selected bay, while it is still drawn on the map. */
val ScooterMapController.selectedParking: ScooterParking?
    get() {
        val id = selectedParkingID.value ?: return null
        return mapParking.firstOrNull { it.id == id }
    }

val ScooterMapController.searchBarState: ScooterSearchBarState
    get() {
        searchedDestination.value?.let { return ScooterSearchBarState.Place(it) }
        if (isLocating.value) return ScooterSearchBarState.Locating
        // Once located the bar stays a search field: the dot on the map says where you are.
        return ScooterSearchBarState.Empty
    }

/** The six covered cities nearest to the map centre, for "Cities with scooters". */
val ScooterMapController.nearbyCities: List<ScooterCityDistance> get() = ScooterCityCatalog.nearest(to = viewport.value.center, count = 6)

/**
 * The map centre for the address search, which finds places near it first: only when the map shows a
 * city or less, and rounded to about a kilometre, as on the web.
 */
val ScooterMapController.searchNear: GeoPoint?
    get() {
        if (viewportZoomLevel.value < ScooterMapController.searchNearMinimumZoom) return null
        val centre = viewport.value.center
        return GeoPoint(
            latitude = (centre.latitude * 100).roundedAwayFromZero() / 100,
            longitude = (centre.longitude * 100).roundedAwayFromZero() / 100,
        )
    }

/** The three covered cities nearest to the map centre, for the outside-coverage card. */
val ScooterMapController.closestCities: List<ScooterCityDistance> get() = ScooterCityCatalog.nearest(to = viewport.value.center, count = 3)

val ScooterMapController.activeOrigin: NearbyOrigin?
    get() {
        searchedDestination.value?.let { return NearbyOrigin.SearchedDestination(it) }
        userLocation.value?.let { return NearbyOrigin.UserLocation(it) }
        return null
    }

/**
 * The origin while it is on the map or within half a map of it. Distances from an origin far out of sight
 * say nothing about the scooters shown: the dots then keep one size and none is named.
 */
val ScooterMapController.mapOrigin: GeoPoint?
    get() {
        val point = activeOrigin?.point ?: return null
        return point.takeIf { viewport.value.expanded(by = 0.5).contains(it) }
    }

/**
 * The nearest of the scooters in view, filters applied: the ones the count and the chips are of. Only
 * while the place walked from is on the map and every scooter has its own dot, as on the web.
 */
val ScooterMapController.dockLead: ScooterDockLead?
    get() = ScooterDockLead.nearest(
        of = mapScooters.value,
        from = activeOrigin?.point,
        viewport = viewport.value,
        grouped = responseMetadata.value?.mode == "clusters" || ScooterClusteringPolicy.shouldCluster(viewportZoom.value),
    )

/** What the card of a scooter says under its name. */
fun ScooterMapController.cardContent(scooter: Scooter): ScooterCardContent = ScooterCardContent(
    scooter = scooter,
    metres = walkingDistance(scooter),
    placeTitle = searchedDestination.value?.title,
    quote = ridePriceQuote(scooter),
    curfew = RentalCurfew.active(at = GeoPoint(latitude = scooter.latitude, longitude = scooter.longitude), on = clock()),
)

val ScooterMapController.visibleCount: Int get() = visibleScooterCount.value

val ScooterMapController.allProvidersSelected: Boolean get() = enabledProviders.value.containsAll(availableProviders)

val ScooterMapController.availableProviders: List<ScooterProvider>
    get() {
        val providers = ScooterProviderCoverage.providers(viewport.value).toSet() + visibleProviderCounts.value.keys
        return ScooterProvider.entries.filter { it in providers }
    }

val ScooterMapController.hasActiveFilters: Boolean get() = minimumBattery.value > 0 || !allProvidersSelected

/**
 * The providers that are not sharing data here: a feed of theirs failed, they operate in the viewport and
 * the map holds none of their scooters in view, whatever the rider's filters hide. City totals name no
 * one, and neither does data that cannot tell who has scooters here: loaded for another area, or already
 * without the scooters under the battery minimum, which the server leaves out of clusters.
 */
val ScooterMapController.providerHealth: ScooterProviderHealth
    get() {
        val responseMetadata = responseMetadata.value
        if (responseMetadata == null || responseMetadata.overview || !viewportIsLoaded || (queryMinimumBattery ?: 0) != 0) {
            return ScooterProviderHealth.healthy
        }
        return ScooterProviderHealth(
            failedSources = responseMetadata.failedSources,
            operating = ScooterProviderCoverage.providers(viewport.value),
            inView = unfilteredVisibleProviders,
        )
    }

/** The calm lines under the dock status: a night ban, the season, providers down, truncation, parking. */
val ScooterMapController.dockNotices: List<ScooterDockNotice>
    get() {
        val responseMetadata = responseMetadata.value ?: return emptyList()
        return ScooterDockNotice.notices(
            curfew = RentalCurfew.active(at = viewport.value.center, on = clock()),
            season = ScooterSeasonalPause.active(at = viewport.value.center, on = clock(), seasonOver = responseMetadata.seasonOver),
            scootersInView = unfilteredVisibleCount > 0,
            health = providerHealth,
            metadata = responseMetadata,
            shownCount = representedVehicleCount,
        )
    }

fun ScooterMapController.count(provider: ScooterProvider): Int = visibleProviderCounts.value[provider] ?: 0

val ScooterMapController.allProviderCount: Int get() = visibleProviderCounts.value.values.sum()

/** The providers in the filter sheet, in catalogue order. */
val ScooterMapController.filterProviders: List<ScooterProviderEntry>
    get() {
        val down = providerHealth.downProviders.toSet()
        val isFilteringProviders = !allProvidersSelected
        return availableProviders.map { provider ->
            val count = count(provider)
            val isDown = provider in down
            val isEnabled = provider in enabledProviders.value
            ScooterProviderEntry(
                provider = provider,
                count = count,
                isEnabled = isEnabled,
                isSelected = isFilteringProviders && isEnabled && !isDown,
                isDown = isDown,
            )
        }
    }

/** The chips after "All": providers that are down first, then by count, largest first. Ties keep the catalogue order. */
val ScooterMapController.dockChips: List<ScooterProviderEntry>
    get() {
        val entries = filterProviders
        // sortedByDescending is stable: ties keep the catalogue order.
        val sharing = entries.filter { !it.isDown }.sortedByDescending { it.count }
        return entries.filter { it.isDown } + sharing
    }

/** What the filter sheet's "Show n scooters" button promises: filters apply as they are chosen, so this is the count on the map. */
val ScooterMapController.showResultsTitle: String get() = ScooterFiltering.showResultsTitle(count = visibleCount)

/** The providers listed under Passes: those operating in the viewport or with a pass, and every provider when that leaves none. */
val ScooterMapController.passProviders: List<ScooterProvider>
    get() {
        val operating = availableProviders.toSet()
        val listed = ScooterProvider.entries.filter { it in operating || ridePass(it).enabled }
        return listed.ifEmpty { ScooterProvider.entries }
    }

/** What the dock shows. */
val ScooterMapController.dock: ScooterDockContent
    get() {
        selectedScooter?.let { return ScooterDockContent.Scooter(it) }
        selectedParking?.let { return ScooterDockContent.Parking(it) }
        val loadIssue = loadIssue.value
        if (loadIssue is ScooterLoadIssue.OutOfDate) {
            return ScooterDockContent.OutOfDate(loadIssue.failure, lastUpdate = loadIssue.lastUpdate)
        }
        val lastUpdated = lastUpdated.value
            ?: return if (loadIssue == null) ScooterDockContent.Finding(chips = emptyList()) else ScooterDockContent.Waiting

        // A failure already explains an empty map.
        val isEmpty = visibleCount == 0 && loadIssue == null
        if (isEmpty) {
            // No provider operates here, whatever the pending request answers.
            if (availableProviders.isEmpty()) return ScooterDockContent.OutsideCoverage(closestCities)
            // The data on the map is for another area: no count to show yet.
            if (!viewportIsLoaded) return ScooterDockContent.Finding(chips = dockChips)
            hiddenByFilters?.let { return ScooterDockContent.FiltersHideEverything(it) }
            // None counted yet, only faded ones: the server's sweep is finding them, which may take a minute or two.
            if (isFilling) return ScooterDockContent.Finding(chips = dockChips, notices = dockNotices)
        }

        val isOverview = responseMetadata.value?.overview == true
        val down = providerHealth.downProviders
        val everyProviderDown = down.isNotEmpty() && down.toSet().containsAll(availableProviders)
        val hint = if (isEmpty) {
            if (everyProviderDown) null else ScooterDockHint.EmptyArea
        } else {
            if (isOverview && visibleCount > 0) ScooterDockHint.TapCity else null
        }
        return ScooterDockContent.Summary(
            ScooterDockSummary(
                count = visibleCount,
                countContext = if (activeOrigin?.let { viewport.value.contains(it.point) } == true) {
                    ScooterCountContext.Nearby
                } else {
                    ScooterCountContext.OnThisMap
                },
                lastUpdated = lastUpdated,
                refreshFailure = refreshFailure,
                isOverview = isOverview,
                isDelayed = responseMetadata.value?.stale == true,
                notices = dockNotices,
                hint = hint,
                chips = dockChips,
                lead = if (isOverview) null else dockLead,
                everyProviderDown = everyProviderDown,
                lastSeenAt = if (isFilling) lastSeenAt.value else null,
            ),
        )
    }

/** Scooters stand faded where they were last seen while the server collects them again. */
internal val ScooterMapController.isFilling: Boolean
    get() = responseMetadata.value?.refreshing == true && visibleLastSeenCount.value > 0 && loadIssue.value == null

private val ScooterMapController.refreshFailure: ScooterLoadFailure?
    get() = (loadIssue.value as? ScooterLoadIssue.RefreshFailed)?.failure

/**
 * The failed refresh or the delay to report at the top of a scooter or bay card, which hides the dock's
 * own status line. Null while the data is healthy, and while faded scooters stand where they were last
 * seen, which the dock reports as an update rather than a delay.
 */
val ScooterMapController.cardStatus: ScooterDockStatus?
    get() {
        val loadIssue = loadIssue.value
        if (loadIssue is ScooterLoadIssue.RefreshFailed) {
            return if (loadIssue.failure == ScooterLoadFailure.Offline) {
                ScooterDockStatus.Offline(showing = loadIssue.showing)
            } else {
                ScooterDockStatus.RefreshFailed(showing = loadIssue.showing)
            }
        }
        val lastUpdated = lastUpdated.value
        if (responseMetadata.value?.stale != true || lastUpdated == null || (isFilling && lastSeenAt.value != null)) return null
        return ScooterDockStatus.Delayed(showing = lastUpdated)
    }

/**
 * What TalkBack is told when the dock turns into a card, which happens far from the marker that was
 * activated: the card's own first lines. Null for the count and its chips.
 */
val ScooterMapController.dockAnnouncement: String?
    get() = when (val dock = dock) {
        is ScooterDockContent.Scooter -> {
            val scooter = dock.scooter
            val name = stringFormat(localized("%@ scooter"), scooter.providerInfo?.displayName ?: scooter.provider.capitalized)
            listOfNotNull(name, walkingSummary(scooter)).joinToString(", ")
        }
        is ScooterDockContent.Parking -> {
            val parking = dock.parking
            val heading = listOf(parking.bayTitle, parkingSubtitle(parking))
                .filter { it.isNotEmpty() }
                .joinToString(", ")
            "$heading. ${parking.notice}"
        }
        is ScooterDockContent.OutOfDate -> {
            val title = localized("These positions are out of date")
            "$title. ${ScooterDockStatus.outOfDateBody(dock.failure, lastUpdate = dock.lastUpdate)}"
        }
        is ScooterDockContent.Finding, ScooterDockContent.Waiting, is ScooterDockContent.OutsideCoverage,
        is ScooterDockContent.FiltersHideEverything, is ScooterDockContent.Summary,
        -> null
    }

/**
 * What the dock shows, in the one line a folded panel has under its search bar: the nearest scooter as
 * "23 m · Bird · 1 min · Live", the count with the status where there is none, and the title of any other
 * card. The map is beside it, so it says no more than a glance needs and fits the panel's width at the
 * standard text size: "3'784 scooters", not "on this map". The status changes as the data ages, so ask
 * again over time.
 */
fun ScooterMapController.dockLine(at: Instant): ScooterDockLine = when (val dock = dock) {
    is ScooterDockContent.Scooter -> {
        val scooter = dock.scooter
        // The provider's name with its colour beside it says which card it is.
        val walk = approximateWalkingMinutes(scooter)?.let { walkPart(minutes = it) }
        ScooterDockLine(
            mark = ScooterDockLine.Mark.Provider(scooter.providerInfo),
            title = scooter.providerInfo?.briefName ?: scooter.provider.capitalized,
            details = listOfNotNull(walk, formattedDistance(scooter)),
        )
    }
    is ScooterDockContent.Parking -> {
        val parking = dock.parking
        val walk = approximateWalkingMinutes(parking)?.let { walkPart(minutes = it) }
        ScooterDockLine(
            mark = ScooterDockLine.Mark.Provider(parking.providerInfo),
            title = parking.bayTitle,
            details = listOfNotNull(parking.name.ifEmpty { null }, walk),
        )
    }
    is ScooterDockContent.OutOfDate -> ScooterDockLine(
        mark = ScooterDockLine.Mark.Symbol("clock"),
        title = localized("These positions are out of date"),
        isWarning = true,
    )
    is ScooterDockContent.Finding -> ScooterDockLine(mark = ScooterDockLine.Mark.Progress, title = localized("Finding scooters…"))
    ScooterDockContent.Waiting -> ScooterDockLine(
        mark = ScooterDockLine.Mark.Symbol("hourglass"),
        title = localized("Waiting for scooter data"),
    )
    is ScooterDockContent.OutsideCoverage -> ScooterDockLine(
        mark = ScooterDockLine.Mark.Symbol("map"),
        title = localized("No scooter data here yet"),
    )
    is ScooterDockContent.FiltersHideEverything -> ScooterDockLine(
        mark = ScooterDockLine.Mark.Symbol("line.3.horizontal.decrease"),
        title = dock.summary.title,
        details = if (dock.summary.body.isEmpty()) emptyList() else listOf(dock.summary.body),
    )
    is ScooterDockContent.Summary -> {
        val summary = dock.summary
        // Beside the nearest scooter the dock leaves "Live" out; alone on its line the status is the only
        // one in view, so it is always said.
        val status = summary.status(at = at)
        val lead = summary.lead
        if (lead != null) {
            ScooterDockLine(
                mark = ScooterDockLine.Mark.Provider(lead.scooter.providerInfo),
                title = lead.distance,
                details = listOf(lead.briefProviderName, stringFormat(localized("%lld min"), lead.minutes.toLong())),
                status = status,
            )
        } else {
            val count = summary.count.formatted(ScooterLanguage.current.locale)
            val noun = if (ScooterPlural.isSingular(summary.count)) localized("scooter") else localized("scooters")
            ScooterDockLine(mark = ScooterDockLine.Mark.Symbol("scooter"), title = "$count $noun", status = status)
        }
    }
}

/**
 * Whether the data on the map was loaded for the area on screen. Only then is an empty map a fact about
 * the area rather than a load in progress.
 */
private val ScooterMapController.viewportIsLoaded: Boolean
    get() = queryCovers(viewport.value, zoom = viewportZoom.value, pending = false)

/** The filters and what they hide, when they are the reason the loaded area is empty. */
private val ScooterMapController.hiddenByFilters: ScooterFilterSummary?
    get() {
        if (!hasActiveFilters) return null
        // The response cannot tell how many scooters there are once the server filtered clustered data by
        // battery or cut the list short.
        val isCountKnown = (queryMinimumBattery ?: 0) == 0 && responseMetadata.value?.truncated != true
        val hiddenCount: Int? = if (isCountKnown) unfilteredVisibleCount else null
        // Filters that hide nothing are not the reason the map is empty.
        if (hiddenCount == 0) return null

        var providers: List<ScooterProvider> = emptyList()
        if (!allProvidersSelected) {
            providers = availableProviders.filter { it in enabledProviders.value }
            if (providers.isEmpty()) {
                providers = ScooterProvider.entries.filter { it in enabledProviders.value }
            }
        }
        return ScooterFilterSummary(
            hiddenCount = hiddenCount,
            providers = providers,
            minimumBattery = if (minimumBattery.value > 0) minimumBattery.value.toInt() else null,
        )
    }

fun ScooterMapController.formattedDistance(scooter: Scooter): String? {
    routeDistance(ScooterWalkTarget.Scooter(scooter))?.let { return Scooter.formattedLength(it) }
    val origin = activeOrigin?.point ?: return null
    return scooter.formattedDistance(from = origin)
}

fun ScooterMapController.straightLineDistance(scooter: Scooter): Double? {
    val origin = activeOrigin?.point ?: return null
    return scooter.distance(from = origin)
}

/** What is left to walk along the route on the map, or else the straight line. */
fun ScooterMapController.walkingDistance(scooter: Scooter): Double? = routeDistance(ScooterWalkTarget.Scooter(scooter)) ?: straightLineDistance(scooter)

fun ScooterMapController.approximateWalkingMinutes(scooter: Scooter): Int? {
    val distance = walkingDistance(scooter) ?: return null
    if (!distance.isFinite()) return null
    return ScooterMapLook.walkingMinutes(metres = distance)
}

fun ScooterMapController.approximateWalkingMinutes(parking: ScooterParking): Int? {
    routeDistance(ScooterWalkTarget.Parking(parking))?.let { return ScooterMapLook.walkingMinutes(metres = it) }
    val origin = activeOrigin?.point ?: return null
    val distance = ScooterMapController.distance(origin, GeoPoint(latitude = parking.latitude, longitude = parking.longitude))
    if (!distance.isFinite()) return null
    return ScooterMapLook.walkingMinutes(metres = distance)
}

/**
 * The second line of the scooter card: "≈4 min walk · 320 m", or "≈4 min walk from Zürich HB · 320 m" when
 * the origin is a searched place. Null without an origin.
 */
fun ScooterMapController.walkingSummary(scooter: Scooter): String? {
    val minutes = approximateWalkingMinutes(scooter) ?: return null
    val distance = formattedDistance(scooter) ?: return null
    val searchedDestination = searchedDestination.value
    if (searchedDestination != null) {
        return stringFormat(
            localized("≈%1\$lld min walk from %2\$@ · %3\$@"),
            minutes.toLong(),
            searchedDestination.title.isolated,
            distance,
        )
    }
    return stringFormat(localized("≈%1\$lld min walk · %2\$@"), minutes.toLong(), distance)
}

/**
 * The second line of the bay card: "Rue Faidherbe · ≈3 min walk", with "from Zürich HB" when the origin is
 * a searched place, or the name alone without an origin.
 */
fun ScooterMapController.parkingSubtitle(parking: ScooterParking): String {
    val minutes = approximateWalkingMinutes(parking) ?: return parking.name
    val walk = walkPart(minutes = minutes)
    if (parking.name.isEmpty()) return walk
    return stringFormat(localized("%1\$@ · %2\$@"), parking.name.isolated, walk)
}

/** "≈3 min walk", or "≈3 min walk from Zürich HB" when the origin is a searched place. */
private fun ScooterMapController.walkPart(minutes: Int): String {
    val searchedDestination = searchedDestination.value
        ?: return stringFormat(localized("≈%lld min walk"), minutes.toLong())
    return stringFormat(localized("≈%1\$lld min walk from %2\$@"), minutes.toLong(), searchedDestination.title.isolated)
}
