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
import android.view.FrameMetrics
import android.view.Window
import android.view.WindowManager
import androidx.compose.foundation.background
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.plhery.scootradar.ui.theme.scootColors
import java.util.function.Consumer

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

/** How strongly the map is blurred under the glass: the spike's match for Liquid Glass's regular material. */
private val blurRadius = 24.dp

/**
 * `.chromeGlass(in:)`: the map under the element, blurred, frosted and tinted as the iPhone's glass, where the
 * blur may run and [live] asks for it (the dock and the search bar); elsewhere, and whenever the blur can't run,
 * a translucent fill.
 */
fun Modifier.chromeGlass(shape: Shape, live: Boolean = false): Modifier = composed {
    val glass = LocalGlass.current
    val colors = scootColors
    val backdrop = glass.backdrop
    if (live && glass.blurs && backdrop != null) {
        clip(shape).mapBlur(backdrop, blurRadius).background(colors.glassFrost).background(colors.glassTint)
    } else {
        clip(shape).background(colors.glassFill)
    }
}

/**
 * Whether the glass may blur: not under power saver, not where Android turns its own blurs off (the phone can't,
 * or its "Allow window-level blurs" is off: the nearest to iOS's Reduce Transparency, UI-185), and not once the
 * window has dropped frames while blurring.
 */
@Composable
fun glassMayBlur(): Boolean {
    val context = LocalContext.current
    var windowBlurs by remember { mutableStateOf(context.getSystemService(WindowManager::class.java)?.isCrossWindowBlurEnabled ?: false) }
    var powerSave by remember { mutableStateOf(context.getSystemService(PowerManager::class.java)?.isPowerSaveMode ?: false) }
    var keepsUp by remember { mutableStateOf(FrameWatch.keepsUp) }
    DisposableEffect(context) {
        val windows = context.getSystemService(WindowManager::class.java)
        val blurListener = Consumer<Boolean> { windowBlurs = it }
        windows?.addCrossWindowBlurEnabledListener(ContextCompat.getMainExecutor(context), blurListener)
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
        val window = context.activity()?.window
        val watch = window?.let { FrameWatch(it) { keepsUp = false } }
        onDispose {
            windows?.removeCrossWindowBlurEnabledListener(blurListener)
            context.unregisterReceiver(receiver)
            watch?.stop()
        }
    }
    return windowBlurs && !powerSave && keepsUp
}

/**
 * Counts the window's slow frames: if a tenth of them or more are slow in two windows of 120 frames running, the
 * blur can't keep up, and the fill takes its place until the app is started again.
 */
private class FrameWatch(private val window: Window, private val onSlow: () -> Unit) {
    private var frames = 0
    private var slow = 0
    private var slowWindows = 0
    private val listener = Window.OnFrameMetricsAvailableListener { _, metrics, _ -> count(metrics) }

    init {
        window.addOnFrameMetricsAvailableListener(listener, Handler(Looper.getMainLooper()))
    }

    private fun count(metrics: FrameMetrics) {
        if (!keepsUp) return
        val interval = metrics.getMetric(FrameMetrics.DEADLINE).takeIf { it > 0 } ?: 16_666_667L
        frames += 1
        if (metrics.getMetric(FrameMetrics.TOTAL_DURATION) > interval * 3 / 2) slow += 1
        if (frames < WINDOW) return
        slowWindows = if (slow * 10 >= frames) slowWindows + 1 else 0
        frames = 0
        slow = 0
        if (slowWindows >= 2) {
            keepsUp = false
            onSlow()
        }
    }

    fun stop() = window.removeOnFrameMetricsAvailableListener(listener)

    companion object {
        private const val WINDOW = 120

        /** False once the blur has failed to keep up, for the rest of the app's run. */
        var keepsUp = true
            private set
    }
}

private tailrec fun Context.activity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.activity()
    else -> null
}
