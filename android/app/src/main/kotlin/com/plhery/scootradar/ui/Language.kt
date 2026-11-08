package com.plhery.scootradar.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.remember
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.localized

/**
 * The language the app is shown in, as the screen holds it: what reads it is composed again when Settings › Language
 * changes it. [localized] reads [ScooterLanguage.current], which Compose doesn't follow. The screen's chrome and
 * Settings' pages are made anew in the new language (`key(language)`), but an open sheet stays through the change,
 * and what it says itself would keep the language it opened in (app-bf).
 */
val LocalLanguage = compositionLocalOf { ScooterLanguage.current }

/** [localized], written again when the language chosen changes, in a composable that stays as it changes. */
@Composable
fun rememberLocalized(key: String): String {
    val language = LocalLanguage.current
    return remember(language, key) { localized(key) }
}
