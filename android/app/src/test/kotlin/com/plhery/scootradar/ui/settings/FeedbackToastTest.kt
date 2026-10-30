package com.plhery.scootradar.ui.settings

import android.app.Application
import android.content.ClipboardManager
import android.graphics.Typeface
import android.os.Build
import android.util.TypedValue
import android.view.View.MeasureSpec
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.EmptyScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.theme.ScootTheme
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import org.robolectric.shadows.ShadowToast

// X.md X-AD39: the toast Send feedback shows with no mail app, as Android 12 and later draw a text toast (SystemUI's
// text_toast layout: the app's icon, 24 and 10 beside it, 16 either side, and at most two lines of
// TextAppearance.Toast), in a window ViewRootImpl first lays out config_prefDialogWidth wide, 320 on a phone; at each
// text size Settings offers, Android 12's up to 1.3 and Android 14's up to 2.0, which scales 14 to 26, not 28
// (FontScaleConverterFactory's nonlinear curve; review-app-v finding 3).

/**
 * With no mail app the toast says so in two lines on the narrowest phone, in every language and at every text size,
 * and leaves the address to the clipboard, whose own preview Android 13 and later show.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "w360dp-h640dp-xhdpi", sdk = [31, Config.NEWEST_SDK])
class FeedbackToastTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private val application: Application = ApplicationProvider.getApplicationContext()
    private val controllers = TestControllers()
    private val model = controllers.make(EmptyScooterAPI, TestClock())

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        RuntimeEnvironment.setFontScale(1f)
    }

    @Test
    fun theToastFitsInTwoLinesOnTheNarrowestPhoneAtEveryTextSizeAndLeavesTheAddressToTheClipboard() {
        shadowOf(application).checkActivities(true)
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                ScooterSettingsSheet(
                    controller = model,
                    bottomInset = 0.dp,
                    defaults = null,
                    onDone = {},
                    passProviders = listOf(ScooterProvider.Lime),
                    sources = emptyList(),
                )
            }
        }
        val toasts = mutableListOf<Pair<ScooterLanguage, String>>()
        for (language in ScooterLanguage.entries) {
            compose.runOnIdle { model.setLanguageChoice(ScooterLanguageChoice.Language(language)) }
            compose.onNodeWithText(localized("Send feedback")).performScrollTo().performClick()
            compose.waitForIdle()

            val text = ShadowToast.getTextOfLatestToast()
            val clip = application.getSystemService(ClipboardManager::class.java).primaryClip!!
            assertEquals("${language.rawValue}: the address in the clipboard", "hello@scootradar.com", clip.getItemAt(0).text.toString())
            assertFalse("${language.rawValue}: the address in the toast, $text", text.contains("@"))
            toasts += language to text
        }
        val cut = mutableListOf<String>()
        for (scale in TEXT_SIZES) {
            RuntimeEnvironment.setFontScale(scale)
            // The size the toast's 14 is drawn at, as the API scales it: linearly to Android 13, on the curve after.
            val size = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, 14f, application.resources.displayMetrics) /
                application.resources.displayMetrics.density
            assertEquals("14 at $scale", DRAWN_AT.getValue(scale), size, 0.05f)
            for ((language, text) in toasts) {
                val lines = linesInAToast(text)
                if (lines > 2) cut += "${language.rawValue} at $scale: $lines lines, $text"
            }
        }
        assertEquals("cut at two lines", "", cut.joinToString("\n"))
    }

    /**
     * How many lines [text] takes in a text toast on a 360-wide phone: 320 less the icon's 34 and the 32 either side,
     * 254, and a tenth less again for a phone's own font, wider than the Roboto this measures with.
     */
    private fun linesInAToast(text: String): Int {
        val view = TextView(application)
        // TextAppearance.Toast: 14 of the phone's sans-serif.
        view.typeface = Typeface.SANS_SERIF
        view.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
        view.text = text
        val width = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, TOAST_TEXT_WIDTH * 0.9f, application.resources.displayMetrics)
        view.measure(MeasureSpec.makeMeasureSpec(width.toInt(), MeasureSpec.EXACTLY), MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED))
        return view.lineCount
    }

    private companion object {
        /** The room for a toast's text on a phone: 320 - 24 - 10 - 2 * 16. */
        const val TOAST_TEXT_WIDTH = 254f

        /** The text sizes Settings offers on a Pixel: Android 12's four, and Android 14's seven. */
        val TEXT_SIZES = if (Build.VERSION.SDK_INT >= 34) {
            listOf(0.85f, 1f, 1.15f, 1.3f, 1.5f, 1.8f, 2f)
        } else {
            listOf(0.85f, 1f, 1.15f, 1.3f)
        }

        /** What 14 is drawn at for each: linear to Android 13, and from 1.03 on Android 14's curve after. */
        val DRAWN_AT = if (Build.VERSION.SDK_INT >= 34) {
            mapOf(0.85f to 11.9f, 1f to 14f, 1.15f to 16.4f, 1.3f to 18.8f, 1.5f to 22f, 1.8f to 24.4f, 2f to 26f)
        } else {
            mapOf(0.85f to 11.9f, 1f to 14f, 1.15f to 16.1f, 1.3f to 18.2f)
        }
    }
}
