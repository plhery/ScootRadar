package com.plhery.scootradar.ui.theme

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextOverflow
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.util.Locale

// The search bar's title in ios/ScootRadar/Views/SwissAddressSearch.swift (ScooterSearchIsland.barText):
// `.lineLimit(2).minimumScaleFactor(0.9)` at the accessibility sizes, for a place.

/**
 * `.minimumScaleFactor(_:)` on two lines, as SwiftUI lays it out (drawn with ImageRenderer, app-bb): a word broken in
 * the middle doesn't fit, as a text cut short doesn't, so the text is drawn smaller; where no size down to the factor
 * keeps the word whole, it is broken at the factor. The search bar's place in its style at font scale 2.0, in a box a
 * share of the text's own width on one line.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = PHONE)
class MinimumScaleFactorTest {
    @get:Rule
    val compose = createComposeRule()

    @After
    fun tearDown() {
        resetFontScale()
    }

    @Test
    fun aWordTooLongForTheLineAtEverySizeIsBrokenAtTheSmallest() {
        val title = barTitle("Bahnhofstrasse", share = 0.85f)
        assertEquals("lines", 2, title.layout.lineCount)
        assertEquals("drawn at 0.9 of its size: ${title.seen}", title.smallest, title.drawn, 1f)
    }

    @Test
    fun aWordThatFitsOnTheLineSmallerIsShrunkRatherThanBroken() {
        val title = barTitle("Bahnhofstrasse", share = 0.95f)
        assertEquals("lines", 1, title.layout.lineCount)
        assertTrue("drawn smaller than its size, larger than 0.9 of it: ${title.seen}", title.drawn in title.smallest + 1..title.own - 1)
    }

    @Test
    fun wordsThatWrapBetweenThemKeepTheirSize() {
        val title = barTitle("Rue de la Gare", share = 0.7f)
        assertEquals("lines", 2, title.layout.lineCount)
        assertEquals("the first line", "Rue de la ", title.layout.layoutInput.text.text.substring(0, title.layout.getLineEnd(0)))
        assertEquals("drawn at its size: ${title.seen}", title.own, title.drawn, 1f)
    }

    /**
     * How [text] was laid out, and the span of its first four letters in pixels: as drawn, laid out at its size and at
     * 0.9 of it.
     */
    private class Title(val layout: TextLayoutResult, val drawn: Float, val own: Float, val smallest: Float) {
        val seen: String get() = "%.1f px drawn, %.1f at its size, %.1f at 0.9 of it".format(Locale.ROOT, drawn, own, smallest)
    }

    /**
     * [text] as the search bar sets a place at font scale 2.0, in a box [share] as wide as it is on one line at its
     * size. The size drawn is read from the span of its first four letters, against theirs laid out at its size and at
     * 0.9 of it, as glyphs are not set exactly in proportion to the size.
     */
    private fun barTitle(text: String, share: Float): Title {
        useFontScale(2f)
        var laidOut: TextLayoutResult? = null
        var own: TextLayoutResult? = null
        var smallest: TextLayoutResult? = null
        compose.setContent {
            ScootTheme(dark = false) {
                val style = ScootType.subheadline.weight(FontWeight.SemiBold)
                val measurer = rememberTextMeasurer()
                val density = LocalDensity.current
                val atItsSize = remember(text) { measurer.measure(text, style, softWrap = false, maxLines = 1) }
                own = atItsSize
                smallest = remember(text) {
                    measurer.measure(text, style.copy(fontSize = shrunk(style.fontSize, 0.9f, density)), softWrap = false, maxLines = 1)
                }
                val width = with(density) { (atItsSize.size.width * share).toDp() }
                Box(Modifier.width(width)) {
                    Text(
                        text,
                        style = style,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        autoSize = shrinking(style, 0.9f),
                        onTextLayout = { laidOut = it },
                    )
                }
            }
        }
        compose.waitForIdle()
        fun TextLayoutResult?.span(): Float = checkNotNull(this).let { it.getBoundingBox(3).right - it.getBoundingBox(0).left }
        return Title(checkNotNull(laidOut), laidOut.span(), own.span(), smallest.span())
    }
}
