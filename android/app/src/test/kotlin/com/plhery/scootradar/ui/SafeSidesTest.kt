package com.plhery.scootradar.ui

import android.view.View
import androidx.activity.ComponentActivity
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.dock.DOCK_TAG
import com.plhery.scootradar.ui.dock.DockState
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone

// X.md X-AD34: a cutout down a side of the window, as a tablet's upright, or the navigation bar there, takes its share
// of the dock's layout, as the safe area's sides take theirs of the iPhone's GeometryReader. SystemBarsTest checks the
// same on the device, the cutout overlaid (scratch-app-v).

/**
 * A tablet upright in a window 600 wide, where the search bar, the dock and the locate button, 560 wide in the middle,
 * come within 20 of its sides: a cutout 48 deep down either side keeps them clear of it.
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w600dp-h1280dp-mdpi")
class SafeSidesTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private val controllers = TestControllers()
    private val shortcuts = ScreenShortcuts()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale
    private lateinit var view: View

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
    fun aCutoutDownTheLeftKeepsTheControlsClearOfIt() = withCutout(Insets.of(48, 0, 0, 0)) { safe ->
        assertEquals(48f, safe.left)
    }

    @Test
    fun aCutoutDownTheRightKeepsTheControlsClearOfIt() = withCutout(Insets.of(0, 0, 48, 0)) { safe ->
        assertEquals(552f, safe.right)
    }

    /** The screen with [cutout] down a side, in the window's points (mdpi: pixels), and the controls inside the rest. */
    private fun withCutout(cutout: Insets, check: (safe: Rect) -> Unit) {
        val clock = TestClock()
        val model = DockState.Summary.make(controllers, clock)
        compose.setContent {
            view = LocalView.current
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = { }, glassBlurs = false, shortcuts = shortcuts)
            }
        }
        compose.waitForIdle()
        compose.runOnIdle {
            val insets = WindowInsetsCompat.Builder().setInsets(WindowInsetsCompat.Type.displayCutout(), cutout).build()
            ViewCompat.dispatchApplyWindowInsets(view, insets)
        }
        compose.waitForIdle()
        assertEquals(ScooterChromeLayout.Dock, shortcuts.situation!!.layout)
        val safe = Rect(cutout.left.toFloat(), 0f, 600f - cutout.right, 1280f)
        check(safe)
        val controls = mapOf(
            "the search bar" to hasTestTag(SEARCH_ISLAND_TAG),
            "the dock" to hasTestTag(DOCK_TAG),
            "the locate button" to (hasContentDescription("Near me") or hasContentDescription("Go to my location")),
        )
        for ((name, matcher) in controls) {
            val frame = frame(matcher)
            assertTrue("$name $frame beside the cutout, inside $safe", frame.left >= safe.left - 0.5f && frame.right <= safe.right + 0.5f)
        }
    }

    private fun frame(matcher: SemanticsMatcher): Rect = compose.onNode(matcher).fetchSemanticsNode().boundsInRoot
}
