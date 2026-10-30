package com.plhery.scootradar.ui

import android.content.Context
import android.provider.Settings
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.click
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.unit.LayoutDirection
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.map.LocalMapChrome
import com.plhery.scootradar.map.MapChromeFrames
import com.plhery.scootradar.ui.dock.DockState
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
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
import kotlin.math.abs

// UI-005 and UI-184: ScooterMapScreen.swift:282-285 pads the locate row up by the dock's height, max(safe bottom, 8)
// and 10; under Reduce Motion the iPhone's nil animation lays the row out with the dock that moves it, in one pass.

/** The locate row stands 10 above the dock's card on every frame, as the card changes height. */
@RunWith(AndroidJUnit4::class)
class LocateRowTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale
    private val resolver = ApplicationProvider.getApplicationContext<Context>().contentResolver
    private val animatorScale = Settings.Global.getFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f)
    private lateinit var frames: MapChromeFrames
    private var mapTaps = 0

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
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        Locale.setDefault(locale)
        TimeZone.setDefault(timeZone)
        Settings.Global.putFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, animatorScale)
    }

    /**
     * Under Remove animations, which the screen reads as Reduce Motion, a scooter's card takes the summary's place and
     * the summary the card's: the locate button's foot is 10 above the dock's top on every frame, the one the dock
     * changes height in too.
     */
    @Test
    @Config(qualifiers = "w411dp-h891dp-mdpi")
    fun underRemoveAnimationsTheLocateRowMovesWithTheDock() {
        Settings.Global.putFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 0f)
        val model = show()
        val summary = frames.dock!!.minY
        val card = follow { model.selectScooter("lime:a") }
        val back = follow { model.selectScooter(null) }
        assertTrue("the card's top ${card.last().second}, the summary's $summary", card.last().second < summary - 40)
        assertEquals(summary, back.last().second, 0.5)
        assertStandsOnTheDock(card + back)
    }

    /** With the animations on, the row follows the dock's spring to the card's height frame by frame. */
    @Test
    @Config(qualifiers = "w411dp-h891dp-mdpi")
    fun theLocateRowRidesTheDocksSpring() {
        val model = show()
        val summary = frames.dock!!.minY
        val card = follow { model.selectScooter("lime:a") }
        val moving = card.count { (_, dock) -> abs(dock - summary) > 1 && abs(dock - card.last().second) > 1 }
        assertTrue("the dock's tops ${card.map { it.second }}", moving >= 5)
        assertStandsOnTheDock(card)
    }

    /**
     * UI-190: as the search opens the locate button fades and shrinks to 0.92 toward the bottom trailing corner of
     * ScooterMapScreen.swift:261-286's VStack (`.scaleEffect(0.92, anchor: .bottomTrailing)`), on a phone the screen's,
     * and once gone it is hidden from TalkBack and a finger goes through it to the map.
     */
    @Test
    @Config(qualifiers = "w411dp-h891dp-mdpi")
    fun asTheSearchOpensTheLocateButtonShrinksTowardTheScreensBottomCornerAndLetsTapsThrough() {
        show()
        makesWayToward(corner = 411f)
    }

    /**
     * The Fold folded on its side, whose dock is in the middle: the VStack is as wide as the row's 560 and the 10 either
     * side (a Spacer takes no width across a VStack), so the corner is 290 from the middle, at 775, not the screen's.
     * In a window this short the open search reaches down over where the button was, so the taps aren't tried.
     */
    @Test
    @Config(qualifiers = "w970dp-h443dp-mdpi")
    fun inAWideWindowTheLocateButtonShrinksTowardTheCornerOfItsColumn() {
        show()
        makesWayToward(corner = 970 / 2f + 290, taps = false)
    }

    @Test
    @Config(qualifiers = "w970dp-h443dp-mdpi")
    fun rightToLeftInAWideWindowTheLocateButtonShrinksTowardTheLeftCornerOfItsColumn() {
        show(LayoutDirection.Rtl)
        makesWayToward(corner = 970 / 2f - 290, taps = false)
    }

    /**
     * Opens the search, and checks the locate button shrinks to 0.92 toward the screen's bottom at [corner] across, is
     * hidden from TalkBack once gone, and with [taps] that it takes a tap only while it shows.
     */
    private fun makesWayToward(corner: Float, taps: Boolean = true) {
        val height = compose.onRoot().fetchSemanticsNode().boundsInRoot.height / compose.density.density
        val button = compose.onNode(nearMe)
        val rest = drawn(button)
        val middle = Offset(rest.center.x * compose.density.density, rest.center.y * compose.density.density)
        if (taps) {
            compose.onRoot().performTouchInput { click(middle) }
            compose.waitForIdle()
            assertEquals("the button takes the tap", 0, mapTaps)
        }

        compose.mainClock.autoAdvance = false
        compose.onNodeWithTag(SEARCH_ISLAND_TAG).performClick()
        val going = List(30) {
            compose.mainClock.advanceTimeByFrame()
            compose.waitForIdle()
            drawn(button)
        }
        compose.mainClock.autoAdvance = true
        compose.waitForIdle()
        val scales = going.map { it.width / rest.width }
        assertTrue("the button's scales $scales", scales.count { it < 0.995f && it > 0.925f } >= 3)
        assertEquals(0.92f, scales.last(), 0.002f)
        going.forEachIndexed { frame, it ->
            val scale = it.width / rest.width
            // Each edge as far from the corner as it was, times the scale.
            assertEquals("frame $frame's left of $going", corner - scale * (corner - rest.left), it.left, 0.5f)
            assertEquals("frame $frame's foot of $going", height - scale * (height - rest.bottom), it.bottom, 0.5f)
        }
        button.assert(hasAnyAncestor(SemanticsMatcher.keyIsDefined(SemanticsProperties.HideFromAccessibility)))
        if (taps) {
            compose.onRoot().performTouchInput { click(middle) }
            compose.waitForIdle()
            assertEquals("the map takes the tap", 1, mapTaps)
        } else {
            val search = compose.onNodeWithTag(SEARCH_ISLAND_TAG).fetchSemanticsNode().boundsInRoot
            assertTrue("the open search $search over where the button was, $middle", search.contains(middle))
        }
    }

    /** Where [node] is drawn, in dp. */
    private fun drawn(node: SemanticsNodeInteraction): Rect {
        val bounds = node.fetchSemanticsNode().boundsInRoot
        val density = compose.density.density
        return Rect(bounds.left / density, bounds.top / density, bounds.right / density, bounds.bottom / density)
    }

    private fun assertStandsOnTheDock(frames: List<Pair<Double, Double>>) {
        val misses = frames.withIndex().filter { (_, it) -> abs(it.first - (it.second - 10)) > 0.5 }
        assertTrue("frames where the locate button's foot isn't 10 above the dock: $misses", misses.isEmpty())
    }

    /** Frame by frame, 30 of them, from [change]: the locate button's foot and the dock's top. */
    private fun follow(change: () -> Unit): List<Pair<Double, Double>> {
        compose.mainClock.autoAdvance = false
        compose.runOnIdle(change)
        val tops = List(30) {
            compose.mainClock.advanceTimeByFrame()
            compose.waitForIdle()
            frame(frames.locateButton).maxY to frame(frames.dock).minY
        }
        compose.mainClock.autoAdvance = true
        compose.waitForIdle()
        return tops
    }

    private fun frame(rect: ScreenRect?) = checkNotNull(rect)

    /** The screen on the list of providers, with the map's stand-in reading the chrome's frames. */
    private fun show(direction: LayoutDirection = LayoutDirection.Ltr): ScooterMapController {
        val clock = TestClock()
        val model = DockState.Summary.make(controllers, clock)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }, LocalLayoutDirection provides direction) {
                ScooterMapScreen(
                    controller = model,
                    map = {
                        frames = LocalMapChrome.current!!
                        Box(Modifier.fillMaxSize().pointerInput(Unit) { detectTapGestures { mapTaps++ } })
                    },
                    glassBlurs = false,
                )
            }
        }
        compose.waitForIdle()
        assertEquals(ScooterChromeLayout.Dock, frames.layout)
        return model
    }

    private companion object {
        /** The locate button before the first fix. */
        val nearMe = hasContentDescription("Near me") or hasText("Near me")
    }
}
