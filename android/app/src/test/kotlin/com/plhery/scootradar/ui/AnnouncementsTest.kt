package com.plhery.scootradar.ui

import android.view.View
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.viewinterop.AndroidView
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.dockAnnouncement
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
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
 * TalkBack reads a pane's title as it appears or changes; a pane that goes makes it say the window's title,
 * "ScootRadar", where VoiceOver says nothing. The screen says its announcements in one pane, which stays: what was
 * said is withdrawn by an empty title, which TalkBack doesn't read (app-ai's TalkBack pass, UI-274).
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

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
    }

    /** The composition's view, whose nodes TalkBack is given. */
    private lateinit var view: View

    /**
     * The titles of the panes on the screen, as TalkBack is given them: null for one it isn't, as Compose doesn't give
     * it a node drawn under another that covers it.
     */
    private fun panes(): List<String?> =
        compose.onAllNodes(SemanticsMatcher.keyIsDefined(SemanticsProperties.PaneTitle), useUnmergedTree = true)
            .fetchSemanticsNodes()
            .map { view.accessibilityNodeProvider.createAccessibilityNodeInfo(it.id)?.paneTitle?.toString() }

    @Test
    fun aCardClosingLeavesThePaneWithNothingToSay() {
        val target = scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421)
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(target)))
        val model = controllers.make(api)
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { model.lastUpdated.value != null && !model.isLoading.value })
        compose.setContent {
            view = LocalView.current
            // A view over the whole screen, as MapLibre's map is.
            ScooterMapScreen(controller = model, map = { AndroidView(::View, Modifier.fillMaxSize()) }, glassBlurs = false)
        }
        compose.waitForIdle()
        assertEquals(emptyList<String?>(), panes())

        compose.runOnIdle { model.selectScooter(target.id) }
        compose.waitForIdle()
        val card = model.dockAnnouncement
        assertTrue("$card", card != null && card.startsWith("Lime scooter"))
        assertEquals(listOf(card), panes())

        compose.runOnIdle { model.clearSelection() }
        compose.waitForIdle()
        assertEquals(listOf(""), panes())

        // Opened again, it is said again.
        compose.runOnIdle { model.selectScooter(target.id) }
        compose.waitForIdle()
        assertEquals(listOf(card), panes())
    }

    @Test
    fun theSameWordsSaidAgainAreANewTitle() {
        var announcement by mutableStateOf<Announcement?>(null)
        compose.setContent {
            view = LocalView.current
            Announcer(announcement)
        }
        compose.waitForIdle()
        assertEquals(emptyList<String?>(), panes())

        announcement = Announcement("Finding the way…", serial = 1)
        compose.waitForIdle()
        assertEquals(listOf("Finding the way…"), panes())
        // A title that doesn't change is not read again: a zero-width space tells the two apart.
        announcement = Announcement("Finding the way…", serial = 2)
        compose.waitForIdle()
        assertEquals(listOf("Finding the way…\u200B"), panes())
        announcement = Announcement("Finding the way…", serial = 3)
        compose.waitForIdle()
        assertEquals(listOf("Finding the way…"), panes())

        announcement = null
        compose.waitForIdle()
        assertEquals(listOf(""), panes())
    }
}
