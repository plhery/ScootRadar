package com.plhery.scootradar.ui.dock

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.junit4.createComposeRule
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.LocalClock
import com.plhery.scootradar.ui.ScooterMapScreen
import com.plhery.scootradar.ui.theme.Look
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.screenshot
import com.plhery.scootradar.ui.theme.useFontScale
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone

/**
 * A large window's screen with the panel (ui.md §3, UI-007, UI-108, UI-113), light and dark, at font scale 1.0 and
 * 2.0, over a plain stand-in for the map: a tablet's window across and upright, and an unfolded foldable's. Upright
 * with large text the tablet's 800 dp leave too little map beside the 420 dp panel, and the window has the dock.
 * At one dp to the pixel, so that the baselines stay the size of a phone's.
 */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class PanelScreenshotTest(private val state: PanelState, private val look: Look) {
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

    /** A 10-inch tablet held across. */
    @Test
    @Config(qualifiers = "w1280dp-h800dp-mdpi")
    fun across() = panel("across")

    /** The same tablet upright. */
    @Test
    @Config(qualifiers = "w800dp-h1280dp-mdpi")
    fun upright() = panel("upright")

    /** A foldable's inner screen, unfolded. */
    @Test
    @Config(qualifiers = "w850dp-h880dp-mdpi")
    fun unfolded() = panel("unfolded")

    private fun panel(window: String) {
        val clock = TestClock()
        val model = state.make(controllers, clock)
        model.setAppearance(if (look.dark) ScooterAppearance.Dark else ScooterAppearance.Light)
        useFontScale(look.fontScale)
        compose.setContent {
            // The coverage card's counts as when the baselines were recorded (LOG-370).
            CompositionLocalProvider(LocalClock provides { clock.now }, LocalCoverageCounts provides (1_061 to 56)) {
                ScooterMapScreen(controller = model, map = { dark -> MapStandIn(dark) }, glassBlurs = false)
            }
        }
        compose.waitForIdle()
        compose.screenshot("panel/${window}_${state.fileName}_${look.suffix}")
    }

    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0} {1}")
        fun parameters(): List<Array<Any>> = PanelState.entries.flatMap { state -> Look.entries.map { arrayOf(state, it) } }
    }
}

/** The map's ground, light or dark, without its streets. */
@androidx.compose.runtime.Composable
private fun MapStandIn(dark: Boolean) {
    Box(Modifier.fillMaxSize().background(if (dark) Color(0xFF2B2D30) else Color(0xFFF1EFEA)))
}

/** The panel's states: open on its list of providers, open on a scooter's card, and folded on that card. */
enum class PanelState {
    Providers {
        override fun make(controllers: TestControllers, clock: TestClock): ScooterMapController =
            DockState.Summary.make(controllers, clock)
    },
    Card {
        override fun make(controllers: TestControllers, clock: TestClock): ScooterMapController =
            DockState.ScooterCard.make(controllers, clock)
    },
    CardFolded {
        override fun make(controllers: TestControllers, clock: TestClock): ScooterMapController =
            DockState.ScooterCard.make(controllers, clock).also { it.setPanelCollapsed(true) }
    },
    ;

    val fileName: String get() = name.replaceFirstChar { it.lowercase() }

    /** A controller in this state, on `controllers`, at `clock`'s time. */
    abstract fun make(controllers: TestControllers, clock: TestClock): ScooterMapController
}
