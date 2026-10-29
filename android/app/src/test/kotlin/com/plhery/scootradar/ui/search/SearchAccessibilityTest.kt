package com.plhery.scootradar.ui.search

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performTextClearance
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.api.AddressSearchAPIClient
import com.plhery.scootradar.core.api.AddressSearchResult
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.ScooterCity
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterSearchBarState
import com.plhery.scootradar.ui.theme.ScootTheme
import java.io.IOException
import java.util.Locale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

// The search's VoiceOver in ios/ScootRadar/Views/SwissAddressSearch.swift (ui.md UI-252 to UI-254, UI-258, UI-260),
// as TalkBack is given it.

/** What TalkBack is given of the search bar, of the open search's headings, and what it hears as places come. */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w390dp-h844dp-xhdpi")
class SearchAccessibilityTest {
    @get:Rule
    val compose = createComposeRule()

    private val locale = Locale.getDefault()
    private var state by mutableStateOf<ScooterSearchBarState>(ScooterSearchBarState.Empty)
    private var hasActiveFilters by mutableStateOf(false)
    private var isSearching by mutableStateOf(false)

    @Before
    fun setUp() {
        Locale.setDefault(Locale.forLanguageTag("en-CH"))
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
    }

    private fun show(recentPlaces: List<MapDestination> = emptyList(), nearbyCities: List<ScooterCity> = emptyList()) {
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                CompositionLocalProvider(LocalAddressSearch provides FoundPlaces) {
                    Box(Modifier.fillMaxSize()) {
                        ScooterSearchIsland(
                            state = state,
                            isSearching = isSearching,
                            onSearchingChange = { isSearching = it },
                            hasActiveFilters = hasActiveFilters,
                            onSelect = {},
                            onClear = {},
                            onUseCurrentLocation = {},
                            onShowFilters = {},
                            onShowSettings = {},
                            modifier = Modifier.align(Alignment.TopCenter).padding(top = 8.dp, start = 12.dp, end = 12.dp),
                            recentPlaces = recentPlaces,
                            nearbyCities = nearbyCities,
                        )
                    }
                }
            }
        }
        compose.waitForIdle()
    }

    private fun place(title: String, isCovered: Boolean) = ScooterSearchBarState.Place(
        MapDestination(title, "", GeoPoint(47.3779, 8.5403), MapDestination.Kind.Address, isCovered),
    )

    /**
     * A button with nothing inside it for TalkBack to stop on, the label saying it all: found in the merged tree, as
     * TalkBack is given it, where what a node clears is gone.
     */
    private val button = SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Button) and
        SemanticsMatcher.keyIsDefined(SemanticsActions.OnClick) and
        SemanticsMatcher("has nothing inside it") { it.children.isEmpty() }

    /** UI-252: the bar is one button, labelled by what it shows; its icon, tile or spinner is not read. */
    @Test
    fun theBarIsOneButtonLabelledByWhatItShows() {
        show()
        compose.onNodeWithContentDescription("Search city or address").assert(button)

        compose.runOnIdle { state = ScooterSearchBarState.Locating }
        compose.onNodeWithContentDescription("Finding your location…").assert(button)

        compose.runOnIdle { state = place("Bahnhofplatz", isCovered = true) }
        compose.onNodeWithContentDescription("Showing scooters near Bahnhofplatz. Search another place.").assert(button)

        compose.runOnIdle { state = place("Lyngen", isCovered = false) }
        compose.onNodeWithContentDescription("Lyngen. Tap to search a city or address").assert(button)

        // A title in right-to-left letters is isolated, so the sentence around it keeps its order.
        compose.runOnIdle { state = place("\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1", isCovered = true) }
        compose.onNodeWithContentDescription(
            "Showing scooters near \u2068\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1\u2069. Search another place.",
        ).assert(button)
    }

    /** UI-253 and UI-254: Clear place with a place only, and Filters says when filters are active. */
    @Test
    fun clearPlaceAndFiltersSayWhatTheyDo() {
        show()
        compose.onNodeWithContentDescription("Filters").assert(button)
        compose.onNodeWithContentDescription("Clear place", useUnmergedTree = true).assertDoesNotExist()

        compose.runOnIdle {
            state = place("Bahnhofplatz", isCovered = true)
            hasActiveFilters = true
        }
        compose.onNodeWithContentDescription("Clear place").assert(button)
        compose.onNodeWithContentDescription("Filters, active").assert(button)
        compose.onNodeWithContentDescription("Filters", useUnmergedTree = true).assertDoesNotExist()
        compose.onNodeWithContentDescription("Settings").assert(button)
    }

    /** UI-258: "Recent" and "Cities with scooters" are headings. */
    @Test
    fun theSuggestionsHeadingsAreHeadings() {
        isSearching = true
        show(
            recentPlaces = listOf(place("Bahnhofplatz", isCovered = true).destination),
            nearbyCities = listOf(
                ScooterCity("ch:Zurich", "Zürich", "CH", GeoPoint(47.3769, 8.5417), GeoBounds(47.32, 8.45, 47.43, 8.62)),
            ),
        )
        for (title in listOf("Recent", "Cities with scooters")) {
            compose.onNode(hasText(title), useUnmergedTree = true).assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading))
        }
        compose.onNode(hasText("Use my location"), useUnmergedTree = true)
            .assert(SemanticsMatcher.keyNotDefined(SemanticsProperties.Heading))
    }

    /**
     * UI-260: TalkBack hears how many places were found, or that none were, or that the search failed, as each
     * comes; nothing while it searches or once the field is emptied.
     */
    @Test
    fun talkBackHearsHowManyPlacesWereFoundAndNothingWhileSearching() {
        isSearching = true
        show()
        compose.mainClock.autoAdvance = false
        assertEquals(emptyList<String>(), announced())

        type("Bahnhof")
        assertEquals(emptyList<String>(), announced())
        compose.mainClock.advanceTimeBy(1_000)
        compose.waitForIdle()
        assertEquals(listOf("3 address suggestions"), announced())

        for ((query, said) in listOf(
            "Zürich HB" to "One address suggestion",
            "Nowhere" to "No places found.",
            "Offline" to "Search isn’t available right now.",
        )) {
            type(query)
            compose.mainClock.advanceTimeBy(1_000)
            compose.waitForIdle()
            assertEquals(query, listOf(said), announced())
        }

        compose.onNodeWithTag(SEARCH_FIELD_TAG).performTextClearance()
        compose.mainClock.advanceTimeBy(1_000)
        compose.waitForIdle()
        assertTrue(announced().isEmpty())
    }

    private fun type(query: String) {
        compose.onNodeWithTag(SEARCH_FIELD_TAG).performTextClearance()
        compose.onNodeWithTag(SEARCH_FIELD_TAG).performTextInput(query)
        compose.waitForIdle()
    }

    /** What the panes say that TalkBack reads as they appear: the announcements. */
    private fun announced(): List<String> =
        compose.onAllNodes(SemanticsMatcher.keyIsDefined(SemanticsProperties.PaneTitle), useUnmergedTree = true)
            .fetchSemanticsNodes()
            .map { it.config[SemanticsProperties.PaneTitle] }
}

/** Three places for "Bahnhof", one for "Zürich HB", none for "Nowhere", and a failure for "Offline". */
private object FoundPlaces : AddressSearchAPIClient {
    override suspend fun search(query: String, language: String, near: GeoPoint?): List<AddressSearchResult> =
        when (query) {
            "Bahnhof" -> listOf(
                AddressSearchResult(47.3769, 8.5397, "Bahnhofstrasse, 8001 Zürich, Switzerland", "Bahnhofstrasse", "8001 Zürich, Switzerland", true),
                AddressSearchResult(46.9481, 7.4396, "Bahnhofplatz, 3011 Bern, Switzerland", "Bahnhofplatz", "3011 Bern, Switzerland", true),
                AddressSearchResult(69.5779, 20.2198, "Bahnhof, Lyngen, Norway", "Bahnhof", "Lyngen, Norway", false),
            )
            "Zürich HB" -> listOf(
                AddressSearchResult(47.3779, 8.5403, "Zürich HB, 8001 Zürich, Switzerland", "Zürich HB", "8001 Zürich, Switzerland", true),
            )
            "Offline" -> throw IOException("offline")
            else -> emptyList()
        }
}
