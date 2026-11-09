package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.map.ScooterUserHeading
import com.plhery.scootradar.core.map.TestCatalog
import java.net.URI
import java.util.Locale
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
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
        // Among the tests' own cities (TestCatalog): data/ may add a German city nearer Berlin's main place (LOG-370).
        val cities = TestCatalog.catalog.cities
        val start = ScooterStartPlace.start(forTimeZone = "Europe/Berlin", cities = cities)
        val berlin = cities.firstOrNull { it.id == "de:Berlin" }
        assertNotNull(berlin)

        val center = start.region.center
        assertEquals(berlin!!.center.latitude, center.latitude, 0.02)
        assertEquals(berlin.center.longitude, center.longitude, 0.02)
        assertEquals(ScooterStartPlace.cityZoom, start.zoom)
        // The app's reads the generated catalog's.
        assertEquals(
            ScooterStartPlace.start(forTimeZone = "Europe/Berlin", cities = ScooterCityCatalog.cities),
            ScooterStartPlace.start(forTimeZone = "Europe/Berlin"),
        )
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
        // White on the darker colours, Bolt's deep green among them since issue #13, near black on the bright ones
        // (357f0c2c).
        for (provider in listOf(ScooterProvider.Publibike, ScooterProvider.RideMobility, ScooterProvider.Yoio, ScooterProvider.Jet, ScooterProvider.Bolt)) {
            assertEquals(provider.displayName, white, ScooterMapLook.ink(on = provider, isDark = false))
            assertEquals(provider.displayName, white, ScooterMapLook.ink(on = provider, isDark = true))
        }
        for (provider in listOf(ScooterProvider.Lime, ScooterProvider.Voi, ScooterProvider.Dott, ScooterProvider.Hopp)) {
            assertNotEquals(provider.displayName, white, ScooterMapLook.ink(on = provider, isDark = false))
            assertNotEquals(provider.displayName, white, ScooterMapLook.ink(on = provider, isDark = true))
        }
        // Bird and Swing are near black by day and almost white on a dark map.
        for (provider in listOf(ScooterProvider.Bird, ScooterProvider.Swing)) {
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
    fun compassProjectionFollowsMapRotationAndPitch() {
        // T066.
        val coordinate = GeoPoint(47.3769, 8.5417)
        val map = CameraMapView(center = coordinate, distance = 500.0)

        fun projectedAngle(direction: Double): Double {
            val heading = ScooterUserHeading(trueHeading = direction, magneticHeading = direction, accuracy = 5.0)!!
            return heading.screenAngle(at = coordinate, on = map)!! * 180 / PI
        }

        assertEquals(0.0, projectedAngle(0.0), 1.0)
        assertEquals(90.0, projectedAngle(90.0), 1.0)
        assertEquals(-1.0, projectedAngle(359.0), 1.0)
        assertEquals(1.0, projectedAngle(1.0), 1.0)

        map.heading = 90.0
        assertEquals(0.0, projectedAngle(90.0), 1.0)
        assertEquals(-90.0, projectedAngle(0.0), 1.0)

        map.heading = 0.0
        map.pitch = 45.0
        assertTrue(projectedAngle(45.0) > 45)
        assertTrue(projectedAngle(45.0) < 90)
    }

    @Test
    fun theBeamPointsAtAPlaceThirtyMetresAheadAndHidesWhereTheMapCannotShowIt() {
        val coordinate = GeoPoint(47.3769, 8.5417)
        val east = ScooterUserHeading(trueHeading = 90.0, magneticHeading = 90.0, accuracy = 5.0)!!
        val ahead = east.coordinateAhead(of = coordinate)
        assertEquals(30.0, coordinate.distance(to = ahead), 0.2)
        assertEquals(coordinate.latitude, ahead.latitude, 1e-9)
        assertTrue(ahead.longitude > coordinate.longitude)

        val nowhere = object : ScooterMapProjection by CameraMapView(center = coordinate, distance = 500.0) {
            override fun point(coordinate: GeoPoint): ScreenPoint = ScreenPoint(Double.NaN, Double.NaN)
        }
        assertNull(east.screenAngle(at = coordinate, on = nowhere))
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
        // own from data/countries.json, then the search's and Lille's. Which countries' and
        // their titles are data/'s, which names more as markets open: read, not named (LOG-370).
        val countries = ScooterCountryCatalog.credits
        assertEquals(5 + countries.size, sources.size)
        assertEquals(
            countries.map { (title, url) -> ScooterCreditsList.Source(title = title, url = URI(url)) },
            sources.subList(2, 2 + countries.size),
        )
        assertEquals(sources.size, sources.map { it.title }.toSet().size)
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

    // The minimum range (issue #12).

    private fun ranged(id: String, provider: String = "lime", battery: Int? = null, range: Int?): Scooter = Scooter(
        provider = provider, latitude = 47.3769, longitude = 8.5417, battery = battery, rangeMeters = range,
        vehicleID = id, deepLink = null, rentalURIs = null, distanceMeters = 0.0,
    )

    /**
     * Stuttgart's Lime and Voi give a range and no battery; a minimum range hides the scooters without one, as a
     * minimum battery hides those without a battery.
     */
    @Test
    fun rangeFilterHidesScootersWithoutARangeAndThoseThatGoLessFar() {
        val scooters = listOf(
            ranged("far", range = 12_000),
            ranged("exact", provider = "voi", range = 5_000),
            ranged("near", range = 4_999),
            ranged("unknown", provider = "bolt", battery = 90, range = null),
        )
        assertTrue(scooters.all { ScooterFiltering.passesRange(it, minimumRange = 0) })

        val filtered = ScooterFiltering.mapScooters(
            from = scooters, minimumBattery = 0.0, minimumRange = 5_000, enabledProviders = ScooterProvider.entries.toSet(),
        )
        assertEquals(listOf("lime:far", "voi:exact"), filtered.map { it.id })

        val summary = ScooterFiltering.visibleSummary(
            vehicles = scooters, viewport = viewport, minimumBattery = 0.0, minimumRange = 5_000,
            enabledProviders = setOf(ScooterProvider.Lime),
        )
        assertEquals(1, summary.count)
        assertEquals(mapOf(ScooterProvider.Lime to 1, ScooterProvider.Voi to 1), summary.providerCounts)
        // What the filters hide is counted too.
        assertEquals(4, summary.unfilteredCount)
        assertEquals(setOf(ScooterProvider.Lime, ScooterProvider.Voi, ScooterProvider.Bolt), summary.unfilteredProviders)
    }

    /** Whole kilometres up to 30 or whole miles up to 20, a mile being 1 609.344 m rounded to the metre. */
    @Test
    fun rangeFilterReadsItsMinimumInWholeStepsOfItsUnit() {
        val kilometres = ScooterRangeFilter.Unit.Kilometres
        val miles = ScooterRangeFilter.Unit.Miles
        assertEquals(30, kilometres.maximumSteps)
        assertEquals(20, miles.maximumSteps)
        assertEquals(5_000, ScooterRangeFilter.metres(steps = 5, unit = kilometres))
        assertEquals(4_828, ScooterRangeFilter.metres(steps = 3, unit = miles))
        assertEquals(32_187, ScooterRangeFilter.metres(steps = 20, unit = miles))
        assertEquals(30_000, ScooterRangeFilter.metres(steps = 99, unit = kilometres))

        val inKilometres = listOf(
            0 to 0, -5 to 0, 499 to 0, 500 to 1_000, 2_499 to 2_000, 4_828 to 5_000, 5_000 to 5_000,
            31_000 to 30_000, 200_000 to 30_000,
        )
        for ((metres, snapped) in inKilometres) {
            assertEquals("$metres m in km", snapped, ScooterRangeFilter.snapped(metres, kilometres))
        }
        // "3 mi+" is 4 828 m, not the 5 000 m it was set as in kilometres.
        val inMiles = listOf(0 to 0, 804 to 0, 805 to 1_609, 5_000 to 4_828, 4_828 to 4_828, 30_000 to 30_578, 40_000 to 32_187)
        for ((metres, snapped) in inMiles) {
            assertEquals("$metres m in mi", snapped, ScooterRangeFilter.snapped(metres, miles))
        }
        assertEquals(3, ScooterRangeFilter.steps(4_828, miles))
        assertEquals(5, ScooterRangeFilter.steps(4_828, kilometres))
    }

    /** "5 km+" or "3 mi+" beside the heading, never metres, feet or yards; "5 km or more" for TalkBack. */
    @Test
    fun rangeFilterSaysItsMinimumInWholeKilometresOrMiles() {
        val swiss = Locale.forLanguageTag("en-CH")
        val american = Locale.forLanguageTag("en-US")
        assertEquals(ScooterRangeFilter.Unit.Kilometres, ScooterRangeFilter.Unit.of(swiss))
        assertEquals(ScooterRangeFilter.Unit.Miles, ScooterRangeFilter.Unit.of(american))
        assertEquals(ScooterRangeFilter.Unit.Miles, ScooterRangeFilter.Unit.of(Locale.forLanguageTag("en-GB")))

        assertEquals(localized("Any"), ScooterRangeFilter.label(0, swiss))
        assertEquals("5 km+", plainSpaces(ScooterRangeFilter.label(5_000, swiss)))
        assertEquals("3 mi+", plainSpaces(ScooterRangeFilter.label(4_828, american)))
        assertEquals("1 km+", plainSpaces(ScooterRangeFilter.label(1_000, swiss)))
        assertEquals("30 km+", plainSpaces(ScooterRangeFilter.label(30_000, swiss)))
        assertEquals("20 mi", plainSpaces(ScooterRangeFilter.distance(32_187, american)))
        // A line never breaks between the number and its unit.
        assertFalse(ScooterRangeFilter.label(5_000, swiss).contains(" "))

        assertEquals(localized("Any"), ScooterRangeFilter.spokenValue(0, swiss))
        assertEquals(
            stringFormat(localized("%@ or more"), ScooterRangeFilter.distance(5_000, swiss)),
            ScooterRangeFilter.spokenValue(5_000, swiss),
        )
        assertEquals("5 km or more", plainSpaces(ScooterRangeFilter.spokenValue(5_000, swiss)))
    }

    /** After the providers, as the battery's: "Lime only · range 5 km or more", and with a capital alone. */
    @Test
    fun filterSummaryDescribesAMinimumRange() {
        try {
            ScooterUnits.current = ScooterUnits.Metric
            val both = ScooterFilterSummary(hiddenCount = 12, providers = listOf(ScooterProvider.Lime), minimumBattery = null, minimumRange = 5_000)
            assertEquals(2, both.parts.size)
            assertTrue(both.parts[0].contains("Lime"))
            assertEquals(stringFormat(localized("range %@ or more"), ScooterRangeFilter.distance(5_000)), both.parts[1])
            assertEquals(both.parts.joinToString(" · "), both.body)

            val alone = ScooterFilterSummary(hiddenCount = null, providers = emptyList(), minimumBattery = null, minimumRange = 5_000)
            assertEquals(1, alone.parts.size)
            assertEquals(alone.parts[0].take(1).uppercase(ScooterLanguage.launchLocale()), alone.body.take(1))
            assertEquals(alone.parts[0].drop(1), alone.body.drop(1))
            assertEquals("Range 5 km or more", plainSpaces(alone.body))

            // In miles the minimum is said in the whole miles the slider shows.
            ScooterUnits.current = ScooterUnits.Imperial
            val inMiles = ScooterFilterSummary(hiddenCount = null, providers = emptyList(), minimumBattery = null, minimumRange = 4_828)
            assertTrue(plainSpaces(inMiles.body).contains("3 mi"))
        } finally {
            ScooterUnits.current = ScooterUnits.Automatic
        }
    }

    /** Every language says the range filter and the units, with a distance where the sentence holds one. */
    @Test
    fun everyLanguageWritesTheRangeFilterAndTheUnits() {
        val keys = listOf(
            "Range", "Scooters without range info are hidden while a minimum is set.", "range %@ or more",
            "%@ or more", "Units", "Kilometres", "Miles",
        )
        for (language in ScooterLanguage.entries) {
            for (key in keys) {
                val text = language.strings[key]
                assertNotNull("${language.rawValue}: $key", text)
                assertEquals("${language.rawValue}: $text", key.contains("%@"), text!!.contains("%@"))
            }
        }
    }

    private fun plainSpaces(text: String): String = text.replace('\u00A0', ' ').replace('\u202F', ' ')

    /**
     * MKMapView under an MKMapCamera `distance` metres from its centre, facing `heading` degrees from north and
     * tilted `pitch` degrees from straight down, as a camera sees the ground: further is smaller.
     */
    private class CameraMapView(val center: GeoPoint, val distance: Double) : ScooterMapProjection {
        var heading = 0.0
        var pitch = 0.0
        override val bounds = ScreenRect(0.0, 0.0, 390.0, 844.0)
        override val centerCoordinate: GeoPoint get() = center

        /** The distance to the screen, in points, of a camera that sees as far across as a phone's. */
        private val focalLength = bounds.height
        private val mapPointsPerMeter = MapPoint.worldSize / (40_075_016.68557849 * cos(center.latitude * PI / 180))

        override val visibleMapRect: MapRect
            get() {
                val corners = listOf(
                    ScreenPoint(bounds.minX, bounds.minY),
                    ScreenPoint(bounds.maxX, bounds.minY),
                    ScreenPoint(bounds.minX, bounds.maxY),
                    ScreenPoint(bounds.maxX, bounds.maxY),
                ).map { MapPoint(coordinate(it)) }
                val minX = corners.minOf { it.x }
                val minY = corners.minOf { it.y }
                return MapRect(minX, minY, corners.maxOf { it.x } - minX, corners.maxOf { it.y } - minY)
            }

        override fun point(coordinate: GeoPoint): ScreenPoint {
            val point = MapPoint(coordinate)
            val middle = MapPoint(center)
            val east = (point.x - middle.x) / mapPointsPerMeter
            val north = (middle.y - point.y) / mapPointsPerMeter
            val turn = heading * PI / 180
            val tilt = pitch * PI / 180
            val across = east * cos(turn) - north * sin(turn)
            val ahead = east * sin(turn) + north * cos(turn)
            val depth = distance + ahead * sin(tilt)
            return ScreenPoint(bounds.midX + across * focalLength / depth, bounds.midY - ahead * cos(tilt) * focalLength / depth)
        }

        override fun coordinate(point: ScreenPoint): GeoPoint {
            val turn = heading * PI / 180
            val tilt = pitch * PI / 180
            val up = bounds.midY - point.y
            val ahead = up * distance / (focalLength * cos(tilt) - up * sin(tilt))
            val across = (point.x - bounds.midX) * (distance + ahead * sin(tilt)) / focalLength
            val east = across * cos(turn) + ahead * sin(turn)
            val north = -across * sin(turn) + ahead * cos(turn)
            val middle = MapPoint(center)
            return MapPoint(middle.x + east * mapPointsPerMeter, middle.y - north * mapPointsPerMeter).coordinate
        }
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
