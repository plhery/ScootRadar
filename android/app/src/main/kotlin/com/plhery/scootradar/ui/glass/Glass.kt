package com.plhery.scootradar.ui.glass

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import android.content.IntentFilter
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.SystemClock
import android.view.FrameMetrics
import android.view.Window
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.drawOutline
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.plhery.scootradar.ui.theme.LocalReduceMotion
import com.plhery.scootradar.ui.theme.atOnceUnderReduceMotion
import com.plhery.scootradar.ui.theme.scootColors
import kotlinx.coroutines.delay
import kotlin.math.max

// ChromeGlass in ios/ScootRadar/Views/ScooterControls.swift, and the fills that stand in for it (PLAN §4 "Glass",
// ui.md UI-351 and UI-185).

/** What the glass blurs, and whether it may now. With no backdrop (tests, previews), every glass is the fill. */
@Immutable
data class Glass(val backdrop: MapBackdrop?, val blurs: Boolean) {
    companion object {
        val Fill = Glass(backdrop = null, blurs = false)
    }
}

val LocalGlass = staticCompositionLocalOf { Glass.Fill }

/**
 * How strongly the map is blurred under the glass: the spike's match for Liquid Glass's regular material, 24 dp,
 * made a little softer as the glass was made more see-through (app-aw), so that the map reads as a soft image.
 */
private val blurRadius = 30.dp

/**
 * `.chromeGlass(in:)`: the map under the element, blurred, frosted and tinted as the iPhone's glass, where the
 * blur may run and [live] asks for it (the dock and the search bar); elsewhere, and whenever the blur can't run,
 * a translucent fill. With Increase Contrast, its edge. What the glass holds, and all that follows in the chain, is
 * [heldInLayer].
 */
fun Modifier.chromeGlass(shape: Shape, live: Boolean = false): Modifier = composed {
    val glass = LocalGlass.current
    val colors = scootColors
    val backdrop = glass.backdrop
    if (live && glass.blurs && backdrop != null) {
        clip(shape).mapBlur(backdrop, blurRadius).background(colors.glassFrost).background(colors.glassTint).glassEdge(shape)
    } else {
        clip(shape).background(colors.glassFill).glassEdge(shape)
    }.heldInLayer()
}

/**
 * Draws what follows into a layer of its own, which the renderer keeps until what is in it changes. Under a shape
 * that is no rounded rectangle, as the continuous corners are, Android's renderer cuts each drawing by a mask it
 * makes on the CPU and uploads, at every frame the window draws: while the map moves, every frame. Held in a layer,
 * the glass's text and icons are cut as one picture, and drawn again only when they change, not for each frame of
 * the map's (app-av, on Phone_Min: 41 masks a frame of a zoom before, 14 after; the render thread's time halved).
 */
private fun Modifier.heldInLayer(): Modifier = graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen }

/**
 * The solid outline Liquid Glass takes with Increase Contrast, which sets it apart from what is under it (UI-186):
 * a point of the high-contrast separator inside the glass's edge. Apple doesn't give its colour or width; nothing
 * without Increase Contrast.
 */
fun Modifier.glassEdge(shape: Shape): Modifier = composed {
    val colors = scootColors
    if (colors.isContrastIncreased) border(1.dp, colors.separator, shape) else this
}

/**
 * A glass control under the finger (ui.md UI-211): while [pressed] the glass swells to 1.04 on a spring, with all it
 * holds and its focus ring, and lights up between the glass and what it holds; under a mouse's pointer ([hovered])
 * it is lit half as much. With Reduce Motion it lights up without swelling. [glass] is the glass itself; what
 * follows in the chain is drawn on it.
 */
fun Modifier.pressedGlass(pressed: Boolean, shape: Shape, glass: Modifier, hovered: Boolean = false): Modifier = composed {
    val reduceMotion = LocalReduceMotion.current
    val swell by animateFloatAsState(if (pressed && !reduceMotion) PRESSED_SWELL else 1f, pressSpring, label = "swell")
    val lit = if (pressed) 1f else if (hovered) 0.5f else 0f
    // Under Reduce Motion lit, or not, in the frame it is pressed or let go (UI-184).
    val light by animateFloatAsState(lit, if (reduceMotion) snap() else pressSpring, label = "light").atOnceUnderReduceMotion(lit)
    graphicsLayer {
        scaleX = swell
        scaleY = swell
    }
        .then(glass)
        .drawBehind {
            if (light > 0f) {
                val white = Color.White.copy(alpha = (PRESSED_LIGHT * light).coerceIn(0f, 1f))
                drawOutline(shape.createOutline(size, layoutDirection, this), white)
            }
        }
}

/** How much a glass control swells under the finger. */
private const val PRESSED_SWELL = 1.04f

/** How much white lights the glass under the finger: a guess at Liquid Glass's glow, which can't be copied (UI-385). */
private const val PRESSED_LIGHT = 0.16f

/** The swell's spring: `spring(dampingRatio: 0.85, response: 0.3)`. */
private val pressSpring = spring<Float>(dampingRatio = 0.85f, stiffness = 438.6f)

/**
 * Whether the glass may blur: not under power saver, and not while the blur drops frames (UI-185). Android has
 * no Reduce Transparency, and Liquid Glass blurs on every iPhone, so a phone whose compositor can't blur other
 * windows still blurs the map in the app (RenderEffect needs no compositor).
 */
@Composable
fun glassMayBlur(): Boolean {
    val context = LocalContext.current
    var powerSave by remember { mutableStateOf(context.getSystemService(PowerManager::class.java)?.isPowerSaveMode ?: false) }
    var keepsUp by remember { mutableStateOf(blurRun.blurs) }
    val blurs = !powerSave && keepsUp
    DisposableEffect(context) {
        val power = context.getSystemService(PowerManager::class.java)
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                powerSave = power?.isPowerSaveMode ?: false
            }
        }
        ContextCompat.registerReceiver(
            context,
            receiver,
            IntentFilter(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED),
            ContextCompat.RECEIVER_NOT_EXPORTED,
        )
        onDispose { context.unregisterReceiver(receiver) }
    }
    // Only the frames drawn while the glass blurs are counted.
    DisposableEffect(context, blurs) {
        val watch = if (blurs) context.activity()?.window?.let { FrameWatch(it) { keepsUp = false } } else null
        onDispose { watch?.stop() }
    }
    // Turned off by slow frames, the blur is tried once more when the map has rested a minute.
    if (!keepsUp && blurRun.mayTryAgain) {
        LaunchedEffect(Unit) {
            while (true) {
                val left = blurRun.restLeft(SystemClock.uptimeMillis(), MapBackdrop.touchedAt)
                if (left <= 0) break
                delay(left)
            }
            blurRun.tryAgain()
            keepsUp = true
        }
    }
    return blurs
}

/** Whether the glass blurs in this run of the app, which outlives an activity made again. */
private val blurRun = BlurRun()

/** Counts the window's frames while the glass blurs, and stops the blur once [SlowFrames] finds it can't keep up. */
private class FrameWatch(private val window: Window, private val onSlow: () -> Unit) {
    private val start = SystemClock.uptimeMillis()
    private val frames = SlowFrames()
    private val listener = Window.OnFrameMetricsAvailableListener { _, metrics, _ -> count(metrics) }

    init {
        window.addOnFrameMetricsAvailableListener(listener, Handler(Looper.getMainLooper()))
    }

    private fun count(metrics: FrameMetrics) {
        // A cold start's first load is slow with or without the blur, and so are the frames that make it again.
        if (!blurRun.blurs || SystemClock.uptimeMillis() - start < WARM_UP_MILLIS) return
        val deadline = metrics.getMetric(FrameMetrics.DEADLINE).takeIf { it > 0 } ?: 16_666_667L
        if (frames.count(metrics.getMetric(FrameMetrics.TOTAL_DURATION), deadline)) {
            blurRun.stop(SystemClock.uptimeMillis())
            onSlow()
        }
    }

    fun stop() = window.removeOnFrameMetricsAvailableListener(listener)

    private companion object {
        const val WARM_UP_MILLIS = 5_000L
    }
}

/**
 * What FrameWatch makes of the window's frames, apart from the window so that a test can feed it frames. A frame is
 * slow once it takes more than twice its deadline, a frame dropped at least; the blur can't keep up once a quarter of
 * the frames or more are slow in [SLOW_WINDOWS] windows of [WINDOW] frames running. A pinch's burst of slow frames
 * doesn't stop it: only a phone that drops a frame in four while the map moves, for three windows on end, does.
 */
internal class SlowFrames {
    private var frames = 0
    private var slow = 0
    private var slowWindows = 0

    /** Counts a frame drawn in [nanos], against its [deadline] in nanoseconds: true once the blur can't keep up. */
    fun count(nanos: Long, deadline: Long): Boolean {
        frames += 1
        if (nanos > deadline * 2) slow += 1
        if (frames < WINDOW) return false
        slowWindows = if (slow * 4 >= frames) slowWindows + 1 else 0
        frames = 0
        slow = 0
        return slowWindows >= SLOW_WINDOWS
    }

    companion object {
        const val WINDOW = 120
        const val SLOW_WINDOWS = 3
    }
}

/**
 * Whether the glass blurs in a run of the app. Once slow frames have stopped it, it is tried once more, when the map
 * has rested [REST_MILLIS]: that long since it stopped and since a hand was last on the map. If it stops again, the
 * fill stays until the app is started again: the iPhone never loses its glass, but a phone that can't keep up with
 * it twice won't the third time.
 */
internal class BlurRun {
    var blurs = true
        private set
    private var stops = 0
    private var stoppedAt = 0L

    /** Whether the blur is off and has one more try left. */
    val mayTryAgain: Boolean
        get() = !blurs && stops == 1

    /** Stops the blur at [now], in milliseconds. */
    fun stop(now: Long) {
        if (!blurs) return
        blurs = false
        stops += 1
        stoppedAt = now
    }

    /** How long, at [now], until the map has rested long enough, a hand last on it at [touched]; 0 once it has. */
    fun restLeft(now: Long, touched: Long): Long = max(0L, max(stoppedAt, touched) + REST_MILLIS - now)

    /** Gives the blur back, if it has a try left. */
    fun tryAgain() {
        if (mayTryAgain) blurs = true
    }

    companion object {
        const val REST_MILLIS = 60_000L
    }
}

private tailrec fun Context.activity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.activity()
    else -> null
}
