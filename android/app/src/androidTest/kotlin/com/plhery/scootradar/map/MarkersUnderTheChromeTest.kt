package com.plhery.scootradar.map

import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.core.view.ViewCompat
import androidx.customview.widget.ExploreByTouchHelper
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.ui.ScreenState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng

/**
 * What TalkBack hears of the markers follows the chrome the screen measures, through ScooterMap itself, which hands
 * it to them (app-ai, review-app-ai T1): none under Filters or Settings, as VoiceOver hears nothing under a sheet,
 * and none that a finger finds under the open search, where swipes still reach them, as VoiceOver's reach MapKit's.
 */
@RunWith(AndroidJUnit4::class)
class MarkersUnderTheChromeTest {
    @get:Rule
    val compose = createEmptyComposeRule()

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val language = ScooterLanguage.current
    private val zurich = GeoPoint(47.3769, 8.5417)
    private val api = object : ScooterAPIClient {
        override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = ScooterResponse(
            vehicles = listOf(
                Scooter(
                    provider = "lime",
                    latitude = zurich.latitude,
                    longitude = zurich.longitude,
                    battery = 80,
                    rangeMeters = null,
                    vehicleID = "a",
                    deepLink = null,
                    rentalURIs = null,
                    distanceMeters = 0.0,
                ),
            ),
        )
    }

    @Before
    fun setUp() {
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        scope.cancel()
        ScooterLanguage.current = language
    }

    @Test
    fun noMarkerIsHeardUnderASheetAndNoneIsFoundUnderTheOpenSearch() {
        val frames = MapChromeFrames()
        withScooterMap(testController(scope, api), zurichStart, chrome = frames) { shown ->
            val phone = shown.phone
            phone.onMain { phone.map.moveCamera(CameraUpdateFactory.newLatLngZoom(LatLng(zurich.latitude, zurich.longitude), 16.0)) }
            val markers = phone.onMain { ViewCompat.getAccessibilityDelegate(phone.view) as ScooterMarkerAccessibility }
            fun heard() = phone.onMain { markers.virtualViews() }
            compose.waitUntil(10_000) { heard().size == 1 }
            val marker = heard().single()
            val dot = phone.onMain { phone.projection.point(zurich) }
            val ratio = phone.view.pixelRatio
            fun found() = phone.onMain { markers.virtualViewAt((dot.x * ratio).toFloat(), (dot.y * ratio).toFloat()) }
            assertEquals("a finger on the dot", marker, found())

            // Filters or Settings over the map: none of it is heard, by swipe or by finger.
            phone.onMain { frames.covered = true }
            compose.waitUntil(5_000) { heard().isEmpty() }
            assertEquals("a finger under a sheet", ExploreByTouchHelper.INVALID_ID, found())
            phone.onMain { frames.covered = false }
            compose.waitUntil(5_000) { heard() == listOf(marker) }

            // The open search over the dot: a finger finds the search, swipes still reach the marker.
            phone.onMain { frames.search = ScreenRect(dot.x - 100, dot.y - 100, 200.0, 200.0) }
            compose.waitUntil(5_000) { found() == ExploreByTouchHelper.INVALID_ID }
            assertEquals("swipes under the open search", listOf(marker), heard())
            phone.onMain { frames.search = null }
            compose.waitUntil(5_000) { found() == marker }
        }
    }

    /**
     * The same through the screen, with ScooterMap in the map's place as MainActivity puts it there: the markers
     * follow the sheets the screen opens, as ScooterMap hears the chrome the screen measures and none of its own
     * (review-lead-1nov K7).
     */
    @Test
    fun noMarkerIsHeardUnderTheScreensSheets() {
        val screen = ScreenState(scope)
        withAppMap(testController(scope, api), screenState = screen) { phone ->
            phone.onMain { phone.map.moveCamera(CameraUpdateFactory.newLatLngZoom(LatLng(zurich.latitude, zurich.longitude), 16.0)) }
            val markers = phone.onMain { ViewCompat.getAccessibilityDelegate(phone.view) as ScooterMarkerAccessibility }
            fun heard() = phone.onMain { markers.virtualViews() }
            compose.waitUntil(30_000) { heard().size == 1 }
            val marker = heard().single()

            phone.onMain { screen.settingsPresented = true }
            compose.waitUntil(5_000) { heard().isEmpty() }
            phone.onMain { screen.settingsPresented = false }
            compose.waitUntil(5_000) { heard() == listOf(marker) }
            phone.onMain { screen.filtersPresented = true }
            compose.waitUntil(5_000) { heard().isEmpty() }
            phone.onMain { screen.filtersPresented = false }
            compose.waitUntil(5_000) { heard() == listOf(marker) }
        }
    }
}
