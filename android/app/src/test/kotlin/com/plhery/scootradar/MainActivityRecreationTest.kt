package com.plhery.scootradar

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextInput
import androidx.lifecycle.ViewModelProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.app.ScooterMapViewModel
import com.plhery.scootradar.core.model.ScooterLanguage
import java.util.Locale
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotSame
import org.junit.Assert.assertSame
import org.junit.Rule
import org.junit.Test
import org.junit.rules.ExternalResource
import org.junit.rules.RuleChain
import org.junit.runner.RunWith
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

// X-M15, X-M25 and UI-187: Android makes the activity again for a new text size, Display size or Bold Text, where
// the iPhone's screen is never made again; what the screen has open stays open as it was: the search and what is
// typed in it, Filters, Settings on its page. X-M23: the chrome made again in the phone's new language keeps the
// search as typed. The camera, the card and the walk are the controller's (X-AD17); the process's end takes all of
// it, as on the iPhone (X-AD18). One character is typed, which the search sends nowhere.

@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "en-rUS-w412dp-h915dp-xxhdpi")
class MainActivityRecreationTest {
    private val atLaunch = ScooterLanguage.atLaunch
    private val launchLocale = ScooterLanguage.launchLocale
    private val locale = Locale.getDefault()

    /** The map's stand-in, there before the activity starts and gone after it ends. */
    private val standIn = object : ExternalResource() {
        override fun before() {
            MainActivity.mapStandIn = { }
        }

        override fun after() {
            MainActivity.mapStandIn = null
            RuntimeEnvironment.setFontScale(1f)
            ScooterLanguage.atLaunch = atLaunch
            ScooterLanguage.current = atLaunch
            ScooterLanguage.launchLocale = launchLocale
            Locale.setDefault(locale)
        }
    }
    private val compose = createAndroidComposeRule<MainActivity>()

    @get:Rule
    val rules: RuleChain = RuleChain.outerRule(standIn).around(compose)

    @Test
    fun aNewTextSizeKeepsFiltersOpen() {
        compose.onNodeWithContentDescription("Filters").performClick()
        compose.onNodeWithText("Battery").assertIsDisplayed()
        madeAgainForANewTextSize()
        compose.onNodeWithText("Battery").assertIsDisplayed()
    }

    @Test
    fun aNewTextSizeKeepsSettingsOpenOnItsPage() {
        compose.onNodeWithContentDescription("Settings").performClick()
        // The row is under the half-open sheet's edge: its action, not a tap.
        compose.onNodeWithText("English").performSemanticsAction(SemanticsActions.OnClick)
        // The Language page's first choice, which only that page has.
        val languagePage = "English, the language of your phone"
        compose.onNodeWithText(languagePage).assertExists()
        madeAgainForANewTextSize()
        compose.onNodeWithText(languagePage).assertExists()
    }

    @Test
    fun aNewTextSizeKeepsTheSearchOpenAsTyped() {
        compose.onNodeWithContentDescription("Search city or address").performClick()
        compose.onNode(hasSetTextAction()).performTextInput("Z")
        madeAgainForANewTextSize()
        compose.onNode(hasSetTextAction()).assert(hasText("Z"))
    }

    @Test
    fun thePhonesNewLanguageKeepsTheSearchAsTyped() {
        compose.onNodeWithContentDescription("Search city or address").performClick()
        compose.onNode(hasSetTextAction()).performTextInput("Z")
        // Only the language changes, which the activity takes itself: the chrome is made again in it.
        RuntimeEnvironment.setQualifiers("de-rCH-w412dp-h915dp-xxhdpi")
        val shown = compose.activity
        compose.runOnUiThread { shown.onConfigurationChanged(RuntimeEnvironment.getApplication().resources.configuration) }
        compose.waitForIdle()
        assertSame("the activity kept", shown, compose.activity)
        val controller = ViewModelProvider(shown)[ScooterMapViewModel::class.java].controller
        assertEquals(ScooterLanguage.De, controller.language.value)
        compose.onNode(hasSetTextAction()).assert(hasText("Z"))
    }

    /** A new font size, which the activity doesn't take itself: Android makes it again, its ViewModel kept. */
    private fun madeAgainForANewTextSize() {
        RuntimeEnvironment.setFontScale(1.3f)
        val shown = compose.activity
        compose.activityRule.scenario.recreate()
        compose.waitForIdle()
        assertNotSame("the activity made again", shown, compose.activity)
    }
}
