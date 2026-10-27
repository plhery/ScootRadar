package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.map.ScooterUserHeading
import java.util.Locale
import kotlin.math.PI
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

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
    fun centringAScooterShowsItInTheMapLeftVisibleAboveTheDock() {
        val scooter = GeoPoint(latitude = 47.3769, longitude = 8.5417)
        val mapView = FlatMapView(
            frame = ScreenRect(x = 0.0, y = 0.0, width = 390.0, height = 844.0),
            region = MapRegion.around(scooter, latitudinalMeters = 850.0, longitudinalMeters = 850.0),
        )

        // The search bar ends at 110 pt and a tall card begins at 380 pt: the middle is at 245 pt.
        val center = ScooterMapCameraPolicy.center(
            showing = scooter, on = mapView, visible = ScreenRect(x = 0.0, y = 110.0, width = 390.0, height = 270.0),
        )
        assertTrue(center.latitude < scooter.latitude)
        assertEquals(scooter.longitude, center.longitude, 0.0001)

        mapView.centerCoordinate = center
        val shown = mapView.point(scooter)
        assertEquals(245.0, shown.y, 3.0)
        assertEquals(195.0, shown.x, 3.0)

        // Nothing covers the map, or nearly all of it is covered: the scooter itself is the centre.
        val uncovered = ScooterMapCameraPolicy.center(
            showing = scooter, on = mapView, visible = ScreenRect(x = 0.0, y = 0.0, width = 390.0, height = 844.0),
        )
        assertEquals(scooter.latitude, uncovered.latitude, 0.000_001)
        val covered = ScooterMapCameraPolicy.center(
            showing = scooter, on = mapView, visible = ScreenRect(x = 0.0, y = 400.0, width = 390.0, height = 20.0),
        )
        assertEquals(scooter.latitude, covered.latitude, 0.000_001)
    }

    @Test
    fun withoutAPanelTheMapLeftVisibleIsTheBandBetweenTheSearchBarAndTheDock() {
        val phone = ScreenRect(x = 0.0, y = 0.0, width = 390.0, height = 844.0)
        val band = ScreenRect(x = 0.0, y = 110.0, width = 390.0, height = 270.0)
        assertEquals(band, ScooterMapCameraPolicy.visibleRectIn(phone, top = 110.0, bottom = 380.0, beside = null))
        // CGRect.null, the rectangle of nothing, is null here too.
        assertEquals(band, ScooterMapCameraPolicy.visibleRectIn(phone, top = 110.0, bottom = 380.0, beside = null))
        assertEquals(
            band,
            ScooterMapCameraPolicy.visibleRectIn(phone, top = 110.0, bottom = 380.0, beside = ScreenRect(0.0, 0.0, 0.0, 0.0)),
        )
    }

    @Test
    fun besideAPanelTheMapLeftVisibleStartsWhereThePanelEnds() {
        val window = ScreenRect(x = 0.0, y = 0.0, width = 1376.0, height = 1032.0)
        // A short panel still takes its side of the map from top to bottom:
        // a card opened in it may grow down.
        val leading = ScooterMapCameraPolicy.visibleRectIn(
            window, top = 24.0, bottom = 1032.0, beside = ScreenRect(x = 16.0, y = 40.0, width = 380.0, height = 300.0),
        )
        assertEquals(ScreenRect(x = 396.0, y = 24.0, width = 980.0, height = 1008.0), leading)

        // Right to left the panel is on the right.
        val trailing = ScooterMapCameraPolicy.visibleRectIn(
            window, top = 24.0, bottom = 1032.0, beside = ScreenRect(x = 980.0, y = 40.0, width = 380.0, height = 300.0),
        )
        assertEquals(ScreenRect(x = 0.0, y = 24.0, width = 980.0, height = 1008.0), trailing)
    }

    @Test
    fun aFoldPastAnEdgeOfTheMapLeavesTheMapAsItWas() {
        fun visible(rect: ScreenRect, fold: ScreenRect, side: ScooterMapCameraPolicy.FoldSide) =
            ScooterMapCameraPolicy.visibleRect(rect, safeTop = 59.0, beside = fold, on = side)

        val phone = ScreenRect(x = 0.0, y = 100.0, width = 400.0, height = 600.0)
        // Across the map, above the safe area's top: 59 points from the fold down to that top.
        assertEquals(phone, visible(phone, ScreenRect(0.0, 0.0, 400.0, 0.0), ScooterMapCameraPolicy.FoldSide.Above))
        // Down the map, right of it and left of it.
        assertEquals(phone, visible(phone, ScreenRect(450.0, 0.0, 10.0, 800.0), ScooterMapCameraPolicy.FoldSide.Right))
        val shifted = ScreenRect(x = 100.0, y = 0.0, width = 500.0, height = 800.0)
        assertEquals(shifted, visible(shifted, ScreenRect(20.0, 0.0, 10.0, 800.0), ScooterMapCameraPolicy.FoldSide.Left))
        // A fold inside the map still leaves the side past it.
        assertEquals(
            ScreenRect(x = 410.0, y = 0.0, width = 190.0, height = 800.0),
            visible(shifted, ScreenRect(400.0, 0.0, 10.0, 800.0), ScooterMapCameraPolicy.FoldSide.Right),
        )
    }

    @Test
    fun spansChosenOnAPhoneAreUnchangedOnEveryPhone() {
        // Every iPhone's shorter side, the widest the Pro Max's.
        for (width in listOf(320.0, 375.0, 390.0, 393.0, 402.0, 414.0, 428.0, 430.0, 440.0)) {
            assertEquals("$width", 1.0, ScooterMapCameraPolicy.spanScale(across = width), 0.0)
        }
    }

    @Test
    fun aLargerMapShowsMoreGroundAroundTheSameStreets() {
        assertEquals(466.0 / 440, ScooterMapCameraPolicy.spanScale(across = 466.0), 0.000_1)
        assertEquals(744.0 / 440, ScooterMapCameraPolicy.spanScale(across = 744.0), 0.000_1)
        assertEquals(1032.0 / 440, ScooterMapCameraPolicy.spanScale(across = 1032.0), 0.000_1)
        assertTrue(ScooterMapCameraPolicy.spanScale(across = 669.0) < ScooterMapCameraPolicy.spanScale(across = 1032.0))
    }

    @Test
    fun centringAScooterBesideAPanelShowsItInTheMiddleOfTheMapLeftVisible() {
        val scooter = GeoPoint(latitude = 47.3769, longitude = 8.5417)
        val mapView = FlatMapView(
            frame = ScreenRect(x = 0.0, y = 0.0, width = 1376.0, height = 1032.0),
            region = MapRegion.around(scooter, latitudinalMeters = 850.0, longitudinalMeters = 850.0),
        )

        // A panel 380 pt wide 16 pt from the edge: the middle of the rest is at 886 pt.
        val center = ScooterMapCameraPolicy.center(
            showing = scooter, on = mapView, visible = ScreenRect(x = 396.0, y = 0.0, width = 980.0, height = 1032.0),
        )
        mapView.centerCoordinate = center
        val shown = mapView.point(scooter)
        assertEquals(886.0, shown.x, 3.0)
        assertEquals(516.0, shown.y, 3.0)
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

    @Test
    fun compassUsesTrueNorthAndFallsBackToMagneticNorth() {
        val north = ScooterUserHeading(trueHeading = 0.0, magneticHeading = 8.0, accuracy = 5.0)
        val fallback = ScooterUserHeading(trueHeading = -1.0, magneticHeading = 358.0, accuracy = 12.0)
        assertNotNull(north)
        assertNotNull(fallback)
        assertEquals(0.0, north!!.direction, 0.0)
        assertEquals(358.0, fallback!!.direction, 0.0)
        assertNull(ScooterUserHeading(trueHeading = 20.0, magneticHeading = 25.0, accuracy = -1.0))
        assertNull(ScooterUserHeading(trueHeading = 20.0, magneticHeading = 25.0, accuracy = 90.0))
        assertNull(ScooterUserHeading(trueHeading = -1.0, magneticHeading = -1.0, accuracy = 5.0))
        assertNull(ScooterUserHeading(trueHeading = Double.NaN, magneticHeading = Double.NaN, accuracy = 5.0))
    }

    @Test
    fun compassBeamWidensWithUncertainty() {
        val precise = ScooterUserHeading(trueHeading = 45.0, magneticHeading = 45.0, accuracy = 5.0)!!
        val uncertain = ScooterUserHeading(trueHeading = 45.0, magneticHeading = 45.0, accuracy = 50.0)!!
        val veryUncertain = ScooterUserHeading(trueHeading = 45.0, magneticHeading = 45.0, accuracy = 85.0)!!
        assertEquals(22 * PI / 180, precise.halfAngle, 0.001)
        assertTrue(uncertain.halfAngle > precise.halfAngle)
        assertEquals(60 * PI / 180, veryUncertain.halfAngle, 0.001)
    }

    @Test
    fun delayedMapKitSelectionCannotReplaceTheDirectTapTarget() {
        val deadline = 11.0

        assertTrue(
            ScooterMapCoordinator.shouldSuppressMapKitSelection(
                candidateID = "voi:underneath",
                intendedID = "lime:tapped",
                until = deadline,
                now = 10.5,
            ),
        )
        assertFalse(
            ScooterMapCoordinator.shouldSuppressMapKitSelection(
                candidateID = "lime:tapped",
                intendedID = "lime:tapped",
                until = deadline,
                now = 10.5,
            ),
        )
        assertFalse(
            ScooterMapCoordinator.shouldSuppressMapKitSelection(
                candidateID = "voi:underneath",
                intendedID = "lime:tapped",
                until = deadline,
                now = deadline,
            ),
        )
        assertTrue(
            ScooterMapCoordinator.shouldSuppressMapKitSelection(
                candidateID = "voi:late",
                intendedID = null,
                until = deadline,
                now = 10.5,
            ),
        )
    }

    @Test
    fun topChromeFrameExcludesUnderlyingMapInteractions() {
        val chromeFrame = ScreenRect(x = 12.0, y = 62.0, width = 369.0, height = 62.0)

        assertTrue(ScooterMapCoordinator.point(ScreenPoint(x = 200.0, y = 90.0), isInside = chromeFrame))
        assertFalse(ScooterMapCoordinator.point(ScreenPoint(x = 200.0, y = 140.0), isInside = chromeFrame))
        // CGRect.null, the rectangle of nothing, is null here.
        assertFalse(ScooterMapCoordinator.point(ScreenPoint(x = 0.0, y = 0.0), isInside = null))

        assertTrue(ScooterMapCoordinator.shouldSuppressAllMapKitSelections(until = 10.0, now = 9.99))
        assertFalse(ScooterMapCoordinator.shouldSuppressAllMapKitSelections(until = 10.0, now = 10.0))
    }

    @Test
    fun creditsNameEverySourceOnceAndAboutLinksAreSecure() {
        val sources = ScooterCreditsList.sources

        // The sources of the credits list on the web, Lille's parking bays and the
        // boundaries of the night bans included: Switzerland's, France's, each country's
        // own from data/countries.json, then the search's and Lille's.
        assertEquals(5 + ScooterCountryCatalog.credits.size, sources.size)
        assertEquals(34, ScooterCountryCatalog.credits.size)
        assertEquals(sources.size, sources.map { it.title }.toSet().size)
        assertEquals("DE/", sources[2].title.take(3))
        assertTrue(sources.any { it.title == "CH/FR/DE/IT/BE/PT/ES/PL/FI/UA/IL/NZ/KR: OpenStreetMap boundaries · ODbL" })
        assertTrue(sources.any { it.title == "DE/AT/IT/ES/PL/HU/GR/FI: Dott map" })
        assertTrue(sources.any { it.title == "DE/SE: Qick map" })
        assertTrue(sources.any { it.title == "JP: LUUP map" })
        assertTrue(sources.any { it.title == "BR: IBGE boundaries" })
        assertTrue(sources.any { it.title == "KR: Alpaca map" })
        assertTrue(sources.any { it.title == "AE/SA/IL: Dott, SAHAM, Bird, Lime" })
        assertTrue(sources.any { it.title == "NZ: Flamingo · CC BY 4.0" })
        assertTrue(sources.any { it.title == "BR/CL/MX/KZ/AZ/GE: JET map" })
        assertTrue(sources.any { it.title == "BR/CL/MX/KZ/CO/BY: Whoosh map" })
        assertTrue(sources.any { it.title == "TR/MK/BA/XK: BinBin map" })
        assertTrue(sources.any { it.title == "Voi Technology Germany GmbH via NRW.Mobidrom, CC BY-SA 4.0, modified" })
        // MobiData BW's licence, dl-de/by-2-0, asks for the dataset and the licence to be named.
        assertTrue(sources.any { it.title == "DE: MobiData BW · dl-de/by-2-0, modified" && it.url.host == "www.govdata.de" })
        assertTrue(sources.any { it.url.toString() == "https://mobidata-bw.de/dataset/escootch" })
        assertTrue(sources.all { it.url.scheme == "https" && it.title.isNotEmpty() })
        assertTrue(sources.any { it.url.host == "data.lillemetropole.fr" })
        // Searched places come from Geoapify, whose free plan asks for its name to be shown,
        // and are OpenStreetMap data, whose licence asks for this credit.
        assertTrue(sources.any { it.url.toString() == "https://www.geoapify.com/" })
        assertTrue(sources.any { it.url.toString() == "https://www.openstreetmap.org/copyright" })

        assertEquals("https://scootradar.com/privacy", ScooterLinks.privacyNotice.toString())
        assertEquals("https://github.com/plhery/ScootRadar", ScooterLinks.sourceCode.toString())
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

    /**
     * MKMapView seen from straight above, facing north: a region set on it fills the map as MapKit fits it,
     * with its centre in the middle, and a point on the map is so many map points from the centre.
     */
    private class FlatMapView(frame: ScreenRect, region: MapRegion) : ScooterMapProjection {
        override val bounds: ScreenRect = ScreenRect(0.0, 0.0, frame.width, frame.height)
        override var centerCoordinate: GeoPoint = region.center

        /** Map points a point of the screen spans. */
        private val scale: Double = run {
            val southWest = MapPoint(
                GeoPoint(region.center.latitude - region.latitudeDelta / 2, region.center.longitude - region.longitudeDelta / 2),
            )
            val northEast = MapPoint(
                GeoPoint(region.center.latitude + region.latitudeDelta / 2, region.center.longitude + region.longitudeDelta / 2),
            )
            maxOf((northEast.x - southWest.x) / bounds.width, (southWest.y - northEast.y) / bounds.height)
        }

        override val visibleMapRect: MapRect
            get() {
                val centre = MapPoint(centerCoordinate)
                val width = bounds.width * scale
                val height = bounds.height * scale
                return MapRect(centre.x - width / 2, centre.y - height / 2, width, height)
            }

        override fun point(coordinate: GeoPoint): ScreenPoint {
            val point = MapPoint(coordinate)
            val centre = MapPoint(centerCoordinate)
            return ScreenPoint(bounds.midX + (point.x - centre.x) / scale, bounds.midY + (point.y - centre.y) / scale)
        }

        override fun coordinate(point: ScreenPoint): GeoPoint {
            val centre = MapPoint(centerCoordinate)
            return MapPoint(centre.x + (point.x - bounds.midX) * scale, centre.y + (point.y - bounds.midY) * scale).coordinate
        }
    }
}
