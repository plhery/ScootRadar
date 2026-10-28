package com.plhery.scootradar.ui.search

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertIsFocused
import androidx.compose.ui.test.assertIsNotFocused
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performKeyInput
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.pressKey
import androidx.compose.ui.test.requestFocus
import androidx.compose.ui.test.withKeyDown
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.api.AddressSearchAPIClient
import com.plhery.scootradar.core.api.AddressSearchResult
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterSearchBarState
import com.plhery.scootradar.ui.theme.ScootTheme
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import java.util.Locale

/** What the open search does with Return and a hardware keyboard's Tab, and what TalkBack hears of its results. */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w390dp-h844dp-xhdpi")
class SearchPanelTest {
    @get:Rule
    val compose = createComposeRule()

    private val locale = Locale.getDefault()
    private val searching = mutableListOf<Boolean>()
    private val chosen = mutableListOf<MapDestination>()

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

    private fun show(query: String) {
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                CompositionLocalProvider(LocalAddressSearch provides Places) {
                    Box(Modifier.fillMaxSize()) {
                        ScooterSearchIsland(
                            state = ScooterSearchBarState.Empty,
                            isSearching = true,
                            onSearchingChange = { searching += it },
                            hasActiveFilters = false,
                            onSelect = { chosen += it },
                            onClear = {},
                            onUseCurrentLocation = {},
                            onShowFilters = {},
                            onShowSettings = {},
                            modifier = Modifier.align(Alignment.TopCenter).padding(top = 8.dp, start = 12.dp, end = 12.dp),
                            recentPlaces = emptyList(),
                            nearbyCities = emptyList(),
                        )
                    }
                }
            }
        }
        compose.waitForIdle()
        if (query.isNotEmpty()) compose.onNodeWithTag(SEARCH_FIELD_TAG).performTextInput(query)
        // Past the pause before a search, on the test's clock.
        compose.mainClock.advanceTimeBy(1_000)
        compose.waitForIdle()
    }

    @Test
    fun onlyTheFirstResultIsSelectedForTalkBack() {
        show("Bahnhof")
        val selected = compose.onAllNodes(SemanticsMatcher.keyIsDefined(SemanticsProperties.Selected)).fetchSemanticsNodes()
        assertEquals(1, selected.size)
        assertEquals(true, selected.single().config[SemanticsProperties.Selected])
        assertTrue(hasText("Bahnhofstrasse", substring = true).matches(selected.single()))
    }

    @Test
    fun returnWithAResultChoosesIt() {
        show("Bahnhof")
        compose.onNodeWithTag(SEARCH_FIELD_TAG).performImeAction()
        compose.waitForIdle()
        assertEquals(listOf("Bahnhofstrasse"), chosen.map { it.title })
    }

    /** Where the keyboard goes is SearchAndLanguageTest's, on a phone: Robolectric's window is never in touch mode. */
    @Test
    fun returnWithNoResultLeavesTheSearchOpen() {
        show("Nowhere")
        compose.onNodeWithText("No places found.", substring = true).assertExists()
        compose.onNodeWithTag(SEARCH_FIELD_TAG).performImeAction()
        compose.waitForIdle()
        compose.onNodeWithText("Cancel").assertExists()
        compose.onNodeWithText("No places found.", substring = true).assertExists()
        assertTrue(chosen.isEmpty())
        assertTrue(false !in searching)
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun shiftTabGoesBackFromTheField() {
        show("")
        val field = compose.onNodeWithTag(SEARCH_FIELD_TAG)
        field.assertIsFocused()
        field.performKeyInput { withKeyDown(Key.ShiftLeft) { pressKey(Key.Tab) } }
        compose.waitForIdle()
        field.assertIsNotFocused()
        compose.onNodeWithText("Cancel").assertIsNotFocused()

        compose.onNodeWithTag(SEARCH_FIELD_TAG).requestFocus()
        compose.onNodeWithTag(SEARCH_FIELD_TAG).performKeyInput { pressKey(Key.Tab) }
        compose.waitForIdle()
        compose.onNodeWithText("Cancel").assertIsFocused()
    }
}

/** Places for "Bahnhof", none for "Nowhere". */
private object Places : AddressSearchAPIClient {
    override suspend fun search(query: String, language: String, near: GeoPoint?): List<AddressSearchResult> =
        when (query) {
            "Bahnhof" -> listOf(
                AddressSearchResult(47.3769, 8.5397, "Bahnhofstrasse, 8001 Zürich, Switzerland", "Bahnhofstrasse", "8001 Zürich, Switzerland", true),
                AddressSearchResult(46.9481, 7.4396, "Bahnhofplatz, 3011 Bern, Switzerland", "Bahnhofplatz", "3011 Bern, Switzerland", true),
                AddressSearchResult(69.5779, 20.2198, "Bahnhof, Lyngen, Norway", "Bahnhof", "Lyngen, Norway", false),
            )
            else -> emptyList()
        }
}
