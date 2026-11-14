package com.plhery.scootradar.ui

import android.graphics.Rect
import android.view.View
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.semantics
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.plhery.scootradar.core.model.ScooterProviderEntry
import com.plhery.scootradar.core.model.ScooterRangeFilter
import com.plhery.scootradar.ui.dock.ProviderList
import com.plhery.scootradar.ui.filters.FilterSheetContent
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.EmptyScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.api.AddressSearchAPIClient
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.api.AddressSearchResult
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterSearchBarState
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.chrome.MapStatusBanner
import com.plhery.scootradar.ui.chrome.STATUS_BANNER_TAG
import com.plhery.scootradar.ui.search.LocalAddressSearch
import com.plhery.scootradar.ui.search.SEARCH_BAR_TAG
import com.plhery.scootradar.ui.search.ScooterSearchIsland
import com.plhery.scootradar.ui.settings.ScooterSettingsSheet
import com.plhery.scootradar.ui.settings.SettingsPage
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.scootColors
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

/**
 * The forget ✕ of the recent place, Settings' Done and the paused map's banner take touches 48 dp by 48 at least, as
 * Android's guidelines and Accessibility Scanner ask (Desk [372]), though the ✕ and Done are drawn 44 dp, the iPhone's
 * 44 points, and the banner 44 inside its margins: Compose widens a clickable smaller than its ViewConfiguration's
 * minimum touch target, 48 dp, to it, for touches and on the node TalkBack and Accessibility Scanner are given, which
 * these measure. A theme with a smaller minimum, or a parent that clips, would make them smaller.
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w390dp-h844dp-xhdpi")
class TouchTargetsTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private lateinit var view: View

    @Before
    fun setUp() {
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        ScooterLanguage.current = ScooterLanguage.atLaunch
    }

    @Test
    fun theRecentPlacesForgetButtonIs48dp() {
        compose.setContent {
            view = LocalView.current
            ScootTheme(dark = false, reduceMotion = true) {
                CompositionLocalProvider(LocalAddressSearch provides NoPlaces) {
                    Box(Modifier.fillMaxSize()) {
                        ScooterSearchIsland(
                            state = ScooterSearchBarState.Empty,
                            isSearching = true,
                            onSearchingChange = {},
                            hasActiveFilters = false,
                            onSelect = {},
                            onChooseRecentPlace = {},
                            onForgetRecentPlace = {},
                            onClear = {},
                            onUseCurrentLocation = {},
                            onShowFilters = {},
                            onShowSettings = {},
                            modifier = Modifier.align(Alignment.TopCenter).padding(top = 8.dp, start = 12.dp, end = 12.dp),
                            recentPlace = MapDestination("Bahnhofplatz", "3011 Bern, Switzerland", GeoPoint(46.9481, 7.4396), MapDestination.Kind.Address, true),
                            nearbyCities = emptyList(),
                        )
                    }
                }
            }
        }
        compose.waitForIdle()
        assertAtLeast48dp("the forget ✕", compose.onNodeWithContentDescription("Forget this place").fetchSemanticsNode().id)
    }

    @Test
    fun settingsDoneIs48dp() {
        val controllers = TestControllers()
        try {
            val model = controllers.make(EmptyScooterAPI, TestClock())
            compose.setContent {
                view = LocalView.current
                ScootTheme(dark = false, reduceMotion = true) {
                    ScooterSettingsSheet(
                        controller = model,
                        bottomInset = 0.dp,
                        defaults = null,
                        onDone = {},
                        passProviders = listOf(ScooterProvider.Lime),
                        sources = emptyList(),
                        pages = listOf(SettingsPage.Root),
                    )
                }
            }
            compose.waitForIdle()
            assertAtLeast48dp("Done", compose.onNodeWithContentDescription("Done").fetchSemanticsNode().id)
        } finally {
            controllers.close()
        }
    }

    @Test
    fun thePausedBannerIs48dpHigh() {
        compose.setContent {
            view = LocalView.current
            ScootTheme(dark = false, reduceMotion = true) {
                Box(Modifier.fillMaxSize().padding(horizontal = 12.dp)) {
                    MapStatusBanner(
                        message = localized("Paused to save data · tap to refresh"),
                        modifier = Modifier.semantics { onClick { true } },
                        symbol = Symbols.refresh,
                        tint = scootColors.secondaryText,
                    )
                }
            }
        }
        compose.waitForIdle()
        assertAtLeast48dp("the paused banner", compose.onNodeWithTag(STATUS_BANNER_TAG).fetchSemanticsNode().id)
    }

    /**
     * The search bar's buttons each have the 48 Compose widens them to of their own, beside each other and beside the
     * bar's label, which TalkBack and Accessibility Scanner are given: 44 wide 2 apart, the one drawn first lost 2 of
     * it to the next, and Filters, and Clear place, were 46 wide on Phone_Min (ctl-2245's TalkBack pass).
     */
    @Test
    fun theSearchBarsButtonsHave48dpEachOfTheirOwn() {
        var state by mutableStateOf<ScooterSearchBarState>(ScooterSearchBarState.Empty)
        compose.setContent {
            view = LocalView.current
            ScootTheme(dark = false, reduceMotion = true) {
                CompositionLocalProvider(LocalAddressSearch provides NoPlaces) {
                    Box(Modifier.fillMaxSize()) {
                        ScooterSearchIsland(
                            state = state,
                            isSearching = false,
                            onSearchingChange = {},
                            hasActiveFilters = false,
                            onSelect = {},
                            onChooseRecentPlace = {},
                            onForgetRecentPlace = {},
                            onClear = {},
                            onUseCurrentLocation = {},
                            onShowFilters = {},
                            onShowSettings = {},
                            modifier = Modifier.align(Alignment.TopCenter).padding(top = 8.dp, start = 12.dp, end = 12.dp),
                            recentPlace = null,
                            nearbyCities = emptyList(),
                        )
                    }
                }
            }
        }
        val bern = MapDestination("Bahnhofplatz", "3011 Bern, Switzerland", GeoPoint(46.9481, 7.4396), MapDestination.Kind.Address, true)
        for ((place, buttons) in listOf(
            ScooterSearchBarState.Empty to listOf("Filters", "Settings"),
            ScooterSearchBarState.Place(bern) to listOf("Clear place", "Filters", "Settings"),
        )) {
            compose.runOnIdle { state = place }
            compose.waitForIdle()
            val label = compose.onNodeWithTag(SEARCH_BAR_TAG).fetchSemanticsNode()
            val targets = listOf(label.boundsInRoot) + buttons.map { name ->
                touchTarget(compose.onNodeWithContentDescription(name).fetchSemanticsNode().boundsInRoot)
            }
            val density = view.resources.displayMetrics.density
            for ((name, target) in (listOf("the label") + buttons).zip(targets)) {
                assertTrue("$place: $name is ${target.width / density} by ${target.height / density} dp", target.width >= 48 * density - 0.5f && target.height >= 48 * density - 0.5f)
            }
            val overlaps = targets.zipWithNext { a, b -> (a.right - b.left) / density }
            assertTrue("$place: the targets overlap by $overlaps dp", overlaps.all { it <= 0.01f })
        }
    }

    /**
     * The range slider is 48 high, its thumb and track in the middle of its card, as TalkBack and Accessibility
     * Scanner are given it: Material's slider is as high as its thumb, 24 (ctl-2245's TalkBack pass).
     */
    @Test
    fun theRangeSliderIs48dpHigh() {
        compose.setContent {
            view = LocalView.current
            ScootTheme(dark = false, reduceMotion = true) {
                FilterSheetContent(
                    entries = listOf(ScooterProviderEntry(ScooterProvider.Lime, count = 12, isEnabled = true, isSelected = false, isDown = false)),
                    hasActiveFilters = false,
                    showResults = "Show 12 scooters",
                    bottomInset = 0.dp,
                    onToggle = {},
                    onReset = {},
                    onDone = {},
                    minimumRange = 0,
                    rangeUnit = ScooterRangeFilter.Unit.Kilometres,
                    rangeHelp = null,
                    onChooseRange = {},
                )
            }
        }
        compose.waitForIdle()
        val slider = compose.onNodeWithContentDescription("Range").fetchSemanticsNode()
        assertTrue(SemanticsActions.SetProgress in slider.config)
        assertAtLeast48dp("the range slider", slider.id, clickable = false)
    }

    /**
     * The rows of the panel's list of providers are 48 high, one under the other, where the iPhone's are 44: Compose
     * can't widen them to 48 without one taking from the next, and the list's first and last were given TalkBack 46
     * high (ctl-2245's TalkBack pass).
     */
    @Test
    fun theProviderListsRowsAre48dpHigh() {
        val controllers = TestControllers()
        try {
            val model = controllers.make(EmptyScooterAPI, TestClock())
            val entries = listOf(ScooterProvider.Lime, ScooterProvider.Bolt, ScooterProvider.Voi).mapIndexed { index, provider ->
                ScooterProviderEntry(provider, count = index + 3, isEnabled = true, isSelected = false, isDown = false)
            }
            compose.setContent {
                view = LocalView.current
                ScootTheme(dark = false, reduceMotion = true) { ProviderList(model, entries) }
            }
            compose.waitForIdle()
            val rows = compose.onAllNodes(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Button)).fetchSemanticsNodes()
            assertEquals(4, rows.size)
            val density = view.resources.displayMetrics.density
            for (row in rows) {
                val name = row.config[SemanticsProperties.ContentDescription].first()
                assertTrue("$name is ${row.size.height / density} dp high", row.size.height >= 48 * density - 0.5f)
                assertAtLeast48dp(name, row.id)
            }
        } finally {
            controllers.close()
        }
    }

    /** A node's bounds widened to 48 dp where they are smaller, about their middle, as Compose widens touches. */
    private fun touchTarget(bounds: androidx.compose.ui.geometry.Rect): androidx.compose.ui.geometry.Rect {
        val minimum = 48 * view.resources.displayMetrics.density
        val dx = ((minimum - bounds.width) / 2).coerceAtLeast(0f)
        val dy = ((minimum - bounds.height) / 2).coerceAtLeast(0f)
        return androidx.compose.ui.geometry.Rect(bounds.left - dx, bounds.top - dy, bounds.right + dx, bounds.bottom + dy)
    }

    private fun assertAtLeast48dp(name: String, id: Int, clickable: Boolean = true) {
        val info = view.accessibilityNodeProvider.createAccessibilityNodeInfo(id)!!
        val bounds = Rect().also(info::getBoundsInScreen)
        val density = view.resources.displayMetrics.density
        val width = bounds.width() / density
        val height = bounds.height() / density
        println("$name: $width x $height dp, clickable ${info.isClickable}")
        if (clickable) assertTrue("$name is clickable", info.isClickable)
        assertTrue("$name is $width by $height dp", width >= 48f && height >= 48f)
    }
}

private object NoPlaces : AddressSearchAPIClient {
    override suspend fun search(query: String, language: String, near: GeoPoint?): List<AddressSearchResult> = emptyList()
}
