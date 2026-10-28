package com.plhery.scootradar.ui

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.test.click
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterCityCatalog
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterMapLink
import com.plhery.scootradar.testController
import com.plhery.scootradar.ui.search.SEARCH_FIELD_TAG
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

// ScooterMapScreen.swift's onOpenURL (UI-377): a link to the map shows its place, not under a sheet or the search.

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class OpenedLinkTest {
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

    /** A sheet over the screen leaves TalkBack only itself: the search bar is read again once it is down. */
    private fun searchBarShows() = compose.onAllNodesWithTag(SEARCH_ISLAND_TAG).fetchSemanticsNodes().isNotEmpty()

    private fun searchIsOpen() = compose.onAllNodesWithTag(SEARCH_FIELD_TAG).fetchSemanticsNodes().isNotEmpty()

    @Test
    fun aLinkClosesTheSheetsAndTheSearchThenOpensItsPlace() {
        val controller = testController(scope)
        val links = Channel<ScooterMapLink>(Channel.CONFLATED)
        compose.setContent { ScooterMapScreen(controller = controller, map = {}, links = links.receiveAsFlow()) }

        // The search's button is the bar's start, before Filters and Settings.
        compose.onNodeWithTag(SEARCH_ISLAND_TAG).performTouchInput { click(Offset(width * 0.25f, centerY)) }
        compose.waitUntil { searchIsOpen() }
        val geneva = GeoPoint(latitude = 46.2, longitude = 6.15)
        links.trySend(ScooterMapLink(origin = geneva))
        compose.waitUntil { !searchIsOpen() }
        assertEquals(geneva, controller.focusRequest.value?.point)

        compose.onNodeWithContentDescription("Filters").performClick()
        compose.waitUntil { !searchBarShows() }
        val bern = ScooterCityCatalog.cities.first { it.id == "ch:bern" }
        links.trySend(ScooterMapLink(origin = bern.center, minimumBattery = 30))
        compose.waitUntil { searchBarShows() }
        assertEquals(bern.destination, controller.searchedDestination.value)
        assertEquals(30.0, controller.minimumBattery.value, 0.0)

        compose.onNodeWithContentDescription("Settings").performClick()
        compose.waitUntil { !searchBarShows() }
        links.trySend(ScooterMapLink(minimumBattery = 0))
        compose.waitUntil { searchBarShows() }
        assertEquals(0.0, controller.minimumBattery.value, 0.0)
        // The place the last link chose stays.
        assertEquals(bern.destination, controller.searchedDestination.value)
    }
}
