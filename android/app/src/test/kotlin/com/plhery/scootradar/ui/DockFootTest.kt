package com.plhery.scootradar.ui

import android.view.View
import androidx.activity.ComponentActivity
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.unit.dp
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.FakeLocationManager
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.api.ScooterLoadFailure
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLoadIssue
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.map.LocalMapChrome
import com.plhery.scootradar.map.MapChromeFrames
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.dock.DOCK_TAG
import com.plhery.scootradar.ui.dock.DockState
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.useFontScale
import com.plhery.scootradar.zurichRegion
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone
import kotlin.math.max

// UI-121, UI-122, X-AD34: ScooterMapScreen.swift lays the dock (:313), the locate row (:284) and the notices' room
// (:506) out inside the safe area, then pads them by max(proxy.safeAreaInsets.bottom, 8) again: 68 pt above the foot of
// an iPhone 17 Pro Max (34 + 34, screens/lead-ios/iphone17promax-dock-foot.png), 8 on a home-button iPhone. A gesture
// bar is the home indicator; a 3-button bar, which takes taps (tappableElement), a home-button iPhone's chin (PLAN §10,
// the dock's foot). SystemBarsTest checks the same on the device, in both of its navigation modes.

/**
 * The dock's foot in the iPhone 17 Pro Max's window, 440 by 956, its status bar 62: over a gesture bar 34 high, as its
 * home indicator, 68 above the window's foot; over a 3-button bar 48 high, 8 above the bar; with no bar, 8 above the
 * window's foot. The locate row stands 10 over the dock wherever it is, the map's frames follow them, the keyboard moves
 * neither, and the notices get the room the iPhone gives them over the dock.
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w440dp-h956dp-mdpi")
class DockFootTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private val controllers = TestControllers()
    private val shortcuts = ScreenShortcuts()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale
    private lateinit var view: View
    private lateinit var frames: MapChromeFrames
    private lateinit var failure: ScooterLoadFailure

    @Before
    fun setUp() {
        val swiss = Locale.forLanguageTag("en-CH")
        Locale.setDefault(swiss)
        ScooterLanguage.launchLocale = { swiss }
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Zurich"))
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        controllers.close()
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        Locale.setDefault(locale)
        TimeZone.setDefault(timeZone)
    }

    /** The iPhone 17 Pro Max's own case: its home indicator's 34 under the safe area, then 34 more, 68 in all. */
    @Test
    fun overAGestureBarTheDockStandsItsInsetTwiceAboveTheWindowsFoot() {
        show(Bars.Gesture)
        assertTheDockStandsOn(956f - 68f)
    }

    /** A 3-button bar is a home-button iPhone's chin: the dock 8 above it, not its 48 twice. */
    @Test
    fun overA3ButtonBarTheDockStands8AboveIt() {
        show(Bars.ThreeButton)
        assertTheDockStandsOn(956f - 48f - 8f)
    }

    /** No bar under the window, as a home-button iPhone's screen without its chin, or a window's top half: 8. */
    @Test
    fun withNoBarTheDockStands8AboveTheWindowsFoot() {
        show(Bars.None)
        assertTheDockStandsOn(956f - 8f)
    }

    /**
     * `.ignoresSafeArea(.keyboard, edges: .bottom)`: the keyboard over either bar leaves the dock and the row where they
     * were. The bar changed as the screen runs, as the phone's navigation mode is changed under the app, moves them.
     */
    @Test
    fun theKeyboardLeavesTheDockWhereItWasOverEitherBar() {
        show(Bars.Gesture)
        for ((bars, foot) in listOf(Bars.Gesture to 956f - 68f, Bars.ThreeButton to 956f - 56f)) {
            dispatch(bars)
            assertTheDockStandsOn(foot, "$bars")
            dispatch(bars, keyboard = 336)
            assertTheDockStandsOn(foot, "$bars with the keyboard up")
        }
    }

    /**
     * UI-122, topNoticesHeightLimit: with large text the location's card and the first load's banner are taller than
     * their room and scroll in it, which is the height inside the safe area less the search bar, the locate button, the
     * dock and the dock's foot over the safe area, 8 over a 3-button bar as over a home-button iPhone's chin, and the
     * gaps between them: 40 more than with the bar's 48 counted twice.
     */
    @Test
    @Config(qualifiers = "w440dp-h540dp-mdpi")
    fun overA3ButtonBarTheNoticesGetTheRoomAHomeButtonPhoneGivesThem() {
        assertTheNoticesRoom(Bars.ThreeButton, overSafeFoot = 8.0)
    }

    /** The same over a gesture bar, whose inset counts twice: the dock's foot is its 34 over the safe area's. */
    @Test
    @Config(qualifiers = "w440dp-h540dp-mdpi")
    fun overAGestureBarTheNoticesRoomLeavesTheInsetOverTheSafeArea() {
        assertTheNoticesRoom(Bars.Gesture, overSafeFoot = 34.0)
    }

    /** The bars under the window, and over it the status bar's 62, as the iPhone 17 Pro Max's safe area's top. */
    private enum class Bars(val bottom: Int, val tappable: Int) {
        Gesture(bottom = 34, tappable = 0),
        ThreeButton(bottom = 48, tappable = 48),
        None(bottom = 0, tappable = 0),
    }

    /**
     * The dock's foot at [foot] in the window, the locate button's 10 over its top, both in the dock's layout, and the
     * frames the map reads the same: it keeps clear of what is over its bottom and shows a place above the locate row.
     */
    private fun assertTheDockStandsOn(foot: Float, what: String = "") {
        compose.waitForIdle()
        assertEquals(ScooterChromeLayout.Dock, shortcuts.situation!!.layout)
        val dock = frame(hasTestTag(DOCK_TAG))
        val locate = frame(hasContentDescription("Near me") or hasContentDescription("Go to my location"))
        assertEquals("$what: the dock's foot", foot, dock.bottom, 0.5f)
        assertEquals("$what: the locate button's foot over the dock's top ${dock.top}", dock.top - 10f, locate.bottom, 0.5f)
        assertEquals("$what: the dock's frame for the map", dock.bottom.toDouble(), frames.dock!!.maxY, 0.5)
        assertEquals("$what: the bottom of what the map shows", locate.top.toDouble(), frames.chrome.bottomTop!!, 0.5)
    }

    /** The notices scroll in the room the dock's layout gives them, [overSafeFoot] the dock's foot over the safe area's. */
    private fun assertTheNoticesRoom(bars: Bars, overSafeFoot: Double) {
        useFontScale(2f)
        val clock = TestClock()
        show(bars, bothNotices(clock), clock)
        val message = failure.message
        val scroll = SemanticsMatcher.keyIsDefined(SemanticsProperties.VerticalScrollAxisRange) and hasAnyDescendant(hasText(message))
        val node = compose.onNode(scroll).fetchSemanticsNode()
        assertTrue("the notices have more to scroll to", node.config[SemanticsProperties.VerticalScrollAxisRange].maxValue() > 10)
        val shown = node.boundsInRoot.height.toDouble()
        val inside = 540.0 - 62 - bars.bottom
        val bar = frame(hasTestTag(SEARCH_ISLAND_TAG)).height.toDouble()
        val locate = frames.locateButton!!.height
        val dock = frame(hasTestTag(DOCK_TAG)).height.toDouble()
        val room = max(64.0, inside - 8 - bar - 8 - 8 - locate - (dock + overSafeFoot + 10))
        assertEquals("the notices' room over $bars: bar $bar, locate $locate, dock $dock", room, shown, 0.5)
    }


    /** A screen whose first load failed, with the card of a location that was denied under the banner. */
    private fun bothNotices(clock: TestClock): ScooterMapController {
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421))))
        api.setFailure(ScooterAPIError.Offline())
        val model = controllers.make(api, clock, locationManager = FakeLocationManager(ScooterAuthorizationStatus.Denied))
        model.focusOnUser()
        assertTrue(controllers.waitUntil(attempts = 700) { model.locationIssue.value == ScooterLocationIssue.Denied && !model.isLocating.value })
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { model.loadIssue.value is ScooterLoadIssue.FirstLoadFailed && !model.isLoading.value })
        failure = (model.loadIssue.value as ScooterLoadIssue.FirstLoadFailed).failure
        return model
    }

    /** The screen of [model], the dock's summary unless given, over [bars], the map's stand-in reading the chrome's frames. */
    private fun show(bars: Bars, model: ScooterMapController? = null, clock: TestClock = TestClock()) {
        val shown = model ?: DockState.Summary.make(controllers, clock)
        compose.setContent {
            view = LocalView.current
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = shown, map = { frames = LocalMapChrome.current!! }, glassBlurs = false, shortcuts = shortcuts)
            }
        }
        compose.waitForIdle()
        dispatch(bars)
    }

    /** The window's insets: the status bar, the navigation bar as [bars] has it, and a keyboard [keyboard] high over it. */
    private fun dispatch(bars: Bars, keyboard: Int = 0) {
        compose.runOnIdle {
            val insets = WindowInsetsCompat.Builder()
                .setInsets(WindowInsetsCompat.Type.statusBars(), Insets.of(0, 62, 0, 0))
                .setInsets(WindowInsetsCompat.Type.navigationBars(), Insets.of(0, 0, 0, bars.bottom))
                .setInsets(WindowInsetsCompat.Type.tappableElement(), Insets.of(0, 62, 0, bars.tappable))
                .setInsets(WindowInsetsCompat.Type.ime(), Insets.of(0, 0, 0, keyboard))
                .setVisible(WindowInsetsCompat.Type.ime(), keyboard > 0)
                .build()
            ViewCompat.dispatchApplyWindowInsets(view, insets)
        }
        compose.waitForIdle()
    }

    private fun frame(matcher: SemanticsMatcher): Rect = compose.onNode(matcher).fetchSemanticsNode().boundsInRoot

    /** The rule alone, as [dockFoot] gives it: the dock's foot over the safe area's. */
    @Test
    fun theFootOverTheSafeAreaIsTheInsetAgainOver8OrEightOverATappableBar() {
        // The iPhone 17 Pro Max's home indicator, and a Pixel's gesture bar.
        assertEquals(34.dp, dockFoot(safeBottom = 34.dp, tappableBottom = 0.dp))
        assertEquals(24.dp, dockFoot(safeBottom = 24.dp, tappableBottom = 0.dp))
        // No bar, or one under 8.
        assertEquals(8.dp, dockFoot(safeBottom = 0.dp, tappableBottom = 0.dp))
        assertEquals(8.dp, dockFoot(safeBottom = 5.dp, tappableBottom = 0.dp))
        // A 3-button bar, and one over a cutout deeper than it.
        assertEquals(8.dp, dockFoot(safeBottom = 48.dp, tappableBottom = 48.dp))
        assertEquals(8.dp, dockFoot(safeBottom = 60.dp, tappableBottom = 48.dp))
    }
}
