package com.plhery.scootradar.ui

import android.view.View
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.viewinterop.AndroidView
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.FakeLocationManager
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.dockAnnouncement
import com.plhery.scootradar.core.map.showWalkingRoute
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.scooter
import com.plhery.scootradar.zurichRegion
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.util.Locale

/**
 * VoiceOver hears each announcement the iPhone posts, the same words again included, and none is taken back. TalkBack
 * is sent each as an announcement, which it speaks as it comes; a pane would make its title the window's, which
 * TalkBack says again at the next window change and files its focus under (PLAN §10, review-app-ai R1 and R2).
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w443dp-h970dp-mdpi")
// Compose leaves out the nodes others cover by Android's Region, which only native graphics computes.
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class AnnouncementsTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private lateinit var talkBack: TalkBackAnnouncements

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        ScooterLanguage.current = ScooterLanguage.En
        talkBack = TalkBackAnnouncements()
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
    }

    /** The panes on the screen, whose titles TalkBack makes the window's. */
    private fun panes() =
        compose.onAllNodes(SemanticsMatcher.keyIsDefined(SemanticsProperties.PaneTitle), useUnmergedTree = true)
            .fetchSemanticsNodes()

    @Test
    fun aCardClosingSaysNothingAndTheCardOpenedAgainIsHeardAgain() {
        val target = scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421)
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(target)))
        val model = controllers.make(api)
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { model.lastUpdated.value != null && !model.isLoading.value })
        compose.setContent {
            // A view over the whole screen, as MapLibre's map is.
            ScooterMapScreen(controller = model, map = { AndroidView(::View, Modifier.fillMaxSize()) }, glassBlurs = false)
        }
        compose.waitForIdle()
        assertEquals(emptyList<String>(), talkBack.sent())

        compose.runOnIdle { model.selectScooter(target.id) }
        compose.waitForIdle()
        val card = model.dockAnnouncement
        assertTrue("$card", card != null && card.startsWith("Lime scooter"))
        assertEquals(listOf(card), talkBack.sent())
        // Said without a pane: the window keeps the app's title.
        assertEquals(0, panes().size)

        // Closed, nothing is said.
        compose.runOnIdle { model.clearSelection() }
        compose.waitForIdle()
        assertEquals(listOf(card), talkBack.sent())

        // Opened again, it is heard again, as VoiceOver hears each card.
        compose.runOnIdle { model.selectScooter(target.id) }
        compose.waitForIdle()
        assertEquals(listOf(card, card), talkBack.sent())
    }

    /**
     * A card that follows its scooter to the new id its feed gives it, as Bird's and Pony's do on each read, is no new
     * choice: TalkBack doesn't hear it again, as VoiceOver doesn't (d6c90d97).
     */
    @Test
    fun aCardThatFollowsItsScooterToANewIdIsNotHeardAgain() {
        val target = scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421)
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(target)))
        val model = controllers.make(api)
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { model.lastUpdated.value != null && !model.isLoading.value })
        compose.setContent {
            ScooterMapScreen(controller = model, map = { AndroidView(::View, Modifier.fillMaxSize()) }, glassBlurs = false)
        }
        compose.runOnIdle { model.selectScooter(target.id) }
        compose.waitForIdle()
        val card = model.dockAnnouncement
        assertEquals(listOf(card), talkBack.sent())

        api.setResponse(ScooterResponse(vehicles = listOf(scooter(id = "b", provider = "lime", latitude = 47.3772, longitude = 8.5421))))
        compose.runOnIdle { model.refresh() }
        assertTrue(controllers.waitUntil { api.calls == 2 && !model.isLoading.value })
        compose.waitForIdle()
        assertEquals("lime:b", model.selectedScooterID.value)
        assertEquals(listOf(card), talkBack.sent())
    }

    /**
     * A walk with no location brings the location card and the dock's "Couldn’t find your location." in one change: the
     * card is said first, as it comes, and the dock's words a recomposition after they change (review-lead-1nov-c 2).
     */
    @Test
    fun aWalkWithNoLocationSaysTheCardBeforeTheDock() {
        val target = scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421)
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(target)))
        val model = controllers.make(api, locationManager = FakeLocationManager(ScooterAuthorizationStatus.Denied))
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { model.lastUpdated.value != null && !model.isLoading.value })
        compose.setContent {
            ScooterMapScreen(controller = model, map = { AndroidView(::View, Modifier.fillMaxSize()) }, glassBlurs = false)
        }
        compose.runOnIdle { model.selectScooter(target.id) }
        compose.waitForIdle()
        val before = talkBack.sent().size

        compose.runOnIdle { model.showWalkingRoute(ScooterWalkTarget.Scooter(target)) }
        compose.waitForIdle()
        val said = talkBack.sent().drop(before)
        val card = ScooterLocationIssue.Denied.let { listOfNotNull(it.title, it.message).joinToString(" ") }
        assertEquals("the card, then the dock, of $said", listOf(card, "Couldn’t find your location."), said.take(2))
    }

    @Test
    fun theSameWordsSaidAgainAreHeardAgainEvenAfterAWithdraw() {
        var announcement by mutableStateOf<Announcement?>(null)
        compose.setContent { Announcer(announcement) }
        compose.waitForIdle()
        fun say(next: Announcement?) {
            announcement = next
            compose.waitForIdle()
        }

        say(Announcement("Finding the way…", serial = 1))
        say(Announcement("Finding the way…", serial = 2))
        say(Announcement("Finding the way…", serial = 3))
        assertEquals(List(3) { "Finding the way…" }, talkBack.sent())

        // Withdrawn, nothing is said; the same words said after are heard again.
        say(null)
        assertEquals(3, talkBack.sent().size)
        say(Announcement("Finding the way…", serial = 4))
        assertEquals(List(4) { "Finding the way…" }, talkBack.sent())
        assertEquals(0, panes().size)
    }
}
