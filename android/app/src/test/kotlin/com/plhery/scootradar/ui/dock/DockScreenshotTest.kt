package com.plhery.scootradar.ui.dock

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.junit4.createComposeRule
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.dock
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLoadIssue
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterResponseMetadata
import com.plhery.scootradar.core.model.addingTimeInterval
import com.plhery.scootradar.lungernRegion
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
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale
import java.util.TimeZone

/**
 * The phone's screen in each of the dock's states (ui.md §3), light and dark, at font scale 1.0 and 2.0, over a
 * plain stand-in for the map and with the fill in place of the glass's blur.
 */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = PHONE)
class DockScreenshotTest(private val state: DockState, private val look: Look) {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
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
        controllers.close()
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        Locale.setDefault(locale)
        TimeZone.setDefault(timeZone)
    }

    @Test
    fun dock() {
        val clock = TestClock()
        val model = state.make(controllers, clock)
        model.setAppearance(if (look.dark) ScooterAppearance.Dark else ScooterAppearance.Light)
        useFontScale(look.fontScale)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = { dark -> MapStandIn(dark) }, glassBlurs = false)
            }
        }
        compose.waitForIdle()
        compose.screenshot("dock/${state.fileName}_${look.suffix}")
    }

    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0} {1}")
        fun parameters(): List<Array<Any>> = DockState.entries.flatMap { state -> Look.entries.map { arrayOf(state, it) } }
    }
}

/** The map's ground, light or dark, without its streets. */
@androidx.compose.runtime.Composable
private fun MapStandIn(dark: Boolean) {
    Box(Modifier.fillMaxSize().background(if (dark) Color(0xFF2B2D30) else Color(0xFFF1EFEA)))
}

/** The dock's states, each as the iPhone's test of the dock reaches it (T212). */
enum class DockState {
    Finding {
        override fun reach(model: ScooterMapController, api: StubScooterAPI, controllers: TestControllers, clock: TestClock) = Unit
    },
    Summary {
        override fun reach(model: ScooterMapController, api: StubScooterAPI, controllers: TestControllers, clock: TestClock) {
            load(model, api, controllers)
        }
    },
    Nearest {
        override fun reach(model: ScooterMapController, api: StubScooterAPI, controllers: TestControllers, clock: TestClock) {
            model.setUserLocation(GeoPoint(47.3779, 8.5417))
            load(model, api, controllers)
        }
    },
    ProviderChosen {
        override fun reach(model: ScooterMapController, api: StubScooterAPI, controllers: TestControllers, clock: TestClock) {
            load(model, api, controllers)
            model.showProviders(setOf(ScooterProvider.Lime))
        }
    },
    FiltersHideEverything {
        override fun reach(model: ScooterMapController, api: StubScooterAPI, controllers: TestControllers, clock: TestClock) {
            load(model, api, controllers)
            model.showProviders(setOf(ScooterProvider.Pony))
        }
    },
    RefreshFailed {
        override fun reach(model: ScooterMapController, api: StubScooterAPI, controllers: TestControllers, clock: TestClock) {
            load(model, api, controllers)
            api.setFailure(ScooterAPIError.Offline())
            model.retryLoad()
            assertTrue(controllers.waitUntil { api.calls == 2 && model.loadIssue.value != null && !model.isLoading.value })
        }
    },
    OutOfDate {
        override fun reach(model: ScooterMapController, api: StubScooterAPI, controllers: TestControllers, clock: TestClock) {
            RefreshFailed.reach(model, api, controllers, clock)
            clock.advance(400.0)
            model.retryLoad()
            assertTrue(
                controllers.waitUntil {
                    api.calls == 3 && model.loadIssue.value is ScooterLoadIssue.OutOfDate && !model.isLoading.value
                },
            )
        }
    },
    OutsideCoverage {
        override fun make(controllers: TestControllers, clock: TestClock): ScooterMapController {
            val api = StubScooterAPI(ScooterResponse(vehicles = emptyList()))
            val model = controllers.make(api, clock)
            model.updateViewport(lungernRegion, zoom = 14)
            assertTrue(controllers.waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value })
            return model
        }
    },
    Waiting {
        override fun make(controllers: TestControllers, clock: TestClock): ScooterMapController {
            val api = StubScooterAPI(ScooterResponse(vehicles = emptyList()))
            api.setFailure(ScooterAPIError.HttpStatus(503))
            val model = controllers.make(api, clock)
            model.refresh()
            assertTrue(controllers.waitUntil { api.calls == 1 && model.loadIssue.value != null && !model.isLoading.value })
            return model
        }
    },
    ;

    val fileName: String get() = name.replaceFirstChar { it.lowercase() }

    /** A controller in this state, on `controllers`, at `clock`'s time. */
    open fun make(controllers: TestControllers, clock: TestClock): ScooterMapController {
        val api = StubScooterAPI(zurich(clock))
        val model = controllers.make(api, clock)
        reach(model, api, controllers, clock)
        check(model.dock.kind == expectedKind) { "$this: ${model.dock}" }
        return model
    }

    protected open fun reach(model: ScooterMapController, api: StubScooterAPI, controllers: TestControllers, clock: TestClock) = Unit

    private val expectedKind: String
        get() = when (this) {
            Finding -> "finding"
            Summary, Nearest, ProviderChosen, RefreshFailed -> "summary"
            FiltersHideEverything -> "filtersHideEverything"
            OutOfDate -> "outOfDate"
            OutsideCoverage -> "outsideCoverage"
            Waiting -> "waiting"
        }
}

/** The first load over Zürich's centre at a street's zoom. */
private fun load(model: ScooterMapController, api: StubScooterAPI, controllers: TestControllers) {
    model.updateViewport(zurichRegion, zoom = 16)
    assertTrue(controllers.waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value })
}

/**
 * Zürich as T212 has it, with a few more scooters so the chips have counts: a partial answer, cut short, with a
 * bay whose data is old.
 */
private fun zurich(clock: TestClock) = ScooterResponse(
    vehicles = listOf(
        scooter(id = "a", provider = "lime", latitude = 47.3772, longitude = 8.5421),
        scooter(id = "b", provider = "lime", latitude = 47.3760, longitude = 8.5410),
        scooter(id = "c", provider = "bird", latitude = 47.3775, longitude = 8.5402, battery = null),
        scooter(id = "d", provider = "voi", latitude = 47.3765, longitude = 8.5430),
        scooter(id = "e", provider = "bolt", latitude = 47.3781, longitude = 8.5415),
    ),
    meta = ScooterResponseMetadata(
        partial = true,
        failedSources = listOf("national:voi_zurich"),
        generatedAt = iso(clock.now),
        truncated = true,
        totalVehicles = 5_412,
        parkingStatus = "stale",
        expiresAt = iso(clock.now.addingTimeInterval(300.0)),
    ),
    parking = listOf(
        ScooterParking(id = "dott:bay", provider = "dott", name = "Rue Faidherbe", latitude = 47.3769, longitude = 8.5417, mandatory = true),
    ),
)

private fun iso(date: Instant): String = DateTimeFormatter.ISO_INSTANT.format(date.truncatedTo(ChronoUnit.SECONDS))
