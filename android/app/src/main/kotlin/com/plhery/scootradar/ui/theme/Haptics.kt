package com.plhery.scootradar.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback

// `.sensoryFeedback(.selection, trigger:)` in ios/ScootRadar/Views (ui.md §5, X-AD26).

/**
 * The selection tick each time [trigger] changes, whatever changed it, but not when it first appears: Android's
 * segment tick (SEGMENT_TICK from Android 14, CLOCK_TICK before), which follows the phone's touch feedback setting.
 */
@Composable
fun SelectionFeedback(trigger: Any?) {
    val haptics = LocalHapticFeedback.current
    val seen = remember { booleanArrayOf(false) }
    LaunchedEffect(trigger) {
        if (seen[0]) haptics.performHapticFeedback(HapticFeedbackType.SegmentTick)
        seen[0] = true
    }
}
