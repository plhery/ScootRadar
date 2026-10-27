package com.plhery.scootradar.map

import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.test.core.app.ActivityScenario
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

private const val RATIO = 2f
private const val BLANK = """{"version":8,"sources":{},"layers":[{"id":"land","type":"background","paint":{"background-color":"#eef0f4"}}]}"""
