package com.plhery.scootradar.ui.filters

import android.view.View
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isSelectable
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.EmptyScooterAPI
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterProviderEntry
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterUnits
import com.plhery.scootradar.scooter
import com.plhery.scootradar.zonesOffDefaults
import com.plhery.scootradar.zurichRegion
import com.plhery.scootradar.ui.dock.ProviderList
import com.plhery.scootradar.ui.theme.ScootTheme
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

// The filters' and the panel's VoiceOver in ios/ScootRadar/Views/ScooterControls.swift (ui.md UI-264, UI-289 to
// UI-291), as TalkBack is given it.

/** What TalkBack is given of the filter sheet and of the panel's list of providers. */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w390dp-h844dp-xhdpi")
class FiltersAccessibilityTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()

    /** Lime shown, Bolt hidden, Dott chosen but sharing no data. */
    private val entries = listOf(
        ScooterProviderEntry(ScooterProvider.Lime, count = 12, isEnabled = true, isSelected = false, isDown = false),
        ScooterProviderEntry(ScooterProvider.Bolt, count = 1, isEnabled = false, isSelected = false, isDown = false),
        ScooterProviderEntry(ScooterProvider.Dott, count = 0, isEnabled = true, isSelected = false, isDown = true),
    )

    @Before
    fun setUp() {
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterUnits.current = ScooterUnits.Automatic
    }

    private var hasActiveFilters by mutableStateOf(true)
    private var minimum by mutableStateOf(30)
    private var shownEntries by mutableStateOf(entries)
    private var fullRanges by mutableStateOf(emptyMap<String, Int>())

    private fun showFilters(minimumBattery: Int = 30) {
        minimum = minimumBattery
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                FilterSheetContent(
                    minimumBattery = minimum,
                    entries = shownEntries,
                    hasActiveFilters = hasActiveFilters,
                    showResults = "Show 13 scooters",
                    bottomInset = 0.dp,
                    onChooseMinimum = {},
                    onToggle = {},
                    onReset = {},
                    onDone = {},
                    fullRanges = fullRanges,
                )
            }
        }
        compose.waitForIdle()
    }

    private fun role(role: Role) = SemanticsMatcher.expectValue(SemanticsProperties.Role, role)

    private val heading = SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading)

    /**
     * UI-289: the presets are a group of choices under the "Battery" heading, each read by its label alone, "Any"
     * or "30 percent or more", and the chosen one selected. What each shows, "30%+", is its text, which Voice Access
     * answers to as Voice Control answers to the iPhone's (b55719d0), and TalkBack leaves for the label.
     */
    @Test
    fun theBatteryPresetsAreAGroupOfChoicesReadByTheirLabels() {
        showFilters(minimumBattery = 30)
        val presets = compose.onAllNodes(role(Role.RadioButton)).fetchSemanticsNodes()
        assertEquals(
            listOf("Any", "30 percent or more", "60 percent or more", "80 percent or more"),
            presets.map { it.config[SemanticsProperties.ContentDescription].single() },
        )
        assertEquals(listOf(false, true, false, false), presets.map { it.config[SemanticsProperties.Selected] })
        // "30%+" drawn, once, on the preset: none for "Any", which shows its label.
        assertEquals(
            listOf(null, "30%+", "60%+", "80%+"),
            presets.map { preset -> preset.config.getOrNull(SemanticsProperties.Text)?.joinToString { it.text } },
        )
        // Their group, with no stop of its own.
        val groups = presets.map { preset ->
            generateSequence(preset.parent) { it.parent }.first { SemanticsProperties.SelectableGroup in it.config }
        }
        assertEquals(1, groups.map { it.id }.distinct().size)
        assertTrue(SemanticsProperties.ContentDescription !in groups.first().config)
        compose.onNode(hasText("Battery"), useUnmergedTree = true).assert(heading)
    }

    /**
     * UI-290: a provider's row is one button, read by its name and count, or why it shares no data, then "Shown" or
     * "Hidden"; it is not a choice, and its initials, count and check are not read on their own.
     */
    @Test
    fun aProviderRowIsReadByItsNameCountAndWhetherItIsShown() {
        showFilters()
        for ((label, state) in listOf(
            "Lime, 12 scooters" to "Shown",
            "Bolt, one scooter" to "Hidden",
            "Dott: not sharing data right now" to "Shown",
        )) {
            // As TalkBack is given it: the row merged, and what it clears gone.
            val row = compose.onNodeWithContentDescription(label).fetchSemanticsNode()
            assertEquals(label, state, row.config[SemanticsProperties.StateDescription])
            assertEquals(label, Role.Button, row.config[SemanticsProperties.Role])
            assertTrue(label, SemanticsActions.OnClick in row.config)
            assertTrue(label, SemanticsProperties.Selected !in row.config)
            assertTrue(label, row.children.isEmpty())
        }
    }

    /** UI-291: the sections' titles are headings, Reset is off with no filter on, and Show results reads its text. */
    @Test
    fun theSectionsAreHeadingsAndResetIsOffWithNoFilterOn() {
        hasActiveFilters = false
        showFilters()
        for (title in listOf("Battery", "Providers")) compose.onNode(hasText(title), useUnmergedTree = true).assert(heading)
        compose.onNode(hasText("Reset")).assertIsNotEnabled()
        compose.onNode(hasText("Show 13 scooters")).assert(role(Role.Button))

        hasActiveFilters = true
        compose.onNode(hasText("Reset")).assertIsEnabled().assert(role(Role.Button))
    }

    /**
     * What TalkBack reads next after the battery presets, in the sheet's order, its spaces plain: the paragraph under
     * them, or the next section's heading where there is none.
     */
    private fun afterThePresets(): String {
        compose.waitForIdle()
        val group = compose.onNode(SemanticsMatcher.keyIsDefined(SemanticsProperties.SelectableGroup)).fetchSemanticsNode()
        val next = group.parent!!.children.dropWhile { it.id != group.id }.drop(1).first()
        return plainSpaces(next.config[SemanticsProperties.Text].joinToString { it.text })
    }

    private fun plainSpaces(text: String): String = text.replace('\u00A0', ' ').replace('\u202F', ' ')

    private val hidden = "Scooters without battery info are hidden while a minimum is set."

    /**
     * Issue #12: under the presets, how far the minimum chosen, or a full battery for Any, usually takes the scooters
     * of the apps switched on in view, followed while a minimum is set by what it hides: one paragraph, which TalkBack
     * reads right after the presets as what describes them. Where no app in view has a full range, nothing is said at
     * Any and only what a minimum hides at 60%.
     */
    @Test
    fun underThePresetsOneParagraphSaysHowFarTheMinimumUsuallyTakesTheScootersChosen() {
        ScooterUnits.current = ScooterUnits.Metric
        shownEntries = listOf(
            ScooterProviderEntry(ScooterProvider.Lime, count = 30, isEnabled = true, isSelected = false, isDown = false),
            ScooterProviderEntry(ScooterProvider.Bolt, count = 10, isEnabled = true, isSelected = false, isDown = false),
        )
        showFilters(minimumBattery = 0)
        assertEquals("Providers", afterThePresets())

        fullRanges = mapOf("lime" to 11_500, "bolt" to 61_000)
        assertEquals("100% usually allows about 12–61 km.", afterThePresets())

        minimum = 60
        assertEquals("60% usually allows about 7–37 km. $hidden", afterThePresets())

        shownEntries = shownEntries.map { if (it.provider == ScooterProvider.Bolt) it.copy(isEnabled = false) else it }
        assertEquals("60% usually allows about 7 km. $hidden", afterThePresets())

        fullRanges = emptyMap()
        assertEquals(hidden, afterThePresets())
    }

    /**
     * The sheet writes the line from the controller's latest answer and what its provider rows count: Voi's scooter,
     * which gives a range and no battery, counts at 60% by its estimated 70% and not at 80%.
     */
    @Test
    fun theSheetWritesTheLineFromTheLatestAnswerAndTheScootersItCounts() {
        val defaults = zonesOffDefaults().apply { set("metric", forKey = "units") }
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = listOf(
                    scooter(id = "l1", provider = "lime", battery = 80),
                    scooter(id = "l2", provider = "lime", battery = 90),
                    scooter(id = "l3", provider = "lime", battery = 85),
                    scooter(id = "v1", provider = "voi", battery = null, rangeMeters = 56_000, batteryEstimate = 70),
                ),
                fullRanges = mapOf("lime" to 40_000, "voi" to 80_000),
            ),
        )
        val model = controllers.make(api, defaults = defaults)
        model.updateViewport(zurichRegion, zoom = 16)
        assertTrue(controllers.waitUntil { model.lastUpdated.value != null && !model.isLoading.value })
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                ScooterFilterSheet(model, bottomInset = 0.dp, onDone = {})
            }
        }
        assertEquals("100% usually allows about 40–80 km.", afterThePresets())

        compose.onNode(hasContentDescription("60 percent or more") and isSelectable()).performClick()
        assertEquals("60% usually allows about 24–48 km. $hidden", afterThePresets())

        compose.onNode(hasContentDescription("80 percent or more") and isSelectable()).performClick()
        assertEquals("80% usually allows about 32 km. $hidden", afterThePresets())
    }

    /**
     * UI-264: a row of the panel's list is read as its chip is, by its label, "Shown" or "Hidden" and what a tap
     * does. Not Compose's selected, which makes the row a toggle that TalkBack hints "Double-tap to toggle" where it
     * has no hint of its own, as "All providers" has none (app-ai's TalkBack pass): "Shown" says what VoiceOver's
     * selected trait does.
     */
    @Test
    fun aRowOfThePanelsListIsReadAsItsChip() {
        val model = controllers.make(EmptyScooterAPI)
        lateinit var view: View
        compose.setContent {
            view = LocalView.current
            ScootTheme(dark = false, reduceMotion = true) {
                ProviderList(model, entries)
            }
        }
        compose.waitForIdle()

        fun row(label: String): SemanticsNode = compose.onNode(hasContentDescription(label)).fetchSemanticsNode()
        // Every provider is shown, so a tap on one shows only it.
        for ((label, shown) in listOf("All providers, 0 scooters" to true, "Lime, 12 scooters" to true, "Bolt, one scooter" to false)) {
            val row = row(label)
            assertEquals(label, if (shown) "Shown" else "Hidden", row.config[SemanticsProperties.StateDescription])
            assertEquals(label, null, row.config.getOrNull(SemanticsProperties.Selected))
            assertFalse(label, view.accessibilityNodeProvider.createAccessibilityNodeInfo(row.id)!!.isCheckable)
            assertEquals(label, Role.Button, row.config[SemanticsProperties.Role])
            assertTrue(label, row.children.isEmpty())
        }
        assertEquals(null, row("All providers, 0 scooters").config[SemanticsActions.OnClick].label)
        assertEquals("show only this provider", row("Lime, 12 scooters").config[SemanticsActions.OnClick].label)
        assertEquals("show only this provider", row("Dott: not sharing data right now").config.getOrNull(SemanticsActions.OnClick)?.label)
    }
}
