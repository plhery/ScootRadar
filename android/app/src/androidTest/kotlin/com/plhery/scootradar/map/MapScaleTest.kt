package com.plhery.scootradar.map

import android.os.SystemClock
import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
import com.plhery.scootradar.core.model.ScooterLanguage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.After
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.maps.MapLibreMap
import java.util.Locale
import java.util.concurrent.atomic.AtomicLong
import java.util.regex.Pattern

// MAP-023 on the phone: in the United States the map shows MapKit's scale while it zooms, in feet or miles, and fades
// it a second after the zoom stops.
@RunWith(AndroidJUnit4::class)
class MapScaleTest {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val language = ScooterLanguage.current
    private val launchLocale = ScooterLanguage.launchLocale

    @Before
    fun setUp() {
        ScooterLanguage.launchLocale = { Locale.US }
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        scope.cancel()
        ScooterLanguage.current = language
        ScooterLanguage.launchLocale = launchLocale
    }

    @Test
    fun inTheUnitedStatesTheScaleShowsWhileTheMapZoomsAndThenFades() = withAppMap(testController(scope)) { phone ->
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        val scale = By.desc(Pattern.compile(".*\\b(feet|foot|miles?)$"))
        Thread.sleep(2_500)
        // The map as it opened, at rest: no scale.
        assertFalse(device.hasObject(scale))

        // A zoom in, as two fingers would spread over a second.
        val stopped = AtomicLong()
        phone.onMain {
            phone.map.animateCamera(
                CameraUpdateFactory.zoomBy(1.0),
                1_000,
                object : MapLibreMap.CancelableCallback {
                    override fun onFinish() {
                        stopped.set(SystemClock.uptimeMillis())
                    }

                    override fun onCancel() = Unit
                },
            )
        }
        val shown = device.wait(Until.findObject(scale), 1_000)
        assertNotNull("the scale while the map zooms", shown)
        Log.i("MapScaleTest", "The scale read \"${shown.contentDescription}\"")
        screenshot("scale-zooming")
        assertTrue("the scale gone", device.wait(Until.gone(scale), 5_000))
        val gone = SystemClock.uptimeMillis()
        // A second after the zoom stopped, and a quarter of a second's fade.
        val after = gone - stopped.get()
        Log.i("MapScaleTest", "The scale went $after ms after the zoom stopped")
        assertTrue("went $after ms after the zoom stopped", stopped.get() > 0 && after in 1_000L..2_500L)
    }
}
