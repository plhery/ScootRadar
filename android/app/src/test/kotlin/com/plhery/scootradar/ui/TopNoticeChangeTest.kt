package com.plhery.scootradar.ui

import android.content.Context
import android.graphics.Bitmap
import android.provider.Settings
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
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.test.core.app.ApplicationProvider
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
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLoadIssue
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.map.LocalMapChrome
import com.plhery.scootradar.map.MapChromeFrames
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.chrome.LOCATION_CARD_TAG
import com.plhery.scootradar.ui.chrome.STATUS_BANNER_TAG
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

// Review-app-r, nits 2 and 4. ScooterMapScreen.swift:247-248 animates a change of the banner's failure or the card's
// issue with `.snappy(duration: 0.28)` (nil under Reduce Motion), the notice keeping its identity: SwiftUI eases its
// frame to the new height and cross-fades what it says. :227 takes the whole notices block away as the search opens,
// and SwiftUI draws a view it takes away as it was while it fades.

/**
 * A notice that changes while it shows: its words fade into the new ones and its height eases to the new one's on the
 * notices' spring, while the top handed to the map takes the new height from the first frame, as the iPhone's
 * onGeometryChange reads the layout. And the search opened from the card fades the notices as they were.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "w443dp-h970dp-mdpi")
class TopNoticeChangeTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale
    private val resolver = ApplicationProvider.getApplicationContext<Context>().contentResolver
    private val animatorScale = Settings.Global.getFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f)
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
        Settings.Global.putFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, animatorScale)
    }

    /**
     * The NotFound card becomes the Denied one, which has a title and two actions: the card's height eases to the
     * taller one's on the notices' spring, its words fade into the new ones over frames, and the top handed to the map
     * is the new one's from the first frame.
     */
    @Test
    fun aCardChangingKindFadesIntoTheNewOneAndEasesItsHeight() {
        val (model, location) = notFoundCard()
        val before = card()
        val topBefore = frames.top!!.height
        val shownBefore = band()

        val film = change {
            location.authorization = ScooterAuthorizationStatus.Denied
            model.locationFailed(ScooterLocationError.Denied)
        }.film { card() }
        val after = card()
        val topAfter = frames.top!!.height
        val shownAfter = band()
        assertTrue("the Denied card is taller: ${before.height} to ${after.height}", after.height > before.height + 8)
        assertEquals("the top grows by the card's growth", after.height - before.height, (topAfter - topBefore).toFloat(), 0.5f)

        // The card's height on the spring, from the NotFound card's to the Denied one's.
        assertOnTheSpring("the card's height", film.map { it.notice.height.toDouble() }, before.height.toDouble(), after.height.toDouble(), within = 1.0)
        // The map's top at the new height, not on the spring: from the second frame, as for any notice measured anew,
        // the height read in one frame's layout being handed over in the next.
        assertTrue("the top on each frame, ${film.map { it.top }}, at $topAfter", film.drop(1).all { abs(it.top - topAfter) < 0.5 })
        // Its words fade: frame by frame, where the words' pixels are between the old card's and the new one's.
        val words = Rect(before.left + 64, before.top + 6, before.right - 48, before.top + 44)
        val along = film.map { blend(it.band, shownBefore, shownAfter, words) }
        assertTrue("the words on their way on the first frames: $along", along.take(6).count { it in 0.1..0.9 } >= 3)
        assertEquals("the words settled: $along", 1.0, along.last(), 0.02)
    }

    /** Under Reduce Motion, which the iPhone's nil animation is, the card is the new one in one frame. */
    @Test
    fun underReduceMotionACardChangingKindChangesInOneFrame() {
        Settings.Global.putFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 0f)
        val (model, location) = notFoundCard()
        val before = card()
        val shownBefore = band()
        val film = change {
            location.authorization = ScooterAuthorizationStatus.Denied
            model.locationFailed(ScooterLocationError.Denied)
        }.film { card() }
        val after = card()
        val shownAfter = band()
        assertTrue("the card's heights ${film.map { it.notice.height }} at ${after.height}", film.all { abs(it.notice.height - after.height) < 0.5f })
        val words = Rect(before.left + 64, before.top + 6, before.right - 48, before.top + 44)
        val along = film.map { blend(it.band, shownBefore, shownAfter, words) }
        assertTrue("the words: $along", along.all { abs(it - 1) < 0.02 })
    }

    /**
     * The banner's reason changes, Offline to Timeout, as Try again fails again: the old words fade out as the new ones
     * fade in, and the banner stays where it is.
     */
    @Test
    fun aBannerWhoseReasonChangesFadesIntoTheNewOne() {
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421))))
        api.setFailure(ScooterAPIError.Offline())
        val model = controllers.make(api, TestClock(), locationManager = FakeLocationManager(ScooterAuthorizationStatus.Denied))
        show(model)
        compose.runOnIdle { model.updateViewport(zurichRegion, zoom = 16) }
        assertTrue(controllers.waitUntil { model.loadIssue.value is ScooterLoadIssue.FirstLoadFailed && !model.isLoading.value })
        compose.waitForIdle()
        val before = banner()
        val shownBefore = band()
        assertTrue(compose.onAllNodes(hasText(ScooterLoadFailure.Offline.message)).fetchSemanticsNodes().isNotEmpty())

        api.setFailure(ScooterAPIError.TimedOut())
        val film = change { model.retryLoad() }.also {
            assertTrue(controllers.waitUntil { (model.loadIssue.value as? ScooterLoadIssue.FirstLoadFailed)?.failure == ScooterLoadFailure.Timeout && !model.isLoading.value })
        }.film { banner() }
        val shownAfter = band()
        assertTrue(compose.onAllNodes(hasText(ScooterLoadFailure.Timeout.message)).fetchSemanticsNodes().isNotEmpty())
        assertTrue("the banner stays: ${film.map { it.notice.top }} at ${before.top}", film.all { abs(it.notice.top - before.top) < 0.5f })
        // The reason, left of the Try again button.
        val words = Rect(before.left + 34, before.top + 4, before.right - 110, before.bottom - 4)
        val along = film.map { blend(it.band, shownBefore, shownAfter, words) }
        assertTrue("the words on their way on the first frames: $along", along.take(6).count { it in 0.1..0.9 } >= 3)
        assertEquals("the words settled: $along", 1.0, along.last(), 0.02)
    }

    /**
     * The card's Search a place, under a banner: the card goes as the search opens, and the notices fade with the
     * search as they were, the card where it was on every frame it shows, as the iPhone takes the whole block away. It
     * doesn't slide up out of its place inside the fading block.
     */
    @Test
    fun theSearchOpenedFromTheCardFadesTheNoticesAsTheyWere() {
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421))))
        api.setFailure(ScooterAPIError.Offline())
        val model = controllers.make(api, TestClock(), locationManager = FakeLocationManager(ScooterAuthorizationStatus.Denied))
        show(model)
        compose.runOnIdle {
            model.updateViewport(zurichRegion, zoom = 16)
            model.locationFailed(ScooterLocationError.Denied)
        }
        assertTrue(controllers.waitUntil { model.loadIssue.value is ScooterLoadIssue.FirstLoadFailed && !model.isLoading.value })
        assertTrue(controllers.waitUntil { model.locationIssue.value == ScooterLocationIssue.Denied })
        compose.waitForIdle()
        val cardRest = card()
        val bannerRest = banner()

        compose.mainClock.autoAdvance = false
        compose.onNode(hasText("Search a place")).performClick()
        val film = List(30) {
            compose.mainClock.advanceTimeByFrame()
            compose.waitForIdle()
            top(LOCATION_CARD_TAG) to top(STATUS_BANNER_TAG)
        }
        compose.mainClock.autoAdvance = true
        compose.waitForIdle()
        assertEquals(null, model.locationIssue.value)
        assertTrue("the card shows as the block fades: ${film.map { it.first }}", film.take(5).all { it.first != null })
        assertTrue("the card where it was, ${cardRest.top}: ${film.map { it.first }}", film.all { it.first == null || abs(it.first!! - cardRest.top) < 0.5f })
        assertTrue("the banner where it was, ${bannerRest.top}: ${film.map { it.second }}", film.all { it.second == null || abs(it.second!! - bannerRest.top) < 0.5f })
    }

    /** One frame: the notice's frame, the top handed to the map, and the screen's top. */
    private class Frame(val notice: Rect, val top: Double, val band: Bitmap)

    /** [action] on the screen's thread with the clock held, and the clock then moved by hand. */
    private fun change(action: () -> Unit): Changed {
        compose.mainClock.autoAdvance = false
        compose.runOnIdle(action)
        return Changed()
    }

    private inner class Changed {
        /** 30 frames of where [notice] is, the top and the screen's top, then the screen at rest. */
        fun film(notice: () -> Rect): List<Frame> {
            val film = List(30) {
                compose.mainClock.advanceTimeByFrame()
                compose.waitForIdle()
                Frame(notice(), frames.top!!.height, band())
            }
            compose.mainClock.autoAdvance = true
            compose.waitForIdle()
            return film
        }
    }

    /** The screen with a NotFound card: Near me found nothing in time. */
    private fun notFoundCard(): Pair<ScooterMapController, FakeLocationManager> {
        val clock = TestClock()
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421))))
        val location = FakeLocationManager(ScooterAuthorizationStatus.AuthorizedWhenInUse)
        val model = controllers.make(api, clock, locationManager = location)
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { model.lastUpdated.value != null && !model.isLoading.value })
        model.focusOnUser()
        assertTrue(controllers.waitUntil(attempts = 700) { model.locationIssue.value == ScooterLocationIssue.NotFound && !model.isLocating.value })
        show(model, clock)
        return model to location
    }

    /** The notices' spring from [from] to [to] over the frames, starting in one of the first: none further than [within]. */
    private fun assertOnTheSpring(name: String, values: List<Double>, from: Double, to: Double, within: Double) {
        val spring = TargetBasedAnimation(IosMotion.snappy(duration = 0.28).animation<Float>(), Float.VectorConverter, 0f, 1f)
        val expected = { frame: Int -> from + (to - from) * spring.getValueFromNanos(max(0, frame) * 16 * 1_000_000L) }
        val misses = (0..3).associateWith { late -> values.indices.maxOf { abs(values[it] - expected(it + 1 - late)) } }
        assertTrue("$name: ${values.map { "%.1f".format(it) }}, misses by $misses", misses.values.min() < within)
    }

    /**
     * How far [now] has come in [region] from [before] to [after]: 0 where it shows the old pixels, 1 the new, the
     * least-squares share over the region.
     */
    private fun blend(now: Bitmap, before: Bitmap, after: Bitmap, region: Rect): Double {
        var along = 0.0
        var whole = 0.0
        for (y in region.top.toInt() until min(region.bottom.toInt(), now.height)) {
            for (x in region.left.toInt() until min(region.right.toInt(), now.width)) {
                val n = now.getPixel(x, y)
                val b = before.getPixel(x, y)
                val a = after.getPixel(x, y)
                for (shift in intArrayOf(16, 8, 0)) {
                    val base = (b shr shift) and 0xFF
                    val d = ((a shr shift) and 0xFF) - base
                    along += (((n shr shift) and 0xFF) - base).toDouble() * d
                    whole += d.toDouble() * d
                }
            }
        }
        return along / whole
    }

    /** Where the card is, in points. */
    private fun card(): Rect = bounds(LOCATION_CARD_TAG)!!

    /** Where the banner is, in points. */
    private fun banner(): Rect = bounds(STATUS_BANNER_TAG)!!

    private fun top(tag: String): Float? = bounds(tag)?.top

    private fun bounds(tag: String): Rect? {
        val node = compose.onAllNodes(SemanticsMatcher.expectValue(SemanticsProperties.TestTag, tag), useUnmergedTree = true)
            .fetchSemanticsNodes().firstOrNull() ?: return null
        val density = compose.density.density
        return node.boundsInRoot.let { Rect(it.left / density, it.top / density, it.right / density, it.bottom / density) }
    }

    /** The screen's top, where the search bar and the notices are, as drawn now; at mdpi a pixel is a point. */
    private fun band(): Bitmap {
        compose.putFramesOnSurfaces()
        val window = compose.onRoot().captureToImage().asAndroidBitmap()
        return Bitmap.createBitmap(window, 0, 0, window.width, min(window.height, 400))
    }

    /** The screen of [model] over a plain ground, with the map's stand-in reading the chrome's frames. */
    private fun show(model: ScooterMapController, clock: TestClock = TestClock()) {
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
    }
}
