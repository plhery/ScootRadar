package com.plhery.scootradar.map

import android.os.SystemClock
import android.view.MotionEvent
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import com.plhery.scootradar.app.NotDeterminedLocationManager
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.ScooterMapStart
import com.plhery.scootradar.core.model.ScooterResponse
import kotlinx.coroutines.CoroutineScope
import org.junit.Assert.assertTrue
import org.maplibre.android.MapLibre
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.MapLibreMapOptions
import org.maplibre.android.maps.Style
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** An iPhone's map of 390×844 points, as a test has it. */
class PhoneMap(val scenario: ActivityScenario<ComponentActivity>, val view: ScooterMapView, val map: MapLibreMap) {
    val projection = MapLibreProjection(map, view)

    /** Gives the map another size, in points, as a window or a fold gives it one. */
    fun resize(width: Int, height: Int) = onMain {
        view.layoutParams = view.layoutParams.apply {
            this.width = (width * RATIO).toInt()
            this.height = (height * RATIO).toInt()
        }
    }

    /** A finger drawn down the map by that many points, as a hand pans it: on the main thread, as touches come. */
    fun drag(points: Int) {
        val start = SystemClock.uptimeMillis()
        // Clear of the screen's edges, where the gesture detector takes no touch: the map runs past them.
        val x = view.width / 4f
        val y = view.height / 8f
        fun event(action: Int, step: Int) =
            MotionEvent.obtain(start, start + step * 16L, action, x, y + points * RATIO * step / STEPS, 0).also {
                view.dispatchTouchEvent(it)
                it.recycle()
            }
        event(MotionEvent.ACTION_DOWN, 0)
        for (step in 1..STEPS) event(MotionEvent.ACTION_MOVE, step)
        event(MotionEvent.ACTION_UP, STEPS)
    }

    /** Runs on the main thread, as the map must be used. */
    fun <T> onMain(block: () -> T): T {
        var result: T? = null
        scenario.onActivity { result = block() }
        @Suppress("UNCHECKED_CAST")
        return result as T
    }
}

/**
 * A map of 390×844 points, laid out past the edges of the emulator's screen as it needs to be. Its pixel ratio is
 * 2, so that its points are whole at any density. A `camera` is given to the map before it has a size, as the app
 * gives it its opening camera.
 */
fun withPhoneMap(camera: CameraPosition? = null, test: (PhoneMap) -> Unit) {
    ActivityScenario.launch(ComponentActivity::class.java).use { scenario ->
        val drawn = CountDownLatch(1)
        lateinit var view: ScooterMapView
        lateinit var map: MapLibreMap
        scenario.onActivity { activity ->
            MapLibre.getInstance(activity)
            val options = MapLibreMapOptions.createFromAttributes(activity).textureMode(true).pixelRatio(RATIO)
            camera?.let { options.camera(it) }
            view = ScooterMapView(activity, options)
            view.onCreate(null)
            val frame = FrameLayout(activity)
            frame.addView(view, FrameLayout.LayoutParams((390 * RATIO).toInt(), (844 * RATIO).toInt()))
            activity.setContentView(frame)
            view.onStart()
            view.onResume()
            view.getMapAsync { ready ->
                map = ready
                ready.setStyle(Style.Builder().fromJson(BLANK)) {
                    view.addOnDidFinishRenderingFrameListener { _, _, _ -> drawn.countDown() }
                }
            }
        }
        assertTrue("the map drew a frame", drawn.await(60, TimeUnit.SECONDS))
        try {
            test(PhoneMap(scenario, view, map))
        } finally {
            scenario.onActivity {
                view.onPause()
                view.onStop()
                view.onDestroy()
            }
        }
    }
}

/** The app's opening on Zürich. */
val zurichStart = ScooterMapStart(MapRegion.around(GeoPoint(47.3769, 8.5417), 8_906.0, 9_052.0), zoom = 12)

/** A server with no scooters anywhere. */
val noScooters = object : ScooterAPIClient {
    override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = ScooterResponse(vehicles = emptyList())
}

/** A controller with the scooters of a fake server, none unless it is given one, and no walks and no location. */
fun testController(scope: CoroutineScope, api: ScooterAPIClient = noScooters) = ScooterMapController(
    api = api,
    locationManager = NotDeterminedLocationManager(),
    defaults = InMemoryScooterDefaults(),
    scope = scope,
    directions = object : WalkingDirectionsClient {
        override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> = emptyList()
    },
    openInMaps = {},
    phoneLanguages = { listOf("en-US") },
)

/** Shows the region as MKMapView's setRegion does: fitted to the map, flat and north up. */
fun PhoneMap.setRegion(region: MapRegion) = onMain {
    val bounds = projection.bounds
    map.moveCamera(
        CameraUpdateFactory.newCameraPosition(
            CameraPosition.Builder()
                .target(LatLng(region.center.latitude, region.center.longitude))
                .zoom(MapZoom.fitting(region, bounds.width, bounds.height))
                .tilt(0.0)
                .bearing(0.0)
                .build(),
        ),
    )
}

/** Long enough for a move of MapKit's time to land: two seconds at most. */
fun settle() {
    Thread.sleep(2_200)
    InstrumentationRegistry.getInstrumentation().waitForIdleSync()
}

private const val RATIO = 2f
private const val STEPS = 20
private const val BLANK = """{"version":8,"sources":{},"layers":[{"id":"land","type":"background","paint":{"background-color":"#eef0f4"}}]}"""
