package com.plhery.scootradar.ui.chrome

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.junit4.createComposeRule
import com.plhery.scootradar.FakeLocationManager
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterAuthorizationStatus
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.LocalClock
import com.plhery.scootradar.ui.ScooterMapScreen
import com.plhery.scootradar.ui.theme.Look
import com.plhery.scootradar.ui.theme.PHONE
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.screenshot
import com.plhery.scootradar.ui.theme.useFontScale
import com.plhery.scootradar.zurichRegion
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.util.Locale

/**
 * The location card under the search bar (ui.md UI-095, UI-162 to UI-164) in each of its states, as Near me reaches
 * them, light and dark, at font scale 1.0 and 2.0, over a plain stand-in for the map and Zürich's scooters loaded.
 */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = PHONE)
class LocationCardScreenshotTest(private val issue: ScooterLocationIssue, private val look: Look) {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()

    @Before
    fun setUp() {
        Locale.setDefault(Locale.forLanguageTag("en-CH"))
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        controllers.close()
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
    }

    @Test
    fun locationCard() {
        val clock = TestClock()
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
        model.setAppearance(if (look.dark) ScooterAppearance.Dark else ScooterAppearance.Light)
        useFontScale(look.fontScale)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = { dark -> MapStandIn(dark) }, glassBlurs = false)
            }
        }
        compose.waitForIdle()
        compose.screenshot("location/${issue.name.replaceFirstChar { it.lowercase() }}_${look.suffix}")
    }

    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0} {1}")
        fun parameters(): List<Array<Any>> = ScooterLocationIssue.entries.flatMap { issue -> Look.entries.map { arrayOf(issue, it) } }
    }
}

/** The map's ground, light or dark, without its streets. */
@Composable
private fun MapStandIn(dark: Boolean) {
    Box(Modifier.fillMaxSize().background(if (dark) Color(0xFF2B2D30) else Color(0xFFF1EFEA)))
}
