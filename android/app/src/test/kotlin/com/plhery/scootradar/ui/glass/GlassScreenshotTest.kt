package com.plhery.scootradar.ui.glass

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.view.View
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.ui.theme.PHONE
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SquircleShape
import com.plhery.scootradar.ui.theme.screenshot
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** The dock's glass over a striped stand-in for the map: blurred, and as the fill that stands in for the blur. */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = PHONE)
class GlassScreenshotTest {
    @get:Rule
    val compose = createComposeRule()

    @Test
    fun glassBlurredLight() = glass(dark = false, blurs = true)

    @Test
    fun glassBlurredDark() = glass(dark = true, blurs = true)

    @Test
    fun glassFilledLight() = glass(dark = false, blurs = false)

    @Test
    fun glassFilledDark() = glass(dark = true, blurs = false)

    private fun glass(dark: Boolean, blurs: Boolean) {
        compose.setContent {
            val context = LocalContext.current
            val backdrop = remember { MapBackdrop(context).hold(Stripes(context, dark)) }
            ScootTheme(dark = dark, reduceMotion = true) {
                CompositionLocalProvider(LocalGlass provides Glass(backdrop, blurs)) {
                    Box(Modifier.size(390.dp, 300.dp)) {
                        AndroidView(factory = { backdrop }, modifier = Modifier.size(390.dp, 300.dp))
                        Box(
                            Modifier.align(Alignment.BottomCenter).padding(10.dp).fillMaxWidth().height(128.dp)
                                .chromeGlass(SquircleShape(28.dp), live = true),
                            contentAlignment = Alignment.Center,
                        ) { Text("Finding scooters…", style = ScootType.subheadline) }
                        Box(
                            Modifier.align(Alignment.TopCenter).padding(12.dp).size(200.dp, 44.dp)
                                .chromeGlass(SquircleShape(22.dp)),
                        )
                    }
                }
            }
        }
        compose.screenshot("glass/glass_${if (blurs) "blurred" else "filled"}_${if (dark) "dark" else "light"}")
    }
}

/** Streets and blocks of colour, sharp enough that a blur shows. */
private class Stripes(context: Context, private val dark: Boolean) : View(context) {
    private val paint = Paint()

    override fun onDraw(canvas: Canvas) {
        canvas.drawColor(if (dark) 0xFF2E2E48.toInt() else 0xFFF2E6CF.toInt())
        val step = 24 * resources.displayMetrics.density
        var x = 0f
        var i = 0
        while (x < width) {
            paint.color = listOf(0xFF34C759, 0xFFE91E8C, 0xFF0A84FF, 0xFFFFFFFF)[i % 4].toInt()
            canvas.drawRect(x, 0f, x + step / 3, height.toFloat(), paint)
            x += step
            i += 1
        }
    }
}
