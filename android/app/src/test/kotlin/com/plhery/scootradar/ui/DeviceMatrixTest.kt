package com.plhery.scootradar.ui

import android.graphics.Rect
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.text.TextLayoutResult
import androidx.window.layout.FoldingFeature
import androidx.window.testing.layout.FoldingFeature
import androidx.window.testing.layout.TestWindowLayoutInfo
import androidx.window.testing.layout.WindowLayoutInfoPublisherRule
import com.github.takahirom.roborazzi.ExperimentalRoborazziApi
import com.github.takahirom.roborazzi.captureScreenRoboImage
import com.plhery.scootradar.FakeLocationManager
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.api.AddressSearchAPIClient
import com.plhery.scootradar.core.api.AddressSearchResult
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.map.LocalMapChrome
import com.plhery.scootradar.map.MapChromeFrames
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.dock.DockState
import com.plhery.scootradar.ui.dock.LocalCoverageCounts
import com.plhery.scootradar.ui.search.SEARCH_FIELD_TAG
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import com.plhery.scootradar.ui.sheet.FORM_SHEET_TAG
import com.plhery.scootradar.ui.sheet.POPOVER_TAG
import com.plhery.scootradar.ui.theme.Look
import com.plhery.scootradar.ui.theme.drawnArtOptions
import com.plhery.scootradar.ui.theme.putFramesOnSurfaces
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.screenshot
import com.plhery.scootradar.ui.theme.useFontScale
import com.plhery.scootradar.zurichRegion
import java.io.IOException
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone
import kotlin.math.abs
import kotlinx.coroutines.awaitCancellation
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.RuleChain
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * The device matrix's passes (X.md X-M03 to X-M11, X-M14 to X-M17) over each screen of ui.md §1, on the windows of
 * ScootRadar_Fold and ScootRadar_Tablet: the foldable folded (its outer screen, a phone's) and open, upright and
 * across, open like a book and standing like a laptop; the tablet across and upright, and in a half and a third of
 * its width, as split screen gives it. Light and dark, at font scale 1.0 and 2.0. In each, as ui.md §2 has it: the
 * panel or the dock as the iPad's and the iPhone Duo's thresholds pick it, the chrome inside the window and clear of
 * itself, the panel clear of a fold down the middle, and no text cut off or clipped by what holds it, outside what
 * scrolls. One picture per screen for each class and appearance, at font scale 1.0, under matrix/; the panel's own
 * screens at these sizes are PanelScreenshotTest's and PanelPresentationScreenshotTest's.
 *
 * At one dp to the pixel, as the panel's baselines, and with no system bars: Robolectric draws none, so the safe
 * area's part is the emulator's (FoldBesideTheMapTest, PanelBesideTheMapTest, WindowResizeTest).
 */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class DeviceMatrixTest(private val look: Look) {
    private val compose = createComposeRule()
    private val hinge = WindowLayoutInfoPublisherRule()

    @get:Rule
    val rules: RuleChain = RuleChain.outerRule(hinge).around(compose)

    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale

    @Before
    fun setUp() {
        // English as a phone in Switzerland has it, as in the App Store screenshots: metres and a 24-hour clock.
        val swiss = Locale.forLanguageTag("en-CH")
        Locale.setDefault(swiss)
        ScooterLanguage.launchLocale = { swiss }
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Zurich"))
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        Locale.setDefault(locale)
        TimeZone.setDefault(timeZone)
    }

    @Test
    @Config(qualifiers = "w443dp-h970dp-mdpi")
    fun foldFolded() = pass(MatrixWindow.Folded)

    @Test
    @Config(qualifiers = "w852dp-h883dp-mdpi")
    fun foldOpen() = pass(MatrixWindow.Open)

    @Test
    @Config(qualifiers = "w883dp-h852dp-mdpi")
    fun foldOpenAcross() = pass(MatrixWindow.OpenAcross)

    @Test
    @Config(qualifiers = "w852dp-h883dp-mdpi")
    fun foldBook() = pass(MatrixWindow.Book)

    @Test
    @Config(qualifiers = "w883dp-h852dp-mdpi")
    fun foldTabletop() = pass(MatrixWindow.Tabletop)

    @Test
    @Config(qualifiers = "w1280dp-h800dp-mdpi")
    fun tabletAcross() = pass(MatrixWindow.TabletAcross)

    @Test
    @Config(qualifiers = "w800dp-h1280dp-mdpi")
    fun tabletUpright() = pass(MatrixWindow.TabletUpright)

    @Test
    @Config(qualifiers = "w640dp-h800dp-mdpi")
    fun tabletHalf() = pass(MatrixWindow.Half)

    @Test
    @Config(qualifiers = "w400dp-h800dp-mdpi")
    fun tabletThird() = pass(MatrixWindow.Third)

    /** A screen shown: the controller its scene made, and the scene. */
    private class Shown(val scene: MatrixScene, val model: ScooterMapController, val clock: TestClock)

    /** Each scene in turn on the `window`, each from a new screen; every problem found, at the end. */
    @OptIn(ExperimentalRoborazziApi::class)
    private fun pass(window: MatrixWindow) {
        var shown by mutableStateOf<Shown?>(null)
        var frames: MapChromeFrames? = null
        useFontScale(look.fontScale)
        compose.setContent {
            val now = shown ?: return@setContent
            key(now) {
                CompositionLocalProvider(LocalClock provides { now.clock.now }, LocalCoverageCounts provides (1_061 to 56)) {
                    ScooterMapScreen(
                        controller = now.model,
                        map = { dark ->
                            frames = LocalMapChrome.current
                            MapStandIn(dark)
                        },
                        glassBlurs = false,
                        addressSearch = MatrixPlaces,
                    )
                }
            }
        }
        val problems = mutableListOf<String>()
        for (scene in MatrixScene.entries) {
            val controllers = TestControllers()
            try {
                val clock = TestClock()
                val model = scene.make(controllers, clock)
                model.setAppearance(if (look.dark) ScooterAppearance.Dark else ScooterAppearance.Light)
                compose.runOnIdle { shown = Shown(scene, model, clock) }
                compose.waitForIdle()
                // WindowManager tells a new screen of the fold as the hinge moves; the rule tells it once, now.
                window.fold?.let { fold -> compose.runOnIdle { hinge.overrideWindowLayoutInfo(TestWindowLayoutInfo(listOf(fold))) } }
                compose.waitForIdle()
                scene.open(compose)
                val at = "${window.name} ${scene.name} ${look.name}"
                problems += chromeProblems(at, window, scene, frames)
                problems += textProblems(at, window)
                if (look.fontScale == 1f && window.picture in scene.pictured) {
                    val name = "matrix/${window.picture!!.fileName}_${scene.fileName}_${look.suffix}"
                    if (scene == MatrixScene.PriceMenu) {
                        // The menu is a window of its own, over the screen's.
                        compose.putFramesOnSurfaces()
                        captureScreenRoboImage("src/test/screenshots/$name.png", roborazziOptions = drawnArtOptions)
                    } else {
                        compose.screenshot(name)
                    }
                }
            } finally {
                compose.runOnIdle { shown = null }
                compose.waitForIdle()
                controllers.close()
            }
        }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
    }

    /**
     * Where the chrome is, against ui.md §2: the layout the window's size picks; in the dock's, the search bar, the
     * notices, the locate row and the dock inside the window, centred in at most 560 dp and clear of each other; in the
     * panel's, the panel 16 dp in from the leading edge and the top, 380 dp wide (420 at the accessibility sizes) or
     * narrower beside a fold down the middle, and the locate button 16 dp in from the trailing corner, clear of it.
     */
    private fun chromeProblems(at: String, window: MatrixWindow, scene: MatrixScene, frames: MapChromeFrames?): List<String> {
        frames ?: return listOf("$at: no chrome")
        val problems = mutableListOf<String>()
        val largeText = look.fontScale >= 1.5f
        val expected = window.layout(largeText)
        if (frames.layout != expected) problems += "$at: the ${frames.layout}, not the $expected"
        val bounds = ScreenRect(0.0, 0.0, window.width.toDouble(), window.height.toDouble())
        fun inside(name: String, frame: ScreenRect?) {
            if (frame != null && !frame.isInside(bounds)) problems += "$at: the $name $frame outside the window $bounds"
        }
        fun apart(a: String, first: ScreenRect?, b: String, second: ScreenRect?) {
            if (first != null && second != null && first.overlaps(second)) problems += "$at: the $a $first over the $b $second"
        }
        when (frames.layout) {
            ScooterChromeLayout.Dock -> {
                inside("dock", frames.dock)
                inside("locate button", frames.locateButton)
                inside("zone legend", frames.zoneLegend)
                if (!scene.searches) {
                    inside("top", frames.top)
                    for ((name, frame) in listOf("top" to frames.top, "dock" to frames.dock)) {
                        frame ?: continue
                        if (frame.width > 560.5) problems += "$at: the $name ${frame.width} wide, over 560"
                        if (abs(frame.midX - bounds.midX) > 1) problems += "$at: the $name at ${frame.midX}, not centred at ${bounds.midX}"
                    }
                    // The top is the search bar and, where the scene has them, the notices under it: as tall and
                    // as wide as they are, as iOS's onGeometryChange on the stack.
                    val bar = compose.onAllNodes(SemanticsMatcher.expectValue(SemanticsProperties.TestTag, SEARCH_ISLAND_TAG))
                        .fetchSemanticsNodes().firstOrNull()?.wholeBounds()
                    val top = frames.top
                    if (top == null) {
                        problems += "$at: no top"
                    } else if (bar != null) {
                        if (abs(top.minY - bar.top) > 1 || top.minX > bar.left + 1 || top.maxX < bar.right - 1) {
                            problems += "$at: the top $top not over the search bar $bar"
                        }
                        if (scene.notices && top.maxY <= bar.bottom + 8) {
                            problems += "$at: the top $top leaves out the notices under the search bar $bar"
                        }
                        if (!scene.notices && abs(top.maxY - bar.bottom) > 1) problems += "$at: the top $top reaches past the search bar $bar"
                    }
                    apart("top", frames.top, "dock", frames.dock)
                    apart("top", frames.top, "locate button", frames.locateButton)
                    apart("top", frames.top, "zone legend", frames.zoneLegend)
                    // While the search is open the locate button and the legend make way, shrunk and hidden, where
                    // the dock was.
                    apart("locate button", frames.locateButton, "dock", frames.dock)
                    apart("zone legend", frames.zoneLegend, "dock", frames.dock)
                    apart("zone legend", frames.zoneLegend, "locate button", frames.locateButton)
                }
            }
            ScooterChromeLayout.Panel -> {
                val panel = frames.panel
                if (panel == null) {
                    problems += "$at: no panel"
                } else {
                    inside("panel", panel)
                    val width = window.panelWidth(largeText)
                    if (abs(panel.x - 16) > 0.5 || abs(panel.y - 16) > 0.5 || abs(panel.width - width) > 0.5) {
                        problems += "$at: the panel at $panel, not 16 in and $width wide"
                    }
                    frames.fold?.takeIf { window.fold?.orientation == FoldingFeature.Orientation.VERTICAL }?.let { fold ->
                        if (panel.maxX > fold.minX + 0.5) problems += "$at: the panel $panel over the fold $fold"
                    }
                }
                inside("locate button", frames.locateButton)
                inside("zone legend", frames.zoneLegend)
                frames.locateButton?.let { button ->
                    if (abs(button.maxX - (bounds.maxX - 16)) > 0.5 || abs(button.maxY - (bounds.maxY - 16)) > 0.5) {
                        problems += "$at: the locate button at $button, not 16 in from the corner"
                    }
                }
                apart("panel", panel, "locate button", frames.locateButton)
                apart("panel", panel, "zone legend", frames.zoneLegend)
                apart("zone legend", frames.zoneLegend, "locate button", frames.locateButton)
            }
        }
        // What opens over the screen: Filters' popover and Settings' form beside a panel, inside the window.
        for (tag in listOf(POPOVER_TAG, FORM_SHEET_TAG)) {
            val node = compose.onAllNodes(SemanticsMatcher.expectValue(SemanticsProperties.TestTag, tag)).fetchSemanticsNodes().firstOrNull() ?: continue
            val whole = node.wholeBounds()
            if (whole.left < -0.5f || whole.top < -0.5f || whole.right > window.width + 0.5f || whole.bottom > window.height + 0.5f) {
                problems += "$at: the $tag $whole outside the window"
            }
        }
        scene.opens(frames.layout)?.let { opened ->
            if (compose.onAllNodes(opened).fetchSemanticsNodes().isEmpty()) problems += "$at: nothing that is ${opened.description}"
        }
        return problems
    }

    /**
     * The texts cut off and what is clipped. A text's lines wider than its box, below its bottom or cut short with
     * "…", as TextFitsTest finds them on a phone: allowed only where iOS cuts short too, the one line of a sheet's
     * title so long as a third of it shows, and the search bar's (lineLimit and minimumScaleFactor). And a text or a
     * button that what holds it clips, or the window, except inside what scrolls, or what is hidden from TalkBack
     * while it makes way for the search.
     */
    private fun textProblems(at: String, window: MatrixWindow): List<String> {
        val problems = mutableListOf<String>()
        val nodes = compose.onAllNodes(SemanticsMatcher("anything") { true }, useUnmergedTree = true).fetchSemanticsNodes()
            .filterNot { it.isHidden() }
        var laidOut = 0
        for (node in nodes) {
            val words = node.words()
            val results = mutableListOf<TextLayoutResult>()
            node.config.getOrNull(SemanticsActions.GetTextLayoutResult)?.action?.invoke(results)
            results.firstOrNull()?.let { layout ->
                laidOut++
                val paragraph = layout.multiParagraph
                val lines = 0 until layout.lineCount
                val wide = lines.any { layout.getLineRight(it) - layout.getLineLeft(it) > layout.size.width + 1 }
                val tall = paragraph.height > layout.size.height + 1
                val short = paragraph.didExceedMaxLines || lines.any { layout.isLineEllipsized(it) }
                val title = layout.lineCount == 1 && node.config.contains(SemanticsProperties.Heading) &&
                    layout.size.width >= paragraph.intrinsics.maxIntrinsicWidth / 3
                val allowed = !wide && !tall && (title || node.isIn(SEARCH_ISLAND_TAG))
                if ((wide || tall || short) && !allowed) {
                    val how = listOfNotNull("at the side".takeIf { wide }, "at the bottom".takeIf { tall }, "with …".takeIf { short })
                    problems += "$at: \"$words\" cut ${how.joinToString(" and ")} (${layout.size.width}×${layout.size.height})"
                }
            }
            val shows = node.config.contains(SemanticsProperties.Text) || node.config.contains(SemanticsActions.OnClick)
            if (!shows || node.inScroll()) continue
            val whole = node.wholeBounds()
            val visible = node.boundsInWindow
            val windowed = whole.left >= -0.5f && whole.top >= -0.5f && whole.right <= window.width + 0.5f && whole.bottom <= window.height + 0.5f
            if (!windowed || visible.width < whole.width - 1 || visible.height < whole.height - 1) {
                problems += "$at: \"$words\" clipped to $visible of $whole"
            }
        }
        // A screen with no text laid out to look at is one the pass didn't reach.
        if (laidOut < 3) problems += "$at: only $laidOut texts to look at"
        return problems
    }

    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0}")
        fun parameters(): List<Array<Any>> = Look.entries.map { arrayOf(it) }
    }
}

/** The windows of the matrix, in dp, with the fold WindowManager tells of in it, partly open. */
enum class MatrixWindow(val width: Int, val height: Int, val fold: FoldingFeature? = null, val picture: Picture? = null) {
    /** ScootRadar_Fold folded: its outer screen, 1080 × 2364 px at 390 dpi. */
    Folded(443, 970),

    /** ScootRadar_Fold open: its inner screen, 2076 × 2152 px at 390 dpi. */
    Open(852, 883, picture = Picture.Fold),

    /** The same, turned. */
    OpenAcross(883, 852),

    /** Open like a book, its hinge (1038 px in, no width) down the middle. */
    Book(
        852,
        883,
        FoldingFeature(Rect(0, 0, 852, 883), center = 426, size = 0, state = FoldingFeature.State.HALF_OPENED, orientation = FoldingFeature.Orientation.VERTICAL),
    ),

    /** Standing like a laptop: turned, its hinge across the middle. */
    Tabletop(
        883,
        852,
        FoldingFeature(Rect(0, 0, 883, 852), center = 426, size = 0, state = FoldingFeature.State.HALF_OPENED, orientation = FoldingFeature.Orientation.HORIZONTAL),
        picture = Picture.Tabletop,
    ),

    /** ScootRadar_Tablet across: 2560 × 1600 px at 320 dpi. */
    TabletAcross(1280, 800, picture = Picture.Tablet),

    /** The same, upright. */
    TabletUpright(800, 1280),

    /** Half the tablet's width across, in split screen. */
    Half(640, 800, picture = Picture.Half),

    /** A third of it. */
    Third(400, 800),
    ;

    /** Where a window's pictures are named from. */
    enum class Picture {
        Fold,
        Tabletop,
        Tablet,
        Half,
        ;

        val fileName: String get() = name.lowercase()
    }

    /**
     * The layout ui.md UI-108 to UI-115 give the window: the panel where it is regular both ways (600 and 480 dp) and
     * at least 780 dp wide (820 at the accessibility sizes), from the dock; else the dock. A fold leaves it be (UI-119).
     */
    fun layout(largeText: Boolean): ScooterChromeLayout =
        if (width >= 600 && height >= 480 && width >= if (largeText) 820 else 780) ScooterChromeLayout.Panel else ScooterChromeLayout.Dock

    /** The panel's width (UI-113, UI-118): 380, 420 at the accessibility sizes, or the room before a fold, 320 at least. */
    fun panelWidth(largeText: Boolean): Double {
        val width = if (largeText) 420.0 else 380.0
        val fold = fold?.takeIf { it.orientation == FoldingFeature.Orientation.VERTICAL } ?: return width
        val room = fold.bounds.left - 16.0
        return if (room > 0 && room < width) maxOf(320.0, room) else width
    }
}

/**
 * The screens and states of ui.md §1 and §3, each as a rider reaches it: the dock's or the panel's content in each of
 * its states, the location card, the zones' legend, the search open, Filters, Settings and its pages, and the card's
 * price menu and walk. [pictured]: the windows it is pictured in; [notices]: whether a notice shows under the search bar.
 */
enum class MatrixScene(
    private val state: DockState? = null,
    val pictured: Set<MatrixWindow.Picture> = emptySet(),
    val searches: Boolean = false,
    val notices: Boolean = false,
) {
    Finding(DockState.Finding),

    /** The first load failed: the banner under the search bar, and the dock waiting. */
    Waiting(DockState.Waiting, pictured = foldAndTablet, notices = true),
    Summary(DockState.Summary, pictured = setOf(MatrixWindow.Picture.Half)),
    Nearest(DockState.Nearest),
    ProviderChosen(DockState.ProviderChosen),
    FiltersHideEverything(DockState.FiltersHideEverything),
    RefreshFailed(DockState.RefreshFailed),
    OutOfDate(DockState.OutOfDate, pictured = foldAndTablet),
    OutsideCoverage(DockState.OutsideCoverage),
    ScooterCard(DockState.ScooterCard, pictured = setOf(MatrixWindow.Picture.Half, MatrixWindow.Picture.Tabletop)),
    CardFolded(DockState.ScooterCard) {
        override fun make(controllers: TestControllers, clock: TestClock) =
            super.make(controllers, clock).also { it.setPanelCollapsed(true) }
    },
    ParkingBay(DockState.ParkingBay, pictured = foldAndTablet),
    LocationDenied(pictured = foldAndTablet, notices = true) {
        override fun make(controllers: TestControllers, clock: TestClock) = located(controllers, clock, ScooterLocationIssue.Denied)
    },
    LocationNotFound(notices = true) {
        override fun make(controllers: TestControllers, clock: TestClock) = located(controllers, clock, ScooterLocationIssue.NotFound)
    },

    /** The operators' zones on: the legend beside the locate button. */
    Zones(pictured = foldAndTablet) {
        override fun make(controllers: TestControllers, clock: TestClock): ScooterMapController {
            val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421))))
            val model = controllers.make(api, clock, defaults = InMemoryScooterDefaults())
            model.updateViewport(zurichRegion, zoom = 16)
            assertTrue(controllers.waitUntil { api.calls >= 1 && model.lastUpdated.value != null && !model.isLoading.value })
            assertTrue(controllers.waitUntil { model.zoneState.value != ScooterZoneState.Off && model.zoneState.value != ScooterZoneState.Loading })
            return model
        }
    },
    SearchSuggestions(DockState.Summary, searches = true) {
        override fun open(compose: MatrixCompose) {
            compose.onNodeWithTag(SEARCH_ISLAND_TAG).performClick()
            compose.waitForIdle()
        }
    },
    SearchResults(DockState.Summary, pictured = foldAndTablet, searches = true) {
        override fun open(compose: MatrixCompose) {
            compose.onNodeWithTag(SEARCH_ISLAND_TAG).performClick()
            compose.waitForIdle()
            compose.onNodeWithTag(SEARCH_FIELD_TAG).performTextInput("Bahnhof")
            // Past the pause before a search, on the test's clock.
            compose.mainClock.advanceTimeBy(1_000)
            compose.waitForIdle()
        }
    },
    Filters(DockState.Summary, pictured = setOf(MatrixWindow.Picture.Half)) {
        override fun open(compose: MatrixCompose) = tap(compose, localized("Filters"))
        override fun opens(layout: ScooterChromeLayout) = presented(layout, POPOVER_TAG, localized("Filters"))
    },
    Settings(DockState.Summary) {
        override fun open(compose: MatrixCompose) = tap(compose, localized("Settings"))
        override fun opens(layout: ScooterChromeLayout) = presented(layout, FORM_SHEET_TAG, localized("Settings"))
    },
    SettingsLanguage(DockState.Summary, pictured = foldAndTablet) {
        // The row under Language names the language shown, in its own words.
        override fun open(compose: MatrixCompose) = settingsPage(compose, "English")
    },
    SettingsPass(DockState.Summary) {
        override fun open(compose: MatrixCompose) = settingsPage(compose, "Lime")
    },
    SettingsCredits(DockState.Summary) {
        override fun open(compose: MatrixCompose) = settingsPage(compose, localized("Map & data credits"))
    },
    SettingsPrivacy(DockState.Summary) {
        override fun open(compose: MatrixCompose) = settingsPage(compose, localized("Privacy"))
    },

    /** The card's price cell tapped: the menu of ride lengths. */
    PriceMenu(DockState.ScooterCard, pictured = foldAndTablet) {
        override fun open(compose: MatrixCompose) {
            val label = stringFormat(localized("Ride estimate, %lld minutes. Change duration."), 10L)
            compose.onNode(hasContentDescription(label) and hasClickAction()).performClick()
            compose.waitForIdle()
        }
    },

    /** The card's Directions tapped: the walk to the scooter, its route asked for. */
    Walk(DockState.ScooterCard) {
        override fun open(compose: MatrixCompose) = tap(compose, localized("Directions"))
    },
    ;

    val fileName: String get() = name.replaceFirstChar { it.lowercase() }

    /** What the scene opens over the screen in the layout given, which must be there; null if it opens nothing. */
    open fun opens(layout: ScooterChromeLayout): SemanticsMatcher? = null

    /** A controller in this scene's state, on `controllers`, at `clock`'s time. */
    open fun make(controllers: TestControllers, clock: TestClock): ScooterMapController = state!!.make(controllers, clock)

    /** What the rider does on the screen to reach the scene. */
    open fun open(compose: MatrixCompose) = Unit
}

private typealias MatrixCompose = androidx.compose.ui.test.junit4.ComposeContentTestRule

/**
 * Beside a panel, the popover or the form tagged `tag`; over the dock, a sheet, which the heading `title` stands for:
 * the screen has no other heading.
 */
private fun presented(layout: ScooterChromeLayout, tag: String, title: String): SemanticsMatcher =
    if (layout == ScooterChromeLayout.Panel) {
        SemanticsMatcher.expectValue(SemanticsProperties.TestTag, tag)
    } else {
        SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading) and hasText(title)
    }

private val foldAndTablet = setOf(MatrixWindow.Picture.Fold, MatrixWindow.Picture.Tablet)

private fun tap(compose: MatrixCompose, description: String) {
    compose.onNode(hasContentDescription(description) and hasClickAction()).performClick()
    compose.waitForIdle()
}

/** Settings open on the page its root's row `row` leads to. */
private fun settingsPage(compose: MatrixCompose, row: String) {
    tap(compose, localized("Settings"))
    // The sheet opens half way up over the dock: its list is scrolled to the row first.
    val lists = compose.onAllNodes(hasScrollAction())
    val reached = (0 until lists.fetchSemanticsNodes().size).any { index ->
        runCatching { lists[index].performScrollToNode(hasText(row) and hasClickAction()) }.isSuccess
    }
    check(reached) { "no row $row in Settings" }
    compose.waitForIdle()
    compose.onNode(hasText(row) and hasClickAction()).performClick()
    compose.waitForIdle()
}

/** A controller of two scooters in Zürich, after Near me found no place for the rider, as `issue` says why. */
internal fun located(controllers: TestControllers, clock: TestClock, issue: ScooterLocationIssue): ScooterMapController {
    val api = StubScooterAPI(
        ScooterResponse(
            vehicles = listOf(
                scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421),
                scooter(id = "b", provider = "voi", latitude = 47.3765, longitude = 8.5430),
            ),
        ),
    )
    val authorization = when (issue) {
        ScooterLocationIssue.Denied -> ScooterAuthorizationStatus.Denied
        ScooterLocationIssue.Restricted -> ScooterAuthorizationStatus.Restricted
        ScooterLocationIssue.NotFound -> ScooterAuthorizationStatus.AuthorizedWhenInUse
    }
    val model = controllers.make(api, clock, locationManager = FakeLocationManager(authorization))
    model.updateViewport(zurichRegion, zoom = 16)
    assertTrue(controllers.waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value })
    // Near me; with no fix, the card comes 5 s later.
    model.focusOnUser()
    assertTrue(controllers.waitUntil(attempts = 700) { model.locationIssue.value == issue && !model.isLocating.value })
    return model
}

/** The server's search as SearchScreenshotTest has it: places for "Bahnhof", none for "Nowhere", no answer for "Slow". */
private object MatrixPlaces : AddressSearchAPIClient {
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

/** The map's ground, light or dark, without its streets. */
@Composable
private fun MapStandIn(dark: Boolean) {
    Box(Modifier.fillMaxSize().background(if (dark) Color(0xFF2B2D30) else Color(0xFFF1EFEA)))
}

private fun ScreenRect.isInside(other: ScreenRect): Boolean =
    minX >= other.minX - 0.5 && minY >= other.minY - 0.5 && maxX <= other.maxX + 0.5 && maxY <= other.maxY + 0.5

/** Whether the two overlap by more than half a dp each way. */
private fun ScreenRect.overlaps(other: ScreenRect): Boolean =
    minX < other.maxX - 0.5 && other.minX < maxX - 0.5 && minY < other.maxY - 0.5 && other.minY < maxY - 0.5

/** Where the node is laid out in the window, unclipped. */
private fun SemanticsNode.wholeBounds(): androidx.compose.ui.geometry.Rect =
    androidx.compose.ui.geometry.Rect(positionInWindow, Size(size.width.toFloat(), size.height.toFloat()))

private fun SemanticsNode.ancestry(): Sequence<SemanticsNode> = generateSequence(this) { it.parent }

private fun SemanticsNode.isHidden(): Boolean = ancestry().any { it.config.contains(SemanticsProperties.HideFromAccessibility) }

/** Inside something that scrolls, which may hold it out of view. */
private fun SemanticsNode.inScroll(): Boolean = ancestry().drop(1).any {
    it.config.contains(SemanticsProperties.VerticalScrollAxisRange) || it.config.contains(SemanticsProperties.HorizontalScrollAxisRange)
}

private fun SemanticsNode.isIn(tag: String): Boolean = ancestry().any { it.config.getOrNull(SemanticsProperties.TestTag) == tag }

private fun SemanticsNode.words(): String =
    config.getOrNull(SemanticsProperties.Text)?.joinToString(" ") { it.text }
        ?: config.getOrNull(SemanticsProperties.EditableText)?.text
        ?: config.getOrNull(SemanticsProperties.ContentDescription)?.joinToString(" ")
        ?: config.getOrNull(SemanticsProperties.TestTag)
        ?: "a node"
