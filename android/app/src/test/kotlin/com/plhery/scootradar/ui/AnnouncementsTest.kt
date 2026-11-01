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

    /**
     * What TalkBack 16.2 says of a pane's titles in turn (WindowEventInterpreter): an empty title is dropped and the
     * window keeps the one before; a title equal to the window's is no change and isn't read. Its words, as heard.
     */
    private class TalkBack {
        private var window: String? = null
        val heard = mutableListOf<String>()

        fun sees(title: String?) {
            if (title.isNullOrEmpty() || title == window) return
            window = title
            heard += title.replace("\u200B", "")
        }
    }

    @Test
    fun aCardClosingSaysNothingAndTheCardOpenedAgainIsHeardAgain() {
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
        val talkBack = TalkBack()

        compose.runOnIdle { model.selectScooter(target.id) }
        compose.waitForIdle()
        val card = model.dockAnnouncement
        assertTrue("$card", card != null && card.startsWith("Lime scooter"))
        talkBack.sees(panes().single())
        assertEquals(listOf(card), talkBack.heard)

        // Closed, the pane stays and says nothing.
        compose.runOnIdle { model.clearSelection() }
        compose.waitForIdle()
        assertEquals(listOf(""), panes())
        talkBack.sees(panes().single())
        assertEquals(listOf(card), talkBack.heard)

        // Opened again with no other window between, it is heard again, as VoiceOver hears each card.
        compose.runOnIdle { model.selectScooter(target.id) }
        compose.waitForIdle()
        talkBack.sees(panes().single())
        assertEquals(listOf(card, card), talkBack.heard)
    }

    @Test
    fun theSameWordsSaidAgainAreHeardAgainEvenAfterAWithdraw() {
        var announcement by mutableStateOf<Announcement?>(null)
        compose.setContent {
            view = LocalView.current
            Announcer(announcement)
        }
        compose.waitForIdle()
        assertEquals(emptyList<String?>(), panes())
        val talkBack = TalkBack()
        fun say(next: Announcement?) {
            announcement = next
            compose.waitForIdle()
            talkBack.sees(panes().single())
        }

        // A title that doesn't change is not read again: a zero-width space tells the two apart.
        say(Announcement("Finding the way…", serial = 1))
        say(Announcement("Finding the way…", serial = 2))
        say(Announcement("Finding the way…", serial = 3))
        assertEquals(List(3) { "Finding the way…" }, talkBack.heard)

        // Withdrawn: the pane stays, with nothing to say.
        say(null)
        assertEquals(listOf(""), panes())
        assertEquals(3, talkBack.heard.size)
        // TalkBack kept the last words through the empty title: the same words said now must still be new to it.
        say(Announcement("Finding the way…", serial = 4))
        assertEquals(List(4) { "Finding the way…" }, talkBack.heard)
    }
}
