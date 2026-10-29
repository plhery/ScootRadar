package com.plhery.scootradar.app

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.drawable.AdaptiveIconDrawable
import android.graphics.drawable.ColorDrawable
import androidx.core.graphics.createBitmap
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.github.takahirom.roborazzi.captureRoboImage
import com.plhery.scootradar.R
import com.plhery.scootradar.ui.theme.drawnArtOptions
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.math.abs
import kotlin.math.roundToInt

// UI-370, UI-372, UI-373: the iPhone's icon recut as an adaptive icon, and the iPhone's blank launch screen.

@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "xhdpi")
class AppIconTest {
    private val context: Context = ApplicationProvider.getApplicationContext()

    /**
     * 72 dp at xhdpi. An adaptive icon draws its 108 dp layers at 1.5 times its bounds, so these 216 px show their
     * middle 72 dp: the iPhone's 1024 px art (public/icon.svg), whose coordinates [art] takes.
     */
    private val size = 216

    private fun art(x: Float, y: Float) = Pair((x * size / 1024).roundToInt(), (y * size / 1024).roundToInt())

    // The middle of the deck, the top of the back wheel, and the night between them and the corner.
    private val deck = art(479.38f, 647.38f)
    private val wheelTop = art(251f, 606.88f)
    private val night = art(237f, 237f)

    @Test
    fun theIconIsTheIPhonesScooterOnItsNightWithALayerForThemedIcons() {
        val icon = context.getDrawable(context.packageManager.getApplicationInfo(context.packageName, 0).icon)
        assertTrue(icon is AdaptiveIconDrawable)
        icon as AdaptiveIconDrawable
        assertNotNull("a themed icon's layer", icon.monochrome)
        assertEquals(R.mipmap.ic_launcher, context.applicationInfo.icon)

        val drawn = createBitmap(size, size)
        icon.setBounds(0, 0, size, size)
        icon.draw(Canvas(drawn))
        assertNear(0x2F7BFF, drawn.pixel(deck))
        assertNear(0xF4F5F7, drawn.pixel(wheelTop))
        val dark = drawn.pixel(night)
        assertTrue(Integer.toHexString(dark), Color.red(dark) < 0x30 && Color.green(dark) < 0x30 && Color.blue(dark) < 0x40)
        drawn.captureRoboImage("src/test/screenshots/app/icon.png", drawnArtOptions)

        // The layer alone, at the size the icon draws it: the scooter, its deck white as the rest, nothing around it.
        val themed = createBitmap(size, size)
        icon.monochrome!!.apply { setBounds(-size / 4, -size / 4, size * 5 / 4, size * 5 / 4) }.draw(Canvas(themed))
        assertNear(0xFFFFFF, themed.pixel(deck))
        assertNear(0xFFFFFF, themed.pixel(wheelTop))
        assertEquals(0, Color.alpha(themed.pixel(night)))
        themed.captureRoboImage("src/test/screenshots/app/icon_monochrome.png", drawnArtOptions)
    }

    private fun Bitmap.pixel(at: Pair<Int, Int>) = getPixel(at.first, at.second)

    @Test
    fun theLaunchScreenIsTheSystemsBackgroundWithNoLogo() = assertLaunchScreen(Color.WHITE)

    @Test
    @Config(qualifiers = "night")
    fun inDarkItIsBlack() = assertLaunchScreen(Color.BLACK)

    private fun assertLaunchScreen(background: Int) {
        val theme = context.resources.newTheme().apply { applyStyle(R.style.Theme_ScootRadar, true) }
        val values = theme.obtainStyledAttributes(
            intArrayOf(android.R.attr.windowSplashScreenBackground, android.R.attr.windowSplashScreenAnimatedIcon),
        )
        try {
            assertEquals(background, values.getColor(0, 0))
            assertEquals(Color.TRANSPARENT, (values.getDrawable(1) as ColorDrawable).color)
        } finally {
            values.recycle()
        }
    }

    private fun assertNear(rgb: Int, pixel: Int) {
        val message = "${Integer.toHexString(pixel)} against ${Integer.toHexString(rgb)}"
        assertEquals(message, 0xFF, Color.alpha(pixel))
        assertTrue(message, abs(((rgb shr 16) and 0xFF) - Color.red(pixel)) <= 8)
        assertTrue(message, abs(((rgb shr 8) and 0xFF) - Color.green(pixel)) <= 8)
        assertTrue(message, abs((rgb and 0xFF) - Color.blue(pixel)) <= 8)
    }
}
