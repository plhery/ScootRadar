package com.plhery.scootradar.ui.theme

import android.app.UiModeManager
import android.os.Build
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext

// Increase Contrast, which UIKit's system colours follow by themselves (ui.md UI-186).

/**
 * Whether the phone asks for more contrast, as iOS's Increase Contrast: Android 14's contrast set above standard,
 * medium or high, and followed while the app runs. Before Android 14 there is no such setting: the colours stay as
 * they are.
 */
@Composable
fun increasedContrastSetting(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return false
    val context = LocalContext.current
    val modes = remember(context) { context.getSystemService(UiModeManager::class.java) }
    val contrast = remember(modes) { mutableFloatStateOf(modes?.contrast ?: 0f) }
    DisposableEffect(modes) {
        val listener = UiModeManager.ContrastChangeListener { contrast.floatValue = it }
        modes?.addContrastChangeListener(context.mainExecutor, listener)
        // A change while the listener was being added.
        contrast.floatValue = modes?.contrast ?: 0f
        onDispose { modes?.removeContrastChangeListener(listener) }
    }
    return contrast.floatValue > 0f
}
