package com.plhery.scootradar.ui

import android.app.Activity
import android.app.Application
import android.graphics.Bitmap
import android.os.Bundle
import android.view.KeyEvent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.map.testController
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.After
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.util.Locale

/**
 * Beside the panel, Filters' popover and Settings' form close on a hardware keyboard's Esc, as the iPad's do, and on
 * Back (UI-231); each takes the keyboard's focus as it opens, as Esc is no Back to Android. On
 * ScootRadar_Tablet held across, where the screen has the panel; the screens are kept in the run's additional
 * output, as presentation-*.png.
 *
 * Read and tapped as TalkBack reads them, with no compose rule: its test clock would hold the popover where it
 * starts to grow. Open, either has the window outside it, which TalkBack calls "Close".
 */
@RunWith(AndroidJUnit4::class)
class PanelPresentationsTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val device = UiDevice.getInstance(instrumentation)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val locale = Locale.getDefault()
    private val language = ScooterLanguage.current
    private val application = ApplicationProvider.getApplicationContext<Application>()
    private var scenario: ActivityScenario<ComponentActivity>? = null
    private var recreations: Application.ActivityLifecycleCallbacks? = null

    @Before
    fun setUp() {
        Locale.setDefault(Locale.UK)
        ScooterLanguage.current = ScooterLanguage.En
        device.setOrientationLandscape()
    }

    @After
    fun tearDown() {
        scenario?.close()
        recreations?.let(application::unregisterActivityLifecycleCallbacks)
        scope.cancel()
        device.setOrientationNatural()
        device.unfreezeRotation()
        ScooterLanguage.current = language
        Locale.setDefault(locale)
    }

    @Test
    fun escAndBackCloseThePopoverAndTheForm() {
        show()
        open("Filters")
        screenshot("presentation-filters")
        device.pressKeyCode(KeyEvent.KEYCODE_ESCAPE)
        assertClosed("Filters, on Esc")

        open("Settings")
        screenshot("presentation-settings")
        device.pressKeyCode(KeyEvent.KEYCODE_ESCAPE)
        assertClosed("Settings, on Esc")

        open("Filters")
        device.pressBack()
        assertClosed("Filters, on Back")

        open("Settings")
        device.pressBack()
        assertClosed("Settings, on Back")
    }

    /** Taps the search bar's [button], and waits for what it opens to be in place. */
    private fun open(button: String) {
        val found = device.wait(Until.findObject(By.desc(button)), 10_000)
        assertNotNull(button, found)
        found.click()
        assertTrue("$button open", device.wait(Until.hasObject(By.desc(CLOSE)), 5_000))
        // Grown or slid into place.
        Thread.sleep(1_000)
    }

    private fun assertClosed(what: String) {
        assertTrue(what, device.wait(Until.gone(By.desc(CLOSE)), 5_000))
        // TalkBack finds the search bar's buttons again.
        assertTrue(what, device.wait(Until.hasObject(By.desc("Settings")), 5_000))
        Thread.sleep(1_000)
    }

    /** The screen over a plain ground, edge to edge as MainActivity is. */
    private fun show() {
        val controller = testController(scope)
        val content: @Composable () -> Unit = {
            ScooterMapScreen(controller, map = { Box(Modifier.fillMaxSize().background(Color(0xFFF1EFEA))) }, glassBlurs = false)
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
        scenario = ActivityScenario.launch(ComponentActivity::class.java).onActivity {
            it.enableEdgeToEdge()
            it.setContent(content = content)
        }
        if (launchedBefore) return
        launchedBefore = true
        Thread.sleep(3_000)
    }

    private fun screenshot(name: String) {
        val bitmap = instrumentation.uiAutomation.takeScreenshot() ?: return
        InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let { dir ->
            File(dir).mkdirs()
            File(dir, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        }
    }

    private companion object {
        /** What TalkBack calls the window outside an open popover or form, which closes it. */
        const val CLOSE = "Close"

        /** Whether an activity was launched in this run, after which none is made again. */
        var launchedBefore = false
    }
}
