package com.plhery.scootradar.map

import android.graphics.PointF
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiObject2
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.ScooterLanguage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import org.junit.After
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.geometry.LatLng
import kotlin.math.abs
import kotlin.math.roundToInt

// MAP-270 on the phone: a tap on the searched place's pin shows MapKit's callout with its title over the pin, and a
// tap elsewhere on the map closes it.
@RunWith(AndroidJUnit4::class)
class PinCalloutTest {
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
    fun aTapOnThePinShowsItsCalloutAndATapElsewhereClosesIt() {
        val controller = testController(scope)
        withAppMap(controller) { phone ->
            val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
            val place = GeoPoint(47.3769, 8.5417)
            phone.onMain {
                controller.setSearchedDestination(MapDestination("Bahnhofplatz", "8001 Zürich", place, MapDestination.Kind.Address, isCovered = true))
            }
            settle()
            // The pin's foot, and the middle of its balloon, on the screen.
            val (foot, density) = phone.onMain {
                val point = phone.map.projection.toScreenLocation(LatLng(place.latitude, place.longitude))
                val origin = IntArray(2).also { phone.view.getLocationOnScreen(it) }
                PointF(origin[0] + point.x, origin[1] + point.y) to phone.view.resources.displayMetrics.density
            }
            assertNull("no callout before a tap", callout(device, foot, density))

            device.click(foot.x.roundToInt(), (foot.y - 22 * density).roundToInt())
            settle()
            assertNotNull("the callout over the pin", callout(device, foot, density))

            // On the map, away from the pin.
            device.click((foot.x - 120 * density).roundToInt(), (foot.y + 60 * density).roundToInt())
            settle()
            assertNull("closed by a tap elsewhere", callout(device, foot, density))
        }
    }

    /** The title written over the pin, its middle over the pin's foot. */
    private fun callout(device: UiDevice, foot: PointF, density: Float): UiObject2? =
        device.findObjects(By.text("Bahnhofplatz")).firstOrNull {
            val bounds = it.visibleBounds
            abs(bounds.exactCenterX() - foot.x) < 8 * density && bounds.bottom < foot.y - 44 * density && bounds.bottom > foot.y - 120 * density
        }
}
