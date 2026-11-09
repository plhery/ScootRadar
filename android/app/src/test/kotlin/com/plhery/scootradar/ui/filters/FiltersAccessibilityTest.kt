package com.plhery.scootradar.ui.filters

import android.view.View
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.ProgressBarRangeInfo
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
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.EmptyScooterAPI
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterProviderEntry
import com.plhery.scootradar.core.model.ScooterRangeFilter
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
    private var minimumRange by mutableStateOf(0)
    private val chosenRanges = mutableListOf<Int>()
    /** The latest answer's ranges of a full battery, and the apps switched on, that the paragraph is written from. */
    private var batteryRanges by mutableStateOf(emptyMap<String, Int>())
    private var enabledProviders by mutableStateOf(ScooterProvider.entries.toSet())

    private fun showFilters(rangeUnit: ScooterRangeFilter.Unit = ScooterRangeFilter.Unit.Kilometres) {
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                FilterSheetContent(
                    entries = entries,
                    hasActiveFilters = hasActiveFilters,
                    showResults = "Show 13 scooters",
                    bottomInset = 0.dp,
                    onToggle = {},
                    onReset = {},
                    onDone = {},
                    minimumRange = minimumRange,
                    rangeUnit = rangeUnit,
                    rangeHelp = ScooterRangeFilter.help(minimumRange, batteryRanges, enabledProviders),
                    onChooseRange = { chosenRanges += it; minimumRange = it },
                )
            }
        }
        compose.waitForIdle()
    }

    private fun role(role: Role) = SemanticsMatcher.expectValue(SemanticsProperties.Role, role)

    private val heading = SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading)

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

    /**
     * UI-291: the sections' titles are headings, the range the only minimum, Reset is off with no filter on, and Show
     * results reads its text.
     */
    @Test
    fun theSectionsAreHeadingsAndResetIsOffWithNoFilterOn() {
        hasActiveFilters = false
        showFilters()
        for (title in listOf("Range", "Providers")) compose.onNode(hasText(title), useUnmergedTree = true).assert(heading)
        assertTrue(compose.onAllNodes(hasText("Battery"), useUnmergedTree = true).fetchSemanticsNodes().isEmpty())
        assertTrue(compose.onAllNodes(role(Role.RadioButton)).fetchSemanticsNodes().isEmpty())
        compose.onNode(hasText("Reset")).assertIsNotEnabled()
        compose.onNode(hasText("Show 13 scooters")).assert(role(Role.Button))

        hasActiveFilters = true
        compose.onNode(hasText("Reset")).assertIsEnabled().assert(role(Role.Button))
    }

    /**
     * Issue #12: the minimum range is a slider under the "Range" heading, a whole kilometre a step up to 30 km, read
     * by its title and its minimum, "5 km or more"; the value beside the heading is not read again. A swipe moves it
     * a step, which is set in metres, and the help under it is there only while a minimum is set.
     */
    @Test
    fun theRangeSliderIsReadByItsTitleAndItsMinimumInWholeKilometres() {
        ScooterUnits.current = ScooterUnits.Metric
        minimumRange = 5_000
        showFilters()
        compose.onNode(hasText("Range"), useUnmergedTree = true).assert(heading)
        val help = neither
        compose.onNode(hasText(help)).assertExists()

        val slider = compose.onNodeWithContentDescription("Range").fetchSemanticsNode()
        assertEquals("5 km or more", plainSpaces(slider.config[SemanticsProperties.StateDescription]))
        assertEquals(ProgressBarRangeInfo(5f, 0f..30f, steps = 29), slider.config[SemanticsProperties.ProgressBarRangeInfo])
        // "5 km+" is drawn beside the heading, and not read: the slider says it.
        assertTrue(
            compose.onAllNodes(SemanticsMatcher("reads 5 km+") { node ->
                node.config.getOrNull(SemanticsProperties.Text).orEmpty().any { plainSpaces(it.text) == "5 km+" }
            }, useUnmergedTree = true).fetchSemanticsNodes().isEmpty(),
        )

        compose.onNodeWithContentDescription("Range").performSemanticsAction(SemanticsActions.SetProgress) { it(12f) }
        compose.waitForIdle()
        assertEquals(listOf(12_000), chosenRanges)
        assertEquals("12 km or more", plainSpaces(compose.onNodeWithContentDescription("Range").fetchSemanticsNode().config[SemanticsProperties.StateDescription]))

        compose.onNodeWithContentDescription("Range").performSemanticsAction(SemanticsActions.SetProgress) { it(0f) }
        compose.waitForIdle()
        assertEquals(listOf(12_000, 0), chosenRanges)
        assertEquals("Any", compose.onNodeWithContentDescription("Range").fetchSemanticsNode().config[SemanticsProperties.StateDescription])
        assertTrue(compose.onAllNodes(hasText(help)).fetchSemanticsNodes().isEmpty())
    }

    /** Where lengths are in miles the slider goes a whole mile a step up to 20 mi, a step set in metres: 3 mi is 4,828 m. */
    @Test
    fun theRangeSliderGoesInWholeMilesWhereLengthsAreInMiles() {
        ScooterUnits.current = ScooterUnits.Imperial
        minimumRange = 4_828
        showFilters(rangeUnit = ScooterRangeFilter.Unit.Miles)
        val slider = compose.onNodeWithContentDescription("Range").fetchSemanticsNode()
        assertEquals("3 mi or more", plainSpaces(slider.config[SemanticsProperties.StateDescription]))
        assertEquals(ProgressBarRangeInfo(3f, 0f..20f, steps = 19), slider.config[SemanticsProperties.ProgressBarRangeInfo])

        compose.onNodeWithContentDescription("Range").performSemanticsAction(SemanticsActions.SetProgress) { it(20f) }
        compose.waitForIdle()
        assertEquals(listOf(32_187), chosenRanges)
        assertEquals("20 mi or more", plainSpaces(compose.onNodeWithContentDescription("Range").fetchSemanticsNode().config[SemanticsProperties.StateDescription]))
    }

    private fun plainSpaces(text: String): String = text.replace('\u00A0', ' ').replace('\u202F', ' ')

    private val neither = "Scooters without range or battery info are hidden while a minimum is set."

    /**
     * What TalkBack reads next after the slider, in the sheet's order, its spaces plain: the paragraph under it, or the
     * next section's heading where there is none.
     */
    private fun afterTheSlider(): String {
        compose.waitForIdle()
        val slider = compose.onNodeWithContentDescription("Range").fetchSemanticsNode()
        fun walk(node: SemanticsNode): List<SemanticsNode> = listOf(node) + node.children.flatMap(::walk)
        val nodes = walk(compose.onRoot().fetchSemanticsNode())
        val next = nodes.drop(nodes.indexOfFirst { it.id == slider.id } + 1)
            .filter { node -> generateSequence(node.parent) { it.parent }.none { it.id == slider.id } }
            .first { SemanticsProperties.Text in it.config }
        return plainSpaces(next.config[SemanticsProperties.Text].joinToString { it.text })
    }

    /**
     * Issue #12: under the slider, while a minimum is set, one paragraph says what battery the scooters that only
     * report one need, from the latest answer's full battery's ranges and of the apps switched on, which apps' are all
     * hidden, and that the scooters with neither are hidden. TalkBack reads it right after the slider, as what
     * describes it; at Any the next section's heading follows.
     */
    @Test
    fun underTheSliderOneParagraphSaysWhatTheMinimumHides() {
        ScooterUnits.current = ScooterUnits.Metric
        showFilters()
        assertEquals("Providers", afterTheSlider())

        minimumRange = 6_000
        assertEquals(neither, afterTheSlider())

        batteryRanges = mapOf("lime" to 11_500, "bolt" to 29_400, "voi" to 72_800)
        assertEquals(
            "Scooters that only report a battery need at least 9% (Voi), 21% (Bolt), and 53% (Lime). $neither",
            afterTheSlider(),
        )

        enabledProviders = enabledProviders - ScooterProvider.Voi
        minimumRange = 12_000
        assertEquals(
            "Scooters that only report a battery need at least 41% (Bolt). Scooters from Lime that only report a battery " +
                "are hidden, as a full battery may not reach 12 km. $neither",
            afterTheSlider(),
        )

        minimumRange = 0
        assertEquals("Providers", afterTheSlider())
    }

    /**
     * The sheet writes the paragraph from the controller's latest answer and the apps switched on: Lime's 11.5 km
     * asks 53% at 6 km, and Lime switched off leaves only what the scooters with neither do.
     */
    @Test
    fun theSheetWritesTheParagraphFromTheLatestAnswer() {
        val defaults = zonesOffDefaults().apply { set("metric", forKey = "units") }
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = listOf(scooter(id = "l1", provider = "lime", battery = 80)),
                batteryRanges = mapOf("lime" to 11_500),
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
        assertEquals("Providers", afterTheSlider())

        compose.onNodeWithContentDescription("Range").performSemanticsAction(SemanticsActions.SetProgress) { it(6f) }
        assertEquals("Scooters that only report a battery need at least 53% (Lime). $neither", afterTheSlider())

        compose.runOnIdle { model.toggle(ScooterProvider.Lime) }
        assertEquals(neither, afterTheSlider())
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
