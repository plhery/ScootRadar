package com.plhery.scootradar.app

import android.Manifest
import android.app.Application
import android.hardware.Sensor
import android.hardware.SensorManager
import android.location.Location
import android.location.LocationManager
import android.os.Looper
import android.view.Surface
import androidx.activity.ComponentActivity
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.map.ScooterDeviceOrientation
import com.plhery.scootradar.core.map.ScooterHeadingReading
import com.plhery.scootradar.core.map.ScooterInterfaceOrientation
import com.plhery.scootradar.core.map.ScooterLocationError
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.Shadows.shadowOf
import org.robolectric.shadows.SensorEventBuilder
import org.robolectric.shadows.ShadowDisplay
import org.robolectric.shadows.ShadowSensor
import org.robolectric.shadows.ShadowSensorManager
import java.time.Instant
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

// The compass, as CLLocationManager's heading reaches the map (logic.md LOG-255 to LOG-257; X.md X-AD13):
// Android's rotation vector sensor, turned to true north and to the way the window shows.

@RunWith(AndroidJUnit4::class)
class AndroidCompassTest {
    private val context: Application = ApplicationProvider.getApplicationContext()
    private val sensors: ShadowSensorManager = shadowOf(context.getSystemService(SensorManager::class.java))
    private val locations = shadowOf(context.getSystemService(LocationManager::class.java))
    private val headings = mutableListOf<ScooterHeadingReading>()
    private var uptime = 1_000_000_000_000L
    private val now = Instant.parse("2026-10-28T09:00:00Z")

    @Before
    fun setUp() {
        locations.setLocationEnabled(true)
        locations.setProviderEnabled(LocationManager.FUSED_PROVIDER, true)
        shadowOf(context).grantPermissions(Manifest.permission.ACCESS_FINE_LOCATION)
    }

    private fun manager(withCompass: Boolean = true): AndroidLocationManager {
        if (withCompass) sensors.addSensor(ShadowSensor.newInstance(Sensor.TYPE_ROTATION_VECTOR))
        return AndroidLocationManager(context, InMemoryScooterDefaults(), now = { now }, elapsedRealtimeNanos = { uptime }).also {
            it.delegate = object : AndroidLocationManager.Delegate {
                override fun authorizationChanged() = Unit

                override fun locationsUpdated(locations: List<ScooterLocationFix>) = Unit

                override fun headingUpdated(heading: ScooterHeadingReading) {
                    headings += heading
                }

                override fun locationFailed(error: ScooterLocationError) = Unit
            }
        }
    }

    /** The rotation vector of a phone turned `degrees` clockwise from magnetic north about the vertical, then tilted `tilt` degrees up about its x. */
    private fun rotationVector(degrees: Double, tilt: Double = 0.0, accuracy: Float? = null): FloatArray {
        val turn = quaternion(0.0, 0.0, 1.0, -degrees)
        val q = multiply(turn, quaternion(1.0, 0.0, 0.0, tilt))
        val values = q.map { it.toFloat() }
        return (if (accuracy != null) values + accuracy else values).toFloatArray()
    }

    /** x, y, z, w of a turn of `degrees` about an axis, anticlockwise as seen from its tip. */
    private fun quaternion(x: Double, y: Double, z: Double, degrees: Double): DoubleArray {
        val half = degrees * PI / 360
        return doubleArrayOf(x * sin(half), y * sin(half), z * sin(half), cos(half))
    }

    private fun multiply(a: DoubleArray, b: DoubleArray): DoubleArray = doubleArrayOf(
        a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
        a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
        a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
        a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
    )

    private fun send(values: FloatArray, status: Int = SensorManager.SENSOR_STATUS_ACCURACY_HIGH, ageNanos: Long = 0) {
        val sensor = sensors.getSensorList(Sensor.TYPE_ROTATION_VECTOR).single()
        sensors.sendSensorEventToListeners(
            SensorEventBuilder.newBuilder().setSensor(sensor).setValues(values).setAccuracy(status).setTimestamp(uptime - ageNanos).build(),
        )
    }

    private fun location(latitude: Double, longitude: Double) = Location(LocationManager.FUSED_PROVIDER).apply {
        this.latitude = latitude
        this.longitude = longitude
        accuracy = 10f
        elapsedRealtimeNanos = uptime
    }

    @Test
    fun theTopOfTheScreenLyingFlatOrTheBackStandingUpIsTheWayAhead() {
        for (degrees in listOf(0.0, 45.0, 90.0, 180.0, 270.0, 359.0)) {
            val flat = AndroidLocationManager.magneticHeading(rotationVector(degrees), ScooterDeviceOrientation.Portrait)!!
            assertEquals("flat, its top at $degrees°", degrees, flat, 0.01)
            // Held up to look through, where getOrientation's azimuth swings about; the back faces the way.
            val upright = AndroidLocationManager.magneticHeading(rotationVector(degrees, tilt = 90.0), ScooterDeviceOrientation.Portrait)!!
            assertEquals("upright, its back at $degrees°", degrees, upright, 0.01)
            val leaning = AndroidLocationManager.magneticHeading(rotationVector(degrees, tilt = 50.0), ScooterDeviceOrientation.Portrait)!!
            assertEquals("leaning back at $degrees°", degrees, leaning, 0.01)
        }
    }

    @Test
    fun theWindowsTopIsTheWayAheadWhicheverWayItShows() {
        // The phone's own top at 270°, west: turned a quarter to the left, its right side, the window's top, is north.
        val west = rotationVector(270.0)
        assertEquals(0.0, AndroidLocationManager.magneticHeading(west, ScooterDeviceOrientation.LandscapeLeft)!!, 0.01)
        assertEquals(180.0, AndroidLocationManager.magneticHeading(west, ScooterDeviceOrientation.LandscapeRight)!!, 0.01)
        assertEquals(90.0, AndroidLocationManager.magneticHeading(west, ScooterDeviceOrientation.PortraitUpsideDown)!!, 0.01)
        assertEquals("face up is read as held", 270.0, AndroidLocationManager.magneticHeading(west, ScooterDeviceOrientation.FaceUp)!!, 0.01)
    }

    @Test
    fun theWindowsRotationIsTheHeadingsOrientation() {
        assertEquals(ScooterInterfaceOrientation.Portrait, HeadingOrientationWatcher.interfaceOrientation(Surface.ROTATION_0))
        assertEquals(ScooterInterfaceOrientation.LandscapeRight, HeadingOrientationWatcher.interfaceOrientation(Surface.ROTATION_90))
        assertEquals(ScooterInterfaceOrientation.PortraitUpsideDown, HeadingOrientationWatcher.interfaceOrientation(Surface.ROTATION_180))
        assertEquals(ScooterInterfaceOrientation.LandscapeLeft, HeadingOrientationWatcher.interfaceOrientation(Surface.ROTATION_270))

        val activity = Robolectric.buildActivity(ComponentActivity::class.java).setup().get()
        val told = mutableListOf<ScooterDeviceOrientation>()
        activity.lifecycle.addObserver(HeadingOrientationWatcher(activity) { told += it })
        assertEquals("told as the activity starts", listOf(ScooterDeviceOrientation.Portrait), told)

        // The phone turned a quarter anticlockwise: the display turns the other way, to ROTATION_90.
        shadowOf(ShadowDisplay.getDefaultDisplay()).setRotation(Surface.ROTATION_90)
        shadowOf(Looper.getMainLooper()).idle()
        assertEquals(ScooterDeviceOrientation.LandscapeLeft, told.last())
        // Upside down, which no configuration change tells.
        shadowOf(ShadowDisplay.getDefaultDisplay()).setRotation(Surface.ROTATION_180)
        shadowOf(Looper.getMainLooper()).idle()
        assertEquals(ScooterDeviceOrientation.PortraitUpsideDown, told.last())
    }

    @Test
    fun theCompassIsHowSureTheSensorIs() {
        val estimated = AndroidLocationManager.headingAccuracy(rotationVector(0.0, accuracy = (10 * PI / 180).toFloat()), SensorManager.SENSOR_STATUS_ACCURACY_LOW)
        assertEquals("its own estimate first", 10.0, estimated, 0.001)
        val withoutEstimate = rotationVector(0.0)
        assertEquals(15.0, AndroidLocationManager.headingAccuracy(withoutEstimate, SensorManager.SENSOR_STATUS_ACCURACY_HIGH), 0.0)
        assertEquals(30.0, AndroidLocationManager.headingAccuracy(withoutEstimate, SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM), 0.0)
        assertEquals(60.0, AndroidLocationManager.headingAccuracy(withoutEstimate, SensorManager.SENSOR_STATUS_ACCURACY_LOW), 0.0)
        assertEquals("needs calibrating", -1.0, AndroidLocationManager.headingAccuracy(withoutEstimate, SensorManager.SENSOR_STATUS_UNRELIABLE), 0.0)
        // An estimate of 0 while calibrating, as the emulator's: no beam, as iOS's negative headingAccuracy.
        val calibrating = rotationVector(0.0, accuracy = 0f)
        assertEquals(-1.0, AndroidLocationManager.headingAccuracy(calibrating, SensorManager.SENSOR_STATUS_UNRELIABLE), 0.0)
        assertEquals(-1.0, AndroidLocationManager.headingAccuracy(calibrating, SensorManager.SENSOR_STATUS_NO_CONTACT), 0.0)
        assertEquals(
            "a sure sensor's 0 is its estimate",
            0.0,
            AndroidLocationManager.headingAccuracy(calibrating, SensorManager.SENSOR_STATUS_ACCURACY_HIGH),
            0.0,
        )
        assertEquals(
            "an estimate of -1 is none",
            30.0,
            AndroidLocationManager.headingAccuracy(rotationVector(0.0, accuracy = -1f), SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM),
            0.0,
        )
    }

    @Test
    fun theHeadingIsTrueNorthOnceTheRiderIsFound() {
        val manager = manager()
        manager.cameToForeground()
        manager.startUpdatingHeading()
        send(rotationVector(20.0), ageNanos = 1_000_000_000)
        val beforeAFix = headings.single()
        assertEquals("not known without a place", -1.0, beforeAFix.trueHeading, 0.0)
        assertEquals(20.0, beforeAFix.magneticHeading, 0.01)
        assertEquals(15.0, beforeAFix.headingAccuracy, 0.0)
        assertEquals("timed by the clock since boot", now.minusSeconds(1), beforeAFix.timestamp)

        // Zürich, where magnetic north is a few degrees west of true north.
        manager.startUpdatingLocation()
        locations.simulateLocation(location(47.3769, 8.5417))
        shadowOf(Looper.getMainLooper()).idle()
        send(rotationVector(20.0))
        val declination = AndroidLocationManager.declinationAt(47.3769, 8.5417, 0.0)
        assertTrue("about 3° east in Zürich, not $declination", declination in 2.0..6.0)
        assertEquals(20.0 + declination, headings.last().trueHeading, 0.01)
        assertEquals(20.0, headings.last().magneticHeading, 0.01)
    }

    @Test
    fun aLastKnownPlaceGivesTrueNorthFromTheStart() {
        locations.setLastKnownLocation(LocationManager.FUSED_PROVIDER, location(59.9139, 10.7522))
        val manager = manager()
        manager.cameToForeground()
        manager.startUpdatingHeading()
        send(rotationVector(350.0))
        val declination = AndroidLocationManager.declinationAt(59.9139, 10.7522, 0.0)
        assertEquals((350.0 + declination) % 360, headings.single().trueHeading, 0.01)
    }

    @Test
    fun aTurnOfTwoDegreesIsReported() {
        val manager = manager()
        manager.cameToForeground()
        manager.startUpdatingHeading()
        send(rotationVector(10.0))
        send(rotationVector(11.0))
        assertEquals(1, headings.size)
        send(rotationVector(12.5))
        assertEquals(listOf(10.0, 12.5), headings.map { Math.round(it.magneticHeading * 10) / 10.0 })

        // Across north, the short way round.
        send(rotationVector(359.5))
        send(rotationVector(0.5))
        assertEquals(3, headings.size)
        // A surer compass is told with the same heading, so that the beam narrows.
        send(rotationVector(359.5), status = SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM)
        assertEquals(30.0, headings.last().headingAccuracy, 0.0)
        // The window turned: the next reading is told whatever it says.
        manager.headingOrientation = ScooterDeviceOrientation.LandscapeLeft
        send(rotationVector(269.5), status = SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM)
        assertEquals(5, headings.size)
        assertEquals(359.5, headings.last().magneticHeading, 0.01)
    }

    @Test
    fun theCompassRunsOnlyWhileAskedInFrontAndAllowed() {
        assertFalse("no sensor, no compass", manager(withCompass = false).isHeadingAvailable)
        val manager = manager()
        assertTrue(manager.isHeadingAvailable)

        manager.startUpdatingHeading()
        assertTrue("nothing while away", sensors.listeners.isEmpty())
        manager.cameToForeground()
        assertEquals(1, sensors.listeners.size)
        manager.leftForeground()
        assertTrue(sensors.listeners.isEmpty())
        manager.cameToForeground()
        assertEquals("on again, as it was asked", 1, sensors.listeners.size)
        manager.stopUpdatingHeading()
        assertTrue(sensors.listeners.isEmpty())

        shadowOf(context).denyPermissions(Manifest.permission.ACCESS_FINE_LOCATION)
        manager.startUpdatingHeading()
        assertTrue("not without the permission", sensors.listeners.isEmpty())
        manager.close()
        assertNull(manager.delegate)
    }
}
