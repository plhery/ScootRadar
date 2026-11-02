package com.plhery.scootradar.ui.chrome

import android.provider.Settings
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.LinkAnnotation
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterZoneKind
import com.plhery.scootradar.core.model.ScooterZoneState
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.Locale
import java.util.TimeZone

// The legend's test of ios/ScootRadarTests/ScooterZonesTests.swift (T421).

/** The cities' kinds, lines and credit in the zones' legend (ui.md UI-408). */
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
    private val shown: List<CityRuleZone.Shown>
        get() = (
            listOf(porto) + bergen.filter { it.kind == ScooterZoneKind.Parking }.take(2) +
                listOf(first(ScooterZoneKind.Slow), first(ScooterZoneKind.NoRide), first(ScooterZoneKind.NoParking), hongdae)
            ).map { CityRuleZone.Shown(rule = it, inForce = true) }

    private fun links(text: AnnotatedString) = text.getLinkAnnotations(0, text.length).map { (it.item as LinkAnnotation.Url).url }

    @Test
    fun theLegendNamesEachKindOnceTheStrongestFirstAndCreditsEachCityOnce() {
        Locale.setDefault(Locale.forLanguageTag("en-CH"))
        ScooterLanguage.current = ScooterLanguage.En
        val all = listOf(ScooterZoneKind.NoRide, ScooterZoneKind.NoParking, ScooterZoneKind.Slow, ScooterZoneKind.Parking)
        // The zones off: the cities' kinds, each once, and Hongdae's street a line of its own for its hours.
        assertEquals(all, legendKinds(ScooterZoneState.Off, 0, shown, besideNote = false))
        val lines = ruleLines(shown)
        assertEquals(listOf(ScooterZoneKind.NoRide), lines.map { it.kind })
        // "No riding 12:00–23:00", in the user's format, with no one's name.
        val text = lines.single().text
        assertTrue(text, text.startsWith("No riding ") && text.contains("–") && !text.contains("Seoul"))
        // Who sets them, once each, the strongest rule's first, linked to where they say so.
        val credit = zoneCredit(shown, link = Color.Blue)!!
        assertEquals("Bergen kommune · Seoul · Porto", credit.text)
        assertEquals(listOf(bergen[0].source, hongdae.source, porto.source), links(credit))
        // The zones on: the operators' kinds and the cities' together, still each once.
        assertEquals(all, legendKinds(ScooterZoneState.Shown, 12, shown, besideNote = false))
        // Further out, the note stands for the operators' kinds, and the cities' are still named.
        val portoOnly = listOf(CityRuleZone.Shown(rule = porto, inForce = true))
        assertEquals(listOf(ScooterZoneKind.Parking), legendKinds(ScooterZoneState.ZoomIn, 0, portoOnly, besideNote = true))
        // No city: no credit.
        assertNull(zoneCredit(emptyList(), link = Color.Blue))
    }

    /**
     * The streets as the catalog has them, Seoul's and Antalya's, traced on OpenStreetMap's roads: the credit names it,
     * the whole "Seoul, lines © OpenStreetMap" linked to the city's notice (e1548810, UI-410), and a street at all
     * hours has no line of its own, only its kind (UI-411). The iPhone's test reads the catalog's street in the legend;
     * the test above has a street of its own (LOG-370), so this one reads the catalog's.
     */
    @Test
    fun theCatalogsStreetsCreditOpenStreetMap() {
        Locale.setDefault(Locale.forLanguageTag("en-CH"))
        ScooterLanguage.current = ScooterLanguage.En
        assertFalse(CityRuleZone.all.isEmpty())
        for (street in CityRuleZone.all) {
            val shown = listOf(CityRuleZone.Shown(rule = street, inForce = true))
            val credit = zoneCredit(shown, link = Color.Blue)!!
            assertEquals(street.authority, credit.text)
            assertTrue(credit.text, credit.text.endsWith(", lines © OpenStreetMap"))
            assertEquals(listOf(street.source), links(credit))
            if (street.hours.isEmpty()) {
                assertTrue(ruleLines(shown).isEmpty())
                assertEquals(listOf(ScooterZoneKind.NoRide), legendKinds(ScooterZoneState.Off, 0, shown, besideNote = false))
            } else {
                assertTrue(ruleLines(shown).single().text.startsWith("No riding "))
            }
        }
    }

    /**
     * LOG-355: a rule's hours are its place's clock, kept as minutes and written as a time at UTC, as the iPhone writes
     * them at GMT (ScooterControls.swift wallTime): the phone's own zone doesn't move them, east of UTC (Auckland) or
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
            val lines = ruleLines(listOf(hongdae, night).map { CityRuleZone.Shown(rule = it, inForce = true) })
            assertEquals(id, listOf("No riding 12:00–23:00", "No riding 22:00–00:00"), lines.map { it.text })
        }
    }

    @Test
    fun theLegendsLinesAreInTheUsersLanguage() {
        Locale.setDefault(Locale.forLanguageTag("nl-NL"))
        ScooterLanguage.current = ScooterLanguage.Nl
        assertEquals(
            listOf("Rijverbod", "Parkeerverbod", "Langzaam", "Parkeerplek"),
            legendKinds(ScooterZoneState.Off, 0, shown, besideNote = false).map { it.label },
        )
        assertTrue(ruleLines(shown).single().text.startsWith("Rijverbod "))
        // A rule outside its hours says so.
        val dimmed = ruleLines(listOf(CityRuleZone.Shown(rule = hongdae, inForce = false))).single()
        assertFalse(dimmed.inForce)
        assertTrue(dimmed.text, dimmed.text.endsWith(" (nu niet)"))
    }
}
