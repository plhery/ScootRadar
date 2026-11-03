package com.plhery.scootradar.ui.chrome

import androidx.compose.foundation.layout.Box
import androidx.compose.ui.layout.SubcomposeLayout
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterZoneKind
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.ui.theme.PHONE
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.useFontScale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * The zones' legend takes the height it answers when asked it ahead at a width (its maxIntrinsicHeight), at every
 * width it may have beside the locate button or over it, at each font scale: the phone's locate row decides by that
 * answer whether the legend goes over the button (ScooterMapScreen.kt's LocateRow, UI-410). The operators' kinds,
 * packed by their least width, a Text's longest word, once counted a row too few at about one width in nine, up to
 * 33 dp at font scale 2.0, which beside the button would have reached under the search bar (review-app-ap); and a
 * name wrapped in a line narrower than it, as French ones are, would have been counted one line.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = PHONE)
class ZoneLegendIntrinsicsTest {
    @get:Rule
    val compose = createComposeRule()

    @After
    fun tearDown() {
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
    }

    @Test
    fun theHeightAskedIsTheHeightTakenAtTheDefaultSize() = assertHeightsAsAsked(1f)

    @Test
    fun theHeightAskedIsTheHeightTakenAtOneAndAHalf() = assertHeightsAsAsked(1.5f)

    @Test
    fun theHeightAskedIsTheHeightTakenAtTheLargestText() = assertHeightsAsAsked(2f)

    /** French names, which wrap where they are longer than the legend's line ("Stationnement interdit"). */
    @Test
    fun inFrenchTheHeightAskedIsTheHeightTakenAtTheDefaultSize() = assertHeightsAsAsked(1f, ScooterLanguage.Fr)

    @Test
    fun inFrenchTheHeightAskedIsTheHeightTakenAtTheLargestText() = assertHeightsAsAsked(2f, ScooterLanguage.Fr)

    private fun assertHeightsAsAsked(scale: Float, language: ScooterLanguage = ScooterLanguage.En) {
        useFontScale(scale)
        ScooterLanguage.current = language
        val wrong = mutableListOf<String>()
        var looked = 0
        compose.setContent {
            ScootTheme(dark = false, reduceMotion = true) {
                SubcomposeLayout { _ ->
                    wrong.clear()
                    looked = 0
                    for ((name, rules) in cases) {
                        for (width in WIDTHS) {
                            val legend = subcompose("$name $width") {
                                Box { ZoneLegend(state = ScooterZoneState.Shown, count = 12, rules = rules, notices = emptyList()) }
                            }.single()
                            val room = width.dp.roundToPx()
                            val asked = legend.maxIntrinsicHeight(room)
                            val taken = legend.measure(Constraints(maxWidth = room)).height
                            if (asked != taken) wrong += "$name at $width dp: asked $asked px, took $taken px"
                            looked++
                        }
                    }
                    layout(0, 0) {}
                }
            }
        }
        compose.waitForIdle()
        assertEquals(cases.size * WIDTHS.count(), looked)
        assertEquals("in $language at font scale $scale", emptyList<String>(), wrong)
    }

    private companion object {
        /** From a sliver to the locate row's widest, 560, every 2 dp. */
        val WIDTHS = 60..560 step 2

        /**
         * The operators' kinds with a street's line, with two lines of a city's rules, one in force, and with a city's
         * parking among them, each with its credit.
         */
        val cases = mapOf(
            "the kinds and a street" to listOf(
                CityRuleZone.Shown(rule("seoul-credited", "Seoul, lines © OpenStreetMap", 12 * 60, 23 * 60), inForce = false),
            ),
            "the kinds and two rules" to listOf(
                CityRuleZone.Shown(rule("seoul", "Seoul", 22 * 60, 6 * 60), inForce = true),
                CityRuleZone.Shown(rule("gangnam", "Gangnam-gu", 9 * 60, 18 * 60 + 30), inForce = false),
            ),
            "the kinds and a city's parking" to listOf(
                CityRuleZone.Shown(
                    CityRuleZone(
                        id = "porto-parking-1", authority = "Porto", timeZone = "Europe/Lisbon", kind = ScooterZoneKind.Parking,
                        source = "https://example.com/porto",
                        ring = listOf(GeoPoint(41.1441, -8.6096), GeoPoint(41.1441, -8.6095), GeoPoint(41.1442, -8.6095)),
                    ),
                    inForce = true,
                ),
            ),
        )

        fun rule(id: String, authority: String, from: Int, until: Int) = CityRuleZone(
            id = id,
            authority = authority,
            timeZone = "Asia/Seoul",
            firstDay = "2026-05-01",
            hours = listOf(CityRuleZone.Hours(fromMinute = from, untilMinute = until)),
            source = "https://example.com/$id",
            lines = listOf(listOf(GeoPoint(37.5665, 126.978), GeoPoint(37.5675, 126.979))),
        )
    }
}
