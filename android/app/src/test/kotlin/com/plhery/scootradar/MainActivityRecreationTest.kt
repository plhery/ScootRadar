package com.plhery.scootradar

import android.content.res.Resources
import android.os.LocaleList
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
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
import androidx.compose.ui.text.AnnotatedString
import androidx.lifecycle.ViewModelProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.app.ScooterMapViewModel
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.search.SwissAddressSearchStatus
import java.util.Locale
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotSame
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
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
        compose.onNodeWithText("Range").assertIsDisplayed()
        madeAgainForANewTextSize()
        compose.onNodeWithText("Range").assertIsDisplayed()
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

    /**
     * The phone's language changed while the app was in the background, on Automatic: the activity Android makes
     * again as the rider comes back shows the new language's text, as one kept running does (X-M23). A stopped
     * activity hears of no change; the one made again reads the phone's languages as it is made (review-app-ah 3).
     * Robolectric tells every activity of a new configuration, stopped or not, so only the phone's languages change
     * here, in the system configuration they are read from, which tells no activity. The new text size that has the
     * activity made again is set first: setting it puts the system's languages back.
     */
    @Test
    fun anActivityMadeAfterThePhonesLanguageChangedInTheBackgroundShowsIt() {
        compose.onNodeWithContentDescription("Settings").assertExists()
        RuntimeEnvironment.setFontScale(1.3f)
        val system = Resources.getSystem().configuration
        val phone = system.locales
        system.setLocales(LocaleList(Locale.forLanguageTag("de-CH")))
        try {
            val shown = compose.activity
            compose.activityRule.scenario.recreate()
            compose.waitForIdle()
            assertNotSame("the activity made again", shown, compose.activity)
        } finally {
            system.setLocales(phone)
        }
        val controller = ViewModelProvider(compose.activity)[ScooterMapViewModel::class.java].controller
        assertEquals(ScooterLanguage.De, controller.language.value)
        compose.onNodeWithContentDescription("Einstellungen").assertExists()
        compose.onNodeWithContentDescription("Stadt oder Adresse suchen").assertExists()
    }

    /**
     * Closing the search ends it: what it was waiting to search for is called off, and the search opened again is a
     * new one, empty, as the iPhone's panel starts a new search each time it opens. The screen's held one came back
     * with its text (review-app-ae 6).
     */
    @Test
    fun theSearchClosedAndOpenedAgainIsANewOne() {
        val screen = ViewModelProvider(compose.activity)[ScooterMapViewModel::class.java].screen
        compose.onNodeWithContentDescription("Search city or address").performClick()
        compose.onNode(hasSetTextAction()).performTextInput("Z")
        val search = screen.search { error("the open search's model") }
        // Two characters: a search waits out its pause, called off before it ends, so it is sent nowhere.
        compose.runOnUiThread { search.query = "Zu" }
        assertEquals(SwissAddressSearchStatus.Searching, search.status.value)
        compose.onNodeWithText("Cancel").performClick()
        compose.waitForIdle()
        assertEquals("closed", 0, compose.onAllNodes(hasSetTextAction()).fetchSemanticsNodes().size)
        assertEquals("the search waiting called off", SwissAddressSearchStatus.Idle, search.status.value)

        compose.onNodeWithContentDescription("Search city or address").performClick()
        compose.onNode(hasSetTextAction()).assert(emptyField)
    }

    /**
     * The search closed and opened again while it still fades out is a new one, as SwiftUI inserts a new panel while
     * the old one goes: empty, and the screen's, so that a new text size keeps what is typed in it. The old one came
     * back with its text, which the screen no longer held: a new text size lost it, and the next close left its work
     * running (review-app-ae 5).
     */
    @Test
    fun theSearchOpenedAgainAsItFadesOutIsANewOneTheScreenKeeps() {
        val screen = ViewModelProvider(compose.activity)[ScooterMapViewModel::class.java].screen
        compose.onNodeWithContentDescription("Search city or address").performClick()
        compose.onNode(hasSetTextAction()).performTextInput("Z")
        compose.mainClock.autoAdvance = false
        compose.onNodeWithText("Cancel").performClick()
        repeat(3) { compose.mainClock.advanceTimeByFrame() }
        assertTrue("the panel fading out", compose.onAllNodes(hasSetTextAction()).fetchSemanticsNodes().isNotEmpty())
        compose.runOnUiThread { screen.searchIsExpanded = true }
        compose.mainClock.autoAdvance = true
        compose.waitForIdle()
        compose.onNode(hasSetTextAction()).assert(emptyField)

        compose.onNode(hasSetTextAction()).performTextInput("Q")
        madeAgainForANewTextSize()
        compose.onNode(hasSetTextAction()).assert(hasText("Q"))
    }

    private val emptyField = SemanticsMatcher.expectValue(SemanticsProperties.EditableText, AnnotatedString(""))

    /** A new font size, which the activity doesn't take itself: Android makes it again, its ViewModel kept. */
    private fun madeAgainForANewTextSize() {
        RuntimeEnvironment.setFontScale(1.3f)
        val shown = compose.activity
        compose.activityRule.scenario.recreate()
        compose.waitForIdle()
        assertNotSame("the activity made again", shown, compose.activity)
    }
}
