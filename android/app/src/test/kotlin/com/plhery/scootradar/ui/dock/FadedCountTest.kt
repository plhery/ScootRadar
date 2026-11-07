package com.plhery.scootradar.ui.dock

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterDockStatus
import com.plhery.scootradar.core.model.ScooterFadedCount
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.ui.theme.ScootTheme
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.time.Instant
import java.time.ZoneId

/**
 * A chip whose provider has none in view but some faded where they were last seen counts those, greyed as the web's
 * chip-count-faded, and TalkBack reads after its label how many, since when, and whether they are being updated.
 */
@RunWith(AndroidJUnit4::class)
class FadedCountTest {
    @get:Rule
    val compose = createComposeRule()

    private val seenAt = Instant.now().minusSeconds(120)

    @Before
    fun setUp() {
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterDateFormat.timeZone = ZoneId::systemDefault
    }

    @Test
    fun aChipWithNoneInViewCountsItsFadedOnesGreyedAndOnlyThen() {
        val color = Color(0xFF3C3C43)
        val drawn = mutableMapOf<String, Pair<Int, Color>>()
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                FadedCount(0, ScooterFadedCount(3, seenAt, updating = true), color) { count, shown -> drawn["faded"] = count to shown }
                FadedCount(5, ScooterFadedCount(3, seenAt, updating = false), color) { count, shown -> drawn["live"] = count to shown }
                FadedCount(0, null, color) { count, shown -> drawn["none"] = count to shown }
            }
        }
        compose.waitForIdle()
        assertEquals(3 to color.copy(alpha = FADED_COUNT_ALPHA), drawn["faded"])
        assertEquals(5 to color, drawn["live"])
        assertEquals(0 to color, drawn["none"])
    }

    @Test
    fun talkBackReadsTheFadedOnesAfterTheChipsLabelButNotOfAProviderThatIsDown() {
        val time = ScooterDockStatus.seenTime(seenAt)
        assertEquals(
            "Lime, 0 scooters, 3 faded, last seen at $time, updating.",
            chipAccessibilityLabel("Lime", 0, isDown = false, faded = ScooterFadedCount(3, seenAt, updating = true)),
        )
        assertEquals(
            "Bird, one scooter, 2 faded, last seen at $time.",
            chipAccessibilityLabel("Bird", 1, isDown = false, faded = ScooterFadedCount(2, seenAt, updating = false)),
        )
        assertEquals("Dott", chipAccessibilityLabel("Dott", 0, isDown = true, faded = ScooterFadedCount(4, seenAt, updating = true)))
        assertEquals("Tier, 7 scooters", chipAccessibilityLabel("Tier", 7, isDown = false))
    }
}
