package com.plhery.scootradar.ui.settings

import androidx.activity.ComponentActivity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.text.intl.LocaleList
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.EmptyScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.core.model.ScooterLinks
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.theme.ScootTheme
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

// Settings' VoiceOver in ios/ScootRadar/Views/ScooterControls.swift:2408-2433, 2500-2525 and 2662 (ui.md UI-293,
// UI-294), as TalkBack is given it.

/** What TalkBack is given of the languages' names and of the rows that leave the app. */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w390dp-h844dp-xhdpi")
class SettingsAccessibilityTest {
    @get:Rule
    val compose = createAndroidComposeRule<ComponentActivity>()

    private val controllers = TestControllers()
    private val model = controllers.make(EmptyScooterAPI, TestClock())
    private val version = ScooterLinks.appVersion

    @Before
    fun setUp() {
        ScooterLanguage.current = ScooterLanguage.En
        ScooterLinks.appVersion = "1.0.1"
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLinks.appVersion = version
    }

    private fun show(pages: List<SettingsPage>) {
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                ScooterSettingsSheet(
                    controller = model,
                    bottomInset = 0.dp,
                    defaults = null,
                    onDone = {},
                    passProviders = listOf(ScooterProvider.Lime),
                    sources = emptyList(),
                    pages = pages,
                )
            }
        }
        compose.waitForIdle()
    }

    /** The row TalkBack stops on that reads `text`, merged as TalkBack is given it. */
    private fun row(text: String): SemanticsNode = compose.onNode(hasText(text)).fetchSemanticsNode()

    /**
     * UI-293: each language is read by its own name in its own language, with its name in the language shown; the
     * chosen one is selected, and its check is not read.
     */
    @Test
    fun aLanguageIsReadByItsOwnNameInItsOwnLanguageAndTheChosenOneIsSelected() {
        model.setLanguageChoice(ScooterLanguageChoice.Language(ScooterLanguage.En))
        show(listOf(SettingsPage.Root))
        // On the first page, the language shown is read in its own language too.
        val shown = row("English").config[SemanticsProperties.Text].first { it.text == "English" }
        assertEquals(listOf(LocaleList("en")), shown.spanStyles.map { it.item.localeList })
        compose.onNode(hasText("English")).performClick()
        compose.waitForIdle()

        for (language in ScooterLanguage.entries) {
            val row = row(language.displayName)
            val texts = row.config[SemanticsProperties.Text]
            val name = texts.first()
            assertEquals(language.displayName, name.text)
            assertEquals(
                language.rawValue,
                listOf(LocaleList(language.rawValue)),
                name.spanStyles.filter { it.start == 0 && it.end == name.length }.map { it.item.localeList },
            )
            // The name, then its name in English; nothing else, the check least of all.
            assertEquals(language.rawValue, listOfNotNull(language.displayName, language.nameIn(ScooterLanguage.En)), texts.map { it.text })
            assertTrue(language.rawValue, SemanticsProperties.ContentDescription !in row.config)
            assertEquals(language.rawValue, Role.RadioButton, row.config[SemanticsProperties.Role])
            assertEquals(language.rawValue, language == ScooterLanguage.En, row.config[SemanticsProperties.Selected])
        }
        // Automatic is a choice too, not chosen.
        assertEquals(false, row(localized("Automatic (language)")).config[SemanticsProperties.Selected])
    }

    /** UI-294: a row that leaves the app is one button, read by its title and its detail; its arrow is not read. */
    @Test
    fun aRowThatLeavesTheAppIsReadByItsTitleAndDetailAlone() {
        show(listOf(SettingsPage.Root))
        for ((title, detail) in listOf("Send feedback" to "Version 1.0.1", "Source code on GitHub" to null)) {
            val row = row(title)
            assertEquals(title, listOfNotNull(title, detail), row.config[SemanticsProperties.Text].map { it.text })
            assertTrue(title, SemanticsProperties.ContentDescription !in row.config)
            assertEquals(title, Role.Button, row.config[SemanticsProperties.Role])
            assertTrue(title, SemanticsActions.OnClick in row.config)
            assertTrue(title, row.children.isEmpty())
        }

        compose.onNode(hasText("Privacy")).performScrollTo().performClick()
        compose.waitForIdle()
        val notice = row("Read the privacy notice")
        assertEquals(listOf("Read the privacy notice"), notice.config[SemanticsProperties.Text].map { it.text })
        assertEquals(Role.Button, notice.config[SemanticsProperties.Role])
    }
}
