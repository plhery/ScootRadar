package com.plhery.scootradar.ui

import android.content.Context
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableIntStateOf
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
import androidx.compose.ui.test.onAllNodesWithTag
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
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.dock
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLoadIssue
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterSearchBarState
import com.plhery.scootradar.core.model.ScooterWalkNote
import com.plhery.scootradar.map.MapCompass
import com.plhery.scootradar.map.MapScaleBar
import com.plhery.scootradar.map.SCALE_TAG
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.chrome.FloatingMapControls
import com.plhery.scootradar.ui.dock.DockState
import com.plhery.scootradar.ui.dock.RollingCount
import com.plhery.scootradar.ui.dock.ScooterControlDock
import com.plhery.scootradar.ui.dock.WalkNote
import com.plhery.scootradar.ui.glass.pressedGlass
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import com.plhery.scootradar.ui.search.ScooterSearchIsland
import com.plhery.scootradar.ui.settings.ScooterSettingsSheet
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.putFramesOnSurfaces
import com.plhery.scootradar.zurichRegion
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
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

    /** The rows of the place whose pixels are compared, from and to, as shares of its height: where the change is. */
    private var from = 0f
    private var to = 1f

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
        val clock = TestClock()
        showTheScreen(DockState.Summary.make(controllers, clock), clock, reduceMotion)
        from = 0.5f
        assertTheChange("the screen, the search opened", reduceMotion) { openTheSearch() }
        assertTheChange("the screen, the search cancelled", reduceMotion) { cancelTheSearch() }
    }

    // The notices under the search bar: the location card and the banner of a first load that failed, each coming
    // alone, joining the other, leaving it and going last (TopNotices and NoticeStack), and both going as the search
    // opens and coming back as it closes (ScooterMapScreen's notices).

    @Test
    fun underReduceMotionTheNoticesComeAndGoAtOnce() = noticesComeAndGo(reduceMotion = true)

    @Test
    fun withoutReduceMotionTheNoticesFadeAndSlide() = noticesComeAndGo(reduceMotion = false)

    /**
     * The whole screen, its location denied and its first load failing, compared from the collapsed bar's foot to its
     * middle, where the notices are: not the open search's field, whose cursor blinks, nor the dock.
     */
    private fun noticesComeAndGo(reduceMotion: Boolean) {
        val clock = TestClock()
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter("s1", "lime"))))
        api.setFailure(ScooterAPIError.Offline())
        val model = controllers.make(api, clock, locationManager = FakeLocationManager(ScooterAuthorizationStatus.Denied))
        showTheScreen(model, clock, reduceMotion)
        val bar = compose.onNodeWithTag(SEARCH_ISLAND_TAG).fetchSemanticsNode().boundsInRoot
        from = bar.bottom / compose.onNodeWithTag(PLACE).fetchSemanticsNode().size.height
        to = 0.5f
        val failedOnce = { model.loadIssue.value is ScooterLoadIssue.FirstLoadFailed && !model.isLoading.value }
        // Near me with the location denied: the card, then again after it was dismissed.
        assertTheChange("the card coming alone", reduceMotion, frames = 6) { model.focusOnUser() }
        assertTheChange("the banner joining the card", reduceMotion, frames = 6) {
            model.updateViewport(zurichRegion, zoom = 16)
            assertTrue(controllers.waitUntil(condition = failedOnce))
        }
        assertTheChange("the card leaving the banner", reduceMotion, frames = 6) { model.dismissLocationIssue() }
        assertTheChange("the card joining the banner", reduceMotion, frames = 6) { model.focusOnUser() }
        assertTheChange("the banner leaving the card", reduceMotion, frames = 6) {
            api.setFailure(null)
            model.retryLoad()
            assertTrue(controllers.waitUntil { model.loadIssue.value == null && !model.isLoading.value })
        }
        assertTheChange("the card going last", reduceMotion, frames = 6) { model.dismissLocationIssue() }
        model.focusOnUser()
        assertTheChange("the notices, the search opened", reduceMotion, frames = 6) { openTheSearch() }
        assertTheChange("the notices, the search cancelled", reduceMotion, frames = 6) { cancelTheSearch() }
    }

    /**
     * The whole screen of [model], under Remove animations (which it reads as Reduce Motion) or not, its first frame
     * drawn.
     */
    private fun showTheScreen(model: ScooterMapController, clock: TestClock, reduceMotion: Boolean) {
        Settings.Global.putFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, if (reduceMotion) 0f else 1f)
        compose.mainClock.autoAdvance = false
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                Box(Modifier.fillMaxSize().testTag(PLACE)) {
                    ScooterMapScreen(controller = model, map = {}, glassBlurs = false)
                }
            }
        }
        compose.mainClock.advanceTimeByFrame()
    }

    private fun openTheSearch() {
        compose.onAllNodes(hasClickAction() and hasAnyAncestor(hasTestTag(SEARCH_ISLAND_TAG))).onFirst()
            .performSemanticsAction(SemanticsActions.OnClick)
    }

    private fun cancelTheSearch() {
        compose.onAllNodes((hasText("Cancel") or hasContentDescription("Cancel")) and hasClickAction()).onFirst()
            .performSemanticsAction(SemanticsActions.OnClick)
    }

    // A walk's note on the scooter's card, as the way can't be found and as the walk goes (WalkNote).

    @Test
    fun underReduceMotionTheWalkNoteComesAndGoesAtOnce() = walkNote(reduceMotion = true)

    @Test
    fun withoutReduceMotionTheWalkNoteFadesInAndOut() = walkNote(reduceMotion = false)

    private fun walkNote(reduceMotion: Boolean) {
        var note by mutableStateOf<ScooterWalkNote?>(null)
        show(reduceMotion) { Place { WalkNote(note, Modifier.padding(16.dp)) } }
        to = 0.1f
        assertTheChange("the walk note coming", reduceMotion) { note = ScooterWalkNote.NoRoute }
        assertTheChange("the walk note going", reduceMotion) { note = null }
    }

    // The map's compass, as the map is turned from north and back (MapCompass).

    @Test
    fun underReduceMotionTheCompassComesAndGoesAtOnce() = compassShows(reduceMotion = true)

    @Test
    fun withoutReduceMotionTheCompassFadesInAndOut() = compassShows(reduceMotion = false)

    private fun compassShows(reduceMotion: Boolean) {
        var bearing by mutableDoubleStateOf(0.0)
        show(reduceMotion) { Place { MapCompass({ bearing }, showsMapCompass = true, dark = false, onTap = {}) } }
        to = 0.1f
        assertTheChange("the compass, the map turned", reduceMotion) { bearing = 45.0 }
        assertTheChange("the compass, the map turned north", reduceMotion) { bearing = 0.0 }
    }

    // A glass control's light, as it is pressed and let go (pressedGlass).

    @Test
    fun underReduceMotionAGlassControlLightsUpAtOnce() = glassPressed(reduceMotion = true)

    @Test
    fun withoutReduceMotionAGlassControlLightsUpOnItsSpring() = glassPressed(reduceMotion = false)

    private fun glassPressed(reduceMotion: Boolean) {
        var pressed by mutableStateOf(false)
        show(reduceMotion) {
            Place(Alignment.Center) {
                Box(Modifier.size(120.dp, 48.dp).pressedGlass(pressed, CircleShape, Modifier.background(Color(0xFF3A6EA5), CircleShape)))
            }
        }
        from = 0.4f
        to = 0.6f
        assertTheChange("the glass pressed", reduceMotion) { pressed = true }
        assertTheChange("the glass let go", reduceMotion) { pressed = false }
    }

    // The map's scale, which shows as the zoom changes and goes a second after it last did (MapScaleBar).

    /**
     * Under Reduce Motion, in every frame the scale is there it is drawn whole, and it is gone in the frame its second
     * is over: frame by frame from a zoom, the scale is there as it is in the middle of its second, or nothing is, in
     * the 63 frames of 16 ms its second spans and not one more.
     */
    @Test
    fun underReduceMotionTheScaleIsWholeAsItComesAndGoesAtOnce() {
        val shown = scaleFrames(reduceMotion = true)
        assertTrue("the scale's frames, gone (0), whole (1), else (2): $shown", shown.all { it != 2 })
        assertEquals("the frames it shows in, $shown", ((SCALE_HOLD_MILLIS + FRAME_MILLIS - 1) / FRAME_MILLIS).toInt(), shown.count { it == 1 })
    }

    @Test
    fun withoutReduceMotionTheScaleFadesInAndOut() {
        val shown = scaleFrames(reduceMotion = false)
        assertTrue("the scale's frames, gone (0), whole (1), else (2): $shown", shown.take(5).any { it == 2 } && shown.drop(50).any { it == 2 })
    }

    /**
     * The scale's frames from a zoom on, for its second and a half: 0 where it isn't there and nothing is drawn, 1
     * where it is there and drawn whole, as in the middle of an earlier zoom's second, and 2 where it is neither.
     */
    private fun scaleFrames(reduceMotion: Boolean): List<Int> {
        var changes by mutableIntStateOf(0)
        show(reduceMotion) {
            Place { MapScaleBar({ 1.0 }, { changes }, Locale.US, dark = false, Modifier.padding(16.dp)) }
        }
        to = 0.1f
        val nothing = settled()
        changes = 1
        Snapshot.sendApplyNotifications()
        compose.mainClock.advanceTimeBy(SCALE_HOLD_MILLIS / 2)
        val whole = pixels()
        assertEquals("the scale in the middle of its second", 1, compose.onAllNodesWithTag(SCALE_TAG).fetchSemanticsNodes().size)
        assertNotEquals("the scale is drawn", 0, unlike(whole, nothing))
        compose.mainClock.advanceTimeBy(2_000)
        assertEquals("the place with nothing once it has gone", 0, unlike(pixels(), nothing))
        changes = 2
        Snapshot.sendApplyNotifications()
        return List(((SCALE_HOLD_MILLIS + 500) / FRAME_MILLIS).toInt()) {
            val frame = frame()
            val there = compose.onAllNodesWithTag(SCALE_TAG).fetchSemanticsNodes().isNotEmpty()
            when {
                !there && unlike(frame, nothing) == 0 -> 0
                there && unlike(frame, whole) == 0 -> 1
                else -> 2
            }
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
    private fun assertTheChange(what: String, reduceMotion: Boolean, frames: Int = FRAMES, change: () -> Unit) {
        val before = settled()
        change()
        // Recomposition sees the change in the next frame, as the app's own changes are seen.
        Snapshot.sendApplyNotifications()
        val film = List(frames) { frame() }
        val after = settled()
        assertTrue("$what changes: ${unlike(before, after)} pixels", unlike(before, after) > 20)
        val unlikeAfter = film.map { unlike(it, after) }
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

    /** The place's rows [from] and [to], as drawn now. */
    private fun pixels(): PixelMap {
        compose.putFramesOnSurfaces()
        val image = compose.onNodeWithTag(PLACE).captureToImage()
        val top = (image.height * from).toInt()
        return image.toPixelMap(startY = top, height = (image.height * to).toInt() - top)
    }

    /** How many pixels differ between [a] and [b], of the same rows of the place. */
    private fun unlike(a: PixelMap, b: PixelMap): Int {
        assertEquals("the place's size", a.width to a.height, b.width to b.height)
        return (0 until a.width).sumOf { x -> (0 until a.height).count { y -> a[x, y] != b[x, y] } }
    }

    private companion object {
        const val PLACE = "place"
        const val FRAMES = 12
        const val FRAME_MILLIS = 16L

        /** MapScaleBar's HOLD_MILLIS. */
        const val SCALE_HOLD_MILLIS = 1_000L
    }
}
