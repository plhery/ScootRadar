package com.plhery.scootradar.ui

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.view.View
import android.view.accessibility.AccessibilityManager
import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.map.LocalMapChrome
import com.plhery.scootradar.map.MapChromeFrames
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import com.plhery.scootradar.zurichRegion
import org.junit.After
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import java.util.Locale

/**
 * What the screen tells the map is over it, and what TalkBack hears of the map: Filters, Settings and the open search
 * cover all of it. While the search is open TalkBack reads it alone, the map's markers none, nor beside a large
 * window's panel the zones' legend and the locate button in the map's corner, and Back closes it, as VoiceOver reads
 * the iPhone's search alone and its escape scrub closes it since 4 November (ScooterMapScreen.swift:96-97 and 415-417,
 * SwissAddressSearch.swift:364-366). Heard is what Compose hands TalkBack as a node in view: hidden from accessibility
 * above it, the map under the open search still gave TalkBack its credits (app-bd).
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w443dp-h970dp-mdpi")
class MapUnderChromeTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()

    /** The screen's view, whose nodes TalkBack is given. */
    private lateinit var view: View

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        ScooterLanguage.current = ScooterLanguage.En
        // TalkBack on: a service, which Compose gives its nodes to, and touch exploration.
        val accessibility = ApplicationProvider.getApplicationContext<Context>().getSystemService(AccessibilityManager::class.java)
        shadowOf(accessibility).setEnabled(true)
        shadowOf(accessibility).setTouchExplorationEnabled(true)
        shadowOf(accessibility).setEnabledAccessibilityServiceList(listOf(AccessibilityServiceInfo()))
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
    }

    @Test
    fun theSheetsAndTheOpenSearchCoverTheMap() {
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421))))
        val model = controllers.make(api)
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { model.lastUpdated.value != null && !model.isLoading.value })
        val (screen, frames) = show(model)
        assertFalse(frames().covered)
        assertHeard(map())

        compose.runOnIdle { screen().searchIsExpanded = true }
        compose.waitForIdle()
        assertTrue(frames().covered)
        assertUnheard(map())
        assertHeard(compose.onNodeWithTag(SEARCH_ISLAND_TAG, useUnmergedTree = true))

        // Back closes it, as Cancel does.
        back()
        assertFalse(screen().searchIsExpanded)
        assertFalse(frames().covered)
        assertHeard(map())

        compose.runOnIdle { screen().settingsPresented = true }
        compose.waitForIdle()
        assertTrue(frames().covered)
        compose.runOnIdle { screen().settingsPresented = false }
        compose.waitForIdle()
        assertFalse(frames().covered)
        compose.runOnIdle { screen().filtersPresented = true }
        compose.waitForIdle()
        assertTrue(frames().covered)
    }

    /**
     * Beside a large window's panel the map, the zones' legend and the locate button stay in view while the search is
     * open, but TalkBack hears none of them; Back closes it.
     */
    @Test
    @Config(qualifiers = "w1280dp-h800dp-mdpi")
    fun besideThePanelTheOpenSearchIsReadAlone() {
        val model = controllers.make(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        val (screen, frames) = show(model)
        assertFalse(frames().covered)
        assertHeard(map())
        assertHeard(locateButton())

        compose.runOnIdle { screen().searchIsExpanded = true }
        compose.waitForIdle()
        assertTrue(frames().covered)
        assertUnheard(map())
        assertUnheard(locateButton())
        assertHeard(compose.onNodeWithTag(SEARCH_ISLAND_TAG, useUnmergedTree = true))

        back()
        assertFalse(screen().searchIsExpanded)
        assertFalse(frames().covered)
        assertHeard(map())
        assertHeard(locateButton())
    }

    /** The screen with a stand-in for the map that TalkBack would hear. */
    private fun show(model: ScooterMapController): Pair<() -> ScreenState, () -> MapChromeFrames> {
        lateinit var screen: ScreenState
        lateinit var frames: MapChromeFrames
        compose.setContent {
            view = LocalView.current
            screen = rememberScreenState()
            ScooterMapScreen(
                controller = model,
                map = {
                    frames = LocalMapChrome.current!!
                    Box(Modifier.fillMaxSize().testTag(MAP).semantics { contentDescription = "the map" })
                },
                glassBlurs = false,
                screenState = screen,
            )
        }
        compose.waitForIdle()
        return Pair({ screen }, { frames })
    }

    // Unmerged: a node TalkBack is not given is still there, and its id is asked for.
    private fun map() = compose.onNodeWithTag(MAP, useUnmergedTree = true)

    private fun locateButton() =
        compose.onNode((hasContentDescription("Near me") or hasText("Near me")) and hasClickAction(), useUnmergedTree = true)

    /** Whether TalkBack reads the node: Compose gives it TalkBack, as a node in view. */
    private fun heard(node: SemanticsNodeInteraction): Boolean {
        val id = node.fetchSemanticsNode().id
        return compose.runOnIdle { view.accessibilityNodeProvider.createAccessibilityNodeInfo(id)?.isVisibleToUser == true }
    }

    private fun assertHeard(node: SemanticsNodeInteraction) {
        assertTrue("TalkBack reads it", heard(node))
    }

    private fun assertUnheard(node: SemanticsNodeInteraction) {
        assertFalse("TalkBack reads it", heard(node))
    }

    private fun back() {
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.onBackPressed() }
        compose.waitForIdle()
    }

    private companion object {
        const val MAP = "map"
    }
}
