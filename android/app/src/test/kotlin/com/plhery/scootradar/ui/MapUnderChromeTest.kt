package com.plhery.scootradar.ui

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
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
import org.robolectric.annotation.Config
import java.util.Locale

/**
 * What the screen tells the map is over it, and what TalkBack hears of the map: Filters, Settings and the open search
 * cover all of it. While the search is open TalkBack reads it alone, the map's markers none, nor beside a large
 * window's panel the zones' legend and the locate button in the map's corner, and Back closes it, as VoiceOver reads
 * the iPhone's search alone and its escape scrub closes it since 4 November (ScooterMapScreen.swift:96-97 and 415-417,
 * SwissAddressSearch.swift:364-366).
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w443dp-h970dp-mdpi")
class MapUnderChromeTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val hidden = SemanticsMatcher.keyIsDefined(SemanticsProperties.HideFromAccessibility)

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
        compose.onNodeWithTag(SEARCH_ISLAND_TAG).assert(!hidden and !hasAnyAncestor(hidden))

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
        compose.onNodeWithTag(SEARCH_ISLAND_TAG).assert(!hidden and !hasAnyAncestor(hidden))

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

    private fun map() = compose.onNodeWithTag(MAP)

    private fun locateButton() = compose.onNode((hasContentDescription("Near me") or hasText("Near me")) and hasClickAction())

    private fun assertHeard(node: SemanticsNodeInteraction) {
        node.assert(!hidden and !hasAnyAncestor(hidden))
    }

    private fun assertUnheard(node: SemanticsNodeInteraction) {
        node.assert(hidden or hasAnyAncestor(hidden))
    }

    private fun back() {
        compose.runOnUiThread { compose.activity.onBackPressedDispatcher.onBackPressed() }
        compose.waitForIdle()
    }

    private companion object {
        const val MAP = "map"
    }
}
