package com.plhery.scootradar.ui.filters

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
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
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.EmptyScooterAPI
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterProviderEntry
import com.plhery.scootradar.ui.dock.ProviderList
import com.plhery.scootradar.ui.theme.ScootTheme
import org.junit.After
import org.junit.Assert.assertEquals
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
    }

    private var hasActiveFilters by mutableStateOf(true)

    private fun showFilters(minimumBattery: Int = 30) {
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                FilterSheetContent(
                    minimumBattery = minimumBattery,
                    entries = entries,
                    hasActiveFilters = hasActiveFilters,
                    showResults = "Show 13 scooters",
                    bottomInset = 0.dp,
                    onChooseMinimum = {},
                    onToggle = {},
                    onReset = {},
                    onDone = {},
                )
            }
        }
        compose.waitForIdle()
    }

    private fun role(role: Role) = SemanticsMatcher.expectValue(SemanticsProperties.Role, role)

    private val heading = SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading)

    /**
     * UI-289: the presets are a group of choices under the "Battery" heading, each read by its label alone, "Any"
     * or "30 percent or more", and the chosen one selected.
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
        // "30%+" drawn is not read beside the label.
        assertTrue(presets.none { SemanticsProperties.Text in it.config })
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
     * UI-264: a row of the panel's list is read as its chip is, by its label, "Shown" or "Hidden" and what a tap
     * does, and selected while its provider is shown.
     */
    @Test
    fun aRowOfThePanelsListIsReadAsItsChip() {
        val model = controllers.make(EmptyScooterAPI)
        compose.setContent {
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
            assertEquals(label, shown, row.config[SemanticsProperties.Selected])
            assertEquals(label, Role.Button, row.config[SemanticsProperties.Role])
            assertTrue(label, row.children.isEmpty())
        }
        assertEquals(null, row("All providers, 0 scooters").config[SemanticsActions.OnClick].label)
        assertEquals("show only this provider", row("Lime, 12 scooters").config[SemanticsActions.OnClick].label)
        assertEquals("show only this provider", row("Dott: not sharing data right now").config.getOrNull(SemanticsActions.OnClick)?.label)
    }
}
