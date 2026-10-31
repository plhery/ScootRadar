package com.plhery.scootradar.ui

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScreenPoint
import com.plhery.scootradar.map.LocalMapChrome
import com.plhery.scootradar.map.MapChromeFrames
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import com.plhery.scootradar.zurichRegion
import org.junit.After
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import java.util.Locale

/**
 * What the screen tells the map is over it, for TalkBack's view of the markers: Filters and Settings cover all of it,
 * and the open search is where a finger exploring the screen finds the search's rows, not the markers under them, as
 * VoiceOver finds what is in front (app-ai's TalkBack pass).
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w443dp-h970dp-mdpi")
class MapUnderChromeTest {
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

    @Test
    fun theSheetsCoverTheMapAndTheOpenSearchIsOverIt() {
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421))))
        val model = controllers.make(api)
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { model.lastUpdated.value != null && !model.isLoading.value })
        lateinit var screen: ScreenState
        lateinit var frames: MapChromeFrames
        compose.setContent {
            screen = rememberScreenState()
            ScooterMapScreen(controller = model, map = { frames = LocalMapChrome.current!! }, glassBlurs = false, screenState = screen)
        }
        compose.waitForIdle()
        assertFalse(frames.covered)
        assertNull(frames.search)

        compose.runOnIdle { screen.searchIsExpanded = true }
        compose.waitForIdle()
        // The window's points are its pixels at mdpi.
        val island = compose.onNodeWithTag(SEARCH_ISLAND_TAG).fetchSemanticsNode().boundsInWindow
        val search = frames.search
        val middle = ScreenPoint(island.center.x.toDouble(), island.center.y.toDouble())
        assertTrue("the open search $search holds the island $island", search != null && search.contains(middle) && search.height >= island.height - 1)
        assertFalse(frames.covered)

        compose.runOnIdle { screen.searchIsExpanded = false }
        compose.waitForIdle()
        assertNull(frames.search)

        compose.runOnIdle { screen.settingsPresented = true }
        compose.waitForIdle()
        assertTrue(frames.covered)
        compose.runOnIdle { screen.settingsPresented = false }
        compose.waitForIdle()
        assertFalse(frames.covered)
        compose.runOnIdle { screen.filtersPresented = true }
        compose.waitForIdle()
        assertTrue(frames.covered)
    }
}
