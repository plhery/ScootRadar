package com.plhery.scootradar.ui

import android.content.Context
import android.provider.Settings
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshots.Snapshot
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.FakeLocationManager
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.dock
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterSearchBarState
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.chrome.FloatingMapControls
import com.plhery.scootradar.ui.dock.DockState
import com.plhery.scootradar.ui.dock.RollingCount
import com.plhery.scootradar.ui.dock.ScooterControlDock
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import com.plhery.scootradar.ui.search.ScooterSearchIsland
import com.plhery.scootradar.ui.settings.ScooterSettingsSheet
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.putFramesOnSurfaces
import com.plhery.scootradar.zurichRegion
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.time.Instant
import java.util.Locale

// UI-184: under Reduce Motion the iPhone's animations are nil, and SwiftUI lays the new content out at once.

/**
 * Under Reduce Motion each place whose content changes draws the new content from the frame it changes: from the
 * first frame on, its pixels are the settled new content's, where AnimatedContent with no transition drew the old one
 * a frame longer (review-app-w finding 3). Without it, each still animates, as its screenshots show.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "w400dp-h800dp-xhdpi")
class ReduceMotionAtOnceTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val resolver = ApplicationProvider.getApplicationContext<Context>().contentResolver
    private val animatorScale = Settings.Global.getFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f)

    /** How far down the place its pixels are compared from, as a share of its height. */
    private var from = 0f

    @Before
    fun setUp() {
        Locale.setDefault(Locale.forLanguageTag("en-CH"))
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
        Settings.Global.putFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, animatorScale)
    }

    // The search island: the open panel closes to the bar (ScooterSearchIsland's island).

    @Test
    fun underReduceMotionTheSearchClosesToTheBarAtOnce() = searchCloses(reduceMotion = true)

    @Test
    fun withoutReduceMotionTheSearchFadesToTheBar() = searchCloses(reduceMotion = false)

    private fun searchCloses(reduceMotion: Boolean) {
        var searching by mutableStateOf(true)
        show(reduceMotion) { Place { Island(isSearching = searching, hasActiveFilters = false) } }
        assertTheChange("the search island", reduceMotion) { searching = false }
    }

    // The bar's Filters symbol, as filters come to be on (CollapsedBar's filtersIcon).

    @Test
    fun underReduceMotionTheFiltersSymbolIsTheActiveOneAtOnce() = filtersTurnOn(reduceMotion = true)

    @Test
    fun withoutReduceMotionTheFiltersSymbolGivesWayToTheActiveOne() = filtersTurnOn(reduceMotion = false)

    private fun filtersTurnOn(reduceMotion: Boolean) {
        var active by mutableStateOf(false)
        show(reduceMotion) { Place { Island(isSearching = false, hasActiveFilters = active) } }
        assertTheChange("the Filters symbol", reduceMotion) { active = true }
    }

    // The locate button, a labelled pill until the first fix and round after it (FloatingMapControls).

    @Test
    fun underReduceMotionTheLocateButtonIsRoundAtOnceOnTheFirstFix() = firstFix(reduceMotion = true)

    @Test
    fun withoutReduceMotionTheLocateButtonFadesToRoundOnTheFirstFix() = firstFix(reduceMotion = false)

    private fun firstFix(reduceMotion: Boolean) {
        val model = controllers.make(StubScooterAPI(ScooterResponse(vehicles = emptyList())), locationManager = FakeLocationManager())
        show(reduceMotion) {
            Place(Alignment.BottomEnd) { FloatingMapControls(model, Modifier.padding(16.dp)) }
        }
        assertTheChange("the locate button", reduceMotion) {
            model.locationsUpdated(listOf(ScooterLocationFix(GeoPoint(47.3769, 8.5417), horizontalAccuracy = 5.0, timestamp = Instant.now())))
            assertTrue(controllers.waitUntil { model.hasLocatedOnce.value })
        }
    }

    // The dock, from the summary to a scooter's card (DockCards).

    @Test
    fun underReduceMotionTheDockIsTheScootersCardAtOnce() = cardOpens(reduceMotion = true)

    @Test
    fun withoutReduceMotionTheDockFadesToTheScootersCard() = cardOpens(reduceMotion = false)

    private fun cardOpens(reduceMotion: Boolean) {
        val model = loaded()
        show(reduceMotion) { Place { ScooterControlDock(model) } }
        assertTheChange("the dock", reduceMotion) {
            model.selectScooter("lime:s1")
            assertTrue(controllers.waitUntil { model.dock is ScooterDockContent.Scooter })
        }
    }

    // A large window's panel, folding to its line (ScooterControlDock's fold).

    @Test
    fun underReduceMotionThePanelFoldsToItsLineAtOnce() = panelFolds(reduceMotion = true)

    @Test
    fun withoutReduceMotionThePanelFadesToItsLine() = panelFolds(reduceMotion = false)

    private fun panelFolds(reduceMotion: Boolean) {
        val model = loaded()
        show(reduceMotion) { Place { ScooterControlDock(model, layout = ScooterChromeLayout.Panel) } }
        assertTheChange("the panel", reduceMotion) { model.setPanelCollapsed(true) }
    }

    // A provider's count on its chip, which rolls only where the dock lets it (RollingCount).

    @Test
    fun aCountThatDoesNotRollIsTheNewOneAtOnce() = countChanges(rolls = false)

    @Test
    fun aCountThatRollsRollsToTheNewOne() = countChanges(rolls = true)

    /**
     * As the dock passes it, true only in the composition where the chips' order changes (ProviderChips' `rolls`): the
     * count rolls from that composition on, not drawn afresh at the new number (review-app-aa-ab finding 1).
     */
    @Test
    fun aCountRollsWhenOnlyTheCompositionOfTheChangeSaysSo() {
        var count by mutableStateOf(12)
        show(reduceMotion = false) {
            val last = remember { intArrayOf(count) }
            val rolls = count != last[0]
            SideEffect { last[0] = count }
            Place(Alignment.Center) { RollingCount(count, rolls, TextStyle(fontSize = 17.sp), Color.Black) }
        }
        assertTheChange("the count", reduceMotion = false) { count = 88 }
    }

    private fun countChanges(rolls: Boolean) {
        var count by mutableStateOf(12)
        show(reduceMotion = !rolls) {
            Place(Alignment.Center) { RollingCount(count, rolls, TextStyle(fontSize = 17.sp), Color.Black) }
        }
        assertTheChange("the count", reduceMotion = !rolls) { count = 88 }
    }

    // Settings' title and page, as Language is pushed and popped (ScooterSettingsSheet's two transitions).

    @Test
    fun underReduceMotionASettingsPageComesAndGoesAtOnce() = languagePage(reduceMotion = true)

    @Test
    fun withoutReduceMotionASettingsPageSlidesInAndOut() = languagePage(reduceMotion = false)

    private fun languagePage(reduceMotion: Boolean) {
        val model = controllers.make(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        show(reduceMotion) {
            Place {
                ScooterSettingsSheet(
                    controller = model,
                    bottomInset = 0.dp,
                    defaults = null,
                    onDone = {},
                    passProviders = listOf(ScooterProvider.Lime),
                    sources = emptyList(),
                )
            }
        }
        assertTheChange("Settings, Language pushed", reduceMotion) {
            compose.onAllNodes(hasText("English") and hasClickAction()).onFirst().performSemanticsAction(SemanticsActions.OnClick)
        }
        assertTheChange("Settings, Language popped", reduceMotion) {
            compose.onAllNodes(hasContentDescription("Back") and hasClickAction()).onFirst().performSemanticsAction(SemanticsActions.OnClick)
        }
    }

    // The screen as the search opens and closes: a phone's locate button and dock, or a large window's panel, make way
    // for it and come back (ScooterMapScreen's locateGone, dockGone and the panel's gone).

    @Test
    fun underReduceMotionTheDockMakesWayForTheSearchAtOnce() = searchOverTheScreen(reduceMotion = true)

    @Test
    fun withoutReduceMotionTheDockFadesForTheSearch() = searchOverTheScreen(reduceMotion = false)

    @Test
    @Config(qualifiers = "w1280dp-h800dp-xhdpi")
    fun underReduceMotionThePanelMakesWayForTheSearchAtOnce() = searchOverTheScreen(reduceMotion = true)

    @Test
    @Config(qualifiers = "w1280dp-h800dp-xhdpi")
    fun withoutReduceMotionThePanelFadesForTheSearch() = searchOverTheScreen(reduceMotion = false)

    /**
     * The whole screen on the providers' list, under Remove animations (which it reads as Reduce Motion) or not, as
     * the search bar is tapped and the search cancelled. Its lower half is compared, under the open search, whose
     * field's cursor blinks.
     */
    private fun searchOverTheScreen(reduceMotion: Boolean) {
        Settings.Global.putFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, if (reduceMotion) 0f else 1f)
        val clock = TestClock()
        val model = DockState.Summary.make(controllers, clock)
        compose.mainClock.autoAdvance = false
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                Box(Modifier.fillMaxSize().testTag(PLACE)) {
                    ScooterMapScreen(controller = model, map = {}, glassBlurs = false)
                }
            }
        }
        compose.mainClock.advanceTimeByFrame()
        from = 0.5f
        assertTheChange("the screen, the search opened", reduceMotion) {
            compose.onAllNodes(hasClickAction() and hasAnyAncestor(hasTestTag(SEARCH_ISLAND_TAG))).onFirst()
                .performSemanticsAction(SemanticsActions.OnClick)
        }
        assertTheChange("the screen, the search cancelled", reduceMotion) {
            compose.onAllNodes((hasText("Cancel") or hasContentDescription("Cancel")) and hasClickAction()).onFirst()
                .performSemanticsAction(SemanticsActions.OnClick)
        }
    }

    /** The search island at the top of the place, as the screen has it, with nothing found or kept. */
    @Composable
    private fun Island(isSearching: Boolean, hasActiveFilters: Boolean) {
        ScooterSearchIsland(
            state = ScooterSearchBarState.Empty,
            isSearching = isSearching,
            onSearchingChange = {},
            hasActiveFilters = hasActiveFilters,
            onSelect = {},
            onClear = {},
            onUseCurrentLocation = {},
            onShowFilters = {},
            onShowSettings = {},
            modifier = Modifier.padding(12.dp),
        )
    }

    /** A controller with Zürich's scooter s1 loaded, the dock on its summary. */
    private fun loaded(): ScooterMapController {
        val model = controllers.make(StubScooterAPI(ScooterResponse(vehicles = listOf(scooter("s1", "lime"), scooter("s2", "bolt")))))
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { model.lastUpdated.value != null && !model.isLoading.value })
        return model
    }

    /** What is shown, in a place of the window's whole width whose pixels the test reads, its first frame drawn. */
    private fun show(reduceMotion: Boolean, content: @Composable () -> Unit) {
        compose.mainClock.autoAdvance = false
        compose.setContent { ScootTheme(dark = false, reduceMotion = reduceMotion) { content() } }
        compose.mainClock.advanceTimeByFrame()
    }

    @Composable
    private fun Place(alignment: Alignment = Alignment.TopCenter, content: @Composable () -> Unit) {
        Box(Modifier.fillMaxWidth().height(640.dp).testTag(PLACE), contentAlignment = alignment) { content() }
    }

    /**
     * The place's pixels as [change] is made: the old content's and the new one's differ, and under [reduceMotion] each
     * frame from the first is the settled new one's. Without it the change takes some frames, unlike the settled one.
     */
    private fun assertTheChange(what: String, reduceMotion: Boolean, change: () -> Unit) {
        val before = settled()
        change()
        // Recomposition sees the change in the next frame, as the app's own changes are seen.
        Snapshot.sendApplyNotifications()
        val frames = List(FRAMES) { frame() }
        val after = settled()
        assertTrue("$what changes: ${unlike(before, after)} pixels", unlike(before, after) > 20)
        val unlikeAfter = frames.map { unlike(it, after) }
        if (reduceMotion) {
            unlikeAfter.forEachIndexed { index, pixels ->
                assertEquals("$what: pixels unlike the new content's on frame ${index + 1} of $unlikeAfter", 0, pixels)
            }
        } else {
            assertTrue("$what: frames unlike the new content, by pixel counts $unlikeAfter", unlikeAfter.first() > 20)
        }
    }

    private fun frame(): PixelMap {
        compose.mainClock.advanceTimeByFrame()
        return pixels()
    }

    /** The place's pixels two seconds on, its animations over. */
    private fun settled(): PixelMap {
        compose.mainClock.advanceTimeBy(2_000)
        return pixels()
    }

    private fun pixels(): PixelMap {
        compose.putFramesOnSurfaces()
        return compose.onNodeWithTag(PLACE).captureToImage().toPixelMap()
    }

    /** How many pixels differ between [a] and [b], of the same place, [from] down. */
    private fun unlike(a: PixelMap, b: PixelMap): Int {
        assertEquals("the place's size", a.width to a.height, b.width to b.height)
        val top = (a.height * from).toInt()
        return (0 until a.width).sumOf { x -> (top until a.height).count { y -> a[x, y] != b[x, y] } }
    }

    private companion object {
        const val PLACE = "place"
        const val FRAMES = 12
    }
}
