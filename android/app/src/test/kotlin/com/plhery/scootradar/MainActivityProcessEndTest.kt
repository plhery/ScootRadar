package com.plhery.scootradar

import android.os.Bundle
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.text.AnnotatedString
import androidx.lifecycle.ViewModelProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.app.ScooterMapViewModel
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.settings.SettingsPage
import java.util.Locale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotSame
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.geometry.LatLng
import org.robolectric.Robolectric
import org.robolectric.annotation.Config

// X-AD18: the end of the iPhone app's process takes all of the screen but `@SceneStorage("panelCollapsed")`. The
// screen Android makes again in a new process, from what the activity saved, opens with the panel folded as it was
// left, and nothing else open: no search and nothing typed, no Filters, no Settings. The activity's ViewModel, which
// keeps the rest through a new text size (MainActivityRecreationTest), goes with the process. One character is
// typed, which the search sends nowhere.

@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "en-rUS-w412dp-h915dp-xxhdpi")
class MainActivityProcessEndTest {
    @get:Rule
    val compose = createEmptyComposeRule()

    private val atLaunch = ScooterLanguage.atLaunch
    private val launchLocale = ScooterLanguage.launchLocale
    private val locale = Locale.getDefault()

    @Before
    fun standIn() {
        MainActivity.mapStandIn = { }
    }

    @After
    fun tearDown() {
        MainActivity.mapStandIn = null
        ScooterLanguage.atLaunch = atLaunch
        ScooterLanguage.current = atLaunch
        ScooterLanguage.launchLocale = launchLocale
        Locale.setDefault(locale)
    }

    @Test
    fun theScreenMadeAgainInANewProcessHasOnlyThePanelsFold() {
        val first = Robolectric.buildActivity(MainActivity::class.java).setup()
        val model = ViewModelProvider(first.get())[ScooterMapViewModel::class.java]
        compose.onNodeWithContentDescription("Search city or address").performClick()
        compose.onNode(hasSetTextAction()).performTextInput("Z")
        compose.onNode(hasSetTextAction()).assert(hasText("Z"))
        compose.runOnIdle {
            model.controller.setPanelCollapsed(true)
            model.screen.filtersPresented = true
            model.screen.settingsPresented = true
            model.screen.settingsPages.add(SettingsPage.Language)
        }
        compose.onNodeWithText(FILTERS).assertExists()
        compose.onNodeWithText(LANGUAGE_PAGE).assertExists()

        // Left in the background, the activity saves what it keeps; the system ends the process, and makes the
        // screen again from that when the rider comes back.
        val saved = Bundle()
        first.pause().stop().saveInstanceState(saved).destroy()
        val again = Robolectric.buildActivity(MainActivity::class.java).setup(saved)
        compose.waitForIdle()
        val modelAgain = ViewModelProvider(again.get())[ScooterMapViewModel::class.java]
        assertNotSame("a new process's view model", model, modelAgain)

        assertTrue("the panel folded as it was left", modelAgain.controller.isPanelCollapsed.value)
        compose.onAllNodes(hasSetTextAction()).assertCountEquals(0)
        compose.onNodeWithText(FILTERS).assertDoesNotExist()
        compose.onNodeWithText(LANGUAGE_PAGE).assertDoesNotExist()
        // The search opened again is a new one: what was typed went with the process.
        compose.onNodeWithContentDescription("Search city or address").performClick()
        compose.onNode(hasSetTextAction()).assert(SemanticsMatcher.expectValue(SemanticsProperties.EditableText, AnnotatedString("")))
        again.pause().stop().destroy()
    }

    /**
     * The camera, the card and the place searched for are not kept for a new process (X-AD18): what the activity's
     * ViewModel saves holds the panel's fold alone, and the screen made again from it opens with none of them. Put in
     * the SavedStateHandle, they would come back with a screen that looked as the first test asks (review-app-ah 3).
     */
    @Test
    fun theCameraTheCardAndThePlaceAreNotKeptForANewProcess() {
        val first = Robolectric.buildActivity(MainActivity::class.java).setup()
        val model = ViewModelProvider(first.get())[ScooterMapViewModel::class.java]
        val place = MapDestination("Bahnhofplatz", "8001 Zürich", GeoPoint(47.3779, 8.5403), MapDestination.Kind.Address, isCovered = true)
        compose.runOnIdle {
            model.controller.focusOnAddress(place)
            model.controller.selectScooter("lime:a")
            model.camera.position = CameraPosition.Builder().target(LatLng(47.3779, 8.5403)).zoom(16.0).build()
        }
        compose.waitForIdle()
        assertEquals(place, model.controller.searchedDestination.value)
        assertEquals("lime:a", model.controller.selectedScooterID.value)

        val saved = Bundle()
        first.pause().stop().saveInstanceState(saved)
        val kept = checkNotNull(savedHolding(ScooterMapViewModel.PANEL_COLLAPSED, saved)) { "the ViewModel's saved state" }
        assertEquals("what the ViewModel keeps for a new process", setOf(ScooterMapViewModel.PANEL_COLLAPSED), kept.keySet())
        first.destroy()

        val again = Robolectric.buildActivity(MainActivity::class.java).setup(saved)
        compose.waitForIdle()
        val modelAgain = ViewModelProvider(again.get())[ScooterMapViewModel::class.java]
        assertNotSame("a new process's view model", model, modelAgain)
        assertNull("the place searched for", modelAgain.controller.searchedDestination.value)
        assertNull("the card", modelAgain.controller.selectedScooterID.value)
        assertNull("the camera", modelAgain.camera.position)
        again.pause().stop().destroy()
    }

    /** The bundle within [bundle], or it itself, that holds [key]: the saved state of a SavedStateHandle that has it. */
    private fun savedHolding(key: String, bundle: Bundle): Bundle? =
        if (bundle.containsKey(key)) bundle else bundle.keySet().firstNotNullOfOrNull { name -> bundle.getBundle(name)?.let { savedHolding(key, it) } }

    private companion object {
        /** A row only Filters has. */
        const val FILTERS = "Battery"

        /** The Language page's first choice, which only that page has. */
        const val LANGUAGE_PAGE = "English, the language of your phone"
    }
}
