package com.plhery.scootradar.ui.sheet

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.useFontScale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

// UI-404: a menu taller than its window scrolls, as SwiftUI's Menu does.

@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w390dp-h220dp-xhdpi")
class IosMenuScrollTest {
    @get:Rule
    val compose = createComposeRule()

    @After
    fun tearDown() = resetFontScale()

    /** At large text in a short window, a split screen's say, the menu keeps inside it and its last row is reached. */
    @Test
    fun aMenuTallerThanTheWindowScrollsToItsLastRow() {
        useFontScale(2f)
        var chosen: Int? = null
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                Box(Modifier.fillMaxSize()) {
                    IosMenu(expanded = true, onDismiss = {}, choices = listOf("5 min", "10 min", "15 min", "20 min", "30 min"), chosen = 1, onChoose = { chosen = it })
                }
            }
        }
        compose.waitForIdle()
        val menu = compose.onNodeWithTag(MENU_TAG).getBoundsInRoot()
        assertTrue("$menu", (menu.bottom - menu.top).value <= 220f - 2 * 8 + 0.5f)

        compose.onNode(hasText("30 min") and hasClickAction()).performScrollTo().performClick()
        compose.waitForIdle()
        assertEquals(4, chosen)
    }
}
