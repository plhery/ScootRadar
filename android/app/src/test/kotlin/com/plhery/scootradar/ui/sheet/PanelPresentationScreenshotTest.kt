package com.plhery.scootradar.ui.sheet

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLinks
import com.plhery.scootradar.ui.LocalClock
import com.plhery.scootradar.ui.ScooterMapScreen
import com.plhery.scootradar.ui.dock.DockState
import com.plhery.scootradar.ui.dock.LocalCoverageCounts
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
 * Filters and Settings beside the panel (ui.md UI-061, UI-071, UI-129, UI-130): the popover under the search bar's
 * Filters button and the form at the trailing side, opened from the screen as a rider opens them, light and dark, at
 * font scale 1.0 and 2.0, over a plain stand-in for the map: a tablet's window across and upright, and an unfolded
 * foldable's. Upright with large text the window has the dock, and with it the sheets. At one dp to the pixel, as
 * the panel's baselines are.
 */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class PanelPresentationScreenshotTest(private val presentation: Presentation, private val look: Look) {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale
    private val appVersion = ScooterLinks.appVersion

    @Before
    fun setUp() {
        val swiss = Locale.forLanguageTag("en-CH")
        Locale.setDefault(swiss)
        ScooterLanguage.launchLocale = { swiss }
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Zurich"))
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
        ScooterLanguage.current = ScooterLanguage.En
        ScooterLinks.appVersion = "1.2.0"
    }

    @After
    fun tearDown() {
        controllers.close()
        resetFontScale()
        ScooterLinks.appVersion = appVersion
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        Locale.setDefault(locale)
        TimeZone.setDefault(timeZone)
    }

    /** A 10-inch tablet held across. */
    @Test
    @Config(qualifiers = "w1280dp-h800dp-mdpi")
    fun across() = open("across")

    /** The same tablet upright. */
    @Test
    @Config(qualifiers = "w800dp-h1280dp-mdpi")
    fun upright() = open("upright")

    /** A foldable's inner screen, unfolded. */
    @Test
    @Config(qualifiers = "w850dp-h880dp-mdpi")
    fun unfolded() = open("unfolded")

    private fun open(window: String) {
        val clock = TestClock()
        val model = DockState.Summary.make(controllers, clock)
        model.setAppearance(if (look.dark) ScooterAppearance.Dark else ScooterAppearance.Light)
        useFontScale(look.fontScale)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }, LocalCoverageCounts provides (1_061 to 56)) {
                ScooterMapScreen(controller = model, map = { dark -> MapStandIn(dark) }, glassBlurs = false)
            }
        }
        compose.waitForIdle()
        compose.onNodeWithContentDescription(presentation.button).performClick()
        compose.waitForIdle()
        compose.screenshot("panel/${window}_${presentation.fileName}_${look.suffix}")
    }

    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0} {1}")
        fun parameters(): List<Array<Any>> = Presentation.entries.flatMap { presentation -> Look.entries.map { arrayOf(presentation, it) } }
    }
}

/** The map's ground, light or dark, without its streets. */
@Composable
private fun MapStandIn(dark: Boolean) {
    Box(Modifier.fillMaxSize().background(if (dark) Color(0xFF2B2D30) else Color(0xFFF1EFEA)))
}

/** What opens from the search bar, and the button that opens it. */
enum class Presentation(val button: String) {
    Filters("Filters"),
    Settings("Settings"),
    ;

    val fileName: String get() = name.lowercase()
}
