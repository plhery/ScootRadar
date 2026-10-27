package com.plhery.scootradar.ui.theme

import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.onRoot
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
 * The comparison CI makes against the baselines recorded on the Mac: a few pixels may differ where text is drawn
 * at the edge of a pixel.
 */
val screenshotOptions = RoborazziOptions(
    compareOptions = RoborazziOptions.CompareOptions(changeThreshold = 0.002f),
)

/** Sets the font scale for what is composed next, as the phone's Settings does; [resetFontScale] after. */
fun useFontScale(scale: Float) = RuntimeEnvironment.setFontScale(scale)

fun resetFontScale() = RuntimeEnvironment.setFontScale(1f)

/** The screen as it is now, saved under src/test/screenshots/[name].png. */
fun ComposeContentTestRule.screenshot(name: String) {
    onRoot().captureRoboImage("src/test/screenshots/$name.png", roborazziOptions = screenshotOptions)
}
