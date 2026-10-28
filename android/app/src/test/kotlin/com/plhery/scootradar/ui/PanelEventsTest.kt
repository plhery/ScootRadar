package com.plhery.scootradar.ui

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.RecordingAnalytics
import com.plhery.scootradar.TrackedEvent
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterMapLink
import com.plhery.scootradar.testController
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.receiveAsFlow
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode
import java.util.Locale

// LOG-326: the filters and the settings say when they open, with a view of their screen, and when they close
// (ScooterMapScreen.swift:153-160).

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class PanelEventsTest {
    @get:Rule
    val compose = createComposeRule()

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val locale = Locale.getDefault()

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        scope.cancel()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
    }

    private fun searchBarShows() = compose.onAllNodesWithTag(SEARCH_ISLAND_TAG).fetchSemanticsNodes().isNotEmpty()

    @Test
    fun theFiltersAndTheSettingsSayWhenTheyOpenAndClose() {
        val analytics = RecordingAnalytics()
        val links = Channel<ScooterMapLink>(Channel.CONFLATED)
        compose.setContent {
            ScooterMapScreen(controller = testController(scope), map = {}, analytics = analytics.analytics, links = links.receiveAsFlow())
        }
        compose.waitForIdle()

        compose.onNodeWithContentDescription("Filters").performClick()
        compose.waitUntil { !searchBarShows() }
        // A link to the map closes the sheet over it.
        links.trySend(ScooterMapLink())
        compose.waitUntil { searchBarShows() }
        compose.onNodeWithContentDescription("Settings").performClick()
        compose.waitUntil { !searchBarShows() }
        links.trySend(ScooterMapLink())
        compose.waitUntil { searchBarShows() }

        assertEquals(
            listOf(
                TrackedEvent("filters_open"),
                TrackedEvent(null, url = "/filters"),
                TrackedEvent("panel_close"),
                TrackedEvent("settings_open"),
                TrackedEvent(null, url = "/settings"),
                TrackedEvent("panel_close"),
            ),
            analytics.events,
        )
    }
}
