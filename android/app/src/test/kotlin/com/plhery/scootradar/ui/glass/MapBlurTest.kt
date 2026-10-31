package com.plhery.scootradar.ui.glass

import android.graphics.Color
import android.view.View
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.ui.theme.PHONE
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.SquircleShape
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * When the glass blurs the map again (bug D, review-app-ag 1 and 2). Android 12 keeps the image of a blur for as long
 * as the glass keeps its effect, which the JVM's renderer doesn't, so the frozen pixels show only on a device
 * (DockOverTheMapTest.theGlassFollowsTheMapUnderIt); here, the rule that avoids them: a new blur for each frame of the
 * map's and each new place of the glass's, and none for the glass drawing again for its own reasons.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = PHONE)
class MapBlurTest {
    @get:Rule
    val compose = createComposeRule()

    private lateinit var backdrop: MapBackdrop

    @Test
    fun theGlassBlursTheMapAgainForEachFrameOfItsAndEachNewPlaceAndOnlyThen() {
        lateinit var ground: View
        val label = mutableStateOf("Zürich")
        val down = mutableIntStateOf(0)
        compose.setContent {
            val context = LocalContext.current
            backdrop = remember {
                ground = View(context).apply { setBackgroundColor(Color.RED) }
                MapBackdrop(context).hold(ground)
            }
            ScootTheme(dark = false, reduceMotion = true) {
                CompositionLocalProvider(LocalGlass provides Glass(backdrop, blurs = true)) {
                    Box(Modifier.size(390.dp, 400.dp)) {
                        AndroidView(factory = { backdrop }, modifier = Modifier.size(390.dp, 400.dp))
                        Box(Modifier.offset { IntOffset(20, 100 + down.intValue) }.size(350.dp, 64.dp).chromeGlass(SquircleShape(28.dp), live = true)) {
                            Text(label.value)
                        }
                    }
                }
            }
        }
        val first = drawn()
        assertTrue("the glass's first blur", first > 0)

        label.value = "Bern"
        assertEquals("the glass drawn again for its text keeps its blur", first, drawn())

        compose.runOnUiThread { ground.setBackgroundColor(Color.BLUE) }
        val afterFrame = drawn()
        assertTrue("a frame of the map's blurs it again ($afterFrame after $first)", afterFrame > first)

        down.intValue = 120
        val afterMove = drawn()
        assertTrue("the glass laid out lower, the map idle, blurs it again ($afterMove after $afterFrame)", afterMove > afterFrame)

        assertEquals("nothing changed, nothing blurred again", afterMove, drawn())
    }

    /** Draws the screen as the phone would, and says how many blurs the glass has taken so far. */
    private fun drawn(): Int {
        compose.waitForIdle()
        compose.onRoot().captureToImage()
        compose.waitForIdle()
        return backdrop.blurs
    }
}
