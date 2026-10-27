package com.plhery.scootradar.ui

import android.app.UiModeManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LifecycleStartEffect
import com.plhery.scootradar.core.model.UserInterfaceStyle

// WindowAppearance and the minute's TimelineView from ios/ScootRadar/Views/ScooterMapScreen.swift.

/**
 * Light or dark for the whole app, so for its sheets and dialogs too: the window's night mode, which Android
 * keeps for the app. Unspecified gives the choice back to the phone.
 */
@Composable
fun WindowAppearance(style: UserInterfaceStyle) {
    val context = LocalContext.current
    LaunchedEffect(style) {
        val manager = context.getSystemService(UiModeManager::class.java) ?: return@LaunchedEffect
        manager.setApplicationNightMode(
            when (style) {
                UserInterfaceStyle.Light -> UiModeManager.MODE_NIGHT_NO
                UserInterfaceStyle.Dark -> UiModeManager.MODE_NIGHT_YES
                // The app's own night mode is cleared, and the phone's applies.
                UserInterfaceStyle.Unspecified -> UiModeManager.MODE_NIGHT_AUTO
            },
        )
    }
}

/**
 * A count that goes up at the start of each minute, as the clock's does, and as the app returns to the
 * foreground: what depends on the time is read again then, as in a TimelineView of every minute.
 */
@Composable
fun everyMinute(): State<Int> {
    val context = LocalContext.current
    val minute = remember { mutableIntStateOf(0) }
    DisposableEffect(context) {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                minute.intValue += 1
            }
        }
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_TIME_TICK)
            addAction(Intent.ACTION_TIME_CHANGED)
            addAction(Intent.ACTION_TIMEZONE_CHANGED)
        }
        ContextCompat.registerReceiver(context, receiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED)
        onDispose { context.unregisterReceiver(receiver) }
    }
    LifecycleStartEffect(Unit) {
        minute.intValue += 1
        onStopOrDispose {}
    }
    return minute
}
