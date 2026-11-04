package com.plhery.scootradar.baselineprofile

// Android's own (app-av): the map's frames as the rider zooms it, pinching in and out and double-tapping, on the
// benchmarkRelease build, minified as release and compiled with the Baseline Profile as Play installs it; and as the
// rider pans it, the control a rider found smooth. The map opens on Zürich's main station, where the rider is put
// (`adb emu geo fix 8.5395 47.3763` on an emulator, before the run; on one without GPS, as ScootRadar_Tablet, a fused
// test provider kept fresh), among hundreds of scooters. The frames of each rest count too, with the dock's counts
// rolling to the new view. frameDurationCpuMs is the app's UI and render threads' work for a frame, frameOverrunMs
// how late it was; MapLibre's own GL thread, which TextureView mode draws the map on, is in each iteration's trace.
// On an emulator the numbers only compare builds measured the same way.
//
// ./gradlew :baselineprofile:connectedBenchmarkReleaseAndroidTest
//   -Pandroid.testInstrumentationRunnerArguments.class=com.plhery.scootradar.baselineprofile.ZoomBenchmark

import android.Manifest
import android.graphics.PointF
import android.os.SystemClock
import android.view.InputDevice
import android.view.MotionEvent
import androidx.benchmark.macro.BaselineProfileMode
import androidx.benchmark.macro.CompilationMode
import androidx.benchmark.macro.FrameTimingMetric
import androidx.benchmark.macro.MacrobenchmarkScope
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ZoomBenchmark {
    @get:Rule
    val rule = MacrobenchmarkRule()

    /**
     * Pinched out to the clusters and back in to the dots three times, then double-tapped in twice and
     * two-finger-tapped out twice.
     */
    @Test
    fun zoom() = frames {
        repeat(PINCHES) {
            pinch(from = WIDE, to = NARROW)
            pinch(from = NARROW, to = WIDE)
        }
        val (x, y) = clearOfMarkers()
        repeat(2) { doubleTap(x, y) }
        repeat(2) { twoFingerTap() }
    }

    /** The control: the map dragged and flung as far, as often and for as long, at one zoom. */
    @Test
    fun pan() = frames {
        repeat(PINCHES) {
            drag(dx = SPAN, dy = 0f)
            drag(dx = -SPAN, dy = 0f)
        }
        repeat(2) { drag(dx = 0f, dy = SPAN / 2) }
        repeat(2) { drag(dx = 0f, dy = -SPAN / 2) }
    }

    private fun frames(gestures: MacrobenchmarkScope.() -> Unit) = rule.measureRepeated(
        packageName = PACKAGE,
        metrics = listOf(FrameTimingMetric()),
        compilationMode = CompilationMode.Partial(BaselineProfileMode.Require),
        // A start mode would kill the app after the setup, for the measure to start it.
        startupMode = null,
        iterations = ITERATIONS,
        setupBlock = {
            // Each iteration from a new launch, at the same place and zoom.
            killProcess()
            // The rider's place, as a phone that may locate the rider opens on it.
            for (permission in listOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)) {
                device.executeShellCommand("pm grant $PACKAGE $permission")
            }
            startActivityAndWait()
            waitForMarkers()
            // The ground's tiles and the scooters' light-up, done before the gestures.
            Thread.sleep(SETTLE_MS)
        },
    ) { gestures() }

    private val uiAutomation get() = InstrumentationRegistry.getInstrumentation().uiAutomation

    /** The middle of the map, clear of the search bar above and the dock below. */
    private fun MacrobenchmarkScope.centre() = PointF(device.displayWidth / 2f, device.displayHeight * CENTRE_HEIGHT)

    /** Two fingers apart by [from] pixels, moved to [to] across the middle of the map over [PINCH_MS], then lifted. */
    private fun MacrobenchmarkScope.pinch(from: Float, to: Float) {
        val centre = centre()
        val scale = device.displayWidth.toFloat()
        fun fingers(span: Float) = listOf(PointF(centre.x - span * scale / 2, centre.y), PointF(centre.x + span * scale / 2, centre.y))
        val down = SystemClock.uptimeMillis()
        inject(MotionEvent.ACTION_DOWN, down, down, fingers(from).take(1))
        inject(MotionEvent.ACTION_POINTER_DOWN or (1 shl MotionEvent.ACTION_POINTER_INDEX_SHIFT), down, down, fingers(from))
        val steps = (PINCH_MS / STEP_MS).toInt()
        for (step in 1..steps) {
            val at = down + step * STEP_MS
            waitUntil(at)
            inject(MotionEvent.ACTION_MOVE, down, at, fingers(from + (to - from) * step / steps))
        }
        val up = SystemClock.uptimeMillis()
        inject(MotionEvent.ACTION_POINTER_UP or (1 shl MotionEvent.ACTION_POINTER_INDEX_SHIFT), down, up, fingers(to))
        inject(MotionEvent.ACTION_UP, down, up, fingers(to).take(1))
        Thread.sleep(REST_MS)
    }

    /** One finger dragged by [dx] and [dy] of the screen's width over [PINCH_MS], then lifted as it moves. */
    private fun MacrobenchmarkScope.drag(dx: Float, dy: Float) {
        val centre = centre()
        val scale = device.displayWidth.toFloat()
        val from = PointF(centre.x - dx * scale / 2, centre.y - dy * scale / 2)
        val down = SystemClock.uptimeMillis()
        inject(MotionEvent.ACTION_DOWN, down, down, listOf(from))
        val steps = (PINCH_MS / STEP_MS).toInt()
        for (step in 1..steps) {
            val at = down + step * STEP_MS
            waitUntil(at)
            inject(MotionEvent.ACTION_MOVE, down, at, listOf(PointF(from.x + dx * scale * step / steps, from.y + dy * scale * step / steps)))
        }
        inject(MotionEvent.ACTION_UP, down, SystemClock.uptimeMillis(), listOf(PointF(from.x + dx * scale, from.y + dy * scale)))
        Thread.sleep(REST_MS)
    }

    /** Two taps at one place, as quickly as a rider's: MapLibre zooms in by one around it. */
    private fun doubleTap(x: Float, y: Float) {
        repeat(2) {
            val down = SystemClock.uptimeMillis()
            inject(MotionEvent.ACTION_DOWN, down, down, listOf(PointF(x, y)))
            waitUntil(down + TAP_MS)
            inject(MotionEvent.ACTION_UP, down, SystemClock.uptimeMillis(), listOf(PointF(x, y)))
            Thread.sleep(TAP_MS)
        }
        Thread.sleep(REST_MS)
    }

    /** Two fingers tapped at once: MapLibre zooms out by one. */
    private fun MacrobenchmarkScope.twoFingerTap() {
        val centre = centre()
        val fingers = listOf(PointF(centre.x - FINGERS_APART, centre.y), PointF(centre.x + FINGERS_APART, centre.y))
        val down = SystemClock.uptimeMillis()
        inject(MotionEvent.ACTION_DOWN, down, down, fingers.take(1))
        inject(MotionEvent.ACTION_POINTER_DOWN or (1 shl MotionEvent.ACTION_POINTER_INDEX_SHIFT), down, down, fingers)
        waitUntil(down + TAP_MS)
        val up = SystemClock.uptimeMillis()
        inject(MotionEvent.ACTION_POINTER_UP or (1 shl MotionEvent.ACTION_POINTER_INDEX_SHIFT), down, up, fingers)
        inject(MotionEvent.ACTION_UP, down, up, fingers.take(1))
        Thread.sleep(REST_MS)
    }

    /** Of the middle of the map, the place farthest from any marker, where a tap selects nothing. */
    private fun MacrobenchmarkScope.clearOfMarkers(): Pair<Float, Float> {
        val markers = markerCentres()
        val width = device.displayWidth
        val height = device.displayHeight
        var best = centre().x to centre().y
        var room = -1f
        for (i in 2..8) {
            for (j in 3..5) {
                val x = width * i / 10f
                val y = height * j / 10f
                val nearest = markers.minOfOrNull { (it.x - x) * (it.x - x) + (it.y - y) * (it.y - y) } ?: Float.MAX_VALUE
                if (nearest > room) {
                    room = nearest
                    best = x to y
                }
            }
        }
        return best
    }

    private fun inject(action: Int, down: Long, at: Long, points: List<PointF>) {
        val properties = Array(points.size) { i ->
            MotionEvent.PointerProperties().apply {
                id = i
                toolType = MotionEvent.TOOL_TYPE_FINGER
            }
        }
        val coordinates = Array(points.size) { i ->
            MotionEvent.PointerCoords().apply {
                x = points[i].x
                y = points[i].y
                pressure = 1f
                size = 1f
            }
        }
        val event = MotionEvent.obtain(down, at, action, points.size, properties, coordinates, 0, 0, 1f, 1f, 0, 0, InputDevice.SOURCE_TOUCHSCREEN, 0)
        uiAutomation.injectInputEvent(event, false)
        event.recycle()
    }

    private fun waitUntil(at: Long) {
        val wait = at - SystemClock.uptimeMillis()
        if (wait > 0) Thread.sleep(wait)
    }

    private companion object {
        const val ITERATIONS = 5
        const val PINCHES = 3

        /**
         * The fingers' span pinched between, as a share of the screen's width: about two zoom levels each way, from
         * the street the map opens on (about 17) to the clusters (15 and under).
         */
        const val NARROW = 0.2f
        const val WIDE = 0.85f

        /** How far a drag goes, as a share of the screen's width. */
        const val SPAN = 0.6f

        /** Where the middle of the map is, as a share of the screen's height. */
        const val CENTRE_HEIGHT = 0.45f

        const val PINCH_MS = 450L

        /** A touch screen's report rate: 120 Hz. */
        const val STEP_MS = 8L
        const val TAP_MS = 60L
        const val FINGERS_APART = 60f

        /** The map left to finish its move, its fling and its new tiles after each gesture. */
        const val REST_MS = 900L
        const val SETTLE_MS = 3_000L
    }
}
