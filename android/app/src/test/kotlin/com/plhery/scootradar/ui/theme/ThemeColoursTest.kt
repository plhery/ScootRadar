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
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

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

    /**
     * No source of the app's, ScootTheme or any other, asks for the wallpaper's colours: Compose's dynamic schemes,
     * Material Components' DynamicColors (in code or as a theme), the system's palette as a colour resource
     * (`@android:color/system_accent1_500`, `android.R.color.system_…`), a theme on the device's default
     * (Theme.DeviceDefault and those under it, whose accent is the wallpaper's from Android 12), or the wallpaper's
     * colours themselves.
     */
    @Test
    fun noSourceOfTheAppsAsksForTheWallpapersColours() {
        // Unit tests run in the app module's folder.
        val folders = listOf(File("src/main"), File("src/debug"), File("../core/src/main"))
        val sources = folders.flatMap { folder -> folder.walk().filter { it.extension in setOf("kt", "java", "xml") }.toList() }
        assertTrue("sources read: ${sources.size}", sources.count { it.extension == "kt" } > 100 && sources.any { it.extension == "xml" })
        val uses = sources.flatMap { file ->
            file.readLines().withIndex()
                .filter { (_, line) -> wallpapers.containsMatchIn(line) }
                .map { (index, line) -> "${file.path}:${index + 1}: ${line.trim()}" }
        }
        assertEquals("", uses.joinToString("\n"))
    }

    private val wallpapers = Regex(
        listOf(
            """\bdynamic\w*ColorScheme\b""",
            """\bDynamicColors\b""",
            """\bcolor[/.]system_\w+""",
            """\bWallpaperColors\b""",
            """\bWallpaperManager\b""",
            """\bTheme[._]DeviceDefault""",
        ).joinToString("|"),
    )

    /**
     * The scan finds a theme on the device's default, as a parent in XML or in code, and lets AppCompat's, which
     * res/values/themes.xml has, be (review-app-w finding 9).
     */
    @Test
    fun theScanFindsAThemeOnTheDevicesDefault() {
        val found = listOf(
            """<style name="Theme.ScootRadar" parent="@android:style/Theme.DeviceDefault.DayNight">""",
            """<style name="Theme.ScootRadar" parent="android:Theme.DeviceDefault.Light.NoActionBar">""",
            """setTheme(android.R.style.Theme_DeviceDefault_DayNight)""",
        )
        found.forEach { line -> assertTrue(line, wallpapers.containsMatchIn(line)) }
        val passed = """<style name="Theme.ScootRadar" parent="Theme.AppCompat.DayNight.NoActionBar">"""
        assertFalse(passed, wallpapers.containsMatchIn(passed))
    }
}
