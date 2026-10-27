package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.api.ScooterAPIJson
import com.plhery.scootradar.core.generated.ScooterAPIResponsePayload
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.generated.ScooterVehiclePayload
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
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

    @Test
    fun scootersLastSeenDecodeAsTheOthersApart() {
        val json = """
        {
          "vehicles": [],
          "clusters": [],
          "lastSeen": {
            "vehicles": [{"provider": "lime", "lat": 47.3769, "lng": 8.5417, "battery": 64, "vehicle_id": "seen-1"}],
            "clusters": [{"id": "seen:13:4290:2868", "lat": 47.38, "lng": 8.54, "count": 9, "providers": {"lime": 9}}]
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
        assertEquals(listOf("seen:13:4290:2868"), response.lastSeenClusters.map { it.id })
        assertEquals("2026-10-25T09:40:00.000Z", response.meta?.lastSeenAt)

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
    }

    @Test
    fun theMapShowsItsScaleWhereTheRegionMeasuresInMiles() {
        assertTrue(ScooterMapScalePolicy.showsScale(locale = Locale.forLanguageTag("en-US")))
        assertTrue(ScooterMapScalePolicy.showsScale(locale = Locale.forLanguageTag("en-GB")))
        assertFalse(ScooterMapScalePolicy.showsScale(locale = Locale.forLanguageTag("en-CH")))
        assertFalse(ScooterMapScalePolicy.showsScale(locale = Locale.forLanguageTag("fr-CA")))
        assertFalse(ScooterMapScalePolicy.showsScale(locale = Locale.forLanguageTag("es-MX")))
    }

    private fun plainSpaces(text: String): String = text.replace(' ', ' ').replace(' ', ' ')

    @Test
    fun mapZoomRoundsUpAtTheServerClusteringBoundary() {
        assertEquals(15, ScooterClusteringPolicy.apiZoom(15.0))
        assertEquals(16, ScooterClusteringPolicy.apiZoom(15.01))
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
        val opened = scooter.openRental { url ->
            tried += url.toString()
            url.toString() != android
        }
        assertEquals(listOf(android, web), tried)
        assertEquals(web, opened?.toString())

        // With the app installed, its link is the only one tried.
        tried.clear()
        scooter.openRental { url ->
            tried += url.toString()
            true
        }
        assertEquals(listOf(android), tried)

        // When nothing opens, nothing is reported as opened.
        val nothing = scooter.openRental { false }
        assertNull(nothing)
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
        // The catalog has no Play Store pages yet: the operator's link is all there is.
        val lime = scooter("lime")
        assertEquals("https://lime.bike/", lime.operatorApp?.link)
        assertEquals("https://app.publibike.ch/", scooter("publibike").operatorApp?.link)
        assertEquals("https://www.spin.app/", scooter("spin").operatorApp?.link)

        // With Lime installed, its link opens it; only an app may take that link.
        val tried = mutableListOf<String>()
        val opened = lime.openOperatorApp { url, appOnly ->
            tried += "$url $appOnly"
            true
        }
        assertEquals(listOf("https://lime.bike/ true"), tried)
        assertEquals("https://lime.bike/", opened?.toString())

        // Without it, the same link opens in the browser, whose page sends the phone to the store.
        tried.clear()
        val store = lime.openOperatorApp { url, appOnly ->
            tried += "$url $appOnly"
            !appOnly
        }
        assertEquals(listOf("https://lime.bike/ true", "https://lime.bike/ false"), tried)
        assertEquals("https://lime.bike/", store?.toString())

        // A scooter its feed links keeps that link, and other operators have no app to fall back on.
        val linked = scooter("lime", rentalURIs = ScooterRentalURIs(ios = null, android = "https://lime.bike/vehicle/1", web = null))
        assertNull(linked.operatorApp)
        assertNull(scooter("dott").operatorApp)
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

    // Closest cities, parking bays, the search bar and city totals.

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
