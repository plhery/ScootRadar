package com.plhery.scootradar.ui

import android.graphics.Bitmap
import androidx.compose.animation.core.TargetBasedAnimation
import androidx.compose.animation.core.VectorConverter
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.FakeLocationManager
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.api.ScooterLoadFailure
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterLocationError
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
import com.plhery.scootradar.ui.theme.animation
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
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

// UI-193: ScooterMapScreen.swift inserts the whole `HeightLimit { topNotices }` block when the first notice comes and
// takes it away with the last, in the dock (:227-241) and in the panel (:344-355), in the notices'
// `.animation(.snappy(duration: 0.28))`. SwiftUI runs the transition of the view that is inserted into a parent that
// stays: the block's, the default `.opacity`; a notice's own `.move(edge: .top).combined(with: .opacity)` (:536, :551)
// runs only when it joins or leaves another one already there. Lead decision, 30 Oct (PLAN.md §10).

/**
 * The first notice fades in where it rests and the last fades out where it was, on the notices' spring, and in the
 * panel the card under them moves on the same spring; a notice that joins another, or leaves it, slides from the top.
 * The banner of a first load that failed comes first, the location card joins it, the banner goes and the card goes
 * last. Over a plain ground, whose colour the notices fade from and to.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class TopNoticeMotionTest {
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

    /** The Fold folded, as the dock has it: the notices under the search bar, nothing under them. */
    @Test
    @Config(qualifiers = "w443dp-h970dp-mdpi")
    fun inTheDockTheFirstNoticeAndTheLastFadeWhereTheyAreAndOneJoiningAnotherSlides() {
        noticesComeAndGo(ScooterChromeLayout.Dock)
    }

    /** The Tablet across, as the panel has it: the notices between the search bar and the card, which moves for them. */
    @Test
    @Config(qualifiers = "w1280dp-h800dp-mdpi")
    fun inThePanelTheFirstNoticeAndTheLastFadeWhereTheyAreAndTheCardMovesForThemOnTheSpring() {
        noticesComeAndGo(ScooterChromeLayout.Panel)
    }

    private fun noticesComeAndGo(layout: ScooterChromeLayout) {
        val clock = TestClock()
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421))))
        api.setFailure(ScooterAPIError.Offline())
        val model = controllers.make(api, clock, locationManager = FakeLocationManager(ScooterAuthorizationStatus.Denied))
        show(model, clock)
        assertEquals(layout, frames.layout)
        val panel = layout == ScooterChromeLayout.Panel
        val banner = hasText(ScooterLoadFailure.Offline.message)
        val card = hasText(ScooterLocationIssue.Denied.title!!)

        // 1. The first load fails: its banner, the first notice, fades in where it rests.
        val dockAlone = dockTop()
        val coming = change { model.updateViewport(zurichRegion, zoom = 16) }.also {
            assertTrue(controllers.waitUntil { model.loadIssue.value is ScooterLoadIssue.FirstLoadFailed && !model.isLoading.value })
        }.film(banner, pixels = true)
        val bannerRest = top(banner)!!
        val bannerShown = band()
        assertTrue("the banner is there by the second frame", coming.drop(1).all { it.top != null })
        assertTrue("the banner where it rests: ${coming.map { it.top }} at $bannerRest", coming.all { it.top == null || abs(it.top - bannerRest) < 0.5f })
        assertFades("the banner coming", coming, region(banner), bannerShown, from = 0.0, to = 1.0, panel)
        if (panel) {
            val dockUnder = dockTop()
            assertTrue("the card moves down for the banner: $dockAlone to $dockUnder", dockUnder > dockAlone + 30)
            assertOnTheSpring("the card under the banner", coming.map { it.dock.toDouble() }, dockAlone.toDouble(), dockUnder.toDouble(), within = 1.0)
        }

        // 2. The location card joins it: it slides in from above its place, under the banner, which stays.
        val joining = change { model.locationFailed(ScooterLocationError.Denied) }.also {
            assertTrue(controllers.waitUntil { model.locationIssue.value == ScooterLocationIssue.Denied })
        }.film(card, banner)
        val cardUnder = top(card)!!
        assertTrue("the banner stays: ${joining.map { it.other }}", joining.all { abs(it.other!! - bannerRest) < 0.5f })
        val firstCard = joining.first { it.top != null }.top!!
        assertTrue("the card comes from above its place: $firstCard, then ${joining.map { it.top }}, to $cardUnder", firstCard < cardUnder - 20)
        assertEquals("the card at its place", cardUnder, joining.last().top!!, 0.5f)

        // 3. The banner goes as the first load is done: it slides up out of its place, and the card follows it up.
        api.setFailure(null)
        val leaving = change { model.retryLoad() }.also {
            assertTrue(controllers.waitUntil { model.loadIssue.value == null && !model.isLoading.value })
        }.film(banner, card)
        val going = leaving.filter { it.top != null }
        assertTrue("the banner slides up: ${going.map { it.top }} from $bannerRest", going.any { it.top!! < bannerRest - 10 })
        val cardAlone = top(card)!!
        assertEquals("the card in the banner's place", bannerRest, cardAlone, 12f)
        assertTrue("the card moves up: ${leaving.map { it.other }}", leaving.any { it.other!! > cardAlone + 5 && it.other < cardUnder - 5 })

        // 4. The card, the last notice, goes: it fades out where it was, and the panel's card rises on the spring.
        val cardShown = band()
        // Its title's line, which the panel's card rising over it reaches last.
        val cardRegion = region(card, rows = 20f)
        val dockUnderCard = dockTop()
        val last = change { model.dismissLocationIssue() }.also {
            assertTrue(controllers.waitUntil { model.locationIssue.value == null })
        }.film(card, pixels = true)
        assertTrue("the card is still there as it goes", last.first().top != null)
        assertTrue("the card where it was: ${last.map { it.top }} at $cardAlone", last.all { it.top == null || abs(it.top - cardAlone) < 0.5f })
        assertFades("the card going", last, cardRegion, cardShown, from = 1.0, to = 0.0, panel)
        assertTrue("the card is gone once it has faded", top(card) == null)
        if (panel) {
            assertOnTheSpring("the card rising", last.map { it.dock.toDouble() }, dockUnderCard.toDouble(), dockAlone.toDouble(), within = 1.0)
        }
    }

    /** One frame of a change: where [Frame.top] a notice is and [Frame.other] another, the dock, and the screen's top. */
    private class Frame(val top: Float?, val other: Float?, val dock: Float, val band: Bitmap?)

    /** [action] on the screen's thread with the clock held, and the clock then moved by hand. */
    private fun change(action: () -> Unit): Changed {
        compose.mainClock.autoAdvance = false
        compose.runOnIdle(action)
        return Changed()
    }

    private inner class Changed {
        /** 30 frames of what [notice] and [other] do, with the screen's top's [pixels] if asked, then the screen at rest. */
        fun film(notice: SemanticsMatcher, other: SemanticsMatcher? = null, pixels: Boolean = false): List<Frame> {
            val film = List(30) {
                compose.mainClock.advanceTimeByFrame()
                compose.waitForIdle()
                Frame(top(notice), other?.let(::top), dockTop(), if (pixels) band() else null)
            }
            compose.mainClock.autoAdvance = true
            compose.waitForIdle()
            return film
        }
    }

    /**
     * The notice's opacity in [region], frame by frame, follows the notices' spring [from] one value [to] the other:
     * read in each frame as where its pixels are between the ground's colour and the notice [shown] at rest. In the
     * panel the card under the notices is drawn over them where it moves through them; those frames are left out, and
     * fewer are read.
     */
    private fun assertFades(name: String, film: List<Frame>, region: Rect, shown: Bitmap, from: Double, to: Double, panel: Boolean) {
        val opacity = film.map { frame -> if (frame.dock < region.bottom) null else opacity(frame.band!!, shown, region) }
        val read = opacity.filterNotNull()
        assertTrue("$name: the frames read, $opacity", read.size >= if (panel) 4 else 25)
        assertTrue("$name: on its way, $opacity", read.count { abs(it - from) > 0.1 && abs(it - to) > 0.1 } >= if (panel) 2 else 4)
        assertOnTheSpring("$name's opacity", opacity, from, to, within = 0.08)
    }

    /**
     * The [values] of 30 frames, as the notices' spring goes [from] one value [to] the other, starting in one of the
     * first frames: none further than [within] from it. Null values are not read.
     */
    private fun assertOnTheSpring(name: String, values: List<Double?>, from: Double, to: Double, within: Double) {
        val spring = TargetBasedAnimation(IosMotion.snappy(duration = 0.28).animation<Float>(), Float.VectorConverter, 0f, 1f)
        val expected = { frame: Int -> from + (to - from) * spring.getValueFromNanos(max(0, frame) * 16 * 1_000_000L) }
        val misses = (0..3).associateWith { late ->
            values.indices.filter { values[it] != null }.maxOf { abs(values[it]!! - expected(it + 1 - late)) }
        }
        assertTrue("$name: ${values.map { it?.let { v -> "%.2f".format(v) } }}, misses by $misses", misses.values.min() < within)
    }

    /**
     * How far the notice has come in [region] of [band]: 0 where it shows the plain ground, 1 where it shows the notice
     * as [shown] has it, the least-squares share over the region's pixels.
     */
    private fun opacity(band: Bitmap, shown: Bitmap, region: Rect): Double {
        val ground = GROUND.toArgb()
        var along = 0.0
        var whole = 0.0
        for (y in region.top.toInt() until region.bottom.toInt()) {
            for (x in region.left.toInt() until region.right.toInt()) {
                val now = band.getPixel(x, y)
                val full = shown.getPixel(x, y)
                for (shift in intArrayOf(16, 8, 0)) {
                    val g = (ground shr shift) and 0xFF
                    val d = ((full shr shift) and 0xFF) - g
                    along += (((now shr shift) and 0xFF) - g).toDouble() * d
                    whole += d.toDouble() * d
                }
            }
        }
        return along / whole
    }

    /**
     * Where the node of [matcher] is, or its first [rows] of pixels, in the band, inside it: its text is where the
     * notice is read.
     */
    private fun region(matcher: SemanticsMatcher, rows: Float = Float.MAX_VALUE): Rect {
        val bounds = compose.onNode(matcher).fetchSemanticsNode().boundsInRoot
        return Rect(bounds.left, bounds.top, min(bounds.right, BAND_WIDTH.toFloat()), minOf(bounds.bottom, bounds.top + rows, BAND_HEIGHT.toFloat()))
    }

    /** The top of the node of [matcher] in points, or null while there is none. */
    private fun top(matcher: SemanticsMatcher): Float? =
        compose.onAllNodes(matcher).fetchSemanticsNodes().firstOrNull()?.let { it.boundsInRoot.top / compose.density.density }

    /** The top of the dock's card in points. */
    private fun dockTop(): Float = compose.onNodeWithTag(DOCK_TAG).fetchSemanticsNode().boundsInRoot.top / compose.density.density

    /** The screen's top left, where the search bar, the notices and the panel are, as drawn now. */
    private fun band(): Bitmap {
        compose.putFramesOnSurfaces()
        val window = compose.onRoot().captureToImage().asAndroidBitmap()
        return Bitmap.createBitmap(window, 0, 0, min(window.width, BAND_WIDTH), min(window.height, BAND_HEIGHT))
    }

    /** The screen of [model] over a plain ground, with the map's stand-in reading the chrome's frames. */
    private fun show(model: ScooterMapController, clock: TestClock) {
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(
                    controller = model,
                    map = {
                        frames = LocalMapChrome.current!!
                        Box(Modifier.fillMaxSize().background(GROUND))
                    },
                    glassBlurs = false,
                )
            }
        }
        compose.waitForIdle()
    }

    private companion object {
        /** DockMotionRecording's plain ground. */
        val GROUND = Color(0xFF1B2230)
        const val BAND_WIDTH = 460
        const val BAND_HEIGHT = 420
    }
}
