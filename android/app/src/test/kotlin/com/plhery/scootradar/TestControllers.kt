package com.plhery.scootradar

import com.plhery.scootradar.app.NotDeterminedLocationManager
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ScooterDefaults
import com.plhery.scootradar.core.model.ScooterResponse
import kotlinx.coroutines.CoroutineScope
import java.time.Instant

/** A server with nothing on its map. */
object EmptyScooterAPI : ScooterAPIClient {
    override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int): ScooterResponse =
        ScooterResponse(vehicles = emptyList())
}

/** A router that finds no path. */
object NoWalkingDirections : WalkingDirectionsClient {
    override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> = emptyList()
}

/** A controller of an empty map, on `scope`, with nothing kept from before. */
fun testController(
    scope: CoroutineScope,
    now: () -> Instant = Instant::now,
    defaults: ScooterDefaults = InMemoryScooterDefaults(),
    phoneLanguages: () -> List<String> = { listOf("en-US") },
    keepAppLanguages: (List<String>) -> Unit = {},
): ScooterMapController = ScooterMapController(
    api = EmptyScooterAPI,
    locationManager = NotDeterminedLocationManager(),
    defaults = defaults,
    scope = scope,
    directions = NoWalkingDirections,
    openInMaps = {},
    now = now,
    phoneLanguages = phoneLanguages,
    keepAppLanguages = keepAppLanguages,
)
