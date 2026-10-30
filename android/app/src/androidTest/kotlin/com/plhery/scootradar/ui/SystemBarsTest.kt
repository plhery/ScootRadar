package com.plhery.scootradar.ui

import android.os.ParcelFileDescriptor
import android.os.SystemClock
import android.view.View
import android.view.ViewGroup
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.test.SemanticsNodeInteractionCollection
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.core.view.children
import androidx.lifecycle.ViewModelProvider
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.plhery.scootradar.MainActivity
import com.plhery.scootradar.app.ScooterMapViewModel
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.map.ScooterMapView
import com.plhery.scootradar.ui.dock.DOCK_TAG
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import kotlin.math.max

// X.md X-AD03, X-AD04, X-AD34: the app's window and its bars as the device has them, in whichever navigation mode,
// cutout and appearance the device is in (the emulator passes run it in each, `cmd overlay` changing them).

/**
 * The map runs under the status bar, the navigation bar and a cutout, as it runs under the iPhone's status bar and home
 * indicator; the controls keep to the safe area, the dock above the navigation bar's buttons or handle; and the bars'
 * icons are dark on the light map and light on the dark one, whatever the phone's own theme.
 */
@RunWith(AndroidJUnit4::class)
class SystemBarsTest {
    @get:Rule
    val compose = createEmptyComposeRule()

    private lateinit var scenario: ActivityScenario<MainActivity>
    private lateinit var controller: ScooterMapController
    private lateinit var appearance: ScooterAppearance

    @Before
    fun setUp() {
        scenario = ActivityScenario.launch(MainActivity::class.java)
        scenario.onActivity { controller = ViewModelProvider(it)[ScooterMapViewModel::class.java].controller }
        appearance = controller.appearance.value
        compose.waitUntil(30_000) { compose.onAllNodesWithTag(DOCK_TAG).fetchSemanticsNodes().isNotEmpty() }
        compose.waitForIdle()
    }

    @After
    fun tearDown() {
        scenario.onActivity { controller.setAppearance(appearance) }
        compose.waitForIdle()
        scenario.close()
    }

    /** X-AD03, X-AD04, X-AD34: the map fills the window, bars and cutout included; the controls keep inside them. */
    @Test
    fun theMapRunsUnderTheBarsAndTheControlsKeepToTheSafeArea() {
        val window = onActivity { Rect(0f, 0f, it.window.decorView.width.toFloat(), it.window.decorView.height.toFloat()) }
        val map = onActivity { activity ->
            val view = activity.window.decorView.findMap()!!
            val at = IntArray(2).also { view.getLocationInWindow(it) }
            Rect(at[0].toFloat(), at[1].toFloat(), (at[0] + view.width).toFloat(), (at[1] + view.height).toFloat())
        }
        assertEquals("the map in the window", window, map)

        val bars = onActivity { activity ->
            ViewCompat.getRootWindowInsets(activity.window.decorView)!!
                .getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
        }
        val safe = Rect(window.left + bars.left, window.top + bars.top, window.right - bars.right, window.bottom - bars.bottom)
        val controls = mapOf(
            "the search bar" to compose.onAllNodesWithTag(SEARCH_ISLAND_TAG),
            "the dock" to compose.onAllNodesWithTag(DOCK_TAG),
            // "Near me" until the phone has located once, then the round button.
            "the locate button" to compose.onAllNodes(
                hasContentDescription(localized("Near me")) or hasContentDescription(localized("Go to my location")),
            ),
        )
        for ((name, nodes) in controls) {
            val frame = nodes.single(name)
            assertTrue("$name $frame in the safe area $safe of $window", safe.encloses(frame))
        }
        // Over the map, the dock stands on the safe area's foot, above the navigation bar's buttons or handle, or 8 above
        // the window's where nothing is there: the iPhone's max(safe bottom, 8) (ScooterMapScreen.swift:313).
        if (onActivity { it.shortcuts.situation?.layout } == ScooterChromeLayout.Dock) {
            val dock = compose.onAllNodesWithTag(DOCK_TAG).single("the dock")
            val foot = window.bottom - max(bars.bottom.toFloat(), 8 * onActivity { it.resources.displayMetrics.density })
            assertEquals("the dock's foot over the safe bottom ${bars.bottom}", foot, dock.bottom, 1f)
        }
    }

    /**
     * X-AD03: the bars' icons follow the map's look, which follows the app's appearance, not the phone's theme: dark
     * icons on the light map with the phone dark, light ones on the dark map with the phone light.
     */
    @Test
    fun theBarsIconsFollowTheMapNotThePhonesTheme() {
        val phone = nightMode()
        try {
            for ((night, chosen) in listOf("yes" to ScooterAppearance.Light, "no" to ScooterAppearance.Dark)) {
                shell("cmd uimode night $night")
                scenario.onActivity { controller.setAppearance(chosen) }
                val light = chosen == ScooterAppearance.Light
                val until = SystemClock.uptimeMillis() + 10_000
                while (iconsAreDark() != (light to light) && SystemClock.uptimeMillis() < until) Thread.sleep(100)
                compose.waitForIdle()
                assertEquals("the status and navigation bars' icons dark on the $chosen map, the phone's night mode $night", light to light, iconsAreDark())
            }
        } finally {
            // Whatever the phone had, custom_bedtime on the foldable's and the tablet's images included.
            // Those images turn custom_bedtime to "no" by themselves shortly after boot, before any test runs.
            shell("cmd uimode night $phone")
        }
    }

    /**
     * X-AD03 with the System appearance, UIUserInterfaceStyle.unspecified: the window's light or dark is the phone's
     * (the app's night mode AUTO), so are the map and the bars' icons, light ones with the phone dark and dark ones with
     * it light. Night mode NO or YES for it would leave one of the two wrong.
     */
    @Test
    fun withTheSystemAppearanceTheBarsIconsAreThePhones() {
        val phone = nightMode()
        try {
            scenario.onActivity { controller.setAppearance(ScooterAppearance.System) }
            for (night in listOf("yes", "no")) {
                shell("cmd uimode night $night")
                val light = night == "no"
                val until = SystemClock.uptimeMillis() + 10_000
                while (iconsAreDark() != (light to light) && SystemClock.uptimeMillis() < until) Thread.sleep(100)
                compose.waitForIdle()
                assertEquals("the status and navigation bars' icons dark under System, the phone's night mode $night", light to light, iconsAreDark())
            }
        } finally {
            shell("cmd uimode night $phone")
        }
    }

    /** The phone's night mode, read before the test changes it so that it can be put back as it was. */
    private fun nightMode(): String {
        val mode = shell("cmd uimode night").substringAfter("Night mode: ", "").trim()
        check(mode.isNotEmpty()) { "the phone's night mode could not be read, so it could not be put back" }
        return mode
    }

    /** Whether the status bar's and the navigation bar's icons are dark, for a light ground. */
    private fun iconsAreDark(): Pair<Boolean, Boolean> = onActivity {
        WindowInsetsControllerCompat(it.window, it.window.decorView).let { bars -> bars.isAppearanceLightStatusBars to bars.isAppearanceLightNavigationBars }
    }

    private fun SemanticsNodeInteractionCollection.single(name: String): Rect {
        val nodes = fetchSemanticsNodes()
        assertEquals(name, 1, nodes.size)
        return nodes.single().boundsInWindow
    }

    /** Whether [other] is inside, a pixel either way from rounding. */
    private fun Rect.encloses(other: Rect): Boolean =
        other.left >= left - 1 && other.top >= top - 1 && other.right <= right + 1 && other.bottom <= bottom + 1

    private fun <T> onActivity(read: (MainActivity) -> T): T {
        var value: Result<T>? = null
        scenario.onActivity { value = runCatching { read(it) } }
        return value!!.getOrThrow()
    }

    private fun View.findMap(): ScooterMapView? =
        this as? ScooterMapView ?: (this as? ViewGroup)?.children?.firstNotNullOfOrNull { it.findMap() }

    private fun shell(command: String): String =
        ParcelFileDescriptor.AutoCloseInputStream(InstrumentationRegistry.getInstrumentation().uiAutomation.executeShellCommand(command))
            .bufferedReader().use { it.readText() }
}
