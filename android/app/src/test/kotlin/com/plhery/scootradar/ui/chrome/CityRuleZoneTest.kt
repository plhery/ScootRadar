package com.plhery.scootradar.ui.chrome

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.LinkAnnotation
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterZoneKind
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.Locale

// The legend's test of ios/ScootRadarTests/ScooterZonesTests.swift (T421).

/** The cities' lines in the zones' legend (ui.md UI-408), from the catalog's own rules and zones. */
@RunWith(AndroidJUnit4::class)
class CityRuleZoneTest {
    private val locale = Locale.getDefault()

    @After
    fun tearDown() {
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
    }

    private val hongdae = CityRuleZone.all.single { it.id == "seoul-hongdae-red-road" }
    private val porto = CityRuleZone.cityZones.first { it.authority == "Porto" }
    private val bergen = CityRuleZone.cityZones.filter { it.authority == "Bergen kommune" }
    private fun first(kind: ScooterZoneKind) = bergen.first { it.kind == kind }

    /** Porto's parking place, two of Bergen's and one of each of its other kinds, and Seoul's street, all in force. */
    private fun lines(): List<RuleLine> {
        val rules = listOf(porto) + bergen.filter { it.kind == ScooterZoneKind.Parking }.take(2) +
            listOf(first(ScooterZoneKind.Slow), first(ScooterZoneKind.NoRide), first(ScooterZoneKind.NoParking), hongdae)
        return ruleLines(rules.map { CityRuleZone.Shown(rule = it, inForce = true) }, link = Color.Blue)
    }

    private fun links(line: RuleLine) = line.text.getLinkAnnotations(0, line.text.length).map { (it.item as LinkAnnotation.Url).url }

    @Test
    fun theLegendHasALineForEachKindAndWhoSetsItTheStrongestRuleFirst() {
        Locale.setDefault(Locale.forLanguageTag("en-CH"))
        ScooterLanguage.current = ScooterLanguage.En
        val lines = lines()
        assertEquals(
            listOf(
                ScooterZoneKind.NoRide, ScooterZoneKind.NoRide, ScooterZoneKind.NoParking, ScooterZoneKind.Slow,
                ScooterZoneKind.Parking, ScooterZoneKind.Parking,
            ),
            lines.map { it.kind },
        )
        val texts = lines.map { it.text.text }
        assertEquals("No riding · Bergen kommune", texts[0])
        // "No riding 12:00–23:00 · Seoul", in the user's format.
        assertTrue(texts[1], texts[1].startsWith("No riding "))
        assertTrue(texts[1], texts[1].contains("–"))
        assertTrue(texts[1], texts[1].endsWith(" · Seoul"))
        assertEquals("No parking · Bergen kommune", texts[2])
        assertEquals("Slow · Bergen kommune", texts[3])
        assertEquals("Parking · Porto", texts[4])
        assertEquals("Parking · Bergen kommune", texts[5])
        // Who sets it, linked to where they say so.
        assertEquals(listOf(porto.source), links(lines[4]))
        assertEquals(listOf(bergen[0].source), links(lines[5]))
    }

    @Test
    fun theLegendsLinesAreInTheUsersLanguage() {
        Locale.setDefault(Locale.forLanguageTag("nl-NL"))
        ScooterLanguage.current = ScooterLanguage.Nl
        val texts = lines().map { it.text.text }
        assertEquals("Rijverbod · Bergen kommune", texts[0])
        assertTrue(texts[1], texts[1].startsWith("Rijverbod ") && texts[1].endsWith(" · Seoul"))
        assertEquals(
            listOf("Parkeerverbod · Bergen kommune", "Langzaam · Bergen kommune", "Parkeerplek · Porto", "Parkeerplek · Bergen kommune"),
            texts.drop(2),
        )
        // A rule outside its hours says so.
        val dimmed = ruleLines(listOf(CityRuleZone.Shown(rule = hongdae, inForce = false)), link = Color.Blue).single()
        assertTrue(dimmed.text.text, dimmed.text.text.endsWith(" · Seoul (nu niet)"))
    }
}
