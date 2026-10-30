package com.plhery.scootradar.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import com.plhery.scootradar.core.map.ScooterMapController
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.merge
import java.time.Instant

// SwiftUI's observation of the @Observable ScooterMapModel, and TimelineView(.periodic(from:by:)), in
// ios/ScootRadar/Views/ScooterControls.swift.

/**
 * A number that goes up each time something the controller holds changes. The dock's read-outs are worked out
 * from many of its values at once, as the iPhone model's computed properties are: what draws them reads this, and
 * works them out again when it moves, as SwiftUI redraws a view when anything it read has changed.
 */
@Composable
fun rememberControllerChanges(controller: ScooterMapController): Int {
    val changes = remember(controller) { mutableIntStateOf(0) }
    LaunchedEffect(controller) {
        merge(*controller.chromeStates().toTypedArray()).collect { changes.intValue += 1 }
    }
    return changes.intValue
}

/**
 * The controller's values the chrome draws from: all of them but the camera's requests and the compass heading,
 * which only the map follows, and which change many times a second.
 */
private fun ScooterMapController.chromeStates(): List<StateFlow<*>> = listOf(
    vehicles, clusters, lastSeenVehicles, lastSeenClusters, lastSeenAt, parking,
    viewport, viewportZoom, viewportZoomLevel,
    isLoading, isLocating, loadIssue, lastUpdated, responseMetadata,
    userLocation, hasLocatedOnce, locationIssue,
    enabledProviders, selectedScooterID, selectedParkingID, isPanelCollapsed,
    searchedDestination, recentPlaces,
    walk, walkAnnouncement, reviewMoments,
    minimumBattery, mapStyle, showsZones, zoneState, mapZones, mapZonesRevision, mapRuleZones, mapZoneNotices,
    mapOperatorZoneCount,
    appearance, languageChoice, language,
    rideEstimateMinutes, ridePasses,
    mapScootersRevision, mapClustersRevision, mapLastSeenRevision,
    visibleScooterCount, visibleLastSeenCount, visibleProviderCounts,
)

/** The time the chrome's statuses are told at: the phone's, or a test's clock. */
val LocalClock = staticCompositionLocalOf<() -> Instant> { Instant::now }

/** The time now, told again every [seconds], as `TimelineView(.periodic(from: .now, by: seconds))`. */
@Composable
fun rememberNow(seconds: Long = 30): Instant {
    val clock = LocalClock.current
    return produceState(clock(), clock, seconds) {
        while (true) {
            delay(seconds * 1000)
            value = clock()
        }
    }.value
}
