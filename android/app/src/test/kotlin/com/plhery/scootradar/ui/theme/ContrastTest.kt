package com.plhery.scootradar.ui.theme

import android.app.UiModeManager
import android.os.Build
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

// UI-186: with Increase Contrast, UIKit's system colours take their high-contrast variants; ScooterPalette's stay.

@RunWith(AndroidJUnit4::class)
class ContrastTest {
    @get:Rule
    val compose = createComposeRule()

    @After
    fun tearDown() {
        // The contrast is the whole process's, as the phone's setting is.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) setContrast(0f)
    }

    /** Each system colour stands further from what it is drawn on; nothing else changes. */
    @Test
    fun increasedContrastRaisesTheSystemColoursOnly() {
        for (colors in listOf(ScootColors.Light, ScootColors.Dark)) {
            val raised = colors.withIncreasedContrast()
            assertTrue(raised.isContrastIncreased)
            val ground = colors.systemBackground
            val raisedGround = raised.systemBackground
            val pairs = mapOf(
                "secondaryLabel" to (colors.secondaryLabel to raised.secondaryLabel),
                "tertiaryLabel" to (colors.tertiaryLabel to raised.tertiaryLabel),
                "quaternaryLabel" to (colors.quaternaryLabel to raised.quaternaryLabel),
                "tertiarySystemFill" to (colors.tertiarySystemFill to raised.tertiarySystemFill),
                "quaternarySystemFill" to (colors.quaternarySystemFill to raised.quaternarySystemFill),
                "systemGray2" to (colors.systemGray2 to raised.systemGray2),
                "separator" to (colors.separator to raised.separator),
                "accent" to (colors.accent to raised.accent),
                "systemGreen" to (colors.systemGreen to raised.systemGreen),
            )
            for ((name, pair) in pairs) {
                val (before, after) = pair
                assertTrue(
                    "$name in ${if (colors.isDark) "dark" else "light"}",
                    contrast(after, raisedGround) > contrast(before, ground),
                )
            }
            // A section's rows stand further from the grouped ground under them.
            assertTrue(
                contrast(raised.secondarySystemGroupedBackground, raised.systemGroupedBackground) >
                    contrast(colors.secondarySystemGroupedBackground, colors.systemGroupedBackground),
            )
            // With the system colours put back, the rest is as it was: the palette, the glass, the zones.
            val restored = raised.copy(
                isContrastIncreased = false,
                accent = colors.accent,
                systemGroupedBackground = colors.systemGroupedBackground,
                secondarySystemGroupedBackground = colors.secondarySystemGroupedBackground,
                secondaryLabel = colors.secondaryLabel,
                tertiaryLabel = colors.tertiaryLabel,
                quaternaryLabel = colors.quaternaryLabel,
                tertiarySystemFill = colors.tertiarySystemFill,
                quaternarySystemFill = colors.quaternarySystemFill,
                systemGray2 = colors.systemGray2,
                separator = colors.separator,
                systemGreen = colors.systemGreen,
            )
            assertEquals(colors, restored)
        }
        // UIKit's high-contrast systemBlue, which the rider on the map takes too (RiderArt).
        assertEquals(Color(0xFF0040DD), ScootColors.Light.withIncreasedContrast().accent)
        assertEquals(Color(0xFF409CFF), ScootColors.Dark.withIncreasedContrast().accent)
    }

    /** A sheet's raised level, in the dark, keeps the higher contrast's backgrounds. */
    @Test
    fun aSheetsColoursKeepTheIncreasedContrast() {
        val sheet = ScootColors.Dark.withIncreasedContrast().elevated()
        assertTrue(sheet.isContrastIncreased)
        assertEquals(Color(0xFF242426), sheet.systemGroupedBackground)
        assertEquals(Color(0xFF363638), sheet.secondarySystemGroupedBackground)
        assertEquals(ScootColors.Dark.withIncreasedContrast().separator, sheet.separator)
        assertEquals(ScootColors.Light.withIncreasedContrast(), ScootColors.Light.withIncreasedContrast().elevated())
    }

    /**
     * The theme takes the contrast the phone has as it starts, and follows a change while the app runs: medium and
     * high raise it, standard and lower don't.
     */
    @Test
    @Config(sdk = [Config.NEWEST_SDK])
    fun theThemeFollowsThePhonesContrast() {
        setContrast(0.5f)
        var colors: ScootColors? = null
        compose.setContent { ScootTheme(dark = false) { colors = scootColors } }
        compose.waitForIdle()
        assertTrue(colors!!.isContrastIncreased)

        for ((contrast, raised) in listOf(0f to false, 1f to true, -0.5f to false, 0.5f to true, 0f to false)) {
            setContrast(contrast)
            compose.waitForIdle()
            assertEquals("contrast $contrast", raised, colors!!.isContrastIncreased)
            assertEquals("contrast $contrast", if (raised) Color(0xFF0040DD) else ScootColors.Light.accent, colors!!.accent)
        }
    }

    /** Android 12 and 13 have no contrast setting: the colours are the standard ones, and nothing fails. */
    @Test
    @Config(sdk = [31])
    fun beforeAndroid14TheColoursStayAsTheyAre() {
        var colors: ScootColors? = null
        compose.setContent { ScootTheme(dark = true) { colors = scootColors } }
        compose.waitForIdle()
        assertEquals(ScootColors.Dark, colors)
    }

    private fun setContrast(contrast: Float) {
        val modes = ApplicationProvider.getApplicationContext<android.content.Context>().getSystemService(UiModeManager::class.java)
        shadowOf(modes).setContrast(contrast)
    }

    /** WCAG's contrast ratio of [color], laid on [ground], against the ground. */
    private fun contrast(color: Color, ground: Color): Float {
        val a = color.compositeOver(ground).luminance() + 0.05f
        val b = ground.luminance() + 0.05f
        return maxOf(a, b) / minOf(a, b)
    }
}
