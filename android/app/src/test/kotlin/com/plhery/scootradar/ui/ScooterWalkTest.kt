package com.plhery.scootradar.ui

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.FakeLocationManager
import com.plhery.scootradar.FakeWalkingDirections
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.api.WalkingDirectionsError
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.dockAnnouncement
import com.plhery.scootradar.core.map.hideWalkingRoute
import com.plhery.scootradar.core.map.showWalkingRoute
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterWalkFailure
import com.plhery.scootradar.core.model.ScooterWalkPhase
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.offset
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.dock.ScooterControlDock
import com.plhery.scootradar.ui.theme.ScootTheme
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
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
        val (model, directions, target) = harness()
        val renderer = Renderer(compose)

        model.selectScooter(target.id)
        directions.holds = true
        model.showWalkingRoute(ScooterWalkTarget.Scooter(target))
        renderer.assertRenders("finding") { ScooterControlDock(model) }

        assertTrue(controllers.waitUntil { directions.requests.size == 1 })
        directions.releaseAll(with = Result.success(detour))
        assertTrue(controllers.waitUntil { model.walk.value?.phase == ScooterWalkPhase.Shown })
        renderer.assertRenders("shown") { ScooterControlDock(model) }

        model.setUserLocation(rider.offset(east = 300, north = 10))
        renderer.assertRenders("arrived") { ScooterControlDock(model) }

        directions.result = Result.failure(WalkingDirectionsError(WalkingDirectionsError.Reason.NoRoute))
        directions.holds = false
        model.setUserLocation(rider)
        model.showWalkingRoute(ScooterWalkTarget.Scooter(target))
        assertTrue(controllers.waitUntil { model.walk.value?.phase == ScooterWalkPhase.Failed(ScooterWalkFailure.NoRoute) })
        renderer.assertRenders("failed") { ScooterControlDock(model) }
    }

    /** TalkBack hears what VoiceOver hears: a card as it opens, and the walk's news, but not what the dock first shows. */
    @Test
    fun theDockAndTheWalkAreAnnouncedAsTheyChange() {
        val (model, _, target) = harness()
        compose.setContent { ScootTheme(dark = false, reduceMotion = true) { ScooterControlDock(model) } }
        compose.waitForIdle()
        compose.onAllNodes(SemanticsMatcher.keyIsDefined(SemanticsProperties.PaneTitle)).assertCountEquals(0)

        model.selectScooter(target.id)
        compose.waitForIdle()
        val card = model.dockAnnouncement ?: return fail("Expected the card's announcement")
        assertTrue(card, card.startsWith("Lime scooter"))
        compose.onNode(SemanticsMatcher.expectValue(SemanticsProperties.PaneTitle, card)).assertExists()

        model.showWalkingRoute(ScooterWalkTarget.Scooter(target))
        compose.waitForIdle()
        compose.onNode(SemanticsMatcher.expectValue(SemanticsProperties.PaneTitle, localized("Finding the way…"))).assertExists()
    }

    /** The open card's Directions button follows the walk without the card being drawn anew. */
    @Test
    fun theDirectionsButtonFollowsTheWalkWhileTheCardStaysOpen() {
        val (model, directions, target) = harness()
        compose.setContent { ScootTheme(dark = false, reduceMotion = true) { ScooterControlDock(model) } }
        model.selectScooter(target.id)
        compose.onNodeWithContentDescription(localized("Directions")).assertExists()

        directions.holds = true
        model.showWalkingRoute(ScooterWalkTarget.Scooter(target))
        compose.onNodeWithContentDescription(localized("Finding the way…")).assertExists()

        assertTrue(controllers.waitUntil { directions.requests.size == 1 })
        directions.releaseAll(with = Result.success(detour))
        assertTrue(controllers.waitUntil { model.walk.value?.phase == ScooterWalkPhase.Shown })
        compose.onNodeWithContentDescription(localized("Hide route")).assertExists()

        model.hideWalkingRoute()
        compose.onNodeWithContentDescription(localized("Directions")).assertExists()
    }

    private data class Harness(val model: ScooterMapController, val directions: FakeWalkingDirections, val target: Scooter)

    /** A rider in Zürich's centre, located, and a scooter 300 m east on a map that has loaded. */
    private fun harness(): Harness {
        val target = rider.offset(east = 300, north = 0).let { scooter("s1", "lime", latitude = it.latitude, longitude = it.longitude) }
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(target)))
        val directions = FakeWalkingDirections(result = Result.success(detour))
        val model = controllers.make(api, locationManager = FakeLocationManager(), directions = directions)
        model.setUserLocation(rider)
        model.updateViewport(MapRegion(rider, latitudeDelta = 0.01, longitudeDelta = 0.01), zoom = 17)
        assertTrue(controllers.waitUntil { model.lastUpdated.value != null && !model.isLoading.value })
        return Harness(model, directions, target)
    }
}
