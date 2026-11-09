package com.plhery.scootradar.ui

import android.app.Activity
import android.app.Application
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.os.Bundle
import android.view.View
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.viewinterop.AndroidView
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterRidePricing
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.map.GroundTiles
import com.plhery.scootradar.map.MapCameraMemory
import com.plhery.scootradar.map.ScooterMap
import com.plhery.scootradar.map.testController
import com.plhery.scootradar.map.zurichStart
import com.plhery.scootradar.ui.dock.DOCK_TAG
import com.plhery.scootradar.ui.glass.LocalGlass
import com.plhery.scootradar.ui.glass.glassMayBlur
import com.plhery.scootradar.ui.search.SEARCH_ISLAND_TAG
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import okhttp3.OkHttpClient
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.util.Locale
import kotlin.math.abs
import kotlin.math.sqrt

/**
 * The dock over the map as the app draws it, OpenFreeMap's ground and all, on a phone: what it says once the
 * scooters are in, and the card of a chosen scooter; and the glass, blurring what is under it or filled in its
 * place. The screens are kept in the run's additional output, as dock-*.png.
 */
@RunWith(AndroidJUnit4::class)
class DockOverTheMapTest {
    // The rule only finds the screen, which an activity shows. Its effects run on a StandardTestDispatcher, which
    // the rule pumps on the main thread: the first rule's unconfined one ran the map's where OkHttp resumed them.
    @get:Rule
    val compose = createEmptyComposeRule()

    private var scenario: ActivityScenario<ComponentActivity>? = null
    private val application = ApplicationProvider.getApplicationContext<Application>()
    private var recreations: Application.ActivityLifecycleCallbacks? = null
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val locale = Locale.getDefault()
    private val language = ScooterLanguage.current
    private val tiles = GroundTiles.openFreeMap(OkHttpClient())

    @Before
    fun setUp() {
        Locale.setDefault(Locale.US)
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        scenario?.close()
        recreations?.let(application::unregisterActivityLifecycleCallbacks)
        scope.cancel()
        ScooterLanguage.current = language
        Locale.setDefault(locale)
    }

    @Test
    fun theDockStandsOverTheLiveMap() {
        // Beside the panel, in a tablet's or an open foldable's window, the dock is in it, at its side.
        assumeTrue("the panel in a window ${windowDp()}", windowHasTheDock(largeText = false))
        val controller = show()
        val screen = screenshot("dock-summary")
        allChip().assertIsDisplayed()
        val dock = dockBounds()
        // At the bottom of the screen, across it but for its margins, and over a map that drew its ground.
        assertTrue("$dock in ${screen.width}×${screen.height}", dock.bottom > screen.height * 0.8f && dock.width > screen.width * 0.8f)
        assertTrue("the map's ground", spread(screen, groundOf(screen)) > 4)
        assertTrue(controller.selectedScooterID.value == null)
    }

    @Test
    fun theCardOfAChosenScooterOpensOverTheMap() {
        val controller = show()
        compose.runOnIdle { controller.selectScooter("lime:a") }
        compose.onNodeWithText(localized("Directions"), useUnmergedTree = true).assertIsDisplayed()
        compose.onNodeWithContentDescription(localized("Close scooter details")).assertIsDisplayed()
        compose.waitForIdle()
        screenshot("dock-scooter")

        compose.onNodeWithContentDescription(localized("Close scooter details")).performClick()
        compose.waitUntil(5_000) { controller.selectedScooterID.value == null }
        allChip().assertIsDisplayed()
    }

    @Test
    fun theGlassBlursTheMapUnderTheDockOrFillsItsPlace() {
        var blurs by mutableStateOf(true)
        // Stripes in the map's place, three pixels wide: under the fill they still show, faintly; blurred, they are gone.
        setContent {
            ScooterMapScreen(
                controller = testController(scope),
                map = {
                    val backdrop = LocalGlass.current.backdrop
                    AndroidView({ context -> Stripes(context).let { backdrop?.hold(it) ?: it } }, Modifier.fillMaxSize())
                },
                glassBlurs = blurs,
            )
        }
        compose.waitForIdle()
        val dock = dockBounds()
        val density = InstrumentationRegistry.getInstrumentation().targetContext.resources.displayMetrics.density
        // The card's top padding, clear of its rounded corners and of its hairline.
        val strip = Rect(dock.left + 32 * density, dock.top + 3 * density, dock.right - 32 * density, dock.top + 11 * density)

        val blurred = screenshot("dock-glass-blur")
        scenario?.onActivity { blurs = false }
        compose.waitForIdle()
        val filled = screenshot("dock-glass-fill")
        val blurredDetail = detail(blurred, strip)
        val filledDetail = detail(filled, strip)
        assertTrue("blurred $blurredDetail, filled $filledDetail", blurredDetail < 1.5 && filledDetail > 4)
        // The blur lets more of the map through than the fill: a grey, not the fill's near white or near black.
        assertTrue("blurred ${mean(blurred, strip)}, filled ${mean(filled, strip)}", abs(mean(blurred, strip) - mean(filled, strip)) > 10)
    }

    @Test
    fun theGlassFollowsTheMapUnderIt() {
        // The glass must show the map as it is now, not as it was when the glass first drew (bug D): the bar's never
        // changes size, so a blur kept from its first draw shows the map's land before any tile, through every pan
        // and appearance.
        // The pan and the bar's room are a phone's: beside a tablet's panel the pan goes up and the panel's text is
        // found before any tile (review-app-ag 3).
        assumeTrue("the panel in a window ${windowDp()}", windowHasTheDock(largeText = false))
        // The blur on whatever the frame watch says of this emulator's frames: it is the blur under test.
        val controller = show(ScooterAppearance.Light, blurs = true)
        val density = InstrumentationRegistry.getInstrumentation().targetContext.resources.displayMetrics.density
        val bar = bounds(SEARCH_ISLAND_TAG)
        // The bar's room above its buttons, clear of its rounded ends.
        val glass = Rect(bar.left + 48 * density, bar.top + 2 * density, bar.right - 48 * density, bar.top + 6 * density)
        val before = screenshot("dock-glass-follows-0")

        // A finger pans the map down under the bar, by a third of the screen.
        val dock = dockBounds()
        val x = (before.width / 2).toInt()
        val from = (bar.bottom + 24 * density).toInt()
        val to = minOf(from + before.height / 3, (dock.top - 24 * density).toInt())
        UiDevice.getInstance(InstrumentationRegistry.getInstrumentation()).swipe(x, from, x, to, 40)
        settle()
        val panned = screenshot("dock-glass-follows-1")
        val change = difference(before, panned, glass)
        assertTrue("the bar's glass after a pan: changed by $change of 255", change > 0.5)

        // Dark: the night ground under the glass's dark tint, not the day's.
        compose.runOnIdle { controller.setAppearance(ScooterAppearance.Dark) }
        val open = Rect(0f, (bar.bottom + dock.top) / 2 - 20 * density, 16 * density, (bar.bottom + dock.top) / 2 + 20 * density)
        val start = System.currentTimeMillis()
        while (System.currentTimeMillis() - start < 20_000 && mean(screen(), open) > 60) Thread.sleep(250)
        settle()
        val dark = screenshot("dock-glass-follows-2")
        assertTrue("the night map: ${mean(dark, open)}", mean(dark, open) < 60)
        // The night land through the glass is near black (about 18 of 255); the day's land under the dark tint, about 90.
        assertTrue("the bar's glass over the night map: ${mean(dark, glass)}", mean(dark, glass) < 50)
    }

    /** Waits for the map to stop and draw its tiles, and the glass to draw over them. */
    private fun settle() {
        compose.waitForIdle()
        Thread.sleep(3_000)
        compose.waitForIdle()
    }

    /** The screen over the live map, with a controller of [scooters], once they are in and the ground is drawn. */
    private fun show(appearance: ScooterAppearance? = null, blurs: Boolean? = null): ScooterMapController {
        val controller = testController(scope, api)
        appearance?.let(controller::setAppearance)
        setContent {
            ScooterMapScreen(
                controller = controller,
                map = { dark -> ScooterMap(controller, zurichStart, MapCameraMemory(), tiles, dark) },
                glassBlurs = blurs ?: glassMayBlur(),
            )
        }
        // A phone just started can take half a minute to reach the network.
        compose.waitUntil(60_000) { controller.lastUpdated.value != null && !controller.isLoading.value }
        // OpenFreeMap's tiles come over the network.
        val start = System.currentTimeMillis()
        while (System.currentTimeMillis() - start < 30_000) {
            val screen = screen()
            if (spread(screen, groundOf(screen)) > 4) break
            compose.waitForIdle()
            Thread.sleep(500)
        }
        compose.waitForIdle()
        return controller
    }

    private fun setContent(content: @Composable () -> Unit) {
        // The test's activity takes no configuration change itself. One just after launch (seen once, 0.5 s in, in a
        // full run) makes a new activity, which shows the screen too.
        val recreated = object : Application.ActivityLifecycleCallbacks {
            override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
                if (savedInstanceState != null) (activity as? ComponentActivity)?.setContent(content = content)
            }
            override fun onActivityStarted(activity: Activity) = Unit
            override fun onActivityResumed(activity: Activity) = Unit
            override fun onActivityPaused(activity: Activity) = Unit
            override fun onActivityStopped(activity: Activity) = Unit
            override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit
            override fun onActivityDestroyed(activity: Activity) = Unit
        }
        application.registerActivityLifecycleCallbacks(recreated)
        recreations = recreated
        scenario = ActivityScenario.launch(ComponentActivity::class.java).onActivity { it.setContent(content = content) }
    }

    /** A band of the screen under the status bar and above the scooters, where only the ground shows. */
    private fun groundOf(screen: Bitmap) = Rect(0f, screen.height * 0.08f, screen.width.toFloat(), screen.height * 0.35f)

    /** The All chip, which TalkBack reads as "All providers, 5 scooters". */
    private fun allChip() = compose.onNodeWithContentDescription(localized("All providers"), substring = true)

    private fun dockBounds(): Rect = bounds(DOCK_TAG)

    private fun bounds(tag: String): Rect {
        val node = compose.onNodeWithTag(tag).fetchSemanticsNode()
        val position = node.positionOnScreen
        return Rect(position.x, position.y, position.x + node.size.width, position.y + node.size.height)
    }

    private fun screen(): Bitmap = InstrumentationRegistry.getInstrumentation().uiAutomation.takeScreenshot()

    /** The screen now, kept as [name].png in the run's additional output. */
    private fun screenshot(name: String): Bitmap {
        val bitmap = screen()
        InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let { dir ->
            // The app's data cleared since the run began (pm clear) takes the folder with it.
            File(dir).mkdirs()
            File(dir, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        }
        return bitmap
    }

    /** The mean change of brightness in [area] from one screen to the other, from 0 to 255. */
    private fun difference(one: Bitmap, other: Bitmap, area: Rect): Double =
        brightness(one, area).zip(brightness(other, area)).flatMap { (a, b) -> a.indices.map { abs(a[it] - b[it]) } }.average()

    /** How much the brightness varies in [area]: its standard deviation, from 0 to 255. */
    private fun spread(bitmap: Bitmap, area: Rect): Double {
        val values = brightness(bitmap, area).flatMap { it.asList() }
        val mean = values.average()
        return sqrt(values.sumOf { (it - mean) * (it - mean) } / values.size)
    }

    /** The mean brightness in [area], from 0 to 255. */
    private fun mean(bitmap: Bitmap, area: Rect): Double = brightness(bitmap, area).flatMap { it.asList() }.average()

    /** How sharp [area] is: the mean change of brightness from a pixel to the next on its right. */
    private fun detail(bitmap: Bitmap, area: Rect): Double =
        brightness(bitmap, area).flatMap { row -> row.asList().zipWithNext { a, b -> abs(b - a) } }.average()

    /** The brightness of each pixel in [area], row by row. */
    private fun brightness(bitmap: Bitmap, area: Rect): List<DoubleArray> {
        val left = area.left.toInt().coerceIn(0, bitmap.width - 2)
        val right = area.right.toInt().coerceIn(left + 2, bitmap.width)
        val top = area.top.toInt().coerceIn(0, bitmap.height - 1)
        val bottom = area.bottom.toInt().coerceIn(top + 1, bitmap.height)
        return (top until bottom).map { y ->
            DoubleArray(right - left) { i ->
                val pixel = bitmap.getPixel(left + i, y)
                0.299 * Color.red(pixel) + 0.587 * Color.green(pixel) + 0.114 * Color.blue(pixel)
            }
        }
    }

    /** Black and white stripes, three pixels wide. */
    private class Stripes(context: Context) : View(context) {
        private val black = Paint().apply { color = Color.BLACK }

        override fun onDraw(canvas: Canvas) {
            canvas.drawColor(Color.WHITE)
            for (x in 0 until width step 6) canvas.drawRect(x.toFloat(), 0f, x + 3f, height.toFloat(), black)
        }
    }

    private companion object {
        /** Five scooters in Zürich's centre, Lime's first, with its price. */
        val scooters = listOf(
            Scooter(
                provider = "lime", latitude = 47.3772, longitude = 8.5421, battery = 82, rangeMeters = 24_000,
                vehicleID = "a", deepLink = null, rentalURIs = null, distanceMeters = 0.0,
                pricing = ScooterRidePricing(currency = "CHF", unlockFeeMinorUnits = 100, minuteFeeMinorUnits = 35),
            ),
            scooter("b", "lime", 47.3760, 8.5410),
            scooter("c", "bird", 47.3775, 8.5402),
            scooter("d", "voi", 47.3765, 8.5430),
            scooter("e", "bolt", 47.3781, 8.5415),
        )

        val api = object : ScooterAPIClient {
            override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int, minimumRange: Int) = ScooterResponse(vehicles = scooters)
        }

        fun scooter(id: String, provider: String, latitude: Double, longitude: Double) = Scooter(
            provider = provider, latitude = latitude, longitude = longitude, battery = 70, rangeMeters = null,
            vehicleID = id, deepLink = null, rentalURIs = null, distanceMeters = 0.0,
        )
    }
}

/** The device's window, in dp, as its configuration has it: system bars aside. */
internal fun windowDp(): Pair<Int, Int> =
    InstrumentationRegistry.getInstrumentation().targetContext.resources.configuration.let { it.screenWidthDp to it.screenHeightDp }

/**
 * Whether the device's window has the dock (UI-108 to UI-115): a phone's, a folded foldable's, a narrow window's; a
 * window regular both ways with room for the panel and the map beside it has the panel instead. At the accessibility
 * text sizes when `largeText`, which widen the panel.
 */
internal fun windowHasTheDock(largeText: Boolean): Boolean {
    val (width, height) = windowDp()
    val classes = SizeClasses.of(width.toDouble(), height.toDouble())
    return chromeLayout(width.toDouble(), classes, largeText, current = ScooterChromeLayout.Dock) == ScooterChromeLayout.Dock
}
