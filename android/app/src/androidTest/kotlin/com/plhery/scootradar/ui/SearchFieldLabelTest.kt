package com.plhery.scootradar.ui

import android.view.accessibility.AccessibilityNodeInfo
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.plhery.scootradar.core.api.AddressSearchAPIClient
import com.plhery.scootradar.core.api.AddressSearchResult
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterSearchBarState
import com.plhery.scootradar.ui.search.LocalAddressSearch
import com.plhery.scootradar.ui.search.SEARCH_FIELD_TAG
import com.plhery.scootradar.ui.search.ScooterSearchIsland
import com.plhery.scootradar.ui.theme.ScootTheme
import java.io.File
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * UI-256 on a phone: the search field as an accessibility service is given it. VoiceOver reads the field's title,
 * "City or address", with whatever is typed. Compose gives a field no hint text, and TalkBack may read a field's
 * description instead of its text, so the label is a node inside the field: TalkBack, which focuses the field as one,
 * reads it with the field's text, as it reads Material's labelled fields. The nodes are kept in the run's additional
 * output, as search-field-*.txt.
 */
@RunWith(AndroidJUnit4::class)
class SearchFieldLabelTest {
    @get:Rule
    val compose = createEmptyComposeRule()

    private var scenario: ActivityScenario<ComponentActivity>? = null
    private val language = ScooterLanguage.current

    @Before
    fun setUp() {
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        scenario?.close()
        ScooterLanguage.current = language
    }

    @Test
    fun talkBackIsGivenTheFieldsLabelWithWhatIsTyped() {
        scenario = ActivityScenario.launch(ComponentActivity::class.java).onActivity { activity ->
            activity.setContent {
                ScootTheme(dark = false) {
                    CompositionLocalProvider(LocalAddressSearch provides nowhere) {
                        Box(Modifier.fillMaxSize()) {
                            ScooterSearchIsland(
                                state = ScooterSearchBarState.Empty,
                                isSearching = true,
                                onSearchingChange = {},
                                hasActiveFilters = false,
                                onSelect = {},
                                onClear = {},
                                onUseCurrentLocation = {},
                                onShowFilters = {},
                                onShowSettings = {},
                                modifier = Modifier.align(Alignment.TopCenter).padding(top = 48.dp, start = 12.dp, end = 12.dp),
                                recentPlaces = emptyList(),
                                nearbyCities = emptyList(),
                            )
                        }
                    }
                }
            }
        }
        compose.waitForIdle()

        // Empty, the field says what it is for, as the placeholder it shows.
        val empty = field { it.text.isNullOrEmpty() }
        keep("search-field-empty", empty)
        assertIsLabelled(empty)

        compose.onNodeWithTag(SEARCH_FIELD_TAG).performTextInput("Bahnhof")
        compose.waitForIdle()
        val typed = field { it.text?.toString() == "Bahnhof" }
        keep("search-field-typed", typed)
        assertIsLabelled(typed)
    }

    /** The field is read as one, by its text and the label inside it, and has no description to read instead. */
    private fun assertIsLabelled(field: AccessibilityNodeInfo) {
        assertTrue(field.isEditable)
        assertTrue(field.isScreenReaderFocusable)
        assertNull(field.contentDescription)
        assertNull(field.hintText)
        val label = field.descendants().singleOrNull { it.text?.toString() == "City or address" }
        assertNotNull("the label inside the field", label)
        assertTrue(label!!.isVisibleToUser)
        // Read with the field, not on its own.
        assertFalse(label.isScreenReaderFocusable)
        assertFalse(label.isFocusable)
        assertFalse(label.isClickable)
    }

    /** The window's text field, once an accessibility service is given one that `matches`. */
    private fun field(matches: (AccessibilityNodeInfo) -> Boolean): AccessibilityNodeInfo {
        var found: AccessibilityNodeInfo? = null
        compose.waitUntil(10_000) {
            val root = InstrumentationRegistry.getInstrumentation().uiAutomation.rootInActiveWindow
            found = root?.descendants()?.firstOrNull { it.className == "android.widget.EditText" && matches(it) }
            found != null
        }
        return found!!
    }

    private fun AccessibilityNodeInfo.descendants(): List<AccessibilityNodeInfo> =
        (0 until childCount).mapNotNull(::getChild).flatMap { listOf(it) + it.descendants() }

    /** The field and the nodes inside it, as uiautomator dumps them. */
    private fun keep(name: String, field: AccessibilityNodeInfo) {
        val lines = (listOf(field) + field.descendants()).map {
            "${it.className} text=${it.text} contentDescription=${it.contentDescription} hint=${it.hintText} " +
                "editable=${it.isEditable} screenReaderFocusable=${it.isScreenReaderFocusable} " +
                "focusable=${it.isFocusable} visible=${it.isVisibleToUser}"
        }
        InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")?.let { dir ->
            File(dir, "$name.txt").writeText(lines.joinToString("\n"))
        }
    }

    private companion object {
        val nowhere = object : AddressSearchAPIClient {
            override suspend fun search(query: String, language: String, near: GeoPoint?): List<AddressSearchResult> = emptyList()
        }
    }
}
