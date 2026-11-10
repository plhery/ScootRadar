package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.api.ScooterAPIJson
import com.plhery.scootradar.core.api.ScooterLoadFailure
import com.plhery.scootradar.core.generated.ScooterAPIResponsePayload
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.generated.ScooterResponseMetadataPayload
import com.plhery.scootradar.core.generated.ScooterVehiclePayload
import com.plhery.scootradar.core.map.TestCatalog
import com.plhery.scootradar.core.map.ScooterDeviceOrientation
import com.plhery.scootradar.core.map.ScooterHeadingPolicy
import com.plhery.scootradar.core.map.ScooterInterfaceOrientation
import com.plhery.scootradar.core.map.StubScooterAPI
import com.plhery.scootradar.core.map.makeController
import com.plhery.scootradar.core.map.unwrap
import java.net.URI
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.ZoneOffset
import java.util.Locale
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Test

// ios/ScootRadarTests/ScooterModelsTests.swift. A test that reads a language's Bundle reads its
// ScooterStrings, which hold the same files.
class ScooterModelsTest {
    private val languages = listOf("en", "de", "fr", "it", "nl", "nb", "pt", "es", "is")

    private fun strings(language: String): ScooterStrings = ScooterLanguage.fromRawValue(language)!!.strings

    private val launchLocale = ScooterLanguage.launchLocale
    private val timeZone = ScooterDateFormat.timeZone

    /** The phone's locale and zone, the same whatever the host's. */
    @Before
    fun pinTheLocaleAndTheZone() {
        ScooterLanguage.launchLocale = { Locale.US }
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
    }

    @After
    fun showTheLaunchLanguage() {
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        ScooterDateFormat.timeZone = timeZone
    }

    /** The card's name: the catalog's for a provider it knows, the feed's word capitalized for one it doesn't. */
    @Test
    fun aScootersProviderNameIsTheCatalogsOrTheFeedsCapitalized() {
        assertEquals("Lime", Scooter(provider = "lime", latitude = 47.0, longitude = 8.0).providerName)
        assertEquals("PubliBike / Velospot", Scooter(provider = "publibike", latitude = 47.0, longitude = 8.0).providerName)
        assertEquals("Zoom_Scoot", Scooter(provider = "zoom_SCOOT", latitude = 47.0, longitude = 8.0).providerName)
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
        assertNotEquals(ScooterDockHint.TapCity.text, ScooterDockHint.EmptyArea.text)

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
        // Switzerland's open data, where ScootRadar began, is in the catalog for good.
        assertTrue(cities.any { it.countryCode == "CH" })
        // A feed run over several towns counts each of them, as Dott's one for Wołomin, Kobyłka and Radzymin counts
        // three. Which feeds do is data/'s to change (LOG-370); that some do is not, with 97 on 28 October 2026.
        val towns = cities.flatMap { city -> city.feeds.map { it.id to city.id } }
            .groupBy({ it.first }, { it.second }).values.map { it.distinct() }.filter { it.size > 1 }
        assertTrue(towns.isNotEmpty())
        for (ids in towns) for (id in ids) assertEquals(id, 1, cities.count { it.id == id })

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
            // "82%", as the web writes it.
            assertEquals(language, "%lld%%", strings(language)["%lld%%"])
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
    fun theIPhonesLanguagesStayTheIPhonesOnceTheAppHasOneOfItsOwn() = runTest {
        // Automatic says "English, the language of your phone" after French
        // was chosen for the app, not "Français": Locale.getDefault() would
        // give the app's. The phone's languages are the system's, which a
        // language kept for the app, in its own locales, leaves as they are.
        val systemLanguages = listOf("en-GB", "de-CH")
        var appLanguages = emptyList<String>()
        // What Locale.getDefault() and LocaleList.getDefault() follow.
        fun preferredLanguages(): List<String> = appLanguages.ifEmpty { systemLanguages }
        val model = makeController(
            StubScooterAPI(ScooterResponse(vehicles = emptyList())),
            phoneLanguages = { systemLanguages },
            keepAppLanguages = { appLanguages = it },
        )
        val phone = model.phoneLanguage
        val chosen = if (systemLanguages.first().startsWith("is")) ScooterLanguage.Nl else ScooterLanguage.Is
        model.setLanguageChoice(ScooterLanguageChoice.Language(chosen))

        assertEquals(chosen.rawValue, preferredLanguages().first())
        assertEquals(phone, model.phoneLanguage)
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
        // Italian says Auto of the appearance, whose tile is narrow, and Automatica of the language: "lingua" is feminine.
        assertEquals("Auto", strings("it")["Automatic"])
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

    // Scooters, their prices and their links, as the server sends them.

    @Test
    fun frenchPonyScooterKeepsItsProviderEuroPricingAndRentalLink() {
        val json = """
        {
          "provider": "pony",
          "lat": 47.4784,
          "lng": -0.5632,
          "battery": 75,
          "range_m": 32620,
          "vehicle_id": "pony_fr_angers:vehicle-1",
          "deep_link": null,
          "rental_uris": {
            "ios": "https://getapony.com/app/scan",
            "android": "https://getapony.com/app/scan",
            "web": null
          },
          "pricing": {
            "currency": "EUR",
            "unlock_fee_minor_units": 100,
            "minute_fee_minor_units": 26
          },
          "distance_m": null
        }
        """
        val scooter = ScooterAPIJson.decodeFromString<ScooterVehiclePayload>(json).model
        assertEquals(ScooterProvider.Pony, scooter.providerInfo)
        assertEquals(47.4784, scooter.coordinate.latitude, 0.0)
        assertEquals(-0.5632, scooter.coordinate.longitude, 0.0)
        assertEquals("EUR", scooter.pricing?.currency)
        assertEquals(false, scooter.pricing?.plusTax)
        assertEquals("https://getapony.com/app/scan", scooter.rentalURL?.toString())
    }

    @Test
    fun aPriceTaxIsAddedToSaysSo() {
        // Veo in New York: USD 1 to unlock and USD 0.42 a minute, before sales tax.
        val json = """
        {
          "provider": "lime", "lat": 40.7128, "lng": -74.006, "battery": 75, "range_m": null,
          "vehicle_id": "veo-1", "deep_link": null, "rental_uris": null, "distance_m": null,
          "pricing": { "currency": "USD", "unlock_fee_minor_units": 100, "minute_fee_minor_units": 42, "plus_tax": true }
        }
        """
        val pricing = ScooterAPIJson.decodeFromString<ScooterVehiclePayload>(json).model.pricing!!
        assertEquals(ScooterRidePricing(currency = "USD", unlockFeeMinorUnits = 100, minuteFeeMinorUnits = 42, plusTax = true), pricing)
        assertTrue(RidePriceEstimator.quote(pricing = pricing, durationMinutes = 10).plusTax)
    }

    @Test
    fun aPriceCopiedFromAPriceListKeepsTheDayItWasChecked() {
        // Lime in Chicago publishes no price in its feed: USD 1 to unlock and USD 0.39 a minute on its site.
        fun pricing(listedOn: String): ScooterRidePricing? = ScooterAPIJson.decodeFromString<ScooterVehiclePayload>(
            """
            {
              "provider": "lime", "lat": 41.88, "lng": -87.63, "battery": null, "range_m": null,
              "vehicle_id": "lime-1", "deep_link": null, "rental_uris": null, "distance_m": null,
              "pricing": { "currency": "USD", "unlock_fee_minor_units": 100, "minute_fee_minor_units": 39,
                           "plus_tax": true, "listed_on": "$listedOn" }
            }
            """,
        ).model.pricing
        assertEquals(
            ScooterRidePricing(
                currency = "USD",
                unlockFeeMinorUnits = 100,
                minuteFeeMinorUnits = 39,
                plusTax = true,
                listedOn = "2026-10-18",
            ),
            pricing(listedOn = "2026-10-18"),
        )
        // A day it can't read is left out, and the price kept.
        assertNull(pricing(listedOn = "soon")?.listedOn)
        assertEquals(39, pricing(listedOn = "soon")?.minuteFeeMinorUnits)
    }

    @Test
    fun aMinuteFeeGivenAsARangeKeepsItsLowestAndSaysFrom() {
        // Lime in New York: USD 1 to unlock, then USD 0.45 to 0.50 a minute.
        val json = """
        {
          "provider": "lime", "lat": 40.85, "lng": -73.87, "battery": null, "range_m": null,
          "vehicle_id": "lime-1", "deep_link": null, "rental_uris": null, "distance_m": null,
          "pricing": { "currency": "USD", "unlock_fee_minor_units": 100, "minute_fee_minor_units": 45,
                       "minute_fee_from": true, "plus_tax": true, "listed_on": "2026-10-18" }
        }
        """
        val pricing = ScooterAPIJson.decodeFromString<ScooterVehiclePayload>(json).model.pricing!!
        assertTrue(pricing.minuteFeeFrom)
        assertEquals(45, pricing.minuteFeeMinorUnits)
        val quote = RidePriceEstimator.quote(pricing = pricing, durationMinutes = 10)
        assertEquals(550, quote.totalMinorUnits)
        assertTrue(quote.minuteFeeFrom)
        assertFalse(
            RidePriceEstimator.quote(
                pricing = ScooterRidePricing(currency = "CHF", unlockFeeMinorUnits = 100, minuteFeeMinorUnits = 35),
                durationMinutes = 10,
            ).minuteFeeFrom,
        )
    }

    @Test
    fun decodingAndStableProviderIdentity() {
        val json = """
        {
          "vehicles": [{
            "provider": "lime",
            "lat": 47.3769,
            "lng": 8.5417,
            "battery": 82,
            "range_m": 12345,
            "vehicle_id": "abc-123",
            "deep_link": "https://lime.bike/vehicle/abc-123",
            "rental_uris": {
              "ios": "limebike://vehicle/abc-123",
              "android": "https://lime.bike/vehicle/abc-123?platform=android",
              "web": "https://lime.bike/vehicle/abc-123"
            },
            "pricing": {
              "currency": "CHF",
              "unlock_fee_minor_units": 100,
              "minute_fee_minor_units": 42
            },
            "distance_m": 250.5
          }],
          "clusters": [],
          "providers": {"lime": 1},
          "meta": {
            "partial": false,
            "stale": false,
            "failedSources": [],
            "sources": {"national": "fresh", "hopp": "fresh"},
            "generatedAt": "2026-08-05T12:00:00.000Z",
            "truncated": false,
            "totalVehicles": 1,
            "mode": "vehicles",
            "zoom": null
          }
        }
        """

        val response = ScooterAPIJson.decodeFromString<ScooterAPIResponsePayload>(json).model
        val scooter = response.vehicles.first()

        assertEquals("lime:abc-123", scooter.id)
        assertEquals(ScooterProvider.Lime, scooter.providerInfo)
        assertEquals(82, scooter.battery)
        assertEquals(12_345, scooter.rangeMeters)
        assertEquals("https://lime.bike/vehicle/abc-123", scooter.deepLink)
        // The link the feed gives Android phones, as the web opens there.
        assertEquals("https://lime.bike/vehicle/abc-123?platform=android", scooter.rentalURL?.toString())
        assertEquals(
            ScooterRidePricing(
                currency = "CHF",
                unlockFeeMinorUnits = 100,
                minuteFeeMinorUnits = 42,
            ),
            scooter.pricing,
        )
    }

    /**
     * The range of a full battery, in metres, for each provider of the answer whose scooters may give only their
     * battery: what the minimum range reads such a scooter by. An answer from before it, or without one, has none.
     */
    @Test
    fun theFullBatterysRangesDecodeAndAnOlderAnswerHasNone() {
        val response = ScooterAPIJson.decodeFromString<ScooterAPIResponsePayload>(
            """
            {"vehicles": [], "clusters": [], "providers": {}, "batteryRanges": {"lime": 11500, "bolt": 29400},
             "meta": {"partial": false, "stale": false, "failedSources": [], "sources": {},
             "generatedAt": "2026-11-09T10:00:00.000Z", "truncated": false, "totalVehicles": 0, "mode": "vehicles"}}
            """,
        ).model
        assertEquals(mapOf("lime" to 11_500, "bolt" to 29_400), response.batteryRanges)

        val older = ScooterAPIJson.decodeFromString<ScooterAPIResponsePayload>(
            """
            {"vehicles": [], "clusters": [], "providers": {}, "meta": {"partial": false, "stale": false,
             "failedSources": [], "sources": {}, "generatedAt": "2026-11-09T10:00:00.000Z",
             "truncated": false, "totalVehicles": 0, "mode": "vehicles"}}
            """,
        ).model
        assertEquals(emptyMap<String, Int>(), older.batteryRanges)
    }

    @Test
    fun scootersLastSeenDecodeAsTheOthersApart() {
        val json = """
        {
          "vehicles": [],
          "clusters": [],
          "lastSeen": {
            "vehicles": [{"provider": "lime", "lat": 47.3769, "lng": 8.5417, "battery": 64, "vehicle_id": "seen-1"}],
            "clusters": [
              {"id": "seen:13:4290:2868", "lat": 47.38, "lng": 8.54, "count": 9, "providers": {"lime": 9}},
              {"id": "seen:13:4291:2868", "lat": 47.39, "lng": 8.56, "count": 3, "city": "Zürich", "providers": {"bird": 2, "voi": 1}}
            ],
            "providers": {
              "lime": {"seenAt": "2026-10-25T09:40:00.000Z", "updating": true},
              "bird": {"seenAt": "2026-10-25T09:58:00.000Z", "updating": false}
            }
          },
          "providers": {},
          "meta": {
            "partial": false, "stale": false, "failedSources": [], "sources": {},
            "generatedAt": "2026-10-25T10:02:00.000Z", "refreshing": true, "lastSeenAt": "2026-10-25T09:40:00.000Z",
            "truncated": false, "totalVehicles": 0, "mode": "clusters", "zoom": 13
          }
        }
        """

        val response = ScooterAPIJson.decodeFromString<ScooterAPIResponsePayload>(json).model

        assertTrue(response.vehicles.isEmpty())
        assertTrue(response.clusters.isEmpty())
        assertEquals(listOf("lime:seen-1"), response.lastSeenVehicles.map { it.id })
        assertEquals(64, response.lastSeenVehicles.firstOrNull()?.battery)
        assertEquals(
            listOf(
                ScooterCluster(id = "seen:13:4290:2868", latitude = 47.38, longitude = 8.54, count = 9, providers = mapOf("lime" to 9)),
                ScooterCluster(
                    id = "seen:13:4291:2868", latitude = 47.39, longitude = 8.56, count = 3,
                    providers = mapOf("bird" to 2, "voi" to 1), city = "Zürich",
                ),
            ),
            response.lastSeenClusters,
        )
        assertEquals("2026-10-25T09:40:00.000Z", response.meta?.lastSeenAt)
        // Each app's time and whether new positions of its are on their way.
        assertEquals(
            mapOf(
                "lime" to ScooterLastSeenProvider(seenAt = "2026-10-25T09:40:00.000Z", updating = true),
                "bird" to ScooterLastSeenProvider(seenAt = "2026-10-25T09:58:00.000Z", updating = false),
            ),
            response.lastSeenProviders,
        )

        // Without them, as from a server that sends none.
        val plain = ScooterAPIJson.decodeFromString<ScooterAPIResponsePayload>(
            """
            {"vehicles": [], "clusters": [], "providers": {}, "meta": {"partial": false, "stale": false,
             "failedSources": [], "sources": {}, "generatedAt": "2026-10-25T10:02:00.000Z",
             "truncated": false, "totalVehicles": 0, "mode": "vehicles"}}
            """,
        ).model
        assertTrue(plain.lastSeenVehicles.isEmpty())
        assertTrue(plain.lastSeenClusters.isEmpty())
        assertNull(plain.meta?.lastSeenAt)
        assertNull(plain.lastSeenProviders)
        // Nor an overview, a refresh under way or a season over.
        val meta = checkNotNull(plain.meta)
        assertFalse(meta.overview)
        assertFalse(meta.refreshing)
        assertTrue(meta.seasonOver.isEmpty())
    }

    @Test
    fun coordinateIdentityIsUsedWhenVehicleIDIsMissing() {
        val scooter = makeScooter(provider = "bird", latitude = 47.1, longitude = 8.2, vehicleID = null)
        assertEquals("bird:47.1:8.2", scooter.id)
    }

    @Test
    fun vehiclePricingIsOptionalAndMalformedPricingIsDiscarded() {
        val missingPricingData = """
        {
          "provider": "bird",
          "lat": 47.1,
          "lng": 8.2,
          "battery": null,
          "range_m": null,
          "vehicle_id": "without-pricing",
          "deep_link": null,
          "distance_m": null
        }
        """
        val malformedPricingData = """
        {
          "provider": "lime",
          "lat": 47.1,
          "lng": 8.2,
          "battery": null,
          "range_m": null,
          "vehicle_id": "bad-pricing",
          "deep_link": null,
          "pricing": {
            "currency": "CHF",
            "unlock_fee_minor_units": -1,
            "minute_fee_minor_units": 42
          },
          "distance_m": null
        }
        """

        val missingPricing = ScooterAPIJson.decodeFromString<ScooterVehiclePayload>(missingPricingData).model
        val malformedPricing = ScooterAPIJson.decodeFromString<ScooterVehiclePayload>(malformedPricingData).model

        assertNull(missingPricing.pricing)
        assertNull(malformedPricing.pricing)
    }

    @Test
    fun distanceUsesCoordinatesRatherThanServerDistance() {
        val scooter = makeScooter(
            provider = "bolt",
            latitude = 47.3779,
            longitude = 8.5417,
            vehicleID = "nearby",
            serverDistance = 50_000.0,
        )

        val distance = scooter.distance(from = GeoPoint(latitude = 47.3769, longitude = 8.5417))

        assertEquals(111.2, distance, 1.5)
        assertEquals(
            Scooter.formattedLength(meters = distance),
            scooter.formattedDistance(from = GeoPoint(latitude = 47.3769, longitude = 8.5417)),
        )
        assertEquals(
            "${Math.round(distance)} m",
            plainSpaces(Scooter.formattedLength(meters = distance, locale = Locale.forLanguageTag("en-CH"))),
        )
    }

    @Test
    fun rangeFormattingOnlyExistsWhenRangeIsProvided() {
        assertNotNull(makeScooter(rangeMeters = 1_500).formattedRange)
        assertNull(makeScooter(rangeMeters = null).formattedRange)
    }

    /**
     * The same scooter reads the same on the web and here: whole metres below a kilometre, then kilometres
     * with at most one decimal. No rounding to 50 m.
     */
    @Test
    fun lengthsAreWrittenAsOnTheWeb() {
        val swiss = Locale.forLanguageTag("en-CH")
        val expectations = listOf(
            51 to "51 m", 320 to "320 m", 337 to "337 m", 951 to "951 m",
            1_000 to "1 km", 1_250 to "1.3 km", 1_449 to "1.4 km",
            12_400 to "12.4 km", 24_000 to "24 km",
        )
        for ((meters, text) in expectations) {
            val length = Scooter.formattedLength(meters = meters.toDouble(), locale = swiss)
            assertEquals("$meters m", text, plainSpaces(length))
            // A line never breaks between the number and its unit.
            assertFalse(length, length.contains(" "))
        }
        val range = makeScooter(rangeMeters = 1_250).formattedRange
        assertEquals(Scooter.formattedLength(meters = 1_250.0), range)
    }

    /**
     * Feet or yards under half a mile and miles from there where the region measures in miles, rounded as
     * the iPhone rounds lengths on roads; the web's src/lib/walking.test.ts expects the same.
     */
    @Test
    fun lengthsAreInMilesWhereTheRegionMeasuresInMiles() {
        val american = Locale.US
        val british = Locale.UK
        val expectations = listOf(
            Triple(2.0, "7 ft", "2 yd"), Triple(12.0, "40 ft", "10 yd"), Triple(80.0, "250 ft", "90 yd"),
            Triple(100.0, "350 ft", "100 yd"), Triple(300.0, "1,000 ft", "350 yd"), Triple(800.0, "2,600 ft", "850 yd"),
            Triple(805.0, "0.5 mi", "0.5 mi"), Triple(1_000.0, "0.62 mi", "0.62 mi"), Triple(3_000.0, "1.9 mi", "1.9 mi"),
            Triple(14_000.0, "8.7 mi", "8.7 mi"), Triple(61_000.0, "38 mi", "38 mi"),
        )
        for ((meters, us, uk) in expectations) {
            assertEquals("$meters m", us, plainSpaces(Scooter.formattedLength(meters = meters, locale = american)))
            assertEquals("$meters m", uk, plainSpaces(Scooter.formattedLength(meters = meters, locale = british)))
        }
        val parts = Scooter.lengthParts(meters = 300.0, locale = american)
        assertEquals("1,000", parts.first)
        assertEquals("ft", parts.second)
        assertFalse(Scooter.formattedLength(meters = 300.0, locale = american).contains(" "))
        // French puts a narrow no-break space before the unit; the figure still splits from it.
        for ((meters, value, unit) in listOf(Triple(300.0, "300", "m"), Triple(1_300.0, "1,3", "km"), Triple(61_000.0, "61", "km"))) {
            val french = Scooter.lengthParts(meters = meters, locale = Locale.forLanguageTag("fr-FR"))
            assertEquals("$meters m", value, french.first)
            assertEquals("$meters m", unit, french.second)
        }
    }

    /**
     * The card's figure sets its unit smaller than its number at whatever space the locale writes between them:
     * French writes a narrow no-break space ("24 m", U+202F), which read "24m" as one figure when only U+00A0 split it
     * (app-ar). A space inside the number, grouping its digits, stays in it, as does Swiss German's apostrophe.
     */
    @Test
    fun aLengthsUnitIsApartFromItsNumberAtTheSpaceTheLocaleWrites() {
        val expectations = listOf(
            Triple("fr-CH", 24.0, "24" to "m"), Triple("fr-CH", 26_800.0, "26,8" to "km"),
            Triple("fr-CH", 1_234_000.0, "1\u202F234" to "km"),
            Triple("fr-FR", 117.0, "117" to "m"), Triple("fr-FR", 1_234_000.0, "1\u202F234" to "km"),
            Triple("de-CH", 24.0, "24" to "m"), Triple("de-CH", 1_234_000.0, "1\u2019234" to "km"),
            Triple("en-US", 24.0, "80" to "ft"), Triple("en-US", 300.0, "1,000" to "ft"), Triple("en-US", 3_000.0, "1.9" to "mi"),
            Triple("nb-NO", 24.0, "24" to "m"), Triple("nb-NO", 1_234_000.0, "1\u00A0234" to "km"),
        )
        for ((tag, meters, parts) in expectations) {
            assertEquals("$tag $meters", parts, Scooter.lengthParts(meters = meters, locale = Locale.forLanguageTag(tag)))
        }

        // A thin space parts them too; a unit written before its number, or with no space, keeps the length whole.
        val length = ScooterMeasureFormat.length
        val swiss = Locale.forLanguageTag("en-CH")
        try {
            ScooterMeasureFormat.length = { value, _, _ -> "${value.toPlainString()}\u2009m" }
            assertEquals("24" to "m", Scooter.lengthParts(meters = 24.0, locale = swiss))
            ScooterMeasureFormat.length = { value, _, _ -> "m\u00A0${value.toPlainString()}" }
            assertEquals("m\u00A024" to null, Scooter.lengthParts(meters = 24.0, locale = swiss))
            ScooterMeasureFormat.length = { value, _, _ -> "${value.toPlainString()}m" }
            assertEquals("24m" to null, Scooter.lengthParts(meters = 24.0, locale = swiss))
        } finally {
            ScooterMeasureFormat.length = length
        }
    }

    @Test
    fun theMapShowsItsScaleWhereTheRegionMeasuresInMiles() {
        assertTrue(ScooterMapScalePolicy.showsScale(locale = Locale.forLanguageTag("en-US")))
        assertTrue(ScooterMapScalePolicy.showsScale(locale = Locale.forLanguageTag("en-GB")))
        assertFalse(ScooterMapScalePolicy.showsScale(locale = Locale.forLanguageTag("en-CH")))
        assertFalse(ScooterMapScalePolicy.showsScale(locale = Locale.forLanguageTag("fr-CA")))
        assertFalse(ScooterMapScalePolicy.showsScale(locale = Locale.forLanguageTag("es-MX")))
        // The units chosen in Settings, whatever the region: the app draws the scale in its own feet and miles.
        val swiss = Locale.forLanguageTag("de-CH")
        val american = Locale.forLanguageTag("en-US")
        assertTrue(ScooterMapScalePolicy.showsScale(locale = ScooterUnits.Imperial.applied(swiss)))
        assertFalse(ScooterMapScalePolicy.showsScale(locale = ScooterUnits.Metric.applied(american)))
        assertTrue(ScooterMapScalePolicy.showsScale(locale = ScooterUnits.Automatic.applied(Locale.forLanguageTag("en-GB"))))
    }

    // Settings › Units (issue #14): kilometres or miles whatever the region and the language.

    @Test
    fun chosenUnitsMeasureInKilometresOrMilesWhateverTheRegion() {
        val swiss = Locale.forLanguageTag("de-CH")
        val irish = Locale.forLanguageTag("en-IE")
        val british = Locale.forLanguageTag("en-GB")
        val american = Locale.forLanguageTag("en-US")

        // Automatic keeps the region's own, the locale as it is.
        for (locale in listOf(swiss, irish, british, american)) {
            assertEquals(locale, ScooterUnits.Automatic.applied(locale))
        }
        assertNull(ScooterUnits.Automatic.measurementSystem(ScooterMeasurementSystem.Uk))

        // Kilometres, in Britain and the US too.
        for (locale in listOf(swiss, irish, british, american)) {
            val metric = ScooterUnits.Metric.applied(locale)
            assertEquals(locale.toLanguageTag(), ScooterMeasurementSystem.Metric, metric.measurementSystem)
            assertEquals(locale.language, metric.language)
            assertEquals(locale.country, metric.country)
            assertEquals(ScooterRangeFilter.Unit.Kilometres, ScooterRangeFilter.Unit.of(metric))
            assertEquals(locale.toLanguageTag(), "300 m", plainSpaces(Scooter.formattedLength(meters = 300.0, locale = metric)))
            val kilometres = plainSpaces(Scooter.formattedLength(meters = 1_250.0, locale = metric))
            assertTrue(kilometres, kilometres == "1.3 km" || kilometres == "1,3 km")
        }
        // Metric in Britain is spelt as Britain writes it otherwise.
        assertEquals("1.3 km", plainSpaces(Scooter.formattedLength(meters = 1_250.0, locale = ScooterUnits.Metric.applied(british))))
        assertEquals("1.3 km", plainSpaces(Scooter.formattedLength(meters = 1_250.0, locale = ScooterUnits.Metric.applied(american))))

        // Miles: in feet under half a mile outside the UK, as the iPhone writes them on roads, and in yards in it.
        val irishMiles = ScooterUnits.Imperial.applied(irish)
        assertEquals(ScooterMeasurementSystem.Us, irishMiles.measurementSystem)
        assertEquals(irish.country, irishMiles.country)
        assertEquals(
            listOf("40 ft", "1,000 ft", "1.9 mi", "38 mi"),
            listOf(12.0, 300.0, 3_000.0, 61_000.0).map { plainSpaces(Scooter.formattedLength(meters = it, locale = irishMiles)) },
        )
        val swissMiles = ScooterUnits.Imperial.applied(swiss)
        assertEquals(ScooterMeasurementSystem.Us, swissMiles.measurementSystem)
        assertEquals("de", swissMiles.language)
        assertEquals("CH", swissMiles.country)
        assertTrue(plainSpaces(Scooter.formattedLength(meters = 300.0, locale = swissMiles)).endsWith(" ft"))
        // In German as Switzerland writes it: its apostrophe groups the digits.
        assertEquals("1\u2019000 ft", plainSpaces(Scooter.formattedLength(meters = 300.0, locale = swissMiles)))
        assertEquals("1.9 mi", plainSpaces(Scooter.formattedLength(meters = 3_000.0, locale = swissMiles)))

        val britishMiles = ScooterUnits.Imperial.applied(british)
        assertEquals(ScooterMeasurementSystem.Uk, ScooterUnits.Imperial.measurementSystem(ScooterMeasurementSystem.Uk))
        assertEquals(ScooterMeasurementSystem.Uk, britishMiles.measurementSystem)
        // British English measures in miles already: the locale stays as it is.
        assertEquals(british, britishMiles)
        assertEquals(
            listOf("10 yd", "350 yd", "1.9 mi"),
            listOf(12.0, 300.0, 3_000.0).map { plainSpaces(Scooter.formattedLength(meters = it, locale = britishMiles)) },
        )
        assertEquals(ScooterMeasurementSystem.Us, ScooterUnits.Imperial.applied(american).measurementSystem)
        for (locale in listOf(irishMiles, swissMiles, britishMiles)) {
            assertEquals(locale.toLanguageTag(), ScooterRangeFilter.Unit.Miles, ScooterRangeFilter.Unit.of(locale))
        }
        // Metric chosen over British miles, and back to Automatic, gives the locale it started from.
        assertEquals(british, ScooterUnits.Automatic.applied(british))

        // The closest cities, in whole kilometres or miles as chosen.
        val lungern = GeoPoint(latitude = 46.7741, longitude = 8.1558)
        val bern = ScooterCityCatalog.nearest(to = lungern, count = 1, among = TestCatalog.catalog.cities).single()
        assertEquals("36 mi", plainSpaces(bern.formattedDistance(locale = swissMiles)))
        assertEquals("57 km", plainSpaces(bern.formattedDistance(locale = ScooterUnits.Metric.applied(american))))
    }

    /** Every locale the app writes with, the launch language's and the others', is in the units chosen. */
    @Test
    fun theLanguageShownWritesInTheUnitsChosen() {
        ScooterLanguage.launchLocale = { Locale.forLanguageTag("en-CH") }
        val other = ScooterLanguage.De
        try {
            ScooterUnits.current = ScooterUnits.Automatic
            assertEquals(ScooterMeasurementSystem.Metric, ScooterLanguage.atLaunch.locale.measurementSystem)
            assertEquals(ScooterMeasurementSystem.Metric, other.locale.measurementSystem)
            assertEquals(Locale.forLanguageTag("en-CH"), ScooterLanguage.En.locale)

            ScooterUnits.current = ScooterUnits.Imperial
            assertEquals(ScooterMeasurementSystem.Us, ScooterLanguage.atLaunch.locale.measurementSystem)
            assertEquals(ScooterMeasurementSystem.Us, other.locale.measurementSystem)
            assertEquals("de", other.locale.language)
            assertEquals("CH", other.locale.country)
            assertTrue(plainSpaces(Scooter.formattedLength(meters = 3_000.0)).endsWith(" mi"))

            ScooterLanguage.launchLocale = { Locale.US }
            ScooterUnits.current = ScooterUnits.Metric
            assertEquals(ScooterMeasurementSystem.Metric, ScooterLanguage.atLaunch.locale.measurementSystem)
            assertEquals(ScooterMeasurementSystem.Metric, other.locale.measurementSystem)
            assertEquals("320 m", plainSpaces(Scooter.formattedLength(meters = 320.0)))
            assertEquals(
                "The screen's own choice, whatever the one the app writes with",
                ScooterMeasurementSystem.Us,
                other.locale(ScooterUnits.Automatic).measurementSystem,
            )
        } finally {
            ScooterUnits.current = ScooterUnits.Automatic
        }
    }

    @Test
    fun theHeadingIsTakenFromTheTopOfTheScreenAsItShows() {
        fun device(interfaceOrientation: ScooterInterfaceOrientation) =
            ScooterHeadingPolicy.deviceOrientation(interfaceOrientation)
        assertEquals(ScooterDeviceOrientation.Portrait, device(ScooterInterfaceOrientation.Portrait))
        assertEquals(ScooterDeviceOrientation.PortraitUpsideDown, device(ScooterInterfaceOrientation.PortraitUpsideDown))
        // A screen turned left shows on a device turned right.
        assertEquals(ScooterDeviceOrientation.LandscapeRight, device(ScooterInterfaceOrientation.LandscapeLeft))
        assertEquals(ScooterDeviceOrientation.LandscapeLeft, device(ScooterInterfaceOrientation.LandscapeRight))
        assertEquals(ScooterDeviceOrientation.Portrait, device(ScooterInterfaceOrientation.Unknown))
    }

    private fun plainSpaces(text: String): String = text.replace('\u00A0', ' ').replace('\u202F', ' ')

    @Test
    fun mapZoomRoundsUpAtTheServerClusteringBoundary() {
        assertEquals(15, ScooterClusteringPolicy.apiZoom(15.0))
        assertEquals(16, ScooterClusteringPolicy.apiZoom(15.01))
        assertEquals(22, ScooterClusteringPolicy.apiZoom(1e300))
        assertEquals(0, ScooterClusteringPolicy.apiZoom(-1e300))
        assertEquals(0, ScooterClusteringPolicy.apiZoom(Double.NaN))
        assertEquals(22, ScooterClusteringPolicy.apiZoom(Double.POSITIVE_INFINITY))
        assertEquals(0, ScooterClusteringPolicy.apiZoom(Double.NEGATIVE_INFINITY))
        assertTrue(ScooterClusteringPolicy.representationsMatch(16, 18))
        assertFalse(ScooterClusteringPolicy.representationsMatch(14, 15))
    }

    /** The iPhone's test says the opposite: there, the iOS link and never the Android one. */
    @Test
    fun rentalLinkPolicyUsesTheAndroidLinkAndNeverTheIOSLink() {
        val rentalURIs = ScooterRentalURIs(
            ios = "https://go.ridedott.com/vehicles/1?platform=ios",
            android = "https://go.ridedott.com/vehicles/1?platform=android",
            web = null,
        )

        val url = ScooterRentalLinkPolicy.rentalURL(
            provider = "dott",
            rentalURIs = rentalURIs,
            legacyLink = null,
        )

        assertEquals(
            "https://go.ridedott.com/vehicles/1?platform=android",
            url?.toString(),
        )
        assertFalse(url?.toString()?.contains("platform=ios") == true)
    }

    @Test
    fun rentalLinkPolicyRejectsUnsafeAndCrossProviderURLs() {
        assertNull(ScooterRentalLinkPolicy.safeURL(provider = "lime", value = "javascript:alert(1)"))
        assertNull(ScooterRentalLinkPolicy.safeURL(provider = "lime", value = "bolt://action/rent"))
        assertNull(ScooterRentalLinkPolicy.safeURL(provider = "hopp", value = "https://app.hopp.bike.example.com/launch/1"))
        assertNull(ScooterRentalLinkPolicy.safeURL(provider = "hopp", value = "https://user@app.hopp.bike/launch/1"))
    }

    @Test
    fun rentalLinkPolicyNeverOpensBirdsChargerSignUp() {
        // Bird's and Spin's feeds give it as their app's address, in Europe and North America alike.
        for (provider in listOf("bird", "spin")) {
            for (link in listOf("bird://charger-onboarding", "bird://Charger-Onboarding?source=gbfs")) {
                assertNull("$provider $link", ScooterRentalLinkPolicy.safeURL(provider = provider, value = link))
            }
        }
        assertEquals(
            "bird://scooter/ABC123",
            ScooterRentalLinkPolicy.safeURL(provider = "bird", value = "bird://scooter/ABC123")?.toString(),
        )
    }

    @Test
    fun rentalLinkPolicyKeepsTheNorthAmericanProvidersLinksOnTheirOwnHosts() {
        val hopp = "bolt-hopp://action/rentalsSelectVehicleByRotatedUuid?rotated_uuid=8d8f81ed"
        assertEquals(hopp, ScooterRentalLinkPolicy.safeURL(provider = "bolt_hopp", value = hopp)?.toString())
        assertNull(ScooterRentalLinkPolicy.safeURL(provider = "bolt", value = hopp))
        assertNull(ScooterRentalLinkPolicy.safeURL(provider = "hopp", value = hopp))
        val veo = "https://gmjc.adj.st/?adj_t=5vyf0nr&number=10103344"
        assertEquals(veo, ScooterRentalLinkPolicy.safeURL(provider = "veo", value = veo)?.toString())
        assertNull(ScooterRentalLinkPolicy.safeURL(provider = "voi", value = veo))
        val lyft = "https://chi.lft.to/lastmile_qr_scan"
        assertEquals(lyft, ScooterRentalLinkPolicy.safeURL(provider = "lyft", value = lyft)?.toString())
        assertNull(ScooterRentalLinkPolicy.safeURL(provider = "spin", value = lyft))
    }

    @Test
    fun rentalLinkPolicyKeepsSAHAMsLinkToTheNumberOnTheScooter() {
        val saham = "https://ride-saham.app.link/0131"
        assertEquals(saham, ScooterRentalLinkPolicy.safeURL(provider = "saham", value = saham)?.toString())
        // The other operators on ATOM Mobility don't take SAHAM's links, nor SAHAM theirs.
        assertNull(ScooterRentalLinkPolicy.safeURL(provider = "hoppy", value = saham))
        assertNull(ScooterRentalLinkPolicy.safeURL(provider = "saham", value = "https://ride-hoppy.app.link/600332"))
    }

    @Test
    fun rentalLinkPolicyKeepsTheNewZealandProvidersLinksOnTheirOwnHosts() {
        val flamingo = "https://ride.flamingoscooters.com/vehicle/8bee7d68e6cd88526d26554ab337e57d89cc0ea5316f5c71802205230b2ebcee"
        val flamingoAndroid = "https://ride.flamingoscooters.com/v/8bee7d68"
        val urls = ScooterRentalLinkPolicy.rentalURLs(
            provider = "flamingo",
            rentalURIs = ScooterRentalURIs(ios = flamingo, android = flamingoAndroid, web = null),
            legacyLink = null,
        )
        // The Android link, where the iPhone takes the iOS one.
        assertEquals(listOf(flamingoAndroid), urls.map { it.toString() })
        assertNull(ScooterRentalLinkPolicy.safeURL(provider = "flamingo", value = "https://ride.flamingoscooters.com.example.com/vehicle/1"))
        val jolt = "https://joltscooters.co.nz/vehicle/79f33e40-ee98-4909-b815-d3e35795bd5d"
        assertEquals(jolt, ScooterRentalLinkPolicy.safeURL(provider = "jolt", value = jolt)?.toString())
        assertNull(ScooterRentalLinkPolicy.safeURL(provider = "flamingo", value = jolt))
        assertNull(ScooterRentalLinkPolicy.safeURL(provider = "jolt", value = flamingo))
    }

    @Test
    fun openingARentalFallsBackToTheWebPageWhenTheProvidersAppIsMissing() = runTest {
        val android = "https://lime.bike/vehicle/abc-123?platform=android"
        val web = "https://lime.bike/vehicle/abc-123"
        val scooter = Scooter(
            provider = "lime",
            latitude = 47.3769,
            longitude = 8.5417,
            battery = 82,
            rangeMeters = null,
            vehicleID = "abc-123",
            deepLink = "https://lime.bike/vehicle/abc-123",
            rentalURIs = ScooterRentalURIs(
                ios = "limebike://vehicle/abc-123",
                android = android,
                web = web,
            ),
            distanceMeters = null,
        )
        // The Android link, then the web page; the iPhone's link is never tried.
        assertEquals(listOf(android, web), scooter.rentalURLs.map { it.toString() })

        // Without Lime on the phone nothing opens its link: the web page opens instead.
        val tried = mutableListOf<String>()
        val opened = scooter.openRental(
            openRentalLink = { url ->
                tried += url.toString()
                url.toString() != android
            },
            openLink = { _, _ -> error("Lime's app is not tried while a link to the scooter opens") },
        )
        assertEquals(listOf(android, web), tried)
        assertEquals(ScooterRentalOpening.Link(URI(web)), opened)

        // With the app installed, its link is the only one tried.
        tried.clear()
        val app = scooter.openRental(
            openRentalLink = { url ->
                tried += url.toString()
                true
            },
            openLink = { _, _ -> error("Lime's app is not tried while a link to the scooter opens") },
        )
        assertEquals(listOf(android), tried)
        assertEquals(ScooterRentalOpening.Link(URI(android)), app)

        // When nothing opens, not even Lime's app or its page on Google Play, nothing is reported as opened.
        val lime = checkNotNull(ScooterProvider.Lime.app)
        val play = lime.storePages.map { "$it false" }
        assertEquals(2, play.size)
        tried.clear()
        val nothing = scooter.openRental(
            openRentalLink = { url ->
                tried += url.toString()
                false
            },
            openLink = { url, appOnly ->
                tried += "$url $appOnly"
                false
            },
        )
        assertNull(nothing)
        assertEquals(listOf(android, web, "${lime.link} true") + play, tried)
    }

    @Test
    fun openingARentalFallsBackToTheOperatorsStorePageWhenNoLinkOpens() = runTest {
        // Bolt's feed gives only links in Bolt's own scheme, which nothing opens without Bolt's app.
        val link = "bolt://action/rentalsSelectVehicleByRotatedUuid?rotated_uuid=1"
        val scooter = Scooter(
            provider = "bolt",
            latitude = 47.3769,
            longitude = 8.5417,
            battery = 70,
            rangeMeters = null,
            vehicleID = "bolt-1",
            deepLink = link,
            rentalURIs = ScooterRentalURIs(ios = link, android = link, web = null),
            distanceMeters = null,
        )
        assertEquals(listOf(link), scooter.rentalURLs.map(URI::toString))
        assertNull("The card says rental_open without result app", scooter.operatorApp)
        val bolt = checkNotNull(ScooterProvider.Bolt.app).link
        val play = checkNotNull(ScooterProvider.Bolt.app?.googlePlayId)

        // Without the app, Bolt's link opens nothing either, so its page in the Play Store opens, as the App Store's
        // does on the iPhone (week review, choice 17).
        val tried = mutableListOf<String>()
        val store = scooter.openRental(
            openRentalLink = { url ->
                tried += url.toString()
                false
            },
            openLink = { url, appOnly ->
                tried += "$url $appOnly"
                !appOnly
            },
        )
        assertEquals(listOf(link, "$bolt true", "market://details?id=$play false"), tried)
        assertEquals(ScooterRentalOpening.Store(URI("market://details?id=$play")), store)

        // Without the Play Store, or any store that takes market:// links, its page on Google Play's website.
        tried.clear()
        val web = scooter.openRental(
            openRentalLink = { url ->
                tried += url.toString()
                false
            },
            openLink = { url, appOnly ->
                tried += "$url $appOnly"
                !appOnly && url.scheme == "https"
            },
        )
        val playPage = "https://play.google.com/store/apps/details?id=$play"
        assertEquals(listOf(link, "$bolt true", "market://details?id=$play false", "$playPage false"), tried)
        assertEquals(ScooterRentalOpening.Store(URI(playPage)), web)

        // An operator the catalog gives no app has nothing to fall back on.
        val hopp = Scooter(
            provider = "bolt_hopp",
            latitude = 47.3769,
            longitude = 8.5417,
            battery = 70,
            rangeMeters = null,
            vehicleID = "hopp-1",
            deepLink = null,
            rentalURIs = ScooterRentalURIs(ios = null, android = "bolt-hopp://vehicle/1", web = null),
            distanceMeters = null,
        )
        assertNull(hopp.providerInfo?.app)
        tried.clear()
        val nothing = hopp.openRental(
            openRentalLink = { url ->
                tried += url.toString()
                false
            },
            openLink = { url, _ ->
                tried += url.toString()
                true
            },
        )
        assertNull(nothing)
        assertEquals(listOf("bolt-hopp://vehicle/1"), tried)
    }

    @Test
    fun opensTheOperatorsAppOrItsStorePageWhereTheFeedLinksNoScooter() = runTest {
        fun scooter(provider: String, rentalURIs: ScooterRentalURIs? = null): Scooter = Scooter(
            provider = provider,
            latitude = 40.7128,
            longitude = -74.006,
            battery = 64,
            rangeMeters = null,
            vehicleID = "$provider-1",
            deepLink = null,
            rentalURIs = rentalURIs,
            distanceMeters = null,
        )
        // The operator's app for every operator the catalog gives one, and none for the others. Which operators have
        // one, their links and their packages on Google Play are data/'s (CatalogParityTest holds the links to the
        // Swift catalog's), so they are read from it (LOG-370).
        for (provider in ScooterProvider.entries) {
            assertEquals(provider.rawValue, provider.app, scooter(provider.rawValue).operatorApp)
        }
        // One whose feed may link a scooter too, on a host its policy allows (code, held to Swift's).
        val withApp = ScooterProvider.entries.first { provider ->
            provider.app != null && ScooterRentalLinkPolicy.policies[provider.rawValue]?.httpsHosts.orEmpty().isNotEmpty()
        }
        val link = withApp.app!!.link
        val operator = scooter(withApp.rawValue)

        // With the app installed, its link opens it; only an app may take that link.
        val tried = mutableListOf<String>()
        val opened = operator.openRental(
            openRentalLink = { error("The feed links no scooter") },
            openLink = { url, appOnly ->
                tried += "$url $appOnly"
                true
            },
        )
        assertEquals(listOf("$link true"), tried)
        assertEquals(ScooterRentalOpening.App(URI(link)), opened)

        // Without it, its page in the Play Store opens, as the App Store's does on the iPhone (week review, choice 17).
        tried.clear()
        val store = operator.openRental(
            openRentalLink = { error("The feed links no scooter") },
            openLink = { url, appOnly ->
                tried += "$url $appOnly"
                !appOnly
            },
        )
        val market = URI("market://details?id=${checkNotNull(withApp.app?.googlePlayId)}")
        assertEquals(listOf("$link true", "$market false"), tried)
        assertEquals(ScooterRentalOpening.Store(market), store)

        // A scooter its feed links keeps that link, and an operator with no app has nothing to fall back on.
        val host = ScooterRentalLinkPolicy.policies.getValue(withApp.rawValue).httpsHosts.first()
        val linked = scooter(withApp.rawValue, rentalURIs = ScooterRentalURIs(ios = null, android = "https://$host/vehicle/1", web = null))
        assertEquals(listOf("https://$host/vehicle/1"), linked.rentalURLs.map(URI::toString))
        assertNull(linked.operatorApp)
        assertEquals(
            ScooterRentalOpening.Link(URI("https://$host/vehicle/1")),
            linked.openRental(openRentalLink = { true }, openLink = { _, _ -> true }),
        )
        val withoutApp = ScooterProvider.entries.firstOrNull { it.app == null }
        assumeTrue("every operator has an app", withoutApp != null)
        assertNull(scooter(withoutApp!!.rawValue).openRental(openRentalLink = { true }, openLink = { _, _ -> true }))
    }

    /**
     * Without the operator's app, "Open in" goes to its page in the Play Store (market://), or else on Google Play's
     * website, as the iPhone goes to the App Store's (week review, choice 17); an operator whose package the catalog
     * does not give, none being confirmed, keeps its link, which opens in the browser.
     */
    @Test
    fun theStorePagesOfAnOperatorsAppAreItsPlayPagesOrElseItsLink() {
        val withPackage = ScooterProvider.OperatorApp("https://ride.example.com/", googlePlayId = "com.example.ride")
        assertEquals(
            listOf(URI("market://details?id=com.example.ride"), URI("https://play.google.com/store/apps/details?id=com.example.ride")),
            withPackage.storePages,
        )
        assertEquals(listOf(URI("https://ride.example.com/")), ScooterProvider.OperatorApp("https://ride.example.com/").storePages)
        // The catalog's packages, from data/providers.json, are package names.
        for (provider in ScooterProvider.entries) {
            val id = provider.app?.googlePlayId ?: continue
            assertTrue(id, Regex("[A-Za-z]\\w*(\\.[A-Za-z]\\w*)+").matches(id))
        }
    }

    // Ride prices and passes.

    @Test
    fun rideEstimateDurationPolicyAcceptsOnlyMenuDurations() {
        assertEquals(listOf(5, 10, 15, 20, 30), RideEstimateDuration.allowedMinutes)
        assertEquals(10, RideEstimateDuration.defaultMinutes)

        for (duration in RideEstimateDuration.allowedMinutes) {
            assertEquals(duration, RideEstimateDuration.normalized(duration))
        }
        assertEquals(10, RideEstimateDuration.normalized(0))
        assertEquals(10, RideEstimateDuration.normalized(12))
        assertEquals(10, RideEstimateDuration.normalized(-5))
    }

    @Test
    fun ridePriceEstimateUsesExactMinorUnitArithmetic() {
        val quote = RidePriceEstimator.quote(
            pricing = ScooterRidePricing(
                currency = "CHF",
                unlockFeeMinorUnits = 95,
                minuteFeeMinorUnits = 41,
            ),
            durationMinutes = 30,
        )

        assertEquals("CHF", quote.currency)
        assertEquals(30, quote.durationMinutes)
        assertEquals(1_325, quote.grossMinorUnits)
        assertEquals(1_325, quote.totalMinorUnits)
        assertEquals(95, quote.chargedUnlockFeeMinorUnits)
        assertEquals(30, quote.billedMinutes)
        assertEquals(0, quote.freeMinutesApplied)
        assertFalse(quote.passApplied)
    }

    @Test
    fun activePassCanRemoveOnlyTheUnlockFee() {
        val quote = RidePriceEstimator.quote(
            pricing = standardPricing,
            durationMinutes = 10,
            pass = ProviderRidePass(enabled = true, freeUnlock = true),
        )

        assertEquals(520, quote.grossMinorUnits)
        assertEquals(420, quote.totalMinorUnits)
        assertEquals(0, quote.chargedUnlockFeeMinorUnits)
        assertEquals(10, quote.billedMinutes)
        assertEquals(0, quote.freeMinutesApplied)
        assertTrue(quote.passApplied)
    }

    @Test
    fun activePassSubtractsFreeMinutesWithoutGoingBelowZero() {
        val partialQuote = RidePriceEstimator.quote(
            pricing = standardPricing,
            durationMinutes = 10,
            pass = ProviderRidePass(enabled = true, freeMinutes = 4),
        )
        val fullyCoveredQuote = RidePriceEstimator.quote(
            pricing = standardPricing,
            durationMinutes = 10,
            pass = ProviderRidePass(enabled = true, freeUnlock = true, freeMinutes = 30),
        )

        assertEquals(352, partialQuote.totalMinorUnits)
        assertEquals(100, partialQuote.chargedUnlockFeeMinorUnits)
        assertEquals(6, partialQuote.billedMinutes)
        assertEquals(4, partialQuote.freeMinutesApplied)
        assertTrue(partialQuote.passApplied)
        assertEquals(0, fullyCoveredQuote.totalMinorUnits)
        assertEquals(0, fullyCoveredQuote.chargedUnlockFeeMinorUnits)
        assertEquals(0, fullyCoveredQuote.billedMinutes)
        assertEquals(10, fullyCoveredQuote.freeMinutesApplied)
        assertTrue(fullyCoveredQuote.passApplied)
    }

    @Test
    fun disabledPassDoesNotAffectEstimate() {
        val quote = RidePriceEstimator.quote(
            pricing = standardPricing,
            durationMinutes = 10,
            pass = ProviderRidePass(
                enabled = false,
                freeUnlock = true,
                freeMinutes = 10,
            ),
        )

        assertEquals(520, quote.totalMinorUnits)
        assertEquals(10, quote.billedMinutes)
        assertFalse(quote.passApplied)
    }

    @Test
    fun pricesHaveTheDecimalsFoundationGivesTheirCurrency() {
        // Foundation writes these whole where the JVM's ISO data and Android's CLDR data give some decimals.
        for (code in listOf("COP", "IDR", "IQD", "HUF", "ISK", "JPY", "huf")) {
            assertEquals(code, 0, RidePriceFormatter.fractionDigits(code))
        }
        for (code in listOf("CHF", "EUR", "USD", "NOK", "BRL", "CZK", "XYZ", "")) {
            assertEquals(code, 2, RidePriceFormatter.fractionDigits(code))
        }
    }

    @Test
    fun anAmountIsWrittenEvenForACodeThatNamesNoCurrency() {
        ScooterLanguage.current = ScooterLanguage.En
        // As Foundation writes "XYZ 272.50" and "HUF 272": the JVM's stand-in puts no space after a code.
        assertTrue(RidePriceFormatter.string(minorUnits = 27_250, currency = "xyz").replace("\u00A0", " ").matches(Regex("XYZ ?272\\.50")))
        assertEquals("HUF", RidePriceFormatter.string(minorUnits = 27_250, currency = "HUF").filter(Char::isLetter))
        assertTrue(RidePriceFormatter.string(minorUnits = 27_250, currency = "HUF").endsWith("272"))
        assertTrue(RidePriceFormatter.string(minorUnits = 27_350, currency = "HUF").endsWith("274"))
    }

    /**
     * The card's figure is written as the fare beside it writes money, without the symbol: Swiss French money takes
     * a point where its numbers take a comma, so "5.00" beside "1.00 CHF", where France writes "5,00" beside
     * "1,00 €". A currency without cents has no decimals.
     */
    @Test
    fun aBareAmountIsWrittenAsTheLocaleWritesMoney() {
        fun amount(tag: String, minorUnits: Int, currency: String): String {
            ScooterLanguage.launchLocale = { Locale.forLanguageTag(tag) }
            ScooterLanguage.current = ScooterLanguage.atLaunch
            return RidePriceFormatter.amount(minorUnits, currency)
        }
        assertEquals("5.00", amount("fr-CH", 500, "CHF"))
        assertEquals("5.00", amount("de-CH", 500, "chf"))
        assertEquals("5,00", amount("fr-FR", 500, "EUR"))
        assertEquals("5.00", amount("en-US", 500, "USD"))
        assertEquals("1,234.50", amount("en-US", 123_450, "USD"))
        assertEquals("350", amount("is-IS", 35_000, "ISK"))
        assertEquals("350", amount("en-US", 35_000, "ISK"))
        // A code that names no currency is written as money all the same.
        assertEquals("5,00", amount("fr-FR", 500, "XYZ"))
    }

    @Test
    fun passExpiryEndsADayAfterTheExpiryDayStartedWhereItsMidnightIsSkipped() {
        // Santiago skips from 00:00 to 01:00 on 6 September 2026: that day starts at 01:00, and Calendar's
        // day after it at 01:00 too, as Foundation answers.
        val zone = ZoneId.of("America/Santiago")
        val pass = ProviderRidePass(enabled = true, expiryDate = Instant.parse("2026-09-06T15:00:00Z"))

        assertTrue(pass.isActive(on = Instant.parse("2026-09-07T03:59:59Z"), zone = zone))
        assertFalse(pass.isActive(on = Instant.parse("2026-09-07T04:00:00Z"), zone = zone))
    }

    @Test
    fun passExpiryIncludesTheWholeLocalExpiryDay() {
        val zone = ZoneId.of("Europe/Zurich")
        val expiryDate = LocalDateTime.of(2026, 8, 30, 8, 0).atZone(zone).toInstant()
        val pass = ProviderRidePass(
            enabled = true,
            freeUnlock = true,
            freeMinutes = 10,
            expiryDate = expiryDate,
        )
        val finalMinute = LocalDateTime.of(2026, 8, 30, 23, 59).atZone(zone).toInstant()
        val nextDay = LocalDate.of(2026, 8, 31).atStartOfDay(zone).toInstant()

        assertTrue(pass.isActive(on = finalMinute, zone = zone))
        assertFalse(pass.isActive(on = nextDay, zone = zone))
        assertEquals(
            0,
            RidePriceEstimator.quote(
                pricing = standardPricing,
                durationMinutes = 10,
                pass = pass,
                now = finalMinute,
                zone = zone,
            ).totalMinorUnits,
        )
        assertEquals(
            520,
            RidePriceEstimator.quote(
                pricing = standardPricing,
                durationMinutes = 10,
                pass = pass,
                now = nextDay,
                zone = zone,
            ).totalMinorUnits,
        )
    }

    @Test
    fun enabledPassWithoutExpiryDoesNotExpire() {
        val pass = ProviderRidePass(enabled = true, freeMinutes = 5)
        // Date.distantFuture.
        assertTrue(pass.isActive(on = Instant.parse("4001-01-01T00:00:00Z")))
    }

    @Test
    fun passInitializerClampsNegativeFreeMinutes() {
        val pass = ProviderRidePass(enabled = true, freeMinutes = -12)
        val quote = RidePriceEstimator.quote(
            pricing = standardPricing,
            durationMinutes = 10,
            pass = pass,
        )

        assertEquals(0, pass.freeMinutes)
        assertEquals(520, quote.totalMinorUnits)
        assertFalse(quote.passApplied)
    }

    @Test
    fun providerRidePassCodableRoundTripPreservesExpiry() {
        val expiryDate = Instant.ofEpochSecond(1_788_044_400)
        val pass = ProviderRidePass(
            enabled = true,
            freeUnlock = true,
            freeMinutes = 25,
            expiryDate = expiryDate,
        )

        val data = Json.encodeToString(pass)
        val decoded = Json.decodeFromString<ProviderRidePass>(data)

        assertEquals(pass, decoded)
        // As the iPhone's JSONEncoder writes it: the expiry in seconds since 1 January 2001.
        assertEquals("""{"enabled":true,"freeUnlock":true,"freeMinutes":25,"expiryDate":809737200}""", data)
    }

    /** Int is 32-bit here, where Swift's is 64-bit: the sum saturates at Int.MAX_VALUE all the same. */
    @Test
    fun ridePriceEstimateSaturatesInsteadOfOverflowing() {
        val quote = RidePriceEstimator.quote(
            pricing = ScooterRidePricing(
                currency = "CHF",
                unlockFeeMinorUnits = Int.MAX_VALUE,
                minuteFeeMinorUnits = Int.MAX_VALUE,
            ),
            durationMinutes = 30,
        )

        assertEquals(Int.MAX_VALUE, quote.grossMinorUnits)
        assertEquals(Int.MAX_VALUE, quote.totalMinorUnits)
        assertFalse(quote.passApplied)
    }

    private val standardPricing: ScooterRidePricing
        get() = ScooterRidePricing(
            currency = "CHF",
            unlockFeeMinorUnits = 100,
            minuteFeeMinorUnits = 42,
        )

    private fun makeScooter(
        provider: String = "lime",
        latitude: Double = 47.3769,
        longitude: Double = 8.5417,
        rangeMeters: Int? = 1_000,
        vehicleID: String? = "vehicle",
        serverDistance: Double = 100.0,
    ): Scooter = Scooter(
        provider = provider,
        latitude = latitude,
        longitude = longitude,
        battery = 75,
        rangeMeters = rangeMeters,
        vehicleID = vehicleID,
        deepLink = null,
        rentalURIs = null,
        distanceMeters = serverDistance,
    )

    // Freshness, provider health and the dock.

    @Test
    fun batteryLevelIsGoodFromFiftyLowFromTwentyAndCriticalBelow() {
        val levels = listOf(
            100 to ScooterBatteryLevel.Good, 50 to ScooterBatteryLevel.Good, 49 to ScooterBatteryLevel.Low,
            20 to ScooterBatteryLevel.Low, 19 to ScooterBatteryLevel.Critical, 0 to ScooterBatteryLevel.Critical,
        )
        for ((percent, level) in levels) {
            assertEquals("$percent%", level, ScooterBatteryLevel.of(percent))
        }

        assertEquals(ScooterBatteryLevel.Good, makeScooter().batteryLevel)
        val unknown = Scooter(
            provider = "lime", latitude = 47.3769, longitude = 8.5417, battery = null,
            rangeMeters = null, vehicleID = "unknown", deepLink = null, rentalURIs = null, distanceMeters = null,
        )
        assertNull(unknown.batteryLevel)
    }

    @Test
    fun refreshIsDueAfterTheIntervalOrFiveSecondsBeforeExpiry() {
        val loaded = Instant.ofEpochSecond(1_790_000_000)

        // A normal response: the interval comes first.
        assertEquals(
            loaded.addingTimeInterval(60.0),
            ScooterRefreshPolicy.standard.refreshDue(
                lastSuccess = loaded, refreshAfter = 60.0, expiresAt = loaded.addingTimeInterval(300.0),
            ),
        )
        // A healthy response can arrive with seconds left: refresh before it expires.
        assertEquals(
            loaded.addingTimeInterval(15.0),
            ScooterRefreshPolicy.standard.refreshDue(
                lastSuccess = loaded, refreshAfter = 60.0, expiresAt = loaded.addingTimeInterval(20.0),
            ),
        )
        // City totals refresh hourly.
        assertEquals(
            loaded.addingTimeInterval(3_600.0),
            ScooterRefreshPolicy.standard.refreshDue(
                lastSuccess = loaded, refreshAfter = 3_600.0, expiresAt = loaded.addingTimeInterval(3 * 3_600.0),
            ),
        )
        // Nothing has loaded yet: a refresh is always due.
        assertTrue(ScooterRefreshPolicy.standard.refreshDue(lastSuccess = null, refreshAfter = 60.0, expiresAt = null) < loaded)
    }

    @Test
    fun automaticAttemptsAreNeverCloserThanTenSeconds() {
        val loaded = Instant.ofEpochSecond(1_790_000_000)
        fun nextAttempt(expiresIn: Double, lastAttemptAfter: Double): Double =
            ScooterRefreshPolicy.standard.nextAttempt(
                lastSuccess = loaded,
                refreshAfter = 60.0,
                expiresAt = loaded.addingTimeInterval(expiresIn),
                lastAttempt = loaded.addingTimeInterval(lastAttemptAfter),
            ).timeIntervalSince(loaded)

        assertEquals(60.0, nextAttempt(expiresIn = 300.0, lastAttemptAfter = 0.0), 0.0)
        // Seconds from expiry on arrival: still ten seconds after the attempt.
        assertEquals(10.0, nextAttempt(expiresIn = 8.0, lastAttemptAfter = 0.0), 0.0)
        // A refresh that failed at 60 s is tried again at 70 s.
        assertEquals(70.0, nextAttempt(expiresIn = 300.0, lastAttemptAfter = 60.0), 0.0)
        assertEquals(10.0, ScooterRefreshPolicy.standard.minimumAttemptGap, 0.0)
        assertEquals(5.0, ScooterRefreshPolicy.standard.expiryLead, 0.0)
        assertEquals(60.0, ScooterRefreshPolicy.standard.defaultRefreshAfter, 0.0)

        val firstAttempt = loaded
        assertEquals(
            firstAttempt.addingTimeInterval(10.0),
            ScooterRefreshPolicy.standard.nextAttempt(
                lastSuccess = null, refreshAfter = 60.0, expiresAt = null, lastAttempt = firstAttempt,
            ),
        )
    }

    @Test
    fun aRefreshingResponseGetsAQuickFollowUp() {
        val loaded = Instant.ofEpochSecond(1_790_000_000)
        val policy = ScooterRefreshPolicy.standard
        assertEquals(2.0, policy.followUpGap, 0.0)
        // The server suggests three seconds; the gap allows it once.
        assertEquals(
            loaded.addingTimeInterval(3.0),
            policy.nextAttempt(
                lastSuccess = loaded, refreshAfter = 3.0, expiresAt = loaded.addingTimeInterval(300.0),
                lastAttempt = loaded, attemptGap = policy.followUpGap,
            ),
        )
        // Without it, the usual ten seconds.
        assertEquals(
            loaded.addingTimeInterval(10.0),
            policy.nextAttempt(
                lastSuccess = loaded, refreshAfter = 3.0, expiresAt = loaded.addingTimeInterval(300.0), lastAttempt = loaded,
            ),
        )
        val payload = runCatching {
            ScooterAPIJson.decodeFromString<ScooterResponseMetadataPayload>(
                """
                {"partial":false,"stale":true,"failedSources":[],"sources":{},"generatedAt":"2026-10-14T10:00:00.000Z",
                 "truncated":false,"totalVehicles":0,"mode":"vehicles","zoom":16,"refreshAfterSeconds":3,"refreshing":true}
                """,
            )
        }.getOrNull()
        assertEquals(true, payload?.model?.refreshing)
        assertEquals(3, payload?.model?.refreshAfterSeconds)
        assertNull(policy.askedFollowUp(payload?.model))
    }

    @Test
    fun aRefreshingResponseIsAskedAgainWhenTheServerSays() {
        val policy = ScooterRefreshPolicy.standard
        fun decode(json: String): ScooterResponseMetadata =
            ScooterAPIJson.decodeFromString<ScooterResponseMetadataPayload>(
                """
                {"partial":false,"stale":false,"failedSources":[],"sources":{},"generatedAt":"2026-10-26T02:00:00.000Z",
                 "truncated":false,"totalVehicles":0,"mode":"vehicles","zoom":16,"refreshAfterSeconds":3,$json}
                """,
            ).model
        // At once, after the shortest gap, while a quick feed is on its way; every three seconds while a sweep fills.
        val coming = decode(""""refreshing":true,"followUpMs":0""")
        assertEquals(0, coming.followUpMs)
        assertEquals(policy.minimumFollowUp, policy.askedFollowUp(coming))
        assertEquals(3.0, policy.askedFollowUp(decode(""""refreshing":true,"followUpMs":3000""")))
        // Only while refreshing.
        assertNull(policy.askedFollowUp(decode(""""followUpMs":0""")))
        val loaded = Instant.ofEpochSecond(1_790_000_000)
        val asked = policy.askedFollowUp(coming)!!
        assertEquals(
            loaded.addingTimeInterval(0.2),
            policy.nextAttempt(
                lastSuccess = loaded, refreshAfter = asked, expiresAt = loaded.addingTimeInterval(300.0),
                lastAttempt = loaded, attemptGap = asked,
            ),
        )
    }

    @Test
    fun failedSourcesBecomeDownProvidersOperatingInTheViewport() {
        val failedSources = listOf("voi_zurich", "Bird_Basel", "velospot", "pony_fr_angers", "city-overview")
        val operating = listOf(ScooterProvider.Bolt, ScooterProvider.Bird, ScooterProvider.Voi, ScooterProvider.Publibike)
        val health = ScooterProviderHealth(
            failedSources = failedSources,
            operating = operating,
            inView = emptySet(),
        )

        assertEquals(listOf(ScooterProvider.Bird, ScooterProvider.Voi, ScooterProvider.Publibike), health.downProviders)
        assertTrue(health.hasUnknownFailures)

        // A provider whose scooters are in view is sharing data, whatever feed of its failed.
        val partlyInView = ScooterProviderHealth(
            failedSources = failedSources,
            operating = operating,
            inView = setOf(ScooterProvider.Voi, ScooterProvider.Bolt),
        )
        assertEquals(listOf(ScooterProvider.Bird, ScooterProvider.Publibike), partlyInView.downProviders)

        assertEquals(
            ScooterProviderHealth.healthy,
            ScooterProviderHealth(failedSources = emptyList(), operating = ScooterProvider.entries, inView = emptySet()),
        )
        // A source prefix does not hide the provider behind it.
        assertEquals(ScooterProvider.Dott, ScooterProviderHealth.provider(forSource = "france:dott_fr_lyon"))
        assertNull(ScooterProviderHealth.provider(forSource = "national"))
    }

    @Test
    fun dockNoticesNameProvidersThenTruncationThenParking() {
        val metadata = ScooterResponseMetadata(
            partial = true, failedSources = listOf("bird_zurich"), truncated = true,
            totalVehicles = 5_412, parkingStatus = "partial",
        )
        val oneDown = ScooterProviderHealth(downProviders = listOf(ScooterProvider.Bird), hasUnknownFailures = true)

        assertEquals(
            listOf(
                ScooterDockNotice.ProvidersDown(listOf(ScooterProvider.Bird)),
                ScooterDockNotice.Truncated(shown = 2_000, total = 5_412),
                ScooterDockNotice.ParkingUnavailable,
            ),
            ScooterDockNotice.notices(health = oneDown, metadata = metadata, shownCount = 2_000),
        )
        assertEquals(
            listOf(ScooterDockNotice.SomeProvidersDown, ScooterDockNotice.ParkingOutOfDate),
            ScooterDockNotice.notices(
                health = ScooterProviderHealth(downProviders = emptyList(), hasUnknownFailures = true),
                metadata = ScooterResponseMetadata(partial = true, failedSources = listOf("city-overview"), parkingStatus = "stale"),
                shownCount = 0,
            ),
        )
        assertTrue(
            ScooterDockNotice.notices(
                health = ScooterProviderHealth.healthy,
                metadata = ScooterResponseMetadata(partial = false, failedSources = emptyList(), parkingStatus = "fresh"),
                shownCount = 12,
            ).isEmpty(),
        )

        val one = ScooterDockNotice.ProvidersDown(listOf(ScooterProvider.Bird)).text
        val two = ScooterDockNotice.ProvidersDown(listOf(ScooterProvider.Bird, ScooterProvider.Dott)).text
        val many = ScooterDockNotice.ProvidersDown(listOf(ScooterProvider.Bird, ScooterProvider.Dott, ScooterProvider.Lime)).text
        assertTrue(one.contains("Bird"))
        assertTrue(two.contains("Bird") && two.contains("Dott"))
        assertTrue(many.contains("3"))
        assertFalse(many.contains("Bird"))
        assertEquals(4, setOf(one, two, many, ScooterDockNotice.SomeProvidersDown.text).size)

        val truncated = ScooterDockNotice.Truncated(shown = 2_000, total = 5_412).text
        // Int.formatted(): in the phone's locale.
        assertTrue(truncated.contains(2_000.formatted(ScooterLanguage.launchLocale())))
        assertTrue(truncated.contains(5_412.formatted(ScooterLanguage.launchLocale())))
        assertNotEquals(
            ScooterDockNotice.ParkingUnavailable.text,
            ScooterDockNotice.ParkingOutOfDate.text,
        )
    }

    @Test
    fun citiesBanRentingOnTheirNightsInLocalTime() {
        // The bans as data/ had them on 28 October 2026, each area a box but Nashville's, whose county line goes round
        // Brentwood: data/ changes the nights, the areas and the cities (LOG-370). The catalog's own follow.
        fun box(south: Double, west: Double, north: Double, east: Double) =
            listOf(GeoPoint(south, west), GeoPoint(south, east), GeoPoint(north, east), GeoPoint(north, west))
        fun ban(city: String, timeZone: String, from: Int, until: Int, vararg areas: List<GeoPoint>, evenings: Set<Int>? = null) =
            RentalCurfew(city = city, timeZone = timeZone, nights = listOf(RentalCurfew.Night(evenings, from, until)), areas = areas.toList())
        val nashvilleCounty = listOf(
            GeoPoint(36.41, -87.05), GeoPoint(36.41, -86.52), GeoPoint(35.97, -86.52),
            GeoPoint(35.97, -86.7), GeoPoint(36.1, -86.7), GeoPoint(36.1, -87.05),
        )
        val bans = listOf(
            ban("Oslo", "Europe/Oslo", 23 * 60, 5 * 60, box(59.81, 10.62, 60.14, 10.95)),
            ban("Trondheim", "Europe/Oslo", 23 * 60, 5 * 60, box(63.16, 10.0, 63.52, 10.73), evenings = setOf(6, 7)),
            ban("Stavanger", "Europe/Oslo", 0, 5 * 60, box(58.88, 5.5, 59.31, 6.13), evenings = setOf(6, 7)),
            ban("Kyiv", "Europe/Kyiv", 60, 5 * 60, box(50.21, 30.24, 50.59, 30.7)),
            ban("Dallas", "America/Chicago", 20 * 60 + 45, 5 * 60, box(32.61, -97.0, 33.02, -96.56)),
            ban("Nashville", "America/Chicago", 0, 5 * 60, nashvilleCounty),
            ban("Minneapolis", "America/Chicago", 0, 4 * 60, box(44.89, -93.33, 45.05, -93.19)),
            ban("Raleigh", "America/New_York", 23 * 60, 6 * 60, box(35.8, -78.82, 35.97, -78.49), box(35.77, -78.7, 35.8, -78.66)),
            ban("Birmingham", "America/Chicago", 23 * 60, 6 * 60, box(33.38, -86.96, 33.67, -86.58)),
        )
        val oslo = GeoPoint(latitude = 59.9139, longitude = 10.7522)
        val osloTime = ZoneId.of("Europe/Oslo")
        val sandvika = GeoPoint(latitude = 59.8913, longitude = 10.5236)

        // 22:59 and 23:00 in Oslo, summer time.
        assertNull(RentalCurfew.active(at = oslo, on = at("2026-10-12T20:59:00Z"), among = bans))
        assertEquals(
            RentalCurfew.Active(city = "Oslo", until = at("2026-10-13T03:00:00Z"), timeZone = osloTime),
            RentalCurfew.active(at = oslo, on = at("2026-10-12T21:00:00Z"), among = bans),
        )
        assertNull(RentalCurfew.active(at = oslo, on = at("2026-10-13T03:00:00Z"), among = bans))
        assertNull(RentalCurfew.active(at = sandvika, on = at("2026-10-12T22:00:00Z"), among = bans))
        // The nights the clocks go back and forward end at 05:00 all the same.
        assertEquals(at("2026-10-25T04:00:00Z"), RentalCurfew.active(at = oslo, on = at("2026-10-24T21:30:00Z"), among = bans)?.until)
        assertEquals(at("2027-03-28T03:00:00Z"), RentalCurfew.active(at = oslo, on = at("2027-03-27T22:30:00Z"), among = bans)?.until)

        // Trondheim bans only Friday and Saturday nights; Stavanger's start at midnight, after the evening.
        val trondheim = GeoPoint(latitude = 63.4305, longitude = 10.3951)
        val stavanger = GeoPoint(latitude = 58.97, longitude = 5.7331)
        assertNull(RentalCurfew.active(at = trondheim, on = at("2026-10-12T21:30:00Z"), among = bans))
        assertEquals(at("2026-10-17T03:00:00Z"), RentalCurfew.active(at = trondheim, on = at("2026-10-16T21:30:00Z"), among = bans)?.until)
        assertEquals(at("2026-10-18T03:00:00Z"), RentalCurfew.active(at = trondheim, on = at("2026-10-17T22:30:00Z"), among = bans)?.until)
        assertNull(RentalCurfew.active(at = trondheim, on = at("2026-10-18T21:30:00Z"), among = bans))
        assertNull(RentalCurfew.active(at = stavanger, on = at("2026-10-16T21:30:00Z"), among = bans))
        assertEquals(at("2026-10-17T03:00:00Z"), RentalCurfew.active(at = stavanger, on = at("2026-10-16T22:30:00Z"), among = bans)?.until)
        assertNull(RentalCurfew.active(at = stavanger, on = at("2026-10-15T22:30:00Z"), among = bans))

        // Kyiv's martial-law curfew, 01:00 to 05:00 Kyiv time, stops at the city's edge.
        val kyiv = GeoPoint(latitude = 50.4501, longitude = 30.5234)
        val brovary = GeoPoint(latitude = 50.5113, longitude = 30.7903)
        assertNull(RentalCurfew.active(at = kyiv, on = at("2026-10-14T21:59:00Z"), among = bans))
        assertEquals(
            RentalCurfew.Active(city = "Kyiv", until = at("2026-10-15T02:00:00Z"), timeZone = ZoneId.of("Europe/Kyiv")),
            RentalCurfew.active(at = kyiv, on = at("2026-10-14T22:00:00Z"), among = bans),
        )
        assertNull(RentalCurfew.active(at = brovary, on = at("2026-10-14T23:00:00Z"), among = bans))

        // Dallas lets rides start until 20:45, Central time; Nashville's ban stops at Davidson County's line.
        val dallas = GeoPoint(latitude = 32.7767, longitude = -96.797)
        val nashville = GeoPoint(latitude = 36.1627, longitude = -86.7816)
        val brentwood = GeoPoint(latitude = 36.0331, longitude = -86.7828)
        assertNull(RentalCurfew.active(at = dallas, on = at("2026-10-15T01:44:00Z"), among = bans))
        assertEquals(
            RentalCurfew.Active(city = "Dallas", until = at("2026-10-15T10:00:00Z"), timeZone = ZoneId.of("America/Chicago")),
            RentalCurfew.active(at = dallas, on = at("2026-10-15T01:45:00Z"), among = bans),
        )
        assertEquals(at("2026-10-15T10:00:00Z"), RentalCurfew.active(at = nashville, on = at("2026-10-15T05:30:00Z"), among = bans)?.until)
        assertNull(RentalCurfew.active(at = brentwood, on = at("2026-10-15T05:30:00Z"), among = bans))

        // Minneapolis from midnight, Central time; Raleigh from 23:00, Eastern time, on NC State's campus too; Birmingham from 23:00, Central time.
        val minneapolis = GeoPoint(latitude = 44.9778, longitude = -93.265)
        val ncState = GeoPoint(latitude = 35.7847, longitude = -78.6821)
        val birmingham = GeoPoint(latitude = 33.5186, longitude = -86.8104)
        assertNull(RentalCurfew.active(at = minneapolis, on = at("2026-10-15T04:59:00Z"), among = bans))
        assertEquals(at("2026-10-15T09:00:00Z"), RentalCurfew.active(at = minneapolis, on = at("2026-10-15T05:00:00Z"), among = bans)?.until)
        assertNull(RentalCurfew.active(at = ncState, on = at("2026-10-15T02:59:00Z"), among = bans))
        assertEquals(
            RentalCurfew.Active(city = "Raleigh", until = at("2026-10-15T10:00:00Z"), timeZone = ZoneId.of("America/New_York")),
            RentalCurfew.active(at = ncState, on = at("2026-10-15T03:00:00Z"), among = bans),
        )
        assertEquals(at("2026-10-15T11:00:00Z"), RentalCurfew.active(at = birmingham, on = at("2026-10-15T04:00:00Z"), among = bans)?.until)

        // The catalog's own, read as the app reads them: each holds inside one of its areas on one of its nights.
        for (ban in RentalCurfew.all) {
            val inside = ban.areas.asSequence().flatMap { area ->
                val south = area.minOf { it.latitude }
                val north = area.maxOf { it.latitude }
                val west = area.minOf { it.longitude }
                val east = area.maxOf { it.longitude }
                (1..31).asSequence().flatMap { i ->
                    (1..31).asSequence().map { j -> GeoPoint(south + (north - south) * i / 32, west + (east - west) * j / 32) }
                }
            }.firstOrNull { ban.contains(it) } ?: throw AssertionError("No point inside ${ban.city}'s areas")
            val zone = ZoneId.of(ban.timeZone)
            val night = ban.nights.first()
            val starts = (0L..6L).map {
                LocalDate.of(2026, 10, 12).plusDays(it).atTime(night.fromMinute / 60, night.fromMinute % 60).atZone(zone).toInstant()
            }
            assertTrue(ban.city, starts.any { RentalCurfew.active(at = inside, on = it) != null })
        }

        // The ban comes before every other notice, with a moon.
        val curfew = RentalCurfew.Active(city = "Oslo", until = at("2026-10-13T03:00:00Z"), timeZone = osloTime)
        assertEquals(
            listOf(ScooterDockNotice.Curfew(curfew), ScooterDockNotice.ProvidersDown(listOf(ScooterProvider.Bird))),
            ScooterDockNotice.notices(
                curfew = curfew,
                health = ScooterProviderHealth(downProviders = listOf(ScooterProvider.Bird), hasUnknownFailures = false),
                metadata = ScooterResponseMetadata(partial = true, failedSources = listOf("bird_oslo")),
                shownCount = 12,
            ),
        )
        assertEquals("moon.fill", ScooterDockNotice.Curfew(curfew).systemImage)
        assertTrue(ScooterDockNotice.Curfew(curfew).text.contains("Oslo"))
        assertTrue(ScooterDockNotice.Curfew(curfew).text.contains(ScooterDockStatus.clockTime(curfew.until, osloTime)))

        // By the city's clock, named after its zone where the phone's reads otherwise.
        val current = ScooterDateFormat.timeZone()
        val farAway = ZoneId.of(
            if (current.rules.getOffset(Instant.now()).totalSeconds == 14 * 3600) "Pacific/Pago_Pago" else "Pacific/Kiritimati",
        )
        val there = ScooterDockStatus.clockTime(curfew.until, farAway)
        assertNotEquals(ScooterDockStatus.clockTime(curfew.until), there)
        assertTrue(there, there.contains("GMT"))
        assertEquals(ScooterDockStatus.clockTime(curfew.until), ScooterDockStatus.clockTime(curfew.until, current))
        val farCurfew = RentalCurfew.Active(city = "Oslo", until = curfew.until, timeZone = farAway)
        assertTrue(ScooterDockNotice.Curfew(farCurfew).text.contains(there))
    }

    /**
     * The nights 9 towns close around public holidays besides their weekday nights, as the website reads them since 29
     * October 2026 (src/lib/rentalCurfews.test.ts, "holiday nights"; docs/curfew-holiday-nights.md; LOG-420).
     */
    @Test
    fun citiesBanRentingOnTheHolidayNightsTheyName() {
        assertEquals(
            listOf("2026-04-05", "2027-03-28", "2028-04-16"),
            listOf(2026, 2027, 2028).map { RentalCurfew.easterSunday(it).toString() },
        )
        assertEquals(LocalDate.of(2027, 5, 5), RentalCurfew.holidayEvening("easter+38", 2027))
        assertEquals(LocalDate.of(2027, 3, 24), RentalCurfew.holidayEvening("easter-4", 2027))
        assertEquals(
            listOf(LocalDate.of(2026, 6, 19), LocalDate.of(2027, 6, 25)),
            listOf(2026, 2027).map { RentalCurfew.holidayEvening("midsummerEve", it) },
        )
        assertEquals(LocalDate.of(2026, 12, 24), RentalCurfew.holidayEvening("12-24", 2026))
        assertNull(RentalCurfew.holidayEvening("christmas", 2026))

        // Every holiday date in the catalog reads.
        val dates = RentalCurfew.all.flatMap { curfew -> curfew.nights.flatMap { it.dates } }
        assertTrue(dates.isNotEmpty())
        for (date in dates) assertNotNull(date, RentalCurfew.holidayEvening(date, 2027))

        val oslo = ZoneId.of("Europe/Oslo")
        val helsinki = ZoneId.of("Europe/Helsinki")
        fun ban(point: GeoPoint, on: String) = RentalCurfew.active(at = point, on = at(on))
        val stavanger = GeoPoint(58.97, 5.7331)
        val tromso = GeoPoint(69.6492, 18.9553)
        val tonsberg = GeoPoint(59.2675, 10.4076)
        // Thursday 6 May 2027 is Ascension Day: 00:30 that morning in Stavanger, and not a week earlier.
        assertEquals(RentalCurfew.Active("Stavanger", at("2027-05-06T03:00:00Z"), oslo), ban(stavanger, "2027-05-05T22:30:00Z"))
        assertNull(ban(stavanger, "2027-04-28T22:30:00Z"))
        // Christmas Eve, Thursday 24 December 2026, 23:30 in Tromsø.
        assertEquals(RentalCurfew.Active("Tromsø", at("2026-12-25T05:00:00Z"), oslo), ban(tromso, "2026-12-24T22:30:00Z"))
        assertNull(ban(tromso, "2026-12-17T22:30:00Z"))
        // Tønsberg from 23:00 the night before Maundy Thursday 2027, from 01:00 a week earlier.
        assertEquals(RentalCurfew.Active("Tønsberg", at("2027-03-25T04:00:00Z"), oslo), ban(tonsberg, "2027-03-24T22:30:00Z"))
        assertNull(ban(tonsberg, "2027-03-17T22:30:00Z"))

        // Vappu night, Thursday 30 April 2026: Helsinki from 23:00, Espoo from midnight.
        val helsinkiCentre = GeoPoint(60.1699, 24.9384)
        val espoo = GeoPoint(60.2055, 24.6559)
        assertEquals(RentalCurfew.Active("Helsinki", at("2026-05-01T02:00:00Z"), helsinki), ban(helsinkiCentre, "2026-04-30T20:30:00Z"))
        assertNull(ban(espoo, "2026-04-30T20:30:00Z"))
        assertEquals("Espoo", ban(espoo, "2026-04-30T21:30:00Z")?.city)
        assertNull(ban(helsinkiCentre, "2026-04-23T20:30:00Z"))
        // Lahti, 00:30 on Midsummer Eve, Friday 19 June 2026, and a week earlier.
        val lahti = GeoPoint(60.9827, 25.6612)
        assertEquals(RentalCurfew.Active("Lahti", at("2026-06-19T02:00:00Z"), helsinki), ban(lahti, "2026-06-18T21:30:00Z"))
        assertNull(ban(lahti, "2026-06-11T21:30:00Z"))
        // Turku, 00:30 on New Year's Day 2027, a Friday: the night of New Year's Eve, a Thursday.
        val turku = GeoPoint(60.4518, 22.2666)
        assertEquals(RentalCurfew.Active("Turku", at("2027-01-01T03:00:00Z"), helsinki), ban(turku, "2026-12-31T22:30:00Z"))
        assertNull(ban(turku, "2026-12-24T22:30:00Z"))
    }

    @Test
    fun theDockNamesTheFadedAppsWithTheOldestTimeOfThoseNamed() {
        ScooterLanguage.current = ScooterLanguage.En
        val now = Instant.ofEpochSecond(1_790_000_000)
        fun app(provider: ScooterProvider, minutesAgo: Long, updating: Boolean) =
            ScooterFadedApp(provider, ScooterLastSeenStatus(now.minusSeconds(minutesAgo * 60), updating))
        val bird = app(ScooterProvider.Bird, minutesAgo = 5, updating = true)
        val lime = app(ScooterProvider.Lime, minutesAgo = 12, updating = true)
        val voi = app(ScooterProvider.Voi, minutesAgo = 30, updating = true)
        val time = { minutesAgo: Long -> ScooterDockStatus.seenTime(now.minusSeconds(minutesAgo * 60)) }

        // One, two, then any number of them updating.
        val one = unwrap(ScooterDockStatus.Updating.of(listOf(bird)))
        assertEquals("Bird updating · faded ones seen at ${time(5)}", one.text)
        val two = unwrap(ScooterDockStatus.Updating.of(listOf(bird, lime)))
        assertEquals("Bird and Lime updating · faded ones seen at ${time(12)}", two.text)
        val three = unwrap(ScooterDockStatus.Updating.of(listOf(bird, lime, voi)))
        assertEquals(ScooterDockStatus.Updating(listOf(ScooterProvider.Bird, ScooterProvider.Lime, ScooterProvider.Voi), now.minusSeconds(30 * 60)), three)
        assertEquals("Updating · faded ones seen at ${time(30)}", three.text)

        // Those updating are named, at their own oldest time, not the others'.
        val idleVoi = voi.copy(status = voi.status.copy(updating = false))
        assertEquals(ScooterDockStatus.Updating(listOf(ScooterProvider.Bird), bird.status.seenAt), ScooterDockStatus.Updating.of(listOf(bird, idleVoi)))
        assertNull(ScooterDockStatus.Updating.of(listOf(idleVoi)))
        assertNull(ScooterDockStatus.Updating.of(emptyList()))

        // None updating: whose they are and when they were seen.
        val idleBird = bird.copy(status = bird.status.copy(updating = false))
        val idleLime = lime.copy(status = lime.status.copy(updating = false))
        assertEquals("Voi: faded ones last seen at ${time(30)}", unwrap(ScooterDockStatus.LastSeen.of(listOf(idleVoi))).text)
        assertEquals("Bird and Lime: faded ones last seen at ${time(12)}", unwrap(ScooterDockStatus.LastSeen.of(listOf(idleBird, idleLime))).text)
        assertEquals("Faded ones last seen at ${time(30)}", unwrap(ScooterDockStatus.LastSeen.of(listOf(idleBird, idleLime, idleVoi))).text)
        assertNull(ScooterDockStatus.LastSeen.of(emptyList()))

        // In each language, with its own words.
        ScooterLanguage.current = ScooterLanguage.Fr
        assertEquals("Bird et Lime en mise à jour · en pâle, vues à ${time(12)}", two.text)
    }

    @Test
    fun dockStatusPrefersFailureThenDelayThenCityTotalsThenAge() {
        val updated = Instant.ofEpochSecond(1_790_000_000)
        fun summary(
            failure: ScooterLoadFailure? = null,
            overview: Boolean = false,
            delayed: Boolean = false,
        ): ScooterDockSummary = ScooterDockSummary(
            count = 22, countContext = ScooterCountContext.Nearby, lastUpdated = updated, refreshFailure = failure,
            isOverview = overview, isDelayed = delayed, notices = emptyList(), hint = null, chips = emptyList(),
        )
        fun status(after: Double): ScooterDockStatus? = summary().status(at = updated.addingTimeInterval(after))

        assertEquals(ScooterDockStatus.Live, status(after = 0.0))
        assertEquals(ScooterDockStatus.Live, status(after = 89.0))
        assertEquals(ScooterDockStatus.UpdatedMinutesAgo(1), status(after = 90.0))
        assertEquals(ScooterDockStatus.UpdatedMinutesAgo(2), status(after = 150.0))
        assertEquals(ScooterDockStatus.UpdatedMinutesAgo(59), status(after = 3_599.0))
        assertEquals(ScooterDockStatus.UpdatedAt(updated), status(after = 3_600.0))
        // A clock that runs behind the server still reads as live.
        assertEquals(ScooterDockStatus.Live, status(after = -30.0))

        val later = updated.addingTimeInterval(600.0)
        assertEquals(ScooterDockStatus.Delayed(showing = updated), summary(delayed = true).status(at = later))
        // Delayed from five minutes: younger, it reads like any other data.
        assertEquals(ScooterDockStatus.Live, summary(delayed = true).status(at = updated.addingTimeInterval(60.0)))
        assertEquals(ScooterDockStatus.UpdatedMinutesAgo(4), summary(delayed = true).status(at = updated.addingTimeInterval(299.0)))
        assertEquals(ScooterDockStatus.Delayed(showing = updated), summary(delayed = true).status(at = updated.addingTimeInterval(300.0)))
        assertEquals(ScooterDockStatus.CityTotals, summary(overview = true, delayed = true).status(at = updated.addingTimeInterval(60.0)))
        assertEquals(ScooterDockStatus.CityTotals, summary(overview = true).status(at = later))
        assertEquals(ScooterDockStatus.Delayed(showing = updated), summary(overview = true, delayed = true).status(at = later))
        assertEquals(
            ScooterDockStatus.Offline(showing = updated),
            summary(failure = ScooterLoadFailure.Offline, overview = true, delayed = true).status(at = later),
        )
        for (failure in ScooterLoadFailure.entries.filter { it != ScooterLoadFailure.Offline }) {
            assertEquals(ScooterDockStatus.RefreshFailed(showing = updated), summary(failure = failure).status(at = later))
        }
        assertTrue(summary(failure = ScooterLoadFailure.Busy).showsTryAgain)
        assertFalse(summary().showsTryAgain)

        // With every provider here down, there is no line, unless a refresh failed or the data is delayed.
        val down = summary().copy(everyProviderDown = true)
        assertNull(down.status(at = updated))
        assertNull(down.status(at = later))
        val downFailed = summary(failure = ScooterLoadFailure.Timeout).copy(everyProviderDown = true)
        assertEquals(ScooterDockStatus.RefreshFailed(showing = updated), downFailed.status(at = later))
        val downDelayed = summary(delayed = true).copy(everyProviderDown = true)
        assertEquals(ScooterDockStatus.Delayed(showing = updated), downDelayed.status(at = later))

        // While scooters stand faded where they were last seen and new positions are on their way, an update rather
        // than a delay or the city totals; a failure first.
        val seenAt = updated.addingTimeInterval(-900.0)
        val bird = ScooterFadedApp(ScooterProvider.Bird, ScooterLastSeenStatus(seenAt, updating = true))
        val updating = summary(overview = true, delayed = true).copy(fadedApps = listOf(bird))
        assertEquals(ScooterDockStatus.Updating(listOf(ScooterProvider.Bird), seenAt = seenAt), updating.status(at = later))
        assertEquals(true, updating.status(at = later)?.isUpdating)
        assertEquals(false, updating.status(at = later)?.isWarning)
        val updatingFailed = summary(failure = ScooterLoadFailure.Timeout).copy(fadedApps = listOf(bird))
        assertEquals(ScooterDockStatus.RefreshFailed(showing = updated), updatingFailed.status(at = later))
        assertEquals(false, ScooterDockStatus.Live.isUpdating)

        // Nothing on its way for them: after a delay and the city totals, before the age of the data.
        val idle = ScooterFadedApp(ScooterProvider.Bird, ScooterLastSeenStatus(seenAt, updating = false))
        val lastSeen = ScooterDockStatus.LastSeen(listOf(ScooterProvider.Bird), seenAt = seenAt)
        assertEquals(lastSeen, summary().copy(fadedApps = listOf(idle)).status(at = later))
        assertEquals(lastSeen, summary().copy(fadedApps = listOf(idle)).status(at = updated))
        assertEquals(true, lastSeen.isLastSeen)
        assertEquals(false, lastSeen.isUpdating)
        assertEquals(false, lastSeen.isWarning)
        assertEquals(ScooterDockStatus.Delayed(showing = updated), summary(delayed = true).copy(fadedApps = listOf(idle)).status(at = later))
        assertEquals(ScooterDockStatus.CityTotals, summary(overview = true).copy(fadedApps = listOf(idle)).status(at = later))
        assertEquals(
            ScooterDockStatus.RefreshFailed(showing = updated),
            summary(failure = ScooterLoadFailure.Timeout).copy(fadedApps = listOf(idle)).status(at = later),
        )
        // Said even with every provider here down: the faded ones are theirs.
        assertEquals(lastSeen, summary().copy(everyProviderDown = true, fadedApps = listOf(idle)).status(at = later))

        // Seen on another day, as a Lime group swept days ago: with the day of the week.
        val utc = ZoneOffset.UTC
        assertEquals(ScooterDockStatus.clockTime(seenAt), ScooterDockStatus.seenTime(seenAt, now = later, zone = utc))
        val daysAgo = updated.addingTimeInterval(-50 * 3_600.0)
        val withDay = ScooterDockStatus.seenTime(daysAgo, now = updated, zone = utc)
        assertNotEquals(ScooterDockStatus.clockTime(daysAgo), withDay)
        assertTrue(withDay, withDay.endsWith(ScooterDockStatus.clockTime(daysAgo)))
    }

    @Test
    fun delayedDataNamesTheOneAppLateWhenTheServerSaysWhichAre() {
        val now = Instant.ofEpochSecond(1_790_000_000)
        val updated = now.addingTimeInterval(-720.0)
        fun summary(apps: Map<ScooterProvider, Instant>?, delayed: Boolean = true): ScooterDockSummary = ScooterDockSummary(
            count = 22, countContext = ScooterCountContext.Nearby, lastUpdated = updated, refreshFailure = null,
            isOverview = false, isDelayed = delayed, notices = emptyList(), hint = null, chips = emptyList(),
            staleApps = apps,
        )
        val minuteAgo = now.addingTimeInterval(-60.0)
        val sevenMinutesAgo = now.addingTimeInterval(-420.0)

        // Lime's positions 12 minutes old; Voi's, collected again, a minute old: Lime is named, from its own time.
        val lime = ScooterDockStatus.Delayed(showing = updated, provider = ScooterProvider.Lime)
        assertEquals(lime, summary(mapOf(ScooterProvider.Lime to updated, ScooterProvider.Voi to minuteAgo)).status(at = now))
        assertEquals("Lime data delayed · showing ${ScooterDockStatus.clockTime(updated)}", lime.text)
        assertEquals(lime.text, lime.briefText)
        assertFalse(lime.isWarning)
        assertFalse(lime.isLive)
        // One late among the faded scooters' time: from its own, not the answer's.
        assertEquals(
            ScooterDockStatus.Delayed(showing = sevenMinutesAgo, provider = ScooterProvider.Voi),
            summary(mapOf(ScooterProvider.Voi to sevenMinutesAgo)).status(at = now),
        )
        // A time ahead of the clock is taken as now: not late.
        assertEquals(ScooterDockStatus.UpdatedMinutesAgo(12), summary(mapOf(ScooterProvider.Voi to now.addingTimeInterval(600.0))).status(at = now))

        // Two late: the data is, from the older's time, whatever their order.
        val two = ScooterDockStatus.Delayed(showing = updated)
        assertEquals(two, summary(mapOf(ScooterProvider.Voi to sevenMinutesAgo, ScooterProvider.Lime to updated)).status(at = now))
        assertEquals("Data delayed · showing ${ScooterDockStatus.clockTime(updated)}", two.text)

        // None late: of the apps named, none for five minutes, or none at all (one filtered out is not given).
        assertEquals(ScooterDockStatus.UpdatedMinutesAgo(12), summary(mapOf(ScooterProvider.Voi to minuteAgo)).status(at = now))
        assertEquals(ScooterDockStatus.UpdatedMinutesAgo(12), summary(emptyMap()).status(at = now))

        // Not named, as city totals, a kept answer or an older server: from the answer's own time, as before.
        assertEquals(ScooterDockStatus.Delayed(showing = updated), summary(apps = null).status(at = now))
        assertEquals(ScooterDockStatus.Live, summary(apps = null).status(at = updated.addingTimeInterval(60.0)))
        // Data the server renewed is not delayed, whatever it names.
        assertEquals(ScooterDockStatus.UpdatedMinutesAgo(12), summary(mapOf(ScooterProvider.Lime to updated), delayed = false).status(at = now))
        // A failure still comes first.
        assertEquals(
            ScooterDockStatus.Offline(showing = updated),
            summary(mapOf(ScooterProvider.Lime to updated)).copy(refreshFailure = ScooterLoadFailure.Offline).status(at = now),
        )

        // In each language, with its own words.
        ScooterLanguage.current = ScooterLanguage.Fr
        assertEquals("Données Lime retardées · actualisées à ${ScooterDockStatus.clockTime(updated)}", lime.text)
        ScooterLanguage.current = ScooterLanguage.De
        assertEquals("Lime-Daten verzögert · Stand ${ScooterDockStatus.clockTime(updated)}", lime.text)
    }

    @Test
    fun dockStatusTextCarriesTheTimeOrTheMinutes() {
        val updated = Instant.ofEpochSecond(1_790_000_000)
        val time = ScooterDockStatus.clockTime(updated)

        assertFalse(time.isEmpty())
        for (status in listOf(
            ScooterDockStatus.RefreshFailed(showing = updated),
            ScooterDockStatus.Offline(showing = updated),
            ScooterDockStatus.Delayed(showing = updated),
            ScooterDockStatus.UpdatedAt(updated),
        )) {
            assertTrue(status.text, status.text.contains(time))
        }
        assertTrue(ScooterDockStatus.UpdatedMinutesAgo(7).text.contains("7"))
        assertEquals(localized("Live"), ScooterDockStatus.Live.text)
        assertEquals(localized("City totals · refreshed hourly"), ScooterDockStatus.CityTotals.text)

        assertTrue(ScooterDockStatus.Live.isLive)
        assertFalse(ScooterDockStatus.UpdatedMinutesAgo(2).isLive)
        assertTrue(ScooterDockStatus.RefreshFailed(showing = updated).isWarning)
        assertTrue(ScooterDockStatus.Offline(showing = updated).isWarning)
        assertFalse(ScooterDockStatus.Delayed(showing = updated).isWarning)

        val body = ScooterDockStatus.outOfDateBody(ScooterLoadFailure.Offline, lastUpdate = updated)
        assertTrue(body.contains(time))
        assertTrue(body.endsWith(ScooterLoadFailure.Offline.message))
    }

    // Closest cities, parking bays, the search bar and city totals.

    @Test
    fun closestCityLabelsShowWholeKilometres() {
        // Among the tests' own cities (TestCatalog), where no operator serves Lungern: data/ adds towns nearer it (LOG-370).
        val lungern = GeoPoint(latitude = 46.7741, longitude = 8.1558)
        val closest = ScooterCityCatalog.nearest(to = lungern, count = 3, among = TestCatalog.catalog.cities)

        assertEquals(listOf("Bern", "Wädenswil", "Zürich"), closest.map { it.city.name })
        val bern = closest.first()
        val swiss = bern.formattedDistance(locale = Locale.forLanguageTag("en-CH"))
        assertEquals("57 km", plainSpaces(swiss))
        assertEquals("36 mi", plainSpaces(bern.formattedDistance(locale = Locale.forLanguageTag("en-US"))))
        assertEquals(bern.formattedDistance(locale = ScooterLanguage.current.locale), bern.formattedDistance)
        assertTrue(bern.label.startsWith("Bern"))
        assertTrue(bern.label.endsWith(bern.formattedDistance))
        assertFalse(TestCatalog.catalog.contains(lungern))
        // Without cities of its own it reads the generated catalog's, where each city is nearest its own centre.
        val city = ScooterCityCatalog.cities.first()
        assertEquals(0.0, ScooterCityCatalog.nearest(to = city.center, count = 1).single().distanceMeters, 0.0)

        val place = bern.city.destination
        assertEquals("Bern", place.title)
        assertEquals(bern.city.center, place.point)
        assertEquals(MapDestination.Kind.City, place.kind)
        assertFalse(place.subtitle.isEmpty())
        assertNotEquals("CH", place.subtitle)
    }

    @Test
    fun parkingBayCardNamesTheProviderAndTheRule() {
        val mandatory = ScooterParking(
            id = "dott:bay", provider = "dott", name = "Rue Faidherbe",
            latitude = 50.6365, longitude = 3.0635, mandatory = true,
        )
        val optional = ScooterParking(
            id = "lime:bay", provider = "lime", name = "Place",
            latitude = 50.6365, longitude = 3.0635, mandatory = false,
        )

        assertEquals(ScooterProvider.Dott, mandatory.providerInfo)
        assertTrue(mandatory.bayTitle.contains("Dott"))
        assertTrue(mandatory.footnote.contains("Dott"))
        assertNotEquals(mandatory.bayTitle, mandatory.footnote)
        assertEquals(localized("You must park in a bay in this zone."), mandatory.notice)
        assertEquals(localized("Designated scooter parking."), optional.notice)
    }

    @Test
    fun locationCardsOfferTheActionsThatCanHelp() {
        assertNotNull(ScooterLocationIssue.Denied.title)
        assertTrue(ScooterLocationIssue.Denied.canOpenSettings)
        assertTrue(ScooterLocationIssue.Denied.canSearchPlace)
        assertFalse(ScooterLocationIssue.Denied.canRetry)

        assertNull(ScooterLocationIssue.Restricted.title)
        assertFalse(ScooterLocationIssue.Restricted.canOpenSettings)
        assertTrue(ScooterLocationIssue.Restricted.canSearchPlace)

        assertNull(ScooterLocationIssue.NotFound.title)
        assertTrue(ScooterLocationIssue.NotFound.canRetry)
        assertFalse(ScooterLocationIssue.NotFound.canSearchPlace)

        val messages = listOf(ScooterLocationIssue.Denied, ScooterLocationIssue.Restricted, ScooterLocationIssue.NotFound).map { it.message }
        assertEquals(3, messages.toSet().size)
    }

    @Test
    fun searchBarStatesHaveTheirOwnLines() {
        val place = MapDestination(title = "Zürich HB", point = GeoPoint(latitude = 47.3782, longitude = 8.5402))

        assertNull(ScooterSearchBarState.Empty.subtitle)
        assertNull(ScooterSearchBarState.Locating.subtitle)
        assertEquals("Zürich HB", ScooterSearchBarState.Place(place).title)
        assertNotNull(ScooterSearchBarState.Place(place).subtitle)
        assertTrue(ScooterSearchBarState.Place(place).accessibilityLabel.contains("Zürich HB"))
        assertEquals("", place.subtitle)
        assertEquals(MapDestination.Kind.Address, place.kind)
    }

    @Test
    fun searchBarPromisesScootersOnlyWhereThereIsScooterData() {
        val zurich = MapDestination(title = "Zürich HB", point = GeoPoint(latitude = 47.3782, longitude = 8.5402))
        val atlantic = MapDestination(title = "Atlantic", point = GeoPoint(latitude = 30.0, longitude = -40.0))
        val neutral = localized("Tap to search a city or address")

        // The service areas bundled with the app decide when the search did not say: Zürich's, which Switzerland's
        // open data has had from the start and data/ will not drop, and none in the middle of the Atlantic (LOG-370).
        assertTrue(zurich.isCovered)
        assertFalse(atlantic.isCovered)

        val served = ScooterSearchBarState.Place(zurich)
        assertEquals(localized("Scooters near this place"), served.subtitle)
        assertNotEquals(neutral, served.subtitle)

        // Where no operator shares data the bar keeps to the neutral line, and TalkBack to the place.
        val unserved = ScooterSearchBarState.Place(atlantic)
        assertEquals(neutral, unserved.subtitle)
        assertEquals("Atlantic", unserved.accessibilityLabel)
        assertEquals(
            stringFormat(localized("Showing scooters near %@"), "Zürich HB"),
            served.accessibilityLabel,
        )
        // What a tap does is the hint, not part of the label: Android's words after TalkBack's own for a double tap.
        assertEquals(localized("search for another place"), served.accessibilityHint)
        assertEquals(served.accessibilityHint, unserved.accessibilityHint)
        assertNull(ScooterSearchBarState.Empty.accessibilityHint)
        assertNull(ScooterSearchBarState.Locating.accessibilityHint)

        // The search's own answer wins over the bundled areas, and a covered city is always served.
        val reportedUnserved = MapDestination(title = "Zürich HB", point = zurich.point, isCovered = false)
        assertEquals(neutral, ScooterSearchBarState.Place(reportedUnserved).subtitle)
        val city = ScooterCityCatalog.cities.first()
        assertTrue(city.destination.isCovered)
    }

    @Test
    fun neighbouringCityTotalsAreDrawnAsOneOnTheLargest() {
        val paris = ScooterCluster(
            id = "city:Paris", latitude = 48.8566, longitude = 2.3522, count = 4000,
            providers = mapOf("dott" to 3000, "lime" to 1000), city = "Paris",
        )
        val boulogne = ScooterCluster(
            id = "city:Boulogne", latitude = 48.8397, longitude = 2.2399, count = 200,
            providers = mapOf("dott" to 200), city = "Boulogne",
        )
        val lyon = ScooterCluster(
            id = "city:Lyon", latitude = 45.764, longitude = 4.8357, count = 900,
            providers = mapOf("voi" to 900), city = "Lyon",
        )

        val grouped = ScooterCityGrouping.group(listOf(boulogne, lyon, paris), zoomLevel = 6.0)
        assertEquals(2, grouped.size)
        assertEquals("group:city:Paris", grouped[0].id)
        assertEquals("Paris, Boulogne", grouped[0].city)
        assertEquals(paris.latitude, grouped[0].latitude, 0.0)
        assertEquals(4200, grouped[0].count)
        assertEquals(mapOf("dott" to 3200, "lime" to 1000), grouped[0].providers)
        assertEquals(
            GeoBounds(south = boulogne.latitude, west = boulogne.longitude, north = paris.latitude, east = paris.longitude),
            grouped[0].bounds,
        )
        assertEquals(lyon, grouped[1])

        assertEquals(listOf(paris, lyon, boulogne), ScooterCityGrouping.group(listOf(paris, boulogne, lyon), zoomLevel = 12.0))
    }

    @Test
    fun zoomedOutToAContinentEachCountryIsOneTotal() {
        val paris = ScooterCluster(
            id = "city:fr:Paris", latitude = 48.8566, longitude = 2.3522, count = 3000,
            providers = mapOf("dott" to 3000), city = "Paris",
        )
        val bordeaux = ScooterCluster(
            id = "city:fr:Bordeaux", latitude = 44.8378, longitude = -0.5792, count = 500,
            providers = mapOf("dott" to 500), city = "Bordeaux",
        )
        val berlin = ScooterCluster(
            id = "city:de:Berlin", latitude = 52.52, longitude = 13.405, count = 700,
            providers = mapOf("voi" to 700), city = "Berlin",
        )
        val names = mapOf("fr" to "France", "de" to "Germany")

        val totals = ScooterCityGrouping.group(listOf(paris, bordeaux, berlin), zoomLevel = 4.0) { names.getValue(it) }
        assertEquals(listOf("country:fr", "country:de"), totals.map { it.id })
        assertEquals("France", totals[0].city)
        assertEquals(3500, totals[0].count)
        assertEquals(46.6, totals[0].latitude, 0.0)
        assertEquals(
            GeoBounds(south = bordeaux.latitude, west = bordeaux.longitude, north = paris.latitude, east = paris.longitude),
            totals[0].bounds,
        )

        assertEquals(
            listOf("city:fr:Paris", "city:fr:Bordeaux"),
            ScooterCityGrouping.group(listOf(paris, bordeaux), zoomLevel = 5.0).map { it.id },
        )
    }

    @Test
    fun theIdOfATownInACountryWithStatesNamesItsCountryFirst() {
        // Two towns of one name, told apart by their state.
        val oregon = ScooterCluster(
            id = "city:us:or:Portland", latitude = 45.52, longitude = -122.68, count = 900,
            providers = mapOf("lime" to 900), city = "Portland, OR",
        )
        val maine = ScooterCluster(
            id = "city:us:me:Portland", latitude = 43.66, longitude = -70.26, count = 100,
            providers = mapOf("lime" to 100), city = "Portland, ME",
        )
        assertEquals("us", ScooterCityGrouping.country(of = oregon))
        assertEquals("us", ScooterCityGrouping.country(of = maine))
        assertNull(
            ScooterCityGrouping.country(
                of = ScooterCluster(
                    id = "group:city:us:or:Portland", latitude = 45.52, longitude = -122.68, count = 1, providers = emptyMap(), city = null,
                ),
            ),
        )

        // Without state totals, as Mexico, one for the country.
        val totals = ScooterCityGrouping.group(listOf(maine, oregon), zoomLevel = 3.0, regions = emptyMap())
        assertEquals(listOf("country:us"), totals.map { it.id })
        assertEquals(1000, totals[0].count)
        assertEquals(
            listOf("city:us:or:Portland", "city:us:me:Portland"),
            ScooterCityGrouping.group(listOf(maine, oregon), zoomLevel = 6.0).map { it.id },
        )
    }

    @Test
    fun zoomedOutACountryWithStateTotalsShowsOnePerState() {
        // As data/countries.json would list the United States' states, with California, whose code is Canada's.
        val regions = mapOf(
            "us" to mapOf(
                "ca" to ScooterRegion(name = "California", names = mapOf("de" to "Kalifornien", "fr" to "Californie"), latitude = 36.8, longitude = -119.4),
                "me" to ScooterRegion(name = "Maine", latitude = 45.3, longitude = -69.2),
                "or" to ScooterRegion(name = "Oregon", latitude = 43.9, longitude = -120.6),
            ),
        )
        fun city(id: String, latitude: Double, longitude: Double, count: Int): ScooterCluster = ScooterCluster(
            id = "city:$id", latitude = latitude, longitude = longitude, count = count,
            providers = mapOf("lime" to count), city = id,
        )
        val cities = listOf(
            city("us:or:Portland", 45.52, -122.68, 900), city("us:me:Portland", 43.66, -70.26, 100),
            city("us:me:South Portland", 43.63, -70.29, 50), city("us:ca:Los Angeles", 34.05, -118.24, 2000),
            city("fr:Lyon", 45.76, 4.84, 500),
        )
        val names = mapOf("us" to "États-Unis", "fr" to "France")

        val states = ScooterCityGrouping.group(cities, zoomLevel = 4.0, language = ScooterLanguage.Fr, regions = regions) { names.getValue(it) }
        assertEquals(listOf("region:us:ca", "region:us:or", "country:fr", "region:us:me"), states.map { it.id })
        assertEquals(listOf("Californie", "Oregon", "France", "Maine"), states.map { it.city })
        assertEquals(36.8, states[0].latitude, 0.0)
        assertEquals(150, states[3].count)
        assertEquals(GeoBounds(south = 43.63, west = -70.29, north = 43.66, east = -70.26), states[3].bounds)
        assertEquals(
            listOf("Kalifornien", "Oregon", "France", "Maine"),
            ScooterCityGrouping.group(cities, zoomLevel = 3.0, language = ScooterLanguage.De, regions = regions) { names.getValue(it) }
                .map { it.city },
        )

        // Zoomed out to the world, the country is one total again.
        val world = ScooterCityGrouping.group(cities, zoomLevel = 2.9, language = ScooterLanguage.Fr, regions = regions) { names.getValue(it) }
        assertEquals(listOf("country:us", "country:fr"), world.map { it.id })
        assertEquals(3050, world[0].count)
        // The generated catalog gives the United States its states' totals; without them, as Mexico, one for the country.
        // The states are every one of the country's (data/countries.json), which no change to its cities takes away.
        assertEquals(
            listOf("region:us:ca", "region:us:or", "country:fr", "region:us:me"),
            ScooterCityGrouping.group(cities, zoomLevel = 4.0).map { it.id },
        )
        assertEquals(
            listOf("country:us", "country:fr"),
            ScooterCityGrouping.group(cities, zoomLevel = 4.0, regions = emptyMap()).map { it.id },
        )
        assertNull(ScooterCityGrouping.region(of = cities[4], regions = regions))
        assertEquals("or", ScooterCityGrouping.region(of = cities[0], regions = regions)?.first)
    }

    // Cities whose scooters stop for the winter, as the catalogs' `seasonal` windows say.

    private val winter = ScooterSeasonalPause(from = "11-16", until = "04-15", timeZone = "America/Toronto")
    private val early = ScooterSeasonalPause(from = "12-01", until = "04-01", timeZone = "America/Toronto")

    // Bird stops in Montréal on 16 November, Lime on 1 December; Lime runs in Laval all year.
    private val quebec = listOf(
        ScooterCity(
            id = "ca:Montréal", name = "Montréal", countryCode = "CA", center = GeoPoint(latitude = 45.5, longitude = -73.57),
            bounds = GeoBounds(south = 45.41, west = -73.98, north = 45.7, east = -73.47), pauses = listOf(winter, early),
        ),
        ScooterCity(
            id = "ca:Laval", name = "Laval", countryCode = "CA", center = GeoPoint(latitude = 45.58, longitude = -73.75),
            bounds = GeoBounds(south = 45.52, west = -73.89, north = 45.7, east = -73.52),
        ),
    )

    private fun at(text: String): Instant = Instant.parse(text)

    @Test
    fun aSeasonalPauseHoldsInItsTimeZoneAcrossTheNewYear() {
        // Midnight in Montréal is 05:00 UTC in November, 04:00 in April.
        assertFalse(winter.holds(on = at("2026-11-16T04:59:00Z")))
        assertTrue(winter.holds(on = at("2026-11-16T05:00:00Z")))
        assertTrue(winter.holds(on = at("2027-01-20T17:00:00Z")))
        assertTrue(winter.holds(on = at("2027-04-15T03:59:00Z")))
        assertFalse(winter.holds(on = at("2027-04-15T04:00:00Z")))
        assertFalse(winter.holds(on = at("2026-07-20T16:00:00Z")))
        val summer = ScooterSeasonalPause(from = "06-01", until = "09-01", timeZone = "Europe/Oslo")
        assertTrue(summer.holds(on = at("2026-07-20T16:00:00Z")))
        assertFalse(summer.holds(on = at("2027-01-20T17:00:00Z")))

        // Back with the soonest of the pauses, once every one holds.
        val january = at("2027-01-20T17:00:00Z")
        assertEquals(ScooterSeasonalPause.Return.Month(4), ScooterSeasonalPause.back(listOf(winter, early), on = january))
        assertEquals(
            ScooterSeasonalPause.Return.Month(3),
            ScooterSeasonalPause.back(
                listOf(winter, ScooterSeasonalPause(from = "12-01", until = "03-10", timeZone = "America/Toronto")),
                on = january,
            ),
        )
        assertNull(ScooterSeasonalPause.back(listOf(winter, early), on = at("2026-11-20T17:00:00Z")))
        assertNull(ScooterSeasonalPause.back(emptyList(), on = january))
    }

    @Test
    fun theDockSaysWhenTheScootersOfACityInItsPauseAreBack() {
        val montreal = GeoPoint(latitude = 45.5, longitude = -73.57)
        val january = at("2027-01-20T17:00:00Z")

        val season = ScooterSeasonalPause.active(at = montreal, on = january, among = quebec)!!
        assertEquals(ScooterSeasonalPause.Active(city = "Montréal", back = ScooterSeasonalPause.Return.Month(4)), season)
        // Lime runs until December, Laval all year, and Laval's bounds take in the north of Montréal.
        assertNull(ScooterSeasonalPause.active(at = montreal, on = at("2026-11-20T17:00:00Z"), among = quebec))
        assertNull(ScooterSeasonalPause.active(at = montreal, on = at("2026-07-20T16:00:00Z"), among = quebec))
        assertNull(ScooterSeasonalPause.active(at = GeoPoint(latitude = 45.65, longitude = -73.6), on = january, among = quebec))
        // Tignes pauses from 8 September until 22 June, South Lake Tahoe from 1 November until 1 May, Ottawa from
        // 16 November until 30 April, Dalvík from 21 October and Leduc from 22 October until 1 May, and Bodø from
        // 1 December until 1 April, each by its own clock: as data/ had them on 28 October 2026, whose towns' pauses
        // come and go (LOG-370). The catalog's own follow.
        fun town(id: String, name: String, latitude: Double, longitude: Double, from: String, until: String, timeZone: String) =
            ScooterCity(
                id = id, name = name, countryCode = id.take(2).uppercase(), center = GeoPoint(latitude, longitude),
                bounds = GeoBounds(south = latitude - 0.05, west = longitude - 0.05, north = latitude + 0.05, east = longitude + 0.05),
                pauses = listOf(ScooterSeasonalPause(from = from, until = until, timeZone = timeZone)),
            )
        val pausedTowns = listOf(
            town("fr:Tignes", "Tignes", 45.4687, 6.9063, "09-08", "06-22", "Europe/Paris"),
            town("us:ca:South Lake Tahoe", "South Lake Tahoe, CA", 38.93324, -119.98435, "11-01", "05-01", "America/Los_Angeles"),
            town("ca:on:Ottawa", "Ottawa, ON", 45.4215, -75.6972, "11-16", "04-30", "America/Toronto"),
            town("is:Dalvík", "Dalvík", 65.9711, -18.5304, "10-21", "05-01", "Atlantic/Reykjavik"),
            town("ca:ab:Leduc", "Leduc, AB", 53.2645, -113.5593, "10-22", "05-01", "America/Edmonton"),
            town("no:Bodø", "Bodø", 67.2804, 14.4049, "12-01", "04-01", "Europe/Oslo"),
        )
        val tignes = GeoPoint(latitude = 45.4687, longitude = 6.9063)
        assertEquals(
            ScooterSeasonalPause.Active(city = "Tignes", back = ScooterSeasonalPause.Return.Month(6)),
            ScooterSeasonalPause.active(at = tignes, on = january, among = pausedTowns),
        )
        assertNull(ScooterSeasonalPause.active(at = tignes, on = at("2026-09-07T21:30:00Z"), among = pausedTowns))
        assertNotNull(ScooterSeasonalPause.active(at = tignes, on = at("2026-09-07T22:30:00Z"), among = pausedTowns))
        assertNull(ScooterSeasonalPause.active(at = tignes, on = at("2027-06-22T12:00:00Z"), among = pausedTowns))
        // South Lake Tahoe's code takes the scooters away from 1 November through 30 April, Pacific time.
        val tahoe = GeoPoint(latitude = 38.93324, longitude = -119.98435)
        assertEquals(
            ScooterSeasonalPause.Active(city = "South Lake Tahoe, CA", back = ScooterSeasonalPause.Return.Month(5)),
            ScooterSeasonalPause.active(at = tahoe, on = january, among = pausedTowns),
        )
        assertNull(ScooterSeasonalPause.active(at = tahoe, on = at("2026-11-01T06:30:00Z"), among = pausedTowns))
        assertNotNull(ScooterSeasonalPause.active(at = tahoe, on = at("2026-11-01T07:30:00Z"), among = pausedTowns))
        assertNull(ScooterSeasonalPause.active(at = tahoe, on = at("2027-05-01T12:00:00Z"), among = pausedTowns))
        val ottawa = GeoPoint(latitude = 45.4215, longitude = -75.6972)
        assertEquals(
            ScooterSeasonalPause.Active(city = "Ottawa, ON", back = ScooterSeasonalPause.Return.Month(4)),
            ScooterSeasonalPause.active(at = ottawa, on = january, among = pausedTowns),
        )
        assertNull(ScooterSeasonalPause.active(at = ottawa, on = at("2026-11-16T04:30:00Z"), among = pausedTowns))
        assertNotNull(ScooterSeasonalPause.active(at = ottawa, on = at("2026-11-16T05:30:00Z"), among = pausedTowns))
        assertNull(ScooterSeasonalPause.active(at = ottawa, on = at("2027-04-30T12:00:00Z"), among = pausedTowns))
        // Iceland keeps UTC all year; Leduc is six hours behind it in October.
        val dalvik = GeoPoint(latitude = 65.9711, longitude = -18.5304)
        assertEquals(
            ScooterSeasonalPause.Active(city = "Dalvík", back = ScooterSeasonalPause.Return.Month(5)),
            ScooterSeasonalPause.active(at = dalvik, on = january, among = pausedTowns),
        )
        assertNull(ScooterSeasonalPause.active(at = dalvik, on = at("2026-10-20T23:30:00Z"), among = pausedTowns))
        assertNotNull(ScooterSeasonalPause.active(at = dalvik, on = at("2026-10-21T00:30:00Z"), among = pausedTowns))
        val leduc = GeoPoint(latitude = 53.2645, longitude = -113.5593)
        assertEquals(
            ScooterSeasonalPause.Active(city = "Leduc, AB", back = ScooterSeasonalPause.Return.Month(5)),
            ScooterSeasonalPause.active(at = leduc, on = january, among = pausedTowns),
        )
        assertNull(ScooterSeasonalPause.active(at = leduc, on = at("2026-10-22T05:30:00Z"), among = pausedTowns))
        assertNotNull(ScooterSeasonalPause.active(at = leduc, on = at("2026-10-22T06:30:00Z"), among = pausedTowns))
        assertNull(ScooterSeasonalPause.active(at = leduc, on = at("2027-05-01T18:00:00Z"), among = pausedTowns))
        // Bodø keeps Oslo's clock, one hour ahead of UTC in winter.
        val bodo = GeoPoint(latitude = 67.2804, longitude = 14.4049)
        assertEquals(
            ScooterSeasonalPause.Active(city = "Bodø", back = ScooterSeasonalPause.Return.Month(4)),
            ScooterSeasonalPause.active(at = bodo, on = january, among = pausedTowns),
        )
        assertNull(ScooterSeasonalPause.active(at = bodo, on = at("2026-11-30T22:30:00Z"), among = pausedTowns))
        assertNotNull(ScooterSeasonalPause.active(at = bodo, on = at("2026-11-30T23:30:00Z"), among = pausedTowns))
        assertNull(ScooterSeasonalPause.active(at = bodo, on = at("2027-04-01T12:00:00Z"), among = pausedTowns))

        // The catalog's own, which data/ pauses and lets go: each is away for the season on a day of the year, and the
        // app finds it there unless another city's bounds reach the spot.
        val cities = ScooterCityCatalog.cities
        val days = (0L until 366L).map { at("2026-07-01T12:00:00Z").plusSeconds(it * 86_400) }
        for (city in cities.filter { it.pauses.isNotEmpty() }) {
            val day = days.firstOrNull { ScooterSeasonalPause.back(city.pauses, on = it) != null }
                ?: throw AssertionError("${city.id} is never away")
            val spot = city.bounds.center
            val away = ScooterSeasonalPause.active(at = spot, on = day, among = listOf(city))
            assertEquals(city.id, city.name, away?.city)
            if (cities.none { it !== city && it.bounds.contains(spot) }) {
                assertEquals(city.id, away, ScooterSeasonalPause.active(at = spot, on = day))
            }
        }

        // After a night ban, before providers down, with a calendar, calm.
        assertEquals(
            listOf(ScooterDockNotice.Season(season), ScooterDockNotice.ProvidersDown(listOf(ScooterProvider.Lime))),
            ScooterDockNotice.notices(
                season = season,
                health = ScooterProviderHealth(downProviders = listOf(ScooterProvider.Lime), hasUnknownFailures = false),
                metadata = ScooterResponseMetadata(partial = true, failedSources = listOf("canada:lime_quebec")),
                shownCount = 0,
            ),
        )
        assertEquals("calendar", ScooterDockNotice.Season(season).systemImage)
        assertTrue(ScooterDockNotice.Season(season).isCalm)
        assertFalse(ScooterDockNotice.ParkingUnavailable.isCalm)

        val sentences = mapOf(
            ScooterLanguage.En to "Off season in Montréal: scooters are back in April",
            ScooterLanguage.De to "Saisonpause in Montréal: Scooter wieder im April",
            ScooterLanguage.Fr to "Pause saisonnière à Montréal : retour des trottinettes en avril",
            ScooterLanguage.It to "Pausa stagionale a Montréal: monopattini di nuovo in aprile",
            ScooterLanguage.Nl to "Seizoenspauze in Montréal: deelsteps weer in april",
            ScooterLanguage.Nb to "Sesongpause i Montréal: elsparkesykler igjen i april",
            ScooterLanguage.Pt to "Pausa sazonal em Montréal: trotinetes de volta em abril",
            ScooterLanguage.Es to "Pausa de temporada en Montréal: los patinetes vuelven en abril",
            ScooterLanguage.Is to "Montréal: árstíðabundið hlé, rafskúturnar koma aftur í apríl",
        )
        assertEquals(ScooterLanguage.entries.toSet(), sentences.keys)
        for ((language, sentence) in sentences) {
            ScooterLanguage.current = language
            // Spanish says scooter where the phone's region is in Latin America or the US.
            assertEquals(language.rawValue, language.written(sentence, language.locale.country), ScooterDockNotice.Season(season).text)
        }
    }

    @Test
    fun aPauseUntilTheStreetsAreClearHoldsUntilMayAtTheLatestAndComesBackEachWinter() {
        // Skien's: from 15 December, back once the streets are clear of snow and ice.
        val clear = ScooterSeasonalPause(from = "12-15", until = "clear", timeZone = "Europe/Oslo")
        // Midnight in Oslo is 23:00 UTC in December, 22:00 in April.
        assertFalse(clear.holds(on = at("2026-12-14T22:59:00Z")))
        assertTrue(clear.holds(on = at("2026-12-14T23:00:00Z")))
        assertTrue(clear.holds(on = at("2027-03-20T12:00:00Z")))
        assertTrue(clear.holds(on = at("2027-04-30T21:59:00Z")))
        assertFalse(clear.holds(on = at("2027-04-30T22:00:00Z")))
        assertFalse(clear.holds(on = at("2027-10-18T12:00:00Z")))
        assertTrue(clear.holds(on = at("2027-12-15T12:00:00Z")))

        // It says since when rather than a month, and goes first, as it may end any day.
        val january = at("2027-01-20T12:00:00Z")
        val trondheim = ScooterSeasonalPause(from = "12-02", until = "03-15", timeZone = "Europe/Oslo")
        assertEquals(ScooterSeasonalPause.Return.Clear(from = "12-15"), ScooterSeasonalPause.back(listOf(clear), on = january))
        assertEquals(ScooterSeasonalPause.Return.Clear(from = "12-15"), ScooterSeasonalPause.back(listOf(trondheim, clear), on = january))
        assertNull(ScooterSeasonalPause.back(listOf(trondheim, clear), on = at("2026-12-10T12:00:00Z")))

        // Porsgrunn and Skien, whose bounds take in Porsgrunn, as data/ had them on 28 October 2026 (LOG-370).
        val skien = GeoPoint(latitude = 59.2075, longitude = 9.6107)
        val porsgrunn = GeoPoint(latitude = 59.1411, longitude = 9.6555)
        val telemark = listOf(
            ScooterCity(
                id = "no:Porsgrunn", name = "Porsgrunn", countryCode = "NO", center = porsgrunn,
                bounds = GeoBounds(south = 59.1153, west = 9.6191, north = 59.1616, east = 9.6952), pauses = listOf(clear),
            ),
            ScooterCity(
                id = "no:Skien", name = "Skien", countryCode = "NO", center = skien,
                bounds = GeoBounds(south = 59.1385, west = 9.52, north = 59.2656, east = 9.6801), pauses = listOf(clear),
            ),
        )
        assertNull(ScooterSeasonalPause.active(at = skien, on = at("2026-12-14T22:30:00Z"), among = telemark))
        assertEquals(
            ScooterSeasonalPause.Active(city = "Skien", back = ScooterSeasonalPause.Return.Clear(from = "12-15")),
            ScooterSeasonalPause.active(at = skien, on = at("2026-12-14T23:30:00Z"), among = telemark),
        )
        assertEquals(
            ScooterSeasonalPause.Active(city = "Porsgrunn", back = ScooterSeasonalPause.Return.Clear(from = "12-15")),
            ScooterSeasonalPause.active(at = porsgrunn, on = at("2027-03-20T12:00:00Z"), among = telemark),
        )
        assertNotNull(ScooterSeasonalPause.active(at = porsgrunn, on = at("2027-04-30T21:30:00Z"), among = telemark))
        assertNull(ScooterSeasonalPause.active(at = porsgrunn, on = at("2027-04-30T22:30:00Z"), among = telemark))
        assertNotNull(ScooterSeasonalPause.active(at = skien, on = at("2027-12-15T12:00:00Z"), among = telemark))
    }

    @Test
    fun thePauseUntilTheStreetsAreClearGivesWayOnceScootersAreInView() {
        val season = ScooterSeasonalPause.Active(city = "Skien", back = ScooterSeasonalPause.Return.Clear(from = "12-15"))
        val metadata = ScooterResponseMetadata(partial = false, failedSources = emptyList())
        assertEquals(
            listOf(ScooterDockNotice.Season(season)),
            ScooterDockNotice.notices(season = season, health = ScooterProviderHealth.healthy, metadata = metadata, shownCount = 0),
        )
        // Ryde back in March: the notice gives way.
        assertEquals(
            emptyList<ScooterDockNotice>(),
            ScooterDockNotice.notices(
                season = season, scootersInView = true, health = ScooterProviderHealth.healthy, metadata = metadata, shownCount = 12,
            ),
        )
        // A pause with a set end stays, as the town's rule.
        val montreal = ScooterSeasonalPause.Active(city = "Montréal", back = ScooterSeasonalPause.Return.Month(4))
        assertEquals(
            listOf(ScooterDockNotice.Season(montreal)),
            ScooterDockNotice.notices(
                season = montreal, scootersInView = true, health = ScooterProviderHealth.healthy, metadata = metadata, shownCount = 1,
            ),
        )

        // The day as the language and the region write it.
        assertEquals("15 December", ScooterSeasonalPause.dayName("12-15", locale = Locale.forLanguageTag("en-GB")))
        assertEquals("December 15", ScooterSeasonalPause.dayName("12-15", locale = Locale.forLanguageTag("en-US")))
        val english = ScooterSeasonalPause.dayName("12-15", locale = ScooterLanguage.En.locale)
        val sentences = mapOf(
            ScooterLanguage.En to "Off season in Skien: from $english until the streets are clear",
            ScooterLanguage.De to "Saisonpause in Skien: ab 15. Dezember, bis die Strassen schnee- und eisfrei sind",
            ScooterLanguage.Fr to "Pause saisonnière à Skien : dès le 15 décembre, jusqu’à ce que les rues soient dégagées",
            ScooterLanguage.It to "Pausa stagionale a Skien: dal 15 dicembre finché le strade non saranno libere da neve e ghiaccio",
            ScooterLanguage.Nl to "Seizoenspauze in Skien: vanaf 15 december tot de straten sneeuw- en ijsvrij zijn",
            ScooterLanguage.Nb to "Sesongpause i Skien: fra 15. desember til det er snø- og isfritt",
            ScooterLanguage.Pt to "Pausa sazonal em Skien: a partir de 15 de dezembro, até as ruas estarem livres de neve e gelo",
            ScooterLanguage.Es to "Pausa de temporada en Skien: desde el 15 de diciembre hasta que las calles estén libres de nieve y hielo",
            ScooterLanguage.Is to "Skien: árstíðabundið hlé frá 15. desember þar til göturnar verða auðar",
        )
        assertEquals(ScooterLanguage.entries.toSet(), sentences.keys)
        for ((language, sentence) in sentences) {
            ScooterLanguage.current = language
            assertEquals(language.rawValue, sentence, ScooterDockNotice.Season(season).text)
        }
    }

    @Test
    fun aTownWhoseOperatorsHaveAllClosedItsSeasonIsOffSeasonUntilTheyReopen() {
        val now = at("2026-10-28T09:00:00Z")
        // The answers name the feeds in view whose operator says their season is over.
        val payload = ScooterAPIJson.decodeFromString<ScooterResponseMetadataPayload>(
            """
            {"partial": false, "stale": false, "failedSources": [], "sources": {"kazakhstan": "fresh"},
             "generatedAt": "2026-10-28T09:00:00.000Z", "seasonOver": ["kazakhstan:whoosh_kz_nqz"],
             "truncated": false, "totalVehicles": 0, "mode": "vehicles"}
            """,
        )
        assertEquals(setOf("kazakhstan:whoosh_kz_nqz"), payload.model.seasonOver)
        assertEquals(emptySet<String>(), ScooterResponseMetadata(partial = false, failedSources = emptyList()).seasonOver)

        // Whoosh closed these three on 24 October 2026; Jet and Bolt still run in Almaty. The tests' own towns
        // (TestCatalog), as data/, which adds and ends feeds, had them that day (LOG-370).
        val whooshTowns = TestCatalog.catalog.cities
        val almaty = GeoPoint(latitude = 43.298812, longitude = 76.939435)
        val astana = GeoPoint(latitude = 51.143975, longitude = 71.43581)
        val zapopan = GeoPoint(latitude = 20.721331, longitude = -103.391882)
        assertEquals(
            listOf("kazakhstan:jet_kz_almaty", "kazakhstan:whoosh_kz_ala", "kazakhstan:bolt_kz_app_122"),
            whooshTowns.firstOrNull { it.id == "kz:Almaty" }?.feeds?.map { it.id },
        )
        assertNull(ScooterSeasonalPause.active(at = almaty, on = now, among = whooshTowns, seasonOver = setOf("kazakhstan:whoosh_kz_ala")))
        assertEquals(
            ScooterSeasonalPause.Active(city = "Astana", back = ScooterSeasonalPause.Return.SeasonOver),
            ScooterSeasonalPause.active(at = astana, on = now, among = whooshTowns, seasonOver = setOf("kazakhstan:whoosh_kz_nqz")),
        )
        assertEquals(
            ScooterSeasonalPause.Active(city = "Zapopan", back = ScooterSeasonalPause.Return.SeasonOver),
            ScooterSeasonalPause.active(at = zapopan, on = now, among = whooshTowns, seasonOver = setOf("mexico:whoosh_mx_zap")),
        )
        // Open again, or another town's feed closed: no pause.
        assertNull(ScooterSeasonalPause.active(at = astana, on = now, among = whooshTowns))
        assertNull(ScooterSeasonalPause.active(at = astana, on = now, among = whooshTowns, seasonOver = setOf("mexico:whoosh_mx_zap")))
        // Almaty too once Jet and Bolt close as well, and not while Bolt runs.
        assertNull(
            ScooterSeasonalPause.active(
                at = almaty, on = now, among = whooshTowns, seasonOver = setOf("kazakhstan:whoosh_kz_ala", "kazakhstan:jet_kz_almaty"),
            ),
        )
        assertEquals(
            ScooterSeasonalPause.Active(city = "Almaty", back = ScooterSeasonalPause.Return.SeasonOver),
            ScooterSeasonalPause.active(
                at = almaty,
                on = now,
                among = whooshTowns,
                seasonOver = setOf("kazakhstan:whoosh_kz_ala", "kazakhstan:jet_kz_almaty", "kazakhstan:bolt_kz_app_122"),
            ),
        )

        // An operator in its own pause counts as closed; one with scooters does not.
        val montreal = GeoPoint(latitude = 45.5, longitude = -73.57)
        val quebec = listOf(
            ScooterCity(
                id = "ca:Montréal", name = "Montréal", countryCode = "CA", center = montreal,
                bounds = GeoBounds(south = 45.41, west = -73.98, north = 45.7, east = -73.47),
                feeds = listOf(ScooterCityFeed(id = "canada:bird_montreal", pause = winter), ScooterCityFeed(id = "canada:whoosh_montreal")),
            ),
        )
        val closed = setOf("canada:whoosh_montreal")
        assertEquals(
            ScooterSeasonalPause.Active(city = "Montréal", back = ScooterSeasonalPause.Return.SeasonOver),
            ScooterSeasonalPause.active(at = montreal, on = at("2027-01-20T17:00:00Z"), among = quebec, seasonOver = closed),
        )
        assertNull(ScooterSeasonalPause.active(at = montreal, on = at("2026-11-10T17:00:00Z"), among = quebec, seasonOver = closed))
        assertNull(ScooterSeasonalPause.active(at = montreal, on = at("2027-01-20T17:00:00Z"), among = quebec))

        // The catalog's own towns and feeds, read as the app reads them: one alone in its spot is off season once
        // every one of its feeds has closed.
        val cities = ScooterCityCatalog.cities
        val town = cities.firstOrNull { city ->
            city.feeds.isNotEmpty() && city.pauses.isEmpty() && city.feeds.all { it.pause == null } &&
                cities.none { it !== city && it.bounds.contains(city.bounds.center) }
        }
        assumeTrue("No town of the catalog stands alone with feeds of its own", town != null)
        assertEquals(
            ScooterSeasonalPause.Active(city = town!!.name, back = ScooterSeasonalPause.Return.SeasonOver),
            ScooterSeasonalPause.active(at = town.bounds.center, on = now, seasonOver = town.feeds.mapTo(HashSet()) { it.id }),
        )
    }

    @Test
    fun theClosedSeasonGivesWayOnceScootersAreInView() {
        val season = ScooterSeasonalPause.Active(city = "Zapopan", back = ScooterSeasonalPause.Return.SeasonOver)
        val metadata = ScooterResponseMetadata(partial = false, failedSources = emptyList(), seasonOver = setOf("mexico:whoosh_mx_zap"))
        assertEquals(
            listOf(ScooterDockNotice.Season(season)),
            ScooterDockNotice.notices(season = season, health = ScooterProviderHealth.healthy, metadata = metadata, shownCount = 0),
        )
        assertEquals(
            emptyList<ScooterDockNotice>(),
            ScooterDockNotice.notices(
                season = season, scootersInView = true, health = ScooterProviderHealth.healthy, metadata = metadata, shownCount = 3,
            ),
        )

        val sentences = mapOf(
            ScooterLanguage.En to "Off season in Zapopan: scooters are back when the operator reopens",
            ScooterLanguage.De to "Saisonpause in Zapopan: Scooter wieder, sobald der Anbieter die Saison eröffnet",
            ScooterLanguage.Fr to "Pause saisonnière à Zapopan : retour des trottinettes à la réouverture par l’opérateur",
            ScooterLanguage.It to "Pausa stagionale a Zapopan: monopattini di nuovo alla riapertura dell’operatore",
            ScooterLanguage.Nl to "Seizoenspauze in Zapopan: deelsteps weer zodra de aanbieder heropent",
            ScooterLanguage.Nb to "Sesongpause i Zapopan: elsparkesykler igjen når operatøren åpner",
            ScooterLanguage.Pt to "Pausa sazonal em Zapopan: trotinetes de volta quando o operador reabrir",
            ScooterLanguage.Es to "Pausa de temporada en Zapopan: los patinetes vuelven cuando el operador reabra",
            ScooterLanguage.Is to "Zapopan: árstíðabundið hlé, rafskúturnar koma aftur þegar rekstraraðilinn opnar",
        )
        assertEquals(ScooterLanguage.entries.toSet(), sentences.keys)
        for ((language, sentence) in sentences) {
            ScooterLanguage.current = language
            // Spanish says scooter where the phone's region is in Latin America or the US.
            assertEquals(language.rawValue, language.written(sentence, language.locale.country), ScooterDockNotice.Season(season).text)
        }
        assertEquals(
            "Pausa de temporada en Zapopan: los scooters vuelven cuando el operador reabra",
            ScooterLanguage.Es.written(sentences.getValue(ScooterLanguage.Es), "MX"),
        )
    }

    // Settings › About › Send feedback.

    @Test
    fun theFeedbackMailNamesTheVersionInItsSubject() {
        val launched = ScooterLinks.appVersion
        // The app sets its version name as it starts.
        ScooterLinks.appVersion = "1.2.0"
        try {
            assertFalse(ScooterLinks.appVersion.isEmpty())
            assertEquals(
                "mailto:hello@scootradar.com?subject=ScootRadar%20${ScooterLinks.appVersion}%20feedback",
                ScooterLinks.feedback.toString(),
            )
        } finally {
            ScooterLinks.appVersion = launched
        }
    }

    @Test
    fun everyLanguageSaysSendFeedbackAndNamesTheVersion() {
        for (language in languages) {
            // A missing translation would read as the English key.
            val feedback = strings(language)["Send feedback"] ?: "Send feedback"
            assertEquals("$language: $feedback", language == "en", feedback == "Send feedback")
            val version = strings(language)["Version %@"] ?: "Version %@"
            assertEquals("$language: $version", 2, version.split("%@").size)
        }
    }
}
