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
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.Scooter
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

    /** The screen over the live map, with a controller of [scooters], once they are in and the ground is drawn. */
    private fun show(): ScooterMapController {
        val controller = testController(scope, api)
        setContent {
            ScooterMapScreen(
                controller = controller,
                map = { dark -> ScooterMap(controller, zurichStart, MapCameraMemory(), tiles, dark) },
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

    private fun dockBounds(): Rect {
        val node = compose.onNodeWithTag(DOCK_TAG).fetchSemanticsNode()
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
            override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = ScooterResponse(vehicles = scooters)
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
