package com.plhery.scootradar.core.model

import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

// ios/ScootRadarTests/ScooterModelsTests.swift. A test that reads a language's Bundle reads its
// ScooterStrings, which hold the same files.
class ScooterModelsTest {
    private val languages = listOf("en", "de", "fr", "it", "nl", "nb", "pt", "es", "is")

    private fun strings(language: String): ScooterStrings = ScooterLanguage.fromRawValue(language)!!.strings

    @After
    fun showTheLaunchLanguage() {
        ScooterLanguage.current = ScooterLanguage.atLaunch
    }

    @Test
    fun everyLanguageSaysWhenTheFadedScootersWereSeen() {
        for (language in languages) {
            val text = strings(language)["Updating · faded ones seen at %@"]
            assertNotNull(language, text)
            assertEquals("$language: $text", 2, text!!.split("%@").size)
            assertTrue("$language: $text", text.contains(" · "))
        }
    }

    @Test
    fun countLabelsHaveSingularAndPluralFormsForBothContexts() {
        assertEquals(localized("scooter nearby"), ScooterCountContext.Nearby.label(1))
        assertEquals(localized("scooters nearby"), ScooterCountContext.Nearby.label(22))
        assertEquals(localized("scooters nearby"), ScooterCountContext.Nearby.label(0))
        assertEquals(localized("scooter on this map"), ScooterCountContext.OnThisMap.label(1))
        assertEquals(localized("scooters on this map"), ScooterCountContext.OnThisMap.label(2))

        // French counts nothing in the singular: "0 trottinette à proximité".
        assertEquals(listOf(true, true, false), listOf(0, 1, 2).map { ScooterPlural.isSingular(it, "fr") })
        for (language in listOf("en", "de", "it", "pt", "es", "is")) {
            assertEquals(language, listOf(false, true, false), listOf(0, 1, 2).map { ScooterPlural.isSingular(it, language) })
        }
        // Icelandic counts 21, 31 and 101 in the singular, but not 11: "21 rafskúta".
        assertEquals(
            listOf(false, true, true, true, false),
            listOf(11, 21, 31, 101, 111).map { ScooterPlural.isSingular(it, "is") },
        )
        assertFalse(ScooterPlural.isSingular(21, "pt"))
        assertEquals(localized("scooter nearby"), ScooterCountContext.Nearby.label(0, "fr"))
        assertEquals(localized("scooter on this map"), ScooterCountContext.OnThisMap.label(0, "fr"))
        assertEquals(localized("scooters on this map"), ScooterCountContext.OnThisMap.label(2, "fr"))
        assertTrue(ScooterPlural.language in languages)
    }

    @Test
    fun theCoverageCardCountsEachCityOfTheCatalogsOnceAndTheirCountries() {
        val cities = ScooterCityCatalog.cities
        assertEquals(cities.size, ScooterCityCatalog.cityCount)
        assertEquals(cities.size, cities.map { it.id }.toSet().size)
        assertEquals(cities.map { it.countryCode }.toSet().size, ScooterCityCatalog.countryCount)
        assertTrue(cities.any { it.countryCode == "CH" })
        // Dott's one feed for Wołomin, Kobyłka and Radzymin counts three towns.
        for (id in listOf("pl:Wołomin", "pl:Kobyłka", "pl:Radzymin")) {
            assertEquals(id, 1, cities.count { it.id == id })
        }

        ScooterLanguage.current = ScooterLanguage.En
        // Over a thousand, the count takes the region's grouping: 1,005 or 1'005.
        val cityTotal = ScooterCityCatalog.cityCount.formatted(ScooterLanguage.current.locale)
        assertEquals(
            held("ScootRadar covers $cityTotal cities in ${ScooterCityCatalog.countryCount} countries."),
            ScooterCoverageSummary.text(),
        )
    }

    /** A sentence as written here, each count held to its noun by a no-break space. */
    private fun held(sentence: String): String = sentence.replace(Regex("(\\d) "), "$1\u00A0")

    @Test
    fun theCoverageSentenceGivesEachCountItsOwnFormInEveryLanguage() {
        val sentences = mapOf(
            ScooterLanguage.En to ("ScootRadar covers 186 cities in 17 countries." to "ScootRadar covers 1 city in 1 country."),
            ScooterLanguage.De to ("ScootRadar deckt 186 Städte in 17 Ländern ab." to "ScootRadar deckt 1 Stadt in 1 Land ab."),
            ScooterLanguage.Fr to ("ScootRadar couvre 186 villes dans 17 pays." to "ScootRadar couvre 1 ville dans 1 pays."),
            ScooterLanguage.It to ("ScootRadar copre 186 città in 17 paesi." to "ScootRadar copre 1 città in 1 paese."),
            ScooterLanguage.Nl to ("ScootRadar werkt in 186 steden in 17 landen." to "ScootRadar werkt in 1 stad in 1 land."),
            ScooterLanguage.Nb to ("ScootRadar dekker 186 byer i 17 land." to "ScootRadar dekker 1 by i 1 land."),
            ScooterLanguage.Pt to ("O ScootRadar abrange 186 cidades em 17 países." to "O ScootRadar abrange 1 cidade em 1 país."),
            ScooterLanguage.Es to ("ScootRadar cubre 186 ciudades en 17 países." to "ScootRadar cubre 1 ciudad en 1 país."),
            ScooterLanguage.Is to ("ScootRadar nær yfir 186 staði í 17 löndum." to "ScootRadar nær yfir 1 stað í 1 landi."),
        )
        assertEquals(ScooterLanguage.entries.toSet(), sentences.keys)
        for ((language, sentence) in sentences) {
            ScooterLanguage.current = language
            assertEquals(language.rawValue, held(sentence.first), ScooterCoverageSummary.text(cities = 186, countries = 17))
            assertEquals(language.rawValue, held(sentence.second), ScooterCoverageSummary.text(cities = 1, countries = 1))
        }

        // Icelandic counts 21 in the singular, but not 11 or 22, and each count picks its own form.
        ScooterLanguage.current = ScooterLanguage.Is
        assertEquals(held("ScootRadar nær yfir 21 stað í 21 landi."), ScooterCoverageSummary.text(cities = 21, countries = 21))
        assertEquals(held("ScootRadar nær yfir 22 staði í 22 löndum."), ScooterCoverageSummary.text(cities = 22, countries = 22))
        assertEquals(held("ScootRadar nær yfir 11 staði í 11 löndum."), ScooterCoverageSummary.text(cities = 11, countries = 11))
        assertEquals(held("ScootRadar nær yfir 186 staði í 21 landi."), ScooterCoverageSummary.text(cities = 186, countries = 21))
        assertEquals(held("ScootRadar nær yfir 21 stað í 17 löndum."), ScooterCoverageSummary.text(cities = 21, countries = 17))
        ScooterLanguage.current = ScooterLanguage.En
        assertEquals(held("ScootRadar covers 21 cities in 21 countries."), ScooterCoverageSummary.text(cities = 21, countries = 21))
    }

    @Test
    fun theCoverageSentenceKeepsEachCountOnTheLineOfItsNounInEveryLanguage() {
        val held = Regex("\\d\u00A0\\p{L}")
        val counts = listOf(
            ScooterCityCatalog.cityCount to ScooterCityCatalog.countryCount,
            1 to 1,
            21 to 22,
            1200 to 17,
        )
        for (language in ScooterLanguage.entries) {
            ScooterLanguage.current = language
            for ((cities, countries) in counts) {
                val sentence = ScooterCoverageSummary.text(cities, countries)
                assertNull("${language.rawValue}: $sentence", Regex("\\d ").find(sentence))
                assertEquals("${language.rawValue}: $sentence", 2, held.findAll(sentence).count())
            }
        }
    }

    @Test
    fun percentagesAndTheShownStateReadAsOnTheWeb() {
        for (language in languages) {
            // "82%" and "Akku ab 60%", like the presets "60%+" beside them.
            assertEquals(language, "%lld%%", strings(language)["%lld%%"])
            val summary = strings(language)["battery %lld%% or more"]!!
            assertTrue("$language: $summary", summary.contains("%lld%%"))
            assertFalse("$language: $summary", summary.contains(" %%"))
        }
        assertEquals("Eingeblendet", strings("de")["Shown"])
        assertEquals("Ausgeblendet", strings("de")["Hidden"])
    }

    @Test
    fun settingsListTheLanguagesByTheirOwnNamesAndNameThemInTheLanguageShown() {
        assertEquals(
            listOf("Deutsch", "English", "Español", "Français", "Íslenska", "Italiano", "Nederlands", "Norsk", "Português"),
            ScooterLanguage.byName.map { it.displayName },
        )
        assertEquals(ScooterLanguage.entries.toSet(), ScooterLanguage.byName.toSet())

        assertEquals("Allemand", ScooterLanguage.De.nameIn(ScooterLanguage.Fr))
        assertEquals("Tedesco", ScooterLanguage.De.nameIn(ScooterLanguage.It))
        assertEquals("Icelandic", ScooterLanguage.Is.nameIn(ScooterLanguage.En))
        assertEquals("IJslands", ScooterLanguage.Is.nameIn(ScooterLanguage.Nl))
        assertEquals("Norwegian", ScooterLanguage.Nb.nameIn(ScooterLanguage.En))
        assertEquals("Enska", ScooterLanguage.En.nameIn(ScooterLanguage.Is))
        // A language shown in itself has no second name.
        for (language in ScooterLanguage.entries) {
            assertNull(language.rawValue, language.nameIn(language))
        }
    }

    @Test
    fun automaticPicksTheFirstOfThePhonesLanguagesTheAppIsTranslatedInto() {
        assertEquals(ScooterLanguage.De, ScooterLanguage.fromPreferences(listOf("ja-JP", "de-CH", "fr-CH")))
        assertEquals(ScooterLanguage.Pt, ScooterLanguage.fromPreferences(listOf("pt-BR")))
        assertEquals(ScooterLanguage.Es, ScooterLanguage.fromPreferences(listOf("es-419")))
        assertEquals(ScooterLanguage.Nb, ScooterLanguage.fromPreferences(listOf("nb-NO", "en")))
        assertEquals(ScooterLanguage.Is, ScooterLanguage.fromPreferences(listOf("is-IS")))
        assertEquals(ScooterLanguage.En, ScooterLanguage.fromPreferences(listOf("ja-JP", "zh-Hans-CN")))
        assertEquals(ScooterLanguage.En, ScooterLanguage.fromPreferences(emptyList()))
        // Android names Norwegian "no" or Nynorsk where iOS says Bokmål (PLAN.md §10).
        assertEquals(ScooterLanguage.Nb, ScooterLanguage.fromPreferences(listOf("no-NO")))
        assertEquals(ScooterLanguage.Nb, ScooterLanguage.fromPreferences(listOf("nn-NO")))
        assertEquals(ScooterLanguage.Fr, ScooterLanguage.fromLocalizations(listOf("fr-CH", "de")))
        assertEquals(ScooterLanguage.En, ScooterLanguage.fromLocalizations(listOf("ja")))

        // The app follows the phone until a language is chosen for it, in its Settings or Android's.
        assertEquals(ScooterLanguageChoice.Automatic, ScooterLanguageChoice.of(emptyList(), shown = ScooterLanguage.De))
        assertEquals(
            ScooterLanguageChoice.Language(ScooterLanguage.Fr),
            ScooterLanguageChoice.of(listOf("fr"), shown = ScooterLanguage.Fr),
        )
    }

    @Test
    fun everyLanguageWritesTheLanguageChoices() {
        val keys = listOf(
            "Automatic (language)",
            "%@, the language of your iPhone",
            "Follows your iPhone’s language, if you change it there.",
        )
        for (language in ScooterLanguage.entries) {
            for (key in keys) {
                val text = language.strings[key]
                assertNotNull("${language.rawValue}: $key", text)
                assertEquals("${language.rawValue}: $text", key.contains("%@"), text!!.contains("%@"))
            }
        }
        // Italian says Automatico of the appearance, Automatica of the language: "lingua" is feminine.
        assertEquals("Automatico", strings("it")["Automatic"])
        assertEquals("Automatica", strings("it")["Automatic (language)"])
    }

    @Test
    fun frenchAndItalianNameTheOperatorWithOneWordAndFrenchShowsNothingInTheSingular() {
        val pricing = "Pricing can vary. Confirm the final price and pass eligibility in the provider app before riding."

        assertEquals("Afficher 0 trottinette", strings("fr")["Show 0 scooters"])
        assertEquals("Mostra 0 monopattini", strings("it")["Show 0 scooters"])
        assertTrue(strings("fr")[pricing]!!.contains("l’app de l’opérateur"))
        assertTrue(strings("it")[pricing]!!.contains("nell’app dell’operatore"))
    }

    // Spanish as Mexico, the US and the rest of Latin America write it.

    @Test
    fun spanishSaysScooterInLatinAmericaAndTheUS() {
        for (region in listOf("MX", "US", "419", "AR", "CO", "PR")) {
            assertTrue(region, ScooterLanguage.Es.saysScooter(region))
        }
        assertFalse(ScooterLanguage.Es.saysScooter("ES"))
        assertFalse(ScooterLanguage.Es.saysScooter("CH"))
        assertFalse(ScooterLanguage.Es.saysScooter(null as String?))
        assertFalse(ScooterLanguage.En.saysScooter("US"))
        assertFalse(ScooterLanguage.Pt.saysScooter("BR"))

        assertEquals("Scooter de %@", ScooterLanguage.Es.written("Patinete de %@", "MX"))
        assertEquals("Patinete de %@", ScooterLanguage.Es.written("Patinete de %@", "ES"))
        assertEquals(
            "Acerca el mapa para mostrar cada scooter",
            ScooterLanguage.Es.written("Acerca el mapa para mostrar cada patinete", "US"),
        )
    }

    @Test
    fun latinAmericanSpanishLeavesNoPatineteInTheApp() {
        val spanish = ScooterLanguage.Es.strings
        val sentences = spanish.keys.map { spanish[it]!! }
        assertFalse(sentences.none { it.contains("patinete", ignoreCase = true) })
        for (sentence in sentences) {
            val written = ScooterLanguage.Es.written(sentence, "MX")
            assertFalse(written, written.contains("patinete", ignoreCase = true))
            // Nothing but the word changes.
            assertEquals(
                sentence.replace("Scooter", "Patinete").replace("scooter", "patinete"),
                written.replace("Scooter", "Patinete").replace("scooter", "patinete"),
            )
        }
    }
}
