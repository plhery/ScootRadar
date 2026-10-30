package com.plhery.scootradar.ui.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

// X.md X-AD35: the app's own colours, as the iPhone app has them, and never Material You's, which Android 12 and
// later draw from the wallpaper.

@RunWith(AndroidJUnit4::class)
class ThemeColoursTest {
    @get:Rule
    val compose = createComposeRule()

    /** Material's few controls take the app's blue and background, and its other colours stay Material's own. */
    @Test
    fun materialTakesTheAppsColoursNotTheWallpapers() {
        var dark by mutableStateOf(false)
        var scheme: ColorScheme? = null
        compose.setContent { ScootTheme(dark = dark, increasedContrast = false) { scheme = MaterialTheme.colorScheme } }
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()
        for (appearance in listOf(false, true)) {
            dark = appearance
            compose.waitForIdle()
            val colors = if (appearance) ScootColors.Dark else ScootColors.Light
            val baseline = if (appearance) darkColorScheme() else lightColorScheme()
            val wallpaper = if (appearance) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
            val shown = scheme!!
            assertEquals(colors.accent, shown.primary)
            assertEquals(colors.systemBackground, shown.background)
            assertEquals(colors.systemBackground, shown.surface)
            assertEquals(baseline.secondary, shown.secondary)
            assertEquals(baseline.surfaceVariant, shown.surfaceVariant)
            // The wallpaper's colours are other colours, so that a scheme drawn from it would be seen.
            assertNotEquals(wallpaper.secondary, shown.secondary)
        }
    }
}
