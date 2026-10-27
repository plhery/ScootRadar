package com.plhery.scootradar.map

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
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.MapLibreMapOptions
import org.maplibre.android.maps.Style
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** An iPhone's map of 390×844 points, as a test has it. */
class PhoneMap(val scenario: ActivityScenario<ComponentActivity>, val view: ScooterMapView, val map: MapLibreMap) {
    val projection = MapLibreProjection(map, view)

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
 * 2, so that its points are whole at any density.
 */
fun withPhoneMap(test: (PhoneMap) -> Unit) {
    ActivityScenario.launch(ComponentActivity::class.java).use { scenario ->
        val drawn = CountDownLatch(1)
        lateinit var view: ScooterMapView
        lateinit var map: MapLibreMap
        scenario.onActivity { activity ->
            MapLibre.getInstance(activity)
            val options = MapLibreMapOptions.createFromAttributes(activity).textureMode(true).pixelRatio(RATIO)
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

/** A controller with no scooters, no walks and no location. */
fun testController(scope: CoroutineScope) = ScooterMapController(
    api = object : ScooterAPIClient {
        override suspend fun scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) = ScooterResponse(vehicles = emptyList())
    },
    locationManager = NotDeterminedLocationManager(),
    defaults = InMemoryScooterDefaults(),
    scope = scope,
    directions = object : WalkingDirectionsClient {
        override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> = emptyList()
    },
    openInMaps = {},
    phoneLanguages = { listOf("en-US") },
)

/** Long enough for a move of MapKit's time to land. */
fun settle() {
    Thread.sleep(1_000)
    InstrumentationRegistry.getInstrumentation().waitForIdleSync()
}

private const val RATIO = 2f
private const val BLANK = """{"version":8,"sources":{},"layers":[{"id":"land","type":"background","paint":{"background-color":"#eef0f4"}}]}"""
