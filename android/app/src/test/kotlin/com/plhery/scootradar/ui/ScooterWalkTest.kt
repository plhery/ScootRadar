package com.plhery.scootradar.ui

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.FakeLocationManager
import com.plhery.scootradar.FakeWalkingDirections
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.api.WalkingDirectionsError
import com.plhery.scootradar.core.map.showWalkingRoute
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterWalkFailure
import com.plhery.scootradar.core.model.ScooterWalkPhase
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.offset
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.dock.ScooterControlDock
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode
import java.util.Locale
import java.util.TimeZone

// The card's tests of ios/ScootRadarTests/ScooterWalkTests.swift; the walk's logic is :core's ScooterWalkTest.

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ScooterWalkTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val rider = GeoPoint(latitude = 47.3769, longitude = 8.5417)

    /** The site's path from the rider to a scooter 300 m east: 100 m north, 300 m east and 100 m back south. */
    private val detour: List<GeoPoint>
        get() = listOf(rider, rider.offset(east = 0, north = 100), rider.offset(east = 300, north = 100), rider.offset(east = 300, north = 0))

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Zurich"))
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
        TimeZone.setDefault(timeZone)
    }

    @Test
    fun theCardsDrawEveryStateOfTheWalk() {
        val target = rider.offset(east = 300, north = 0).let { scooter("s1", "lime", latitude = it.latitude, longitude = it.longitude) }
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(target)))
        val directions = FakeWalkingDirections(result = Result.success(detour))
        val model = controllers.make(api, locationManager = FakeLocationManager(), directions = directions)
        model.setUserLocation(rider)
        model.updateViewport(MapRegion(rider, latitudeDelta = 0.01, longitudeDelta = 0.01), zoom = 17)
        assertTrue(controllers.waitUntil { model.lastUpdated.value != null && !model.isLoading.value })
        val renderer = Renderer(compose)

        model.selectScooter(target.id)
        directions.holds = true
        model.showWalkingRoute(ScooterWalkTarget.Scooter(target))
        renderer.assertRenders("finding") { ScooterControlDock(model) }

        controllers.waitUntil { directions.requests.size == 1 }
        directions.releaseAll(with = Result.success(detour))
        controllers.waitUntil { model.walk.value?.phase == ScooterWalkPhase.Shown }
        renderer.assertRenders("shown") { ScooterControlDock(model) }

        model.setUserLocation(rider.offset(east = 300, north = 10))
        renderer.assertRenders("arrived") { ScooterControlDock(model) }

        directions.result = Result.failure(WalkingDirectionsError(WalkingDirectionsError.Reason.NoRoute))
        directions.holds = false
        model.setUserLocation(rider)
        model.showWalkingRoute(ScooterWalkTarget.Scooter(target))
        controllers.waitUntil { model.walk.value?.phase == ScooterWalkPhase.Failed(ScooterWalkFailure.NoRoute) }
        renderer.assertRenders("failed") { ScooterControlDock(model) }
    }
}
