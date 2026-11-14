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
import com.plhery.scootradar.ui.search.ScooterSearchIsland
import com.plhery.scootradar.ui.settings.ScooterSettingsSheet
import com.plhery.scootradar.ui.settings.SettingsPage
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.scootColors
import org.junit.After
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

    private fun assertAtLeast48dp(name: String, id: Int) {
        val info = view.accessibilityNodeProvider.createAccessibilityNodeInfo(id)!!
        val bounds = Rect().also(info::getBoundsInScreen)
        val density = view.resources.displayMetrics.density
        val width = bounds.width() / density
        val height = bounds.height() / density
        println("$name: $width x $height dp, clickable ${info.isClickable}")
        assertTrue("$name is clickable", info.isClickable)
        assertTrue("$name is $width by $height dp", width >= 48f && height >= 48f)
    }
}

private object NoPlaces : AddressSearchAPIClient {
    override suspend fun search(query: String, language: String, near: GeoPoint?): List<AddressSearchResult> = emptyList()
}
