package com.plhery.scootradar.ui.theme

import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.onRoot
import com.dropbox.differ.SimpleImageComparator
import com.github.takahirom.roborazzi.RoborazziOptions
import com.github.takahirom.roborazzi.captureRoboImage
import org.robolectric.RuntimeEnvironment

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
 * The comparison for art drawn straight into a bitmap, as the rider's: Linux's Skia lays an edge's and a gradient's
 * coverage a level or two apart from the Mac's (1,561 pixels of 160,000 off by 2/255 at most, on CI). A pixel may be
 * that much off in each channel, 0.02 of the colour distance; a changed colour or a beam turned a degree is far more.
 */
val drawnArtOptions = RoborazziOptions(
    compareOptions = RoborazziOptions.CompareOptions(changeThreshold = 0f, imageComparator = SimpleImageComparator(maxDistance = 0.02f)),
)

/** Sets the font scale for what is composed next, as the phone's Settings does; [resetFontScale] after. */
fun useFontScale(scale: Float) = RuntimeEnvironment.setFontScale(scale)

fun resetFontScale() = RuntimeEnvironment.setFontScale(1f)

/** The screen as it is now, saved under src/test/screenshots/[name].png, the window drawn again first. */
fun ComposeContentTestRule.screenshot(name: String) {
    drawWindowAgain()
    onRoot().captureRoboImage("src/test/screenshots/$name.png", roborazziOptions = screenshotOptions)
}

/**
 * Draws the window again before a capture: after the first test of a run, Robolectric's capture can reuse the
 * window's drawing from before the content was set, which shows only the window's background. The Compose view is
 * drawn again with the root, which would otherwise keep the view's old drawing within its new one.
 */
fun ComposeContentTestRule.drawWindowAgain() {
    val view = (onRoot().fetchSemanticsNode().root as ViewRootForTest).view
    runOnUiThread {
        view.rootView.invalidate()
        view.invalidate()
    }
    waitForIdle()
}
