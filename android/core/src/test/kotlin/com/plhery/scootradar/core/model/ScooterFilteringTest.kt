package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterProvider
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.util.Locale

// ios/ScootRadarTests/ScooterFilteringTests.swift.
class ScooterFilteringTest {
    private val viewport = GeoBounds(MapRegion(GeoPoint(47.3769, 8.5417), latitudeDelta = 0.02, longitudeDelta = 0.02))

    private val launchLocale = ScooterLanguage.launchLocale

    @Before
    fun pinTheLocale() {
        ScooterLanguage.launchLocale = { Locale.US }
    }

    @After
    fun showTheLaunchLanguage() {
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
    }

    @Test
    fun batteryAndProviderFilteringForMapAnnotations() {
        val scooters = listOf(
            scooter(id = "lime-high", provider = "lime", battery = 80),
            scooter(id = "lime-low", provider = "lime", battery = 20),
            scooter(id = "bird-high", provider = "bird", battery = 90),
            scooter(id = "unknown", provider = "future-provider", battery = 95),
        )

        val filtered = ScooterFiltering.mapScooters(
            from = scooters,
            minimumBattery = 50.0,
            enabledProviders = setOf(ScooterProvider.Lime),
        )

        assertEquals(listOf("lime:lime-high"), filtered.map { it.id })
    }

    @Test
    fun visibleSummaryCountsOnlyViewportButKeepsProviderBreakdown() {
        val scooters = listOf(
            scooter(id = "lime-inside", provider = "lime", battery = 80),
            scooter(id = "bird-inside", provider = "bird", battery = 90),
            scooter(id = "bird-outside", provider = "bird", battery = 90, latitude = 47.5),
            scooter(id = "lime-low", provider = "lime", battery = 10),
        )

        val summary = ScooterFiltering.visibleSummary(
            vehicles = scooters,
            viewport = viewport,
            minimumBattery = 50.0,
            enabledProviders = setOf(ScooterProvider.Lime),
        )

        assertEquals(1, summary.count)
        assertEquals(1, summary.providerCounts[ScooterProvider.Lime])
        assertEquals(1, summary.providerCounts[ScooterProvider.Bird])
    }

    @Test
    fun unknownProvidersRemainVisibleWhenNoProviderIsSelected() {
        val summary = ScooterFiltering.visibleSummary(
            vehicles = listOf(scooter(id = "unknown", provider = "future-provider", battery = 70)),
            viewport = viewport,
            minimumBattery = 0.0,
            enabledProviders = ScooterProvider.entries.toSet(),
        )

        assertEquals(1, summary.count)
        assertTrue(summary.providerCounts.isEmpty())
    }

    @Test
    fun multipleProvidersCanBeEnabledTogether() {
        val scooters = listOf(
            scooter(id = "lime", provider = "lime", battery = 80),
            scooter(id = "bird", provider = "bird", battery = 80),
            scooter(id = "voi", provider = "voi", battery = 80),
        )

        val filtered = ScooterFiltering.mapScooters(
            from = scooters,
            minimumBattery = 0.0,
            enabledProviders = setOf(ScooterProvider.Lime, ScooterProvider.Bird),
        )

        assertEquals(setOf("lime", "bird"), filtered.map { it.provider }.toSet())
    }

    @Test
    fun clusteringStopsAfterZoomFifteen() {
        assertTrue(ScooterClusteringPolicy.shouldCluster(10))
        assertTrue(ScooterClusteringPolicy.shouldCluster(15))
        assertFalse(ScooterClusteringPolicy.shouldCluster(15.01))
        assertFalse(ScooterClusteringPolicy.shouldCluster(20))
    }

    @Test
    fun mapOpensOnTheCityOfTheTimeZone() {
        val start = ScooterStartPlace.start(forTimeZone = "Europe/Berlin")
        val berlin = ScooterCityCatalog.cities.firstOrNull { it.id == "de:Berlin" }
        assertNotNull(berlin)

        val center = start.region.center
        assertEquals(berlin!!.center.latitude, center.latitude, 0.02)
        assertEquals(berlin.center.longitude, center.longitude, 0.02)
        assertEquals(ScooterStartPlace.cityZoom, start.zoom)
    }

    @Test
    fun providerInitialsAreWrittenInTheInkOfTheirColour() {
        val white = 0xFFFFFFFF
        val nearBlack = listOf(ScooterProvider.Bird, ScooterProvider.Swing)
        for (provider in ScooterProvider.entries.filter { it !in nearBlack }) {
            assertEquals(provider.displayName, white, ScooterMapLook.ink(on = provider, isDark = false))
            assertEquals(provider.displayName, white, ScooterMapLook.ink(on = provider, isDark = true))
        }
        // Bird and Swing are near black by day and almost white on a dark map.
        for (provider in nearBlack) {
            assertEquals(provider.displayName, white, ScooterMapLook.ink(on = provider, isDark = false))
            assertNotEquals(provider.displayName, white, ScooterMapLook.ink(on = provider, isDark = true))
        }
    }

    @Test
    fun birdDotRemainsDistinctOnADarkMap() {
        val ground = ScooterMapLook.darkGround
        val originalContrast = ScooterMapLook.contrastRatio(
            between = ScooterProvider.Bird.color,
            and = ground,
        )

        val dot = ScooterMapLook.dotColor(ScooterProvider.Bird, isDark = true)

        assertTrue(originalContrast < 3.5)
        assertTrue(ScooterMapLook.contrastRatio(between = dot, and = ground) >= 3.5)
    }

    private fun scooter(
        id: String,
        provider: String,
        battery: Int,
        latitude: Double = 47.3769,
        longitude: Double = 8.5417,
    ): Scooter =
        Scooter(
            provider = provider,
            latitude = latitude,
            longitude = longitude,
            battery = battery,
            rangeMeters = null,
            vehicleID = id,
            deepLink = null,
            rentalURIs = null,
            distanceMeters = 0.0,
        )

    // Filter presets and the filtered-out summary.

    @Test
    fun batteryFilterOffersFourPresetsAndSnapsOtherValuesDown() {
        assertEquals(listOf(0, 30, 60, 80), ScooterBatteryFilter.presets)

        val examples = listOf(0 to 0, 29 to 0, 30 to 30, 45 to 30, 60 to 60, 79 to 60, 80 to 80, 95 to 80, 100 to 80, -10 to 0)
        for ((value, preset) in examples) {
            assertEquals("$value", preset, ScooterBatteryFilter.snapped(value))
        }
        assertEquals(localized("Any"), ScooterBatteryFilter.label(0))
        assertEquals("60%+", ScooterBatteryFilter.label(60))
    }

    @Test
    fun visibleSummaryAlsoCountsWhatTheFiltersHide() {
        val scooters = listOf(
            scooter(id = "lime-inside", provider = "lime", battery = 80),
            scooter(id = "lime-low", provider = "lime", battery = 10),
            scooter(id = "bird-inside", provider = "bird", battery = 90),
            scooter(id = "unknown", provider = "future-provider", battery = 95),
            scooter(id = "bird-outside", provider = "bird", battery = 90, latitude = 47.5),
        )

        val summary = ScooterFiltering.visibleSummary(
            vehicles = scooters,
            viewport = viewport,
            minimumBattery = 50.0,
            enabledProviders = setOf(ScooterProvider.Lime),
        )

        assertEquals(1, summary.count)
        assertEquals(4, summary.unfilteredCount)
        assertEquals(setOf(ScooterProvider.Lime, ScooterProvider.Bird), summary.unfilteredProviders)
    }

    @Test
    fun filterResultTitlesUseSingularAndPluralForms() {
        assertEquals(localized("Show 1 scooter"), ScooterFiltering.showResultsTitle(1))
        assertTrue(ScooterFiltering.showResultsTitle(16).contains("16"))
        assertNotEquals(
            ScooterFiltering.showResultsTitle(0),
            ScooterFiltering.showResultsTitle(1),
        )
        // Nothing to show is its own sentence, which each language writes in its own form.
        assertEquals(localized("Show 0 scooters"), ScooterFiltering.showResultsTitle(0))
    }

    @Test
    fun filterSummaryDescribesTheActiveFilters() {
        val both = ScooterFilterSummary(hiddenCount = 26, providers = listOf(ScooterProvider.Lime), minimumBattery = 60)

        assertTrue(both.title.contains("26"))
        assertTrue(both.showAllTitle.contains("26"))
        assertEquals(2, both.parts.size)
        assertTrue(both.parts[0].contains("Lime"))
        assertTrue(both.parts[1].contains("60%"))
        assertFalse(both.parts[1].contains("%%"))
        assertEquals(both.parts.joinToString(" · "), both.body)

        val one = ScooterFilterSummary(hiddenCount = 1, providers = listOf(ScooterProvider.Bird, ScooterProvider.Voi), minimumBattery = null)
        assertEquals(localized("1 scooter hidden by your filters"), one.title)
        assertEquals(1, one.parts.size)
        assertTrue(one.body.contains("Bird") && one.body.contains("Voi"))

        val unknown = ScooterFilterSummary(hiddenCount = null, providers = emptyList(), minimumBattery = 80)
        assertEquals(localized("No scooters match your filters here"), unknown.title)
        assertEquals(localized("Show all"), unknown.showAllTitle)
        assertEquals(1, unknown.parts.size)
        // On its own the battery part opens the line, so it starts with a capital.
        assertEquals(unknown.parts[0].take(1).uppercase(ScooterLanguage.launchLocale()), unknown.body.take(1))
        assertEquals(unknown.parts[0].drop(1), unknown.body.drop(1))
        assertNotEquals(unknown.parts[0], unknown.body)
    }
}
