package com.plhery.scootradar.core.model

import java.io.File
import java.util.Locale
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

// The iPhone app's strings files read here as Foundation reads them, and their sentences formatted as
// String(localized:) and String(format:) format them.
class ScooterStringsTest {
    private val repo = File(System.getProperty("scootradar.repo"))

    @After
    fun showTheLaunchLanguage() {
        ScooterLanguage.current = ScooterLanguage.atLaunch
    }

    @Test
    fun everyLanguageHasTheSentencesOfItsStringsFiles() {
        for (language in ScooterLanguage.entries) {
            val file = repo.resolve("ios/ScootRadar/${language.rawValue}.lproj/Localizable.strings").readText()
            val lines = file.lines().filter { it.startsWith("\"") }
            assertEquals(language.rawValue, lines.size, language.strings.keys.size)
            for (line in lines) {
                val (key, value) = Regex("^\"(.*)\" = \"(.*)\";$").find(line)!!.destructured
                assertEquals(line, value, language.strings[key])
            }
            assertEquals(setOf("ScootRadar covers %lld cities in %lld countries."), language.strings.countingKeys)
        }
    }

    @Test
    fun everySentenceOfEveryLanguageTakesTheArgumentsOfItsKey() {
        // %@ takes a string and %lld a whole number, as Swift's interpolations make them.
        val specifier = Regex("%(?:(\\d+)\\$)?(@|lld)")
        for (language in ScooterLanguage.entries) {
            ScooterLanguage.current = language
            for (key in ScooterLanguage.En.strings.keys) {
                val kinds = specifier.findAll(key.replace("%%", "")).toList()
                if (kinds.isEmpty()) continue
                val arguments = kinds.mapIndexed { index, match ->
                    val at = match.groupValues[1].toIntOrNull()?.minus(1) ?: index
                    at to (if (match.groupValues[2] == "@") "‹${at + 1}›" else (at + 1) * 1_111_111L) as Any
                }.sortedBy { it.first }.map { it.second }
                val text = localized(key, *arguments.toTypedArray<Any>())
                for (argument in arguments.filterIsInstance<String>()) {
                    assertTrue("${language.rawValue}: $key → $text", text.contains(argument))
                }
                assertTrue("${language.rawValue}: $key → $text", !text.contains("%@") && !text.contains("%lld"))
            }
        }
    }

    @Test
    fun aStringsFileReadsItsEscapesCommentsAndBareKeys() {
        val strings = AppleStringsFile.parse(
            """
            /* A comment */
            "a" = "b \"quoted\" \\ back";
            // Another
            "new\nline" = "tab\there";
            "Hebrew \U05D0" = "\U2068x\U2069";
            "alone";
            bare_key = "bare value"; "after" /* in between */ = "it";
            """.trimIndent(),
        )
        assertEquals(
            mapOf(
                "a" to "b \"quoted\" \\ back",
                "new\nline" to "tab\there",
                "Hebrew א" to "⁨x⁩",
                "alone" to "alone",
                "bare_key" to "bare value",
                "after" to "it",
            ),
            strings,
        )
        assertThrows(IllegalStateException::class.java) { AppleStringsFile.parse("\"a\" = \"b\"") }
        assertThrows(IllegalStateException::class.java) { AppleStringsFile.parse("\"a\" = \"b;") }
        assertThrows(IllegalStateException::class.java) { AppleStringsFile.parse("/* open") }
    }

    @Test
    fun formatsAsFoundationDoes() {
        val swiss = Locale.forLanguageTag("de-CH")
        assertEquals("12345 · x", stringFormat("%lld · %@", 12_345, "x"))
        assertEquals("x 12345", stringFormat("%2\$@ %1\$lld", 12_345, "x"))
        assertEquals("82% · -5", stringFormat("%lld%% · %d", 82, -5))
        assertEquals(12_345.formatted(swiss) + " Scooter", stringFormat("%lld Scooter", 12_345, locale = swiss))
        assertEquals("12,345", stringFormat("%lld", 12_345L, locale = Locale.US))
        assertThrows(IllegalArgumentException::class.java) { stringFormat("%f", 1.5) }
        assertThrows(IllegalArgumentException::class.java) { stringFormat("%lld", "x") }
        assertThrows(IllegalArgumentException::class.java) { stringFormat("%@ %@", "x") }

        // Without arguments a sentence is as it is written, as String(format:) is then given it.
        ScooterLanguage.current = ScooterLanguage.De
        assertEquals("%lld%%", localized("%lld%%"))
        assertEquals("82%", localized("%lld%%", 82))
        assertEquals("Not a key %@", localized("Not a key %@"))
        assertEquals("Not a key 1", localized("Not a key %lld", 1))
    }

    @Test
    fun aSentenceAboutCountsTakesTheFormOfEachCount() {
        val format = ScooterCountingFormat(
            "%#@scooters@ in %#@cities@",
            mapOf(
                "scooters" to mapOf("zero" to "no scooter", "one" to "%lld scooter", "other" to "%lld scooters"),
                "cities" to mapOf("one" to "%lld city", "many" to "%lld cities (many)", "other" to "%lld cities"),
            ),
        )
        val english = Locale.US
        assertEquals("no scooter in 1 city", format.format(listOf(0, 1), english))
        assertEquals("1 scooter in 2 cities", format.format(listOf(1, 2), english))
        assertEquals("1,000,000 scooters in 1,000,000 cities", format.format(listOf(1_000_000, 1_000_000), english))
        assertEquals("1 000 000 scooters in 1 000 000 cities (many)", format.format(listOf(1_000_000, 1_000_000), Locale.FRANCE).replace(' ', ' '))

        // Zero is singular in French and in Portuguese as Brazil writes it, not as Portugal does.
        assertEquals("one", ScooterPluralRules.category(0, Locale.FRANCE))
        assertEquals("one", ScooterPluralRules.category(0, Locale.forLanguageTag("pt-BR")))
        assertEquals("other", ScooterPluralRules.category(0, Locale.forLanguageTag("pt-PT")))
        assertEquals("one", ScooterPluralRules.category(-21, Locale.forLanguageTag("is")))
        assertEquals("other", ScooterPluralRules.category(111, Locale.forLanguageTag("is")))
        assertEquals("one", ScooterPluralRules.category(1, Locale.forLanguageTag("nb")))
    }

    @Test
    fun aLanguageOtherThanTheLaunchOneKeepsThePhonesRegion() {
        val launch = ScooterLanguage.atLaunch
        val launchLocale = ScooterLanguage.launchLocale
        try {
            ScooterLanguage.atLaunch = ScooterLanguage.De
            ScooterLanguage.launchLocale = { Locale.forLanguageTag("de-CH-u-hc-h23") }
            assertEquals(Locale.forLanguageTag("de-CH-u-hc-h23"), ScooterLanguage.De.locale)
            assertEquals(Locale.forLanguageTag("fr-CH-u-hc-h23"), ScooterLanguage.Fr.locale)

            // Spanish says scooter where the phone's region is in Latin America or the US.
            ScooterLanguage.current = ScooterLanguage.Es
            ScooterLanguage.launchLocale = { Locale.forLanguageTag("en-MX") }
            assertEquals("Scooter de Lime", localized("%@ scooter", "Lime"))
            ScooterLanguage.launchLocale = { Locale.forLanguageTag("en-ES") }
            assertEquals("Patinete de Lime", localized("%@ scooter", "Lime"))
        } finally {
            ScooterLanguage.atLaunch = launch
            ScooterLanguage.launchLocale = launchLocale
        }
    }

    @Test
    fun aStringWithRightToLeftLettersIsSetApart() {
        assertEquals("Zürich", "Zürich".isolated)
        assertEquals("⁨תל אביב⁩", "תל אביב".isolated)
        assertEquals("⁨Dubai دبي⁩", "Dubai دبي".isolated)
    }
}
