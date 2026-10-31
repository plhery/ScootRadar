package com.plhery.scootradar.ui.theme

import android.content.res.Configuration
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.ui.dock.SymbolIcon
import com.plhery.scootradar.ui.settings.AppearancePicture
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.math.abs

// UI-187: Bold Text makes the system font heavier on an iPhone, and the SF Symbols drawn in it with it. Android's Bold
// Text adds 300 to the configuration's font weights (Configuration.fontWeightAdjustment), which Compose's text
// follows; the symbols, outlines drawn at one weight, follow it here.

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "w400dp-h400dp-xxhdpi")
class BoldTextSymbolsTest {
    @get:Rule
    val compose = createComposeRule()

    /**
     * Under Bold Text each symbol is drawn heavier, at weight 700, the heaviest Material Symbols has: more of its
     * box is ink. The six iOS draws bold already stay as they are.
     */
    @Test
    fun underBoldTextEverySymbolUnderWeight700IsDrawnHeavier() {
        val symbols = Symbols::class.java.methods
            .filter { it.parameterCount == 0 && it.returnType == ImageVector::class.java }
            .map { it.name.removePrefix("get").replaceFirstChar(Char::lowercaseChar) to it.invoke(Symbols) as ImageVector }
            .sortedBy { it.first }
        assertTrue("the symbols found, ${symbols.size}", symbols.size >= 50)

        var shown by mutableStateOf(symbols.first().second)
        compose.setContent {
            Row {
                Box(Modifier.testTag(REGULAR).background(Color.White)) { SymbolIcon(shown, 48.dp, Color.Black) }
                Box(Modifier.width(8.dp))
                BoldText { Box(Modifier.testTag(BOLD).background(Color.White)) { SymbolIcon(shown, 48.dp, Color.Black) } }
            }
        }

        val notHeavier = mutableListOf<String>()
        val changed = mutableListOf<String>()
        for ((name, symbol) in symbols) {
            shown = symbol
            // The frame drawn on the window's surface, which the capture takes: one coming too soon after the last
            // is skipped, and the capture would show the symbol before it.
            compose.drawWindowAgain()
            val regular = ink(compose.onNodeWithTag(REGULAR).captureToImage())
            val bold = ink(compose.onNodeWithTag(BOLD).captureToImage())
            if (name in ALREADY_BOLD) {
                if (abs(bold - regular) > 0.001 * regular) changed += name
            } else if (bold < regular * 1.03) {
                notHeavier += "$name (${"%.3f".format(bold / regular)})"
            }
        }
        assertEquals("the symbols drawn no heavier under Bold Text", emptyList<String>(), notHeavier)
        assertEquals("the symbols iOS draws bold already, changed under Bold Text", emptyList<String>(), changed)
    }

    /** Automatic's picture in Appearance draws its sun and moon heavier under Bold Text, as iOS's SF Symbols are. */
    @Test
    fun underBoldTextAutomaticsSunIsDrawnHeavier() {
        compose.setContent {
            Row {
                Box(Modifier.width(160.dp).testTag(REGULAR)) { AppearancePicture(ScooterAppearance.Sun) }
                Box(Modifier.width(8.dp))
                BoldText { Box(Modifier.width(160.dp).testTag(BOLD)) { AppearancePicture(ScooterAppearance.Sun) } }
            }
        }
        compose.drawWindowAgain()
        val sun = Color(1f, 0.72f, 0.1f)
        val regular = count(compose.onNodeWithTag(REGULAR).captureToImage(), sun)
        val bold = count(compose.onNodeWithTag(BOLD).captureToImage(), sun)
        assertTrue("the sun's pixels in the picture, $regular", regular > 20)
        assertTrue("the sun's pixels under Bold Text, $bold against $regular", bold > regular * 1.03)
    }

    /** As Android's Bold Text sets it: 300 more on every weight. */
    @Composable
    private fun BoldText(content: @Composable () -> Unit) {
        val bold = Configuration(LocalConfiguration.current).apply { fontWeightAdjustment = 300 }
        CompositionLocalProvider(LocalConfiguration provides bold, content = content)
    }

    /** How much of the image is ink: the black drawn over white, a pixel half covered counting half. */
    private fun ink(image: ImageBitmap): Double {
        val pixels = image.toPixelMap()
        var sum = 0.0
        for (x in 0 until pixels.width) for (y in 0 until pixels.height) sum += 1.0 - pixels[x, y].red
        return sum
    }

    /** The pixels close to [colour]. */
    private fun count(image: ImageBitmap, colour: Color): Int {
        val pixels = image.toPixelMap()
        var found = 0
        for (x in 0 until pixels.width) for (y in 0 until pixels.height) {
            val pixel = pixels[x, y]
            if (abs(pixel.red - colour.red) < 0.06f && abs(pixel.green - colour.green) < 0.06f && abs(pixel.blue - colour.blue) < 0.06f) found++
        }
        return found
    }

    private companion object {
        const val REGULAR = "regular"
        const val BOLD = "bold"

        /** At weight 700 already: Try again's, the close button's, Directions', Open in's and a provider row's tick. */
        val ALREADY_BOLD = setOf("refresh", "close", "walk", "scooterBold", "mapBold", "checkBold")
    }
}
