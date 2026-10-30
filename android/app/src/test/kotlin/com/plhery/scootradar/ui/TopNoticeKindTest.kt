package com.plhery.scootradar.ui

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.FakeLocationManager
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.map.ScooterLocationError
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.map.LocalMapChrome
import com.plhery.scootradar.map.MapChromeFrames
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import com.plhery.scootradar.zurichRegion
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone

/**
 * A location card that changes kind while it is shown keeps its place in the top handed to the map on every frame, as
 * the iPhone's card keeps its identity and its place in the stack (ScooterMapScreen.swift:539-551).
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w443dp-h970dp-mdpi")
class TopNoticeKindTest {
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
    fun aCardChangingKindKeepsItsPlaceInTheTop() {
        val clock = TestClock()
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421))))
        val location = FakeLocationManager(ScooterAuthorizationStatus.AuthorizedWhenInUse)
        val model = controllers.make(api, clock, locationManager = location)
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { model.lastUpdated.value != null && !model.isLoading.value })
        model.focusOnUser()
        assertTrue(controllers.waitUntil(attempts = 700) { model.locationIssue.value == ScooterLocationIssue.NotFound && !model.isLocating.value })
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = { frames = LocalMapChrome.current!! }, glassBlurs = false)
            }
        }
        compose.waitForIdle()
        val bar = compose.onNodeWithTag(SEARCH_ISLAND_TAG).fetchSemanticsNode().boundsInRoot.height / compose.density.density
        val before = frames.top!!.height
        assertTrue("the top $before holds the NotFound card", before > bar + 8 + 20)

        compose.mainClock.autoAdvance = false
        compose.runOnIdle {
            location.authorization = ScooterAuthorizationStatus.Denied
            model.locationFailed(ScooterLocationError.Denied)
        }
        val tops = List(6) {
            compose.mainClock.advanceTimeByFrame()
            compose.waitForIdle()
            frames.top!!.height to compose.onAllNodes(hasText(ScooterLocationIssue.Denied.title!!)).fetchSemanticsNodes().isNotEmpty()
        }
        compose.mainClock.autoAdvance = true
        compose.waitForIdle()
        val after = frames.top!!.height
        assertTrue("every frame's top holds a card: bar $bar, before $before, after $after, frames $tops", tops.all { it.first > bar + 8 + 20 })
    }
}
