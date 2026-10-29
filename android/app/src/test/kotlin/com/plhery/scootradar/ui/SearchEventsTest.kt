package com.plhery.scootradar.ui

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.RecordingAnalytics
import com.plhery.scootradar.TrackedEvent
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.testController
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode
import java.util.Locale

// LOG-239 and LOG-325: the search says when it opens and closes (ScooterMapScreen.swift:150-152), and when the × of
// a chosen place clears it (SwissAddressSearch.swift:107), which neither opens nor closes it.

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class SearchEventsTest {
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

    private fun cancelShows() = compose.onAllNodesWithText(localized("Cancel")).fetchSemanticsNodes().isNotEmpty()

    @Test
    fun theSearchSaysWhenItOpensAndClosesAndWhenItsPlaceIsCleared() {
        val analytics = RecordingAnalytics()
        val controller = testController(scope)
        compose.setContent { ScooterMapScreen(controller = controller, map = {}, analytics = analytics.analytics) }
        compose.waitForIdle()

        compose.onNodeWithTag(SEARCH_ISLAND_TAG).performClick()
        compose.waitUntil { cancelShows() }
        compose.onNodeWithText(localized("Cancel")).performClick()
        compose.waitUntil { !cancelShows() }

        // A place chosen: its × clears it, and the search stays closed.
        compose.runOnIdle {
            controller.focusOnAddress(
                MapDestination(title = "Bahnhofplatz", subtitle = "8001 Zürich", point = GeoPoint(47.3779, 8.5403), kind = MapDestination.Kind.Address, isCovered = true),
            )
        }
        compose.onNodeWithContentDescription(localized("Clear place")).performClick()
        compose.waitForIdle()
        assertNull(controller.searchedDestination.value)

        assertEquals(
            listOf(TrackedEvent("search_open"), TrackedEvent("search_close"), TrackedEvent("search_clear")),
            analytics.events,
        )
    }
}
