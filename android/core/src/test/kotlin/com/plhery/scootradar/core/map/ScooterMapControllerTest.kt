package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.api.ScooterLoadFailure
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.generated.ScooterProvider.Bird
import com.plhery.scootradar.core.generated.ScooterProvider.Bolt
import com.plhery.scootradar.core.generated.ScooterProvider.Dott
import com.plhery.scootradar.core.generated.ScooterProvider.Hopp
import com.plhery.scootradar.core.generated.ScooterProvider.Lime
import com.plhery.scootradar.core.generated.ScooterProvider.Publibike
import com.plhery.scootradar.core.generated.ScooterProvider.Ryde
import com.plhery.scootradar.core.generated.ScooterProvider.Voi
import com.plhery.scootradar.core.generated.ScooterProvider.Whoosh
import com.plhery.scootradar.core.model.AppleMapStyle
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.InMemoryScooterDefaults
import com.plhery.scootradar.core.model.MapDestination
import com.plhery.scootradar.core.model.MapFocusRequest
import com.plhery.scootradar.core.model.MapRegion
import com.plhery.scootradar.core.model.ProviderRidePass
import com.plhery.scootradar.core.model.RideEstimateDuration
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterCluster
import com.plhery.scootradar.core.model.ScooterClusteringPolicy
import com.plhery.scootradar.core.model.ScooterCountContext
import com.plhery.scootradar.core.model.ScooterDefaults
import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterDockHint
import com.plhery.scootradar.core.model.ScooterDockNotice
import com.plhery.scootradar.core.model.ScooterDockStatus
import com.plhery.scootradar.core.model.ScooterDockSummary
import com.plhery.scootradar.core.model.ScooterFilterSummary
import com.plhery.scootradar.core.model.ScooterFiltering
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.core.model.ScooterLoadIssue
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.ScooterProviderHealth
import com.plhery.scootradar.core.model.ScooterRefreshPolicy
import com.plhery.scootradar.core.model.ScooterRentalURIs
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterResponseMetadata
import com.plhery.scootradar.core.model.ScooterRidePricing
import com.plhery.scootradar.core.model.ScooterSeasonalPause
import com.plhery.scootradar.core.model.UserInterfaceStyle
import com.plhery.scootradar.core.model.addingTimeInterval
import com.plhery.scootradar.core.model.formatted
import com.plhery.scootradar.core.model.isolated
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import java.time.Instant
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale
import kotlin.math.roundToInt
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

// ios/ScootRadarTests/ScooterMapModelTests.swift.
@OptIn(ExperimentalCoroutinesApi::class)
class ScooterMapControllerTest {
    private val launchLocale = ScooterLanguage.launchLocale
    private val atLaunch = ScooterLanguage.atLaunch

    @Before
    fun pinTheLocale() {
        ScooterLanguage.launchLocale = { Locale.US }
    }

    @After
    fun showTheLaunchLanguage() {
        ScooterLanguage.atLaunch = atLaunch
        ScooterLanguage.current = atLaunch
        ScooterLanguage.launchLocale = launchLocale
    }

    @Test
    fun parkingFollowsZoomAndProviderFiltersWithoutChangingScooterCounts() = runTest {
        val location = ScooterParking(
            id = "dott:bay", provider = "dott", name = "Place test",
            latitude = 45.75, longitude = 4.85, mandatory = true,
        )
        val api = StubScooterAPI(ScooterResponse(vehicles = emptyList(), parking = listOf(location)))
        val model = makeController(api)
        val region = MapRegion(location.coordinate, latitudeDelta = 0.01, longitudeDelta = 0.01)
        model.updateViewport(region, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        assertEquals(listOf(location), model.mapParking)
        assertEquals(0, model.visibleCount)
        model.setMinimumBattery(100.0)
        assertEquals(listOf(location), model.mapParking)
        model.toggle(Dott)
        assertTrue(model.mapParking.isEmpty())
        model.toggle(Dott)
        model.updateViewport(region, zoom = 15)
        assertTrue(model.mapParking.isEmpty())
    }

    @Test
    fun germanAndItalianProviderCoveragePreservesSelection() = runTest {
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        val selected = model.enabledProviders.value
        model.setViewport(GeoBounds(south = 52.49, west = 13.37, north = 52.55, east = 13.44))
        assertEquals(listOf(Bolt, Dott, Lime, Voi), model.availableProviders)
        model.setViewport(GeoBounds(south = 41.88, west = 12.46, north = 41.93, east = 12.53))
        assertEquals(listOf(Bird, Dott, Lime), model.availableProviders)
        assertEquals(selected, model.enabledProviders.value)
        model.setViewport(GeoBounds(south = 48.19, west = 9.16, north = 48.21, east = 9.19))
        assertFalse(Lime in model.availableProviders)
    }

    @Test
    fun limeCoverageReachesTheCompleteMarketsIncludingBrisbanesOuterServiceAreas() = runTest {
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        // The provider's Wynnum/Manly and Sandgate/Shorncliffe zone icons, beyond central Brisbane.
        val points = listOf(
            45.88333 to 22.9, 48.97447 to 14.47434, 20.58806 to -100.38806,
            26.213 to 127.67851, 25.28545 to 51.53096, -33.3976605 to -70.5505662,
            -27.47658 to 153.0306725, -27.44796 to 153.17945, -27.33526 to 153.06117,
        )
        for ((lat, lng) in points) {
            model.setViewport(GeoBounds(south = lat - 0.0002, west = lng - 0.0002, north = lat + 0.0002, east = lng + 0.0002))
            assertTrue("Lime coverage at $lat, $lng", Lime in model.availableProviders)
        }
    }

    @Test
    fun frenchViewportHidesSwissProvidersWithoutChangingSavedSelection() = runTest {
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        val selected = model.enabledProviders.value
        model.setViewport(GeoBounds(south = 45.72, west = 4.79, north = 45.80, east = 4.90))
        assertEquals(listOf(Dott), model.availableProviders)
        assertFalse(model.dockChips.any { it.provider == Publibike })
        assertEquals(selected, model.enabledProviders.value)
        model.setViewport(GeoBounds(south = 47.3, west = 8.4, north = 47.5, east = 8.7))
        assertTrue(Publibike in model.availableProviders)
    }

    @Test
    fun providerCountsRemainAvailableWhenAProviderIsHidden() = runTest {
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = emptyList(),
                clusters = listOf(
                    ScooterCluster(
                        id = "city:ch:zurich", latitude = 47.38, longitude = 8.54, count = 100,
                        providers = mapOf("lime" to 80, "bird" to 20), city = "Zürich",
                    ),
                ),
                meta = ScooterResponseMetadata(partial = false, failedSources = emptyList(), mode = "clusters", zoom = 8, overview = true),
            ),
        )
        val model = makeController(api)
        model.refresh()
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        model.toggle(Bird)
        assertEquals(20, model.count(Bird))
        assertEquals(80, model.visibleCount)
        assertEquals(100, model.allProviderCount)
        assertTrue(ScooterClusteringPolicy.representationsMatch(6, 10))
        assertFalse(ScooterClusteringPolicy.representationsMatch(10, 11))
    }

    @Test
    fun supersededFetchIsCancelled() = runTest {
        val api = StubScooterAPI(ScooterResponse(vehicles = emptyList()), delaysFirstRequest = true)
        val model = makeController(api)

        model.refresh()
        val firstRequestStarted = waitUntil { api.calls == 1 }
        assertTrue(firstRequestStarted)

        model.refresh()

        val replacementFinished = waitUntil { api.calls == 2 && api.cancellations == 1 }
        assertTrue(replacementFinished)
        val loadingFinished = waitUntil { api.calls == 2 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loadingFinished)
    }

    @Test
    fun partialRefreshAcceptsHealthyResultsAndShowsHealthNotice() = runTest {
        val completeScooters = listOf(
            scooter(id = "lime", provider = "lime"),
            scooter(id = "voi", provider = "voi"),
        )
        val api = StubScooterAPI(ScooterResponse(vehicles = completeScooters))
        val model = makeController(api)

        model.refresh()
        val initialLoadFinished = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(initialLoadFinished)

        api.setResponse(
            ScooterResponse(
                vehicles = listOf(scooter(id = "voi-new", provider = "voi")),
                meta = ScooterResponseMetadata(partial = true, failedSources = listOf("national")),
            ),
        )
        model.refresh()

        val partialRefreshFinished = waitUntil { api.calls == 2 && model.dockNotices.isNotEmpty() && !model.isLoading.value }
        assertTrue(partialRefreshFinished)
        assertEquals(listOf("voi-new"), model.mapScooters.value.map { it.vehicleID })
        assertNull(model.loadIssue.value)
        assertEquals(listOf(ScooterDockNotice.SomeProvidersDown), model.dockNotices)
    }

    @Test
    fun acceptedDegradedResponseExposesADataHealthMessage() = runTest {
        val response = ScooterResponse(
            vehicles = listOf(scooter(id = "lime", provider = "lime")),
            meta = ScooterResponseMetadata(
                partial = true,
                stale = true,
                failedSources = listOf("national"),
                truncated = true,
                totalVehicles = 5_100,
            ),
        )
        val api = StubScooterAPI(response)
        val model = makeController(api)

        model.refresh()

        val loadingFinished = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loadingFinished)
        assertEquals(
            listOf(ScooterDockNotice.SomeProvidersDown, ScooterDockNotice.Truncated(shown = 1, total = 5_100)),
            model.dockNotices,
        )
        val message = unwrap(model.dockNotices.lastOrNull()?.text)
        assertTrue(message.contains(1.formatted(ScooterLanguage.launchLocale())))
        assertTrue(message.contains(5_100.formatted(ScooterLanguage.launchLocale())))
    }

    @Test
    fun countryScaleResponseRepresentsThousandsWithOneServerClusterAnnotation() = runTest {
        val cluster = ScooterCluster(
            id = "8:134:89",
            latitude = ScooterMapController.switzerlandCenter.latitude,
            longitude = ScooterMapController.switzerlandCenter.longitude,
            count = 9_000,
            providers = mapOf("lime" to 6_000, "bird" to 3_000),
        )
        val response = ScooterResponse(
            vehicles = emptyList(),
            clusters = listOf(cluster),
            providers = mapOf("lime" to 6_000, "bird" to 3_000),
            meta = ScooterResponseMetadata(
                partial = false,
                failedSources = emptyList(),
                totalVehicles = 9_000,
                mode = "clusters",
                zoom = 8,
            ),
        )
        val api = StubScooterAPI(response)
        val model = makeController(api)

        model.refresh()
        val loadingFinished = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }

        assertTrue(loadingFinished)
        assertTrue(model.mapScooters.value.isEmpty())
        assertEquals(1, model.mapClusters.value.size)
        assertEquals(1, model.mapScooters.value.size + model.mapClusters.value.size)
        assertEquals(9_000, model.visibleCount)
        assertEquals(8, api.lastZoom)
        assertEquals(0, api.lastMinimumBattery)

        model.toggle(Bird)
        assertEquals(6_000, model.mapClusters.value.firstOrNull()?.count)
        assertEquals(6_000, model.visibleCount)
    }

    @Test
    fun clusteredBatteryFilterIsAppliedByTheServer() = runTest {
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = emptyList(),
                clusters = listOf(
                    ScooterCluster(
                        id = "8:134:89",
                        latitude = ScooterMapController.switzerlandCenter.latitude,
                        longitude = ScooterMapController.switzerlandCenter.longitude,
                        count = 100,
                        providers = mapOf("lime" to 100),
                    ),
                ),
                meta = ScooterResponseMetadata(
                    partial = false,
                    failedSources = emptyList(),
                    mode = "clusters",
                    zoom = 8,
                ),
            ),
        )
        val model = makeController(api)

        model.refresh()
        val initialLoadFinished = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(initialLoadFinished)

        model.setMinimumBattery(60.0)
        val filteredLoadFinished = waitUntil { api.calls == 2 && !model.isLoading.value }

        assertTrue(filteredLoadFinished)
        assertEquals(8, api.lastZoom)
        assertEquals(60, api.lastMinimumBattery)
    }

    @Test
    fun batteryFilterSnapsDownToAPresetPersistsItAndClearsHiddenSelection() = runTest {
        val scooter = Scooter(
            provider = "lime",
            latitude = 47.3769,
            longitude = 8.5417,
            battery = 40,
            rangeMeters = null,
            vehicleID = "selected",
            deepLink = null,
            rentalURIs = null,
            distanceMeters = 0.0,
        )
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter)))
        val defaults = InMemoryScooterDefaults()
        val model = makeController(api, defaults = defaults)
        model.refresh()
        val loadingFinished = waitUntil { api.calls == 1 && model.lastUpdated.value != null }
        assertTrue(loadingFinished)

        model.selectScooter(scooter.id)
        model.setMinimumBattery(29.0)

        assertEquals(0.0, model.minimumBattery.value, 0.0)
        assertEquals(scooter.id, model.selectedScooterID.value)

        model.setMinimumBattery(75.0)

        assertEquals(60.0, model.minimumBattery.value, 0.0)
        assertEquals(60, defaults.integer(forKey = "minimum-battery"))
        assertNull(model.selectedScooterID.value)
        assertTrue(model.mapScooters.value.isEmpty())
    }

    @Test
    fun providerTogglesComposeAndResetTogether() = runTest {
        val scooters = listOf(
            scooter(id = "lime", provider = "lime"),
            scooter(id = "bird", provider = "bird"),
            scooter(id = "voi", provider = "voi"),
        )
        val api = StubScooterAPI(ScooterResponse(vehicles = scooters))
        val model = makeController(api)
        model.refresh()
        val loadingFinished = waitUntil { api.calls == 1 && model.lastUpdated.value != null }
        assertTrue(loadingFinished)

        model.toggle(Voi)
        model.toggle(Bird)

        assertEquals(listOf("lime"), model.mapScooters.value.map { it.provider })
        assertTrue(model.hasActiveFilters)

        model.resetFilters()

        assertEquals(setOf("lime", "bird", "voi"), model.mapScooters.value.map { it.provider }.toSet())
        assertFalse(model.hasActiveFilters)
    }

    @Test
    fun quickProviderTogglesBuildAnyCombinationAndReturnToAll() = runTest {
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())))

        model.toggleQuickProvider(Bird)
        assertEquals(setOf(Bird), model.enabledProviders.value)

        model.toggleQuickProvider(Dott)
        assertEquals(setOf(Bird, Dott), model.enabledProviders.value)

        model.toggleQuickProvider(Bird)
        assertEquals(setOf(Dott), model.enabledProviders.value)

        model.toggleQuickProvider(Dott)
        assertTrue(model.allProvidersSelected)
    }

    @Test
    fun selectionUsesLatestVehicleIndexAndMapRevisionOnlyChangesWithData() = runTest {
        val first = scooter(id = "first", provider = "lime")
        val second = scooter(id = "second", provider = "voi")
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(first, second)))
        val model = makeController(api)

        model.refresh()
        val loadingFinished = waitUntil { api.calls == 1 && model.lastUpdated.value != null }
        assertTrue(loadingFinished)
        val loadedRevision = model.mapScootersRevision.value

        model.selectScooter(second.id)

        assertEquals(second, model.selectedScooter)
        assertEquals(loadedRevision, model.mapScootersRevision.value)

        api.setResponse(ScooterResponse(vehicles = listOf(first)))
        model.refresh()
        val refreshed = waitUntil { api.calls == 2 && model.mapScootersRevision.value > loadedRevision && !model.isLoading.value }
        assertTrue(refreshed)
        assertNull(model.selectedScooter)
    }

    @Test
    fun locationPolicyRejectsStaleAndInaccurateSamplesAndChoosesBestFallback() {
        val now = Instant.now()
        val preferred = ScooterLocationFix(GeoPoint(47.3769, 8.5417), horizontalAccuracy = 50.0, timestamp = now)
        val fallback = ScooterLocationFix(GeoPoint(47.37, 8.54), horizontalAccuracy = 500.0, timestamp = now)
        val stale = ScooterLocationFix(GeoPoint(47.37, 8.54), horizontalAccuracy = 10.0, timestamp = now.addingTimeInterval(-31.0))

        assertTrue(ScooterLocationPolicy.isAcceptable(preferred, maximumAccuracy = ScooterLocationPolicy.preferredAccuracy))
        assertFalse(ScooterLocationPolicy.isAcceptable(fallback, maximumAccuracy = ScooterLocationPolicy.preferredAccuracy))
        assertFalse(ScooterLocationPolicy.isAcceptable(stale, maximumAccuracy = ScooterLocationPolicy.fallbackAccuracy))
        assertSame(preferred, ScooterLocationPolicy.bestCandidate(listOf(fallback, stale, preferred)))
    }

    @Test
    fun userLocationFocusShowsAboutThreeHundredFiftyMetres() = runTest {
        val locationManager = FakeLocationManager()
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())), locationManager = locationManager)
        val location = ScooterLocationFix(GeoPoint(47.3769, 8.5417), horizontalAccuracy = 25.0, timestamp = Instant.now())
        val expectedFocusMeters = 350.0

        model.locationsUpdated(listOf(location))

        val openingFocus = unwrap(model.focusRequest.value)
        assertEquals(expectedFocusMeters, openingFocus.latitudinalMeters, 0.001)
        assertEquals(expectedFocusMeters, openingFocus.longitudinalMeters, 0.001)
        assertEquals(17, model.viewportZoom.value)

        model.focusOnUser()

        val buttonFocus = unwrap(model.focusRequest.value)
        assertNotEquals(openingFocus.token, buttonFocus.token)
        assertEquals(expectedFocusMeters, buttonFocus.latitudinalMeters, 0.001)
        assertEquals(expectedFocusMeters, buttonFocus.longitudinalMeters, 0.001)
    }

    @Test
    fun onlyDeniedLocationAccessOffersASettingsShortcut() {
        assertTrue(ScooterLocationIssue.Denied.canOpenSettings)
        assertFalse(ScooterLocationIssue.Restricted.canOpenSettings)
        assertFalse(ScooterLocationIssue.Denied.message.isEmpty())
        assertFalse(ScooterLocationIssue.Restricted.message.isEmpty())
        assertNotEquals(ScooterLocationIssue.Denied.message, ScooterLocationIssue.Restricted.message)
    }

    @Test
    fun addressSelectionCreatesDestinationAndNewFocusRequests() = runTest {
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        val firstDestination = MapDestination(title = "Zürich HB", point = GeoPoint(47.3782, 8.5402))
        val secondDestination = MapDestination(title = "Bellevue", point = GeoPoint(47.3665, 8.5451))

        model.selectScooter("lime:selected")
        model.focusOnAddress(firstDestination)

        assertNull(model.selectedScooterID.value)
        assertEquals(firstDestination, model.searchedDestination.value)
        assertEquals(firstDestination.point, model.focusRequest.value?.point)
        val firstToken = model.focusRequest.value?.token

        model.focusOnAddress(secondDestination)

        assertEquals(secondDestination, model.searchedDestination.value)
        assertEquals(secondDestination.point, model.focusRequest.value?.point)
        assertNotEquals(firstToken, model.focusRequest.value?.token)

        model.clearAddressSearch()
        assertNull(model.searchedDestination.value)
    }

    @Test
    fun activeOriginPrefersSearchedDestinationAndDistanceUsesIt() = runTest {
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        val userLocation = GeoPoint(47.3769, 8.5417)
        val destination = MapDestination(title = "Zürich HB", point = GeoPoint(47.3782, 8.5402))
        val candidate = scooter(id = "candidate", provider = "lime", latitude = 47.3790, longitude = 8.5402)
        model.setUserLocation(userLocation)

        assertEquals(NearbyOrigin.UserLocation(userLocation), model.activeOrigin)

        model.focusOnAddress(destination)

        assertEquals(NearbyOrigin.SearchedDestination(destination), model.activeOrigin)
        assertEquals(candidate.formattedDistance(from = destination.point), model.formattedDistance(candidate))
        assertEquals(candidate.distance(from = destination.point), unwrap(model.straightLineDistance(candidate)), 0.001)

        model.clearAddressSearch()

        assertEquals(NearbyOrigin.UserLocation(userLocation), model.activeOrigin)
        assertEquals(candidate.formattedDistance(from = userLocation), model.formattedDistance(candidate))
    }

    @Test
    fun approximateWalkingMinutesUseStraightLineDistanceAtEightyMetersPerMinute() = runTest {
        val origin = GeoPoint(47.3769, 8.5417)
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        model.setUserLocation(origin)
        val samePlace = scooter(id = "same-place", provider = "lime", latitude = origin.latitude, longitude = origin.longitude)
        val aboutOneHundredElevenMetersAway = scooter(
            id = "two-minutes",
            provider = "lime",
            latitude = origin.latitude + 0.001,
            longitude = origin.longitude,
        )

        assertEquals(1, model.approximateWalkingMinutes(samePlace))
        assertEquals(2, model.approximateWalkingMinutes(aboutOneHundredElevenMetersAway))
        assertTrue(unwrap(model.straightLineDistance(aboutOneHundredElevenMetersAway)) > 80)

        model.setUserLocation(null)

        assertNull(model.straightLineDistance(samePlace))
        assertNull(model.approximateWalkingMinutes(samePlace))
        assertNull(model.formattedDistance(samePlace))
    }

    @Test
    fun quickProviderChoicesKeepReliableCountsForHiddenProviders() = runTest {
        val origin = GeoPoint(47.3769, 8.5417)
        val model = loadedController(
            vehicles = listOf(
                scooter(id = "bird", provider = "bird"),
                scooter(id = "dott", provider = "dott"),
                scooter(id = "lime", provider = "lime"),
            ),
            origin = origin,
        )

        model.showProviders(setOf(Bird, Dott))

        assertEquals(setOf(Bird, Dott), model.mapScooters.value.mapNotNull { it.providerInfo }.toSet())
        assertEquals(2, model.visibleCount)
        assertEquals(1, model.count(Bird))
        assertEquals(1, model.count(Dott))
        assertEquals(1, model.count(Lime))
        assertEquals(3, model.allProviderCount)

        model.showProviders(setOf(Bird))

        assertEquals(listOf(Bird), model.mapScooters.value.mapNotNull { it.providerInfo })
        assertEquals(1, model.visibleCount)
        assertEquals(1, model.count(Dott))
    }

    @Test
    fun quickProviderOrderFollowsCountsAndKeepsCatalogueOrderForTies() = runTest {
        val origin = GeoPoint(47.3769, 8.5417)
        val model = loadedController(
            vehicles = listOf(
                scooter(id = "bird-one", provider = "bird"),
                scooter(id = "bird-two", provider = "bird"),
                scooter(id = "bolt-one", provider = "bolt"),
                scooter(id = "bolt-two", provider = "bolt"),
                scooter(id = "dott", provider = "dott"),
                scooter(id = "lime", provider = "lime"),
            ),
            origin = origin,
        )

        assertEquals(listOf(Bolt, Bird, Dott, Lime), model.dockChips.take(4).map { it.provider })
        assertEquals(listOf(Hopp, Voi), model.dockChips.drop(4).take(2).map { it.provider })

        // Choosing providers highlights their chips without moving them.
        model.showProviders(setOf(Lime, Voi))

        assertEquals(listOf(Bolt, Bird, Dott, Lime), model.dockChips.take(4).map { it.provider })
        assertEquals(listOf(Lime, Voi), model.dockChips.filter { it.isSelected }.map { it.provider })
        assertEquals(2, model.dockChips.firstOrNull()?.count)
    }

    @Test
    fun providerChoicePersistsAcrossModelInstances() = runTest {
        val defaults = InMemoryScooterDefaults()
        val firstModel = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())), defaults = defaults)

        firstModel.showProviders(setOf(Hopp, Publibike))

        val restoredModel = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())), defaults = defaults)

        assertEquals(setOf(Hopp, Publibike), restoredModel.enabledProviders.value)
    }

    @Test
    fun appearanceGoesByTheSunUntilOneIsChosenAndIsKept() = runTest {
        val defaults = InMemoryScooterDefaults()
        val clock = TestClock()
        fun newModel(): ScooterMapController =
            makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())), clock = clock, defaults = defaults)
        val firstModel = newModel()
        assertEquals(ScooterAppearance.Sun, firstModel.appearance.value)
        // In Switzerland, where the map opens, until the rider is located.
        clock.now = date("2026-10-24T18:45:00+02:00")
        assertEquals(UserInterfaceStyle.Light, firstModel.interfaceStyle)
        clock.now = date("2026-10-24T19:00:00+02:00")
        assertEquals(UserInterfaceStyle.Dark, firstModel.interfaceStyle)
        // Where the rider is: in Lisbon it sets at 18:46, an hour and 23 minutes later.
        firstModel.setUserLocation(GeoPoint(38.7223, -9.1393))
        clock.now = date("2026-10-24T18:00:00+01:00")
        assertEquals(UserInterfaceStyle.Light, firstModel.interfaceStyle)
        clock.now = date("2026-10-24T19:20:00+01:00")
        assertEquals(UserInterfaceStyle.Dark, firstModel.interfaceStyle)

        firstModel.setAppearance(ScooterAppearance.Light)
        assertEquals(UserInterfaceStyle.Light, firstModel.interfaceStyle)
        firstModel.setAppearance(ScooterAppearance.Dark)

        val restoredModel = newModel()
        assertEquals(ScooterAppearance.Dark, restoredModel.appearance.value)
        assertEquals(UserInterfaceStyle.Dark, restoredModel.interfaceStyle)

        // Automatic as it was before the sun, chosen in Settings, still follows the phone.
        defaults.set("automatic", forKey = "appearance")
        val systemModel = newModel()
        assertEquals(ScooterAppearance.System, systemModel.appearance.value)
        assertEquals(UserInterfaceStyle.Unspecified, systemModel.interfaceStyle)

        // A value the app no longer knows goes by the sun.
        defaults.set("sepia", forKey = "appearance")
        assertEquals(ScooterAppearance.Sun, newModel().appearance.value)
    }

    @Test
    fun chosenLanguageChangesTheTextAtOnceAndIsKeptWhereIOSReadsIt() = runTest {
        var appLanguages: List<String>? = null
        val model = makeController(
            StubScooterAPI(ScooterResponse(vehicles = emptyList())),
            keepAppLanguages = { appLanguages = it },
        )
        assertEquals(ScooterLanguage.atLaunch, model.language.value)

        model.setLanguageChoice(ScooterLanguageChoice.Language(ScooterLanguage.Fr))
        assertEquals(ScooterLanguage.Fr, model.language.value)
        assertEquals(ScooterLanguage.Fr, ScooterLanguage.current)
        assertEquals("Épuré", AppleMapStyle.Quiet.label)
        assertEquals("Sombre", ScooterAppearance.Dark.label)
        assertEquals("fr", ScooterLanguage.current.locale.language)
        assertEquals(listOf("fr"), appLanguages)

        model.setLanguageChoice(ScooterLanguageChoice.Language(ScooterLanguage.De))
        assertEquals("Ruhig", AppleMapStyle.Quiet.label)
        assertEquals("Dunkel", ScooterAppearance.Dark.label)
        // The numbers keep to the region of the phone, whichever the language.
        assertEquals("de", ScooterLanguage.current.locale.language)
        assertEquals(ScooterLanguage.launchLocale().country, ScooterLanguage.current.locale.country)
        assertEquals(listOf("de"), appLanguages)
    }

    @Test
    fun automaticTakesTheChosenLanguageAwayAndShowsTheIPhonesAtOnce() = runTest {
        var appLanguages: List<String>? = null
        var phoneLanguages = listOf("ja-JP", "is-IS", "en-GB")
        val model = makeController(
            StubScooterAPI(ScooterResponse(vehicles = emptyList())),
            phoneLanguages = { phoneLanguages },
            keepAppLanguages = { appLanguages = it },
        )
        // The first of the phone's languages the app is translated into.
        assertEquals(ScooterLanguage.Is, model.phoneLanguage)

        // From whatever the app was launched with.
        model.setLanguageChoice(ScooterLanguageChoice.Automatic)
        model.setLanguageChoice(ScooterLanguageChoice.Language(ScooterLanguage.Fr))
        assertEquals(listOf("fr"), appLanguages)

        model.setLanguageChoice(ScooterLanguageChoice.Automatic)
        // Gone from the app's own locales, so that Android follows the phone at the next launch.
        assertEquals(emptyList<String>(), appLanguages)
        assertEquals(ScooterLanguageChoice.Automatic, model.languageChoice.value)
        assertEquals(ScooterLanguage.Is, model.language.value)
        assertEquals(ScooterLanguage.Is, ScooterLanguage.current)
        assertEquals("Dökkt", ScooterAppearance.Dark.label)

        // A language chosen again is kept again.
        model.setLanguageChoice(ScooterLanguageChoice.Language(ScooterLanguage.It))
        assertEquals(listOf("it"), appLanguages)
        assertEquals("Automatico", ScooterAppearance.Sun.label)
        assertEquals("Sistema", ScooterAppearance.System.label)

        // A phone in none of the app's languages is followed in English.
        phoneLanguages = listOf("ja-JP", "zh-Hans-CN")
        model.setLanguageChoice(ScooterLanguageChoice.Automatic)
        assertEquals(ScooterLanguage.En, model.language.value)
        assertEquals(emptyList<String>(), appLanguages)
    }

    @Test
    fun rideDurationAndProviderPassesPersistIndependently() = runTest {
        val defaults = InMemoryScooterDefaults()
        val firstModel = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())), defaults = defaults)
        val expiryDate = Instant.ofEpochSecond(1_800_000_000)
        val boltPass = ProviderRidePass(
            enabled = true,
            freeUnlock = true,
            freeMinutes = 15,
            expiryDate = expiryDate,
        )
        val voiPass = ProviderRidePass(enabled = true, freeMinutes = 5)

        firstModel.setRideEstimateMinutes(20)
        firstModel.setRidePass(boltPass, Bolt)
        firstModel.setRidePass(voiPass, Voi)

        val restoredModel = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())), defaults = defaults)

        assertEquals(20, restoredModel.rideEstimateMinutes.value)
        assertEquals(boltPass, restoredModel.ridePass(Bolt))
        assertEquals(voiPass, restoredModel.ridePass(Voi))
        assertEquals(ProviderRidePass(), restoredModel.ridePass(Lime))
    }

    @Test
    fun invalidStoredRideDurationFallsBackToTenMinutes() = runTest {
        val defaults = InMemoryScooterDefaults()
        defaults.set(17, forKey = "ride-estimate-minutes-v1")

        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())), defaults = defaults)

        assertEquals(RideEstimateDuration.defaultMinutes, model.rideEstimateMinutes.value)
    }

    @Test
    fun ridePriceQuoteUsesTheSelectedScootersProviderPass() = runTest {
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        model.setRideEstimateMinutes(10)
        model.setRidePass(ProviderRidePass(enabled = true, freeUnlock = true, freeMinutes = 5), Bolt)
        model.setRidePass(ProviderRidePass(enabled = true, freeUnlock = true, freeMinutes = 10), Voi)
        val bolt = Scooter(
            provider = "bolt",
            latitude = 47.3769,
            longitude = 8.5417,
            battery = 90,
            rangeMeters = null,
            vehicleID = "priced",
            deepLink = null,
            rentalURIs = null,
            distanceMeters = 0.0,
            pricing = ScooterRidePricing(
                currency = "CHF",
                unlockFeeMinorUnits = 100,
                minuteFeeMinorUnits = 42,
            ),
        )

        val quote = unwrap(model.ridePriceQuote(bolt))

        assertEquals(520, quote.grossMinorUnits)
        assertEquals(210, quote.totalMinorUnits)
        assertEquals(0, quote.chargedUnlockFeeMinorUnits)
        assertEquals(5, quote.billedMinutes)
        assertEquals(5, quote.freeMinutesApplied)
        assertTrue(quote.passApplied)
    }

    @Test
    fun focusingOnUserClearsSearchedDestinationAndRestoresUserOrigin() = runTest {
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        val userLocation = GeoPoint(47.3769, 8.5417)
        val destination = MapDestination(title = "Bellevue", point = GeoPoint(47.3665, 8.5451))
        model.setUserLocation(userLocation)
        model.focusOnAddress(destination)

        model.focusOnUser()

        assertNull(model.searchedDestination.value)
        assertEquals(NearbyOrigin.UserLocation(userLocation), model.activeOrigin)
        assertEquals(userLocation, model.focusRequest.value?.point)
    }

    @Test
    fun returningToLoadedAreaDiscardsPendingOtherArea() = runTest {
        val api = DelayedSecondAPI()
        val model = makeController(api)
        val a = MapRegion(GeoPoint(47.377, 8.542), latitudeDelta = 0.01, longitudeDelta = 0.01)
        val b = MapRegion(GeoPoint(45.75, 4.85), latitudeDelta = 0.01, longitudeDelta = 0.01)
        model.updateViewport(a, zoom = 16)
        val aLoaded = waitUntil { api.callCount() == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(aLoaded)
        assertEquals(1, model.visibleCount)
        model.updateViewport(b, zoom = 16)
        val bRequested = waitUntil { api.callCount() == 2 }
        assertTrue(bRequested)
        model.updateViewport(a, zoom = 16)
        advanceTimeBy(650)
        runCurrent()
        assertEquals(GeoBounds(a), model.viewport.value)
        assertEquals("Returning to cached A must not let pending B erase A's scooter", 1, model.visibleCount)
        assertEquals(47.377, model.mapScooters.value.firstOrNull()?.latitude)
    }

    @Test
    fun unsolicitedNetworkCancellationClearsLoading() = runTest {
        val api = CancelledAPI()
        val model = makeController(api)
        model.refresh()
        // Waits for the request rather than a fixed time: a slow CI simulator
        // can take longer than that to come back to the main actor.
        val cleared = waitUntil { api.callCount() == 1 && !model.isLoading.value }
        assertTrue("A cancelled request should clear loading and pending state", cleared)
        model.autoRefreshIfNeeded()
        val retried = waitUntil { api.callCount() == 2 && !model.isLoading.value }
        assertTrue("With nothing pending, the next automatic refresh asks again", retried)
    }

    // Freshness, refresh and failures.

    @Test
    fun firstLoadFailureIsReportedWithItsReasonWhileTheDockWaits() = runTest {
        val api = StubScooterAPI(ScooterResponse(vehicles = emptyList()))
        api.setFailure(ScooterAPIError.HttpStatus(503))
        val model = makeController(api)
        assertEquals(ScooterDockContent.Finding(chips = emptyList()), model.dock)

        model.refresh()
        val failed = waitUntil { api.calls == 1 && model.loadIssue.value != null && !model.isLoading.value }

        assertTrue(failed)
        assertEquals(ScooterLoadIssue.FirstLoadFailed(ScooterLoadFailure.Unavailable), model.loadIssue.value)
        assertEquals(ScooterDockContent.Waiting, model.dock)
        assertNull(model.lastUpdated.value)

        api.setFailure(null)
        model.retryLoad()
        val recovered = waitUntil { api.calls == 2 && model.loadIssue.value == null && model.lastUpdated.value != null }

        assertTrue(recovered)
        summaryOf(model.dock)
    }

    @Test
    fun failedRefreshKeepsValidDataAndNamesTheTimeStillShown() = runTest {
        val clock = TestClock()
        val api = StubScooterAPI(timedResponse(generatedAt = clock.now, expiresIn = 300.0))
        val model = makeController(api, clock = clock)
        model.refresh()
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        val shownAt = unwrap(model.lastUpdated.value)
        val revision = model.mapScootersRevision.value

        api.setFailure(ScooterAPIError.Offline())
        clock.advance(61.0)
        model.autoRefreshIfNeeded()
        val failed = waitUntil { api.calls == 2 && model.loadIssue.value != null && !model.isLoading.value }

        assertTrue(failed)
        assertEquals(ScooterLoadIssue.RefreshFailed(ScooterLoadFailure.Offline, showing = shownAt), model.loadIssue.value)
        assertEquals(1, model.mapScooters.value.size)
        assertEquals("Markers stay exactly as they are", revision, model.mapScootersRevision.value)
        val offline = summaryOf(model.dock)
        assertEquals(ScooterDockStatus.Offline(showing = shownAt), offline.status(at = clock.now))
        assertEquals(true, offline.status(at = clock.now)?.isWarning)
        assertTrue(offline.showsTryAgain)
        assertEquals(1, offline.count)

        api.setFailure(ScooterAPIError.TimedOut())
        model.retryLoad()
        val failedAgain = waitUntil {
            api.calls == 3 &&
                model.loadIssue.value == ScooterLoadIssue.RefreshFailed(ScooterLoadFailure.Timeout, showing = shownAt) &&
                !model.isLoading.value
        }

        assertTrue(failedAgain)
        val timedOut = summaryOf(model.dock)
        assertEquals(ScooterDockStatus.RefreshFailed(showing = shownAt), timedOut.status(at = clock.now))

        api.setFailure(null)
        model.retryLoad()
        val recovered = waitUntil { api.calls == 4 && model.loadIssue.value == null && !model.isLoading.value }

        assertTrue(recovered)
        val healthy = summaryOf(model.dock)
        assertFalse(healthy.showsTryAgain)
        assertEquals(false, healthy.status(at = clock.now)?.isWarning)
    }

    @Test
    fun failedRefreshKeepsScootersForFifteenMinutesAtMost() = runTest {
        val clock = TestClock()
        val generatedAt = clock.now
        // Even an overly generous server expiry is capped at fifteen minutes.
        val api = StubScooterAPI(timedResponse(generatedAt = generatedAt, expiresIn = 3_600.0))
        val model = makeController(api, clock = clock)
        model.refresh()
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        api.setFailure(ScooterAPIError.HttpStatus(503))
        clock.advance(480.0)
        model.autoRefreshIfNeeded()
        val failed = waitUntil { api.calls == 2 && model.loadIssue.value != null && !model.isLoading.value }
        assertTrue(failed)
        assertEquals(ScooterLoadIssue.RefreshFailed(ScooterLoadFailure.Unavailable, showing = generatedAt), model.loadIssue.value)
        assertEquals(1, model.mapScooters.value.size)

        clock.advance(420.0)
        model.autoRefreshIfNeeded()
        val expired = waitUntil {
            api.calls == 3 &&
                model.loadIssue.value == ScooterLoadIssue.OutOfDate(ScooterLoadFailure.Unavailable, lastUpdate = generatedAt) &&
                !model.isLoading.value
        }
        assertTrue(expired)
        assertTrue(model.mapScooters.value.isEmpty())
    }

    @Test
    fun expiredDataIsClearedOnlyWhenTheRefreshThatFollowsFails() = runTest {
        val clock = TestClock()
        val generatedAt = clock.now
        val api = StubScooterAPI(timedResponse(generatedAt = generatedAt, expiresIn = 60.0))
        val model = makeController(api, clock = clock)
        model.refresh()
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        model.selectScooter(unwrap(model.mapScooters.value.firstOrNull()?.id))

        // Passing the expiry clears nothing by itself.
        clock.advance(61.0)
        assertEquals(1, model.mapScooters.value.size)
        assertNotNull(model.selectedScooter)
        assertNull(model.loadIssue.value)

        api.setFailure(ScooterAPIError.TimedOut())
        model.autoRefreshIfNeeded()
        val expired = waitUntil { api.calls == 2 && model.loadIssue.value != null && !model.isLoading.value }

        assertTrue(expired)
        assertEquals(ScooterLoadIssue.OutOfDate(ScooterLoadFailure.Timeout, lastUpdate = generatedAt), model.loadIssue.value)
        assertTrue(model.mapScooters.value.isEmpty())
        assertNull(model.selectedScooterID.value)
        assertEquals(generatedAt, model.lastUpdated.value)
        assertEquals(ScooterDockContent.OutOfDate(ScooterLoadFailure.Timeout, lastUpdate = generatedAt), model.dock)

        // The reason follows the latest attempt; the last update does not move.
        api.setFailure(ScooterAPIError.Offline())
        model.retryLoad()
        val stillOutOfDate = waitUntil {
            api.calls == 3 &&
                model.loadIssue.value == ScooterLoadIssue.OutOfDate(ScooterLoadFailure.Offline, lastUpdate = generatedAt) &&
                !model.isLoading.value
        }
        assertTrue(stillOutOfDate)

        api.setFailure(null)
        model.retryLoad()
        val recovered = waitUntil { api.calls == 4 && model.loadIssue.value == null && !model.isLoading.value }

        assertTrue(recovered)
        assertEquals(1, model.mapScooters.value.size)
        summaryOf(model.dock)
    }

    @Test
    fun responseIsNeverAnErrorBecauseOfItsOwnTimestamps() = runTest {
        val clock = TestClock()
        // Observed six minutes ago, so it arrives already past its own expiry.
        val api = StubScooterAPI(timedResponse(generatedAt = clock.now.addingTimeInterval(-360.0), expiresIn = 300.0))
        val model = makeController(api, clock = clock)

        model.refresh()
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }

        assertTrue(loaded)
        assertNull(model.loadIssue.value)
        assertEquals(1, model.mapScooters.value.size)
        val summary = summaryOf(model.dock)
        assertEquals(ScooterDockStatus.UpdatedMinutesAgo(6), summary.status(at = clock.now))

        // The next attempt follows as soon as the gap between attempts allows.
        clock.advance(9.0)
        model.autoRefreshIfNeeded()
        settle()
        assertEquals(1, api.calls)

        clock.advance(1.0)
        model.autoRefreshIfNeeded()
        val refreshed = waitUntil { api.calls == 2 && !model.isLoading.value }

        assertTrue(refreshed)
        assertEquals(2, api.calls)
        assertNull(model.loadIssue.value)
        assertEquals(1, model.mapScooters.value.size)
    }

    @Test
    fun automaticRefreshWaitsForTheIntervalOrTheApproachingExpiry() = runTest {
        val clock = TestClock()
        val api = StubScooterAPI(timedResponse(generatedAt = clock.now, expiresIn = 300.0))
        val model = makeController(api, clock = clock)
        model.refresh()
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        clock.advance(59.0)
        model.autoRefreshIfNeeded()
        settle()
        assertEquals(1, api.calls)

        clock.advance(1.0)
        model.autoRefreshIfNeeded()
        val refreshedAfterInterval = waitUntil { api.calls == 2 && !model.isLoading.value }
        assertTrue(refreshedAfterInterval)

        // Data that expires sooner is refreshed five seconds before it does.
        api.setResponse(timedResponse(generatedAt = clock.now, expiresIn = 40.0))
        model.refresh()
        val reloaded = waitUntil { api.calls == 3 && !model.isLoading.value }
        assertTrue(reloaded)

        clock.advance(34.0)
        model.autoRefreshIfNeeded()
        settle()
        assertEquals(3, api.calls)

        clock.advance(1.0)
        model.autoRefreshIfNeeded()
        val refreshedBeforeExpiry = waitUntil { api.calls == 4 && !model.isLoading.value }
        assertTrue(refreshedBeforeExpiry)
    }

    @Test
    fun automaticRetriesKeepTenSecondsBetweenAttempts() = runTest {
        val clock = TestClock()
        val api = StubScooterAPI(ScooterResponse(vehicles = emptyList()))
        api.setFailure(ScooterAPIError.HttpStatus(429))
        val model = makeController(api, clock = clock)
        model.refresh()
        val failed = waitUntil {
            api.calls == 1 && model.loadIssue.value == ScooterLoadIssue.FirstLoadFailed(ScooterLoadFailure.Busy) && !model.isLoading.value
        }
        assertTrue(failed)

        clock.advance(9.0)
        model.autoRefreshIfNeeded()
        settle()
        assertEquals(1, api.calls)

        clock.advance(1.0)
        model.autoRefreshIfNeeded()
        val retried = waitUntil { api.calls == 2 && !model.isLoading.value }
        assertTrue(retried)
    }

    @Test
    fun returningToTheForegroundRefreshesAtOnceWhenARefreshIsDue() = runTest {
        val clock = TestClock()
        val api = StubScooterAPI(timedResponse(generatedAt = clock.now, expiresIn = 300.0))
        val model = makeController(api, clock = clock)
        model.refresh()
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        // Nothing refreshes while the app is in the background.
        model.becameInactive()
        clock.advance(61.0)
        model.autoRefreshIfNeeded()
        settle()
        assertEquals(1, api.calls)

        api.setFailure(ScooterAPIError.Offline())
        model.becameActive()
        val refreshedOnReturn = waitUntil { api.calls == 2 && !model.isLoading.value }

        assertTrue(refreshedOnReturn)
        assertEquals("The old data stays until it has expired", 1, model.mapScooters.value.size)

        // A return to the foreground does not wait for the gap between attempts.
        model.becameInactive()
        clock.advance(2.0)
        model.becameActive()
        val retriedOnReturn = waitUntil { api.calls == 3 && !model.isLoading.value }
        assertTrue(retriedOnReturn)

        // Nothing is due right after a successful load.
        api.setFailure(null)
        model.retryLoad()
        val recovered = waitUntil { api.calls == 4 && model.loadIssue.value == null && !model.isLoading.value }
        assertTrue(recovered)
        model.becameInactive()
        clock.advance(30.0)
        model.becameActive()
        settle()
        assertEquals(4, api.calls)
    }

    @Test
    fun expiryWaitsForTheRequestInFlightBeforeAnythingIsCleared() = runTest {
        val clock = TestClock()
        val generatedAt = clock.now
        val api = HeldScooterAPI(timedResponse(generatedAt = generatedAt, expiresIn = 60.0))
        val model = makeController(api, clock = clock)
        model.refresh()
        val loaded = waitUntil { api.callCount() == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        api.holdNextRequest()
        clock.advance(56.0)
        model.autoRefreshIfNeeded()
        val inFlight = waitUntil { api.isHolding }
        assertTrue(inFlight)

        // The data expires while that request is still out: no second request, nothing cleared.
        clock.advance(5.0)
        model.autoRefreshIfNeeded()
        settle()
        assertEquals(2, api.callCount())
        assertEquals(1, model.mapScooters.value.size)
        assertNull(model.loadIssue.value)

        api.release(failing = ScooterAPIError.Offline())
        val cleared = waitUntil { api.callCount() == 2 && model.loadIssue.value != null && !model.isLoading.value }

        assertTrue(cleared)
        assertEquals(ScooterLoadIssue.OutOfDate(ScooterLoadFailure.Offline, lastUpdate = generatedAt), model.loadIssue.value)
        assertTrue(model.mapScooters.value.isEmpty())
    }

    @Test
    fun modelRetriesByItselfWhileActiveAndWaitsWhileInTheBackground() = runTest {
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "one", provider = "lime"))))
        api.setFailure(ScooterAPIError.TimedOut())
        val model = makeController(api, refreshPolicy = ScooterRefreshPolicy(minimumAttemptGap = 0.05))

        // Nothing nudges the model: it keeps trying on its own.
        model.refresh()
        val retried = waitUntil { api.calls >= 3 }
        assertTrue(retried)
        assertEquals(ScooterLoadIssue.FirstLoadFailed(ScooterLoadFailure.Timeout), model.loadIssue.value)

        // In the background it stops.
        model.becameInactive()
        settle()
        val callsInBackground = api.calls
        advanceTimeBy(200)
        runCurrent()
        val callsLater = api.calls
        assertEquals(callsInBackground, callsLater)

        // Back in the foreground it tries at once, and a success ends the retries.
        api.setFailure(null)
        model.becameActive()
        val recovered = waitUntil {
            api.calls == callsLater + 1 &&
                model.loadIssue.value == null && model.lastUpdated.value != null && !model.isLoading.value
        }
        assertTrue(recovered)
        assertEquals(1, model.mapScooters.value.size)
        val callsAfterRecovery = api.calls
        assertEquals(callsLater + 1, callsAfterRecovery)
        advanceTimeBy(200)
        runCurrent()
        assertEquals(callsAfterRecovery, api.calls)
    }

    @Test
    fun parkingExpiresOnItsOwnScheduleWhileScootersStay() = runTest {
        val clock = TestClock()
        val bay = ScooterParking(
            id = "bay", provider = "lime", name = "Bay",
            latitude = 47.3769, longitude = 8.5417, mandatory = true,
        )
        val api = StubScooterAPI(
            timedResponse(generatedAt = clock.now, expiresIn = 60.0, parking = listOf(bay), parkingExpiresIn = 120.0),
        )
        val model = makeController(api, clock = clock)
        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        model.selectParking(bay.id)
        assertEquals(bay, model.selectedParking)

        clock.advance(119.0)
        model.expireParkingIfNeeded()
        assertEquals(listOf(bay), model.parking.value)
        assertEquals(1, model.mapScooters.value.size)

        clock.advance(2.0)
        model.expireParkingIfNeeded()
        assertTrue(model.parking.value.isEmpty())
        assertNull(model.selectedParkingID.value)
        assertEquals(1, model.mapScooters.value.size)
        assertNull(model.loadIssue.value)
    }

    @Test
    fun aPhoneClockTwentyMinutesFastNeitherExpiresNorAgesFreshData() = runTest {
        assertServerTimesFollowTheServersClock(clockOffset = 1_200.0)
    }

    @Test
    fun aPhoneClockTwentyMinutesSlowStillExpiresDataWhenTheServerSays() = runTest {
        assertServerTimesFollowTheServersClock(clockOffset = -1_200.0)
    }

    /**
     * The phone's clock is `clockOffset` ahead of the server's. By the server's clock the response was just
     * generated, its scooters expire in ten minutes and its bays in three, and that is what the phone keeps to.
     */
    private fun TestScope.assertServerTimesFollowTheServersClock(clockOffset: Double) {
        val clock = TestClock()
        val receivedAt = clock.now
        val bay = ScooterParking(
            id = "bay", provider = "lime", name = "Bay",
            latitude = 47.3769, longitude = 8.5417, mandatory = true,
        )
        val api = StubScooterAPI(
            timedResponse(
                generatedAt = receivedAt.addingTimeInterval(-clockOffset), expiresIn = 600.0,
                parking = listOf(bay), parkingExpiresIn = 180.0, clockOffset = clockOffset,
            ),
        )
        val model = makeController(api, clock = clock)
        model.updateViewport(zurichRegion, zoom = 16)
        // At once, instead of the map's fetch, which first waits 180 ms.
        model.refresh()
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        // Just generated: the bays stay and the dock reads Live.
        assertEquals(listOf(bay), model.parking.value)
        assertEquals(receivedAt, model.lastUpdated.value)
        val summary = summaryOf(model.dock)
        assertEquals(ScooterDockStatus.Live, summary.status(at = clock.now))

        // The next request waits for the server's minute, not the ten seconds between retries.
        clock.advance(59.0)
        model.autoRefreshIfNeeded()
        settle()
        assertEquals(1, api.calls)
        clock.advance(1.0)
        model.autoRefreshIfNeeded()
        val refreshed = waitUntil { api.calls == 2 && !model.isLoading.value }
        assertTrue(refreshed)

        // A failed refresh keeps the scooters while the server still has them fresh.
        api.setFailure(ScooterAPIError.Offline())
        clock.advance(60.0)
        model.autoRefreshIfNeeded()
        val failed = waitUntil { api.calls == 3 && model.loadIssue.value != null && !model.isLoading.value }
        assertTrue(failed)
        assertEquals(ScooterLoadIssue.RefreshFailed(ScooterLoadFailure.Offline, showing = receivedAt), model.loadIssue.value)
        assertEquals(1, model.mapScooters.value.size)

        // The bays go when the server said they would.
        clock.advance(59.0)
        model.expireParkingIfNeeded()
        assertEquals(listOf(bay), model.parking.value)
        clock.advance(2.0)
        model.expireParkingIfNeeded()
        assertTrue(model.parking.value.isEmpty())

        // So do the scooters, once a refresh after their expiry fails as well.
        clock.advance(420.0)
        model.autoRefreshIfNeeded()
        val expired = waitUntil {
            api.calls == 4 &&
                model.loadIssue.value == ScooterLoadIssue.OutOfDate(ScooterLoadFailure.Offline, lastUpdate = receivedAt) &&
                !model.isLoading.value
        }
        assertTrue(expired)
        assertTrue(model.mapScooters.value.isEmpty())
    }

    // Provider health and the dock.

    @Test
    fun skiensWinterNoticeGivesWayWhenRydeBringsItsScootersBackInMarch() = runTest {
        val clock = TestClock()
        clock.now = date("2027-03-20T12:00:00Z")
        fun response(vehicles: List<Scooter>): ScooterResponse = ScooterResponse(
            vehicles = vehicles,
            meta = ScooterResponseMetadata(
                partial = false, failedSources = emptyList(), generatedAt = iso(clock.now),
                refreshAfterSeconds = 60, expiresAt = iso(clock.now.addingTimeInterval(300.0)),
            ),
        )
        val api = StubScooterAPI(response(emptyList()))
        val model = makeController(api, clock = clock)
        model.updateViewport(MapRegion(GeoPoint(59.2075, 9.6107), latitudeDelta = 0.01, longitudeDelta = 0.01), zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        // Still in its pause, with nothing in view: since 15 December, until the streets are clear.
        val season = ScooterSeasonalPause.Active(city = "Skien", back = ScooterSeasonalPause.Return.Clear(from = "12-15"))
        assertEquals(listOf(ScooterDockNotice.Season(season)), model.dockNotices)

        // Ryde's scooters are back, even with Ryde filtered out: the notice gives way.
        api.setResponse(response(listOf(scooter(id = "ryde", provider = "ryde", latitude = 59.2075, longitude = 9.6107))))
        model.refresh()
        val back = waitUntil { api.calls == 2 && model.mapScooters.value.isNotEmpty() && !model.isLoading.value }
        assertTrue(back)
        assertEquals(emptyList<ScooterDockNotice>(), model.dockNotices)
        model.toggle(Ryde)
        assertEquals(0, model.visibleCount)
        assertEquals(emptyList<ScooterDockNotice>(), model.dockNotices)
    }

    @Test
    fun aTownWhooshClosedIsOffSeasonUntilItsScootersAreBackButNotAlmatyWhereJetRuns() = runTest {
        val clock = TestClock()
        clock.now = date("2026-10-28T09:00:00Z")
        fun response(vehicles: List<Scooter>, seasonOver: Set<String>): ScooterResponse = ScooterResponse(
            vehicles = vehicles,
            meta = ScooterResponseMetadata(
                partial = false, failedSources = emptyList(), generatedAt = iso(clock.now),
                refreshAfterSeconds = 60, expiresAt = iso(clock.now.addingTimeInterval(300.0)),
                seasonOver = seasonOver,
            ),
        )
        // Whoosh closed these three on 24 October 2026: the answers name its feed in each.
        val towns = listOf(
            Triple("Astana", "kazakhstan:whoosh_kz_nqz", GeoPoint(51.143975, 71.43581)),
            Triple("Zapopan", "mexico:whoosh_mx_zap", GeoPoint(20.721331, -103.391882)),
            Triple("Almaty", "kazakhstan:whoosh_kz_ala", GeoPoint(43.298812, 76.939435)),
        )
        for ((city, feed, center) in towns) {
            val api = StubScooterAPI(response(emptyList(), seasonOver = setOf(feed)))
            val model = makeController(api, clock = clock)
            model.updateViewport(MapRegion(center, latitudeDelta = 0.01, longitudeDelta = 0.01), zoom = 16)
            val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
            assertTrue(city, loaded)
            if (city == "Almaty") {
                // Jet runs there besides Whoosh.
                assertEquals(city, emptyList<ScooterDockNotice>(), model.dockNotices)
                continue
            }
            assertEquals(
                city,
                listOf(ScooterDockNotice.Season(ScooterSeasonalPause.Active(city = city, back = ScooterSeasonalPause.Return.SeasonOver))),
                model.dockNotices,
            )

            // A scooter in view, even filtered out: the notice gives way.
            val whoosh = scooter(id = "whoosh", provider = "whoosh", latitude = center.latitude, longitude = center.longitude)
            api.setResponse(response(listOf(whoosh), seasonOver = setOf(feed)))
            model.refresh()
            val back = waitUntil { api.calls == 2 && model.mapScooters.value.isNotEmpty() && !model.isLoading.value }
            assertTrue(city, back)
            assertEquals(city, emptyList<ScooterDockNotice>(), model.dockNotices)
            model.toggle(Whoosh)
            assertEquals(city, 0, model.visibleCount)
            assertEquals(city, emptyList<ScooterDockNotice>(), model.dockNotices)
        }
    }

    @Test
    fun downProvidersAreNamedOnlyWhereTheyOperateAndLeadTheChips() = runTest {
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = listOf(
                    scooter(id = "voi", provider = "voi"),
                    scooter(id = "lime-one", provider = "lime"),
                    scooter(id = "lime-two", provider = "lime"),
                ),
                meta = ScooterResponseMetadata(
                    partial = true,
                    failedSources = listOf("bird_zurich", "pony_fr_angers", "city-overview"),
                ),
            ),
        )
        val model = makeController(api)
        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        assertEquals(ScooterProviderHealth(downProviders = listOf(Bird), hasUnknownFailures = true), model.providerHealth)
        assertEquals(listOf(ScooterDockNotice.ProvidersDown(listOf(Bird))), model.dockNotices)

        val chips = model.dockChips
        assertEquals(listOf(Bird, Lime, Voi), chips.take(3).map { it.provider })
        assertEquals(listOf(Bolt, Dott, Hopp, Publibike), chips.drop(3).map { it.provider })
        assertEquals(listOf(Bird), chips.filter { it.isDown }.map { it.provider })
        assertEquals(0, chips[0].count)
        assertFalse(chips[0].downLabel.isEmpty())
        assertEquals(2, chips[1].count)

        // A chip that is down is never drawn as selected.
        model.showProviders(setOf(Bird, Lime))
        assertEquals(listOf(Lime), model.dockChips.filter { it.isSelected }.map { it.provider })
        assertEquals(listOf(Bird, Lime), model.dockChips.filter { it.isEnabled }.map { it.provider })

        // The filter sheet lists the same providers in catalogue order.
        assertEquals(model.availableProviders, model.filterProviders.map { it.provider })
        assertEquals(listOf(Bird), model.filterProviders.filter { it.isDown }.map { it.provider })
        assertEquals(listOf(Bird, Lime), model.filterProviders.filter { it.isEnabled }.map { it.provider })
    }

    /** Where one provider is the only one, the server answers its outage with an empty list and the failed feed, not with an error of its own. */
    @Test
    fun theOnlyProviderOfACityBeingDownIsNamedInsteadOfBlamingScooters() = runTest {
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = emptyList(),
                meta = ScooterResponseMetadata(partial = true, failedSources = listOf("france:dott_fr_lyon")),
            ),
        )
        val model = makeController(api)
        val lyon = MapRegion(GeoPoint(45.7578, 4.832), latitudeDelta = 0.01, longitudeDelta = 0.01)
        model.updateViewport(lyon, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        assertEquals(listOf(Dott), model.availableProviders)
        assertNull(model.loadIssue.value)
        val summary = summaryOf(model.dock)
        assertEquals(0, summary.count)
        assertNull(summary.refreshFailure)
        assertEquals(listOf(ScooterDockNotice.ProvidersDown(listOf(Dott))), summary.notices)
        assertEquals(listOf(Dott), summary.chips.map { it.provider })
        assertEquals(listOf(true), summary.chips.map { it.isDown })
        assertEquals(listOf(true), model.filterProviders.map { it.isDown })
        // The notice alone explains the empty map: no "Live", and no hint to look elsewhere.
        assertTrue(summary.everyProviderDown)
        assertNull(summary.status())
        assertNull(summary.hint)
    }

    @Test
    fun providerWithAFailedFeedAndScootersInViewIsNotReportedAsDown() = runTest {
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = listOf(scooter(id = "lime", provider = "lime", battery = 40)),
                meta = ScooterResponseMetadata(partial = true, failedSources = listOf("national:lime_winterthur")),
            ),
        )
        val model = makeController(api)
        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        assertEquals(ScooterProviderHealth.healthy, model.providerHealth)
        assertEquals(emptyList<ScooterDockNotice>(), model.dockNotices)
        assertTrue(model.dockChips.all { !it.isDown })
        assertEquals(Lime, model.dockChips.firstOrNull()?.provider)

        // The rider's own filters hide Lime's scooter; they do not make Lime look down.
        model.setMinimumBattery(60.0)
        model.showProviders(setOf(Voi))
        assertEquals(0, model.count(Lime))
        assertEquals(ScooterProviderHealth.healthy, model.providerHealth)
        assertEquals(emptyList<ScooterDockNotice>(), model.dockNotices)
        assertTrue(model.filterProviders.all { !it.isDown })
    }

    @Test
    fun cityTotalsNameNoProviderAsDown() = runTest {
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = emptyList(),
                clusters = listOf(
                    ScooterCluster(
                        id = "city:ch:zurich", latitude = 47.38, longitude = 8.54,
                        count = 100, providers = mapOf("lime" to 100), city = "Zürich",
                    ),
                ),
                meta = ScooterResponseMetadata(
                    partial = true,
                    failedSources = listOf("national:bird_zurich", "france:dott_fr_lyon", "city-overview"),
                    mode = "clusters", zoom = 8, overview = true, refreshAfterSeconds = 3_600,
                ),
            ),
        )
        val model = makeController(api)

        model.refresh()
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }

        assertTrue(loaded)
        // Bird operates in view and shows nothing, yet one failed city feed says little about a country.
        assertTrue(Bird in model.availableProviders)
        assertEquals(0, model.count(Bird))
        assertEquals(ScooterProviderHealth.healthy, model.providerHealth)
        assertEquals(emptyList<ScooterDockNotice>(), model.dockNotices)
        assertTrue(model.dockChips.all { !it.isDown })
        assertTrue(model.filterProviders.all { !it.isDown })
        val summary = summaryOf(model.dock)
        assertEquals(emptyList<ScooterDockNotice>(), summary.notices)
    }

    @Test
    fun providersAreNotReportedAsDownWhereTheDataHasNotLoadedYet() = runTest {
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = listOf(scooter(id = "lime", provider = "lime")),
                meta = ScooterResponseMetadata(partial = true, failedSources = listOf("national:bird_zurich")),
            ),
        )
        val model = makeController(api)
        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        assertEquals(listOf(Bird), model.providerHealth.downProviders)

        // Bern is covered too, but what failed around Zürich says nothing about it.
        model.setViewport(GeoBounds(south = 46.94, west = 7.43, north = 46.96, east = 7.46))
        assertTrue(Bird in model.availableProviders)
        assertEquals(ScooterProviderHealth.healthy, model.providerHealth)
        assertTrue(model.dockChips.all { !it.isDown })
    }

    @Test
    fun noProviderIsNamedAsDownWhereTheServerLeftOutLowBatteries() = runTest {
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = emptyList(),
                clusters = listOf(
                    ScooterCluster(
                        id = "13:4290:2868", latitude = 47.3769, longitude = 8.5417,
                        count = 40, providers = mapOf("lime" to 40),
                    ),
                ),
                meta = ScooterResponseMetadata(
                    partial = true,
                    failedSources = listOf("national:bird_zurich", "city-overview"), mode = "clusters", zoom = 13,
                ),
            ),
        )
        val model = makeController(api)
        model.updateViewport(zurichRegion, zoom = 13)
        var loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        // Clusters count every scooter: Bird has none here, so it is down.
        assertEquals(ScooterProviderHealth(downProviders = listOf(Bird), hasUnknownFailures = true), model.providerHealth)

        // With a minimum, the server leaves the scooters under it out of the clusters,
        // which can no longer tell an absent provider from one whose scooters are low.
        model.setMinimumBattery(60.0)
        loaded = waitUntil { api.calls == 2 && !model.isLoading.value }
        assertTrue(loaded)
        assertEquals(60, api.lastMinimumBattery)
        assertEquals(ScooterProviderHealth.healthy, model.providerHealth)
        assertEquals(emptyList<ScooterDockNotice>(), model.dockNotices)
        assertTrue(model.dockChips.all { !it.isDown })
        assertTrue(model.filterProviders.all { !it.isDown })

        // At street level the app applies the minimum itself, so it knows again.
        api.setResponse(
            ScooterResponse(
                vehicles = listOf(scooter(id = "lime", provider = "lime", battery = 40)),
                meta = ScooterResponseMetadata(partial = true, failedSources = listOf("national:bird_zurich")),
            ),
        )
        model.updateViewport(zurichRegion, zoom = 16)
        loaded = waitUntil { api.calls == 3 && !model.isLoading.value }
        assertTrue(loaded)
        assertEquals(0, api.lastMinimumBattery)
        assertEquals(0, model.count(Lime))
        assertEquals(listOf(Bird), model.providerHealth.downProviders)
        assertEquals(listOf(Bird), model.dockChips.filter { it.isDown }.map { it.provider })
    }

    @Test
    fun dockCountsScootersNearbyWhileTheOriginIsOnScreen() = runTest {
        val origin = GeoPoint(47.3769, 8.5417)
        val model = loadedController(vehicles = listOf(scooter(id = "one", provider = "lime")), origin = origin)
        val lastUpdated = unwrap(model.lastUpdated.value)

        val nearby = summaryOf(model.dock)
        assertEquals(1, nearby.count)
        assertEquals(ScooterCountContext.Nearby, nearby.countContext)
        assertEquals(localized("scooter nearby"), nearby.countLabel)
        assertEquals(ScooterDockStatus.Live, nearby.status(at = lastUpdated.addingTimeInterval(30.0)))
        assertNull(nearby.hint)
        assertFalse(nearby.showsTryAgain)

        // A chosen place takes over as the origin, and this one is off screen.
        model.focusOnAddress(MapDestination(title = "Berlin", point = GeoPoint(52.52, 13.405)))
        val elsewhere = summaryOf(model.dock)
        assertEquals(ScooterCountContext.OnThisMap, elsewhere.countContext)
        assertEquals(localized("scooter on this map"), elsewhere.countLabel)

        model.clearAddressSearch()
        val nearbyAgain = summaryOf(model.dock)
        assertEquals(ScooterCountContext.Nearby, nearbyAgain.countContext)

        model.setUserLocation(null)
        val withoutOrigin = summaryOf(model.dock)
        assertEquals(ScooterCountContext.OnThisMap, withoutOrigin.countContext)
    }

    @Test
    fun cityTotalsShowTheirOwnStatusAndHint() = runTest {
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = emptyList(),
                clusters = listOf(
                    ScooterCluster(
                        id = "city:ch:zurich", latitude = 47.38, longitude = 8.54,
                        count = 100, providers = mapOf("lime" to 80, "bird" to 20), city = "Zürich",
                    ),
                ),
                meta = ScooterResponseMetadata(
                    partial = false, failedSources = emptyList(),
                    mode = "clusters", zoom = 8, overview = true, refreshAfterSeconds = 3_600,
                ),
            ),
        )
        val model = makeController(api)

        model.refresh()
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }

        assertTrue(loaded)
        val summary = summaryOf(model.dock)
        assertEquals(100, summary.count)
        assertEquals(ScooterDockStatus.CityTotals, summary.status(at = distantFuture))
        assertEquals(ScooterDockHint.TapCity, summary.hint)
        assertEquals(listOf(Lime, Bird), summary.chips.take(2).map { it.provider })
    }

    @Test
    fun delayedCityTotalsSayTheyAreDelayed() = runTest {
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = emptyList(),
                clusters = listOf(
                    ScooterCluster(
                        id = "city:ch:zurich", latitude = 47.38, longitude = 8.54,
                        count = 100, providers = mapOf("lime" to 100), city = "Zürich",
                    ),
                ),
                meta = ScooterResponseMetadata(
                    partial = false, stale = true, failedSources = emptyList(),
                    mode = "clusters", zoom = 8, overview = true, refreshAfterSeconds = 3_600,
                ),
            ),
        )
        val model = makeController(api)

        model.refresh()
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }

        assertTrue(loaded)
        val lastUpdated = unwrap(model.lastUpdated.value)
        val summary = summaryOf(model.dock)
        assertEquals(ScooterDockStatus.Delayed(showing = lastUpdated), summary.status(at = distantFuture))
        assertEquals(ScooterDockHint.TapCity, summary.hint)
    }

    @Test
    fun delayedDataSaysWhichTimeItShows() = runTest {
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = listOf(scooter(id = "one", provider = "lime")),
                meta = ScooterResponseMetadata(partial = false, stale = true, failedSources = emptyList()),
            ),
        )
        val model = makeController(api)

        model.refresh()
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }

        assertTrue(loaded)
        val lastUpdated = unwrap(model.lastUpdated.value)
        val summary = summaryOf(model.dock)
        assertEquals(ScooterDockStatus.Delayed(showing = lastUpdated), summary.status(at = lastUpdated))
        assertFalse(summary.showsTryAgain)
    }

    @Test
    fun outsideCoverageOffersTheThreeClosestCities() = runTest {
        val api = StubScooterAPI(ScooterResponse(vehicles = emptyList()))
        val model = makeController(api)

        model.updateViewport(lungernRegion, zoom = 14)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }

        assertTrue(loaded)
        assertTrue(model.availableProviders.isEmpty())
        val cities = (model.dock as? ScooterDockContent.OutsideCoverage)?.cities
            ?: throw AssertionError("Expected the outside-coverage card, got ${model.dock}")
        assertEquals(listOf("Bern", "Wädenswil", "Zürich"), cities.map { it.city.name })
        assertEquals(listOf(57, 64, 73), cities.map { (it.distanceMeters / 1_000).roundToInt() })
        assertEquals(cities, model.closestCities)

        // A chip flies to the city and makes it the place, so walking times
        // start there and not at the place without scooter data.
        model.focusOnCity(cities[1].city)
        assertEquals(cities[1].city.center, model.focusRequest.value?.point)
        assertEquals(cities[1].city.destination, model.searchedDestination.value)
        assertEquals(listOf(cities[1].city.destination), model.recentPlaces.value)
    }

    @Test
    fun filtersThatHideEverythingReportWhatIsHidden() = runTest {
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = listOf(
                    scooter(id = "lime-low", provider = "lime", battery = 40),
                    scooter(id = "lime-high", provider = "lime", battery = 90),
                    scooter(id = "bird", provider = "bird", battery = 70),
                ),
            ),
        )
        val model = makeController(api)
        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        assertEquals(ScooterFiltering.showResultsTitle(count = 3), model.showResultsTitle)

        model.showProviders(setOf(Voi))
        assertEquals(
            ScooterDockContent.FiltersHideEverything(ScooterFilterSummary(hiddenCount = 3, providers = listOf(Voi), minimumBattery = null)),
            model.dock,
        )

        model.showProviders(setOf(Bird))
        model.setMinimumBattery(80.0)
        val summary = (model.dock as? ScooterDockContent.FiltersHideEverything)?.summary
            ?: throw AssertionError("Expected the hidden-by-filters card, got ${model.dock}")
        assertEquals(ScooterFilterSummary(hiddenCount = 3, providers = listOf(Bird), minimumBattery = 80), summary)
        assertEquals(2, summary.parts.size)
        assertEquals(ScooterFiltering.showResultsTitle(count = 0), model.showResultsTitle)

        model.resetFilters()
        val all = summaryOf(model.dock)
        assertEquals(3, all.count)
        assertNull(all.hint)

        // A list the server cut short cannot say how many scooters are here.
        api.setResponse(
            ScooterResponse(
                vehicles = listOf(scooter(id = "lime", provider = "lime")),
                meta = ScooterResponseMetadata(partial = false, failedSources = emptyList(), truncated = true, totalVehicles = 4_000),
            ),
        )
        model.refresh()
        val reloaded = waitUntil { api.calls == 2 && model.responseMetadata.value?.truncated == true && !model.isLoading.value }
        assertTrue(reloaded)
        model.showProviders(setOf(Voi))
        assertEquals(
            ScooterDockContent.FiltersHideEverything(ScooterFilterSummary(hiddenCount = null, providers = listOf(Voi), minimumBattery = null)),
            model.dock,
        )
    }

    @Test
    fun clusteredBatteryFilterCannotCountWhatItHides() = runTest {
        val cluster = ScooterCluster(
            id = "12:1:1", latitude = 47.3769, longitude = 8.5417,
            count = 10, providers = mapOf("lime" to 10),
        )
        val meta = ScooterResponseMetadata(partial = false, failedSources = emptyList(), mode = "clusters", zoom = 12)
        val api = StubScooterAPI(ScooterResponse(vehicles = emptyList(), clusters = listOf(cluster), meta = meta))
        val model = makeController(api)
        model.updateViewport(zurichRegion, zoom = 12)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        assertEquals(10, model.visibleCount)

        // Only the provider filter is active, so every scooter here is known.
        model.showProviders(setOf(Voi))
        assertEquals(
            ScooterDockContent.FiltersHideEverything(ScooterFilterSummary(hiddenCount = 10, providers = listOf(Voi), minimumBattery = null)),
            model.dock,
        )
        model.showAllProviders()

        api.setResponse(ScooterResponse(vehicles = emptyList(), meta = meta))
        model.setMinimumBattery(80.0)
        val filtered = waitUntil { api.calls == 2 && !model.isLoading.value }

        assertTrue(filtered)
        val summary = ScooterFilterSummary(hiddenCount = null, providers = emptyList(), minimumBattery = 80)
        assertEquals(ScooterDockContent.FiltersHideEverything(summary), model.dock)
        assertEquals(localized("No scooters match your filters here"), summary.title)
        assertEquals(localized("Show all"), summary.showAllTitle)
    }

    @Test
    fun emptyCoveredAreaSaysSoOnlyOnceItsDataHasLoaded() = runTest {
        val api = StubScooterAPI(ScooterResponse(vehicles = emptyList()))
        val model = makeController(api)
        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        val empty = summaryOf(model.dock)
        assertEquals(0, empty.count)
        assertEquals(ScooterDockHint.EmptyArea, empty.hint)
        assertEquals(ScooterCountContext.OnThisMap, empty.countContext)
        assertFalse(empty.chips.isEmpty())

        // Filters that would hide nothing here are not blamed for the empty map.
        model.showProviders(setOf(Voi))
        val filtered = summaryOf(model.dock)
        assertEquals(ScooterDockHint.EmptyArea, filtered.hint)
        model.showAllProviders()

        // Another covered area whose data has not arrived yet has no count to show.
        model.setViewport(GeoBounds(south = 46.94, west = 7.43, north = 46.96, east = 7.46))
        assertEquals(ScooterDockContent.Finding(chips = model.dockChips), model.dock)
        assertFalse(model.dockChips.isEmpty())
    }

    @Test
    fun selectingAParkingBayAndAScooterAreMutuallyExclusive() = runTest {
        val bay = ScooterParking(
            id = "lime:bay", provider = "lime", name = "Bay",
            latitude = 47.3769, longitude = 8.5417, mandatory = false,
        )
        val parked = scooter(id = "one", provider = "lime")
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(parked), parking = listOf(bay)))
        val model = makeController(api)
        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        model.selectScooter(parked.id)
        assertEquals(ScooterDockContent.Scooter(parked), model.dock)

        model.selectParking(bay.id)
        assertNull(model.selectedScooterID.value)
        assertEquals(bay, model.selectedParking)
        assertEquals(ScooterDockContent.Parking(bay), model.dock)

        model.selectScooter(parked.id)
        assertNull(model.selectedParkingID.value)
        assertEquals(ScooterDockContent.Scooter(parked), model.dock)

        model.selectParking(bay.id)
        model.clearSelection()
        assertNull(model.selectedParkingID.value)
        assertNull(model.selectedScooterID.value)
        summaryOf(model.dock)

        // Without an origin the card shows the name alone.
        assertEquals(bay.name, model.parkingSubtitle(bay))
        assertNull(model.approximateWalkingMinutes(bay))
        model.setUserLocation(GeoPoint(47.3779, 8.5417))
        assertEquals(2, model.approximateWalkingMinutes(bay))
        assertTrue(model.parkingSubtitle(bay).startsWith(bay.name))
        assertNotEquals(bay.name, model.parkingSubtitle(bay))

        // A bay that leaves the map is no longer selected.
        model.selectParking(bay.id)
        model.toggle(Lime)
        assertNull(model.selectedParkingID.value)
        assertNull(model.selectedParking)
    }

    @Test
    fun walkingTimesNameTheSearchedPlaceTheyStartFrom() = runTest {
        val bay = ScooterParking(
            id = "lime:bay", provider = "lime", name = "Bay",
            latitude = 47.3769, longitude = 8.5417, mandatory = false,
        )
        val parked = scooter(id = "one", provider = "lime")
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(parked), parking = listOf(bay)))
        val model = makeController(api)
        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        assertNull("No origin, no walking time", model.walkingSummary(parked))

        val origin = GeoPoint(47.3779, 8.5417)
        model.setUserLocation(origin)
        val distance = unwrap(model.formattedDistance(parked))
        assertEquals(
            stringFormat(localized("≈%1\$lld min walk · %2\$@"), 2L, distance),
            model.walkingSummary(parked),
        )

        // A searched place wins over the user's location and is named.
        val place = MapDestination(title = "Zürich HB", point = origin)
        model.setSearchedDestination(place)
        assertEquals(
            stringFormat(localized("≈%1\$lld min walk from %2\$@ · %3\$@"), 2L, "Zürich HB", distance),
            model.walkingSummary(parked),
        )
        assertEquals(
            stringFormat(
                localized("%1\$@ · %2\$@"),
                bay.name,
                stringFormat(localized("≈%1\$lld min walk from %2\$@"), 2L, "Zürich HB"),
            ),
            model.parkingSubtitle(bay),
        )

        model.clearAddressSearch()
        assertEquals(
            stringFormat(localized("≈%1\$lld min walk · %2\$@"), 2L, distance),
            model.walkingSummary(parked),
        )
    }

    @Test
    fun namesWrittenRightToLeftAreSetApartFromTheWalkAroundThem() = runTest {
        val bay = ScooterParking(
            id = "lime:bay", provider = "lime", name = "נחלת בנימין 105",
            latitude = 47.3769, longitude = 8.5417, mandatory = false,
        )
        val parked = scooter(id = "one", provider = "lime")
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(parked), parking = listOf(bay)))
        val model = makeController(api)
        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        model.setSearchedDestination(MapDestination(title = "שדרות רוטשילד 22", point = GeoPoint(47.3779, 8.5417)))
        val distance = unwrap(model.formattedDistance(parked))
        val place = "\u2068שדרות רוטשילד 22\u2069"
        assertEquals(
            stringFormat(localized("≈%1\$lld min walk from %2\$@ · %3\$@"), 2L, place, distance),
            model.walkingSummary(parked),
        )
        assertEquals(
            stringFormat(
                localized("%1\$@ · %2\$@"),
                "\u2068נחלת בנימין 105\u2069",
                stringFormat(localized("≈%1\$lld min walk from %2\$@"), 2L, place),
            ),
            model.parkingSubtitle(bay),
        )
        // Names written left to right are left as they are.
        assertEquals("Zürich HB", "Zürich HB".isolated)
        assertEquals("Θεσσαλονίκη", "Θεσσαλονίκη".isolated)
        assertEquals("\u2068دبي مول\u2069", "دبي مول".isolated)
    }

    @Test
    fun theCardHeaderCentresTheScooterWithoutChangingTheZoom() = runTest {
        val parked = scooter(id = "one", provider = "lime")
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(parked)))
        val model = makeController(api)
        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        model.focusOnScooter(parked)

        val request = unwrap(model.focusRequest.value)
        assertEquals(parked.coordinate, request.point)
        assertTrue(request.keepsZoom)
        assertEquals(parked.id, model.selectedScooterID.value)
        assertFalse(MapFocusRequest(point = request.point, token = 1).keepsZoom)
        assertFalse(MapFocusRequest.city(request.point, token = 1).keepsZoom)
    }

    @Test
    fun aCardReportsAFailedRefreshOrDelayedDataAndNothingWhenHealthy() = runTest {
        val clock = TestClock()
        val api = StubScooterAPI(timedResponse(generatedAt = clock.now, expiresIn = 300.0))
        val model = makeController(api, clock = clock)
        model.refresh()
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        val shownAt = unwrap(model.lastUpdated.value)
        model.selectScooter(unwrap(model.mapScooters.value.firstOrNull()?.id))
        assertNull(model.cardStatus)

        api.setFailure(ScooterAPIError.Offline())
        model.retryLoad()
        val failed = waitUntil { api.calls == 2 && model.loadIssue.value != null && !model.isLoading.value }
        assertTrue(failed)
        assertNotNull("The card stays open over data that is still valid", model.selectedScooter)
        assertEquals(ScooterDockStatus.Offline(showing = shownAt), model.cardStatus)

        api.setFailure(ScooterAPIError.HttpStatus(503))
        model.retryLoad()
        val failedAgain = waitUntil {
            api.calls == 3 &&
                model.loadIssue.value == ScooterLoadIssue.RefreshFailed(ScooterLoadFailure.Unavailable, showing = shownAt) &&
                !model.isLoading.value
        }
        assertTrue(failedAgain)
        assertEquals(ScooterDockStatus.RefreshFailed(showing = shownAt), model.cardStatus)

        api.setFailure(null)
        api.setResponse(
            ScooterResponse(
                vehicles = listOf(scooter(id = "one", provider = "lime")),
                meta = ScooterResponseMetadata(partial = false, stale = true, failedSources = emptyList()),
            ),
        )
        model.retryLoad()
        val delayed = waitUntil { api.calls == 4 && model.loadIssue.value == null && !model.isLoading.value }
        assertTrue(delayed)
        val delayedAt = unwrap(model.lastUpdated.value)
        assertEquals(ScooterDockStatus.Delayed(showing = delayedAt), model.cardStatus)
    }

    @Test
    fun aCardThatOpensInTheDockIsAnnouncedAndTheCountIsNot() = runTest {
        val clock = TestClock()
        val bay = ScooterParking(
            id = "dott:bay", provider = "dott", name = "Rue Faidherbe",
            latitude = 47.3769, longitude = 8.5417, mandatory = true,
        )
        val parked = scooter(id = "one", provider = "lime")
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = listOf(parked),
                meta = ScooterResponseMetadata(
                    partial = false,
                    failedSources = emptyList(),
                    generatedAt = iso(clock.now),
                    expiresAt = iso(clock.now.addingTimeInterval(300.0)),
                ),
                parking = listOf(bay),
            ),
        )
        val model = makeController(api, clock = clock)
        assertNull("Finding scooters", model.dockAnnouncement)

        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        assertNull("The count and its chips", model.dockAnnouncement)

        // A scooter: whose it is, and the walk once there is an origin.
        val title = stringFormat(localized("%@ scooter"), "Lime")
        model.selectScooter(parked.id)
        assertEquals(title, model.dockAnnouncement)
        model.setUserLocation(GeoPoint(47.3779, 8.5417))
        val walk = unwrap(model.walkingSummary(parked))
        assertEquals("$title, $walk", model.dockAnnouncement)

        // A bay: its name and the rule, which the callout no longer says.
        model.selectParking(bay.id)
        assertEquals("${bay.bayTitle}, ${model.parkingSubtitle(bay)}. ${bay.notice}", model.dockAnnouncement)

        // The out-of-date card replaces the count unasked.
        model.clearSelection()
        api.setFailure(ScooterAPIError.HttpStatus(503))
        clock.advance(400.0)
        model.retryLoad()
        val expired = waitUntil { api.calls == 2 && model.loadIssue.value is ScooterLoadIssue.OutOfDate && !model.isLoading.value }
        assertTrue(expired)
        val outOfDate = unwrap(model.dockAnnouncement)
        assertTrue(outOfDate.startsWith(localized("These positions are out of date")))
        assertTrue(outOfDate.endsWith(ScooterLoadFailure.Unavailable.message))
    }

    @Test
    fun locatingFromACardKeepsTheMapAndTheCard() = runTest {
        val manager = FakeLocationManager(status = ScooterAuthorizationStatus.AuthorizedWhenInUse)
        val parked = scooter(id = "one", provider = "lime")
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(parked)))
        val model = makeController(api, locationManager = manager)
        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        model.selectScooter(parked.id)

        model.locateForWalkingTime()
        assertTrue(model.isLocating.value)
        model.locationsUpdated(
            listOf(ScooterLocationFix(GeoPoint(47.3779, 8.5417), horizontalAccuracy = 25.0, timestamp = Instant.now())),
        )

        assertFalse(model.isLocating.value)
        assertNull("The map stays where it is", model.focusRequest.value)
        assertEquals(parked.id, model.selectedScooterID.value)
        assertNotNull(model.walkingSummary(parked))
        assertTrue(model.hasLocatedOnce.value)

        // Near me still moves the map.
        model.focusOnUser()
        assertEquals(ScooterMapController.userFocusMeters, model.focusRequest.value?.latitudinalMeters)
    }

    // Where scooters were last seen, while the server collects an app's map again.

    @Test
    fun scootersLastSeenAreDrawnFadedFilteredAsTheOthersAndCountedNowhere() = runTest {
        val clock = TestClock()
        val seenAt = clock.now.addingTimeInterval(-600.0)
        val api = StubScooterAPI(
            fillingResponse(
                vehicles = listOf(scooter(id = "found", provider = "lime")),
                lastSeen = listOf(
                    scooter(id = "seen-bird", provider = "bird", battery = 80),
                    scooter(id = "seen-low", provider = "lime", battery = 20),
                    // Drawn as the others are wherever they are, but not in view to count.
                    scooter(id = "seen-far", provider = "voi", latitude = 47.5, longitude = 8.7),
                ),
                seenAt = seenAt,
                generatedAt = clock.now,
            ),
        )
        val model = makeController(api, clock = clock)
        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        assertEquals(listOf("lime:found"), model.mapScooters.value.map { it.id })
        assertEquals(setOf("bird:seen-bird", "lime:seen-low", "voi:seen-far"), model.mapLastSeenScooters.value.map { it.id }.toSet())
        assertEquals(seenAt, model.lastSeenAt.value)
        assertEquals("The faded ones are counted nowhere", 1, model.visibleCount)
        assertEquals(0, model.count(Bird))
        assertEquals(2, model.visibleLastSeenCount.value)

        val revision = model.mapLastSeenRevision.value
        model.showProviders(setOf(Lime))
        assertEquals(listOf("lime:seen-low"), model.mapLastSeenScooters.value.map { it.id })
        assertTrue(model.mapLastSeenRevision.value > revision)
        model.setMinimumBattery(30.0)
        assertTrue(model.mapLastSeenScooters.value.isEmpty())
        assertEquals(0, model.visibleLastSeenCount.value)
        model.resetFilters()
        assertEquals(3, model.mapLastSeenScooters.value.size)

        // Data that expired and cannot be renewed goes, and the faded scooters with it.
        api.setFailure(ScooterAPIError.HttpStatus(503))
        clock.advance(301.0)
        model.autoRefreshIfNeeded()
        val expired = waitUntil { api.calls == 2 && model.loadIssue.value is ScooterLoadIssue.OutOfDate && !model.isLoading.value }
        assertTrue(expired)
        assertTrue(model.lastSeenVehicles.value.isEmpty())
        assertTrue(model.mapLastSeenScooters.value.isEmpty())
        assertEquals(0, model.visibleLastSeenCount.value)
        assertNull(model.lastSeenAt.value)
    }

    private val zurichRegion = MapRegion(GeoPoint(47.3769, 8.5417), latitudeDelta = 0.01, longitudeDelta = 0.01)

    /** Lungern has no scooter operator; Bern, Wädenswil and Zürich are the closest covered cities. */
    private val lungernRegion = MapRegion(GeoPoint(46.7741, 8.1558), latitudeDelta = 0.02, longitudeDelta = 0.02)

    /** Date.distantFuture: the first day of the year 4001. */
    private val distantFuture = Instant.ofEpochSecond(64_092_211_200)

    /**
     * The controller on the test's background scope. Without a clock of its own it reads the test's, which the
     * test's waits move as real time moves under the iPhone's tests, from where TestClock starts.
     */
    private fun TestScope.makeController(
        api: ScooterAPIClient,
        clock: TestClock? = null,
        defaults: ScooterDefaults = InMemoryScooterDefaults(),
        locationManager: ScooterLocationManager = FakeLocationManager(),
        refreshPolicy: ScooterRefreshPolicy = ScooterRefreshPolicy.standard,
        phoneLanguages: () -> List<String> = { listOf("en-US") },
        keepAppLanguages: (List<String>) -> Unit = {},
    ): ScooterMapController {
        val scheduler = testScheduler
        val start = TestClock().now
        val now: () -> Instant = if (clock != null) {
            { clock.now }
        } else {
            { start.plusMillis(scheduler.currentTime) }
        }
        return ScooterMapController(
            api = api,
            locationManager = locationManager,
            defaults = defaults,
            scope = backgroundScope,
            directions = NoWalkingDirections,
            openInMaps = {},
            refreshPolicy = refreshPolicy,
            now = now,
            phoneLanguages = phoneLanguages,
            keepAppLanguages = keepAppLanguages,
        )
    }

    private fun TestScope.loadedController(vehicles: List<Scooter>, origin: GeoPoint): ScooterMapController {
        val api = StubScooterAPI(ScooterResponse(vehicles = vehicles))
        val model = makeController(api)
        model.setUserLocation(origin)
        model.refresh()
        val loadingFinished = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loadingFinished)
        return model
    }

    private fun scooter(
        id: String,
        provider: String,
        latitude: Double = 47.3769,
        longitude: Double = 8.5417,
        battery: Int? = 80,
        rangeMeters: Int? = null,
        rentalURIs: ScooterRentalURIs? = null,
    ): Scooter = Scooter(
        provider = provider,
        latitude = latitude,
        longitude = longitude,
        battery = battery,
        rangeMeters = rangeMeters,
        vehicleID = id,
        deepLink = null,
        rentalURIs = rentalURIs,
        distanceMeters = 0.0,
    )

    /**
     * Lets the controller's work run, 10 ms of the test's time at a time, until the condition holds: false if it
     * never does in `attempts` steps.
     */
    private fun TestScope.waitUntil(attempts: Int = 200, condition: () -> Boolean): Boolean {
        repeat(attempts) {
            if (condition()) return true
            advanceTimeBy(10)
            runCurrent()
        }
        return false
    }

    /** Long enough for a refresh that was going to start to have reached the API. */
    private fun TestScope.settle() {
        advanceTimeBy(60)
        runCurrent()
    }

    private fun timedResponse(
        generatedAt: Instant,
        expiresIn: Double,
        parking: List<ScooterParking> = emptyList(),
        parkingExpiresIn: Double? = null,
        clockOffset: Double = 0.0,
    ): ScooterResponse = ScooterResponse(
        vehicles = listOf(scooter(id = "one", provider = "lime")),
        meta = ScooterResponseMetadata(
            partial = false,
            failedSources = emptyList(),
            generatedAt = iso(generatedAt),
            refreshAfterSeconds = 60,
            expiresAt = iso(generatedAt.addingTimeInterval(expiresIn)),
            parkingExpiresAt = parkingExpiresIn?.let { iso(generatedAt.addingTimeInterval(it)) },
        ),
        parking = parking,
        clockOffset = clockOffset,
    )

    /**
     * An answer while the server collects an app's map again: the scooters its sweep has found so far, and where
     * it saw the others last time.
     */
    private fun fillingResponse(
        vehicles: List<Scooter> = emptyList(),
        lastSeen: List<Scooter>,
        seenAt: Instant?,
        generatedAt: Instant,
        stale: Boolean = false,
    ): ScooterResponse = ScooterResponse(
        vehicles = vehicles,
        lastSeenVehicles = lastSeen,
        meta = ScooterResponseMetadata(
            partial = false,
            stale = stale,
            failedSources = emptyList(),
            generatedAt = iso(generatedAt),
            refreshAfterSeconds = 3,
            refreshing = true,
            lastSeenAt = seenAt?.let(::iso),
            expiresAt = iso(generatedAt.addingTimeInterval(300.0)),
        ),
    )

    /** ISO8601DateFormatter: to the second, in UTC. */
    private fun iso(date: Instant): String = DateTimeFormatter.ISO_INSTANT.format(date.truncatedTo(ChronoUnit.SECONDS))

    private fun date(text: String): Instant = OffsetDateTime.parse(text).toInstant()

    /** XCTUnwrap: the value, or the test fails. */
    private fun <T : Any> unwrap(value: T?): T {
        assertNotNull(value)
        return value!!
    }

    /** The dock's summary, or the test fails. */
    private fun summaryOf(dock: ScooterDockContent): ScooterDockSummary =
        (dock as? ScooterDockContent.Summary)?.summary ?: throw AssertionError("Expected the dock summary, got $dock")
}
