package com.plhery.scootradar.ui.dock

import android.graphics.Rect
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.window.layout.FoldingFeature
import androidx.window.testing.layout.FoldingFeature
import androidx.window.testing.layout.TestWindowLayoutInfo
import androidx.window.testing.layout.WindowLayoutInfoPublisherRule
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.map.LocalMapChrome
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
import org.junit.rules.RuleChain
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone

/**
 * The screen of a partly open foldable (UI-116 to UI-118), light and dark, at font scale 1.0 and 2.0, with a
 * scooter's card, over a plain stand-in for the map that draws the fold where the map is told it is. At one dp to
 * the pixel, as the panel's baselines.
 */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class FoldScreenshotTest(private val look: Look) {
    private val compose = createComposeRule()
    private val hinge = WindowLayoutInfoPublisherRule()

    @get:Rule
    val rules: RuleChain = RuleChain.outerRule(hinge).around(compose)

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

    /**
     * Standing like a laptop, the dock's chrome on the flat half under a hinge across. An unfolded foldable's window,
     * 850 dp across, has the panel, which a fold across leaves be (UI-119): this is T245's window, an iPhone Duo's.
     */
    @Test
    @Config(qualifiers = "w669dp-h951dp-mdpi")
    fun laptop() = folded(
        "laptop",
        DockState.ScooterCard,
        FoldingFeature(Rect(0, 0, 669, 951), center = 475, size = 20, state = FoldingFeature.State.HALF_OPENED),
    )

    /**
     * Open like a book, a foldable's inner screen folded along a seamless line down its middle: the panel stops at it
     * where its 420 dp at the largest text would cross it.
     */
    @Test
    @Config(qualifiers = "w850dp-h880dp-mdpi")
    fun book() = folded(
        "book",
        DockState.ScooterCard,
        FoldingFeature(Rect(0, 0, 850, 880), state = FoldingFeature.State.HALF_OPENED, orientation = FoldingFeature.Orientation.VERTICAL),
    )

    private fun folded(pose: String, state: DockState, fold: FoldingFeature) {
        val clock = TestClock()
        val model: ScooterMapController = state.make(controllers, clock)
        model.setAppearance(if (look.dark) ScooterAppearance.Dark else ScooterAppearance.Light)
        useFontScale(look.fontScale)
        compose.setContent {
            // The coverage card's counts as when the baselines were recorded (LOG-370).
            CompositionLocalProvider(LocalClock provides { clock.now }, LocalCoverageCounts provides (1_061 to 56)) {
                ScooterMapScreen(controller = model, map = { dark -> FoldedMapStandIn(dark) }, glassBlurs = false)
            }
        }
        compose.waitForIdle()
        compose.runOnIdle { hinge.overrideWindowLayoutInfo(TestWindowLayoutInfo(listOf(fold))) }
        compose.waitForIdle()
        compose.screenshot("fold/${pose}_${look.suffix}")
    }

    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0}")
        fun parameters(): List<Array<Any>> = Look.entries.map { arrayOf(it) }
    }
}

/** The map's ground, light or dark, with the fold the map is told of drawn across or down it. */
@Composable
private fun FoldedMapStandIn(dark: Boolean) {
    val fold = LocalMapChrome.current?.fold
    Canvas(Modifier.fillMaxSize().background(if (dark) Color(0xFF2B2D30) else Color(0xFFF1EFEA))) {
        fold ?: return@Canvas
        drawRect(
            if (dark) Color(0xFF5A5D62) else Color(0xFFC9C5BC),
            topLeft = Offset((fold.x * density).toFloat(), (fold.y * density).toFloat()),
            size = Size((fold.width * density).toFloat(), (fold.height * density).toFloat()),
        )
    }
}
