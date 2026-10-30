package com.plhery.scootradar.ui

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.FakeLocationManager
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLoadIssue
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.map.LocalMapChrome
import com.plhery.scootradar.map.MapChromeFrames
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
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
import kotlin.math.abs

// UI-193 and UI-003: ScooterMapScreen.swift's top VStack(spacing: 8), whose frame onGeometryChange hands the map, drops
// a notice from its layout as the notice is taken away, while the notice goes over it (the last fades where it was, one
// leaving another slides up and fades), and moves what is under a notice that comes or goes on the notices'
// `.animation(.snappy(duration: 0.28))`.

/**
 * A notice that goes leaves the frame the map keeps its names and taps out of at once: the map's top is the search
 * bar alone from the next frame, while the card still fades for 0.28 s. A card under a banner that comes or goes
 * moves by the banner and the space between them on one spring.
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w443dp-h970dp-mdpi")
class TopNoticeFrameTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale
    private lateinit var frames: MapChromeFrames

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
    }

    @Test
    fun aLocationCardThatIsDismissedLeavesTheTopAtOnce() {
        val clock = TestClock()
        val model = located(controllers, clock, ScooterLocationIssue.Denied)
        show(model, clock)
        val card = hasText(ScooterLocationIssue.Denied.title!!)
        assertTrue("the top ${frames.top} holds the card under the bar", frames.top!!.height > barHeight() + 8)

        compose.mainClock.autoAdvance = false
        compose.runOnIdle { model.dismissLocationIssue() }
        compose.mainClock.advanceTimeByFrame()
        compose.waitForIdle()
        // The card is still there, on its way out.
        assertTrue("the card fades", compose.onAllNodes(card).fetchSemanticsNodes().isNotEmpty())
        assertEquals("the top ${frames.top}", barHeight(), frames.top!!.height, 0.5)
        compose.mainClock.autoAdvance = true
        compose.waitForIdle()
        assertEquals("the top ${frames.top}", barHeight(), frames.top!!.height, 0.5)
    }

    /**
     * The search closing over a card hands the map the bar and the card from its first frame, as the iPhone's stack
     * lays the card out under the bar again as soon as `searchIsExpanded` is false (ScooterMapScreen.swift's
     * `if !searchIsExpanded, hasTopNotices`, which onGeometryChange reads): the card's height is kept while the open
     * search has it away.
     */
    @Test
    fun theSearchClosingOverACardHandsTheMapTheBarAndTheCardFromItsFirstFrame() {
        val clock = TestClock()
        val model = located(controllers, clock, ScooterLocationIssue.Denied)
        show(model, clock)
        val card = hasText(ScooterLocationIssue.Denied.title!!)
        val withCard = frames.top!!
        assertTrue("the top $withCard holds the card under the bar", withCard.height > barHeight() + 8)

        compose.onNodeWithTag(SEARCH_ISLAND_TAG).performClick()
        compose.waitUntil { compose.onAllNodesWithText(localized("Cancel")).fetchSemanticsNodes().isNotEmpty() }
        compose.waitForIdle()
        assertTrue("the card is away under the open search", compose.onAllNodes(card).fetchSemanticsNodes().isEmpty())

        compose.mainClock.autoAdvance = false
        compose.onNodeWithText(localized("Cancel")).performClick()
        val tops = eachFrame(20) { frames.top!! }
        compose.mainClock.autoAdvance = true
        compose.waitForIdle()
        assertTrue("the card is back", compose.onAllNodes(card).fetchSemanticsNodes().isNotEmpty())
        tops.forEachIndexed { frame, top ->
            assertEquals("the top on frame $frame of ${tops.map { it.height }}", withCard.height, top.height, 0.5)
            assertEquals("the top on frame $frame", withCard.y, top.y, 0.5)
        }
        assertEquals("the top at rest", withCard.height, frames.top!!.height, 0.5)
    }

    @Test
    fun aBannerMovesTheCardUnderItOnTheSpringAndItsTopIsTheStacksAtOnce() {
        val clock = TestClock()
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421))))
        api.setFailure(ScooterAPIError.Offline())
        val model = controllers.make(api, clock, locationManager = FakeLocationManager(ScooterAuthorizationStatus.Denied))
        model.focusOnUser()
        assertTrue(controllers.waitUntil(attempts = 700) { model.locationIssue.value == ScooterLocationIssue.Denied && !model.isLocating.value })
        show(model, clock)
        val card = compose.onNode(hasText(ScooterLocationIssue.Denied.title!!))
        fun cardTop() = card.fetchSemanticsNode().boundsInRoot.top / compose.density.density
        val alone = cardTop()
        val short = frames.top!!.height

        // The first load fails: the banner comes over the card.
        compose.mainClock.autoAdvance = false
        compose.runOnIdle { model.updateViewport(zurichRegion, zoom = 16) }
        assertTrue(controllers.waitUntil { model.loadIssue.value is ScooterLoadIssue.FirstLoadFailed && !model.isLoading.value })
        val down = eachFrame(30) { cardTop() to frames.top!!.height }
        compose.mainClock.autoAdvance = true
        compose.waitForIdle()
        val under = cardTop()
        val tall = frames.top!!.height

        // It loads again: the banner goes.
        compose.mainClock.autoAdvance = false
        api.setFailure(null)
        compose.runOnIdle { model.retryLoad() }
        assertTrue(controllers.waitUntil { model.loadIssue.value == null && !model.isLoading.value })
        val up = eachFrame(30) { cardTop() to frames.top!!.height }
        compose.mainClock.autoAdvance = true
        compose.waitForIdle()

        assertTrue("the banner came: $short to $tall", tall > short + 40)
        // The banner's height is known once it is drawn.
        assertEquals("the top by the second frame", tall, down[1].second, 0.5)
        assertEquals("the top on the next frame", short, up.first().second, 0.5)
        assertEquals("the card back where it was alone", alone, cardTop(), 0.5f)
        assertMovesOnTheSpring("down", alone, down.map { it.first }, under)
        assertMovesOnTheSpring("up", under, up.map { it.first }, alone)
    }

    /**
     * The card's [tops], frame by frame, as it moves on the notices' spring [from] one place [to] another: a spring
     * from rest moves a few points in its first frame, so neither a notice nor the space under it comes or goes in
     * one step; and the card neither holds where it was nor jumps at the end.
     */
    private fun assertMovesOnTheSpring(name: String, from: Float, tops: List<Float>, to: Float) {
        val all = listOf(from) + tops
        val first = all.zipWithNext().first { (a, b) -> abs(b - a) > 0.5f }
        assertTrue("$name: the card's first step, ${first.first} to ${first.second}, of $all", abs(first.second - first.first) < 5)
        assertTrue("$name: the card at ${all[8]} on its way from $from to $to", abs(all[8] - from) > 10 && abs(all[8] - to) > 2)
        assertEquals("$name: the card from its 20th frame, of $all", to, all[20], 1f)
    }

    /** [read] on each of the next [count] frames. */
    private fun <T> eachFrame(count: Int, read: () -> T): List<T> = List(count) {
        compose.mainClock.advanceTimeByFrame()
        compose.waitForIdle()
        read()
    }

    /** The closed search bar's height in points. */
    private fun barHeight(): Double =
        compose.onNodeWithTag(SEARCH_ISLAND_TAG).fetchSemanticsNode().boundsInRoot.height.toDouble() / compose.density.density

    /** The screen of [model], with the map's stand-in reading the chrome's frames. */
    private fun show(model: ScooterMapController, clock: TestClock) {
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = { frames = LocalMapChrome.current!! }, glassBlurs = false)
            }
        }
        compose.waitForIdle()
    }
}
