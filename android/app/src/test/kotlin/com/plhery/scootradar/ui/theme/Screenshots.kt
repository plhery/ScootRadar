package com.plhery.scootradar.ui.theme

import android.graphics.HardwareRenderer
import android.view.Surface
import android.view.View
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.onRoot
import com.dropbox.differ.SimpleImageComparator
import com.github.takahirom.roborazzi.RoborazziOptions
import com.github.takahirom.roborazzi.captureRoboImage
import org.robolectric.RuntimeEnvironment
import org.robolectric.util.ReflectionHelpers

/** The phone size the screenshots are taken at: the iPhone's 390 × 844 points, at twice the pixels. */
const val PHONE = "w390dp-h844dp-xhdpi"

/** The appearances and font scales each screenshot is taken in (ui.md §3: light and dark, at 1.0 and 2.0). */
enum class Look(val dark: Boolean, val fontScale: Float) {
    Light(false, 1f),
    Dark(true, 1f),
    LightLargeText(false, 2f),
    DarkLargeText(true, 2f),
    ;

    val suffix: String get() = name.replaceFirstChar { it.lowercase() }
}

/**
 * The comparison CI makes against the baselines recorded on the Mac: no pixel may differ beyond Roborazzi's colour
 * tolerance. Linux draws them the same, and a share of 0.2% let a changed digit at font scale 1.0 through.
 */
val screenshotOptions = RoborazziOptions(
    compareOptions = RoborazziOptions.CompareOptions(changeThreshold = 0f),
)

/**
 * The comparison for art drawn straight into a bitmap, as the rider's, and for screens with Increase Contrast's
 * edges or the price menu's shadow: Linux's Skia lays an edge's and a gradient's coverage a level or two apart from
 * the Mac's (1,561 pixels of 160,000 off by 2/255 at most, on CI; the contrast edges' some 900 and the menu's shadow
 * 43,590 pixels, 2/255 at most). A pixel may be that much off in each channel, 0.02 of the colour distance; a
 * changed colour or a beam turned a degree is far more.
 */
val drawnArtOptions = RoborazziOptions(
    compareOptions = RoborazziOptions.CompareOptions(changeThreshold = 0f, imageComparator = SimpleImageComparator(maxDistance = 0.02f)),
)

/** Sets the font scale for what is composed next, as the phone's Settings does; [resetFontScale] after. */
fun useFontScale(scale: Float) = RuntimeEnvironment.setFontScale(scale)

fun resetFontScale() = RuntimeEnvironment.setFontScale(1f)

/** The screen as it is now, saved under src/test/screenshots/[name].png, the window drawn again first. */
fun ComposeContentTestRule.screenshot(name: String, options: RoborazziOptions = screenshotOptions) {
    drawWindowAgain()
    onRoot().captureRoboImage("src/test/screenshots/$name.png", roborazziOptions = options)
}

/**
 * Draws the window again before a capture, and puts the frame where the capture takes it ([putFramesOnSurfaces]). The
 * Compose view is drawn again with the root, which would otherwise keep the view's old drawing within its new one.
 */
fun ComposeContentTestRule.drawWindowAgain() {
    val view = (onRoot().fetchSemanticsNode().root as ViewRootForTest).view
    runOnUiThread {
        view.rootView.invalidate()
        view.invalidate()
    }
    putFramesOnSurfaces()
}

/**
 * Puts each window's frame as it is now on the window's surface, for the next capture to take. On Android 17
 * Robolectric draws a window as a device does, and its PixelCopy takes the image last drawn on the window's surface
 * (ShadowPixelCopy.captureImageFromSurface). Android's renderer skips a frame that comes within 2 ms of the last one it
 * drew ("Already drew for this vsync pulse", CanvasContext::prepareTree), and Robolectric dates a frame by the host's
 * clock (ShadowNativeHardwareRenderer.syncAndDrawFrame): when the tests ran fast, the frame of a step taken right after
 * another was skipped, and the capture showed the step before it, or the bare window from before the content was set.
 * So each shown window's renderer draws the window's drawing again, 3 ms later each time it skips it, until it has drawn
 * it, and waits for it. Menus are windows of their own, as is the screen's.
 */
fun ComposeContentTestRule.putFramesOnSurfaces() {
    waitForIdle()
    runOnUiThread {
        val global = Class.forName("android.view.WindowManagerGlobal")
        val windows = ReflectionHelpers.getField<List<View>>(ReflectionHelpers.callStaticMethod<Any>(global, "getInstance"), "mViews")
        windows.toList().forEach(::putFrameOnSurface)
    }
}

private fun putFrameOnSurface(window: View) {
    if (!window.isShown) return
    val viewRoot = ReflectionHelpers.callInstanceMethod<Any?>(window, "getViewRootImpl") ?: return
    val renderer = ReflectionHelpers.getField<HardwareRenderer?>(ReflectionHelpers.getField(viewRoot, "mAttachInfo"), "mThreadedRenderer")
    val surface = ReflectionHelpers.getField<Surface>(viewRoot, "mSurface")
    if (renderer == null || !surface.isValid) return
    repeat(200) {
        val result = renderer.createRenderRequest().setWaitForPresent(true).syncAndDraw()
        if (result and HardwareRenderer.SYNC_FRAME_DROPPED == 0) return
        Thread.sleep(3)
    }
    error("The renderer of $window skipped its frame 200 times")
}
