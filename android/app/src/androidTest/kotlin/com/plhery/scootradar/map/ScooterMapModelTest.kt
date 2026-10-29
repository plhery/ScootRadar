package com.plhery.scootradar.map

import android.util.Log
import androidx.compose.ui.platform.AndroidUiDispatcher
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.map.dock
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapFocusRequest
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterRentalURIs
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterRidePricing
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng

// The map's part of ios/ScootRadarTests/ScooterMapModelTests.swift, on MapLibre's map of an iPhone's size.
@RunWith(AndroidJUnit4::class)
class ScooterMapModelTest {
    private val zurich = GeoPoint(latitude = 47.3769, longitude = 8.5417)

    @Test
    fun mapOpensSlightlyTiltedAndKeepsItsTiltWhenTheAppMovesIt() = withPhoneMap(MapCamera.opening(zurichStart, MapKitCamera.IPhone)) { phone ->
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
        val frames = CoroutineScope(SupervisorJob() + AndroidUiDispatcher.Main)
        val camera = phone.onMain { MapCamera(phone.map, phone.view, testController(scope), MapCameraMemory(), frames) }
        try {
            phone.onMain {
                assertEquals(20.0, phone.map.cameraPosition.tilt, 0.1)
                camera.applyFocus(MapFocusRequest.city(zurich, token = 1))
            }
            settle()

            // As it keeps the one two fingers give it.
            phone.onMain {
                assertEquals(20.0, phone.map.cameraPosition.tilt, 0.1)
                phone.map.moveCamera(CameraUpdateFactory.tiltTo(30.0))
                camera.applyFocus(MapFocusRequest.city(zurich, token = 2))
            }
            settle()
            phone.onMain { assertEquals(30.0, phone.map.cameraPosition.tilt, 0.1) }
        } finally {
            phone.onMain { camera.close() }
            frames.cancel()
            scope.cancel()
        }
    }

    /**
     * T213. With very large text a card can be taller than the room above the dock and scrolls. A screen that kept
     * updating itself would freeze the app: the card updates the map a few times as it opens, and then nothing
     * moves (MAP-246). The updates are ScooterMap's and the markers', as SwiftUI's updateUIView's; the region changes
     * the camera's.
     */
    @Test
    fun aTallCardOpensOnTheMapScreenWithVeryLargeText() {
        val tall = Scooter(
            provider = "publibike", latitude = 47.3769, longitude = 8.5417, battery = 82, rangeMeters = 24_000,
            vehicleID = "tall", rentalURIs = ScooterRentalURIs(android = "https://publibike.ch/ride"), distanceMeters = 0.0,
            pricing = ScooterRidePricing(currency = "CHF", unlockFeeMinorUnits = 100, minuteFeeMinorUnits = 35),
        )
        val api = object : ScooterAPIClient {
            override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = ScooterResponse(vehicles = listOf(tall))
        }
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
        try {
            val controller = onMain {
                testController(scope, api).also {
                    it.setUserLocation(GeoPoint(latitude = 47.3779, longitude = 8.5417))
                    it.updateViewport(zurichStart.region, zoom = 16)
                }
            }
            waitFor("the first load") { onMain { controller.lastUpdated.value != null && !controller.isLoading.value } }

            // iOS's accessibility3: 40 points of body text over 17.
            withAppMap(controller, textScale = 40f / 17) { phone ->
                // At street level, where the scooter is a dot of its own and a move doesn't group it again.
                phone.onMain { phone.map.moveCamera(CameraUpdateFactory.newLatLngZoom(LatLng(47.3769, 8.5417), 16.0)) }
                settle()
                assertTrue("${onMain { controller.dock }}", onMain { controller.dock } is ScooterDockContent.Summary)
                val camera = phone.onMain { phone.view.camera!! }
                val markers = phone.onMain { phone.view.markers!! }
                fun counts() = phone.onMain { Triple(camera.updates, camera.regionChanges, camera.movesToPlaces) }
                fun markerUpdates() = phone.onMain { markers.updatesMade }

                val before = counts()
                phone.onMain { controller.selectScooter("publibike:tall") }
                Thread.sleep(1_000)
                assertTrue("${onMain { controller.dock }}", onMain { controller.dock } is ScooterDockContent.Scooter)

                // A few updates as the card opens, none of them moving the map more than once.
                val opened = counts()
                val markersOpened = markerUpdates()
                assertTrue("updates of the map as the card opened: ${opened.first - before.first}", opened.first - before.first <= 10)
                assertTrue("moves of the map as the card opened: ${opened.second - before.second}", opened.second - before.second <= 1)

                // Then a second at rest: the dock keeps its height and the map its place.
                val dockTops = mutableSetOf(phone.onMain { camera.currentChrome?.invoke()?.bottomTop })
                repeat(20) {
                    Thread.sleep(50)
                    dockTops += phone.onMain { camera.currentChrome?.invoke()?.bottomTop }
                }
                val rested = counts()
                val markersRested = markerUpdates()
                Log.i("ScooterMapModelTest", "Updates, region changes and moves to places: $before, opened $opened, rested $rested; markers $markersOpened, $markersRested")
                assertTrue("updates of the map once the card was open: ${rested.first - opened.first}", rested.first - opened.first <= 2)
                assertTrue("updates of the markers once the card was open: ${markersRested - markersOpened}", markersRested - markersOpened <= 2)
                assertEquals("moves of the map once the card was open", opened.second, rested.second)
                assertEquals("moves to places once the card was open", opened.third, rested.third)
                assertTrue("heights of the dock once the card was open: $dockTops", dockTops.size <= 1)
                assertNotNull(dockTops.single())
            }
        } finally {
            scope.cancel()
        }
    }

    private fun <T> onMain(block: () -> T): T {
        var result: Result<T>? = null
        InstrumentationRegistry.getInstrumentation().runOnMainSync { result = runCatching(block) }
        return result!!.getOrThrow()
    }

    private fun waitFor(what: String, condition: () -> Boolean) {
        val deadline = System.currentTimeMillis() + 30_000
        while (System.currentTimeMillis() < deadline) {
            if (condition()) return
            Thread.sleep(50)
        }
        assertTrue(what, condition())
    }
}
