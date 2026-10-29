package com.plhery.scootradar.ui

import android.os.Build
import android.view.View
import android.view.WindowInsetsController
import androidx.activity.compose.LocalActivity
import androidx.compose.foundation.layout.absolutePadding
import androidx.compose.foundation.systemGestureExclusion
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.dp
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.plhery.scootradar.core.model.ScreenRect
import kotlin.math.max

// .containerCornerOffset(.leading, sizeToFit: true) on the search island of ios/ScootRadar/Views/ScooterMapScreen.swift
// (ui.md UI-126): iPadOS draws a window's buttons over the app, and the search bar moves and narrows to clear them.
// Android's desktop windowing draws a caption bar across the top of the window, the app's chip at one end and the
// window's buttons at the other; from Android 15 it says where they are, and lets the app draw under the rest.

/**
 * The bar at [bar], in the screen's points, at the top of a window whose caption bar the map shows through: moved in
 * from its left or its right edge past each of the caption's [buttons] it would come within [gap] of, on the side of
 * the bar the button is nearer, as the iPad's bar moves and narrows beside the window's buttons. Null where that
 * leaves it narrower than [narrowest], or there are no buttons to keep clear of: the bar then goes under the caption.
 */
fun besideCaption(bar: ScreenRect, buttons: List<ScreenRect>, narrowest: Double = 200.0, gap: Double = 8.0): ScreenRect? {
    if (buttons.isEmpty()) return null
    var left = bar.minX
    var right = bar.maxX
    for (button in buttons) {
        val near = button.minX < bar.maxX + gap && button.maxX > bar.minX - gap &&
            button.minY < bar.maxY && button.maxY > bar.minY
        if (!near) continue
        if (button.midX < bar.midX) left = max(left, button.maxX + gap) else right = minOf(right, button.minX - gap)
    }
    if (right - left < narrowest) return null
    return ScreenRect(left, bar.minY, right - left, bar.height)
}

/**
 * A bar laid out across [slot] that goes at [bar] in it, beside the caption's buttons: the room it leaves on either
 * side. Its touches are kept from the caption, which would drag the window with them.
 */
fun Modifier.besideCaption(bar: ScreenRect, slot: ScreenRect): Modifier =
    absolutePadding(left = (bar.minX - slot.minX).dp, right = (slot.maxX - bar.maxX).dp).systemGestureExclusion()

/**
 * The caption bar's buttons, the app's chip among them, in the points of a screen at [origin] in the window, in
 * pixels, as the window last gave its insets: none outside desktop windowing, and none before Android 15, which
 * doesn't say where they are.
 */
@Composable
fun rememberCaptionButtons(origin: Offset): List<ScreenRect> {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) return emptyList()
    val view = LocalView.current
    var rects by remember { mutableStateOf(emptyList<android.graphics.Rect>()) }
    DisposableEffect(view) {
        // The view the composition is in takes the insets for Compose, which doesn't keep the caption's buttons: the
        // one holding it reads them as they pass, and hands the insets on as they came.
        val host = view.parent as? View ?: return@DisposableEffect onDispose { }
        ViewCompat.setOnApplyWindowInsetsListener(host) { holder, insets ->
            rects = insets.getBoundingRects(WindowInsetsCompat.Type.captionBar())
            ViewCompat.onApplyWindowInsets(holder, insets)
        }
        ViewCompat.requestApplyInsets(host)
        onDispose { ViewCompat.setOnApplyWindowInsetsListener(host, null) }
    }
    val density = LocalDensity.current.density
    return remember(rects, origin, density) {
        rects.map { rect ->
            ScreenRect(
                ((rect.left - origin.x) / density).toDouble(),
                ((rect.top - origin.y) / density).toDouble(),
                (rect.width() / density).toDouble(),
                (rect.height() / density).toDouble(),
            )
        }
    }
}

/**
 * From Android 15, the map runs under the caption bar of a window in desktop windowing, as it runs under an iPad
 * window's buttons: the caption's background is left out, and its buttons are dark over a [light] map and light over
 * a dark one.
 */
@Composable
fun SeeThroughCaption(light: Boolean) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) return
    val window = LocalActivity.current?.window ?: return
    SideEffect {
        val seeThrough = WindowInsetsController.APPEARANCE_TRANSPARENT_CAPTION_BAR_BACKGROUND
        val lightCaption = WindowInsetsController.APPEARANCE_LIGHT_CAPTION_BARS
        window.insetsController?.setSystemBarsAppearance(
            seeThrough or (if (light) lightCaption else 0),
            seeThrough or lightCaption,
        )
    }
}
