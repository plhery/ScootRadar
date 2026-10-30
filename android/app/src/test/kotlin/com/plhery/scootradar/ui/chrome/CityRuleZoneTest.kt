package com.plhery.scootradar.ui.chrome

import android.provider.Settings
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.LinkAnnotation
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterZoneKind
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.Locale
import java.util.TimeZone

// The legend's test of ios/ScootRadarTests/ScooterZonesTests.swift (T421).

/** The cities' lines in the zones' legend (ui.md UI-408). */
@RunWith(AndroidJUnit4::class)
class CityRuleZoneTest {
    private val locale = Locale.getDefault()
    private val zone = TimeZone.getDefault()

    @After
    fun tearDown() {
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
        TimeZone.setDefault(zone)
        Settings.System.putString(ApplicationProvider.getApplicationContext<android.content.Context>().contentResolver, Settings.System.TIME_12_24, null)
    }

    // A street of Seoul, a parking place of Porto's and Bergen's zones, made here rather than read from data/, which
    // changes them (LOG-370); CatalogParityTest holds the catalog's own to the iPhone's.
    private val hongdae = CityRuleZone(
        id = "seoul-hongdae-red-road",
        authority = "Seoul",
        timeZone = "Asia/Seoul",
        firstDay = "2025-05-16",
        hours = listOf(CityRuleZone.Hours(fromMinute = 12 * 60, untilMinute = 23 * 60)),
        source = "https://news.seoul.go.kr/traffic/archives/514266",
        lines = listOf(listOf(GeoPoint(37.555766, 126.927544), GeoPoint(37.55554, 126.925521))),
    )
    private val porto = zone("porto-parking-1", "Porto", "Europe/Lisbon", ScooterZoneKind.Parking, GeoPoint(41.144129, -8.609594))
    private val bergen = listOf(
        ScooterZoneKind.Parking, ScooterZoneKind.Parking, ScooterZoneKind.Slow, ScooterZoneKind.NoRide, ScooterZoneKind.NoParking,
    ).mapIndexed { index, kind -> zone("bergen-$index", "Bergen kommune", "Europe/Oslo", kind, GeoPoint(60.39, 5.32 + index * 0.001)) }
    private fun first(kind: ScooterZoneKind) = bergen.first { it.kind == kind }

    /** A square of 0.0001° a side at [at], its source its city's, named by the start of its id. */
    private fun zone(id: String, authority: String, timeZone: String, kind: ScooterZoneKind, at: GeoPoint) = CityRuleZone(
        id = id,
        authority = authority,
        timeZone = timeZone,
        kind = kind,
        source = "https://example.com/${id.substringBefore('-')}",
        ring = listOf(
            at, GeoPoint(at.latitude, at.longitude + 0.0001), GeoPoint(at.latitude + 0.0001, at.longitude + 0.0001),
            GeoPoint(at.latitude + 0.0001, at.longitude),
        ),
    )

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

    /**
     * LOG-355: a rule's hours are its place's clock, kept as minutes and written as a time at UTC, as the iPhone writes
     * them at GMT (ScooterControls.swift:2932-2936): the phone's own zone doesn't move them, east of UTC (Auckland) or
     * west (Los Angeles). CI runs at UTC, where a zone mixed in shows nothing.
     */
    @Test
    fun theLegendsHoursAreThePlacesClockInEveryTimeZone() {
        Locale.setDefault(Locale.forLanguageTag("en-CH"))
        ScooterLanguage.current = ScooterLanguage.En
        Settings.System.putString(ApplicationProvider.getApplicationContext<android.content.Context>().contentResolver, Settings.System.TIME_12_24, "24")
        // Until midnight, which Swift's Date writes as 00:00.
        val night = CityRuleZone(
            id = "seoul-night", authority = "Seoul", timeZone = "Asia/Seoul", firstDay = hongdae.firstDay,
            hours = listOf(CityRuleZone.Hours(fromMinute = 22 * 60, untilMinute = 24 * 60)), source = hongdae.source,
            lines = hongdae.lines,
        )
        for (id in listOf("Pacific/Auckland", "America/Los_Angeles", "UTC")) {
            TimeZone.setDefault(TimeZone.getTimeZone(id))
            val lines = ruleLines(listOf(hongdae, night).map { CityRuleZone.Shown(rule = it, inForce = true) }, link = Color.Blue)
            assertEquals(id, listOf("No riding 12:00–23:00 · Seoul", "No riding 22:00–00:00 · Seoul"), lines.map { it.text.text })
        }
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
