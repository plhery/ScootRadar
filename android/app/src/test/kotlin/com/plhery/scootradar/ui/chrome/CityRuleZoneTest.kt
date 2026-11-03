package com.plhery.scootradar.ui.chrome

import android.icu.text.BreakIterator
import android.icu.util.ULocale
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
import com.plhery.scootradar.core.model.ScooterZoneSpeeds
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
    private val launchLocale = ScooterLanguage.launchLocale

    @After
    fun tearDown() {
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
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
        // Its swatch hatched the other way, as the map draws it.
        assertEquals(listOf(true), lines.map { it.timed })
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
                assertEquals(listOf(street.kind), legendKinds(ScooterZoneState.Off, 0, shown, besideNote = false))
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

    /** The speeds of zones, in km/h, as the legend sums them up. */
    private fun speeds(vararg kph: Double?) = kph.fold(ScooterZoneSpeeds()) { speeds, speed -> speeds + speed }

    /** ICU's spaces, before a unit in French, as plain ones, and without the joiners that keep a speed whole. */
    private fun plain(text: String) = text.replace('\u00A0', ' ').replace('\u202F', ' ').replace("\u2060", "")

    /** A slow street of Warsaw's, at [kph] where the city gives a speed, within [hours] where it has some. */
    private fun warsaw(id: String, kph: Double?, hours: List<CityRuleZone.Hours> = emptyList()) = CityRuleZone(
        id = "warsaw-$id", authority = "Warszawa", timeZone = "Europe/Warsaw", kind = ScooterZoneKind.Slow,
        maxSpeedKph = kph, firstDay = "", hours = hours, source = "https://example.com/warsaw",
        lines = listOf(listOf(GeoPoint(52.23, 21.0), GeoPoint(52.23, 21.003))),
    )

    @Test
    fun slowSaysTheLimitOfTheSlowZonesItCounts() {
        Locale.setDefault(Locale.forLanguageTag("en-CH"))
        ScooterLanguage.current = ScooterLanguage.En
        val swiss = Locale.forLanguageTag("en-CH")
        // One speed: Linköping's 6 km/h, and 6.4 rounded to the same.
        assertEquals("Slow: 6 km/h", plain(kindLabel(ScooterZoneKind.Slow, speeds(6.0), swiss)))
        assertEquals("Slow: 6 km/h", plain(kindLabel(ScooterZoneKind.Slow, speeds(6.0, 6.4), swiss)))
        // Several: from the least to the greatest.
        assertEquals("Slow: 6–15 km/h", plain(kindLabel(ScooterZoneKind.Slow, speeds(12.0, 6.0, 15.0), swiss)))
        // One zone without a speed, or none at all: plain "Slow".
        assertEquals("Slow", kindLabel(ScooterZoneKind.Slow, speeds(6.0, null, 15.0), swiss))
        assertEquals("Slow", kindLabel(ScooterZoneKind.Slow, ScooterZoneSpeeds(), swiss))
        // Only slow says a speed.
        assertEquals("No riding", kindLabel(ScooterZoneKind.NoRide, speeds(6.0), swiss))

        // The operators' slow zones while their kinds are named, and the cities' at all hours.
        val city = listOf(CityRuleZone.Shown(rule = warsaw("chmielna", 12.0), inForce = true))
        assertEquals(10.0..12.0, legendKindSpeeds(ScooterZoneState.Shown, 3, speeds(10.0), city, besideNote = false).known)
        // The note stands for the operators' kinds: the city's alone.
        assertEquals(12.0..12.0, legendKindSpeeds(ScooterZoneState.ZoomIn, 0, speeds(10.0), city, besideNote = true).known)
        assertEquals(12.0..12.0, legendKindSpeeds(ScooterZoneState.Off, 0, speeds(10.0), city, besideNote = false).known)
        // A city's street without a speed among them: plain "Slow".
        val without = city + CityRuleZone.Shown(rule = warsaw("zgoda", null), inForce = true)
        assertNull(legendKindSpeeds(ScooterZoneState.Shown, 3, speeds(10.0), without, besideNote = false).known)
        // A city's rule with a line of its own, timed or not now, says its speed there, not among the kinds.
        val apart = listOf(
            CityRuleZone.Shown(rule = warsaw("zlota", 15.0, hours = listOf(CityRuleZone.Hours(22 * 60, 6 * 60))), inForce = true),
            CityRuleZone.Shown(rule = warsaw("bracka", 20.0), inForce = false),
        )
        assertEquals(10.0..10.0, legendKindSpeeds(ScooterZoneState.Shown, 3, speeds(10.0), apart, besideNote = false).known)
    }

    @Test
    fun slowSaysMilesPerHourWhereTheRegionMeasuresInMiles() {
        // 12.87 km/h is 8 mph and 16.09 is 10, each rounded once converted; 16 and 16.1 are both 10, said once.
        val us = Locale.forLanguageTag("en-US")
        assertEquals("8–10 mph", plain(speedText(12.87..16.09, us)))
        assertEquals("10 mph", plain(speedText(16.0..16.1, Locale.forLanguageTag("en-GB"))))
        assertEquals("6–15 km/h", plain(speedText(6.0..15.0, Locale.forLanguageTag("en-CH"))))
        // In the user's region, as the legend writes it.
        Locale.setDefault(us)
        ScooterLanguage.launchLocale = { us }
        ScooterLanguage.current = ScooterLanguage.En
        assertEquals("Slow: 8–10 mph", plain(kindLabel(ScooterZoneKind.Slow, speeds(16.09, 12.87))))
    }

    @Test
    fun aTimedSlowRuleSaysItsSpeedOnItsLine() {
        val swiss = Locale.forLanguageTag("en-CH")
        Locale.setDefault(swiss)
        ScooterLanguage.launchLocale = { swiss }
        ScooterLanguage.current = ScooterLanguage.En
        Settings.System.putString(ApplicationProvider.getApplicationContext<android.content.Context>().contentResolver, Settings.System.TIME_12_24, "24")
        val night = listOf(CityRuleZone.Hours(fromMinute = 22 * 60, untilMinute = 6 * 60))
        val lines = ruleLines(
            listOf(
                CityRuleZone.Shown(rule = warsaw("zlota", 12.0, hours = night), inForce = true),
                CityRuleZone.Shown(rule = warsaw("bracka", 15.0, hours = night), inForce = true),
                CityRuleZone.Shown(rule = warsaw("zgoda", null, hours = listOf(CityRuleZone.Hours(7 * 60, 9 * 60))), inForce = true),
                CityRuleZone.Shown(rule = warsaw("chmielna", 12.0), inForce = false),
            ),
        )
        assertEquals(
            listOf("Slow: 12–15 km/h 22:00–06:00", "Slow 07:00–09:00", "Slow: 12 km/h (not now)"),
            lines.map { plain(it.text) },
        )
        assertEquals(listOf(true, true, false), lines.map { it.timed })
    }

    /**
     * A slow zone's speed is never broken across lines where the legend wraps its name: beside the locate button in
     * Portuguese at font scale 1.3 on ScootRadar_Phone_Min it read "Velocidade reduzida: 5 km/" over "h". A line may
     * break only before it, as the line breaker the text's layout uses finds the places.
     */
    @Test
    fun aSpeedIsNeverBrokenAcrossLines() {
        for (language in ScooterLanguage.entries) {
            for (region in listOf("CH", "US")) {
                val locale = Locale.forLanguageTag("${language.rawValue}-$region")
                Locale.setDefault(locale)
                ScooterLanguage.launchLocale = { locale }
                ScooterLanguage.current = language
                for (range in listOf(5.0..5.0, 6.0..15.0)) {
                    val speed = speedText(range, locale)
                    val label = kindLabel(ScooterZoneKind.Slow, speeds(range.start, range.endInclusive), locale)
                    val start = label.indexOf(speed)
                    assertTrue("$locale: \"$label\" says \"$speed\"", start >= 0)
                    val lines = BreakIterator.getLineInstance(ULocale.forLocale(locale)).apply { setText(label) }
                    var at = lines.first()
                    while (at != BreakIterator.DONE) {
                        assertFalse("$locale: \"${plain(label)}\" may break at $at, in its speed", at > start && at < start + speed.length)
                        at = lines.next()
                    }
                }
            }
        }
    }

    @Test
    fun slowSaysItsSpeedInEveryLanguage() {
        val said = mapOf(
            ScooterLanguage.En to "Slow: 6–15 km/h",
            ScooterLanguage.De to "Langsam: 6–15 km/h",
            ScooterLanguage.Fr to "Vitesse réduite : 6–15 km/h",
            ScooterLanguage.It to "Velocità ridotta: 6–15 km/h",
            ScooterLanguage.Nl to "Langzaam: 6–15 km/u",
            ScooterLanguage.Nb to "Lav fart: 6–15 km/t",
            ScooterLanguage.Pt to "Velocidade reduzida: 6–15 km/h",
            ScooterLanguage.Es to "Velocidad reducida: 6–15 km/h",
            ScooterLanguage.Is to "Hægur akstur: 6–15 km/klst.",
        )
        assertEquals(ScooterLanguage.entries.toSet(), said.keys)
        for ((language, label) in said) {
            val swiss = Locale.forLanguageTag("${language.rawValue}-CH")
            Locale.setDefault(swiss)
            ScooterLanguage.launchLocale = { swiss }
            ScooterLanguage.current = language
            assertEquals(language.rawValue, label, plain(kindLabel(ScooterZoneKind.Slow, speeds(6.0, 15.0))))
        }
    }
}
