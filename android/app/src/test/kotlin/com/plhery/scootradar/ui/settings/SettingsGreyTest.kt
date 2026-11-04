package com.plhery.scootradar.ui.settings

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.graphics.toArgb
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.ScooterMapLook
import com.plhery.scootradar.ui.theme.ScootColors
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Settings' grey text, its sections' headers and footers and the line under a choice, is the darker grey that reads at
 * 4.5 to 1 on the sheet, as the iPhone's is since 357f0c2c (ScooterPalette.secondaryText): the system's grey it
 * replaces read 3.3 to 1 on the light sheet.
 */
@RunWith(AndroidJUnit4::class)
class SettingsGreyTest {
    private fun Color.argb(): Long = toArgb().toLong() and 0xFFFFFFFF

    private fun ratio(text: Color, ground: Color): Double =
        ScooterMapLook.contrastRatio(between = text.compositeOver(ground).argb(), and = ground.argb())

    @Test
    fun settingsGreyTextReadsAtFourAndAHalfToOneOnTheSheet() {
        val palettes = listOf(ScootColors.Light, ScootColors.Dark).flatMap { listOf(it, it.withIncreasedContrast()) }.map { it.elevated() }
        for (palette in palettes) {
            // On the sheet, under a section, and in its rounded group, beside a row's text.
            for (ground in listOf(palette.systemGroupedBackground, palette.secondarySystemGroupedBackground)) {
                val ratio = ratio(palette.secondaryText, ground)
                assertTrue("dark: ${palette.isDark}, more contrast: ${palette.isContrastIncreased}, on $ground: $ratio", ratio >= 4.5)
            }
        }
        val light = ScootColors.Light.elevated()
        val before = ratio(light.secondaryLabel, light.systemGroupedBackground)
        assertTrue("$before", before < 3.5)
    }
}
