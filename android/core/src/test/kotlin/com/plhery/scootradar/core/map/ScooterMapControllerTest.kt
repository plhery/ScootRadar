package com.plhery.scootradar.core.map

import com.plhery.scootradar.core.api.AddressSearchResult
import com.plhery.scootradar.core.api.ScooterAPIError
import com.plhery.scootradar.core.api.ScooterAPIJson
import com.plhery.scootradar.core.api.ScooterLoadFailure
import com.plhery.scootradar.core.api.WalkingDirectionsClient
import com.plhery.scootradar.core.api.WalkingDirectionsError
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.generated.ScooterProvider.Bird
import com.plhery.scootradar.core.generated.ScooterProvider.Bolt
import com.plhery.scootradar.core.generated.ScooterProvider.Dott
import com.plhery.scootradar.core.generated.ScooterProvider.Hopp
import com.plhery.scootradar.core.generated.ScooterProvider.Lime
import com.plhery.scootradar.core.generated.ScooterProvider.Pony
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
import com.plhery.scootradar.core.model.PartsFlow
import com.plhery.scootradar.core.model.ProviderRidePass
import com.plhery.scootradar.core.model.RentalCurfew
import com.plhery.scootradar.core.model.RideEstimateDuration
import com.plhery.scootradar.core.model.Scooter
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterCityCatalog
import com.plhery.scootradar.core.model.ScooterCluster
import com.plhery.scootradar.core.model.ScooterClusteringPolicy
import com.plhery.scootradar.core.model.ScooterCountContext
import com.plhery.scootradar.core.model.ScooterDockContent
import com.plhery.scootradar.core.model.ScooterDockHint
import com.plhery.scootradar.core.model.ScooterDockLine
import com.plhery.scootradar.core.model.ScooterDockNotice
import com.plhery.scootradar.core.model.ScooterDockStatus
import com.plhery.scootradar.core.model.ScooterDockSummary
import com.plhery.scootradar.core.model.ScooterFilterSummary
import com.plhery.scootradar.core.model.ScooterFiltering
import com.plhery.scootradar.core.model.ScooterFold
import com.plhery.scootradar.core.model.ScooterKeyCommand
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.core.model.ScooterLinks
import com.plhery.scootradar.core.model.ScooterLoadIssue
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.ScooterMapCameraPolicy
import com.plhery.scootradar.core.model.ScooterMapCameraPolicy.FoldSide
import com.plhery.scootradar.core.model.ScooterMapLink
import com.plhery.scootradar.core.model.ScooterMenuBar
import com.plhery.scootradar.core.model.ScooterParking
import com.plhery.scootradar.core.model.ScooterProviderCoverage
import com.plhery.scootradar.core.model.ScooterProviderHealth
import com.plhery.scootradar.core.model.ScooterRefreshPolicy
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterResponseMetadata
import com.plhery.scootradar.core.model.ScooterReviewPrompt
import com.plhery.scootradar.core.model.ScooterRidePricing
import com.plhery.scootradar.core.model.ScooterSearchBarState
import com.plhery.scootradar.core.model.ScooterSeasonalPause
import com.plhery.scootradar.core.model.ScooterWalkTarget
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.core.model.ScreenSize
import com.plhery.scootradar.core.model.UserInterfaceStyle
import com.plhery.scootradar.core.model.addingTimeInterval
import com.plhery.scootradar.core.model.formatted
import com.plhery.scootradar.core.model.isolated
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.core.search.KeyboardOverlap
import java.time.Instant
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale
import java.util.TimeZone
import kotlin.math.ceil
import kotlin.math.roundToInt
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.builtins.ListSerializer
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

    @Test
    fun groupsLastSeenKeepTheProvidersShownAndGoWithTheGroupsWhenTheMinimumChanges() = runTest {
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = emptyList(),
                clusters = listOf(
                    ScooterCluster(
                        id = "13:4290:2868", latitude = 47.3769, longitude = 8.5417,
                        count = 4, providers = mapOf("lime" to 4),
                    ),
                ),
                lastSeenClusters = listOf(
                    ScooterCluster(
                        id = "seen:13:4290:2869", latitude = 47.377, longitude = 8.542,
                        count = 12, providers = mapOf("lime" to 5, "bird" to 7),
                    ),
                ),
                meta = ScooterResponseMetadata(
                    partial = false, failedSources = emptyList(), mode = "clusters", zoom = 13,
                    refreshAfterSeconds = 3, refreshing = true, lastSeenAt = "2026-10-12T10:00:00Z",
                ),
            ),
        )
        val model = makeController(api)
        model.updateViewport(zurichRegion, zoom = 13)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        assertEquals(listOf(12), model.mapLastSeenClusters.value.map { it.count })
        assertEquals(4, model.visibleCount)
        assertEquals(12, model.visibleLastSeenCount.value)

        model.showProviders(setOf(Lime))
        assertEquals(listOf(mapOf("lime" to 5)), model.mapLastSeenClusters.value.map { it.providers })
        assertEquals(5, model.visibleLastSeenCount.value)

        // The server leaves the scooters under the minimum out of its groups, faded or not: they are asked for again.
        model.setMinimumBattery(60.0)
        assertTrue(model.mapLastSeenClusters.value.isEmpty())
        assertEquals(0, model.visibleLastSeenCount.value)
        val asked = waitUntil { api.calls == 2 && !model.isLoading.value }
        assertTrue(asked)
        assertEquals(60, api.lastMinimumBattery)
    }

    @Test
    fun aMapStillBeingCollectedIsAskedForSoonAfterEveryAnswerWithFadedScooters() = runTest {
        val clock = TestClock()
        val api = StubScooterAPI(
            fillingResponse(
                lastSeen = listOf(scooter(id = "seen", provider = "lime")),
                seenAt = clock.now,
                generatedAt = clock.now,
            ),
        )
        val model = makeController(api, clock = clock)
        model.refresh()
        var answered = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(answered)

        // After the three seconds the server suggests, every time: its sweep replaces them as it goes.
        for (call in 2..3) {
            if (call == 3) {
                // Still being collected, with nothing faded left.
                api.setResponse(fillingResponse(lastSeen = emptyList(), seenAt = null, generatedAt = clock.now))
            }
            clock.advance(2.0)
            model.autoRefreshIfNeeded()
            settle()
            assertEquals("Not before three seconds", call - 1, api.calls)
            clock.advance(1.0)
            model.autoRefreshIfNeeded()
            answered = waitUntil { api.calls == call && !model.isLoading.value }
            assertTrue("Call $call three seconds after the one before", answered)
        }

        // Once more soon was the follow-up already: the usual ten seconds now.
        clock.advance(3.0)
        model.autoRefreshIfNeeded()
        settle()
        assertEquals(3, api.calls)
        clock.advance(7.0)
        model.autoRefreshIfNeeded()
        answered = waitUntil { api.calls == 4 && !model.isLoading.value }
        assertTrue(answered)
        assertEquals(4, api.calls)
    }

    @Test
    fun onlyFadedScootersInViewReadFindingScootersWithTheNightBanRatherThanAnEmptyMap() = runTest {
        val clock = TestClock()
        // 23:30 in Oslo, during its night ban.
        clock.now = date("2026-10-12T21:30:00Z")
        val oslo = GeoPoint(59.9139, 10.7522)
        val osloRegion = MapRegion(oslo, latitudeDelta = 0.01, longitudeDelta = 0.01)
        val api = StubScooterAPI(
            fillingResponse(
                lastSeen = listOf(scooter(id = "seen", provider = "voi", latitude = oslo.latitude, longitude = oslo.longitude)),
                seenAt = clock.now.addingTimeInterval(-900.0),
                generatedAt = clock.now,
            ),
        )
        val model = makeController(api, clock = clock)
        model.updateViewport(osloRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        val curfew = unwrap(RentalCurfew.active(at = model.viewport.value.center, on = clock.now))
        val finding = model.dock as? ScooterDockContent.Finding
            ?: throw AssertionError("Expected Finding scooters…, got ${model.dock}")
        assertEquals(model.dockChips, finding.chips)
        assertFalse(finding.chips.isEmpty())
        assertEquals(ScooterDockNotice.Curfew(curfew), finding.notices.firstOrNull())
        assertEquals(localized("Finding scooters…"), model.dockLine(at = clock.now).title)

        // The sweep reached it: a count, without the status of an update.
        api.setResponse(
            ScooterResponse(
                vehicles = listOf(scooter(id = "found", provider = "voi", latitude = oslo.latitude, longitude = oslo.longitude)),
                meta = ScooterResponseMetadata(partial = false, failedSources = emptyList(), generatedAt = iso(clock.now)),
            ),
        )
        clock.advance(3.0)
        model.autoRefreshIfNeeded()
        val found = waitUntil { api.calls == 2 && !model.isLoading.value }
        assertTrue(found)
        val summary = summaryOf(model.dock)
        assertEquals(1, summary.count)
        assertNull(summary.lastSeenAt)
        assertEquals(ScooterDockStatus.Live, summary.status(at = clock.now))
    }

    @Test
    fun fadedScootersBesideFoundOnesReadUpdatingRatherThanDelayedAndAFailureFirst() = runTest {
        val clock = TestClock()
        val seenAt = clock.now.addingTimeInterval(-600.0)
        val api = StubScooterAPI(
            fillingResponse(
                vehicles = listOf(scooter(id = "found", provider = "lime")),
                lastSeen = listOf(scooter(id = "seen", provider = "bird")),
                seenAt = seenAt,
                generatedAt = clock.now,
                stale = true,
            ),
        )
        val model = makeController(api, clock = clock)
        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        val shownAt = unwrap(model.lastUpdated.value)

        val summary = summaryOf(model.dock)
        assertEquals(1, summary.count)
        assertEquals(ScooterDockStatus.Updating(seenAt = seenAt), summary.status(at = clock.now))
        assertEquals(true, summary.status(at = clock.now)?.isUpdating)
        // A card says nothing of a delay that the dock reports as an update.
        model.selectScooter("lime:found")
        assertNull(model.cardStatus)
        model.clearSelection()

        // With the faded ones hidden by the filters, the delay is said again.
        model.showProviders(setOf(Lime))
        val filtered = summaryOf(model.dock)
        assertEquals(ScooterDockStatus.Delayed(showing = shownAt), filtered.status(at = clock.now))
        model.resetFilters()

        // A failed refresh is said before anything else.
        api.setFailure(ScooterAPIError.Offline())
        clock.advance(3.0)
        model.autoRefreshIfNeeded()
        val failed = waitUntil { api.calls == 2 && model.loadIssue.value != null && !model.isLoading.value }
        assertTrue(failed)
        val offline = summaryOf(model.dock)
        assertEquals(ScooterDockStatus.Offline(showing = shownAt), offline.status(at = clock.now))
        assertEquals(ScooterDockStatus.Offline(showing = shownAt), model.cardStatus)
    }

    // Location, search, filters and settings.

    @Test
    fun answeringTheLocationPromptSlowlyStillKeepsTheMapAndTheCard() = runTest {
        val manager = FakeLocationManager(status = ScooterAuthorizationStatus.NotDetermined)
        val parked = scooter(id = "one", provider = "lime")
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(parked)))
        val model = makeController(api, locationManager = manager, locationTimeout = 50.milliseconds)
        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        model.selectScooter(parked.id)

        // The prompt stays open three times longer than a fix may take.
        model.locateForWalkingTime()
        advanceTimeBy(150)
        runCurrent()
        assertTrue(model.isLocating.value)
        assertNull(model.locationIssue.value)

        manager.status = ScooterAuthorizationStatus.AuthorizedWhenInUse
        model.authorizationChanged()
        assertTrue(model.isLocating.value)
        model.locationsUpdated(listOf(zurichFix))

        assertFalse(model.isLocating.value)
        assertNull("The map stays where it is", model.focusRequest.value)
        assertEquals(parked.id, model.selectedScooterID.value)
        assertNotNull(model.walkingSummary(parked))

        // Once allowed, a fix that does not come in time is still reported.
        val slowManager = FakeLocationManager(status = ScooterAuthorizationStatus.NotDetermined)
        val slow = makeController(
            StubScooterAPI(ScooterResponse(vehicles = emptyList())),
            locationManager = slowManager,
            locationTimeout = 50.milliseconds,
        )
        slow.focusOnUser()
        slowManager.status = ScooterAuthorizationStatus.AuthorizedWhenInUse
        slow.authorizationChanged()
        val timedOut = waitUntil { slow.locationIssue.value == ScooterLocationIssue.NotFound }
        assertTrue(timedOut)
        assertFalse(slow.isLocating.value)
    }

    @Test
    fun locatingWithoutAFixInTimeReportsNotFoundUntilDismissedOrRetried() = runTest {
        val manager = FakeLocationManager(status = ScooterAuthorizationStatus.AuthorizedWhenInUse)
        val defaults = InMemoryScooterDefaults()
        val model = makeController(
            StubScooterAPI(ScooterResponse(vehicles = emptyList())),
            defaults = defaults,
            locationManager = manager,
            locationTimeout = 50.milliseconds,
        )
        assertEquals(ScooterSearchBarState.Empty, model.searchBarState)
        assertFalse(model.hasLocatedOnce.value)

        model.focusOnUser()
        assertTrue(model.isLocating.value)
        assertEquals(ScooterSearchBarState.Locating, model.searchBarState)
        assertNull(model.locationIssue.value)

        val timedOut = waitUntil { model.locationIssue.value == ScooterLocationIssue.NotFound }
        assertTrue(timedOut)
        assertFalse(model.isLocating.value)
        assertFalse(model.hasLocatedOnce.value)

        model.dismissLocationIssue()
        assertNull(model.locationIssue.value)

        // The next attempt starts clean and brings the card back if it fails again.
        model.focusOnUser()
        assertNull(model.locationIssue.value)
        val timedOutAgain = waitUntil { model.locationIssue.value == ScooterLocationIssue.NotFound }
        assertTrue(timedOutAgain)

        model.locationsUpdated(
            listOf(ScooterLocationFix(GeoPoint(47.3769, 8.5417), horizontalAccuracy = 25.0, timestamp = Instant.now())),
        )

        assertNull(model.locationIssue.value)
        assertTrue(model.hasLocatedOnce.value)
        assertTrue(defaults.bool(forKey = "has-located-once"))
        assertEquals(350.0, model.focusRequest.value?.latitudinalMeters)
        assertEquals(350.0, model.focusRequest.value?.longitudinalMeters)
        // Located: the bar is a search field again, and the map has the dot.
        assertEquals(ScooterSearchBarState.Empty, model.searchBarState)
        assertNotNull(model.userLocation.value)

        val restored = makeController(
            StubScooterAPI(ScooterResponse(vehicles = emptyList())),
            defaults = defaults,
            locationManager = FakeLocationManager(status = ScooterAuthorizationStatus.Denied),
        )
        assertTrue(restored.hasLocatedOnce.value)
    }

    @Test
    fun aPlaceChosenWhileTheFixWasOnItsWayKeepsTheMap() = runTest {
        val manager = FakeLocationManager(status = ScooterAuthorizationStatus.AuthorizedWhenInUse)
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())), locationManager = manager)
        val place = MapDestination(title = "Bern", point = GeoPoint(46.948, 7.4474))
        val viewport = model.viewport.value

        model.focusOnUser()
        assertTrue(model.isLocating.value)
        model.focusOnAddress(place)
        val placeFocus = unwrap(model.focusRequest.value)
        model.locationsUpdated(listOf(zurichFix))

        // The position is known from now on, and nothing moved.
        assertEquals(placeFocus, model.focusRequest.value)
        assertEquals(viewport, model.viewport.value)
        assertEquals(ScooterSearchBarState.Place(place), model.searchBarState)
        assertEquals(NearbyOrigin.SearchedDestination(place), model.activeOrigin)
        assertFalse(model.isLocating.value)
        assertTrue(model.hasLocatedOnce.value)
        assertEquals(zurichFix.coordinate, model.userLocation.value)

        model.clearAddressSearch()
        assertEquals(ScooterSearchBarState.Empty, model.searchBarState)

        // Near me is a new wish and moves the map again.
        model.focusOnUser()
        assertEquals(zurichFix.coordinate, model.focusRequest.value?.point)
    }

    @Test
    fun aFixThatArrivesAfterNotFoundLeavesAPlaceOrCityChosenMeanwhile() = runTest {
        for (choosesCity in listOf(false, true)) {
            val manager = FakeLocationManager(status = ScooterAuthorizationStatus.AuthorizedWhenInUse)
            val model = makeController(
                StubScooterAPI(ScooterResponse(vehicles = emptyList())),
                locationManager = manager,
                locationTimeout = 50.milliseconds,
            )
            val bern = unwrap(ScooterCityCatalog.cities.firstOrNull { it.id == "ch:bern" })
            val place = MapDestination(title = "Bundesplatz", point = GeoPoint(46.9471, 7.4441))

            model.focusOnUser()
            val timedOut = waitUntil { model.locationIssue.value == ScooterLocationIssue.NotFound }
            assertTrue(timedOut)

            // A searched place, or a chip under "Closest cities".
            if (choosesCity) {
                model.focusOnCity(bern)
            } else {
                model.focusOnAddress(place)
            }
            val chosenFocus = unwrap(model.focusRequest.value)
            val viewport = model.viewport.value
            model.locationsUpdated(listOf(zurichFix))

            assertEquals("city: $choosesCity", chosenFocus, model.focusRequest.value)
            assertEquals(viewport, model.viewport.value)
            assertEquals(ScooterSearchBarState.Place(if (choosesCity) bern.destination else place), model.searchBarState)
            assertNull(model.locationIssue.value)
            assertTrue(model.hasLocatedOnce.value)

            model.clearAddressSearch()
            assertEquals(ScooterSearchBarState.Empty, model.searchBarState)
        }
    }

    @Test
    fun refusedLocationShowsADismissibleCardUntilTheNextAttempt() = runTest {
        val manager = FakeLocationManager(status = ScooterAuthorizationStatus.Denied)
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())), locationManager = manager)

        // Opening the app is not a locate attempt, so nothing is shown.
        model.start()
        model.authorizationChanged()
        assertNull(model.locationIssue.value)

        model.focusOnUser()
        assertEquals(ScooterLocationIssue.Denied, model.locationIssue.value)
        assertFalse(model.isLocating.value)
        assertEquals(ScooterSearchBarState.Empty, model.searchBarState)

        model.dismissLocationIssue()
        assertNull(model.locationIssue.value)
        model.authorizationChanged()
        assertNull("An unchanged status is not a new attempt", model.locationIssue.value)

        model.focusOnUser()
        assertEquals(ScooterLocationIssue.Denied, model.locationIssue.value)

        val restricted = makeController(
            StubScooterAPI(ScooterResponse(vehicles = emptyList())),
            locationManager = FakeLocationManager(status = ScooterAuthorizationStatus.Restricted),
        )
        restricted.focusOnUser()
        assertEquals(ScooterLocationIssue.Restricted, restricted.locationIssue.value)
    }

    @Test
    fun recentPlacesKeepTheLastThreeForThisSessionOnly() = runTest {
        val defaults = RecordingDefaults()
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())), defaults = defaults)
        val places = listOf("Zürich HB", "Bellevue", "Paradeplatz", "Stauffacher").mapIndexed { index, title ->
            MapDestination(
                title = title,
                subtitle = "Zürich",
                point = GeoPoint(latitude = 47.37 + index.toDouble() / 1_000, longitude = 8.54),
            )
        }
        assertTrue(model.recentPlaces.value.isEmpty())

        for (place in places) {
            model.focusOnAddress(place)
        }
        assertEquals(listOf(places[3], places[2], places[1]), model.recentPlaces.value)
        assertEquals(ScooterSearchBarState.Place(places[3]), model.searchBarState)

        // Choosing a recent place again moves it to the front without repeating it.
        model.focusOnAddress(places[2])
        assertEquals(listOf(places[2], places[3], places[1]), model.recentPlaces.value)

        // Clearing the place keeps the list for the rest of the session.
        model.clearAddressSearch()
        assertEquals(ScooterSearchBarState.Empty, model.searchBarState)
        assertEquals(3, model.recentPlaces.value.size)

        val stored = defaults.writes.joinToString("\n")
        assertFalse(stored.contains("Paradeplatz"))
        assertFalse(stored.contains("47.37"))
        val nextSession = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())), defaults = defaults)
        assertTrue(nextSession.recentPlaces.value.isEmpty())
    }

    @Test
    fun citiesWithScootersAreTheSixNearestToTheMapCentre() = runTest {
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())))

        val cities = model.nearbyCities
        assertEquals(
            listOf("Wädenswil", "Bern", "Zürich", "Uster", "Opfikon", "Kloten"),
            cities.map { it.city.name },
        )
        assertEquals(cities.map { it.distanceMeters }.sorted(), cities.map { it.distanceMeters })

        // A chip behaves like choosing that city as a place, and shows the whole city.
        val bern = cities[1].city
        model.chooseCity(bern)

        val place = unwrap(model.searchedDestination.value)
        assertEquals(bern.destination, place)
        assertEquals("Bern", place.title)
        assertEquals(MapDestination.Kind.City, place.kind)
        assertEquals(NearbyOrigin.SearchedDestination(place), model.activeOrigin)
        assertEquals(listOf(place), model.recentPlaces.value)
        val focus = unwrap(model.focusRequest.value)
        assertEquals(MapFocusRequest.city(bern.center, token = focus.token), focus)
        assertTrue(focus.latitudinalMeters > 8_000)

        // The list follows the map.
        model.setViewport(GeoBounds(south = 47.37, west = 8.53, north = 47.38, east = 8.55))
        assertEquals("Zürich", model.nearbyCities.firstOrNull()?.city?.name)
        assertEquals(6, model.nearbyCities.size)
    }

    @Test
    fun theAddressSearchGetsTheMapCentreRoundedOnlyWhenACityOrLessIsShown() = runTest {
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        val paris = MapRegion(GeoPoint(48.85837, 2.29448), latitudeDelta = 0.05, longitudeDelta = 0.05)

        // Zoomed out to a region or a country, the map centre says little about what is meant.
        model.updateViewport(paris, zoom = 10, zoomLevel = 9.9)
        assertNull(model.searchNear)

        // A city or less: the centre, rounded to about a kilometre.
        model.updateViewport(paris, zoom = 10, zoomLevel = 10.0)
        assertEquals(GeoPoint(48.86, 2.29), model.searchNear)
        model.updateViewport(paris, zoom = 17, zoomLevel = 16.4)
        assertEquals(GeoPoint(48.86, 2.29), model.searchNear)
    }

    @Test
    fun aTypedCoveredCityShowsTheWholeCityLikeItsChip() = runTest {
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        val locarno = unwrap(ScooterCityCatalog.cities.firstOrNull { it.id == "ch:locarno" })

        // What the address search answers for "Locarno": the catalogue's centre.
        val answer = """
        [{"lat": ${locarno.center.latitude}, "lng": ${locarno.center.longitude},
          "display_name": "Locarno, Switzerland", "title": "Locarno", "subtitle": "Svizzera", "covered": true}]
        """
        val typed = unwrap(ScooterAPIJson.decodeFromString(ListSerializer(AddressSearchResult.serializer()), answer).firstOrNull())
        assertEquals(MapDestination.Kind.City, typed.destination.kind)
        assertEquals("Svizzera", typed.destination.subtitle)

        model.focusOnAddress(typed.destination)
        val typedFocus = unwrap(model.focusRequest.value)
        assertEquals("Locarno", model.searchedDestination.value?.title)

        // The same span as the "Cities with scooters" chip.
        model.chooseCity(locarno)
        val chipFocus = unwrap(model.focusRequest.value)
        assertEquals(MapFocusRequest.city(locarno.center, token = typedFocus.token), typedFocus)
        assertEquals(chipFocus.latitudinalMeters, typedFocus.latitudinalMeters, 0.0)
        assertEquals(chipFocus.longitudinalMeters, typedFocus.longitudinalMeters, 0.0)

        // An address, a station or a place in the city keeps the street-level view.
        val station = AddressSearchResult(
            latitude = locarno.center.latitude + 0.002, longitude = locarno.center.longitude,
            displayName = "Locarno, stazione", title = "Locarno, stazione", subtitle = "Treno", isCovered = true,
        )
        assertEquals(MapDestination.Kind.Address, station.destination.kind)
        model.focusOnAddress(station.destination)
        assertEquals(850.0, model.focusRequest.value?.latitudinalMeters)
        assertNull(ScooterCityCatalog.city(centredAt = GeoPoint(46.7741, 8.1558)))
    }

    @Test
    fun storedBatteryValuesSnapDownToAPreset() = runTest {
        for ((stored, expected) in listOf(45 to 30.0, 95 to 80.0, 60 to 60.0, 10 to 0.0, -5 to 0.0)) {
            val defaults = InMemoryScooterDefaults()
            defaults.set(stored, forKey = "minimum-battery")

            val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())), defaults = defaults)

            assertEquals("Stored $stored", expected, model.minimumBattery.value, 0.0)
        }
    }

    @Test
    fun passesListProvidersHereOrWithAPassAndEveryProviderOtherwise() = runTest {
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        model.setViewport(GeoBounds(zurichRegion))
        assertEquals(ScooterProviderCoverage.swissProviders, model.passProviders)

        model.setRidePass(ProviderRidePass(enabled = true, freeMinutes = 10), Pony)
        assertEquals(
            ScooterProvider.entries.filter { it in ScooterProviderCoverage.swissProviders || it == Pony },
            model.passProviders,
        )

        // Nobody operates here and no pass is set: every provider is offered.
        model.setRidePass(ProviderRidePass(), Pony)
        model.setViewport(GeoBounds(lungernRegion))
        assertEquals(ScooterProvider.entries, model.passProviders)

        model.setRidePass(ProviderRidePass(enabled = true, freeUnlock = true), Voi)
        assertEquals(listOf(Voi), model.passProviders)
    }

    /** The layout of a window `width` points across, from either layout. */
    private fun layouts(
        width: Double,
        regularWidth: Boolean = true,
        regularHeight: Boolean = true,
        largeText: Boolean = false,
    ): List<ScooterChromeLayout> = listOf(ScooterChromeLayout.Dock, ScooterChromeLayout.Panel).map {
        ScooterChromeLayout.resolve(
            width = width,
            regularWidth = regularWidth,
            regularHeight = regularHeight,
            largeText = largeText,
            current = it,
        )
    }

    private val dockBoth = listOf(ScooterChromeLayout.Dock, ScooterChromeLayout.Dock)
    private val panelBoth = listOf(ScooterChromeLayout.Panel, ScooterChromeLayout.Panel)
    private val asItWas = listOf(ScooterChromeLayout.Dock, ScooterChromeLayout.Panel)

    @Test
    fun everyPhoneKeepsItsDockUprightAndSideways() {
        for (largeText in listOf(false, true)) {
            // Upright an iPhone is compact across; the widest is 440 pt.
            for (width in listOf(320.0, 375.0, 390.0, 393.0, 402.0, 414.0, 428.0, 430.0, 440.0)) {
                assertEquals("$width", dockBoth, layouts(width, regularWidth = false, largeText = largeText))
                // However it is described, it is narrower than a panel and a map.
                assertEquals("$width", dockBoth, layouts(width, largeText = largeText))
            }
            // Sideways it is compact up and down, the larger ones regular across.
            for (width in listOf(568.0, 667.0, 736.0, 812.0, 844.0, 852.0, 874.0, 896.0, 926.0, 932.0, 956.0)) {
                assertEquals(
                    "$width",
                    dockBoth,
                    layouts(width, regularWidth = false, regularHeight = false, largeText = largeText),
                )
                assertEquals("$width", dockBoth, layouts(width, regularHeight = false, largeText = largeText))
            }
        }
    }

    @Test
    fun theDuoKeepsItsDockOnItsCoverAndUprightInside() {
        // The cover upright and sideways, the inner display upright, and with
        // its bar down the side: too narrow whatever the size classes say.
        for (width in listOf(466.0, 678.0, 330.0, 669.0)) {
            for (largeText in listOf(false, true)) {
                assertEquals("$width", dockBoth, layouts(width, largeText = largeText))
                assertEquals("$width", dockBoth, layouts(width, regularWidth = false, largeText = largeText))
            }
        }
    }

    @Test
    fun theOpenDuoShowsThePanel() {
        // 951 pt across, less its 60 pt bar down the side.
        assertEquals(panelBoth, layouts(891.0))
        assertEquals(panelBoth, layouts(891.0, largeText = true))
    }

    @Test
    fun anIPadShowsThePanelWhenTheMapStillHasRoomBesideIt() {
        // iPad mini upright keeps the dock, even turned from sideways.
        assertEquals(dockBoth, layouts(744.0))
        assertEquals(dockBoth, layouts(744.0, largeText = true))
        for (width in listOf(820.0, 1032.0, 1180.0, 1376.0)) {
            assertEquals("$width", panelBoth, layouts(width))
            assertEquals("$width", panelBoth, layouts(width, largeText = true))
        }
        // A window compact one way or the other has the dock, however wide.
        assertEquals(dockBoth, layouts(1376.0, regularWidth = false))
        assertEquals(dockBoth, layouts(1376.0, regularHeight = false))
    }

    @Test
    fun aWindowResizedAcrossTheThresholdDoesNotFlipBackAndForth() {
        // A 380 pt panel and 380 pt of map: the panel opens with 20 pt to
        // spare, and stays until the map would get less than 380.
        assertEquals(asItWas, layouts(779.0))
        assertEquals(panelBoth, layouts(780.0))
        assertEquals(asItWas, layouts(760.0))
        assertEquals(dockBoth, layouts(759.0))

        // With very large text the panel is 420 pt.
        assertEquals(380.0, ScooterChromeLayout.panelWidth(largeText = false), 0.0)
        assertEquals(420.0, ScooterChromeLayout.panelWidth(largeText = true), 0.0)
        assertEquals(asItWas, layouts(819.0, largeText = true))
        assertEquals(panelBoth, layouts(820.0, largeText = true))
        assertEquals(asItWas, layouts(800.0, largeText = true))
        assertEquals(dockBoth, layouts(799.0, largeText = true))
    }

    @Test
    fun aLinkToACityOpensItLikeTheSearchAndTheFirstFixLeavesTheMapThere() = runTest {
        val bern = unwrap(ScooterCityCatalog.cities.firstOrNull { it.id == "ch:bern" })
        val link = ScooterMapLink(origin = GeoPoint(latitude = bern.center.latitude, longitude = bern.center.longitude))
        // The link may open the app before it starts locating, or after.
        for (linkFirst in listOf(true, false)) {
            val manager = FakeLocationManager(status = ScooterAuthorizationStatus.AuthorizedWhenInUse)
            val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())), locationManager = manager)
            if (linkFirst) {
                model.open(link)
                model.start()
            } else {
                model.start()
                model.open(link)
            }
            val linkedFocus = unwrap(model.focusRequest.value)
            assertEquals("link first: $linkFirst", bern.center, linkedFocus.point)
            assertEquals("link first: $linkFirst", ScooterSearchBarState.Place(bern.destination), model.searchBarState)

            model.locationsUpdated(listOf(zurichFix))
            assertEquals("link first: $linkFirst", linkedFocus, model.focusRequest.value)
            assertEquals(zurichFix.coordinate, model.userLocation.value)
            assertEquals(NearbyOrigin.SearchedDestination(bern.destination), model.activeOrigin)
        }
    }

    @Test
    fun aLinkToAnyOtherPointMovesTheMapWithoutChoosingAPlace() = runTest {
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        val point = GeoPoint(latitude = 46.2, longitude = 6.15)
        model.open(ScooterMapLink(origin = point, minimumBattery = 60))
        val focus = unwrap(model.focusRequest.value)
        assertEquals(point, focus.point)
        assertFalse(focus.keepsZoom)
        assertNull(model.searchedDestination.value)
        assertEquals(60.0, model.minimumBattery.value, 0.0)
    }

    @Test
    fun aLinkWithoutAPlaceKeepsTheMapWhereItIs() = runTest {
        val model = makeController(StubScooterAPI(ScooterResponse(vehicles = emptyList())))
        model.open(ScooterMapLink())
        assertNull(model.focusRequest.value)
        assertEquals(0.0, model.minimumBattery.value, 0.0)
    }

    @Test
    fun theFoldedPanelSaysInOneLineWhatTheDockShows() = runTest {
        val origin = GeoPoint(47.3779, 8.5417)
        val bay = ScooterParking(
            id = "dott:bay", provider = "dott", name = "Rue Faidherbe",
            latitude = 47.3769, longitude = 8.5417, mandatory = true,
        )
        val clock = TestClock()
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = listOf(scooter("near", provider = "bird"), scooter("far", provider = "lime", latitude = 47.3795)),
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

        assertEquals(
            ScooterDockLine(mark = ScooterDockLine.Mark.Progress, title = localized("Finding scooters…")),
            model.dockLine(at = clock.now),
        )

        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        // With no one to walk from, the count, and how fresh it is. The map is beside the line: it doesn't say
        // "on this map".
        val counted = (model.dock as? ScooterDockContent.Summary)?.summary
            ?: throw AssertionError("Expected the summary, got ${model.dock}")
        assertNull(counted.lead)
        assertEquals(
            ScooterDockLine(
                mark = ScooterDockLine.Mark.Symbol("scooter"),
                title = "2 ${localized("scooters")}",
                status = ScooterDockStatus.Live,
            ),
            model.dockLine(at = clock.now),
        )

        // From the rider, the nearest scooter: how far, whose, the walk, and "Live", which the dock leaves out
        // beside it.
        model.setUserLocation(origin)
        val nearest = (model.dock as? ScooterDockContent.Summary)?.summary?.lead
            ?: throw AssertionError("Expected the nearest scooter, got ${model.dock}")
        assertEquals("bird:near", nearest.scooter.id)
        val minutes = stringFormat(localized("%lld min"), nearest.minutes.toLong())
        val lead = model.dockLine(at = clock.now)
        assertEquals(
            ScooterDockLine(
                mark = ScooterDockLine.Mark.Provider(Bird),
                title = nearest.distance,
                details = listOf("Bird", minutes),
                status = ScooterDockStatus.Live,
            ),
            lead,
        )
        assertEquals(listOf(nearest.distance, "Bird", minutes, localized("Live")), lead.parts)
        assertEquals("${nearest.distance}, Bird, $minutes, ${localized("Live")}", lead.accessibilityLabel)

        // The status ages with the data, and says so in fewer words than the dock.
        val later = model.dockLine(at = clock.now.addingTimeInterval(180.0))
        assertEquals(ScooterDockStatus.UpdatedMinutesAgo(3), later.status)
        assertEquals(stringFormat(localized("%lld min ago"), 3L), later.parts.lastOrNull())

        // A scooter's card: whose it is, the walk to it and how far it is, each a part of its own.
        model.selectScooter("bird:near")
        val selected = (model.dock as? ScooterDockContent.Scooter)?.scooter
            ?: throw AssertionError("Expected the scooter card, got ${model.dock}")
        val walk = stringFormat(localized("≈%lld min walk"), unwrap(model.approximateWalkingMinutes(selected)).toLong())
        assertEquals(
            ScooterDockLine(
                mark = ScooterDockLine.Mark.Provider(Bird),
                title = "Bird",
                details = listOf(walk, unwrap(model.formattedDistance(selected))),
            ),
            model.dockLine(at = clock.now),
        )

        // A bay's card: the bay, where it is and the walk to it.
        model.selectParking(bay.id)
        val bayWalk = stringFormat(localized("≈%lld min walk"), unwrap(model.approximateWalkingMinutes(bay)).toLong())
        assertEquals(
            ScooterDockLine(mark = ScooterDockLine.Mark.Provider(Dott), title = bay.bayTitle, details = listOf(bay.name, bayWalk)),
            model.dockLine(at = clock.now),
        )

        // Filters that hide everything: how many, and which filters.
        model.clearSelection()
        model.showProviders(setOf(Pony))
        val filters = (model.dock as? ScooterDockContent.FiltersHideEverything)?.summary
            ?: throw AssertionError("Expected the filters card, got ${model.dock}")
        assertEquals(
            ScooterDockLine(
                mark = ScooterDockLine.Mark.Symbol("line.3.horizontal.decrease"),
                title = filters.title,
                details = listOf(filters.body),
            ),
            model.dockLine(at = clock.now),
        )
        model.resetFilters()

        // A failed refresh is said in the warning colour, at the end of the line.
        api.setFailure(ScooterAPIError.Offline())
        model.retryLoad()
        val refreshFailed = waitUntil { api.calls == 2 && model.loadIssue.value != null && !model.isLoading.value }
        assertTrue(refreshFailed)
        val offline = model.dockLine(at = clock.now)
        assertEquals(nearest.distance, offline.title)
        assertEquals(true, offline.status?.isWarning)

        // Out of date: the data expired and the refresh after that failed.
        clock.advance(400.0)
        model.retryLoad()
        val expired = waitUntil {
            api.calls == 3 && model.loadIssue.value is ScooterLoadIssue.OutOfDate && !model.isLoading.value
        }
        assertTrue(expired)
        assertEquals(
            ScooterDockLine(
                mark = ScooterDockLine.Mark.Symbol("clock"),
                title = localized("These positions are out of date"),
                isWarning = true,
            ),
            model.dockLine(at = clock.now),
        )

        val outsideAPI = StubScooterAPI(ScooterResponse(vehicles = emptyList()))
        val outside = makeController(outsideAPI)
        outside.updateViewport(lungernRegion, zoom = 14)
        val outsideLoaded = waitUntil { outsideAPI.calls == 1 && outside.lastUpdated.value != null && !outside.isLoading.value }
        assertTrue(outsideLoaded)
        assertEquals(
            ScooterDockLine(mark = ScooterDockLine.Mark.Symbol("map"), title = localized("No scooter data here yet")),
            outside.dockLine(at = Instant.now()),
        )

        val failing = StubScooterAPI(ScooterResponse(vehicles = emptyList()))
        failing.setFailure(ScooterAPIError.HttpStatus(503))
        val waiting = makeController(failing)
        waiting.refresh()
        val failed = waitUntil { failing.calls == 1 && waiting.loadIssue.value != null && !waiting.isLoading.value }
        assertTrue(failed)
        assertEquals(
            ScooterDockLine(mark = ScooterDockLine.Mark.Symbol("hourglass"), title = localized("Waiting for scooter data")),
            waiting.dockLine(at = Instant.now()),
        )
    }

    /**
     * The card of what is chosen on the map opens in the panel, so choosing opens a folded panel. Nothing else
     * does: the rider folded it.
     */
    @Test
    fun choosingAScooterOrABayUnfoldsThePanelAndNothingElseDoes() = runTest {
        val bay = ScooterParking(
            id = "dott:bay", provider = "dott", name = "Rue Faidherbe",
            latitude = 47.3769, longitude = 8.5417, mandatory = true,
        )
        val api = StubScooterAPI(
            ScooterResponse(
                vehicles = listOf(scooter(id = "one", provider = "lime"), scooter(id = "two", provider = "bird")),
                parking = listOf(bay),
            ),
        )
        val model = makeController(api)
        assertFalse(model.isPanelCollapsed.value)
        model.updateViewport(zurichRegion, zoom = 16)
        val loaded = waitUntil { api.calls == 1 && model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)

        model.setPanelCollapsed(true)
        model.showProviders(setOf(Lime))
        model.showAllProviders()
        model.refresh()
        val refreshed = waitUntil { api.calls == 2 && !model.isLoading.value }
        assertTrue(refreshed)
        model.clearSelection()
        assertTrue(model.isPanelCollapsed.value)

        model.selectScooter("lime:one")
        assertFalse(model.isPanelCollapsed.value)

        // Folded with a card open, the panel stays folded as the card closes,
        // and opens for the next scooter.
        model.setPanelCollapsed(true)
        model.selectScooter(null)
        assertTrue(model.isPanelCollapsed.value)
        model.selectScooter("bird:two")
        assertFalse(model.isPanelCollapsed.value)

        model.setPanelCollapsed(true)
        model.selectParking(bay.id)
        assertFalse(model.isPanelCollapsed.value)
        model.setPanelCollapsed(true)
        model.clearSelection()
        assertTrue(model.isPanelCollapsed.value)
    }

    /**
     * The line wraps as a paragraph does, but between its parts: "6 min ago" goes whole to the next row rather
     * than leave "6" at the end of the first.
     */
    @Test
    fun theFoldedLineWrapsBetweenItsPartsAndNeverInsideOne() {
        val row = 20.0
        fun frames(widths: List<Double>, width: Double): List<ScreenRect> = PartsFlow.frames(
            of = widths.map { ScreenSize(it, row) },
            width = width,
            spacing = 4.0,
            wrapped = { index, across -> ScreenSize(across, row * ceil(widths[index] / across)) },
        )

        // Side by side while they fit, with a space between.
        assertEquals(
            listOf(rect(0, 0, 100, row), rect(104, 0, 50, row), rect(158, 0, 80, row)),
            frames(listOf(100.0, 50.0, 80.0), 300.0),
        )
        // The part that doesn't fit the rest of the row starts the next one, whole.
        assertEquals(
            listOf(rect(0, 0, 100, row), rect(104, 0, 50, row), rect(0, row, 150, row)),
            frames(listOf(100.0, 50.0, 150.0), 300.0),
        )
        // Only a part wider than a row wraps, in rows of its own.
        assertEquals(
            listOf(rect(0, 0, 100, row), rect(0, row, 300, 2 * row), rect(0, 3 * row, 50, row)),
            frames(listOf(100.0, 450.0, 50.0), 300.0),
        )
        // Nothing to lay out takes no room.
        assertEquals(emptyList<ScreenRect>(), frames(emptyList(), 300.0))
    }

    // The fold of a partly open iPhone Duo.

    @Test
    fun theFoldIsTheActiveDivisionMovedIntoWindowCoordinates() {
        val screen = rect(0, 24, 669, 927)
        assertEquals(rect(0, 465, 669, 20), ScooterFold.frame(among = listOf(rect(0, 441, 669, 20)), container = screen))
        assertNull(ScooterFold.frame(among = emptyList(), container = screen))
        // Flat, a fold has no width.
        assertNull(ScooterFold.frame(among = listOf(rect(465, 0, 0, 669)), container = screen))
        assertTrue(ScooterFold.isAcross(rect(0, 465, 669, 20)))
        assertFalse(ScooterFold.isAcross(rect(465, 0, 20, 669)))
    }

    @Test
    fun standingLikeALaptopTheSearchBarStartsUnderTheFold() {
        val upright = rect(0, 30, 669, 921)
        assertEquals(455.0, ScooterFold.chromeTop(below = rect(0, 465, 669, 20), container = upright), 0.0)
        assertEquals(0.0, ScooterFold.chromeTop(below = null, container = upright), 0.0)
        assertEquals(0.0, ScooterFold.chromeTop(below = rect(465, 0, 20, 669), container = upright), 0.0)
    }

    @Test
    fun openLikeABookThePanelKeepsToItsHalf() {
        val fold = rect(465, 0, 20, 669)
        // The status bar on the trailing side: the panel has room to spare.
        assertEquals(
            380.0,
            ScooterFold.panelWidth(380.0, beside = fold, container = rect(0, 0, 891, 669), inset = 16.0, rightToLeft = false),
            0.0,
        )
        // On the leading side, with a wider fold, the panel stops short of it.
        assertEquals(
            379.0,
            ScooterFold.panelWidth(
                380.0, beside = rect(455, 0, 40, 669),
                container = rect(60, 0, 891, 669), inset = 16.0, rightToLeft = false,
            ),
            0.0,
        )
        // Right to left the panel is on the right.
        assertEquals(
            379.0,
            ScooterFold.panelWidth(
                380.0, beside = rect(456, 0, 40, 669),
                container = rect(0, 0, 891, 669), inset = 16.0, rightToLeft = true,
            ),
            0.0,
        )
        assertEquals(
            ScooterFold.minimumPanelWidth,
            ScooterFold.panelWidth(380.0, beside = rect(200, 0, 20, 669), container = rect(0, 0, 891, 669), inset = 16.0, rightToLeft = false),
            0.0,
        )
        assertEquals(
            380.0,
            ScooterFold.panelWidth(380.0, beside = rect(0, 300, 891, 20), container = rect(0, 0, 891, 669), inset = 16.0, rightToLeft = false),
            0.0,
        )
        assertEquals(
            380.0,
            ScooterFold.panelWidth(380.0, beside = null, container = rect(0, 0, 891, 669), inset = 16.0, rightToLeft = false),
            0.0,
        )
    }

    @Test
    fun theMapShowsOnTheFarSideOfAFoldFromThePanelAndAboveOneAcrossIt() {
        val book = rect(465, 0, 20, 669)
        val panel = rect(16, 16, 380, 300)
        assertEquals(FoldSide.Right, ScooterMapCameraPolicy.side(of = book, panel = panel, rightToLeft = false))
        assertEquals(
            FoldSide.Left,
            ScooterMapCameraPolicy.side(of = book, panel = panel.offsetBy(dx = 539.0, dy = 0.0), rightToLeft = true),
        )
        assertEquals(FoldSide.Right, ScooterMapCameraPolicy.side(of = book, panel = null, rightToLeft = false))
        assertEquals(FoldSide.Left, ScooterMapCameraPolicy.side(of = book, panel = null, rightToLeft = true))
        assertEquals(FoldSide.Above, ScooterMapCameraPolicy.side(of = rect(0, 465, 669, 20), panel = null, rightToLeft = false))
    }

    @Test
    fun besideAFoldTheMapCentresInTheHalfItShowsOn() {
        // Open like a book: beside the panel, then past the fold.
        val besidePanel = rect(396, 0, 555, 669)
        val book = rect(465, 0, 20, 669)
        assertEquals(
            rect(485, 0, 466, 669),
            ScooterMapCameraPolicy.visibleRect(besidePanel, safeTop = 0.0, beside = book, on = FoldSide.Right),
        )
        assertEquals(
            rect(0, 0, 465, 669),
            ScooterMapCameraPolicy.visibleRect(rect(0, 0, 555, 669), safeTop = 0.0, beside = book, on = FoldSide.Left),
        )

        // Standing like a laptop: the search bar and the dock lie under the
        // fold and cover nothing above it.
        val laptop = rect(0, 465, 669, 20)
        val betweenSearchAndDock = rect(0, 560, 669, 200)
        assertEquals(
            rect(0, 30, 669, 435),
            ScooterMapCameraPolicy.visibleRect(betweenSearchAndDock, safeTop = 30.0, beside = laptop, on = FoldSide.Above),
        )
        // A search bar above the fold still covers the map.
        assertEquals(
            rect(0, 110, 669, 355),
            ScooterMapCameraPolicy.visibleRect(rect(0, 110, 669, 650), safeTop = 30.0, beside = laptop, on = FoldSide.Above),
        )

        // With hardly any room left beside it, the fold is let be.
        assertEquals(
            besidePanel,
            ScooterMapCameraPolicy.visibleRect(besidePanel, safeTop = 0.0, beside = rect(920, 0, 20, 669), on = FoldSide.Right),
        )
    }

    // The keyboard's shortcuts.

    @Test
    fun theKeyboardsShortcutsEachHaveTheirOwnKeys() {
        val keys = ScooterKeyCommand.entries.map { "${it.modifiers} ${it.key.character}" }
        assertEquals("$keys", keys.size, keys.toSet().size)
        assertEquals(setOf(ScooterKeyCommand.Modifier.Command), ScooterKeyCommand.Search.modifiers)
        assertEquals(ScooterKeyCommand.Search.key, ScooterKeyCommand.Filters.key)
        assertEquals(
            setOf(ScooterKeyCommand.Modifier.Command, ScooterKeyCommand.Modifier.Option),
            ScooterKeyCommand.Filters.modifiers,
        )
        assertEquals(ScooterKeyCommand.Key.escape, ScooterKeyCommand.Close.key)
        assertEquals('\\', ScooterKeyCommand.Fold.key.character)
        // Only "/" and Esc go without ⌘.
        assertEquals(
            setOf(ScooterKeyCommand.SearchWithSlash, ScooterKeyCommand.Close),
            ScooterKeyCommand.entries.filter { ScooterKeyCommand.Modifier.Command !in it.modifiers }.toSet(),
        )
    }

    /**
     * The keys a sheet or a popover doesn't take go on to the screen that presented it: while the filters or
     * Settings are open the screen makes none, so that a "/" typed there, or an Esc meant for it, stays there.
     */
    @Test
    fun theShortcutsStandDownWhileTheFiltersOrSettingsAreOpen() {
        for (layout in listOf(ScooterChromeLayout.Dock, ScooterChromeLayout.Panel)) {
            for (isSearching in listOf(false, true)) {
                for (hasCard in listOf(false, true)) {
                    val situation = ScooterKeyCommand.Situation(
                        layout = layout,
                        isSearching = isSearching,
                        isPresenting = true,
                        hasCard = hasCard,
                    )
                    assertEquals("$situation", emptyList<ScooterKeyCommand>(), ScooterKeyCommand.available(situation))
                }
            }
        }
    }

    @Test
    fun slashSearchesOnlyWhileTheSearchsFieldIsntThereToTakeIt() {
        val atRest = ScooterKeyCommand.available(ScooterKeyCommand.Situation(layout = ScooterChromeLayout.Panel))
        assertTrue(ScooterKeyCommand.SearchWithSlash in atRest)
        assertTrue(ScooterKeyCommand.Search in atRest)

        val searching = ScooterKeyCommand.available(
            ScooterKeyCommand.Situation(layout = ScooterChromeLayout.Panel, isSearching = true),
        )
        assertFalse(ScooterKeyCommand.SearchWithSlash in searching)
        // ⌘ keys aren't typed into the field: they still go.
        assertTrue(ScooterKeyCommand.Search in searching)
        assertTrue(ScooterKeyCommand.NearMe in searching)
    }

    @Test
    fun escClosesTheSearchFirstThenTheCardAndIsLeftAloneWithNothingToClose() {
        val panel = ScooterChromeLayout.Panel
        val dock = ScooterChromeLayout.Dock
        fun situation(layout: ScooterChromeLayout, isSearching: Boolean = false, hasCard: Boolean = false) =
            ScooterKeyCommand.Situation(layout = layout, isSearching = isSearching, hasCard = hasCard)
        assertEquals(
            ScooterKeyCommand.Closing.Search,
            ScooterKeyCommand.closing(situation(panel, isSearching = true, hasCard = true)),
        )
        assertEquals(
            ScooterKeyCommand.Closing.Search,
            ScooterKeyCommand.closing(situation(dock, isSearching = true, hasCard = true)),
        )
        assertEquals(ScooterKeyCommand.Closing.Card, ScooterKeyCommand.closing(situation(panel, hasCard = true)))
        assertEquals(ScooterKeyCommand.Closing.Search, ScooterKeyCommand.closing(situation(dock, isSearching = true)))
        assertNull(ScooterKeyCommand.closing(situation(panel)))

        assertFalse(ScooterKeyCommand.Close in ScooterKeyCommand.available(situation(panel)))
        assertTrue(ScooterKeyCommand.Close in ScooterKeyCommand.available(situation(dock, hasCard = true)))
        assertTrue(ScooterKeyCommand.Close in ScooterKeyCommand.available(situation(dock, isSearching = true)))
    }

    @Test
    fun foldingStandsBesideAPanelAndLocatingNotWhileLocating() {
        val panel = ScooterKeyCommand.Situation(layout = ScooterChromeLayout.Panel)
        assertTrue(ScooterKeyCommand.Fold in ScooterKeyCommand.available(panel))
        assertFalse(
            ScooterKeyCommand.Fold in ScooterKeyCommand.available(ScooterKeyCommand.Situation(layout = ScooterChromeLayout.Dock)),
        )
        assertEquals(localized("Collapse panel"), ScooterKeyCommand.Fold.title(panel))
        assertEquals(localized("Expand panel"), ScooterKeyCommand.Fold.title(panel.copy(isFolded = true)))
        assertFalse(ScooterKeyCommand.NearMe in ScooterKeyCommand.available(panel.copy(isLocating = true)))
    }

    @Test
    fun theShortcutsAreNamedInEveryLanguage() {
        for (language in listOf("en", "de", "fr", "it", "nl", "nb", "pt", "es", "is")) {
            val strings = unwrap(ScooterLanguage.fromRawValue(language)).strings
            for (key in listOf(
                "Search", "Zoom in", "Zoom out", "Close", "Near me", "Filters", "Settings", "Collapse panel",
                "Expand panel", "Map",
            )) {
                val name = strings[key]
                assertNotNull("$language: $key", name)
                assertFalse("$language: $key", name!!.isEmpty())
            }
        }
    }

    /** The menu bar lists each shortcut once, with Settings in the app's menu; "/", ⌘= and Esc stand in for others or close, and stay off it. */
    @Test
    fun theMenuBarListsEveryShortcutButTheOnesThatStandInOnce() {
        val listed = (ScooterMenuBar.map + ScooterMenuBar.view).flatten() + ScooterKeyCommand.Settings
        assertEquals("$listed", listed.size, listed.toSet().size)
        assertEquals(
            setOf(ScooterKeyCommand.SearchWithSlash, ScooterKeyCommand.ZoomInWithoutShift, ScooterKeyCommand.Close),
            ScooterKeyCommand.entries.toSet() - listed.toSet(),
        )
        assertEquals(AppleMapStyle.entries, ScooterMenuBar.view.first().mapNotNull { it.mapStyle })
        // The iPhone's check that a phone shows no menu bar is the app's: Android has none of its own.
    }

    /**
     * The keyboard's frame, turned into the window's coordinates, limits the search only when it covers the
     * window's bottom.
     */
    @Test
    fun theSearchEndsAboveOnlyAKeyboardThatCoversTheWindowsBottom() {
        // A phone: the window is the screen, and the keyboard's top is where it was.
        assertEquals(596.0, KeyboardOverlap.top(of = rect(0, 596, 402, 278), windowHeight = 874.0), 0.0)
        // Its shortcuts bar alone, with a hardware keyboard.
        assertEquals(1_312.0, KeyboardOverlap.top(of = rect(0, 1_312, 1_032, 64), windowHeight = 1_376.0), 0.0)
        // Gone: below the window.
        assertEquals(Double.POSITIVE_INFINITY, KeyboardOverlap.top(of = rect(0, 874, 402, 278), windowHeight = 874.0), 0.0)
        // A Stage Manager window 200 pt down the screen, 700 tall, over a keyboard
        // whose top is 820 down the screen: 620 into the window.
        assertEquals(620.0, KeyboardOverlap.top(of = rect(-100, 620, 1_376, 300), windowHeight = 700.0), 0.0)
        // The same window ending above the keyboard.
        assertEquals(Double.POSITIVE_INFINITY, KeyboardOverlap.top(of = rect(-100, 760, 1_376, 300), windowHeight = 700.0), 0.0)
        // A floating keyboard: an empty frame, or one over the middle of the window.
        assertEquals(Double.POSITIVE_INFINITY, KeyboardOverlap.top(of = rect(0, 0, 0, 0), windowHeight = 874.0), 0.0)
        assertEquals(Double.POSITIVE_INFINITY, KeyboardOverlap.top(of = rect(300, 400, 320, 250), windowHeight = 1_000.0), 0.0)
    }

    @Test
    fun zoomingFromTheKeyboardAsksTheMapForAStepEachTime() = runTest {
        val model = makeController(
            StubScooterAPI(ScooterResponse(vehicles = emptyList())),
            locationManager = FakeLocationManager(status = ScooterAuthorizationStatus.Denied),
        )
        assertNull(model.zoomRequest.value)
        model.zoom(by = 1)
        val first = model.zoomRequest.value
        assertEquals(1, first?.steps)
        model.zoom(by = 1)
        assertEquals(1, model.zoomRequest.value?.steps)
        assertNotEquals(first?.token, model.zoomRequest.value?.token)
        model.zoom(by = -1)
        assertEquals(-1, model.zoomRequest.value?.steps)

        assertEquals(500.0, ScooterMapCameraPolicy.distance(1_000.0, zoomedBy = 1), 0.001)
        assertEquals(2_000.0, ScooterMapCameraPolicy.distance(1_000.0, zoomedBy = -1), 0.001)
    }

    // Asking for a rating when the rider is back from a ride. The prompt counts the phone's days: the phone is in
    // UTC, as on the iPhone's CI, so that the returns fall on the days the tests mean in any zone (in Adelaide,
    // the next test's second return would be on the day after its first).

    @Test
    fun aReturnFromARideIsTheMomentOnceTheMapIsCalmWithAFreshFeed() = inUTC {
        runTest {
            val clock = TestClock()
            val (model, api) = reviewController(clock)

            // Back within minutes: the rental mostly did not happen.
            returnFromRide(model, api, after = 2.0 * 60, clock = clock)
            assertEquals(0, model.reviewMoments.value)

            // Back to the card of a scooter still on the map: the rider is choosing.
            val id = unwrap(model.mapScooters.value.firstOrNull()?.id)
            model.selectScooter(id)
            returnFromRide(model, api, after = 20.0 * 60, clock = clock)
            assertEquals(0, model.reviewMoments.value)

            // That return was its one try; the next ride's return, to the map at rest, is the moment.
            model.clearSelection()
            returnFromRide(model, api, after = 20.0 * 60, clock = clock)
            assertEquals(1, model.reviewMoments.value)
            assertTrue(model.reviewDue)
            assertTrue(model.takeReviewMoment())
            assertFalse(model.takeReviewMoment())

            // This version asked.
            returnFromRide(model, api, after = 20.0 * 60, clock = clock)
            assertEquals(1, model.reviewMoments.value)
        }
    }

    @Test
    fun aFailedRefreshKeepsTheRestOfTheDayFromAsking() = inUTC {
        runTest {
            val clock = TestClock()
            val (model, api) = reviewController(clock)

            api.setFailure(ScooterAPIError.Offline())
            returnFromRide(model, api, after = 20.0 * 60, clock = clock)
            assertNotNull(model.loadIssue.value)
            assertEquals(0, model.reviewMoments.value)

            // Back online later that day: still no ask.
            api.setFailure(null)
            returnFromRide(model, api, after = 20.0 * 60, clock = clock)
            assertNull(model.loadIssue.value)
            assertEquals(0, model.reviewMoments.value)

            // The next day, a calm return asks.
            clock.advance(86_400.0)
            returnFromRide(model, api, after = 20.0 * 60, clock = clock)
            assertEquals(1, model.reviewMoments.value)
        }
    }

    /** A controller with a fresh feed on the map and two earlier days with one: the third day. */
    private fun TestScope.reviewController(clock: TestClock): Pair<ScooterMapController, StubScooterAPI> {
        val defaults = InMemoryScooterDefaults()
        val earlier = ScooterReviewPrompt(defaults = defaults, version = ScooterLinks.appVersion)
        earlier.noteUse(at = clock.now.addingTimeInterval(-2.0 * 86_400))
        earlier.noteUse(at = clock.now.addingTimeInterval(-86_400.0))
        val api = StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "one", provider = "lime"))))
        val model = makeController(api, clock = clock, defaults = defaults)
        model.refresh()
        val loaded = waitUntil { model.lastUpdated.value != null && !model.isLoading.value }
        assertTrue(loaded)
        assertEquals("Not without a ride", 0, model.reviewMoments.value)
        return model to api
    }

    /** "Open in", the app in the background for `after` seconds, then in front again until the refresh is in. */
    private fun TestScope.returnFromRide(model: ScooterMapController, api: StubScooterAPI, after: Double, clock: TestClock) {
        model.rentalOpened()
        model.becameInactive()
        clock.advance(after)
        val calls = api.calls
        model.becameActive()
        val refreshed = waitUntil { api.calls == calls + 1 && !model.isLoading.value }
        assertTrue(refreshed)
    }

    /** Runs `body` with the JVM's time zone, which ZoneId.systemDefault reads, set to UTC. */
    private fun inUTC(body: () -> Unit) {
        val zone = TimeZone.getDefault()
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
        try {
            body()
        } finally {
            TimeZone.setDefault(zone)
        }
    }

    /** A CGRect of whole points. */
    private fun rect(x: Number, y: Number, width: Number, height: Number): ScreenRect =
        ScreenRect(x.toDouble(), y.toDouble(), width.toDouble(), height.toDouble())

    private val zurichRegion =MapRegion(GeoPoint(47.3769, 8.5417), latitudeDelta = 0.01, longitudeDelta = 0.01)

    /** A good first fix in Zürich. */
    private val zurichFix: ScooterLocationFix
        get() = ScooterLocationFix(GeoPoint(47.3769, 8.5417), horizontalAccuracy = 25.0, timestamp = Instant.now())

    /** Lungern has no scooter operator; Bern, Wädenswil and Zürich are the closest covered cities. */
    private val lungernRegion = MapRegion(GeoPoint(46.7741, 8.1558), latitudeDelta = 0.02, longitudeDelta = 0.02)

    /** Date.distantFuture: the first day of the year 4001. */
    private val distantFuture = Instant.ofEpochSecond(64_092_211_200)

    // No iOS test: the iPhone routes with its own maps, which never refuse a walk the map let through.
    @Test
    fun aWalkTheSiteFindsTooLongOpensInMapsAsOneTheMapFindsTooLong() = runTest {
        // 9,963 m on the Earth's own shape, under the map's ten kilometres; 10,008 m on the site's sphere.
        val origin = GeoPoint(19.43, -99.13)
        val target = ScooterWalkTarget.Scooter(scooter("far", "lime", latitude = 19.52, longitude = -99.13))
        val opened = mutableListOf<ScooterWalkTarget>()
        var asked = 0
        val tooFar = object : WalkingDirectionsClient {
            override suspend fun walkingPath(from: GeoPoint, to: GeoPoint): List<GeoPoint> {
                asked += 1
                throw WalkingDirectionsError(WalkingDirectionsError.Reason.TooFar)
            }
        }
        val api = StubScooterAPI(ScooterResponse(vehicles = emptyList()))
        val model = makeController(api, directions = tooFar, openInMaps = { opened += it })
        model.setUserLocation(origin)

        model.showWalkingRoute(target)
        runCurrent()

        assertEquals("The map lets the walk through and asks the site", 1, asked)
        assertNull("No \"Couldn't find a walking route.\" note", model.walk.value)
        assertEquals(listOf<ScooterWalkTarget>(target), opened)
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

    /** The dock's summary, or the test fails. */
    private fun summaryOf(dock: ScooterDockContent): ScooterDockSummary =
        (dock as? ScooterDockContent.Summary)?.summary ?: throw AssertionError("Expected the dock summary, got $dock")
}
