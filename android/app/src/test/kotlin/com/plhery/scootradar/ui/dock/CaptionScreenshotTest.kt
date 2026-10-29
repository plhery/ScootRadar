package com.plhery.scootradar.ui.dock

import android.graphics.Rect
import android.view.View
import androidx.activity.ComponentActivity
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
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
 * The search bar of a desktop window beside its caption bar's app chip and buttons (UI-126), light and dark, at font
 * scale 1.0 and 2.0, over a plain stand-in for the map, with the chip and the buttons drawn where Android says they
 * are, as the system draws them over the app. At one dp to the pixel, as the panel's baselines.
 */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class CaptionScreenshotTest(private val look: Look) {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

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

    /** A tablet's window across, with the panel: its bar past the app's chip. */
    @Test
    @Config(qualifiers = "w960dp-h600dp-mdpi")
    fun panel() = beside("panel", listOf(Rect(0, 0, 150, 48), Rect(790, 0, 960, 48)))

    /** A narrower window, with the dock: its bar between the chip and the buttons. */
    @Test
    @Config(qualifiers = "w600dp-h900dp-mdpi")
    fun dock() = beside("dock", listOf(Rect(0, 0, 150, 48), Rect(430, 0, 600, 48)))

    private fun beside(window: String, buttons: List<Rect>) {
        val clock = TestClock()
        val model = DockState.Summary.make(controllers, clock)
        model.setAppearance(if (look.dark) ScooterAppearance.Dark else ScooterAppearance.Light)
        useFontScale(look.fontScale)
        // Edge to edge, as MainActivity is: the window's insets reach the screen.
        compose.runOnUiThread { WindowCompat.setDecorFitsSystemWindows(compose.activity.window, false) }
        lateinit var view: View
        compose.setContent {
            view = LocalView.current
            // The coverage card's counts as when the baselines were recorded (LOG-370).
            CompositionLocalProvider(LocalClock provides { clock.now }, LocalCoverageCounts provides (1_061 to 56)) {
                Box(Modifier.fillMaxSize()) {
                    ScooterMapScreen(controller = model, map = { dark -> MapStandIn(dark) }, glassBlurs = false)
                    CaptionStandIn(buttons, look.dark)
                }
            }
        }
        compose.waitForIdle()
        compose.runOnIdle {
            val insets = WindowInsetsCompat.Builder()
                .setInsets(WindowInsetsCompat.Type.captionBar(), Insets.of(0, 48, 0, 0))
                .setBoundingRects(WindowInsetsCompat.Type.captionBar(), buttons)
                .build()
            ViewCompat.dispatchApplyWindowInsets(view.rootView, insets)
        }
        compose.waitForIdle()
        compose.screenshot("caption/${window}_${look.suffix}")
    }

    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0}")
        fun parameters(): List<Array<Any>> = Look.entries.map { arrayOf(it) }
    }
}

/** The map's ground, light or dark, without its streets. */
@Composable
private fun MapStandIn(dark: Boolean) {
    Box(Modifier.fillMaxSize().background(if (dark) Color(0xFF2B2D30) else Color(0xFFF1EFEA)))
}

/** The caption's chip and buttons, which the system draws over the app, as rounded blocks where they are. */
@Composable
private fun CaptionStandIn(buttons: List<Rect>, dark: Boolean) {
    Canvas(Modifier.fillMaxSize()) {
        for (button in buttons) {
            drawRoundRect(
                if (dark) Color(0xFF5A5D62) else Color(0xFFC9C5BC),
                topLeft = Offset(button.left + 4f, button.top + 6f),
                size = Size(button.width() - 8f, button.height() - 12f),
                cornerRadius = CornerRadius(18f),
            )
        }
    }
}
