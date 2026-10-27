package com.plhery.scootradar.ui.theme

import android.graphics.Region
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.asAndroidPath
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class SquircleShapeTest {
    /** Ten pixels a point, so that a pixel's test is a tenth of a point's. */
    private val density = Density(10f)

    private fun outline(width: Float, height: Float, radius: Float) =
        SquircleShape(radius.dp).createOutline(Size(width * 10, height * 10), LayoutDirection.Ltr, density)

    /** Whether the point (x, y), in points, is inside the shape. */
    private fun Outline.Generic.covers(x: Float, y: Float): Boolean {
        val region = Region()
        region.setPath(path.asAndroidPath(), Region(-10, -10, 10_000, 10_000))
        return region.contains((x * 10).toInt(), (y * 10).toInt())
    }

    @Test
    fun theCornerKeepsToItsRectangle() {
        val bounds = (outline(200f, 100f, 28f) as Outline.Generic).path.getBounds()
        assertEquals(0f, bounds.left, 0.01f)
        assertEquals(0f, bounds.top, 0.01f)
        assertEquals(2000f, bounds.right, 0.01f)
        assertEquals(1000f, bounds.bottom, 0.01f)
    }

    @Test
    fun theCurveLeavesTheSideFurtherFromTheCornerThanACircleDoes() {
        // A continuous corner of 20 is still within a twentieth of a point of the top 23 points from the corner,
        // where a circular one is already 18.6 points in.
        val outline = outline(200f, 100f, 20f) as Outline.Generic
        assertTrue(outline.covers(200f - 26f, 0.05f))
        assertFalse(outline.covers(200f - 21f, 0.05f))
        // And it is as deep at the diagonal as a circle of about the same radius.
        assertTrue(outline.covers(200f - 7f, 7f))
        assertFalse(outline.covers(200f - 4f, 4f))
    }

    @Test
    fun aRadiusOfHalfTheShortSideMakesACapsule() {
        assertTrue(outline(120f, 34f, 999f) is Outline.Rounded)
        assertTrue(outline(120f, 34f, 17f) is Outline.Rounded)
    }

    @Test
    fun aRadiusTooBigForItsCurveShrinksToFit() {
        // 16 at 48 tall needs 24.5 of each side: the radius becomes 24 / 1.53, and the sides stay straight between.
        val outline = outline(100f, 48f, 16f) as Outline.Generic
        assertTrue(outline.covers(100f - 0.2f, 24f))
        assertTrue(outline.covers(50f, 0.05f))
        assertFalse(outline.covers(100f - 16f, 0.05f))
    }
}
