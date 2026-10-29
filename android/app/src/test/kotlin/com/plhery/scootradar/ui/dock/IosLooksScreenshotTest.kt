package com.plhery.scootradar.ui.dock

import android.app.UiModeManager
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.test.core.app.ApplicationProvider
import com.github.takahirom.roborazzi.ExperimentalRoborazziApi
import com.github.takahirom.roborazzi.captureScreenRoboImage
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.ui.LocalClock
import com.plhery.scootradar.ui.ScooterMapScreen
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import com.plhery.scootradar.ui.theme.Look
import com.plhery.scootradar.ui.theme.drawnArtOptions
import com.plhery.scootradar.ui.theme.PHONE
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.screenshot
import com.plhery.scootradar.ui.theme.screenshotOptions
import com.plhery.scootradar.ui.theme.useFontScale
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone

/**
 * The phone's screen with Increase Contrast on (UI-186), with a glass control half-way into its swell under a finger
 * (UI-211), and with the card's price menu open (UI-404): light and dark, at font scale 1.0 and 2.0, as
 * DockScreenshotTest takes the dock.
 */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = PHONE)
class IosLooksScreenshotTest(private val scene: IosLook, private val look: Look) {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale

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
        setContrast(0f)
        controllers.close()
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        Locale.setDefault(locale)
        TimeZone.setDefault(timeZone)
    }

    @Test
    fun look() {
        val clock = TestClock()
        val model = scene.state.make(controllers, clock)
        model.setAppearance(if (look.dark) ScooterAppearance.Dark else ScooterAppearance.Light)
        useFontScale(look.fontScale)
        if (scene.increasedContrast) setContrast(1f)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }, LocalCoverageCounts provides (1_061 to 56)) {
                ScooterMapScreen(controller = model, map = { dark -> Ground(dark) }, glassBlurs = false)
            }
        }
        compose.waitForIdle()
        scene.take(compose, "looks/${scene.fileName}_${look.suffix}")
    }

    /** The phone's contrast setting, as Android 14's Settings sets it: 1 is high, 0 standard. */
    private fun setContrast(contrast: Float) {
        val modes = ApplicationProvider.getApplicationContext<android.content.Context>().getSystemService(UiModeManager::class.java)
        shadowOf(modes).setContrast(contrast)
    }

    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0} {1}")
        fun parameters(): List<Array<Any>> = IosLook.entries.flatMap { scene -> Look.entries.map { arrayOf(scene, it) } }
    }
}

/** The map's ground, light or dark, without its streets. */
@androidx.compose.runtime.Composable
private fun Ground(dark: Boolean) {
    Box(Modifier.fillMaxSize().background(if (dark) Color(0xFF2B2D30) else Color(0xFFF1EFEA)))
}

/** What each picture shows, from which of the dock's states. */
enum class IosLook(val state: DockState, val increasedContrast: Boolean = false) {
    /** The dock's summary and its glass with Increase Contrast's colours and edges. */
    ContrastSummary(DockState.Summary, increasedContrast = true),

    /** A scooter's card, its figures and buttons, with Increase Contrast. */
    ContrastCard(DockState.ScooterCard, increasedContrast = true),

    /** "Near me" held: swollen part of the way to 1.04, and lit. */
    NearMePressed(DockState.ScooterCard) {
        override fun take(compose: ComposeContentTestRule, name: String) {
            pressed(compose, name) { compose.onNode(hasContentDescription(localized("Near me")) and hasClickAction()).performTouchInput(it) }
        }
    },

    /** The closed search bar held, by its magnifying glass. */
    SearchPressed(DockState.ScooterCard) {
        override fun take(compose: ComposeContentTestRule, name: String) {
            pressed(compose, name) { compose.onNodeWithTag(SEARCH_ISLAND_TAG).performTouchInput(it) }
        }
    },

    /** The card's price cell tapped: the menu of ride lengths over the card, 10 minutes ticked. */
    PriceMenu(DockState.ScooterCard) {
        @OptIn(ExperimentalRoborazziApi::class)
        override fun take(compose: ComposeContentTestRule, name: String) {
            val label = stringFormat(localized("Ride estimate, %lld minutes. Change duration."), 10L)
            compose.onNode(hasContentDescription(label) and hasClickAction()).performClick()
            compose.waitForIdle()
            // The menu is a window of its own, over the screen's.
            captureScreenRoboImage("src/test/screenshots/$name.png", roborazziOptions = drawnArtOptions)
        }
    },
    ;

    val fileName: String get() = name.replaceFirstChar { it.lowercase() }

    open fun take(compose: ComposeContentTestRule, name: String) =
        compose.screenshot(name, if (increasedContrast) drawnArtOptions else screenshotOptions)

    /**
     * Holds a finger on what [touch] reaches, by its leading end, for 80 ms of the clock, about half of the swell's
     * spring, takes the picture, and lifts the finger away.
     */
    protected fun pressed(
        compose: ComposeContentTestRule,
        name: String,
        touch: (androidx.compose.ui.test.TouchInjectionScope.() -> Unit) -> Unit,
    ) {
        compose.mainClock.autoAdvance = false
        touch { down(Offset(centerLeft.x + 40f, centerLeft.y)) }
        compose.mainClock.advanceTimeBy(80)
        compose.screenshot(name)
        touch { cancel() }
        compose.mainClock.autoAdvance = true
    }
}
