package com.plhery.scootradar.map

import android.os.SystemClock
import android.util.Log
import android.view.View
import android.view.ViewGroup
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.ui.platform.AndroidUiDispatcher
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.ScooterMapScreen
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import okhttp3.OkHttpClient
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.maps.MapLibreMap
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

// MAP-021 and MAP-211 on the phone: the compass the app adds shows once the map is turned, and a tap on it turns the
// map north in the time MapKit gives a move of the camera, at once with animations off.
@RunWith(AndroidJUnit4::class)
class MapCompassTest {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val language = ScooterLanguage.current

    @Before
    fun setUp() {
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        scope.cancel()
        ScooterLanguage.current = language
    }

    @Test
    fun theCompassShowsOnceTheMapIsTurnedAndATapTurnsItNorthInMapKitsTime() {
        ActivityScenario.launch(ComponentActivity::class.java).use { scenario ->
            val controller = testController(scope)
            val tiles = GroundTiles.openFreeMap(OkHttpClient())
            scenario.onActivity { activity ->
                activity.setContent {
                    ScooterMapScreen(controller = controller, map = { dark -> ScooterMap(controller, zurichStart, MapCameraMemory(), tiles, dark) })
                }
            }
            val map = mapOf(scenario)
            val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
            // North up: no compass.
            Thread.sleep(1_000)
            assertFalse(device.hasObject(By.desc("Compass")))

            // Turned 30° east of north, as two fingers would turn it.
            scenario.onActivity { map.moveCamera(CameraUpdateFactory.bearingTo(30.0)) }
            val compass = device.wait(Until.findObject(By.desc("Compass")), 5_000)
            assertNotNull("the compass", compass)
            val steps = CopyOnWriteArrayList<Pair<Long, Double>>()
            scenario.onActivity { map.addOnCameraMoveListener { steps += SystemClock.uptimeMillis() to map.cameraPosition.bearing } }

            compass.click()
            Thread.sleep(1_500)
            var bearing = 30.0
            scenario.onActivity { bearing = map.cameraPosition.bearing }
            assertFalse("turned north: $bearing", MapOrnaments.isTurned(bearing))
            // A turn alone takes MapKit a quarter of a second, from the first frame's step to the last's.
            val took = steps.last().first - steps.first().first
            Log.i("MapCompassTest", "The turn took $took ms over ${steps.size} steps")
            assertTrue("took $took ms", took in 180L..350L)
            assertTrue("${steps.size} steps", steps.size >= 8)
            // Eased in and out: the first steps turn less than the middle ones.
            val turns = steps.map { it.second }.zipWithNext { a, b -> a - b }
            assertTrue("$turns", turns.first() < turns[turns.size / 2])
            // And then it fades.
            assertTrue("the compass gone", device.wait(Until.gone(By.desc("Compass")), 3_000))
        }
    }

    /** With animations off, the map is north at once, as MapKit turns it under Reduce Motion. */
    @Test
    fun withAnimationsOffTheMapTurnsNorthAtOnce() = withPhoneMap { phone ->
        val frames = CoroutineScope(SupervisorJob() + AndroidUiDispatcher.Main)
        val camera = phone.onMain {
            phone.map.moveCamera(CameraUpdateFactory.newCameraPosition(MapCamera.opening(zurichStart, MapKitCamera.IPhone)))
            phone.map.moveCamera(CameraUpdateFactory.bearingTo(30.0))
            MapCamera(phone.map, phone.view, testController(scope), MapCameraMemory(), frames, animationsOn = { false })
        }
        settle()
        val steps = CopyOnWriteArrayList<Long>()
        try {
            phone.onMain {
                phone.map.addOnCameraMoveListener { steps += SystemClock.uptimeMillis() }
                camera.turnNorth()
            }
            settle()
            assertTrue("${steps.size} steps", steps.size <= 2)
            assertEquals(0.0, phone.onMain { phone.map.cameraPosition.bearing }, 1e-6)
        } finally {
            phone.onMain { camera.close() }
            frames.cancel()
        }
    }

    /** The app's map in the activity, once its camera is made. */
    private fun mapOf(scenario: ActivityScenario<ComponentActivity>): MapLibreMap {
        val start = SystemClock.uptimeMillis()
        var view: ScooterMapView? = null
        while (SystemClock.uptimeMillis() - start < 30_000) {
            scenario.onActivity { activity -> view = find(activity.window.decorView)?.takeIf { it.camera != null } }
            if (view != null) break
            Thread.sleep(200)
        }
        val ready = CountDownLatch(1)
        lateinit var map: MapLibreMap
        scenario.onActivity {
            assertNotNull("the map's camera", view)
            view!!.getMapAsync { map = it; ready.countDown() }
        }
        assertTrue(ready.await(10, TimeUnit.SECONDS))
        return map
    }

    private fun find(view: View): ScooterMapView? = when (view) {
        is ScooterMapView -> view
        is ViewGroup -> (0 until view.childCount).firstNotNullOfOrNull { find(view.getChildAt(it)) }
        else -> null
    }
}
