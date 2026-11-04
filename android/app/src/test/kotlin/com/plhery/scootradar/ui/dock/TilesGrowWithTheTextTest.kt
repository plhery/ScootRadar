package com.plhery.scootradar.ui.dock

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.ui.search.SearchSymbolTile
import com.plhery.scootradar.ui.theme.PHONE
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.useFontScale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

/**
 * The tiles beside a dock card's heading, the location card's text and a place in the search, which grow with the
 * text as the iPhone's do since 4 November (ddd8e672): their size at the standard text size, more with larger text,
 * and no more than where their cards still have room for their text, 64 points in the cards, 58 in the location
 * card and 50 in the search. The provider's tile on a scooter's card and a bay's "P" are private to their cards and
 * seen in the large-text baselines of both.
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = PHONE)
class TilesGrowWithTheTextTest {
    @get:Rule
    val compose = createComposeRule()

    @After
    fun tearDown() = resetFontScale()

    @Test
    fun atTheStandardTextSizeTheTilesKeepTheirSize() {
        sides(1f).assertIs(card = 44.dp, locationCard = 40.dp, search = 34.dp)
    }

    @Test
    fun withLargerTextTheyGrowUnderTheirCaps() {
        val sides = sides(1.3f)
        assertTrue("$sides", sides.card > 44.dp && sides.card < 64.dp)
        assertTrue("$sides", sides.locationCard > 40.dp && sides.locationCard < 58.dp)
        assertTrue("$sides", sides.search > 34.dp && sides.search < 50.dp)
    }

    @Test
    fun atTheLargestTextSizeTheyStopWhereTheirCardsStillHaveRoom() {
        // The body's 17 points become about 29 at Android's largest font scale, past every cap.
        sides(2f).assertIs(card = 64.dp, locationCard = 64.dp * 40f / 44f, search = 50.dp)
    }

    private data class Sides(val card: Dp, val locationCard: Dp, val search: Dp) {
        /** Within half a point, a pixel of the phone's xhdpi, to which the layout rounds. */
        fun assertIs(card: Dp, locationCard: Dp, search: Dp) {
            assertEquals("$this", card.value, this.card.value, 0.5f)
            assertEquals("$this", locationCard.value, this.locationCard.value, 0.5f)
            assertEquals("$this", search.value, this.search.value, 0.5f)
        }
    }

    private fun sides(fontScale: Float): Sides {
        useFontScale(fontScale)
        compose.setContent {
            Column {
                Box(Modifier.testTag("card")) { DockSymbolTile(Symbols.locationSlash, Color.Red, Color.Red) }
                Box(Modifier.testTag("locationCard")) { DockSymbolTile(Symbols.locationSlash, Color.Red, Color.Red, size = 40.dp) }
                Box(Modifier.testTag("search")) { SearchSymbolTile(Symbols.mapPin) }
            }
        }
        fun side(tag: String): Dp {
            val bounds = compose.onNodeWithTag(tag).getUnclippedBoundsInRoot()
            assertEquals(tag, bounds.right - bounds.left, bounds.bottom - bounds.top)
            return bounds.right - bounds.left
        }
        return Sides(side("card"), side("locationCard"), side("search"))
    }
}
