package com.plhery.scootradar.ui

import android.app.Activity
import android.app.Application
import android.graphics.Bitmap
import android.os.Bundle
import android.os.ParcelFileDescriptor
import android.view.View
import android.view.ViewGroup
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.dock
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.map.GroundTiles
import com.plhery.scootradar.map.MapCameraMemory
import com.plhery.scootradar.map.MapInsets
import com.plhery.scootradar.map.ScooterMap
import com.plhery.scootradar.map.ScooterMapView
import com.plhery.scootradar.map.testController
import com.plhery.scootradar.map.zurichStart
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import okhttp3.OkHttpClient
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.util.Locale

/**
 * The dock and the panel switch live as the window changes size, as a foldable unfolds and folds again, in the
 * same activity (UI-108–UI-115, X-AD17): the scooter chosen stays chosen, its card goes from the dock to the panel
 * and back, and the map's leading margin moves past the panel and back. For ScootRadar_Resizable, whose phone and
 * foldable screens `wm size` gives it at the same density; the screens are kept in the run's additional output,
 * as resize-*.png.
 *
 * No compose rule: its test clock would move the screen only while the test waits for it.
 */
@RunWith(AndroidJUnit4::class)
class WindowResizeTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val device = UiDevice.getInstance(instrumentation)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val locale = Locale.getDefault()
    private val language = ScooterLanguage.current
    private val tiles = GroundTiles.openFreeMap(OkHttpClient())
    private var scenario: ActivityScenario<ComponentActivity>? = null
    private val application = ApplicationProvider.getApplicationContext<Application>()
    private var recreations: Application.ActivityLifecycleCallbacks? = null

    @Before
    fun setUp() {
        Locale.setDefault(Locale.UK)
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        scenario?.close()
        recreations?.let(application::unregisterActivityLifecycleCallbacks)
        scope.cancel()
        shell("wm size reset")
        ScooterLanguage.current = language
        Locale.setDefault(locale)
    }

    @Test
    fun theDockAndThePanelSwitchLiveAsTheWindowChangesSizeAndKeepTheSelection() {
        resize(PHONE)
        val controller = testController(scope, api = oneScooter)
        val content: @Composable () -> Unit = {
            ScooterMapScreen(controller, map = { dark -> ScooterMap(controller, zurichStart, MapCameraMemory(), tiles, dark) })
        }
        // The first launch after the app is installed makes a new activity once, about two seconds in, which shows
        // the screen too.
        val recreated = object : Application.ActivityLifecycleCallbacks {
            override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
                if (savedInstanceState == null || activity !is ComponentActivity) return
                activity.enableEdgeToEdge()
                activity.setContent(content = content)
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
        val scenario = ActivityScenario.launch(ComponentActivity::class.java).also { this.scenario = it }
        scenario.onActivity {
            it.enableEdgeToEdge()
            it.setContent(content = content)
        }
        assertTrue("the map's camera", waitFor(30_000) { current().let { shown -> onMain { mapIn(shown.window.decorView)?.camera != null } } })
        Thread.sleep(3_000)
        assertTrue("the map's camera", waitFor(30_000) { current().let { shown -> onMain { mapIn(shown.window.decorView)?.camera != null } } })
        val shown = current()
        assertTrue("the scooters", waitFor(30_000) { controller.lastUpdated.value != null && !controller.isLoading.value })
        onMain { controller.selectScooter(scooter.id) }
        assertTrue("${dock(controller)}", waitFor(5_000) { dock(controller) is ScooterDockContent.Scooter })
        Thread.sleep(1_000)
        // A phone's dock: the map keeps no margins.
        assertEquals(MapInsets.zero, margins(shown))
        screenshot("resize-phone-card")

        // Unfolded: the panel, 16 from the edge and 380 wide, with the card in it, and the map's margin past it.
        resize(UNFOLDED)
        assertTrue("${margins(shown)}", waitFor(10_000) { margins(shown).left >= 16 + 380 + 16 })
        Thread.sleep(1_000)
        scenario.onActivity { assertSame("the same activity", shown, it) }
        assertEquals(scooter.id, controller.selectedScooterID.value)
        assertTrue("${dock(controller)}", dock(controller) is ScooterDockContent.Scooter)
        screenshot("resize-unfolded-card")

        // Folded again: the dock, the card in it, and no margins.
        resize(PHONE)
        assertTrue("${margins(shown)}", waitFor(10_000) { margins(shown) == MapInsets.zero })
        Thread.sleep(1_000)
        scenario.onActivity { assertSame("the same activity", shown, it) }
        assertEquals(scooter.id, controller.selectedScooterID.value)
        assertTrue("${dock(controller)}", dock(controller) is ScooterDockContent.Scooter)
        screenshot("resize-phone-again")
    }

    /** Gives the screen `size` in pixels, as the resizable emulator's modes do, and waits for the window to take it. */
    private fun resize(size: String) {
        shell("wm size $size")
        val (width, height) = size.split("x").map { it.toInt() }
        assertTrue("the screen at $size", waitFor(10_000) {
            if (scenario == null) device.displayWidth == width && device.displayHeight == height else decorSize() == width to height
        })
    }

    /** The size of the window shown, in pixels. */
    private fun decorSize(): Pair<Int, Int> {
        var size = 0 to 0
        scenario?.onActivity { size = it.window.decorView.width to it.window.decorView.height }
        return size
    }

    /** The activity shown now. */
    private fun current(): ComponentActivity {
        lateinit var current: ComponentActivity
        scenario!!.onActivity { current = it }
        return current
    }

    private fun margins(activity: ComponentActivity): MapInsets = onMain { mapIn(activity.window.decorView)!!.camera!!.margins }

    private fun dock(controller: ScooterMapController): ScooterDockContent = onMain { controller.dock }

    private fun mapIn(view: View): ScooterMapView? =
        view as? ScooterMapView ?: (view as? ViewGroup)?.let { group -> (0 until group.childCount).firstNotNullOfOrNull { mapIn(group.getChildAt(it)) } }

    /** Whether `condition` holds within `timeoutMillis`, asked every 50 ms. */
    private fun waitFor(timeoutMillis: Long, condition: () -> Boolean): Boolean {
        val end = System.currentTimeMillis() + timeoutMillis
        while (System.currentTimeMillis() < end) {
            if (condition()) return true
            Thread.sleep(50)
        }
        return condition()
    }

    private fun <T> onMain(block: () -> T): T {
        var result: Result<T>? = null
        instrumentation.runOnMainSync { result = runCatching(block) }
        return result!!.getOrThrow()
    }

    private fun shell(command: String) {
        val output = instrumentation.uiAutomation.executeShellCommand(command)
        ParcelFileDescriptor.AutoCloseInputStream(output).use { it.readBytes() }
    }

    /** The screen now, kept as [name].png in the run's additional output. */
    private fun screenshot(name: String) {
        val bitmap = instrumentation.uiAutomation.takeScreenshot() ?: return
        InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let { dir ->
            File(dir).mkdirs()
            File(dir, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        }
    }

    private companion object {
        /** ScootRadar_Resizable's phone and foldable screens, in pixels at 420 dpi: 411 × 914 dp and 841 × 701 dp. */
        const val PHONE = "1080x2400"
        const val UNFOLDED = "2208x1840"

        /** Lime's scooter in the middle of Zürich, where the map opens. */
        val scooter = Scooter(provider = "lime", latitude = 47.3769, longitude = 8.5417, battery = 82, vehicleID = "a", distanceMeters = 0.0)

        val oneScooter = object : ScooterAPIClient {
            override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = ScooterResponse(vehicles = listOf(scooter))
        }
    }
}
