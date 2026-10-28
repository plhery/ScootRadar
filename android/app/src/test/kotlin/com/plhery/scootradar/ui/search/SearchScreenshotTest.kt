package com.plhery.scootradar.ui.search

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.unit.dp
import com.plhery.scootradar.core.api.AddressSearchAPIClient
import com.plhery.scootradar.core.api.AddressSearchResult
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.ScooterCity
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterSearchBarState
import com.plhery.scootradar.ui.theme.Look
import com.plhery.scootradar.ui.theme.PHONE
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.screenshot
import com.plhery.scootradar.ui.theme.useFontScale
import kotlinx.coroutines.awaitCancellation
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.IOException
import java.util.Locale

/**
 * The search bar in each of its states (ui.md UI-009 to UI-025), light and dark, at font scale 1.0 and 2.0, over a
 * plain stand-in for the map. The places, the cities and the answers are the test's own, so that nothing in data/
 * changes them.
 */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = PHONE)
class SearchScreenshotTest(private val state: SearchState, private val look: Look) {
    @get:Rule
    val compose = createComposeRule()

    private val locale = Locale.getDefault()

    @Before
    fun setUp() {
        Locale.setDefault(Locale.forLanguageTag("en-CH"))
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
    }

    @Test
    fun search() {
        useFontScale(look.fontScale)
        compose.setContent {
            ScootTheme(dark = look.dark, reduceMotion = true) {
                CompositionLocalProvider(LocalAddressSearch provides FakeAddressSearch) {
                    Box(Modifier.fillMaxSize().background(if (look.dark) Color(0xFF2B2D30) else Color(0xFFF1EFEA))) {
                        ScooterSearchIsland(
                            state = state.bar,
                            isSearching = state.query != null,
                            onSearchingChange = {},
                            hasActiveFilters = state.hasActiveFilters,
                            onSelect = {},
                            onClear = {},
                            onUseCurrentLocation = {},
                            onShowFilters = {},
                            onShowSettings = {},
                            modifier = Modifier.align(Alignment.TopCenter).padding(top = 8.dp, start = 12.dp, end = 12.dp),
                            recentPlaces = recentPlaces,
                            nearbyCities = cities,
                        )
                    }
                }
            }
        }
        state.query?.takeIf { it.isNotEmpty() }?.let { compose.onNodeWithTag(SEARCH_FIELD_TAG).performTextInput(it) }
        // Past the pause before a search, on the test's clock.
        compose.mainClock.advanceTimeBy(1_000)
        compose.waitForIdle()
        compose.screenshot("search/${state.fileName}_${look.suffix}")
    }

    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0} {1}")
        fun parameters(): List<Array<Any>> = SearchState.entries.flatMap { state -> Look.entries.map { arrayOf(state, it) } }
    }
}

/** The search bar's states: collapsed with what the map is based on, and open with what it found for [query]. */
enum class SearchState(
    val bar: ScooterSearchBarState = ScooterSearchBarState.Empty,
    /** What is typed in the open search; null while it is collapsed. */
    val query: String? = null,
    val hasActiveFilters: Boolean = false,
) {
    Collapsed,
    Place(bar = ScooterSearchBarState.Place(bahnhofstrasse), hasActiveFilters = true),
    PlaceNotCovered(bar = ScooterSearchBarState.Place(lyngen)),
    Locating(bar = ScooterSearchBarState.Locating),
    Suggestions(query = ""),
    Searching(query = "Slow"),
    Results(query = "Bahnhof"),
    NoResults(query = "Nowhere"),
    Failed(query = "Broken");

    val fileName: String get() = name.replaceFirstChar { it.lowercase() }
}

/** The server's search as the screenshots have it: places for "Bahnhof", none for "Nowhere", no answer for "Slow". */
private object FakeAddressSearch : AddressSearchAPIClient {
    override suspend fun search(query: String, language: String, near: GeoPoint?): List<AddressSearchResult> =
        when (query) {
            "Bahnhof" -> listOf(
                AddressSearchResult(47.3769, 8.5397, "Bahnhofstrasse, 8001 Zürich, Switzerland", "Bahnhofstrasse", "8001 Zürich, Switzerland", true),
                AddressSearchResult(46.9481, 7.4396, "Bahnhofplatz, 3011 Bern, Switzerland", "Bahnhofplatz", "3011 Bern, Switzerland", true),
                AddressSearchResult(69.5779, 20.2198, "Bahnhof, Lyngen, Norway", "Bahnhof", "Lyngen, Norway", false),
            )
            "Nowhere" -> emptyList()
            "Slow" -> awaitCancellation()
            else -> throw IOException("The test's server is down")
        }
}

private val bahnhofstrasse = MapDestination(
    title = "Bahnhofstrasse",
    subtitle = "8001 Zürich, Switzerland",
    point = GeoPoint(47.3769, 8.5397),
    kind = MapDestination.Kind.Address,
    isCovered = true,
)

private val lyngen = MapDestination(
    title = "Lyngen",
    subtitle = "Troms, Norway",
    point = GeoPoint(69.5779, 20.2198),
    kind = MapDestination.Kind.Address,
    isCovered = false,
)

private val recentPlaces = listOf(bahnhofstrasse, lyngen)

private val cities = listOf(
    city("zurich", "Zürich", 47.3769, 8.5417),
    city("winterthur", "Winterthur", 47.4988, 8.7237),
    city("baden", "Baden", 47.4733, 8.3059),
    city("zug", "Zug", 47.1662, 8.5155),
    city("lucerne", "Lucerne", 47.0502, 8.3093),
)

private fun city(id: String, name: String, latitude: Double, longitude: Double) = ScooterCity(
    id = id,
    name = name,
    countryCode = "CH",
    center = GeoPoint(latitude, longitude),
    bounds = GeoBounds(latitude - 0.05, longitude - 0.05, latitude + 0.05, longitude + 0.05),
)
