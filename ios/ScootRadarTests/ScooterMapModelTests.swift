import CoreLocation
import Foundation
import MapKit
import SwiftUI
import XCTest
@testable import ScootRadar

@MainActor
final class ScooterMapModelTests: XCTestCase {
    func testParkingFollowsZoomAndProviderFiltersWithoutChangingScooterCounts() async {
        let location = ScooterParking(id: "dott:bay", provider: "dott", name: "Place test",
            latitude: 45.75, longitude: 4.85, mandatory: true)
        let api = StubScooterAPI(response: ScooterResponse(vehicles: [], parking: [location]))
        let model = makeModel(api: api)
        let region = MKCoordinateRegion(center: location.coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01))
        model.updateViewport(region, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        XCTAssertEqual(model.mapParking, [location])
        XCTAssertEqual(model.visibleCount, 0)
        model.setMinimumBattery(100)
        XCTAssertEqual(model.mapParking, [location])
        model.toggle(provider: .dott)
        XCTAssertTrue(model.mapParking.isEmpty)
        model.toggle(provider: .dott)
        model.updateViewport(region, zoom: 15)
        XCTAssertTrue(model.mapParking.isEmpty)
    }

    func testGermanAndItalianProviderCoveragePreservesSelection() {
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))
        let selected = model.enabledProviders
        model.viewport = GeoBounds(south: 52.49, west: 13.37, north: 52.55, east: 13.44)
        XCTAssertEqual(model.availableProviders, [.bolt, .dott, .lime, .voi])
        model.viewport = GeoBounds(south: 41.88, west: 12.46, north: 41.93, east: 12.53)
        XCTAssertEqual(model.availableProviders, [.bird, .dott, .lime])
        XCTAssertEqual(model.enabledProviders, selected)
        model.viewport = GeoBounds(south: 48.19, west: 9.16, north: 48.21, east: 9.19)
        XCTAssertFalse(model.availableProviders.contains(.lime))
    }

    func testLimeCoverageReachesTheCompleteMarketsIncludingBrisbanesOuterServiceAreas() {
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))
        // The provider's Wynnum/Manly and Sandgate/Shorncliffe zone icons, beyond central Brisbane.
        let points: [(Double, Double)] = [
            (45.88333, 22.9), (48.97447, 14.47434), (20.58806, -100.38806),
            (26.213, 127.67851), (25.28545, 51.53096), (-33.3976605, -70.5505662),
            (-27.47658, 153.0306725), (-27.44796, 153.17945), (-27.33526, 153.06117)
        ]
        for (lat, lng) in points {
            model.viewport = GeoBounds(south: lat - 0.0002, west: lng - 0.0002,
                north: lat + 0.0002, east: lng + 0.0002)
            XCTAssertTrue(model.availableProviders.contains(.lime), "Lime coverage at \(lat), \(lng)")
        }
    }

    func testFrenchViewportHidesSwissProvidersWithoutChangingSavedSelection() {
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))
        let selected = model.enabledProviders
        model.viewport = GeoBounds(south: 45.72, west: 4.79, north: 45.80, east: 4.90)
        XCTAssertEqual(model.availableProviders, [.dott])
        XCTAssertFalse(model.dockChips.contains { $0.provider == .publibike })
        XCTAssertEqual(model.enabledProviders, selected)
        model.viewport = GeoBounds(south: 47.3, west: 8.4, north: 47.5, east: 8.7)
        XCTAssertTrue(model.availableProviders.contains(.publibike))
    }

    func testProviderCountsRemainAvailableWhenAProviderIsHidden() async {
        let api = StubScooterAPI(response: ScooterResponse(
            vehicles: [], clusters: [ScooterCluster(id: "city:ch:zurich", latitude: 47.38,
                longitude: 8.54, count: 100, providers: ["lime": 80, "bird": 20], city: "Zürich")],
            meta: ScooterResponseMetadata(partial: false, failedSources: [], mode: "clusters", zoom: 8, overview: true)
        ))
        let model = makeModel(api: api)
        model.refresh()
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        model.toggle(provider: .bird)
        XCTAssertEqual(model.count(for: .bird), 20)
        XCTAssertEqual(model.visibleCount, 80)
        XCTAssertEqual(model.allProviderCount, 100)
        XCTAssertTrue(ScooterClusteringPolicy.representationsMatch(6, 10))
        XCTAssertFalse(ScooterClusteringPolicy.representationsMatch(10, 11))
    }

    func testSupersededFetchIsCancelled() async throws {
        let api = StubScooterAPI(response: ScooterResponse(vehicles: []), delaysFirstRequest: true)
        let model = makeModel(api: api)

        model.refresh()
        let firstRequestStarted = await waitUntil {
            await api.snapshot().calls == 1
        }
        XCTAssertTrue(firstRequestStarted)

        model.refresh()

        let replacementFinished = await waitUntil {
            let snapshot = await api.snapshot()
            return snapshot.calls == 2 && snapshot.cancellations == 1
        }
        XCTAssertTrue(replacementFinished)
        let loadingFinished = await waitUntil { await api.snapshot().calls == 2 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loadingFinished)
    }

    func testPartialRefreshAcceptsHealthyResultsAndShowsHealthNotice() async throws {
        let completeScooters = [
            scooter(id: "lime", provider: "lime"),
            scooter(id: "voi", provider: "voi")
        ]
        let api = StubScooterAPI(response: ScooterResponse(vehicles: completeScooters))
        let model = makeModel(api: api)

        model.refresh()
        let initialLoadFinished = await waitUntil {
            await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading
        }
        XCTAssertTrue(initialLoadFinished)

        await api.setResponse(ScooterResponse(
            vehicles: [scooter(id: "voi-new", provider: "voi")],
            meta: ScooterResponseMetadata(partial: true, failedSources: ["national"])
        ))
        model.refresh()

        let partialRefreshFinished = await waitUntil {
            await api.snapshot().calls == 2 && !model.dockNotices.isEmpty && !model.isLoading
        }
        XCTAssertTrue(partialRefreshFinished)
        XCTAssertEqual(model.mapScooters.map(\.vehicleID), ["voi-new"])
        XCTAssertNil(model.loadIssue)
        XCTAssertEqual(model.dockNotices, [.someProvidersDown])
    }

    func testAcceptedDegradedResponseExposesADataHealthMessage() async throws {
        let response = ScooterResponse(
            vehicles: [scooter(id: "lime", provider: "lime")],
            meta: ScooterResponseMetadata(
                partial: true,
                stale: true,
                failedSources: ["national"],
                truncated: true,
                totalVehicles: 5_100
            )
        )
        let api = StubScooterAPI(response: response)
        let model = makeModel(api: api)

        model.refresh()

        let loadingFinished = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loadingFinished)
        XCTAssertEqual(model.dockNotices, [.someProvidersDown, .truncated(shown: 1, total: 5_100)])
        let message = try XCTUnwrap(model.dockNotices.last?.text)
        XCTAssertTrue(message.contains(1.formatted()))
        XCTAssertTrue(message.contains(5_100.formatted()))
    }

    func testCountryScaleResponseRepresentsThousandsWithOneServerClusterAnnotation() async {
        let cluster = ScooterCluster(
            id: "8:134:89",
            latitude: ScooterMapModel.switzerlandCenter.latitude,
            longitude: ScooterMapModel.switzerlandCenter.longitude,
            count: 9_000,
            providers: ["lime": 6_000, "bird": 3_000]
        )
        let response = ScooterResponse(
            vehicles: [],
            clusters: [cluster],
            providers: ["lime": 6_000, "bird": 3_000],
            meta: ScooterResponseMetadata(
                partial: false,
                failedSources: [],
                totalVehicles: 9_000,
                mode: "clusters",
                zoom: 8
            )
        )
        let api = StubScooterAPI(response: response)
        let model = makeModel(api: api)

        model.refresh()
        let loadingFinished = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }

        XCTAssertTrue(loadingFinished)
        XCTAssertTrue(model.mapScooters.isEmpty)
        XCTAssertEqual(model.mapClusters.count, 1)
        XCTAssertEqual(model.mapScooters.count + model.mapClusters.count, 1)
        XCTAssertEqual(model.visibleCount, 9_000)
        let snapshot = await api.snapshot()
        XCTAssertEqual(snapshot.lastZoom, 8)
        XCTAssertEqual(snapshot.lastMinimumBattery, 0)

        model.toggle(provider: .bird)
        XCTAssertEqual(model.mapClusters.first?.count, 6_000)
        XCTAssertEqual(model.visibleCount, 6_000)
    }

    func testClusteredBatteryFilterIsAppliedByTheServer() async {
        let api = StubScooterAPI(response: ScooterResponse(
            vehicles: [],
            clusters: [ScooterCluster(
                id: "8:134:89",
                latitude: ScooterMapModel.switzerlandCenter.latitude,
                longitude: ScooterMapModel.switzerlandCenter.longitude,
                count: 100,
                providers: ["lime": 100]
            )],
            meta: ScooterResponseMetadata(
                partial: false,
                failedSources: [],
                mode: "clusters",
                zoom: 8
            )
        ))
        let model = makeModel(api: api)

        model.refresh()
        let initialLoadFinished = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(initialLoadFinished)

        model.setMinimumBattery(60)
        let filteredLoadFinished = await waitUntil {
            let snapshot = await api.snapshot()
            return snapshot.calls == 2 && !model.isLoading
        }

        XCTAssertTrue(filteredLoadFinished)
        let snapshot = await api.snapshot()
        XCTAssertEqual(snapshot.lastZoom, 8)
        XCTAssertEqual(snapshot.lastMinimumBattery, 60)
    }

    func testBatteryFilterSnapsDownToAPresetPersistsItAndClearsHiddenSelection() async throws {
        let scooter = Scooter(
            provider: "lime",
            latitude: 47.3769,
            longitude: 8.5417,
            battery: 40,
            rangeMeters: nil,
            vehicleID: "selected",
            deepLink: nil,
            rentalURIs: nil,
            distanceMeters: 0
        )
        let api = StubScooterAPI(response: ScooterResponse(vehicles: [scooter]))
        let defaults = isolatedDefaults()
        let model = ScooterMapModel(
            api: api,
            locationManager: CLLocationManager(),
            defaults: defaults
        )
        model.refresh()
        let loadingFinished = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil }
        XCTAssertTrue(loadingFinished)

        model.selectScooter(scooter.id)
        model.setMinimumBattery(29)

        XCTAssertEqual(model.minimumBattery, 0)
        XCTAssertEqual(model.selectedScooterID, scooter.id)

        model.setMinimumBattery(75)

        XCTAssertEqual(model.minimumBattery, 60)
        XCTAssertEqual(defaults.integer(forKey: "minimum-battery"), 60)
        XCTAssertNil(model.selectedScooterID)
        XCTAssertTrue(model.mapScooters.isEmpty)
    }

    func testProviderTogglesComposeAndResetTogether() async {
        let scooters = [
            scooter(id: "lime", provider: "lime"),
            scooter(id: "bird", provider: "bird"),
            scooter(id: "voi", provider: "voi")
        ]
        let api = StubScooterAPI(response: ScooterResponse(vehicles: scooters))
        let model = makeModel(api: api)
        model.refresh()
        let loadingFinished = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil }
        XCTAssertTrue(loadingFinished)

        model.toggle(provider: .voi)
        model.toggle(provider: .bird)

        XCTAssertEqual(model.mapScooters.map(\.provider), ["lime"])
        XCTAssertTrue(model.hasActiveFilters)

        model.resetFilters()

        XCTAssertEqual(Set(model.mapScooters.map(\.provider)), Set(["lime", "bird", "voi"]))
        XCTAssertFalse(model.hasActiveFilters)
    }

    func testQuickProviderTogglesBuildAnyCombinationAndReturnToAll() {
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))

        model.toggleQuickProvider(.bird)
        XCTAssertEqual(model.enabledProviders, [.bird])

        model.toggleQuickProvider(.dott)
        XCTAssertEqual(model.enabledProviders, [.bird, .dott])

        model.toggleQuickProvider(.bird)
        XCTAssertEqual(model.enabledProviders, [.dott])

        model.toggleQuickProvider(.dott)
        XCTAssertTrue(model.allProvidersSelected)
    }

    func testSelectionUsesLatestVehicleIndexAndMapRevisionOnlyChangesWithData() async throws {
        let first = scooter(id: "first", provider: "lime")
        let second = scooter(id: "second", provider: "voi")
        let api = StubScooterAPI(response: ScooterResponse(vehicles: [first, second]))
        let model = makeModel(api: api)

        model.refresh()
        let loadingFinished = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil }
        XCTAssertTrue(loadingFinished)
        let loadedRevision = model.mapScootersRevision

        model.selectScooter(second.id)

        XCTAssertEqual(model.selectedScooter, second)
        XCTAssertEqual(model.mapScootersRevision, loadedRevision)

        await api.setResponse(ScooterResponse(vehicles: [first]))
        model.refresh()
        let refreshed = await waitUntil {
            await api.snapshot().calls == 2 && model.mapScootersRevision > loadedRevision && !model.isLoading
        }
        XCTAssertTrue(refreshed)
        XCTAssertNil(model.selectedScooter)
    }

    func testLocationPolicyRejectsStaleAndInaccurateSamplesAndChoosesBestFallback() {
        let now = Date()
        let preferred = CLLocation(
            coordinate: CLLocationCoordinate2D(latitude: 47.3769, longitude: 8.5417),
            altitude: 0,
            horizontalAccuracy: 50,
            verticalAccuracy: 10,
            timestamp: now
        )
        let fallback = CLLocation(
            coordinate: CLLocationCoordinate2D(latitude: 47.37, longitude: 8.54),
            altitude: 0,
            horizontalAccuracy: 500,
            verticalAccuracy: 10,
            timestamp: now
        )
        let stale = CLLocation(
            coordinate: CLLocationCoordinate2D(latitude: 47.37, longitude: 8.54),
            altitude: 0,
            horizontalAccuracy: 10,
            verticalAccuracy: 10,
            timestamp: now.addingTimeInterval(-31)
        )

        XCTAssertTrue(ScooterLocationPolicy.isAcceptable(
            preferred,
            maximumAccuracy: ScooterLocationPolicy.preferredAccuracy
        ))
        XCTAssertFalse(ScooterLocationPolicy.isAcceptable(
            fallback,
            maximumAccuracy: ScooterLocationPolicy.preferredAccuracy
        ))
        XCTAssertFalse(ScooterLocationPolicy.isAcceptable(
            stale,
            maximumAccuracy: ScooterLocationPolicy.fallbackAccuracy
        ))
        XCTAssertTrue(ScooterLocationPolicy.bestCandidate(in: [fallback, stale, preferred]) === preferred)
    }

    func testUserLocationFocusShowsAboutThreeHundredFiftyMetres() throws {
        let locationManager = CLLocationManager()
        let model = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: locationManager,
            defaults: isolatedDefaults()
        )
        let location = CLLocation(
            coordinate: CLLocationCoordinate2D(latitude: 47.3769, longitude: 8.5417),
            altitude: 0,
            horizontalAccuracy: 25,
            verticalAccuracy: 10,
            timestamp: Date()
        )
        let expectedFocusMeters: CLLocationDistance = 350

        model.locationManager(locationManager, didUpdateLocations: [location])

        let openingFocus = try XCTUnwrap(model.focusRequest)
        XCTAssertEqual(openingFocus.latitudinalMeters, expectedFocusMeters, accuracy: 0.001)
        XCTAssertEqual(openingFocus.longitudinalMeters, expectedFocusMeters, accuracy: 0.001)
        XCTAssertEqual(model.viewportZoom, 17)

        model.focusOnUser()

        let buttonFocus = try XCTUnwrap(model.focusRequest)
        XCTAssertNotEqual(buttonFocus.token, openingFocus.token)
        XCTAssertEqual(buttonFocus.latitudinalMeters, expectedFocusMeters, accuracy: 0.001)
        XCTAssertEqual(buttonFocus.longitudinalMeters, expectedFocusMeters, accuracy: 0.001)
    }

    func testOnlyDeniedLocationAccessOffersASettingsShortcut() {
        XCTAssertTrue(ScooterLocationIssue.denied.canOpenSettings)
        XCTAssertFalse(ScooterLocationIssue.restricted.canOpenSettings)
        XCTAssertFalse(ScooterLocationIssue.denied.message.isEmpty)
        XCTAssertFalse(ScooterLocationIssue.restricted.message.isEmpty)
        XCTAssertNotEqual(
            ScooterLocationIssue.denied.message,
            ScooterLocationIssue.restricted.message
        )
    }

    func testAddressSelectionCreatesDestinationAndNewFocusRequests() {
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))
        let firstDestination = MapDestination(
            title: "Zürich HB",
            point: GeoPoint(latitude: 47.3782, longitude: 8.5402)
        )
        let secondDestination = MapDestination(
            title: "Bellevue",
            point: GeoPoint(latitude: 47.3665, longitude: 8.5451)
        )

        model.selectScooter("lime:selected")
        model.focusOnAddress(firstDestination)

        XCTAssertNil(model.selectedScooterID)
        XCTAssertEqual(model.searchedDestination, firstDestination)
        XCTAssertEqual(model.focusRequest?.point, firstDestination.point)
        let firstToken = model.focusRequest?.token

        model.focusOnAddress(secondDestination)

        XCTAssertEqual(model.searchedDestination, secondDestination)
        XCTAssertEqual(model.focusRequest?.point, secondDestination.point)
        XCTAssertNotEqual(model.focusRequest?.token, firstToken)

        model.clearAddressSearch()
        XCTAssertNil(model.searchedDestination)
    }

    func testActiveOriginPrefersSearchedDestinationAndDistanceUsesIt() throws {
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))
        let userLocation = GeoPoint(latitude: 47.3769, longitude: 8.5417)
        let destination = MapDestination(
            title: "Zürich HB",
            point: GeoPoint(latitude: 47.3782, longitude: 8.5402)
        )
        let candidate = scooter(
            id: "candidate",
            provider: "lime",
            latitude: 47.3790,
            longitude: 8.5402
        )
        model.userLocation = userLocation

        XCTAssertEqual(model.activeOrigin, .userLocation(userLocation))

        model.focusOnAddress(destination)

        XCTAssertEqual(model.activeOrigin, .searchedDestination(destination))
        XCTAssertEqual(
            model.formattedDistance(for: candidate),
            candidate.formattedDistance(from: destination.point)
        )
        XCTAssertEqual(
            try XCTUnwrap(model.straightLineDistance(to: candidate)),
            candidate.distance(from: destination.point),
            accuracy: 0.001
        )

        model.clearAddressSearch()

        XCTAssertEqual(model.activeOrigin, .userLocation(userLocation))
        XCTAssertEqual(
            model.formattedDistance(for: candidate),
            candidate.formattedDistance(from: userLocation)
        )
    }

    func testApproximateWalkingMinutesUseStraightLineDistanceAtEightyMetersPerMinute() throws {
        let origin = GeoPoint(latitude: 47.3769, longitude: 8.5417)
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))
        model.userLocation = origin
        let samePlace = scooter(
            id: "same-place",
            provider: "lime",
            latitude: origin.latitude,
            longitude: origin.longitude
        )
        let aboutOneHundredElevenMetersAway = scooter(
            id: "two-minutes",
            provider: "lime",
            latitude: origin.latitude + 0.001,
            longitude: origin.longitude
        )

        XCTAssertEqual(model.approximateWalkingMinutes(to: samePlace), 1)
        XCTAssertEqual(model.approximateWalkingMinutes(to: aboutOneHundredElevenMetersAway), 2)
        XCTAssertGreaterThan(
            try XCTUnwrap(model.straightLineDistance(to: aboutOneHundredElevenMetersAway)),
            80
        )

        model.userLocation = nil

        XCTAssertNil(model.straightLineDistance(to: samePlace))
        XCTAssertNil(model.approximateWalkingMinutes(to: samePlace))
        XCTAssertNil(model.formattedDistance(for: samePlace))
    }

    func testQuickProviderChoicesKeepReliableCountsForHiddenProviders() async {
        let origin = GeoPoint(latitude: 47.3769, longitude: 8.5417)
        let model = await loadedModel(
            vehicles: [
                scooter(id: "bird", provider: "bird"),
                scooter(id: "dott", provider: "dott"),
                scooter(id: "lime", provider: "lime")
            ],
            origin: origin
        )

        model.showProviders([.bird, .dott])

        XCTAssertEqual(Set(model.mapScooters.compactMap(\.providerInfo)), [.bird, .dott])
        XCTAssertEqual(model.visibleCount, 2)
        XCTAssertEqual(model.count(for: .bird), 1)
        XCTAssertEqual(model.count(for: .dott), 1)
        XCTAssertEqual(model.count(for: .lime), 1)
        XCTAssertEqual(model.allProviderCount, 3)

        model.showProviders([.bird])

        XCTAssertEqual(model.mapScooters.compactMap(\.providerInfo), [.bird])
        XCTAssertEqual(model.visibleCount, 1)
        XCTAssertEqual(model.count(for: .dott), 1)
    }

    func testQuickProviderOrderFollowsCountsAndKeepsCatalogueOrderForTies() async {
        let origin = GeoPoint(latitude: 47.3769, longitude: 8.5417)
        let model = await loadedModel(
            vehicles: [
                scooter(id: "bird-one", provider: "bird"),
                scooter(id: "bird-two", provider: "bird"),
                scooter(id: "bolt-one", provider: "bolt"),
                scooter(id: "bolt-two", provider: "bolt"),
                scooter(id: "dott", provider: "dott"),
                scooter(id: "lime", provider: "lime")
            ],
            origin: origin
        )

        XCTAssertEqual(model.dockChips.prefix(4).map(\.provider), [.bolt, .bird, .dott, .lime])
        XCTAssertEqual(model.dockChips.dropFirst(4).prefix(2).map(\.provider), [.hopp, .voi])

        // Choosing providers highlights their chips without moving them.
        model.showProviders([.lime, .voi])

        XCTAssertEqual(model.dockChips.prefix(4).map(\.provider), [.bolt, .bird, .dott, .lime])
        XCTAssertEqual(model.dockChips.filter(\.isSelected).map(\.provider), [.lime, .voi])
        XCTAssertEqual(model.dockChips.first?.count, 2)
    }

    func testProviderChoicePersistsAcrossModelInstances() {
        let defaults = isolatedDefaults()
        let firstModel = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: CLLocationManager(),
            defaults: defaults
        )

        firstModel.showProviders([.hopp, .publibike])

        let restoredModel = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: CLLocationManager(),
            defaults: defaults
        )

        XCTAssertEqual(restoredModel.enabledProviders, [.hopp, .publibike])
    }

    func testAppearanceGoesByTheSunUntilOneIsChosenAndIsKept() throws {
        let defaults = isolatedDefaults()
        let clock = TestClock()
        func makeModel() -> ScooterMapModel {
            ScooterMapModel(
                api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
                locationManager: CLLocationManager(),
                defaults: defaults,
                now: { clock.now }
            )
        }
        let iso = ISO8601DateFormatter()
        let firstModel = makeModel()
        XCTAssertEqual(firstModel.appearance, .sun)
        // In Switzerland, where the map opens, until the rider is located.
        clock.now = try XCTUnwrap(iso.date(from: "2026-10-24T18:45:00+02:00"))
        XCTAssertEqual(firstModel.interfaceStyle, .light)
        clock.now = try XCTUnwrap(iso.date(from: "2026-10-24T19:00:00+02:00"))
        XCTAssertEqual(firstModel.interfaceStyle, .dark)
        // Where the rider is: in Lisbon it sets at 18:46, an hour and 23 minutes later.
        firstModel.userLocation = GeoPoint(latitude: 38.7223, longitude: -9.1393)
        clock.now = try XCTUnwrap(iso.date(from: "2026-10-24T18:00:00+01:00"))
        XCTAssertEqual(firstModel.interfaceStyle, .light)
        clock.now = try XCTUnwrap(iso.date(from: "2026-10-24T19:20:00+01:00"))
        XCTAssertEqual(firstModel.interfaceStyle, .dark)

        firstModel.appearance = .light
        XCTAssertEqual(firstModel.interfaceStyle, .light)
        firstModel.appearance = .dark

        let restoredModel = makeModel()
        XCTAssertEqual(restoredModel.appearance, .dark)
        XCTAssertEqual(restoredModel.interfaceStyle, .dark)

        // Automatic as it was before the sun, chosen in Settings, still
        // follows the iPhone.
        defaults.set("automatic", forKey: "appearance")
        let systemModel = makeModel()
        XCTAssertEqual(systemModel.appearance, .system)
        XCTAssertEqual(systemModel.interfaceStyle, .unspecified)

        // A value the app no longer knows goes by the sun.
        defaults.set("sepia", forKey: "appearance")
        XCTAssertEqual(makeModel().appearance, .sun)
    }

    func testChosenLanguageChangesTheTextAtOnceAndIsKeptWhereIOSReadsIt() {
        let defaults = isolatedDefaults()
        let model = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: CLLocationManager(),
            defaults: defaults
        )
        defer { ScooterLanguage.current = .atLaunch }
        XCTAssertEqual(model.language, .atLaunch)

        model.languageChoice = .language(.fr)
        XCTAssertEqual(model.language, .fr)
        XCTAssertEqual(ScooterLanguage.current, .fr)
        XCTAssertEqual(AppleMapStyle.quiet.label, "Épuré")
        XCTAssertEqual(ScooterAppearance.dark.label, "Sombre")
        XCTAssertEqual(ScooterLanguage.current.locale.language.languageCode?.identifier, "fr")
        XCTAssertEqual(defaults.stringArray(forKey: "AppleLanguages"), ["fr"])

        model.languageChoice = .language(.de)
        XCTAssertEqual(AppleMapStyle.quiet.label, "Ruhig")
        XCTAssertEqual(ScooterAppearance.dark.label, "Dunkel")
        // The numbers keep to the region of the iPhone, whichever the language.
        XCTAssertEqual(ScooterLanguage.current.locale.language.languageCode?.identifier, "de")
        XCTAssertEqual(ScooterLanguage.current.locale.region, Locale.current.region)
        XCTAssertEqual(defaults.stringArray(forKey: "AppleLanguages"), ["de"])
    }

    func testAutomaticTakesTheChosenLanguageAwayAndShowsTheIPhonesAtOnce() throws {
        let suiteName = "ScootRadarTests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defaults.removePersistentDomain(forName: suiteName)
        var iPhoneLanguages = ["ja-JP", "is-IS", "en-GB"]
        let model = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: CLLocationManager(),
            defaults: defaults,
            iPhoneLanguages: { iPhoneLanguages }
        )
        defer { ScooterLanguage.current = .atLaunch }
        // The first of the iPhone's languages the app is translated into.
        XCTAssertEqual(model.iPhoneLanguage, .is)

        // From whatever the app was launched with.
        model.languageChoice = .automatic
        model.languageChoice = .language(.fr)
        XCTAssertEqual(defaults.persistentDomain(forName: suiteName)?["AppleLanguages"] as? [String], ["fr"])

        model.languageChoice = .automatic
        // Gone from the app's own defaults, so that iOS follows the iPhone at the next launch.
        XCTAssertNil(defaults.persistentDomain(forName: suiteName)?["AppleLanguages"])
        XCTAssertEqual(model.languageChoice, .automatic)
        XCTAssertEqual(model.language, .is)
        XCTAssertEqual(ScooterLanguage.current, .is)
        XCTAssertEqual(ScooterAppearance.dark.label, "Dökkt")

        // A language chosen again is kept again.
        model.languageChoice = .language(.it)
        XCTAssertEqual(defaults.persistentDomain(forName: suiteName)?["AppleLanguages"] as? [String], ["it"])
        XCTAssertEqual(ScooterAppearance.sun.label, "Automatico")
        XCTAssertEqual(ScooterAppearance.system.label, "Sistema")

        // An iPhone in none of the app's languages is followed in English.
        iPhoneLanguages = ["ja-JP", "zh-Hans-CN"]
        model.languageChoice = .automatic
        XCTAssertEqual(model.language, .en)
        XCTAssertNil(defaults.persistentDomain(forName: suiteName)?["AppleLanguages"])
    }

    func testRideDurationAndProviderPassesPersistIndependently() {
        let defaults = isolatedDefaults()
        let firstModel = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: CLLocationManager(),
            defaults: defaults
        )
        let expiryDate = Date(timeIntervalSince1970: 1_800_000_000)
        let boltPass = ProviderRidePass(
            enabled: true,
            freeUnlock: true,
            freeMinutes: 15,
            expiryDate: expiryDate
        )
        let voiPass = ProviderRidePass(enabled: true, freeMinutes: 5)

        firstModel.setRideEstimateMinutes(20)
        firstModel.setRidePass(boltPass, for: .bolt)
        firstModel.setRidePass(voiPass, for: .voi)

        let restoredModel = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: CLLocationManager(),
            defaults: defaults
        )

        XCTAssertEqual(restoredModel.rideEstimateMinutes, 20)
        XCTAssertEqual(restoredModel.ridePass(for: .bolt), boltPass)
        XCTAssertEqual(restoredModel.ridePass(for: .voi), voiPass)
        XCTAssertEqual(restoredModel.ridePass(for: .lime), ProviderRidePass())
    }

    func testInvalidStoredRideDurationFallsBackToTenMinutes() {
        let defaults = isolatedDefaults()
        defaults.set(17, forKey: "ride-estimate-minutes-v1")

        let model = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: CLLocationManager(),
            defaults: defaults
        )

        XCTAssertEqual(model.rideEstimateMinutes, RideEstimateDuration.defaultMinutes)
    }

    func testRidePriceQuoteUsesTheSelectedScootersProviderPass() throws {
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))
        model.setRideEstimateMinutes(10)
        model.setRidePass(
            ProviderRidePass(enabled: true, freeUnlock: true, freeMinutes: 5),
            for: .bolt
        )
        model.setRidePass(
            ProviderRidePass(enabled: true, freeUnlock: true, freeMinutes: 10),
            for: .voi
        )
        let bolt = Scooter(
            provider: "bolt",
            latitude: 47.3769,
            longitude: 8.5417,
            battery: 90,
            rangeMeters: nil,
            vehicleID: "priced",
            deepLink: nil,
            rentalURIs: nil,
            distanceMeters: 0,
            pricing: ScooterRidePricing(
                currency: "CHF",
                unlockFeeMinorUnits: 100,
                minuteFeeMinorUnits: 42
            )
        )

        let quote = try XCTUnwrap(model.ridePriceQuote(for: bolt))

        XCTAssertEqual(quote.grossMinorUnits, 520)
        XCTAssertEqual(quote.totalMinorUnits, 210)
        XCTAssertEqual(quote.chargedUnlockFeeMinorUnits, 0)
        XCTAssertEqual(quote.billedMinutes, 5)
        XCTAssertEqual(quote.freeMinutesApplied, 5)
        XCTAssertTrue(quote.passApplied)
    }

    func testFocusingOnUserClearsSearchedDestinationAndRestoresUserOrigin() {
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))
        let userLocation = GeoPoint(latitude: 47.3769, longitude: 8.5417)
        let destination = MapDestination(
            title: "Bellevue",
            point: GeoPoint(latitude: 47.3665, longitude: 8.5451)
        )
        model.userLocation = userLocation
        model.focusOnAddress(destination)

        model.focusOnUser()

        XCTAssertNil(model.searchedDestination)
        XCTAssertEqual(model.activeOrigin, .userLocation(userLocation))
        XCTAssertEqual(model.focusRequest?.point, userLocation)
    }

    /// Without the cities' zones, which these tests' maps leave off: MapKit crashes, or hangs,
    /// when a map goes while it still draws an overlay's tiles (-[MKMapViewInternal startEffects]
    /// from a timer, or a VKMapView waiting on its tile decoding), and Zürich's zones, where the
    /// map opens, were put on a test's map as it ended (CI, 31 Oct 2026). ScooterZonesTests has them.
    private func makeModel(api: any ScooterAPIClient) -> ScooterMapModel {
        ScooterMapModel(
            api: api,
            locationManager: CLLocationManager(),
            defaults: isolatedDefaults(),
            builtInZones: []
        )
    }

    private func loadedModel(
        vehicles: [Scooter],
        origin: GeoPoint
    ) async -> ScooterMapModel {
        let api = StubScooterAPI(response: ScooterResponse(vehicles: vehicles))
        let model = makeModel(api: api)
        model.userLocation = origin
        model.refresh()
        let loadingFinished = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loadingFinished)
        return model
    }

    private func scooter(
        id: String,
        provider: String,
        latitude: Double = 47.3769,
        longitude: Double = 8.5417,
        battery: Int? = 80,
        rangeMeters: Int? = nil,
        rentalURIs: ScooterRentalURIs? = nil
    ) -> Scooter {
        Scooter(
            provider: provider,
            latitude: latitude,
            longitude: longitude,
            battery: battery,
            rangeMeters: rangeMeters,
            vehicleID: id,
            deepLink: nil,
            rentalURIs: rentalURIs,
            distanceMeters: 0
        )
    }

    private func isolatedDefaults() -> UserDefaults {
        let suiteName = "ScootRadarTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)
        return defaults
    }

    /// A wait for what a request brings asks the stub for its call count first, so it queues behind
    /// that request rather than looking 200 times before a busy CI simulator has run it. A wait that
    /// read only the model ran out on CI on 22 and 23 Oct 2026; the one beside it that asked passed.
    private func waitUntil(
        attempts: Int = 200,
        condition: @escaping () async -> Bool
    ) async -> Bool {
        for _ in 0 ..< attempts {
            if await condition() {
                return true
            }
            try? await Task.sleep(for: .milliseconds(10))
        }
        return false
    }
}

private actor StubScooterAPI: ScooterAPIClient {
    private var response: ScooterResponse
    private var failure: ScooterAPIError?
    private let delaysFirstRequest: Bool
    private var calls = 0
    private var cancellations = 0
    private var lastZoom: Int?
    private var lastMinimumBattery: Int?

    init(response: ScooterResponse, delaysFirstRequest: Bool = false) {
        self.response = response
        self.delaysFirstRequest = delaysFirstRequest
    }

    func scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) async throws -> ScooterResponse {
        _ = bounds
        calls += 1
        lastZoom = zoom
        lastMinimumBattery = minimumBattery
        if delaysFirstRequest, calls == 1 {
            do {
                try await Task.sleep(for: .seconds(30))
            } catch {
                cancellations += 1
                throw error
            }
        }
        if let failure { throw failure }
        return response
    }

    func setResponse(_ response: ScooterResponse) {
        self.response = response
    }

    func setFailure(_ failure: ScooterAPIError?) {
        self.failure = failure
    }

    func snapshot() -> (
        calls: Int,
        cancellations: Int,
        lastZoom: Int?,
        lastMinimumBattery: Int?
    ) {
        (calls, cancellations, lastZoom, lastMinimumBattery)
    }
}

extension ScooterMapModelTests {
    func testReturningToLoadedAreaDiscardsPendingOtherArea() async throws {
        let api = DelayedSecondAPI()
        let model = makeModel(api: api)
        let a = MKCoordinateRegion(center: CLLocationCoordinate2D(latitude: 47.377, longitude: 8.542), span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01))
        let b = MKCoordinateRegion(center: CLLocationCoordinate2D(latitude: 45.75, longitude: 4.85), span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01))
        model.updateViewport(a, zoom: 16)
        let aLoaded = await waitUntil { await api.callCount() == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(aLoaded)
        XCTAssertEqual(model.visibleCount, 1)
        model.updateViewport(b, zoom: 16)
        let bRequested = await waitUntil { await api.callCount() == 2 }
        XCTAssertTrue(bRequested)
        model.updateViewport(a, zoom: 16)
        try await Task.sleep(for: .milliseconds(650))
        XCTAssertEqual(model.viewport, GeoBounds(region: a))
        XCTAssertEqual(model.visibleCount, 1, "Returning to cached A must not let pending B erase A's scooter")
        XCTAssertEqual(model.mapScooters.first?.latitude, 47.377)
    }

    func testUnsolicitedNetworkCancellationClearsLoading() async throws {
        let api = CancelledAPI()
        let model = makeModel(api: api)
        model.refresh()
        // Waits for the request rather than a fixed time: a slow CI simulator
        // can take longer than that to come back to the main actor.
        let cleared = await waitUntil { await api.callCount() == 1 && !model.isLoading }
        XCTAssertTrue(cleared, "A cancelled URLSession request should clear loading and pending state")
        model.autoRefreshIfNeeded()
        let retried = await waitUntil { await api.callCount() == 2 && !model.isLoading }
        XCTAssertTrue(retried, "With nothing pending, the next automatic refresh asks again")
    }
}

private actor DelayedSecondAPI: ScooterAPIClient {
    private var calls = 0
    func callCount() -> Int { calls }
    func scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) async throws -> ScooterResponse {
        calls += 1
        let second = calls == 2
        if second { try await Task.sleep(for: .milliseconds(500)) }
        return ScooterResponse(vehicles: [Scooter(provider: "lime", latitude: second ? 45.75 : 47.377, longitude: second ? 4.85 : 8.542, battery: 80, rangeMeters: nil, vehicleID: second ? "B" : "A", deepLink: nil, rentalURIs: nil, distanceMeters: nil)])
    }
}

private actor CancelledAPI: ScooterAPIClient {
    private var calls = 0
    func callCount() -> Int { calls }
    func scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) async throws -> ScooterResponse {
        calls += 1
        throw CancellationError()
    }
}


/// Holds a request until the test releases it, optionally with a failure.
private actor HeldScooterAPI: ScooterAPIClient {
    private let response: ScooterResponse
    private var calls = 0
    private var holdsNextRequest = false
    private var held: CheckedContinuation<Void, Never>?
    private var heldFailure: ScooterAPIError?

    init(response: ScooterResponse) {
        self.response = response
    }

    var isHolding: Bool { held != nil }

    func callCount() -> Int { calls }

    func holdNextRequest() {
        holdsNextRequest = true
    }

    func release(failing failure: ScooterAPIError? = nil) {
        heldFailure = failure
        held?.resume()
        held = nil
    }

    func scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) async throws -> ScooterResponse {
        calls += 1
        if holdsNextRequest {
            holdsNextRequest = false
            await withCheckedContinuation { held = $0 }
            if let heldFailure {
                self.heldFailure = nil
                throw heldFailure
            }
        }
        return response
    }
}

private final class TestClock {
    var now = Date(timeIntervalSince1970: 1_790_000_000)

    func advance(_ seconds: TimeInterval) {
        now = now.addingTimeInterval(seconds)
    }
}

/// Ends the run once the main thread has run for `cpuSeconds` of its own time
/// from now on. A loop that never gives the main thread back can't let a test
/// fail by itself, so this ends it rather than leaving it to hang. It counts the
/// thread's CPU time, not the clock's: CI's runners stall for a minute or more
/// with no loop at all, and the main thread then runs for next to nothing. A
/// main thread stuck without running ends the run after `clockSeconds`.
private final class MainThreadWatchdog: @unchecked Sendable {
    private let timer = DispatchSource.makeTimerSource(queue: .global())

    @MainActor
    init(_ message: String, cpuSeconds: Double = 15, clockSeconds: Double = 300) {
        // The main thread's port, taken on it. pthread_mach_thread_np takes no
        // right on the port, so there is none to give back.
        let thread = pthread_mach_thread_np(pthread_self())
        let start = Self.cpuSeconds(of: thread)
        let deadline = DispatchTime.now() + clockSeconds
        // Not on the main actor, which the test holds: the handler runs on another thread.
        timer.setEventHandler { @Sendable in
            let spent = Self.cpuSeconds(of: thread) - start
            if spent > cpuSeconds {
                fatalError("\(message): the main thread ran for \(Int(spent)) s without giving the test back")
            }
            if DispatchTime.now() > deadline {
                fatalError("\(message): the main thread didn't give the test back in \(Int(clockSeconds)) s")
            }
        }
        timer.schedule(deadline: .now() + 0.25, repeating: 0.25)
        timer.resume()
    }

    func cancel() {
        timer.cancel()
    }

    private static func cpuSeconds(of thread: mach_port_t) -> Double {
        var info = thread_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<thread_basic_info>.size / MemoryLayout<integer_t>.size)
        let result = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                thread_info(thread, thread_flavor_t(THREAD_BASIC_INFO), $0, &count)
            }
        }
        guard result == KERN_SUCCESS else { return 0 }
        func seconds(_ time: time_value_t) -> Double {
            Double(time.seconds) + Double(time.microseconds) / 1_000_000
        }
        return seconds(info.user_time) + seconds(info.system_time)
    }
}

private final class StubLocationManager: CLLocationManager {
    /// Tests change it to answer the permission prompt.
    var status: CLAuthorizationStatus

    init(status: CLAuthorizationStatus) {
        self.status = status
        super.init()
    }

    /// The fix Core Location keeps from before, as at a relaunch.
    var cachedLocation: CLLocation?

    override var authorizationStatus: CLAuthorizationStatus { status }
    override var location: CLLocation? { cachedLocation }
    override func requestWhenInUseAuthorization() {}
    override func startUpdatingLocation() {}
    override func startUpdatingHeading() {}
    override func stopUpdatingHeading() {}
}

// Freshness, refresh and failures.
extension ScooterMapModelTests {
    func testFirstLoadFailureIsReportedWithItsReasonWhileTheDockWaits() async {
        let api = StubScooterAPI(response: ScooterResponse(vehicles: []))
        await api.setFailure(.httpStatus(503))
        let model = makeModel(api: api)

        XCTAssertEqual(model.dock, .finding(chips: []))

        model.refresh()
        let failed = await waitUntil { await api.snapshot().calls == 1 && model.loadIssue != nil && !model.isLoading }

        XCTAssertTrue(failed)
        XCTAssertEqual(model.loadIssue, .firstLoadFailed(.unavailable))
        XCTAssertEqual(model.dock, .waiting)
        XCTAssertNil(model.lastUpdated)

        await api.setFailure(nil)
        model.retryLoad()
        let recovered = await waitUntil { await api.snapshot().calls == 2 && model.loadIssue == nil && model.lastUpdated != nil }

        XCTAssertTrue(recovered)
        guard case .summary = model.dock else { return XCTFail("Expected the dock summary") }
    }

    func testFailedRefreshKeepsValidDataAndNamesTheTimeStillShown() async throws {
        let clock = TestClock()
        let api = StubScooterAPI(response: timedResponse(generatedAt: clock.now, expiresIn: 300))
        let model = makeModel(api: api, clock: clock)
        model.refresh()
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        let shownAt = try XCTUnwrap(model.lastUpdated)
        let revision = model.mapScootersRevision

        await api.setFailure(.offline)
        clock.advance(61)
        model.autoRefreshIfNeeded()
        let failed = await waitUntil { await api.snapshot().calls == 2 && model.loadIssue != nil && !model.isLoading }

        XCTAssertTrue(failed)
        XCTAssertEqual(model.loadIssue, .refreshFailed(.offline, showing: shownAt))
        XCTAssertEqual(model.mapScooters.count, 1)
        XCTAssertEqual(model.mapScootersRevision, revision, "Markers stay exactly as they are")
        guard case let .summary(offline) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(offline.status(at: clock.now), .offline(showing: shownAt))
        XCTAssertEqual(offline.status(at: clock.now)?.isWarning, true)
        XCTAssertTrue(offline.showsTryAgain)
        XCTAssertEqual(offline.count, 1)

        await api.setFailure(.timedOut)
        model.retryLoad()
        let failedAgain = await waitUntil {
            await api.snapshot().calls == 3 && model.loadIssue == .refreshFailed(.timeout, showing: shownAt) && !model.isLoading
        }

        XCTAssertTrue(failedAgain)
        guard case let .summary(timedOut) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(timedOut.status(at: clock.now), .refreshFailed(showing: shownAt))

        await api.setFailure(nil)
        model.retryLoad()
        let recovered = await waitUntil { await api.snapshot().calls == 4 && model.loadIssue == nil && !model.isLoading }

        XCTAssertTrue(recovered)
        guard case let .summary(healthy) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertFalse(healthy.showsTryAgain)
        XCTAssertEqual(healthy.status(at: clock.now)?.isWarning, false)
    }

    func testFailedRefreshKeepsScootersForFifteenMinutesAtMost() async {
        let clock = TestClock()
        let generatedAt = clock.now
        // Even an overly generous server expiry is capped at fifteen minutes.
        let api = StubScooterAPI(response: timedResponse(generatedAt: generatedAt, expiresIn: 3_600))
        let model = makeModel(api: api, clock: clock)
        model.refresh()
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        await api.setFailure(.httpStatus(503))
        clock.advance(480)
        model.autoRefreshIfNeeded()
        let failed = await waitUntil { await api.snapshot().calls == 2 && model.loadIssue != nil && !model.isLoading }
        XCTAssertTrue(failed)
        XCTAssertEqual(model.loadIssue, .refreshFailed(.unavailable, showing: generatedAt))
        XCTAssertEqual(model.mapScooters.count, 1)

        clock.advance(420)
        model.autoRefreshIfNeeded()
        let expired = await waitUntil {
            await api.snapshot().calls == 3
                && model.loadIssue == .outOfDate(.unavailable, lastUpdate: generatedAt) && !model.isLoading
        }
        XCTAssertTrue(expired)
        XCTAssertTrue(model.mapScooters.isEmpty)
    }

    func testExpiredDataIsClearedOnlyWhenTheRefreshThatFollowsFails() async throws {
        let clock = TestClock()
        let generatedAt = clock.now
        let api = StubScooterAPI(response: timedResponse(generatedAt: generatedAt, expiresIn: 60))
        let model = makeModel(api: api, clock: clock)
        model.refresh()
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        model.selectScooter(try XCTUnwrap(model.mapScooters.first?.id))

        // Passing the expiry clears nothing by itself.
        clock.advance(61)
        XCTAssertEqual(model.mapScooters.count, 1)
        XCTAssertNotNil(model.selectedScooter)
        XCTAssertNil(model.loadIssue)

        await api.setFailure(.timedOut)
        model.autoRefreshIfNeeded()
        let expired = await waitUntil { await api.snapshot().calls == 2 && model.loadIssue != nil && !model.isLoading }

        XCTAssertTrue(expired)
        XCTAssertEqual(model.loadIssue, .outOfDate(.timeout, lastUpdate: generatedAt))
        XCTAssertTrue(model.mapScooters.isEmpty)
        XCTAssertNil(model.selectedScooterID)
        XCTAssertEqual(model.lastUpdated, generatedAt)
        XCTAssertEqual(model.dock, .outOfDate(.timeout, lastUpdate: generatedAt))

        // The reason follows the latest attempt; the last update does not move.
        await api.setFailure(.offline)
        model.retryLoad()
        let stillOutOfDate = await waitUntil {
            await api.snapshot().calls == 3 && model.loadIssue == .outOfDate(.offline, lastUpdate: generatedAt) && !model.isLoading
        }
        XCTAssertTrue(stillOutOfDate)

        await api.setFailure(nil)
        model.retryLoad()
        let recovered = await waitUntil { await api.snapshot().calls == 4 && model.loadIssue == nil && !model.isLoading }

        XCTAssertTrue(recovered)
        XCTAssertEqual(model.mapScooters.count, 1)
        guard case .summary = model.dock else { return XCTFail("Expected the dock summary") }
    }

    func testResponseIsNeverAnErrorBecauseOfItsOwnTimestamps() async {
        let clock = TestClock()
        // Observed six minutes ago, so it arrives already past its own expiry.
        let api = StubScooterAPI(response: timedResponse(
            generatedAt: clock.now.addingTimeInterval(-360),
            expiresIn: 300
        ))
        let model = makeModel(api: api, clock: clock)

        model.refresh()
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }

        XCTAssertTrue(loaded)
        XCTAssertNil(model.loadIssue)
        XCTAssertEqual(model.mapScooters.count, 1)
        guard case let .summary(summary) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(summary.status(at: clock.now), .updatedMinutesAgo(6))

        // The next attempt follows as soon as the gap between attempts allows.
        clock.advance(9)
        model.autoRefreshIfNeeded()
        await settle()
        var calls = await api.snapshot().calls
        XCTAssertEqual(calls, 1)

        clock.advance(1)
        model.autoRefreshIfNeeded()
        let refreshed = await waitUntil { await api.snapshot().calls == 2 && !model.isLoading }

        XCTAssertTrue(refreshed)
        calls = await api.snapshot().calls
        XCTAssertEqual(calls, 2)
        XCTAssertNil(model.loadIssue)
        XCTAssertEqual(model.mapScooters.count, 1)
    }

    func testAutomaticRefreshWaitsForTheIntervalOrTheApproachingExpiry() async {
        let clock = TestClock()
        let api = StubScooterAPI(response: timedResponse(generatedAt: clock.now, expiresIn: 300))
        let model = makeModel(api: api, clock: clock)
        model.refresh()
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        clock.advance(59)
        model.autoRefreshIfNeeded()
        await settle()
        var calls = await api.snapshot().calls
        XCTAssertEqual(calls, 1)

        clock.advance(1)
        model.autoRefreshIfNeeded()
        let refreshedAfterInterval = await waitUntil { await api.snapshot().calls == 2 && !model.isLoading }
        XCTAssertTrue(refreshedAfterInterval)

        // Data that expires sooner is refreshed five seconds before it does.
        await api.setResponse(timedResponse(generatedAt: clock.now, expiresIn: 40))
        model.refresh()
        let reloaded = await waitUntil { await api.snapshot().calls == 3 && !model.isLoading }
        XCTAssertTrue(reloaded)

        clock.advance(34)
        model.autoRefreshIfNeeded()
        await settle()
        calls = await api.snapshot().calls
        XCTAssertEqual(calls, 3)

        clock.advance(1)
        model.autoRefreshIfNeeded()
        let refreshedBeforeExpiry = await waitUntil { await api.snapshot().calls == 4 && !model.isLoading }
        XCTAssertTrue(refreshedBeforeExpiry)
    }

    func testAutomaticRetriesKeepTenSecondsBetweenAttempts() async {
        let clock = TestClock()
        let api = StubScooterAPI(response: ScooterResponse(vehicles: []))
        await api.setFailure(.httpStatus(429))
        let model = makeModel(api: api, clock: clock)
        model.refresh()
        let failed = await waitUntil { await api.snapshot().calls == 1 && model.loadIssue == .firstLoadFailed(.busy) && !model.isLoading }
        XCTAssertTrue(failed)

        clock.advance(9)
        model.autoRefreshIfNeeded()
        await settle()
        let calls = await api.snapshot().calls
        XCTAssertEqual(calls, 1)

        clock.advance(1)
        model.autoRefreshIfNeeded()
        let retried = await waitUntil { await api.snapshot().calls == 2 && !model.isLoading }
        XCTAssertTrue(retried)
    }

    func testReturningToTheForegroundRefreshesAtOnceWhenARefreshIsDue() async {
        let clock = TestClock()
        let api = StubScooterAPI(response: timedResponse(generatedAt: clock.now, expiresIn: 300))
        let model = makeModel(api: api, clock: clock)
        model.refresh()
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        // Nothing refreshes while the app is in the background.
        model.becameInactive()
        clock.advance(61)
        model.autoRefreshIfNeeded()
        await settle()
        let calls = await api.snapshot().calls
        XCTAssertEqual(calls, 1)

        await api.setFailure(.offline)
        model.becameActive()
        let refreshedOnReturn = await waitUntil { await api.snapshot().calls == 2 && !model.isLoading }

        XCTAssertTrue(refreshedOnReturn)
        XCTAssertEqual(model.mapScooters.count, 1, "The old data stays until it has expired")

        // A return to the foreground does not wait for the gap between attempts.
        model.becameInactive()
        clock.advance(2)
        model.becameActive()
        let retriedOnReturn = await waitUntil { await api.snapshot().calls == 3 && !model.isLoading }
        XCTAssertTrue(retriedOnReturn)

        // Nothing is due right after a successful load.
        await api.setFailure(nil)
        model.retryLoad()
        let recovered = await waitUntil { await api.snapshot().calls == 4 && model.loadIssue == nil && !model.isLoading }
        XCTAssertTrue(recovered)
        model.becameInactive()
        clock.advance(30)
        model.becameActive()
        await settle()
        let callsAfterEarlyReturn = await api.snapshot().calls
        XCTAssertEqual(callsAfterEarlyReturn, 4)
    }

    func testExpiryWaitsForTheRequestInFlightBeforeAnythingIsCleared() async {
        let clock = TestClock()
        let generatedAt = clock.now
        let api = HeldScooterAPI(response: timedResponse(generatedAt: generatedAt, expiresIn: 60))
        let model = makeModel(api: api, clock: clock)
        model.refresh()
        let loaded = await waitUntil { await api.callCount() == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        await api.holdNextRequest()
        clock.advance(56)
        model.autoRefreshIfNeeded()
        let inFlight = await waitUntil { await api.isHolding }
        XCTAssertTrue(inFlight)

        // The data expires while that request is still out: no second request, nothing cleared.
        clock.advance(5)
        model.autoRefreshIfNeeded()
        await settle()
        let calls = await api.callCount()
        XCTAssertEqual(calls, 2)
        XCTAssertEqual(model.mapScooters.count, 1)
        XCTAssertNil(model.loadIssue)

        await api.release(failing: .offline)
        let cleared = await waitUntil { await api.callCount() == 2 && model.loadIssue != nil && !model.isLoading }

        XCTAssertTrue(cleared)
        XCTAssertEqual(model.loadIssue, .outOfDate(.offline, lastUpdate: generatedAt))
        XCTAssertTrue(model.mapScooters.isEmpty)
    }

    func testModelRetriesByItselfWhileActiveAndWaitsWhileInTheBackground() async {
        let api = StubScooterAPI(response: ScooterResponse(vehicles: [scooter(id: "one", provider: "lime")]))
        await api.setFailure(.timedOut)
        let model = ScooterMapModel(
            api: api,
            locationManager: CLLocationManager(),
            defaults: isolatedDefaults(),
            refreshPolicy: ScooterRefreshPolicy(minimumAttemptGap: 0.05)
        )

        // Nothing nudges the model: it keeps trying on its own.
        model.refresh()
        let retried = await waitUntil { await api.snapshot().calls >= 3 }
        XCTAssertTrue(retried)
        XCTAssertEqual(model.loadIssue, .firstLoadFailed(.timeout))

        // In the background it stops.
        model.becameInactive()
        await settle()
        let callsInBackground = await api.snapshot().calls
        try? await Task.sleep(for: .milliseconds(200))
        let callsLater = await api.snapshot().calls
        XCTAssertEqual(callsLater, callsInBackground)

        // Back in the foreground it tries at once, and a success ends the retries.
        await api.setFailure(nil)
        model.becameActive()
        let recovered = await waitUntil {
            await api.snapshot().calls == callsLater + 1
                && model.loadIssue == nil && model.lastUpdated != nil && !model.isLoading
        }
        XCTAssertTrue(recovered)
        XCTAssertEqual(model.mapScooters.count, 1)
        let callsAfterRecovery = await api.snapshot().calls
        XCTAssertEqual(callsAfterRecovery, callsLater + 1)
        try? await Task.sleep(for: .milliseconds(200))
        let callsAtRest = await api.snapshot().calls
        XCTAssertEqual(callsAtRest, callsAfterRecovery)
    }

    func testParkingExpiresOnItsOwnScheduleWhileScootersStay() async {
        let clock = TestClock()
        let bay = ScooterParking(id: "bay", provider: "lime", name: "Bay",
            latitude: 47.3769, longitude: 8.5417, mandatory: true)
        let api = StubScooterAPI(response: timedResponse(
            generatedAt: clock.now, expiresIn: 60, parking: [bay], parkingExpiresIn: 120
        ))
        let model = makeModel(api: api, clock: clock)
        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        model.selectParking(bay.id)
        XCTAssertEqual(model.selectedParking, bay)

        clock.advance(119)
        model.expireParkingIfNeeded()
        XCTAssertEqual(model.parking, [bay])
        XCTAssertEqual(model.mapScooters.count, 1)

        clock.advance(2)
        model.expireParkingIfNeeded()
        XCTAssertTrue(model.parking.isEmpty)
        XCTAssertNil(model.selectedParkingID)
        XCTAssertEqual(model.mapScooters.count, 1)
        XCTAssertNil(model.loadIssue)
    }

    func testAPhoneClockTwentyMinutesFastNeitherExpiresNorAgesFreshData() async {
        await assertServerTimesFollowTheServersClock(clockOffset: 1_200)
    }

    func testAPhoneClockTwentyMinutesSlowStillExpiresDataWhenTheServerSays() async {
        await assertServerTimesFollowTheServersClock(clockOffset: -1_200)
    }

    /// The phone's clock is `clockOffset` ahead of the server's. By the
    /// server's clock the response was just generated, its scooters expire in
    /// ten minutes and its bays in three, and that is what the phone keeps to.
    private func assertServerTimesFollowTheServersClock(clockOffset: TimeInterval) async {
        let clock = TestClock()
        let receivedAt = clock.now
        let bay = ScooterParking(id: "bay", provider: "lime", name: "Bay",
            latitude: 47.3769, longitude: 8.5417, mandatory: true)
        let api = StubScooterAPI(response: timedResponse(
            generatedAt: receivedAt.addingTimeInterval(-clockOffset), expiresIn: 600,
            parking: [bay], parkingExpiresIn: 180, clockOffset: clockOffset
        ))
        let model = makeModel(api: api, clock: clock)
        model.updateViewport(zurichRegion, zoom: 16)
        // At once, instead of the map's fetch, which first waits 180 ms of real time.
        model.refresh()
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        // Just generated: the bays stay and the dock reads Live.
        XCTAssertEqual(model.parking, [bay])
        XCTAssertEqual(model.lastUpdated, receivedAt)
        guard case let .summary(summary) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(summary.status(at: clock.now), .live)

        // The next request waits for the server's minute, not the ten seconds between retries.
        clock.advance(59)
        model.autoRefreshIfNeeded()
        await settle()
        let calls = await api.snapshot().calls
        XCTAssertEqual(calls, 1)
        clock.advance(1)
        model.autoRefreshIfNeeded()
        let refreshed = await waitUntil { await api.snapshot().calls == 2 && !model.isLoading }
        XCTAssertTrue(refreshed)

        // A failed refresh keeps the scooters while the server still has them fresh.
        await api.setFailure(.offline)
        clock.advance(60)
        model.autoRefreshIfNeeded()
        let failed = await waitUntil { await api.snapshot().calls == 3 && model.loadIssue != nil && !model.isLoading }
        XCTAssertTrue(failed)
        XCTAssertEqual(model.loadIssue, .refreshFailed(.offline, showing: receivedAt))
        XCTAssertEqual(model.mapScooters.count, 1)

        // The bays go when the server said they would.
        clock.advance(59)
        model.expireParkingIfNeeded()
        XCTAssertEqual(model.parking, [bay])
        clock.advance(2)
        model.expireParkingIfNeeded()
        XCTAssertTrue(model.parking.isEmpty)

        // So do the scooters, once a refresh after their expiry fails as well.
        clock.advance(420)
        model.autoRefreshIfNeeded()
        let expired = await waitUntil {
            await api.snapshot().calls == 4
                && model.loadIssue == .outOfDate(.offline, lastUpdate: receivedAt) && !model.isLoading
        }
        XCTAssertTrue(expired)
        XCTAssertTrue(model.mapScooters.isEmpty)
    }
}

// Provider health and the dock.
extension ScooterMapModelTests {
    func testSkiensWinterNoticeGivesWayWhenRydeBringsItsScootersBackInMarch() async throws {
        let clock = TestClock()
        clock.now = try XCTUnwrap(ISO8601DateFormatter().date(from: "2027-03-20T12:00:00Z"))
        let formatter = ISO8601DateFormatter()
        func response(_ vehicles: [Scooter]) -> ScooterResponse {
            ScooterResponse(vehicles: vehicles, meta: ScooterResponseMetadata(
                partial: false, failedSources: [], generatedAt: formatter.string(from: clock.now),
                refreshAfterSeconds: 60, expiresAt: formatter.string(from: clock.now.addingTimeInterval(300))
            ))
        }
        let api = StubScooterAPI(response: response([]))
        let model = makeModel(api: api, clock: clock)
        model.updateViewport(MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 59.2075, longitude: 9.6107),
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        ), zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        // Still in its pause, with nothing in view: since 15 December, until the streets are clear.
        let season = ScooterSeasonalPause.Active(city: "Skien", back: .clear(from: "12-15"))
        XCTAssertEqual(model.dockNotices, [.season(season)])

        // Ryde's scooters are back, even with Ryde filtered out: the notice gives way.
        await api.setResponse(response([scooter(id: "ryde", provider: "ryde", latitude: 59.2075, longitude: 9.6107)]))
        model.refresh()
        let back = await waitUntil { await api.snapshot().calls == 2 && !model.mapScooters.isEmpty && !model.isLoading }
        XCTAssertTrue(back)
        XCTAssertEqual(model.dockNotices, [])
        model.toggle(provider: .ryde)
        XCTAssertEqual(model.visibleCount, 0)
        XCTAssertEqual(model.dockNotices, [])
    }

    func testATownWhooshClosedIsOffSeasonUntilItsScootersAreBackButNotAlmatyWhereJetRuns() async throws {
        let clock = TestClock()
        clock.now = try XCTUnwrap(ISO8601DateFormatter().date(from: "2026-10-28T09:00:00Z"))
        let formatter = ISO8601DateFormatter()
        func response(_ vehicles: [Scooter], seasonOver: Set<String>) -> ScooterResponse {
            ScooterResponse(vehicles: vehicles, meta: ScooterResponseMetadata(
                partial: false, failedSources: [], generatedAt: formatter.string(from: clock.now),
                refreshAfterSeconds: 60, expiresAt: formatter.string(from: clock.now.addingTimeInterval(300)),
                seasonOver: seasonOver
            ))
        }
        // Whoosh closed these three on 24 October 2026: the answers name its feed in each.
        let towns = [
            (city: "Astana", feed: "kazakhstan:whoosh_kz_nqz", center: CLLocationCoordinate2D(latitude: 51.143975, longitude: 71.43581)),
            (city: "Zapopan", feed: "mexico:whoosh_mx_zap", center: CLLocationCoordinate2D(latitude: 20.721331, longitude: -103.391882)),
            (city: "Almaty", feed: "kazakhstan:whoosh_kz_ala", center: CLLocationCoordinate2D(latitude: 43.298812, longitude: 76.939435)),
        ]
        for town in towns {
            let api = StubScooterAPI(response: response([], seasonOver: [town.feed]))
            let model = makeModel(api: api, clock: clock)
            model.updateViewport(MKCoordinateRegion(
                center: town.center, span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
            ), zoom: 16)
            let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
            XCTAssertTrue(loaded, town.city)
            guard town.city != "Almaty" else {
                // Jet runs there besides Whoosh.
                XCTAssertEqual(model.dockNotices, [], town.city)
                continue
            }
            XCTAssertEqual(model.dockNotices, [.season(ScooterSeasonalPause.Active(city: town.city, back: .seasonOver))], town.city)

            // A scooter in view, even filtered out: the notice gives way.
            let whoosh = scooter(id: "whoosh", provider: "whoosh", latitude: town.center.latitude, longitude: town.center.longitude)
            await api.setResponse(response([whoosh], seasonOver: [town.feed]))
            model.refresh()
            let back = await waitUntil { await api.snapshot().calls == 2 && !model.mapScooters.isEmpty && !model.isLoading }
            XCTAssertTrue(back, town.city)
            XCTAssertEqual(model.dockNotices, [], town.city)
            model.toggle(provider: .whoosh)
            XCTAssertEqual(model.visibleCount, 0, town.city)
            XCTAssertEqual(model.dockNotices, [], town.city)
        }
    }

    func testDownProvidersAreNamedOnlyWhereTheyOperateAndLeadTheChips() async {
        let api = StubScooterAPI(response: ScooterResponse(
            vehicles: [
                scooter(id: "voi", provider: "voi"),
                scooter(id: "lime-one", provider: "lime"),
                scooter(id: "lime-two", provider: "lime")
            ],
            meta: ScooterResponseMetadata(
                partial: true,
                failedSources: ["bird_zurich", "pony_fr_angers", "city-overview"]
            )
        ))
        let model = makeModel(api: api)
        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        XCTAssertEqual(
            model.providerHealth,
            ScooterProviderHealth(downProviders: [.bird], hasUnknownFailures: true)
        )
        XCTAssertEqual(model.dockNotices, [.providersDown([.bird])])

        let chips = model.dockChips
        XCTAssertEqual(chips.prefix(3).map(\.provider), [.bird, .lime, .voi])
        XCTAssertEqual(chips.dropFirst(3).map(\.provider), [.bolt, .dott, .hopp, .publibike])
        XCTAssertEqual(chips.filter(\.isDown).map(\.provider), [.bird])
        XCTAssertEqual(chips[0].count, 0)
        XCTAssertFalse(chips[0].downLabel.isEmpty)
        XCTAssertEqual(chips[1].count, 2)

        // A chip that is down is never drawn as selected.
        model.showProviders([.bird, .lime])
        XCTAssertEqual(model.dockChips.filter(\.isSelected).map(\.provider), [.lime])
        XCTAssertEqual(model.dockChips.filter(\.isEnabled).map(\.provider), [.bird, .lime])

        // The filter sheet lists the same providers in catalogue order.
        XCTAssertEqual(model.filterProviders.map(\.provider), model.availableProviders)
        XCTAssertEqual(model.filterProviders.filter(\.isDown).map(\.provider), [.bird])
        XCTAssertEqual(model.filterProviders.filter(\.isEnabled).map(\.provider), [.bird, .lime])
    }

    /// Where one provider is the only one, the server answers its outage with an
    /// empty list and the failed feed, not with an error of its own.
    func testTheOnlyProviderOfACityBeingDownIsNamedInsteadOfBlamingScooters() async {
        let api = StubScooterAPI(response: ScooterResponse(
            vehicles: [],
            meta: ScooterResponseMetadata(partial: true, failedSources: ["france:dott_fr_lyon"])
        ))
        let model = makeModel(api: api)
        let lyon = MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 45.7578, longitude: 4.832),
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        )
        model.updateViewport(lyon, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        XCTAssertEqual(model.availableProviders, [.dott])
        XCTAssertNil(model.loadIssue)
        guard case let .summary(summary) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(summary.count, 0)
        XCTAssertNil(summary.refreshFailure)
        XCTAssertEqual(summary.notices, [.providersDown([.dott])])
        XCTAssertEqual(summary.chips.map(\.provider), [.dott])
        XCTAssertEqual(summary.chips.map(\.isDown), [true])
        XCTAssertEqual(model.filterProviders.map(\.isDown), [true])
        // The notice alone explains the empty map: no "Live", and no hint to look elsewhere.
        XCTAssertTrue(summary.everyProviderDown)
        XCTAssertNil(summary.status())
        XCTAssertNil(summary.hint)
    }

    func testProviderWithAFailedFeedAndScootersInViewIsNotReportedAsDown() async {
        let api = StubScooterAPI(response: ScooterResponse(
            vehicles: [scooter(id: "lime", provider: "lime", battery: 40)],
            meta: ScooterResponseMetadata(partial: true, failedSources: ["national:lime_winterthur"])
        ))
        let model = makeModel(api: api)
        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        XCTAssertEqual(model.providerHealth, .healthy)
        XCTAssertEqual(model.dockNotices, [])
        XCTAssertTrue(model.dockChips.allSatisfy { !$0.isDown })
        XCTAssertEqual(model.dockChips.first?.provider, .lime)

        // The rider's own filters hide Lime's scooter; they do not make Lime look down.
        model.setMinimumBattery(60)
        model.showProviders([.voi])
        XCTAssertEqual(model.count(for: .lime), 0)
        XCTAssertEqual(model.providerHealth, .healthy)
        XCTAssertEqual(model.dockNotices, [])
        XCTAssertTrue(model.filterProviders.allSatisfy { !$0.isDown })
    }

    func testCityTotalsNameNoProviderAsDown() async {
        let api = StubScooterAPI(response: ScooterResponse(
            vehicles: [],
            clusters: [ScooterCluster(id: "city:ch:zurich", latitude: 47.38, longitude: 8.54,
                count: 100, providers: ["lime": 100], city: "Zürich")],
            meta: ScooterResponseMetadata(partial: true,
                failedSources: ["national:bird_zurich", "france:dott_fr_lyon", "city-overview"],
                mode: "clusters", zoom: 8, overview: true, refreshAfterSeconds: 3_600)
        ))
        let model = makeModel(api: api)

        model.refresh()
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }

        XCTAssertTrue(loaded)
        // Bird operates in view and shows nothing, yet one failed city feed says little about a country.
        XCTAssertTrue(model.availableProviders.contains(.bird))
        XCTAssertEqual(model.count(for: .bird), 0)
        XCTAssertEqual(model.providerHealth, .healthy)
        XCTAssertEqual(model.dockNotices, [])
        XCTAssertTrue(model.dockChips.allSatisfy { !$0.isDown })
        XCTAssertTrue(model.filterProviders.allSatisfy { !$0.isDown })
        guard case let .summary(summary) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(summary.notices, [])
    }

    func testProvidersAreNotReportedAsDownWhereTheDataHasNotLoadedYet() async {
        let api = StubScooterAPI(response: ScooterResponse(
            vehicles: [scooter(id: "lime", provider: "lime")],
            meta: ScooterResponseMetadata(partial: true, failedSources: ["national:bird_zurich"])
        ))
        let model = makeModel(api: api)
        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        XCTAssertEqual(model.providerHealth.downProviders, [.bird])

        // Bern is covered too, but what failed around Zürich says nothing about it.
        model.viewport = GeoBounds(south: 46.94, west: 7.43, north: 46.96, east: 7.46)
        XCTAssertTrue(model.availableProviders.contains(.bird))
        XCTAssertEqual(model.providerHealth, .healthy)
        XCTAssertTrue(model.dockChips.allSatisfy { !$0.isDown })
    }

    func testNoProviderIsNamedAsDownWhereTheServerLeftOutLowBatteries() async {
        let api = StubScooterAPI(response: ScooterResponse(
            vehicles: [],
            clusters: [ScooterCluster(id: "13:4290:2868", latitude: 47.3769, longitude: 8.5417,
                count: 40, providers: ["lime": 40])],
            meta: ScooterResponseMetadata(partial: true,
                failedSources: ["national:bird_zurich", "city-overview"], mode: "clusters", zoom: 13)
        ))
        let model = makeModel(api: api)
        model.updateViewport(zurichRegion, zoom: 13)
        var loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        // Clusters count every scooter: Bird has none here, so it is down.
        XCTAssertEqual(
            model.providerHealth,
            ScooterProviderHealth(downProviders: [.bird], hasUnknownFailures: true)
        )

        // With a minimum, the server leaves the scooters under it out of the clusters,
        // which can no longer tell an absent provider from one whose scooters are low.
        model.setMinimumBattery(60)
        loaded = await waitUntil {
            let snapshot = await api.snapshot()
            return snapshot.calls == 2 && !model.isLoading
        }
        XCTAssertTrue(loaded)
        let clustered = await api.snapshot()
        XCTAssertEqual(clustered.lastMinimumBattery, 60)
        XCTAssertEqual(model.providerHealth, .healthy)
        XCTAssertEqual(model.dockNotices, [])
        XCTAssertTrue(model.dockChips.allSatisfy { !$0.isDown })
        XCTAssertTrue(model.filterProviders.allSatisfy { !$0.isDown })

        // At street level the app applies the minimum itself, so it knows again.
        await api.setResponse(ScooterResponse(
            vehicles: [scooter(id: "lime", provider: "lime", battery: 40)],
            meta: ScooterResponseMetadata(partial: true, failedSources: ["national:bird_zurich"])
        ))
        model.updateViewport(zurichRegion, zoom: 16)
        loaded = await waitUntil {
            let snapshot = await api.snapshot()
            return snapshot.calls == 3 && !model.isLoading
        }
        XCTAssertTrue(loaded)
        let street = await api.snapshot()
        XCTAssertEqual(street.lastMinimumBattery, 0)
        XCTAssertEqual(model.count(for: .lime), 0)
        XCTAssertEqual(model.providerHealth.downProviders, [.bird])
        XCTAssertEqual(model.dockChips.filter(\.isDown).map(\.provider), [.bird])
    }

    func testDockCountsScootersNearbyWhileTheOriginIsOnScreen() async throws {
        let origin = GeoPoint(latitude: 47.3769, longitude: 8.5417)
        let model = await loadedModel(vehicles: [scooter(id: "one", provider: "lime")], origin: origin)
        let lastUpdated = try XCTUnwrap(model.lastUpdated)

        guard case let .summary(nearby) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(nearby.count, 1)
        XCTAssertEqual(nearby.countContext, .nearby)
        XCTAssertEqual(nearby.countLabel, String(localized: "scooter nearby"))
        XCTAssertEqual(nearby.status(at: lastUpdated.addingTimeInterval(30)), .live)
        XCTAssertNil(nearby.hint)
        XCTAssertFalse(nearby.showsTryAgain)

        // A chosen place takes over as the origin, and this one is off screen.
        model.focusOnAddress(MapDestination(
            title: "Berlin",
            point: GeoPoint(latitude: 52.52, longitude: 13.405)
        ))
        guard case let .summary(elsewhere) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(elsewhere.countContext, .onThisMap)
        XCTAssertEqual(elsewhere.countLabel, String(localized: "scooter on this map"))

        model.clearAddressSearch()
        guard case let .summary(nearbyAgain) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(nearbyAgain.countContext, .nearby)

        model.userLocation = nil
        guard case let .summary(withoutOrigin) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(withoutOrigin.countContext, .onThisMap)
    }

    func testCityTotalsShowTheirOwnStatusAndHint() async {
        let api = StubScooterAPI(response: ScooterResponse(
            vehicles: [],
            clusters: [ScooterCluster(id: "city:ch:zurich", latitude: 47.38, longitude: 8.54,
                count: 100, providers: ["lime": 80, "bird": 20], city: "Zürich")],
            meta: ScooterResponseMetadata(partial: false, failedSources: [],
                mode: "clusters", zoom: 8, overview: true, refreshAfterSeconds: 3_600)
        ))
        let model = makeModel(api: api)

        model.refresh()
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }

        XCTAssertTrue(loaded)
        guard case let .summary(summary) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(summary.count, 100)
        XCTAssertEqual(summary.status(at: .distantFuture), .cityTotals)
        XCTAssertEqual(summary.hint, .tapCity)
        XCTAssertEqual(summary.chips.prefix(2).map(\.provider), [.lime, .bird])
    }

    func testDelayedCityTotalsSayTheyAreDelayed() async throws {
        let api = StubScooterAPI(response: ScooterResponse(
            vehicles: [],
            clusters: [ScooterCluster(id: "city:ch:zurich", latitude: 47.38, longitude: 8.54,
                count: 100, providers: ["lime": 100], city: "Zürich")],
            meta: ScooterResponseMetadata(partial: false, stale: true, failedSources: [],
                mode: "clusters", zoom: 8, overview: true, refreshAfterSeconds: 3_600)
        ))
        let model = makeModel(api: api)

        model.refresh()
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }

        XCTAssertTrue(loaded)
        let lastUpdated = try XCTUnwrap(model.lastUpdated)
        guard case let .summary(summary) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(summary.status(at: .distantFuture), .delayed(showing: lastUpdated))
        XCTAssertEqual(summary.hint, .tapCity)
    }

    func testDelayedDataSaysWhichTimeItShows() async throws {
        let api = StubScooterAPI(response: ScooterResponse(
            vehicles: [scooter(id: "one", provider: "lime")],
            meta: ScooterResponseMetadata(partial: false, stale: true, failedSources: [])
        ))
        let model = makeModel(api: api)

        model.refresh()
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }

        XCTAssertTrue(loaded)
        let lastUpdated = try XCTUnwrap(model.lastUpdated)
        guard case let .summary(summary) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(summary.status(at: lastUpdated), .live)
        XCTAssertEqual(
            summary.status(at: lastUpdated.addingTimeInterval(ScooterDockStatus.delayedAfter)),
            .delayed(showing: lastUpdated)
        )
        XCTAssertFalse(summary.showsTryAgain)
    }

    func testOutsideCoverageOffersTheThreeClosestCities() async {
        let api = StubScooterAPI(response: ScooterResponse(vehicles: []))
        let model = makeModel(api: api)

        model.updateViewport(lungernRegion, zoom: 14)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }

        XCTAssertTrue(loaded)
        XCTAssertTrue(model.availableProviders.isEmpty)
        guard case let .outsideCoverage(cities) = model.dock else {
            return XCTFail("Expected the outside-coverage card")
        }
        XCTAssertEqual(cities.map(\.city.name), ["Bern", "Wädenswil", "Zürich"])
        XCTAssertEqual(cities.map { Int(($0.distanceMeters / 1_000).rounded()) }, [57, 64, 73])
        XCTAssertEqual(cities, model.closestCities)

        // A chip flies to the city and makes it the place, so walking times
        // start there and not at the place without scooter data.
        model.focusOnCity(cities[1].city)
        XCTAssertEqual(model.focusRequest?.point, cities[1].city.center)
        XCTAssertEqual(model.searchedDestination, cities[1].city.destination)
        XCTAssertEqual(model.recentPlaces, [cities[1].city.destination])
    }

    func testFiltersThatHideEverythingReportWhatIsHidden() async {
        let api = StubScooterAPI(response: ScooterResponse(vehicles: [
            scooter(id: "lime-low", provider: "lime", battery: 40),
            scooter(id: "lime-high", provider: "lime", battery: 90),
            scooter(id: "bird", provider: "bird", battery: 70)
        ]))
        let model = makeModel(api: api)
        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        XCTAssertEqual(model.showResultsTitle, ScooterFiltering.showResultsTitle(count: 3))

        model.showProviders([.voi])
        XCTAssertEqual(model.dock, .filtersHideEverything(ScooterFilterSummary(
            hiddenCount: 3, providers: [.voi], minimumBattery: nil
        )))

        model.showProviders([.bird])
        model.setMinimumBattery(80)
        guard case let .filtersHideEverything(summary) = model.dock else {
            return XCTFail("Expected the hidden-by-filters card")
        }
        XCTAssertEqual(summary, ScooterFilterSummary(hiddenCount: 3, providers: [.bird], minimumBattery: 80))
        XCTAssertEqual(summary.parts.count, 2)
        XCTAssertEqual(model.showResultsTitle, ScooterFiltering.showResultsTitle(count: 0))

        model.resetFilters()
        guard case let .summary(all) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(all.count, 3)
        XCTAssertNil(all.hint)

        // A list the server cut short cannot say how many scooters are here.
        await api.setResponse(ScooterResponse(
            vehicles: [scooter(id: "lime", provider: "lime")],
            meta: ScooterResponseMetadata(partial: false, failedSources: [], truncated: true, totalVehicles: 4_000)
        ))
        model.refresh()
        let reloaded = await waitUntil { await api.snapshot().calls == 2 && model.responseMetadata?.truncated == true && !model.isLoading }
        XCTAssertTrue(reloaded)
        model.showProviders([.voi])
        XCTAssertEqual(model.dock, .filtersHideEverything(ScooterFilterSummary(
            hiddenCount: nil, providers: [.voi], minimumBattery: nil
        )))
    }

    func testClusteredBatteryFilterCannotCountWhatItHides() async {
        let cluster = ScooterCluster(id: "12:1:1", latitude: 47.3769, longitude: 8.5417,
            count: 10, providers: ["lime": 10])
        let meta = ScooterResponseMetadata(partial: false, failedSources: [], mode: "clusters", zoom: 12)
        let api = StubScooterAPI(response: ScooterResponse(vehicles: [], clusters: [cluster], meta: meta))
        let model = makeModel(api: api)
        model.updateViewport(zurichRegion, zoom: 12)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        XCTAssertEqual(model.visibleCount, 10)

        // Only the provider filter is active, so every scooter here is known.
        model.showProviders([.voi])
        XCTAssertEqual(model.dock, .filtersHideEverything(ScooterFilterSummary(
            hiddenCount: 10, providers: [.voi], minimumBattery: nil
        )))
        model.showAllProviders()

        await api.setResponse(ScooterResponse(vehicles: [], meta: meta))
        model.setMinimumBattery(80)
        let filtered = await waitUntil { await api.snapshot().calls == 2 && !model.isLoading }

        XCTAssertTrue(filtered)
        let summary = ScooterFilterSummary(hiddenCount: nil, providers: [], minimumBattery: 80)
        XCTAssertEqual(model.dock, .filtersHideEverything(summary))
        XCTAssertEqual(summary.title, String(localized: "No scooters match your filters here"))
        XCTAssertEqual(summary.showAllTitle, String(localized: "Show all"))
    }

    func testEmptyCoveredAreaSaysSoOnlyOnceItsDataHasLoaded() async {
        let api = StubScooterAPI(response: ScooterResponse(vehicles: []))
        let model = makeModel(api: api)
        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        guard case let .summary(empty) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(empty.count, 0)
        XCTAssertEqual(empty.hint, .emptyArea)
        XCTAssertEqual(empty.countContext, .onThisMap)
        XCTAssertFalse(empty.chips.isEmpty)

        // Filters that would hide nothing here are not blamed for the empty map.
        model.showProviders([.voi])
        guard case let .summary(filtered) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(filtered.hint, .emptyArea)
        model.showAllProviders()

        // Another covered area whose data has not arrived yet has no count to show.
        model.viewport = GeoBounds(south: 46.94, west: 7.43, north: 46.96, east: 7.46)
        XCTAssertEqual(model.dock, .finding(chips: model.dockChips))
        XCTAssertFalse(model.dockChips.isEmpty)
    }

    func testSelectingAParkingBayAndAScooterAreMutuallyExclusive() async throws {
        let bay = ScooterParking(id: "lime:bay", provider: "lime", name: "Bay",
            latitude: 47.3769, longitude: 8.5417, mandatory: false)
        let parked = scooter(id: "one", provider: "lime")
        let api = StubScooterAPI(response: ScooterResponse(vehicles: [parked], parking: [bay]))
        let model = makeModel(api: api)
        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        model.selectScooter(parked.id)
        XCTAssertEqual(model.dock, .scooter(parked))

        model.selectParking(bay.id)
        XCTAssertNil(model.selectedScooterID)
        XCTAssertEqual(model.selectedParking, bay)
        XCTAssertEqual(model.dock, .parking(bay))

        model.selectScooter(parked.id)
        XCTAssertNil(model.selectedParkingID)
        XCTAssertEqual(model.dock, .scooter(parked))

        model.selectParking(bay.id)
        model.clearSelection()
        XCTAssertNil(model.selectedParkingID)
        XCTAssertNil(model.selectedScooterID)
        guard case .summary = model.dock else { return XCTFail("Expected the dock summary") }

        // Without an origin the card shows the name alone.
        XCTAssertEqual(model.parkingSubtitle(for: bay), bay.name)
        XCTAssertNil(model.approximateWalkingMinutes(to: bay))
        model.userLocation = GeoPoint(latitude: 47.3779, longitude: 8.5417)
        XCTAssertEqual(model.approximateWalkingMinutes(to: bay), 2)
        XCTAssertTrue(model.parkingSubtitle(for: bay).hasPrefix(bay.name))
        XCTAssertNotEqual(model.parkingSubtitle(for: bay), bay.name)

        // A bay that leaves the map is no longer selected.
        model.selectParking(bay.id)
        model.toggle(provider: .lime)
        XCTAssertNil(model.selectedParkingID)
        XCTAssertNil(model.selectedParking)
    }

    func testWalkingTimesNameTheSearchedPlaceTheyStartFrom() async throws {
        let bay = ScooterParking(id: "lime:bay", provider: "lime", name: "Bay",
            latitude: 47.3769, longitude: 8.5417, mandatory: false)
        let parked = scooter(id: "one", provider: "lime")
        let api = StubScooterAPI(response: ScooterResponse(vehicles: [parked], parking: [bay]))
        let model = makeModel(api: api)
        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        XCTAssertNil(model.walkingSummary(for: parked), "No origin, no walking time")

        let origin = GeoPoint(latitude: 47.3779, longitude: 8.5417)
        model.userLocation = origin
        let distance = try XCTUnwrap(model.formattedDistance(for: parked))
        XCTAssertEqual(
            model.walkingSummary(for: parked),
            String(format: String(localized: "≈%1$lld min walk · %2$@"), Int64(2), distance)
        )

        // A searched place wins over the user's location and is named.
        let place = MapDestination(title: "Zürich HB", point: origin)
        model.searchedDestination = place
        XCTAssertEqual(
            model.walkingSummary(for: parked),
            String(format: String(localized: "≈%1$lld min walk from %2$@ · %3$@"), Int64(2), "Zürich HB", distance)
        )
        XCTAssertEqual(
            model.parkingSubtitle(for: bay),
            String(
                format: String(localized: "%1$@ · %2$@"),
                bay.name,
                String(format: String(localized: "≈%1$lld min walk from %2$@"), Int64(2), "Zürich HB")
            )
        )

        model.clearAddressSearch()
        XCTAssertEqual(
            model.walkingSummary(for: parked),
            String(format: String(localized: "≈%1$lld min walk · %2$@"), Int64(2), distance)
        )
    }

    func testNamesWrittenRightToLeftAreSetApartFromTheWalkAroundThem() async throws {
        let bay = ScooterParking(id: "lime:bay", provider: "lime", name: "נחלת בנימין 105",
            latitude: 47.3769, longitude: 8.5417, mandatory: false)
        let parked = scooter(id: "one", provider: "lime")
        let api = StubScooterAPI(response: ScooterResponse(vehicles: [parked], parking: [bay]))
        let model = makeModel(api: api)
        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        model.searchedDestination = MapDestination(title: "שדרות רוטשילד 22", point: GeoPoint(latitude: 47.3779, longitude: 8.5417))
        let distance = try XCTUnwrap(model.formattedDistance(for: parked))
        let place = "\u{2068}שדרות רוטשילד 22\u{2069}"
        XCTAssertEqual(
            model.walkingSummary(for: parked),
            String(format: String(localized: "≈%1$lld min walk from %2$@ · %3$@"), Int64(2), place, distance)
        )
        XCTAssertEqual(
            model.parkingSubtitle(for: bay),
            String(
                format: String(localized: "%1$@ · %2$@"),
                "\u{2068}נחלת בנימין 105\u{2069}",
                String(format: String(localized: "≈%1$lld min walk from %2$@"), Int64(2), place)
            )
        )
        // Names written left to right are left as they are.
        XCTAssertEqual("Zürich HB".isolated, "Zürich HB")
        XCTAssertEqual("Θεσσαλονίκη".isolated, "Θεσσαλονίκη")
        XCTAssertEqual("دبي مول".isolated, "\u{2068}دبي مول\u{2069}")
    }

    func testTheCardHeaderCentresTheScooterWithoutChangingTheZoom() async throws {
        let parked = scooter(id: "one", provider: "lime")
        let api = StubScooterAPI(response: ScooterResponse(vehicles: [parked]))
        let model = makeModel(api: api)
        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        model.focusOnScooter(parked)

        let request = try XCTUnwrap(model.focusRequest)
        XCTAssertEqual(request.point, GeoPoint(parked.coordinate))
        XCTAssertTrue(request.keepsZoom)
        XCTAssertEqual(model.selectedScooterID, parked.id)
        XCTAssertFalse(MapFocusRequest(point: request.point, token: 1).keepsZoom)
        XCTAssertFalse(MapFocusRequest.city(request.point, token: 1).keepsZoom)
    }

    func testACardReportsAFailedRefreshOrDelayedDataAndNothingWhenHealthy() async throws {
        let clock = TestClock()
        let api = StubScooterAPI(response: timedResponse(generatedAt: clock.now, expiresIn: 300))
        let model = makeModel(api: api, clock: clock)
        model.refresh()
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        let shownAt = try XCTUnwrap(model.lastUpdated)
        model.selectScooter(try XCTUnwrap(model.mapScooters.first?.id))
        XCTAssertNil(model.cardStatus)

        await api.setFailure(.offline)
        model.retryLoad()
        let failed = await waitUntil { await api.snapshot().calls == 2 && model.loadIssue != nil && !model.isLoading }
        XCTAssertTrue(failed)
        XCTAssertNotNil(model.selectedScooter, "The card stays open over data that is still valid")
        XCTAssertEqual(model.cardStatus, .offline(showing: shownAt))

        await api.setFailure(.httpStatus(503))
        model.retryLoad()
        let failedAgain = await waitUntil {
            await api.snapshot().calls == 3 && model.loadIssue == .refreshFailed(.unavailable, showing: shownAt) && !model.isLoading
        }
        XCTAssertTrue(failedAgain)
        XCTAssertEqual(model.cardStatus, .refreshFailed(showing: shownAt))

        await api.setFailure(nil)
        await api.setResponse(ScooterResponse(
            vehicles: [scooter(id: "one", provider: "lime")],
            meta: ScooterResponseMetadata(partial: false, stale: true, failedSources: [])
        ))
        model.retryLoad()
        let delayed = await waitUntil { await api.snapshot().calls == 4 && model.loadIssue == nil && !model.isLoading }
        XCTAssertTrue(delayed)
        let delayedAt = try XCTUnwrap(model.lastUpdated)
        XCTAssertNil(model.cardStatus, "Stale data is not called delayed while it is recent")
        clock.advance(ScooterDockStatus.delayedAfter)
        XCTAssertEqual(model.cardStatus, .delayed(showing: delayedAt))
    }

    func testACardThatOpensInTheDockIsAnnouncedAndTheCountIsNot() async throws {
        let clock = TestClock()
        let formatter = ISO8601DateFormatter()
        let bay = ScooterParking(id: "dott:bay", provider: "dott", name: "Rue Faidherbe",
            latitude: 47.3769, longitude: 8.5417, mandatory: true)
        let parked = scooter(id: "one", provider: "lime")
        let api = StubScooterAPI(response: ScooterResponse(
            vehicles: [parked],
            meta: ScooterResponseMetadata(
                partial: false,
                failedSources: [],
                generatedAt: formatter.string(from: clock.now),
                expiresAt: formatter.string(from: clock.now.addingTimeInterval(300))
            ),
            parking: [bay]
        ))
        let model = makeModel(api: api, clock: clock)
        XCTAssertNil(model.dockAnnouncement, "Finding scooters")

        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        XCTAssertNil(model.dockAnnouncement, "The count and its chips")

        // A scooter: whose it is, and the walk once there is an origin.
        let title = String(format: String(localized: "%@ scooter"), "Lime")
        model.selectScooter(parked.id)
        XCTAssertEqual(model.dockAnnouncement, title)
        model.userLocation = GeoPoint(latitude: 47.3779, longitude: 8.5417)
        let walk = try XCTUnwrap(model.walkingSummary(for: parked))
        XCTAssertEqual(model.dockAnnouncement, "\(title), \(walk)")

        // A bay: its name and the rule, which the callout no longer says.
        model.selectParking(bay.id)
        XCTAssertEqual(
            model.dockAnnouncement,
            "\(bay.bayTitle), \(model.parkingSubtitle(for: bay)). \(bay.notice)"
        )

        // The out-of-date card replaces the count unasked.
        model.clearSelection()
        await api.setFailure(.httpStatus(503))
        clock.advance(400)
        model.retryLoad()
        let expired = await waitUntil {
            guard await api.snapshot().calls == 2 else { return false }
            if case .outOfDate = model.loadIssue { return !model.isLoading }
            return false
        }
        XCTAssertTrue(expired)
        let outOfDate = try XCTUnwrap(model.dockAnnouncement)
        XCTAssertTrue(outOfDate.hasPrefix(String(localized: "These positions are out of date")))
        XCTAssertTrue(outOfDate.hasSuffix(ScooterLoadFailure.unavailable.message))
    }

    func testLocatingFromACardKeepsTheMapAndTheCard() async throws {
        let manager = StubLocationManager(status: .authorizedWhenInUse)
        let parked = scooter(id: "one", provider: "lime")
        let api = StubScooterAPI(response: ScooterResponse(vehicles: [parked]))
        let model = ScooterMapModel(
            api: api,
            locationManager: manager,
            defaults: isolatedDefaults()
        )
        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        model.selectScooter(parked.id)

        model.locateForWalkingTime()
        XCTAssertTrue(model.isLocating)
        model.locationManager(manager, didUpdateLocations: [CLLocation(
            coordinate: CLLocationCoordinate2D(latitude: 47.3779, longitude: 8.5417),
            altitude: 0,
            horizontalAccuracy: 25,
            verticalAccuracy: 10,
            timestamp: Date()
        )])

        XCTAssertFalse(model.isLocating)
        XCTAssertNil(model.focusRequest, "The map stays where it is")
        XCTAssertEqual(model.selectedScooterID, parked.id)
        XCTAssertNotNil(model.walkingSummary(for: parked))
        XCTAssertTrue(model.hasLocatedOnce)

        // Near me still moves the map.
        model.focusOnUser()
        XCTAssertEqual(model.focusRequest?.latitudinalMeters, ScooterMapModel.userFocusMeters)
    }
}

// Where scooters were last seen, while the server collects an app's map again.
extension ScooterMapModelTests {
    func testScootersLastSeenAreDrawnFadedFilteredAsTheOthersAndCountedNowhere() async throws {
        let clock = TestClock()
        let seenAt = clock.now.addingTimeInterval(-600)
        let api = StubScooterAPI(response: fillingResponse(
            vehicles: [scooter(id: "found", provider: "lime")],
            lastSeen: [
                scooter(id: "seen-bird", provider: "bird", battery: 80),
                scooter(id: "seen-low", provider: "lime", battery: 20),
                // Drawn as the others are wherever they are, but not in view to count.
                scooter(id: "seen-far", provider: "voi", latitude: 47.5, longitude: 8.7)
            ],
            seenAt: seenAt,
            generatedAt: clock.now
        ))
        let model = makeModel(api: api, clock: clock)
        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        XCTAssertEqual(model.mapScooters.map(\.id), ["lime:found"])
        XCTAssertEqual(Set(model.mapLastSeenScooters.map(\.id)), ["bird:seen-bird", "lime:seen-low", "voi:seen-far"])
        XCTAssertEqual(model.lastSeenAt, seenAt)
        XCTAssertEqual(model.visibleCount, 1, "The faded ones are counted nowhere")
        XCTAssertEqual(model.count(for: .bird), 0)
        XCTAssertEqual(model.visibleLastSeenCount, 2)

        let revision = model.mapLastSeenRevision
        model.showProviders([.lime])
        XCTAssertEqual(model.mapLastSeenScooters.map(\.id), ["lime:seen-low"])
        XCTAssertGreaterThan(model.mapLastSeenRevision, revision)
        model.setMinimumBattery(30)
        XCTAssertTrue(model.mapLastSeenScooters.isEmpty)
        XCTAssertEqual(model.visibleLastSeenCount, 0)
        model.resetFilters()
        XCTAssertEqual(model.mapLastSeenScooters.count, 3)

        // Data that expired and cannot be renewed goes, and the faded scooters with it.
        await api.setFailure(.httpStatus(503))
        clock.advance(301)
        model.autoRefreshIfNeeded()
        let expired = await waitUntil {
            guard await api.snapshot().calls == 2 else { return false }
            if case .outOfDate = model.loadIssue { return !model.isLoading }
            return false
        }
        XCTAssertTrue(expired)
        XCTAssertTrue(model.lastSeenVehicles.isEmpty)
        XCTAssertTrue(model.mapLastSeenScooters.isEmpty)
        XCTAssertEqual(model.visibleLastSeenCount, 0)
        XCTAssertNil(model.lastSeenAt)
    }

    func testGroupsLastSeenKeepTheProvidersShownAndGoWithTheGroupsWhenTheMinimumChanges() async throws {
        let api = StubScooterAPI(response: ScooterResponse(
            vehicles: [],
            clusters: [ScooterCluster(id: "13:4290:2868", latitude: 47.3769, longitude: 8.5417,
                count: 4, providers: ["lime": 4])],
            lastSeenClusters: [ScooterCluster(id: "seen:13:4290:2869", latitude: 47.377, longitude: 8.542,
                count: 12, providers: ["lime": 5, "bird": 7])],
            meta: ScooterResponseMetadata(partial: false, failedSources: [], mode: "clusters", zoom: 13,
                refreshAfterSeconds: 3, refreshing: true, lastSeenAt: "2026-10-12T10:00:00Z")
        ))
        let model = makeModel(api: api)
        model.updateViewport(zurichRegion, zoom: 13)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        XCTAssertEqual(model.mapLastSeenClusters.map(\.count), [12])
        XCTAssertEqual(model.visibleCount, 4)
        XCTAssertEqual(model.visibleLastSeenCount, 12)

        model.showProviders([.lime])
        XCTAssertEqual(model.mapLastSeenClusters.map(\.providers), [["lime": 5]])
        XCTAssertEqual(model.visibleLastSeenCount, 5)

        // The server leaves the scooters under the minimum out of its groups, faded or not: they are asked for again.
        model.setMinimumBattery(60)
        XCTAssertTrue(model.mapLastSeenClusters.isEmpty)
        XCTAssertEqual(model.visibleLastSeenCount, 0)
        let asked = await waitUntil { await api.snapshot().calls == 2 && !model.isLoading }
        XCTAssertTrue(asked)
        let snapshot = await api.snapshot()
        XCTAssertEqual(snapshot.lastMinimumBattery, 60)
    }

    func testAMapStillBeingCollectedIsAskedForSoonAfterEveryAnswerWithFadedScooters() async {
        let clock = TestClock()
        let api = StubScooterAPI(response: fillingResponse(
            lastSeen: [scooter(id: "seen", provider: "lime")],
            seenAt: clock.now,
            generatedAt: clock.now
        ))
        let model = makeModel(api: api, clock: clock)
        model.refresh()
        var answered = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(answered)

        // After the three seconds the server suggests, every time: its sweep replaces them as it goes.
        for call in 2 ... 3 {
            if call == 3 {
                // Still being collected, with nothing faded left.
                await api.setResponse(fillingResponse(lastSeen: [], seenAt: nil, generatedAt: clock.now))
            }
            clock.advance(2)
            model.autoRefreshIfNeeded()
            await settle()
            let calls = await api.snapshot().calls
            XCTAssertEqual(calls, call - 1, "Not before three seconds")
            clock.advance(1)
            model.autoRefreshIfNeeded()
            answered = await waitUntil { await api.snapshot().calls == call && !model.isLoading }
            XCTAssertTrue(answered, "Call \(call) three seconds after the one before")
        }

        // Once more soon was the follow-up already: the usual ten seconds now.
        clock.advance(3)
        model.autoRefreshIfNeeded()
        await settle()
        var calls = await api.snapshot().calls
        XCTAssertEqual(calls, 3)
        clock.advance(7)
        model.autoRefreshIfNeeded()
        answered = await waitUntil { await api.snapshot().calls == 4 && !model.isLoading }
        XCTAssertTrue(answered)
        calls = await api.snapshot().calls
        XCTAssertEqual(calls, 4)
    }

    func testOnlyFadedScootersInViewReadFindingScootersWithTheNightBanRatherThanAnEmptyMap() async throws {
        let clock = TestClock()
        // 23:30 in Oslo, during its night ban.
        clock.now = try XCTUnwrap(ISO8601DateFormatter().date(from: "2026-10-12T21:30:00Z"))
        let oslo = GeoPoint(latitude: 59.9139, longitude: 10.7522)
        let osloRegion = MKCoordinateRegion(
            center: oslo.coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        )
        let api = StubScooterAPI(response: fillingResponse(
            lastSeen: [scooter(id: "seen", provider: "voi", latitude: oslo.latitude, longitude: oslo.longitude)],
            seenAt: clock.now.addingTimeInterval(-900),
            generatedAt: clock.now
        ))
        let model = makeModel(api: api, clock: clock)
        model.updateViewport(osloRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        let curfew = try XCTUnwrap(RentalCurfew.active(at: model.viewport.center, on: clock.now))
        guard case let .finding(chips, notices) = model.dock else { return XCTFail("Expected Finding scooters…") }
        XCTAssertEqual(chips, model.dockChips)
        XCTAssertFalse(chips.isEmpty)
        XCTAssertEqual(notices.first, .curfew(curfew))
        XCTAssertEqual(model.dockLine(at: clock.now).title, String(localized: "Finding scooters…"))
        assertRenders(ScooterControlDock(model: model), "finding with a night ban")

        // The sweep reached it: a count, without the status of an update.
        await api.setResponse(ScooterResponse(
            vehicles: [scooter(id: "found", provider: "voi", latitude: oslo.latitude, longitude: oslo.longitude)],
            meta: ScooterResponseMetadata(partial: false, failedSources: [],
                generatedAt: ISO8601DateFormatter().string(from: clock.now))
        ))
        clock.advance(3)
        model.autoRefreshIfNeeded()
        let found = await waitUntil { await api.snapshot().calls == 2 && !model.isLoading }
        XCTAssertTrue(found)
        guard case let .summary(summary) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(summary.count, 1)
        XCTAssertNil(summary.lastSeenAt)
        XCTAssertEqual(summary.status(at: clock.now), .live)
    }

    func testFadedScootersBesideFoundOnesReadUpdatingRatherThanDelayedAndAFailureFirst() async throws {
        let clock = TestClock()
        let seenAt = clock.now.addingTimeInterval(-600)
        let api = StubScooterAPI(response: fillingResponse(
            vehicles: [scooter(id: "found", provider: "lime")],
            lastSeen: [scooter(id: "seen", provider: "bird")],
            seenAt: seenAt,
            generatedAt: clock.now,
            stale: true
        ))
        let model = makeModel(api: api, clock: clock)
        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        let shownAt = try XCTUnwrap(model.lastUpdated)

        guard case let .summary(summary) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(summary.count, 1)
        XCTAssertEqual(summary.status(at: clock.now), .updating(seenAt: seenAt))
        XCTAssertEqual(summary.status(at: clock.now)?.isUpdating, true)
        assertRenders(ScooterControlDock(model: model), "updating")
        // A card says nothing of a delay that the dock reports as an update.
        model.selectScooter("lime:found")
        XCTAssertNil(model.cardStatus)
        model.clearSelection()

        // With the faded ones hidden by the filters, the delay is said again, once the data is late.
        model.showProviders([.lime])
        guard case let .summary(filtered) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(filtered.status(at: clock.now), .live)
        XCTAssertEqual(
            filtered.status(at: shownAt.addingTimeInterval(ScooterDockStatus.delayedAfter)),
            .delayed(showing: shownAt)
        )
        model.resetFilters()

        // A failed refresh is said before anything else.
        await api.setFailure(.offline)
        clock.advance(3)
        model.autoRefreshIfNeeded()
        let failed = await waitUntil { await api.snapshot().calls == 2 && model.loadIssue != nil && !model.isLoading }
        XCTAssertTrue(failed)
        guard case let .summary(offline) = model.dock else { return XCTFail("Expected the dock summary") }
        XCTAssertEqual(offline.status(at: clock.now), .offline(showing: shownAt))
        XCTAssertEqual(model.cardStatus, .offline(showing: shownAt))
    }

    /// An answer while the server collects an app's map again: the scooters its
    /// sweep has found so far, and where it saw the others last time.
    private func fillingResponse(
        vehicles: [Scooter] = [],
        lastSeen: [Scooter],
        seenAt: Date?,
        generatedAt: Date,
        stale: Bool = false
    ) -> ScooterResponse {
        let formatter = ISO8601DateFormatter()
        return ScooterResponse(
            vehicles: vehicles,
            lastSeenVehicles: lastSeen,
            meta: ScooterResponseMetadata(
                partial: false,
                stale: stale,
                failedSources: [],
                generatedAt: formatter.string(from: generatedAt),
                refreshAfterSeconds: 3,
                refreshing: true,
                lastSeenAt: seenAt.map(formatter.string(from:)),
                expiresAt: formatter.string(from: generatedAt.addingTimeInterval(300))
            )
        )
    }
}

// Location, search, filters and settings.
extension ScooterMapModelTests {
    func testAnsweringTheLocationPromptSlowlyStillKeepsTheMapAndTheCard() async throws {
        let manager = StubLocationManager(status: .notDetermined)
        let parked = scooter(id: "one", provider: "lime")
        let api = StubScooterAPI(response: ScooterResponse(vehicles: [parked]))
        let model = ScooterMapModel(
            api: api,
            locationManager: manager,
            defaults: isolatedDefaults(),
            locationTimeout: .milliseconds(50)
        )
        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        model.selectScooter(parked.id)

        // The prompt stays open three times longer than a fix may take.
        model.locateForWalkingTime()
        try await Task.sleep(for: .milliseconds(150))
        XCTAssertTrue(model.isLocating)
        XCTAssertNil(model.locationIssue)

        manager.status = .authorizedWhenInUse
        model.locationManagerDidChangeAuthorization(manager)
        XCTAssertTrue(model.isLocating)
        model.locationManager(manager, didUpdateLocations: [zurichFix])

        XCTAssertFalse(model.isLocating)
        XCTAssertNil(model.focusRequest, "The map stays where it is")
        XCTAssertEqual(model.selectedScooterID, parked.id)
        XCTAssertNotNil(model.walkingSummary(for: parked))

        // Once allowed, a fix that does not come in time is still reported.
        let slowManager = StubLocationManager(status: .notDetermined)
        let slow = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: slowManager,
            defaults: isolatedDefaults(),
            locationTimeout: .milliseconds(50)
        )
        slow.focusOnUser()
        slowManager.status = .authorizedWhenInUse
        slow.locationManagerDidChangeAuthorization(slowManager)
        let timedOut = await waitUntil { slow.locationIssue == .notFound }
        XCTAssertTrue(timedOut)
        XCTAssertFalse(slow.isLocating)
    }

    func testLocatingWithoutAFixInTimeReportsNotFoundUntilDismissedOrRetried() async {
        let manager = StubLocationManager(status: .authorizedWhenInUse)
        let defaults = isolatedDefaults()
        let model = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: manager,
            defaults: defaults,
            locationTimeout: .milliseconds(50)
        )
        XCTAssertEqual(model.searchBarState, .empty)
        XCTAssertFalse(model.hasLocatedOnce)

        model.focusOnUser()
        XCTAssertTrue(model.isLocating)
        XCTAssertEqual(model.searchBarState, .locating)
        XCTAssertNil(model.locationIssue)

        let timedOut = await waitUntil { model.locationIssue == .notFound }
        XCTAssertTrue(timedOut)
        XCTAssertFalse(model.isLocating)
        XCTAssertFalse(model.hasLocatedOnce)

        model.dismissLocationIssue()
        XCTAssertNil(model.locationIssue)

        // The next attempt starts clean and brings the card back if it fails again.
        model.focusOnUser()
        XCTAssertNil(model.locationIssue)
        let timedOutAgain = await waitUntil { model.locationIssue == .notFound }
        XCTAssertTrue(timedOutAgain)

        model.locationManager(manager, didUpdateLocations: [CLLocation(
            coordinate: CLLocationCoordinate2D(latitude: 47.3769, longitude: 8.5417),
            altitude: 0,
            horizontalAccuracy: 25,
            verticalAccuracy: 10,
            timestamp: Date()
        )])

        XCTAssertNil(model.locationIssue)
        XCTAssertTrue(model.hasLocatedOnce)
        XCTAssertTrue(defaults.bool(forKey: "has-located-once"))
        XCTAssertEqual(model.focusRequest?.latitudinalMeters, 350)
        XCTAssertEqual(model.focusRequest?.longitudinalMeters, 350)
        // Located: the bar is a search field again, and the map has the dot.
        XCTAssertEqual(model.searchBarState, .empty)
        XCTAssertNotNil(model.userLocation)

        let restored = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: StubLocationManager(status: .denied),
            defaults: defaults
        )
        XCTAssertTrue(restored.hasLocatedOnce)
    }

    func testAPlaceChosenWhileTheFixWasOnItsWayKeepsTheMap() throws {
        let manager = StubLocationManager(status: .authorizedWhenInUse)
        let model = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: manager,
            defaults: isolatedDefaults()
        )
        let place = MapDestination(title: "Bern", point: GeoPoint(latitude: 46.948, longitude: 7.4474))
        let viewport = model.viewport

        model.focusOnUser()
        XCTAssertTrue(model.isLocating)
        model.focusOnAddress(place)
        let placeFocus = try XCTUnwrap(model.focusRequest)
        model.locationManager(manager, didUpdateLocations: [zurichFix])

        // The position is known from now on, and nothing moved.
        XCTAssertEqual(model.focusRequest, placeFocus)
        XCTAssertEqual(model.viewport, viewport)
        XCTAssertEqual(model.searchBarState, .place(place))
        XCTAssertEqual(model.activeOrigin, .searchedDestination(place))
        XCTAssertFalse(model.isLocating)
        XCTAssertTrue(model.hasLocatedOnce)
        XCTAssertEqual(model.userLocation, GeoPoint(zurichFix.coordinate))

        model.clearAddressSearch()
        XCTAssertEqual(model.searchBarState, .empty)

        // Near me is a new wish and moves the map again.
        model.focusOnUser()
        XCTAssertEqual(model.focusRequest?.point, GeoPoint(zurichFix.coordinate))
    }

    func testAFixThatArrivesAfterNotFoundLeavesAPlaceOrCityChosenMeanwhile() async throws {
        for choosesCity in [false, true] {
            let manager = StubLocationManager(status: .authorizedWhenInUse)
            let model = ScooterMapModel(
                api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
                locationManager: manager,
                defaults: isolatedDefaults(),
                locationTimeout: .milliseconds(50)
            )
            let bern = try XCTUnwrap(ScooterCityCatalog.cities.first { $0.id == "ch:bern" })
            let place = MapDestination(title: "Bundesplatz", point: GeoPoint(latitude: 46.9471, longitude: 7.4441))

            model.focusOnUser()
            let timedOut = await waitUntil { model.locationIssue == .notFound }
            XCTAssertTrue(timedOut)

            // A searched place, or a chip under "Closest cities".
            if choosesCity {
                model.focusOnCity(bern)
            } else {
                model.focusOnAddress(place)
            }
            let chosenFocus = try XCTUnwrap(model.focusRequest)
            let viewport = model.viewport
            model.locationManager(manager, didUpdateLocations: [zurichFix])

            XCTAssertEqual(model.focusRequest, chosenFocus, "city: \(choosesCity)")
            XCTAssertEqual(model.viewport, viewport)
            XCTAssertEqual(model.searchBarState, .place(choosesCity ? bern.destination : place))
            XCTAssertNil(model.locationIssue)
            XCTAssertTrue(model.hasLocatedOnce)

            model.clearAddressSearch()
            XCTAssertEqual(model.searchBarState, .empty)
        }
    }

    func testRefusedLocationShowsADismissibleCardUntilTheNextAttempt() {
        let manager = StubLocationManager(status: .denied)
        let model = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: manager,
            defaults: isolatedDefaults()
        )

        // Opening the app is not a locate attempt, so nothing is shown.
        model.start()
        model.locationManagerDidChangeAuthorization(manager)
        XCTAssertNil(model.locationIssue)

        model.focusOnUser()
        XCTAssertEqual(model.locationIssue, .denied)
        XCTAssertFalse(model.isLocating)
        XCTAssertEqual(model.searchBarState, .empty)

        model.dismissLocationIssue()
        XCTAssertNil(model.locationIssue)
        model.locationManagerDidChangeAuthorization(manager)
        XCTAssertNil(model.locationIssue, "An unchanged status is not a new attempt")

        model.focusOnUser()
        XCTAssertEqual(model.locationIssue, .denied)

        let restricted = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: StubLocationManager(status: .restricted),
            defaults: isolatedDefaults()
        )
        restricted.focusOnUser()
        XCTAssertEqual(restricted.locationIssue, .restricted)
    }

    func testRecentPlacesKeepTheLastThreeForThisSessionOnly() throws {
        let suiteName = "ScootRadarTests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defaults.removePersistentDomain(forName: suiteName)
        let model = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: CLLocationManager(),
            defaults: defaults
        )
        let places = ["Zürich HB", "Bellevue", "Paradeplatz", "Stauffacher"].enumerated().map { index, title in
            MapDestination(
                title: title,
                subtitle: "Zürich",
                point: GeoPoint(latitude: 47.37 + Double(index) / 1_000, longitude: 8.54)
            )
        }
        XCTAssertTrue(model.recentPlaces.isEmpty)

        for place in places {
            model.focusOnAddress(place)
        }
        XCTAssertEqual(model.recentPlaces, [places[3], places[2], places[1]])
        XCTAssertEqual(model.searchBarState, .place(places[3]))

        // Choosing a recent place again moves it to the front without repeating it.
        model.focusOnAddress(places[2])
        XCTAssertEqual(model.recentPlaces, [places[2], places[3], places[1]])

        // Clearing the place keeps the list for the rest of the session.
        model.clearAddressSearch()
        XCTAssertEqual(model.searchBarState, .empty)
        XCTAssertEqual(model.recentPlaces.count, 3)

        let stored = defaults.persistentDomain(forName: suiteName) ?? [:]
        XCTAssertFalse(String(describing: stored).contains("Paradeplatz"))
        XCTAssertFalse(String(describing: stored).contains("47.37"))
        let nextSession = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: CLLocationManager(),
            defaults: defaults
        )
        XCTAssertTrue(nextSession.recentPlaces.isEmpty)
        defaults.removePersistentDomain(forName: suiteName)
    }

    func testCitiesWithScootersAreTheSixNearestToTheMapCentre() throws {
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))

        let cities = model.nearbyCities
        XCTAssertEqual(
            cities.map(\.city.name),
            ["Wädenswil", "Bern", "Zürich", "Uster", "Opfikon", "Kloten"]
        )
        XCTAssertEqual(cities.map(\.distanceMeters), cities.map(\.distanceMeters).sorted())

        // A chip behaves like choosing that city as a place, and shows the whole city.
        let bern = cities[1].city
        model.chooseCity(bern)

        let place = try XCTUnwrap(model.searchedDestination)
        XCTAssertEqual(place, bern.destination)
        XCTAssertEqual(place.title, "Bern")
        XCTAssertEqual(place.kind, .city)
        XCTAssertEqual(model.activeOrigin, .searchedDestination(place))
        XCTAssertEqual(model.recentPlaces, [place])
        let focus = try XCTUnwrap(model.focusRequest)
        XCTAssertEqual(focus, .city(bern.center, token: focus.token))
        XCTAssertGreaterThan(focus.latitudinalMeters, 8_000)

        // The list follows the map.
        model.viewport = GeoBounds(south: 47.37, west: 8.53, north: 47.38, east: 8.55)
        XCTAssertEqual(model.nearbyCities.first?.city.name, "Zürich")
        XCTAssertEqual(model.nearbyCities.count, 6)
    }

    func testTheAddressSearchGetsTheMapCentreRoundedOnlyWhenACityOrLessIsShown() {
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))
        let paris = MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 48.85837, longitude: 2.29448),
            span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
        )

        // Zoomed out to a region or a country, the map centre says little about what is meant.
        model.updateViewport(paris, zoom: 10, zoomLevel: 9.9)
        XCTAssertNil(model.searchNear)

        // A city or less: the centre, rounded to about a kilometre.
        model.updateViewport(paris, zoom: 10, zoomLevel: 10)
        XCTAssertEqual(model.searchNear, GeoPoint(latitude: 48.86, longitude: 2.29))
        model.updateViewport(paris, zoom: 17, zoomLevel: 16.4)
        XCTAssertEqual(model.searchNear, GeoPoint(latitude: 48.86, longitude: 2.29))
    }

    func testATypedCoveredCityShowsTheWholeCityLikeItsChip() throws {
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))
        let locarno = try XCTUnwrap(ScooterCityCatalog.cities.first { $0.id == "ch:locarno" })

        // What the address search answers for "Locarno": the catalogue's centre.
        let answer = Data("""
        [{"lat": \(locarno.center.latitude), "lng": \(locarno.center.longitude),
          "display_name": "Locarno, Switzerland", "title": "Locarno", "subtitle": "Svizzera", "covered": true}]
        """.utf8)
        let typed = try XCTUnwrap(JSONDecoder().decode([AddressSearchResult].self, from: answer).first)
        XCTAssertEqual(typed.destination.kind, .city)
        XCTAssertEqual(typed.destination.subtitle, "Svizzera")

        model.focusOnAddress(typed.destination)
        let typedFocus = try XCTUnwrap(model.focusRequest)
        XCTAssertEqual(model.searchedDestination?.title, "Locarno")

        // The same span as the "Cities with scooters" chip.
        model.chooseCity(locarno)
        let chipFocus = try XCTUnwrap(model.focusRequest)
        XCTAssertEqual(typedFocus, .city(locarno.center, token: typedFocus.token))
        XCTAssertEqual(typedFocus.latitudinalMeters, chipFocus.latitudinalMeters)
        XCTAssertEqual(typedFocus.longitudinalMeters, chipFocus.longitudinalMeters)

        // An address, a station or a place in the city keeps the street-level view.
        let station = AddressSearchResult(
            latitude: locarno.center.latitude + 0.002, longitude: locarno.center.longitude,
            displayName: "Locarno, stazione", title: "Locarno, stazione", subtitle: "Treno", isCovered: true
        )
        XCTAssertEqual(station.destination.kind, .address)
        model.focusOnAddress(station.destination)
        XCTAssertEqual(model.focusRequest?.latitudinalMeters, 850)
        XCTAssertNil(ScooterCityCatalog.city(centredAt: GeoPoint(latitude: 46.7741, longitude: 8.1558)))
    }

    func testStoredBatteryValuesSnapDownToAPreset() {
        for (stored, expected) in [(45, 30.0), (95, 80.0), (60, 60.0), (10, 0.0), (-5, 0.0)] {
            let defaults = isolatedDefaults()
            defaults.set(stored, forKey: "minimum-battery")

            let model = ScooterMapModel(
                api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
                locationManager: CLLocationManager(),
                defaults: defaults
            )

            XCTAssertEqual(model.minimumBattery, expected, "Stored \(stored)")
        }
    }

    func testPassesListProvidersHereOrWithAPassAndEveryProviderOtherwise() {
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))
        model.viewport = GeoBounds(region: zurichRegion)
        XCTAssertEqual(model.passProviders, ScooterProviderCoverage.swissProviders)

        model.setRidePass(ProviderRidePass(enabled: true, freeMinutes: 10), for: .pony)
        XCTAssertEqual(
            model.passProviders,
            ScooterProvider.allCases.filter { ScooterProviderCoverage.swissProviders.contains($0) || $0 == .pony }
        )

        // Nobody operates here and no pass is set: every provider is offered.
        model.setRidePass(ProviderRidePass(), for: .pony)
        model.viewport = GeoBounds(region: lungernRegion)
        XCTAssertEqual(model.passProviders, ScooterProvider.allCases)

        model.setRidePass(ProviderRidePass(enabled: true, freeUnlock: true), for: .voi)
        XCTAssertEqual(model.passProviders, [.voi])
    }
}

extension ScooterMapModelTests {
    private var zurichRegion: MKCoordinateRegion {
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 47.3769, longitude: 8.5417),
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        )
    }

    /// A good first fix in Zürich.
    private var zurichFix: CLLocation {
        CLLocation(
            coordinate: CLLocationCoordinate2D(latitude: 47.3769, longitude: 8.5417),
            altitude: 0,
            horizontalAccuracy: 25,
            verticalAccuracy: 10,
            timestamp: Date()
        )
    }

    /// Lungern has no scooter operator; Bern, Wädenswil and Zürich are the closest covered cities.
    private var lungernRegion: MKCoordinateRegion {
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 46.7741, longitude: 8.1558),
            span: MKCoordinateSpan(latitudeDelta: 0.02, longitudeDelta: 0.02)
        )
    }

    /// Without the cities' zones, as makeModel(api:).
    private func makeModel(api: any ScooterAPIClient, clock: TestClock) -> ScooterMapModel {
        ScooterMapModel(
            api: api,
            locationManager: CLLocationManager(),
            defaults: isolatedDefaults(),
            now: { clock.now },
            builtInZones: []
        )
    }

    private func timedResponse(
        generatedAt: Date,
        expiresIn: TimeInterval,
        parking: [ScooterParking] = [],
        parkingExpiresIn: TimeInterval? = nil,
        clockOffset: TimeInterval = 0
    ) -> ScooterResponse {
        let formatter = ISO8601DateFormatter()
        return ScooterResponse(
            vehicles: [scooter(id: "one", provider: "lime")],
            meta: ScooterResponseMetadata(
                partial: false,
                failedSources: [],
                generatedAt: formatter.string(from: generatedAt),
                refreshAfterSeconds: 60,
                expiresAt: formatter.string(from: generatedAt.addingTimeInterval(expiresIn)),
                parkingExpiresAt: parkingExpiresIn.map {
                    formatter.string(from: generatedAt.addingTimeInterval($0))
                }
            ),
            parking: parking,
            clockOffset: clockOffset
        )
    }

    /// Long enough for a refresh that was going to start to have reached the API.
    private func settle() async {
        try? await Task.sleep(for: .milliseconds(60))
    }
}

// The views of the main states. Nothing is compared: each state is built and
// drawn once, so a view that traps on some state fails here.
extension ScooterMapModelTests {
    func testMainStatesOfTheDockRenderWithoutCrashing() async throws {
        let origin = GeoPoint(latitude: 47.3779, longitude: 8.5417)
        let bay = ScooterParking(id: "dott:bay", provider: "dott", name: "Rue Faidherbe",
            latitude: 47.3769, longitude: 8.5417, mandatory: true)
        let priced = Scooter(
            provider: "lime", latitude: 47.3769, longitude: 8.5417, battery: 82, rangeMeters: 24_000,
            vehicleID: "priced", deepLink: nil,
            rentalURIs: ScooterRentalURIs(ios: "https://li.me/ride", android: nil, web: nil),
            distanceMeters: 0,
            pricing: ScooterRidePricing(currency: "CHF", unlockFeeMinorUnits: 100, minuteFeeMinorUnits: 35)
        )
        let clock = TestClock()
        let formatter = ISO8601DateFormatter()
        let api = StubScooterAPI(response: ScooterResponse(
            vehicles: [priced, scooter(id: "bare", provider: "bird", battery: nil)],
            meta: ScooterResponseMetadata(
                partial: true,
                failedSources: ["national:voi_zurich"],
                generatedAt: formatter.string(from: clock.now),
                truncated: true,
                totalVehicles: 5_412,
                parkingStatus: "stale",
                expiresAt: formatter.string(from: clock.now.addingTimeInterval(300))
            ),
            parking: [bay]
        ))
        let model = makeModel(api: api, clock: clock)

        guard case .finding = model.dock else { return XCTFail("Expected the first load") }
        assertRenders(ScooterControlDock(model: model), "finding")

        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        guard case .summary = model.dock else { return XCTFail("Expected the summary") }
        assertRenders(ScooterControlDock(model: model), "summary with notices")

        // The scooter card: without an origin and without a price, then with everything.
        model.selectScooter("bird:bare")
        guard case .scooter = model.dock else { return XCTFail("Expected the scooter card") }
        assertRenders(ScooterControlDock(model: model), "scooter without origin, price or link")
        model.userLocation = origin
        model.setRidePass(ProviderRidePass(enabled: true, freeUnlock: true, freeMinutes: 5), for: .lime)
        model.selectScooter("lime:priced")
        assertRenders(ScooterControlDock(model: model), "scooter with a pass")
        model.searchedDestination = MapDestination(title: "Zürich HB", point: origin)
        assertRenders(ScooterControlDock(model: model), "scooter from a place")
        model.searchedDestination = nil

        model.selectParking(bay.id)
        guard case .parking = model.dock else { return XCTFail("Expected the bay card") }
        assertRenders(ScooterControlDock(model: model), "parking bay")

        // One provider chosen: its chip is the selected one, with its count.
        model.clearSelection()
        model.showProviders([.lime])
        guard case let .summary(chosen) = model.dock else { return XCTFail("Expected the summary") }
        XCTAssertEqual(chosen.chips.filter(\.isSelected).map(\.provider), [.lime])
        assertRenders(ScooterControlDock(model: model), "summary with a provider chosen")

        // Filters that hide everything.
        model.showProviders([.pony])
        guard case .filtersHideEverything = model.dock else { return XCTFail("Expected the filters card") }
        assertRenders(ScooterControlDock(model: model), "filters hide everything")
        model.resetFilters()
        model.selectParking(bay.id)

        // A failed refresh: in the dock, and at the top of a card.
        await api.setFailure(.offline)
        model.retryLoad()
        let refreshFailed = await waitUntil { await api.snapshot().calls == 2 && model.loadIssue != nil && !model.isLoading }
        XCTAssertTrue(refreshFailed)
        assertRenders(ScooterControlDock(model: model), "parking bay while offline")
        model.clearSelection()
        assertRenders(ScooterControlDock(model: model), "refresh failed")

        // Out of date: the data expired and the refresh after that failed.
        clock.advance(400)
        model.retryLoad()
        let expired = await waitUntil {
            guard await api.snapshot().calls == 3 else { return false }
            if case .outOfDate = model.loadIssue { return !model.isLoading }
            return false
        }
        XCTAssertTrue(expired)
        guard case .outOfDate = model.dock else { return XCTFail("Expected the out-of-date card") }
        assertRenders(ScooterControlDock(model: model), "out of date")

        // Outside coverage.
        let outsideAPI = StubScooterAPI(response: ScooterResponse(vehicles: []))
        let outside = makeModel(api: outsideAPI)
        outside.updateViewport(lungernRegion, zoom: 14)
        let outsideLoaded = await waitUntil { await outsideAPI.snapshot().calls == 1 && outside.lastUpdated != nil && !outside.isLoading }
        XCTAssertTrue(outsideLoaded)
        guard case .outsideCoverage = outside.dock else { return XCTFail("Expected the coverage card") }
        assertRenders(ScooterControlDock(model: outside), "outside coverage")

        // A first load that failed.
        let failing = StubScooterAPI(response: ScooterResponse(vehicles: []))
        await failing.setFailure(.httpStatus(503))
        let waiting = makeModel(api: failing)
        waiting.refresh()
        let failed = await waitUntil { await failing.snapshot().calls == 1 && waiting.loadIssue != nil && !waiting.isLoading }
        XCTAssertTrue(failed)
        guard case .waiting = waiting.dock else { return XCTFail("Expected the waiting dock") }
        assertRenders(ScooterControlDock(model: waiting), "waiting")
    }

    /// With very large text a card can be taller than the room above the dock
    /// and scrolls. Opening one in a dock already on screen froze the app. A
    /// screen that kept updating itself would freeze it as surely: the card
    /// updates the map a few times as it opens, and then nothing moves.
    func testATallCardOpensOnTheMapScreenWithVeryLargeText() async throws {
        let tall = Scooter(
            provider: "publibike", latitude: 47.3769, longitude: 8.5417, battery: 82, rangeMeters: 24_000,
            vehicleID: "tall", deepLink: nil,
            rentalURIs: ScooterRentalURIs(ios: "https://publibike.ch/ride", android: nil, web: nil),
            distanceMeters: 0,
            pricing: ScooterRidePricing(currency: "CHF", unlockFeeMinorUnits: 100, minuteFeeMinorUnits: 35)
        )
        let api = StubScooterAPI(response: ScooterResponse(vehicles: [tall]))
        let model = makeModel(api: api)
        model.userLocation = GeoPoint(latitude: 47.3779, longitude: 8.5417)
        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        let scene = try XCTUnwrap(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.rootViewController = UIHostingController(
            rootView: ScooterMapScreen(model: model).environment(\.dynamicTypeSize, .accessibility3)
        )
        window.isHidden = false
        defer { window.isHidden = true }
        window.layoutIfNeeded()
        try await Task.sleep(for: .milliseconds(600))
        guard case .summary = model.dock else { return XCTFail("Expected the summary") }
        func map(in view: UIView) -> MKMapView? {
            (view as? MKMapView) ?? view.subviews.lazy.compactMap(map(in:)).first
        }
        let mapView = try XCTUnwrap(map(in: window))
        let coordinator = try XCTUnwrap(mapView.delegate as? ScooterMapView.Coordinator)

        let watchdog = MainThreadWatchdog("The map screen froze while a tall card opened with very large text")
        defer { watchdog.cancel() }
        let before = (updates: coordinator.updates, regionChanges: coordinator.regionChanges)
        model.selectScooter("publibike:tall")
        try await Task.sleep(for: .seconds(1))
        guard case .scooter = model.dock else { return XCTFail("Expected the scooter card") }

        // A few updates as the card opens; 3 on iOS 27, none of them moving the map.
        let opened = (updates: coordinator.updates, regionChanges: coordinator.regionChanges)
        XCTAssertLessThanOrEqual(opened.updates - before.updates, 10, "Updates of the map as the card opened")
        XCTAssertLessThanOrEqual(opened.regionChanges - before.regionChanges, 1, "Moves of the map as the card opened")

        // Then a second at rest: the dock keeps its height and the map its place. A
        // timer of the model's may fire in it on a runner that stalled, never more.
        var dockTops: Set<CGFloat?> = [coordinator.parent.bottomChromeTop]
        for _ in 0..<20 {
            try await Task.sleep(for: .milliseconds(50))
            dockTops.insert(coordinator.parent.bottomChromeTop)
        }
        XCTAssertLessThanOrEqual(coordinator.updates - opened.updates, 2, "Updates of the map once the card was open")
        XCTAssertLessThanOrEqual(coordinator.regionChanges - opened.regionChanges, 0, "Moves of the map once the card was open")
        XCTAssertLessThanOrEqual(dockTops.count, 1, "Heights of the dock once the card was open: \(dockTops)")
    }

    func testMapOpensSlightlyTiltedAndKeepsItsTiltWhenTheAppMovesIt() throws {
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))
        let window = try window(showing: ScooterMapScreen(model: model))
        defer { window.isHidden = true }
        func map(in view: UIView) -> MKMapView? {
            (view as? MKMapView) ?? view.subviews.lazy.compactMap(map(in:)).first
        }
        let mapView = try XCTUnwrap(map(in: window))

        // By the least MapKit keeps: a smaller tilt is flat again after a zoom.
        XCTAssertEqual(mapView.camera.pitch, 20, accuracy: 0.1)
        XCTAssertTrue(mapView.isPitchEnabled)

        ScooterMapCameraPolicy.setRegionPreservingPerspective(zurichRegion, on: mapView, animated: false)
        XCTAssertEqual(mapView.camera.pitch, 20, accuracy: 0.1)

        // As it keeps the one two fingers give it.
        let tilted = mapView.camera.copy() as! MKMapCamera
        tilted.pitch = 30
        mapView.setCamera(tilted, animated: false)
        ScooterMapCameraPolicy.setRegionPreservingPerspective(zurichRegion, on: mapView, animated: false)
        XCTAssertEqual(mapView.camera.pitch, 30, accuracy: 0.1)
    }

    /// The appearance is the window's, so a sheet over the screen has it too.
    func testChosenAppearanceIsThatOfTheWholeWindow() async throws {
        let clock = TestClock()
        // Night in Switzerland, where the map opens.
        clock.now = try XCTUnwrap(ISO8601DateFormatter().date(from: "2026-10-24T23:00:00+02:00"))
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])), clock: clock)
        let window = try window(showing: ScooterMapScreen(model: model))
        defer { window.isHidden = true }
        let night = await waitUntil { window.overrideUserInterfaceStyle == .dark }
        XCTAssertTrue(night)

        model.appearance = .light
        let light = await waitUntil { window.overrideUserInterfaceStyle == .light }
        XCTAssertTrue(light)

        model.appearance = .dark
        let dark = await waitUntil { window.overrideUserInterfaceStyle == .dark }
        XCTAssertTrue(dark)

        // System gives the choice back to the iPhone.
        model.appearance = .system
        let system = await waitUntil { window.overrideUserInterfaceStyle == .unspecified }
        XCTAssertTrue(system)
    }

    /// The layout of a window `width` points across, from either layout.
    private func layouts(
        width: CGFloat,
        regularWidth: Bool = true,
        regularHeight: Bool = true,
        largeText: Bool = false
    ) -> [ScooterChromeLayout] {
        [ScooterChromeLayout.dock, .panel].map {
            ScooterChromeLayout.resolve(
                width: width,
                regularWidth: regularWidth,
                regularHeight: regularHeight,
                largeText: largeText,
                current: $0
            )
        }
    }

    func testEveryPhoneKeepsItsDockUprightAndSideways() {
        for largeText in [false, true] {
            // Upright an iPhone is compact across; the widest is 440 pt.
            for width: CGFloat in [320, 375, 390, 393, 402, 414, 428, 430, 440] {
                XCTAssertEqual(
                    layouts(width: width, regularWidth: false, largeText: largeText), [.dock, .dock], "\(width)"
                )
                // However it is described, it is narrower than a panel and a map.
                XCTAssertEqual(layouts(width: width, largeText: largeText), [.dock, .dock], "\(width)")
            }
            // Sideways it is compact up and down, the larger ones regular across.
            for width: CGFloat in [568, 667, 736, 812, 844, 852, 874, 896, 926, 932, 956] {
                XCTAssertEqual(
                    layouts(width: width, regularWidth: false, regularHeight: false, largeText: largeText),
                    [.dock, .dock],
                    "\(width)"
                )
                XCTAssertEqual(
                    layouts(width: width, regularHeight: false, largeText: largeText), [.dock, .dock], "\(width)"
                )
            }
        }
    }

    func testTheDuoKeepsItsDockOnItsCoverAndUprightInside() {
        // The cover upright and sideways, the inner display upright, and with
        // its bar down the side: too narrow whatever the size classes say.
        for width: CGFloat in [466, 678, 330, 669] {
            for largeText in [false, true] {
                XCTAssertEqual(layouts(width: width, largeText: largeText), [.dock, .dock], "\(width)")
                XCTAssertEqual(
                    layouts(width: width, regularWidth: false, largeText: largeText), [.dock, .dock], "\(width)"
                )
            }
        }
    }

    func testTheOpenDuoShowsThePanel() {
        // 951 pt across, less its 60 pt bar down the side.
        XCTAssertEqual(layouts(width: 891), [.panel, .panel])
        XCTAssertEqual(layouts(width: 891, largeText: true), [.panel, .panel])
    }

    func testAnIPadShowsThePanelWhenTheMapStillHasRoomBesideIt() {
        // iPad mini upright keeps the dock, even turned from sideways.
        XCTAssertEqual(layouts(width: 744), [.dock, .dock])
        XCTAssertEqual(layouts(width: 744, largeText: true), [.dock, .dock])
        for width: CGFloat in [820, 1032, 1180, 1376] {
            XCTAssertEqual(layouts(width: width), [.panel, .panel], "\(width)")
            XCTAssertEqual(layouts(width: width, largeText: true), [.panel, .panel], "\(width)")
        }
        // A window compact one way or the other has the dock, however wide.
        XCTAssertEqual(layouts(width: 1376, regularWidth: false), [.dock, .dock])
        XCTAssertEqual(layouts(width: 1376, regularHeight: false), [.dock, .dock])
    }

    func testAWindowResizedAcrossTheThresholdDoesNotFlipBackAndForth() {
        // A 380 pt panel and 380 pt of map: the panel opens with 20 pt to
        // spare, and stays until the map would get less than 380.
        XCTAssertEqual(layouts(width: 779), [.dock, .panel])
        XCTAssertEqual(layouts(width: 780), [.panel, .panel])
        XCTAssertEqual(layouts(width: 760), [.dock, .panel])
        XCTAssertEqual(layouts(width: 759), [.dock, .dock])

        // With very large text the panel is 420 pt.
        XCTAssertEqual(ScooterChromeLayout.panelWidth(largeText: false), 380)
        XCTAssertEqual(ScooterChromeLayout.panelWidth(largeText: true), 420)
        XCTAssertEqual(layouts(width: 819, largeText: true), [.dock, .panel])
        XCTAssertEqual(layouts(width: 820, largeText: true), [.panel, .panel])
        XCTAssertEqual(layouts(width: 800, largeText: true), [.dock, .panel])
        XCTAssertEqual(layouts(width: 799, largeText: true), [.dock, .dock])
    }

    /// Apple's logo and Legal link sit in the map's leading margin, which a
    /// panel moves past itself; on a phone the margins are MapKit's.
    func testAPanelMovesTheMapsLeadingMarginPastItAndAPhoneLeavesItAlone() async throws {
        func map(in view: UIView) -> MKMapView? {
            (view as? MKMapView) ?? view.subviews.lazy.compactMap(map(in:)).first
        }

        let phone = try window(showing: ScooterMapScreen(
            model: makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))
        ))
        defer { phone.isHidden = true }
        let phoneMap = try XCTUnwrap(map(in: phone))
        let resting = phoneMap.directionalLayoutMargins
        try await Task.sleep(for: .milliseconds(300))
        XCTAssertEqual(phoneMap.directionalLayoutMargins, resting)
        XCTAssertLessThan(phoneMap.directionalLayoutMargins.leading, 100)

        let scene = try XCTUnwrap(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let large = UIWindow(windowScene: scene)
        large.frame = CGRect(x: 0, y: 0, width: 1376, height: 1032)
        large.rootViewController = UIHostingController(
            rootView: ScooterMapScreen(model: makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: []))))
                .environment(\.horizontalSizeClass, .regular)
                .environment(\.verticalSizeClass, .regular)
        )
        large.isHidden = false
        defer { large.isHidden = true }
        large.layoutIfNeeded()
        let largeMap = try XCTUnwrap(map(in: large))
        // 16 pt from the edge, 380 pt of panel, and 16 pt to spare.
        let moved = await waitUntil { largeMap.directionalLayoutMargins.leading >= 16 + 380 + 16 }
        XCTAssertTrue(moved, "\(largeMap.directionalLayoutMargins)")
    }

    /// A window of the size of a phone with the view on screen in it.
    private func window(showing view: some View) throws -> UIWindow {
        let scene = try XCTUnwrap(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.rootViewController = UIHostingController(rootView: view)
        window.isHidden = false
        window.layoutIfNeeded()
        return window
    }

    func testTopOfTheMapRendersWithoutCrashing() {
        let covered = MapDestination(title: "Zürich HB", point: GeoPoint(latitude: 47.3782, longitude: 8.5402))
        let uncovered = MapDestination(
            title: "Paradeplatz",
            subtitle: "Lungern OW",
            point: GeoPoint(latitude: 46.7741, longitude: 8.1558)
        )
        for state in [ScooterSearchBarState.empty, .place(covered), .place(uncovered), .locating] {
            assertRenders(
                ScooterSearchIsland(
                    state: state,
                    isSearching: .constant(false),
                    hasActiveFilters: state == .locating,
                    onSelect: { _ in },
                    onClear: {},
                    onUseCurrentLocation: {},
                    onShowFilters: {},
                    onShowSettings: {}
                ),
                "search bar: \(state.title)"
            )
        }

        for failure in ScooterLoadFailure.allCases {
            assertRenders(
                MapStatusBanner(message: failure.message, actionTitle: String(localized: "Try again"), action: {}),
                "banner: \(failure.rawValue)"
            )
        }

        // German has the longest reasons and the longest button.
        if let german = Bundle.main.path(forResource: "de", ofType: "lproj").flatMap(Bundle.init(path:)) {
            for failure in ScooterLoadFailure.allCases {
                assertRenders(
                    MapStatusBanner(
                        message: german.localizedString(forKey: failure.message, value: nil, table: nil),
                        actionTitle: german.localizedString(forKey: "Try again", value: nil, table: nil),
                        action: {}
                    ),
                    "German banner: \(failure.rawValue)"
                )
            }
        }

        for issue in [ScooterLocationIssue.denied, .restricted, .notFound] {
            assertRenders(
                LocationIssueCard(issue: issue, onOpenSettings: {}, onSearchPlace: {}, onRetry: {}, onDismiss: {}),
                "location card: \(issue)"
            )
        }

        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))
        assertRenders(FloatingMapControls(model: model), "Near me")
    }

    /// Draws the view off screen in light appearance at the standard text
    /// size, in dark appearance with very large text, and on a narrow phone at
    /// the largest size before the layouts for very large text take over; then
    /// at both ends of the widths an iPad gives it, in a window narrower than
    /// any phone and on a wide one.
    private func assertRenders(
        _ view: some View,
        _ name: String,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        let passes: [(ColorScheme, DynamicTypeSize, CGFloat)] = [
            (.light, .large, 390), (.dark, .accessibility3, 390), (.light, .xxxLarge, 375),
            (.light, .large, 320), (.dark, .accessibility3, 320), (.light, .large, 466), (.dark, .accessibility3, 466)
        ]
        for (scheme, size, width) in passes {
            let renderer = ImageRenderer(
                content: view
                    .frame(width: width)
                    .environment(\.colorScheme, scheme)
                    .environment(\.dynamicTypeSize, size)
            )
            let image = renderer.uiImage
            XCTAssertGreaterThan(image?.size.height ?? 0, 0, "\(name), \(scheme), \(size)", file: file, line: line)
        }
    }

    /// Beside its button a long reason was cut after three lines as soon as the
    /// text was larger than standard.
    func testTheLoadFailedBannerShowsItsWholeSentenceAtEveryTextSize() throws {
        let german = try XCTUnwrap(Bundle.main.path(forResource: "de", ofType: "lproj").flatMap(Bundle.init(path:)))
        let sentence = german.localizedString(
            forKey: "ScootRadar is busy right now. Try again in a moment.", value: nil, table: nil
        )
        let button = german.localizedString(forKey: "Try again", value: nil, table: nil)
        XCTAssertTrue(sentence.hasPrefix("ScootRadar ist"), sentence)

        // A 375 pt phone leaves the banner 351 pt.
        func height(_ message: String, _ size: DynamicTypeSize) -> CGFloat {
            ImageRenderer(
                content: MapStatusBanner(message: message, actionTitle: button, action: {})
                    .frame(width: 351)
                    .environment(\.dynamicTypeSize, size)
            ).uiImage?.size.height ?? 0
        }

        let standard = height(sentence, .large)
        XCTAssertGreaterThan(standard, height("Kurz.", .large), "Three lines beside the button")
        for size in [DynamicTypeSize.xLarge, .xxLarge, .xxxLarge, .accessibility3] {
            XCTAssertGreaterThan(height(sentence, size), standard, "\(size)")
        }
        // Nothing caps the lines: twice the text is taller at every size.
        for size in DynamicTypeSize.allCases {
            XCTAssertGreaterThan(height("\(sentence) \(sentence)", size), height(sentence, size), "\(size)")
        }
    }
}

extension ScooterMapModelTests {
    func testALinkToACityOpensItLikeTheSearchAndTheFirstFixLeavesTheMapThere() throws {
        let bern = try XCTUnwrap(ScooterCityCatalog.cities.first { $0.id == "ch:bern" })
        let link = ScooterMapLink(origin: GeoPoint(latitude: bern.center.latitude, longitude: bern.center.longitude))
        // The link may open the app before it starts locating, or after.
        for linkFirst in [true, false] {
            let manager = StubLocationManager(status: .authorizedWhenInUse)
            let model = ScooterMapModel(
                api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
                locationManager: manager,
                defaults: isolatedDefaults()
            )
            if linkFirst {
                model.open(link)
                model.start()
            } else {
                model.start()
                model.open(link)
            }
            let linkedFocus = try XCTUnwrap(model.focusRequest)
            XCTAssertEqual(linkedFocus.point, bern.center, "link first: \(linkFirst)")
            XCTAssertEqual(model.searchBarState, .place(bern.destination), "link first: \(linkFirst)")

            model.locationManager(manager, didUpdateLocations: [zurichFix])
            XCTAssertEqual(model.focusRequest, linkedFocus, "link first: \(linkFirst)")
            XCTAssertEqual(model.userLocation, GeoPoint(zurichFix.coordinate))
            XCTAssertEqual(model.activeOrigin, .searchedDestination(bern.destination))
        }
    }

    func testALinkToAnyOtherPointMovesTheMapWithoutChoosingAPlace() throws {
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))
        let point = GeoPoint(latitude: 46.2, longitude: 6.15)
        model.open(ScooterMapLink(origin: point, minimumBattery: 60))
        let focus = try XCTUnwrap(model.focusRequest)
        XCTAssertEqual(focus.point, point)
        XCTAssertFalse(focus.keepsZoom)
        XCTAssertNil(model.searchedDestination)
        XCTAssertEqual(model.minimumBattery, 60)
    }

    func testALinkWithoutAPlaceKeepsTheMapWhereItIs() {
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))
        model.open(ScooterMapLink())
        XCTAssertNil(model.focusRequest)
        XCTAssertEqual(model.minimumBattery, 0)
    }
}

// The panel of a large window: its list of providers, its fold and the line it
// folds down to.
extension ScooterMapModelTests {
    func testTheFoldedPanelSaysInOneLineWhatTheDockShows() async throws {
        let origin = GeoPoint(latitude: 47.3779, longitude: 8.5417)
        let bay = ScooterParking(id: "dott:bay", provider: "dott", name: "Rue Faidherbe",
            latitude: 47.3769, longitude: 8.5417, mandatory: true)
        let clock = TestClock()
        let formatter = ISO8601DateFormatter()
        let api = StubScooterAPI(response: ScooterResponse(
            vehicles: [scooter(id: "near", provider: "bird"), scooter(id: "far", provider: "lime", latitude: 47.3795)],
            meta: ScooterResponseMetadata(
                partial: false,
                failedSources: [],
                generatedAt: formatter.string(from: clock.now),
                expiresAt: formatter.string(from: clock.now.addingTimeInterval(300))
            ),
            parking: [bay]
        ))
        let model = makeModel(api: api, clock: clock)

        XCTAssertEqual(
            model.dockLine(at: clock.now),
            ScooterDockLine(mark: .progress, title: String(localized: "Finding scooters…"))
        )

        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        // With no one to walk from, the count, and how fresh it is. The map
        // is beside the line: it doesn't say "on this map".
        guard case let .summary(counted) = model.dock else { return XCTFail("Expected the summary") }
        XCTAssertNil(counted.lead)
        XCTAssertEqual(
            model.dockLine(at: clock.now),
            ScooterDockLine(mark: .symbol("scooter"), title: "2 \(String(localized: "scooters"))", status: .live)
        )

        // From the rider, the nearest scooter: how far, whose, the walk, and
        // "Live", which the dock leaves out beside it.
        model.userLocation = origin
        guard case let .summary(summary) = model.dock, let nearest = summary.lead else {
            return XCTFail("Expected the nearest scooter")
        }
        XCTAssertEqual(nearest.scooter.id, "bird:near")
        let minutes = String(format: String(localized: "%lld min"), Int64(nearest.minutes))
        let lead = model.dockLine(at: clock.now)
        XCTAssertEqual(
            lead,
            ScooterDockLine(mark: .provider(.bird), title: nearest.distance, details: ["Bird", minutes], status: .live)
        )
        XCTAssertEqual(lead.parts, [nearest.distance, "Bird", minutes, String(localized: "Live")])
        XCTAssertEqual(
            lead.accessibilityLabel,
            "\(nearest.distance), Bird, \(minutes), \(String(localized: "Live"))"
        )

        // The status ages with the data, and says so in fewer words than the dock.
        let later = model.dockLine(at: clock.now.addingTimeInterval(180))
        XCTAssertEqual(later.status, .updatedMinutesAgo(3))
        XCTAssertEqual(later.parts.last, String(format: String(localized: "%lld min ago"), Int64(3)))

        // A scooter's card: whose it is, the walk to it and how far it is,
        // each a part of its own.
        model.selectScooter("bird:near")
        guard case let .scooter(selected) = model.dock else { return XCTFail("Expected the scooter card") }
        let walk = String(
            format: String(localized: "≈%lld min walk"),
            Int64(try XCTUnwrap(model.approximateWalkingMinutes(to: selected)))
        )
        XCTAssertEqual(
            model.dockLine(at: clock.now),
            ScooterDockLine(
                mark: .provider(.bird),
                title: "Bird",
                details: [walk, try XCTUnwrap(model.formattedDistance(for: selected))]
            )
        )

        // A bay's card: the bay, where it is and the walk to it.
        model.selectParking(bay.id)
        let bayWalk = String(
            format: String(localized: "≈%lld min walk"),
            Int64(try XCTUnwrap(model.approximateWalkingMinutes(to: bay)))
        )
        XCTAssertEqual(
            model.dockLine(at: clock.now),
            ScooterDockLine(mark: .provider(.dott), title: bay.bayTitle, details: [bay.name, bayWalk])
        )

        // Filters that hide everything: how many, and which filters.
        model.clearSelection()
        model.showProviders([.pony])
        guard case let .filtersHideEverything(filters) = model.dock else { return XCTFail("Expected the filters card") }
        XCTAssertEqual(
            model.dockLine(at: clock.now),
            ScooterDockLine(mark: .symbol("line.3.horizontal.decrease"), title: filters.title, details: [filters.body])
        )
        model.resetFilters()

        // A failed refresh is said in the warning colour, at the end of the line.
        await api.setFailure(.offline)
        model.retryLoad()
        let refreshFailed = await waitUntil { await api.snapshot().calls == 2 && model.loadIssue != nil && !model.isLoading }
        XCTAssertTrue(refreshFailed)
        let offline = model.dockLine(at: clock.now)
        XCTAssertEqual(offline.title, nearest.distance)
        XCTAssertEqual(offline.status?.isWarning, true)

        // Out of date: the data expired and the refresh after that failed.
        clock.advance(400)
        model.retryLoad()
        let expired = await waitUntil {
            guard await api.snapshot().calls == 3 else { return false }
            if case .outOfDate = model.loadIssue { return !model.isLoading }
            return false
        }
        XCTAssertTrue(expired)
        XCTAssertEqual(
            model.dockLine(at: clock.now),
            ScooterDockLine(mark: .symbol("clock"), title: String(localized: "These positions are out of date"), isWarning: true)
        )

        let outsideAPI = StubScooterAPI(response: ScooterResponse(vehicles: []))
        let outside = makeModel(api: outsideAPI)
        outside.updateViewport(lungernRegion, zoom: 14)
        let outsideLoaded = await waitUntil { await outsideAPI.snapshot().calls == 1 && outside.lastUpdated != nil && !outside.isLoading }
        XCTAssertTrue(outsideLoaded)
        XCTAssertEqual(
            outside.dockLine(at: .now),
            ScooterDockLine(mark: .symbol("map"), title: String(localized: "No scooter data here yet"))
        )

        let failing = StubScooterAPI(response: ScooterResponse(vehicles: []))
        await failing.setFailure(.httpStatus(503))
        let waiting = makeModel(api: failing)
        waiting.refresh()
        let failed = await waitUntil { await failing.snapshot().calls == 1 && waiting.loadIssue != nil && !waiting.isLoading }
        XCTAssertTrue(failed)
        XCTAssertEqual(
            waiting.dockLine(at: .now),
            ScooterDockLine(mark: .symbol("hourglass"), title: String(localized: "Waiting for scooter data"))
        )
    }

    /// The card of what is chosen on the map opens in the panel, so choosing
    /// opens a folded panel. Nothing else does: the rider folded it.
    func testChoosingAScooterOrABayUnfoldsThePanelAndNothingElseDoes() async throws {
        let bay = ScooterParking(id: "dott:bay", provider: "dott", name: "Rue Faidherbe",
            latitude: 47.3769, longitude: 8.5417, mandatory: true)
        let api = StubScooterAPI(response: ScooterResponse(
            vehicles: [scooter(id: "one", provider: "lime"), scooter(id: "two", provider: "bird")],
            parking: [bay]
        ))
        let model = makeModel(api: api)
        XCTAssertFalse(model.isPanelCollapsed)
        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        model.isPanelCollapsed = true
        model.showProviders([.lime])
        model.showAllProviders()
        model.refresh()
        let refreshed = await waitUntil { await api.snapshot().calls == 2 && !model.isLoading }
        XCTAssertTrue(refreshed)
        model.clearSelection()
        XCTAssertTrue(model.isPanelCollapsed)

        model.selectScooter("lime:one")
        XCTAssertFalse(model.isPanelCollapsed)

        // Folded with a card open, the panel stays folded as the card closes,
        // and opens for the next scooter.
        model.isPanelCollapsed = true
        model.selectScooter(nil)
        XCTAssertTrue(model.isPanelCollapsed)
        model.selectScooter("bird:two")
        XCTAssertFalse(model.isPanelCollapsed)

        model.isPanelCollapsed = true
        model.selectParking(bay.id)
        XCTAssertFalse(model.isPanelCollapsed)
        model.isPanelCollapsed = true
        model.clearSelection()
        XCTAssertTrue(model.isPanelCollapsed)
    }

    /// The map keeps clear of the panel by its leading margin, which a fold
    /// leaves as it is: what was in the middle of the map stays there.
    func testFoldingThePanelLeavesTheMapWhereItIs() async throws {
        func map(in view: UIView) -> MKMapView? {
            (view as? MKMapView) ?? view.subviews.lazy.compactMap(map(in:)).first
        }
        let model = makeModel(api: StubScooterAPI(response: ScooterResponse(vehicles: [])))
        let scene = try XCTUnwrap(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let large = UIWindow(windowScene: scene)
        large.frame = CGRect(x: 0, y: 0, width: 1376, height: 1032)
        large.rootViewController = UIHostingController(
            rootView: ScooterMapScreen(model: model)
                .environment(\.horizontalSizeClass, .regular)
                .environment(\.verticalSizeClass, .regular)
        )
        large.isHidden = false
        defer { large.isHidden = true }
        large.layoutIfNeeded()
        let mapView = try XCTUnwrap(map(in: large))
        let besidePanel = await waitUntil { mapView.directionalLayoutMargins.leading >= 16 + 380 + 16 }
        XCTAssertTrue(besidePanel, "\(mapView.directionalLayoutMargins)")
        try await Task.sleep(for: .milliseconds(300))
        let margins = mapView.directionalLayoutMargins
        let centre = mapView.centerCoordinate

        for folded in [true, false] {
            model.isPanelCollapsed = folded
            try await Task.sleep(for: .milliseconds(600))
            XCTAssertEqual(mapView.directionalLayoutMargins, margins, "folded: \(folded)")
            XCTAssertEqual(mapView.centerCoordinate.latitude, centre.latitude, accuracy: 1e-9, "folded: \(folded)")
            XCTAssertEqual(mapView.centerCoordinate.longitude, centre.longitude, accuracy: 1e-9, "folded: \(folded)")
        }
    }

    func testThePanelsProviderListAndItsFoldRenderWithoutCrashing() async throws {
        let origin = GeoPoint(latitude: 47.3779, longitude: 8.5417)
        let clock = TestClock()
        let formatter = ISO8601DateFormatter()
        let api = StubScooterAPI(response: ScooterResponse(
            vehicles: [scooter(id: "near", provider: "bird"), scooter(id: "far", provider: "lime", latitude: 47.3795)],
            // Voi operates in Zürich and its feed failed: its row is drawn as down.
            meta: ScooterResponseMetadata(
                partial: true,
                failedSources: ["national:voi_zurich"],
                generatedAt: formatter.string(from: clock.now),
                expiresAt: formatter.string(from: clock.now.addingTimeInterval(300))
            )
        ))
        let model = makeModel(api: api, clock: clock)
        assertPanelRenders(model, "finding")

        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        guard case let .summary(summary) = model.dock else { return XCTFail("Expected the summary") }
        XCTAssertTrue(summary.chips.contains { $0.provider == .voi && $0.isDown })
        let open = assertPanelRenders(model, "summary with its list of providers")

        // A row of 44 pt at least for "All providers" and for each provider,
        // where the chips of a phone's dock make one row.
        let rows = CGFloat(summary.chips.count + 1)
        XCTAssertGreaterThanOrEqual(open[0], rows * 44, "\(summary.chips.count) providers")
        let phone = ImageRenderer(content: ScooterControlDock(model: model).frame(width: 380)).uiImage?.size.height ?? 0
        XCTAssertGreaterThan(open[0], phone + (rows - 2) * 44)

        // Folded, the card keeps one line and its grabber.
        model.isPanelCollapsed = true
        let folded = assertPanelRenders(model, "folded summary")
        XCTAssertLessThanOrEqual(folded[0], 80)
        for (folded, open) in zip(folded, open) {
            XCTAssertLessThan(folded, open)
        }

        model.userLocation = origin
        assertPanelRenders(model, "folded nearest scooter")
        model.showProviders([.lime])
        model.isPanelCollapsed = false
        assertPanelRenders(model, "summary with a provider chosen")
        model.showAllProviders()

        model.selectScooter("bird:near")
        XCTAssertFalse(model.isPanelCollapsed)
        assertPanelRenders(model, "scooter card")
        model.isPanelCollapsed = true
        assertPanelRenders(model, "folded scooter card")
        model.clearSelection()

        model.showProviders([.pony])
        assertPanelRenders(model, "folded, filters hide everything")
        model.resetFilters()

        clock.advance(400)
        await api.setFailure(.offline)
        model.retryLoad()
        let expired = await waitUntil {
            guard await api.snapshot().calls == 2 else { return false }
            if case .outOfDate = model.loadIssue { return !model.isLoading }
            return false
        }
        XCTAssertTrue(expired)
        assertPanelRenders(model, "folded, out of date")
    }

    /// The usual lines, the count, the nearest scooter and a scooter's card,
    /// fit one line of the 380 pt panel at the standard text size in every
    /// language, the longest included, with data an hour old. With the
    /// largest text, in the 420 pt panel, they wrap between their parts.
    func testTheUsualFoldedLinesFitOneLineOfThePanelInEveryLanguage() throws {
        defer { ScooterLanguage.current = .atLaunch }
        func height(of line: ScooterDockLine, width: CGFloat, size: DynamicTypeSize = .large) -> CGFloat {
            let renderer = ImageRenderer(
                content: FoldedDockLine(line: line)
                    .frame(width: width)
                    .environment(\.dynamicTypeSize, size)
            )
            return renderer.uiImage?.size.height ?? 0
        }
        // The panel inside the card's padding.
        let width: CGFloat = 380 - 32
        let oneLine = height(of: ScooterDockLine(mark: .symbol("scooter"), title: "1"), width: width)
        XCTAssertGreaterThan(oneLine, 0)
        // A line too long for the panel is drawn taller.
        let tooLong = ScooterDockLine(mark: .symbol("scooter"), title: "1", details: Array(repeating: "≈12 min walk", count: 5))
        XCTAssertGreaterThan(height(of: tooLong, width: width), oneLine)

        for language in ScooterLanguage.allCases {
            ScooterLanguage.current = language
            let count = 3_784.formatted(.number.locale(language.locale))
            let minutes = String(format: String(localized: "%lld min"), Int64(12))
            let walk = String(format: String(localized: "≈%lld min walk"), Int64(12))
            let lines = [
                ScooterDockLine(
                    mark: .symbol("scooter"),
                    title: "\(count) \(String(localized: "scooters"))",
                    status: .updatedMinutesAgo(59)
                ),
                ScooterDockLine(
                    mark: .provider(.publibike),
                    title: "950 m",
                    details: ["PubliBike", minutes],
                    status: .updatedMinutesAgo(59)
                ),
                ScooterDockLine(mark: .provider(.publibike), title: "PubliBike", details: [walk, "950 m"]),
            ]
            for line in lines {
                XCTAssertEqual(height(of: line, width: width), oneLine, accuracy: 1, "\(language): \(line.parts)")
                XCTAssertGreaterThan(
                    height(of: line, width: 420 - 32, size: .accessibility5), oneLine, "\(language): \(line.parts)"
                )
            }
        }
    }

    /// The line wraps as a paragraph does, but between its parts: "6 min ago"
    /// goes whole to the next row rather than leave "6" at the end of the first.
    func testTheFoldedLineWrapsBetweenItsPartsAndNeverInsideOne() {
        let row: CGFloat = 20
        func frames(_ widths: [CGFloat], in width: CGFloat) -> [CGRect] {
            PartsFlow.frames(
                of: widths.map { CGSize(width: $0, height: row) },
                in: width,
                spacing: 4,
                wrapped: { index, width in CGSize(width: width, height: row * (widths[index] / width).rounded(.up)) }
            )
        }

        // Side by side while they fit, with a space between.
        XCTAssertEqual(frames([100, 50, 80], in: 300), [
            CGRect(x: 0, y: 0, width: 100, height: row),
            CGRect(x: 104, y: 0, width: 50, height: row),
            CGRect(x: 158, y: 0, width: 80, height: row),
        ])
        // The part that doesn't fit the rest of the row starts the next one, whole.
        XCTAssertEqual(frames([100, 50, 150], in: 300), [
            CGRect(x: 0, y: 0, width: 100, height: row),
            CGRect(x: 104, y: 0, width: 50, height: row),
            CGRect(x: 0, y: row, width: 150, height: row),
        ])
        // Only a part wider than a row wraps, in rows of its own.
        XCTAssertEqual(frames([100, 450, 50], in: 300), [
            CGRect(x: 0, y: 0, width: 100, height: row),
            CGRect(x: 0, y: row, width: 300, height: 2 * row),
            CGRect(x: 0, y: 3 * row, width: 50, height: row),
        ])
        // Nothing to lay out takes no room.
        XCTAssertEqual(frames([], in: 300), [])
    }

    /// Draws the card of the panel, 380 pt wide and 420 pt with very large
    /// text, as the panel is, in light and dark appearance. Returns the
    /// heights drawn, the standard size's first.
    @discardableResult
    private func assertPanelRenders(
        _ model: ScooterMapModel,
        _ name: String,
        file: StaticString = #filePath,
        line: UInt = #line
    ) -> [CGFloat] {
        let passes: [(ColorScheme, DynamicTypeSize, CGFloat)] = [
            (.light, .large, 380), (.dark, .xxxLarge, 380), (.dark, .accessibility3, 420), (.light, .accessibility5, 420)
        ]
        return passes.map { scheme, size, width in
            let renderer = ImageRenderer(
                content: ScooterControlDock(model: model, layout: .panel)
                    .frame(width: width)
                    .environment(\.colorScheme, scheme)
                    .environment(\.dynamicTypeSize, size)
            )
            let height = renderer.uiImage?.size.height ?? 0
            XCTAssertGreaterThan(height, 0, "\(name), \(scheme), \(size)", file: file, line: line)
            return height
        }
    }
}

// Where locating puts the rider on the map.
extension ScooterMapModelTests {
    /// Beside a panel, locating puts the rider in the middle of the part of
    /// the map beside it, at the first fix and again with the locate button
    /// once the map was moved. MapKit reads its margins back with the safe
    /// area added: compared with what was set, they never matched, the map
    /// was re-centred at every update, and each move stopped where it began,
    /// with the rider off the bottom of the screen.
    func testLocatingBesideThePanelPutsTheRiderInTheMiddleOfTheMapBesideIt() async throws {
        let (model, manager) = modelLocatedByTheTest()
        let (window, mapView) = try await panelWindow(showing: model)
        defer { window.isHidden = true }
        let besidePanel = await waitUntil { mapView.directionalLayoutMargins.leading >= 16 + 380 + 16 }
        XCTAssertTrue(besidePanel, "\(mapView.directionalLayoutMargins)")
        try await Task.sleep(for: .milliseconds(500))

        model.locationManager(manager, didUpdateLocations: [fix(at: Self.rider)])
        let located = await waitUntil(attempts: 400) { self.isBesideThePanel(Self.rider, on: mapView) }
        XCTAssertTrue(located, "\(mapView.convert(Self.rider, toPointTo: mapView))")

        mapView.setCenter(CLLocationCoordinate2D(latitude: 47.3790, longitude: 8.5450), animated: false)
        XCTAssertFalse(isBesideThePanel(Self.rider, on: mapView))
        model.focusOnUser()
        let locatedAgain = await waitUntil(attempts: 400) { self.isBesideThePanel(Self.rider, on: mapView) }
        XCTAssertTrue(locatedAgain, "\(mapView.convert(Self.rider, toPointTo: mapView))")
    }

    /// At a relaunch the model starts with the fix Core Location kept, as
    /// the panel takes its place and before SwiftUI has sized the map. The
    /// centre kept for the panel was held back by MapKit until the map had
    /// its size and then set over the move to the rider, which took the map
    /// back to where it opened, with the rider off the bottom of the screen.
    func testTheFixKeptFromBeforeLocatesTheRiderBesideThePanelAtLaunch() async throws {
        let manager = StubLocationManager(status: .authorizedWhenInUse)
        manager.cachedLocation = fix(at: Self.rider)
        let model = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: manager,
            defaults: isolatedDefaults(),
            // As makeModel(api:).
            builtInZones: []
        )
        let (window, mapView) = try await panelWindow(showing: model)
        defer { window.isHidden = true }
        let located = await waitUntil(attempts: 400) { self.isBesideThePanel(Self.rider, on: mapView) }
        XCTAssertTrue(located, "\(mapView.convert(Self.rider, toPointTo: mapView))")
        XCTAssertNotNil(model.focusRequest)
        // And it stays there once the map has settled.
        try await Task.sleep(for: .milliseconds(800))
        XCTAssertTrue(isBesideThePanel(Self.rider, on: mapView), "\(mapView.convert(Self.rider, toPointTo: mapView))")
    }

    /// A first fix can also come before the map is made at all: the move
    /// set out at the size the map opens with goes on to the rider beside
    /// the panel rather than stop where it was when the margins moved.
    func testAFirstFixBeforeThePanelIsInPlaceStillEndsBesideIt() async throws {
        let (model, manager) = modelLocatedByTheTest()
        model.locationManager(manager, didUpdateLocations: [fix(at: Self.rider)])
        XCTAssertNotNil(model.focusRequest)
        let (window, mapView) = try await panelWindow(showing: model)
        defer { window.isHidden = true }
        let located = await waitUntil(attempts: 400) { self.isBesideThePanel(Self.rider, on: mapView) }
        XCTAssertTrue(located, "\(mapView.convert(Self.rider, toPointTo: mapView))")
    }

    /// On a slow runner the first layout can take longer than a move to a
    /// place was once given before it counted as over: the map, without a
    /// size when the panel took its place, then kept where it opened, with
    /// the rider off to the side. The move waits for the map's size however
    /// long that takes.
    func testAFirstFixStillEndsBesideThePanelAfterASlowFirstLayout() async throws {
        let (model, manager) = modelLocatedByTheTest()
        model.locationManager(manager, didUpdateLocations: [fix(at: Self.rider)])
        let (window, mapView) = try await panelWindow(showing: model, firstLayoutTaking: 2)
        defer { window.isHidden = true }
        let located = await waitUntil(attempts: 400) { self.isBesideThePanel(Self.rider, on: mapView) }
        XCTAssertTrue(located, "\(mapView.convert(Self.rider, toPointTo: mapView))")
    }

    /// A move to a place is made again only when the panel's leading margin
    /// moves. On a phone nothing moves it: locating, a tall card opening in
    /// the dock with very large text, and locating again from it move the
    /// map once for each place asked for, however the dock and the card
    /// grow. Made again
    /// at every change of the margins, a move under way had no bound but the
    /// changes, and the screen froze on iOS 26 as a tall card opened.
    func testATallCardOpeningInTheDockMovesTheMapOnceForEachPlaceAskedFor() async throws {
        let tall = Scooter(
            provider: "publibike", latitude: 47.3769, longitude: 8.5417, battery: 82, rangeMeters: 24_000,
            vehicleID: "tall", deepLink: nil,
            rentalURIs: ScooterRentalURIs(ios: "https://publibike.ch/ride", android: nil, web: nil),
            distanceMeters: 0,
            pricing: ScooterRidePricing(currency: "CHF", unlockFeeMinorUnits: 100, minuteFeeMinorUnits: 35)
        )
        let manager = StubLocationManager(status: .authorizedWhenInUse)
        let api = StubScooterAPI(response: ScooterResponse(vehicles: [tall]))
        let model = ScooterMapModel(
            api: api,
            locationManager: manager,
            defaults: isolatedDefaults(),
            // As makeModel(api:).
            builtInZones: []
        )
        model.updateViewport(zurichRegion, zoom: 16)
        let loaded = await waitUntil { await api.snapshot().calls == 1 && model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)

        let scene = try XCTUnwrap(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 402, height: 874)
        window.rootViewController = UIHostingController(
            rootView: ScooterMapScreen(model: model).environment(\.dynamicTypeSize, .accessibility3)
        )
        window.isHidden = false
        defer { window.isHidden = true }
        window.layoutIfNeeded()
        let mapView = try XCTUnwrap(map(in: window))
        let coordinator = try XCTUnwrap(mapView.delegate as? ScooterMapView.Coordinator)
        try await Task.sleep(for: .milliseconds(600))
        guard case .summary = model.dock else { return XCTFail("Expected the summary") }

        let watchdog = MainThreadWatchdog("The map screen froze while a tall card opened with very large text")
        defer { watchdog.cancel() }
        let before = coordinator.movesToPlaces
        // Beside the scooter, which stays in the little left in view above the dock.
        model.locationManager(manager, didUpdateLocations: [fix(at: CLLocationCoordinate2D(latitude: 47.3770, longitude: 8.5417))])
        // Once the map is there: its zoom then no longer changes how scooters
        // are grouped, which would close the card.
        let located = await waitUntil(attempts: 400) { mapView.region.span.latitudeDelta < 0.02 }
        XCTAssertTrue(located, "\(mapView.region.span)")
        try await Task.sleep(for: .milliseconds(500))
        XCTAssertEqual(coordinator.movesToPlaces - before, 1)

        model.selectScooter("publibike:tall")
        try await Task.sleep(for: .milliseconds(1500))
        guard case .scooter = model.dock else { return XCTFail("Expected the scooter card") }
        XCTAssertEqual(coordinator.movesToPlaces - before, 1)

        // Locating from the card with the move under way as the card stays.
        model.focusOnUser()
        try await Task.sleep(for: .milliseconds(1500))
        XCTAssertEqual(coordinator.movesToPlaces - before, 2)
    }

    /// Beside a panel a move under way is made again once for each real
    /// move of the panel's leading margin, and only a few times in all: the
    /// panel growing and shrinking with the text size over and over moves
    /// the map a few times, then leaves it where it is, and nothing moves it
    /// once the panel stops.
    func testAMoveUnderWayIsMadeAgainAFewTimesAtMostAsThePanelKeepsMoving() async throws {
        let (model, manager) = modelLocatedByTheTest()
        let textSize = TextSize()
        let (window, mapView) = try await panelWindow(showing: model, textSize: textSize)
        defer { window.isHidden = true }
        let coordinator = try XCTUnwrap(mapView.delegate as? ScooterMapView.Coordinator)
        let besidePanel = await waitUntil { mapView.directionalLayoutMargins.leading >= 16 + 380 + 16 }
        XCTAssertTrue(besidePanel, "\(mapView.directionalLayoutMargins)")
        try await Task.sleep(for: .milliseconds(500))

        let watchdog = MainThreadWatchdog("The map screen froze while the panel kept moving")
        defer { watchdog.cancel() }
        model.locationManager(manager, didUpdateLocations: [fix(at: Self.rider)])
        let located = await waitUntil(attempts: 400) { self.isBesideThePanel(Self.rider, on: mapView) }
        XCTAssertTrue(located, "\(mapView.convert(Self.rider, toPointTo: mapView))")
        let before = coordinator.movesToPlaces

        // The first change takes the map on to the rider beside the wider panel.
        textSize.size = .accessibility1
        let wider = await waitUntil { mapView.directionalLayoutMargins.leading >= 16 + 420 + 16 }
        XCTAssertTrue(wider, "\(mapView.directionalLayoutMargins)")
        try await Task.sleep(for: .milliseconds(300))
        XCTAssertEqual(coordinator.movesToPlaces - before, 1)

        for _ in 0..<12 {
            textSize.size = textSize.size == .large ? .accessibility1 : .large
            try await Task.sleep(for: .milliseconds(150))
        }
        try await Task.sleep(for: .milliseconds(500))
        let afterChanges = coordinator.movesToPlaces
        XCTAssertGreaterThan(afterChanges - before, 1)
        XCTAssertLessThanOrEqual(afterChanges - before, 6)
        try await Task.sleep(for: .milliseconds(1000))
        XCTAssertEqual(coordinator.movesToPlaces, afterChanges)
    }

    private static let rider = CLLocationCoordinate2D(latitude: 47.3720, longitude: 8.5390)

    /// A model allowed to locate that hears only the fixes the test gives
    /// it, whatever the simulator's own location is, with `vehicles` about;
    /// without the cities' zones, as makeModel(api:).
    private func modelLocatedByTheTest(vehicles: [Scooter] = []) -> (ScooterMapModel, CLLocationManager) {
        modelLocatedByTheTest(api: StubScooterAPI(response: ScooterResponse(vehicles: vehicles)))
    }

    private func modelLocatedByTheTest(api: StubScooterAPI) -> (ScooterMapModel, CLLocationManager) {
        let manager = StubLocationManager(status: .authorizedWhenInUse)
        let model = ScooterMapModel(
            api: api,
            locationManager: manager,
            defaults: isolatedDefaults(),
            builtInZones: []
        )
        return (model, manager)
    }

    private func fix(at coordinate: CLLocationCoordinate2D) -> CLLocation {
        CLLocation(coordinate: coordinate, altitude: 400, horizontalAccuracy: 5, verticalAccuracy: 5, timestamp: .now)
    }

    /// The map screen in a window of an open iPhone Duo held sideways, which
    /// is on screen, with its safe area, before the screen is put in it, as
    /// the app's window is at launch.
    private func panelWindow(
        showing model: ScooterMapModel,
        size: CGSize = CGSize(width: 951, height: 669),
        hinge: TestHinge = TestHinge(),
        firstLayoutTaking slowness: TimeInterval = 0,
        textSize: TextSize = TextSize(),
        safeArea: UIEdgeInsets = .zero,
        resizable: Bool = false
    ) async throws -> (UIWindow, MKMapView) {
        let scene = try XCTUnwrap(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(origin: .zero, size: size)
        window.rootViewController = UIViewController()
        window.isHidden = false
        window.layoutIfNeeded()
        try await Task.sleep(for: .milliseconds(300))
        var slowed = false
        let host = UIHostingController(
            rootView: TextSized(textSize: textSize) { HingedScreen(model: model, hinge: hinge) }
                // Holds up the end of the first layout, between the map's
                // first update and the panel taking its place, as a slow
                // runner does.
                .background {
                    Color.clear.onGeometryChange(for: CGSize.self, of: \.size) { _ in
                        guard slowness > 0, !slowed else { return }
                        slowed = true
                        usleep(useconds_t(slowness * 1_000_000))
                    }
                }
                .environment(\.horizontalSizeClass, .regular)
                .environment(\.verticalSizeClass, .regular)
        )
        // Added to what the simulator's own screen gives the window.
        host.additionalSafeAreaInsets = safeArea
        if window.bounds.size == size, !resizable {
            window.rootViewController = host
        } else {
            // The window takes the simulator's shape: the screen gets a view
            // of the size asked for inside it. A test turns a resizable one
            // by giving it another size.
            let container = UIViewController()
            container.addChild(host)
            host.view.frame = CGRect(origin: .zero, size: size)
            container.view.addSubview(host.view)
            host.didMove(toParent: container)
            window.rootViewController = container
        }
        window.layoutIfNeeded()
        return (window, try XCTUnwrap(map(in: window)))
    }

    private func map(in view: UIView) -> MKMapView? {
        (view as? MKMapView) ?? view.subviews.lazy.compactMap(map(in:)).first
    }

    /// Whether a place is in the middle of the map right of the panel, 16 pt
    /// from the edge and 380 pt wide, within a little.
    private func isBesideThePanel(_ coordinate: CLLocationCoordinate2D, on mapView: MKMapView) -> Bool {
        let point = mapView.convert(coordinate, toPointTo: mapView)
        let middle = CGPoint(x: (16 + 380 + mapView.bounds.maxX) / 2, y: mapView.bounds.midY)
        return abs(point.x - middle.x) <= 24 && abs(point.y - middle.y) <= 24
    }
}

/// A text size a test can change while the screen is on show; none keeps
/// the one the screen is given.
@Observable
private final class TextSize {
    var size: DynamicTypeSize?
}

private struct TextSized<Content: View>: View {
    let textSize: TextSize
    @ViewBuilder let content: Content
    @Environment(\.dynamicTypeSize) private var given

    var body: some View {
        content.environment(\.dynamicTypeSize, textSize.size ?? given)
    }
}

// The fold of a partly open iPhone Duo.
extension ScooterMapModelTests {
    func testTheFoldIsTheActiveDivisionMovedIntoWindowCoordinates() {
        let screen = CGRect(x: 0, y: 24, width: 669, height: 927)
        XCTAssertEqual(
            ScooterFold.frame(among: [CGRect(x: 0, y: 441, width: 669, height: 20)], in: screen),
            CGRect(x: 0, y: 465, width: 669, height: 20)
        )
        XCTAssertNil(ScooterFold.frame(among: [], in: screen))
        // Flat, a fold has no width.
        XCTAssertNil(ScooterFold.frame(among: [CGRect(x: 465, y: 0, width: 0, height: 669)], in: screen))
        XCTAssertTrue(ScooterFold.isAcross(CGRect(x: 0, y: 465, width: 669, height: 20)))
        XCTAssertFalse(ScooterFold.isAcross(CGRect(x: 465, y: 0, width: 20, height: 669)))
    }

    func testStandingLikeALaptopTheSearchBarStartsUnderTheFold() {
        let upright = CGRect(x: 0, y: 30, width: 669, height: 921)
        XCTAssertEqual(ScooterFold.chromeTop(below: CGRect(x: 0, y: 465, width: 669, height: 20), in: upright), 455)
        XCTAssertEqual(ScooterFold.chromeTop(below: nil, in: upright), 0)
        XCTAssertEqual(ScooterFold.chromeTop(below: CGRect(x: 465, y: 0, width: 20, height: 669), in: upright), 0)
    }

    func testOpenLikeABookThePanelKeepsToItsHalf() {
        let fold = CGRect(x: 465, y: 0, width: 20, height: 669)
        // The status bar on the trailing side: the panel has room to spare.
        XCTAssertEqual(
            ScooterFold.panelWidth(380, beside: fold, in: CGRect(x: 0, y: 0, width: 891, height: 669), inset: 16, rightToLeft: false),
            380
        )
        // On the leading side, with a wider fold, the panel stops short of it.
        XCTAssertEqual(
            ScooterFold.panelWidth(
                380, beside: CGRect(x: 455, y: 0, width: 40, height: 669),
                in: CGRect(x: 60, y: 0, width: 891, height: 669), inset: 16, rightToLeft: false
            ),
            379
        )
        // Right to left the panel is on the right.
        XCTAssertEqual(
            ScooterFold.panelWidth(
                380, beside: CGRect(x: 456, y: 0, width: 40, height: 669),
                in: CGRect(x: 0, y: 0, width: 891, height: 669), inset: 16, rightToLeft: true
            ),
            379
        )
        XCTAssertEqual(
            ScooterFold.panelWidth(380, beside: CGRect(x: 200, y: 0, width: 20, height: 669), in: CGRect(x: 0, y: 0, width: 891, height: 669), inset: 16, rightToLeft: false),
            ScooterFold.minimumPanelWidth
        )
        XCTAssertEqual(
            ScooterFold.panelWidth(380, beside: CGRect(x: 0, y: 300, width: 891, height: 20), in: CGRect(x: 0, y: 0, width: 891, height: 669), inset: 16, rightToLeft: false),
            380
        )
        XCTAssertEqual(
            ScooterFold.panelWidth(380, beside: nil, in: CGRect(x: 0, y: 0, width: 891, height: 669), inset: 16, rightToLeft: false),
            380
        )
    }

    func testTheMapShowsOnTheFarSideOfAFoldFromThePanelAndAboveOneAcrossIt() {
        let book = CGRect(x: 465, y: 0, width: 20, height: 669)
        let panel = CGRect(x: 16, y: 16, width: 380, height: 300)
        XCTAssertEqual(ScooterMapCameraPolicy.side(of: book, panel: panel, rightToLeft: false), .right)
        XCTAssertEqual(ScooterMapCameraPolicy.side(of: book, panel: panel.offsetBy(dx: 539, dy: 0), rightToLeft: true), .left)
        XCTAssertEqual(ScooterMapCameraPolicy.side(of: book, panel: nil, rightToLeft: false), .right)
        XCTAssertEqual(ScooterMapCameraPolicy.side(of: book, panel: nil, rightToLeft: true), .left)
        XCTAssertEqual(ScooterMapCameraPolicy.side(of: CGRect(x: 0, y: 465, width: 669, height: 20), panel: nil, rightToLeft: false), .above)
    }

    func testBesideAFoldTheMapCentresInTheHalfItShowsOn() {
        // Open like a book: beside the panel, then past the fold.
        let besidePanel = CGRect(x: 396, y: 0, width: 555, height: 669)
        let book = CGRect(x: 465, y: 0, width: 20, height: 669)
        XCTAssertEqual(
            ScooterMapCameraPolicy.visibleRect(besidePanel, safeTop: 0, beside: book, on: .right),
            CGRect(x: 485, y: 0, width: 466, height: 669)
        )
        XCTAssertEqual(
            ScooterMapCameraPolicy.visibleRect(CGRect(x: 0, y: 0, width: 555, height: 669), safeTop: 0, beside: book, on: .left),
            CGRect(x: 0, y: 0, width: 465, height: 669)
        )

        // Standing like a laptop: the search bar and the dock lie under the
        // fold and cover nothing above it.
        let laptop = CGRect(x: 0, y: 465, width: 669, height: 20)
        let betweenSearchAndDock = CGRect(x: 0, y: 560, width: 669, height: 200)
        XCTAssertEqual(
            ScooterMapCameraPolicy.visibleRect(betweenSearchAndDock, safeTop: 30, beside: laptop, on: .above),
            CGRect(x: 0, y: 30, width: 669, height: 435)
        )
        // A search bar above the fold still covers the map.
        XCTAssertEqual(
            ScooterMapCameraPolicy.visibleRect(CGRect(x: 0, y: 110, width: 669, height: 650), safeTop: 30, beside: laptop, on: .above),
            CGRect(x: 0, y: 110, width: 669, height: 355)
        )

        // With hardly any room left beside it, the fold is let be.
        XCTAssertEqual(
            ScooterMapCameraPolicy.visibleRect(besidePanel, safeTop: 0, beside: CGRect(x: 920, y: 0, width: 20, height: 669), on: .right),
            besidePanel
        )
    }

    /// Open like a book, the panel on the leading half: locating puts the
    /// rider in the middle of the trailing half, not on the fold side of it,
    /// and Apple's logo goes past the fold.
    func testOpenLikeABookLocatingPutsTheRiderInTheMiddleOfTheTrailingHalf() async throws {
        let fold = CGRect(x: 465, y: 0, width: 20, height: 669)
        let (model, manager) = modelLocatedByTheTest()
        let (window, mapView) = try await panelWindow(showing: model, hinge: TestHinge(fold: fold))
        defer { window.isHidden = true }
        let pastTheFold = await waitUntil { mapView.layoutMargins.left >= fold.maxX + 15 }
        XCTAssertTrue(pastTheFold, "\(mapView.layoutMargins)")
        try await Task.sleep(for: .milliseconds(500))

        let middle = CGPoint(x: (fold.maxX + 951) / 2, y: 669 / 2)
        model.locationManager(manager, didUpdateLocations: [fix(at: Self.rider)])
        let located = await waitUntil(attempts: 400) { self.shows(Self.rider, at: middle, on: mapView) }
        XCTAssertTrue(located, "\(mapView.convert(Self.rider, toPointTo: mapView))")

        mapView.setCenter(CLLocationCoordinate2D(latitude: 47.3790, longitude: 8.5450), animated: false)
        model.focusOnUser()
        let locatedAgain = await waitUntil(attempts: 400) { self.shows(Self.rider, at: middle, on: mapView) }
        XCTAssertTrue(locatedAgain, "\(mapView.convert(Self.rider, toPointTo: mapView))")
    }

    /// Standing like a laptop, upright: the search bar goes down under the
    /// fold with the dock, and locating puts the rider in the middle of the
    /// upright half, not on the fold, nor under the search bar.
    func testStandingLikeALaptopTheMapTakesTheUprightHalf() async throws {
        let fold = CGRect(x: 0, y: 465, width: 669, height: 20)
        let (model, manager) = modelLocatedByTheTest()
        let (window, mapView) = try await panelWindow(
            showing: model,
            size: CGSize(width: 669, height: 951),
            hinge: TestHinge(fold: fold)
        )
        defer { window.isHidden = true }
        let coordinator = try XCTUnwrap(mapView.delegate as? ScooterMapView.Coordinator)
        let searchUnderTheFold = await waitUntil {
            let search = coordinator.parent.interactionExclusionFrame
            return !search.isNull && search.minY >= fold.maxY
        }
        XCTAssertTrue(searchUnderTheFold, "\(coordinator.parent.interactionExclusionFrame)")
        XCTAssertTrue(coordinator.parent.panelFrame.isNull, "a phone's layout")
        XCTAssertTrue(coordinator.parent.bottomChromeFrames.allSatisfy { $0.isNull || $0.minY >= fold.maxY })
        let marginsAboveTheFold = await waitUntil { mapView.layoutMargins.bottom >= 951 - fold.minY }
        XCTAssertTrue(marginsAboveTheFold, "\(mapView.layoutMargins)")
        try await Task.sleep(for: .milliseconds(500))

        let middle = CGPoint(x: 669 / 2, y: (mapView.safeAreaInsets.top + fold.minY) / 2)
        model.locationManager(manager, didUpdateLocations: [fix(at: Self.rider)])
        let located = await waitUntil(attempts: 400) { self.shows(Self.rider, at: middle, on: mapView) }
        XCTAssertTrue(located, "\(mapView.convert(Self.rider, toPointTo: mapView)) for \(middle)")
    }

    /// Folded open like a book and opened again while the move to the
    /// rider is under way, nothing having touched the map: the map lands
    /// each time where locating would, in the middle of the half where it
    /// shows, at locating's zoom there. iOS moves the fold inside an
    /// animation, and the margins set in it reached MapKit only at its end:
    /// the rider ended 45 pt off the middle, and opening again kept the
    /// zoom of the fold. The move made again was measured in it too, where
    /// MapKit takes a point on the tilted map back to another place: the
    /// rider landed up to 3.4 pt from where locating again leaves it, more
    /// than the 3 pt allowed only on the open Duo held upright. Measured
    /// outside it, the move lands just there, so the tests allow a point.
    func testFoldingAndOpeningWhileLocatingLandsWhereLocatingWould() async throws {
        let fold = CGRect(x: 465, y: 0, width: 20, height: 669)
        let hinge = TestHinge()
        let (model, manager) = modelLocatedByTheTest()
        let (window, mapView) = try await panelWindow(showing: model, hinge: hinge)
        defer { window.isHidden = true }
        let besidePanel = await waitUntil { mapView.directionalLayoutMargins.leading >= 16 + 380 + 16 }
        XCTAssertTrue(besidePanel, "\(mapView.directionalLayoutMargins)")
        try await Task.sleep(for: .milliseconds(500))
        model.locationManager(manager, didUpdateLocations: [fix(at: Self.rider)])
        let located = await waitUntil(attempts: 400) { self.isBesideThePanel(Self.rider, on: mapView) }
        XCTAssertTrue(located, "\(mapView.convert(Self.rider, toPointTo: mapView))")
        try await Task.sleep(for: .milliseconds(800))
        let open = mapView.camera.centerCoordinateDistance

        let middleBesidePanel = CGPoint(x: (16 + 380 + 951) / 2, y: 669 / 2)
        let trailingHalf = CGPoint(x: (fold.maxX + 951) / 2, y: 669 / 2)
        try await turn(hinge, to: fold, in: window)
        try await assertLanded(at: trailingHalf, on: mapView, model: model, within: 1)
        let folded = mapView.camera.centerCoordinateDistance
        // The same place fitted into the narrower half.
        XCTAssertGreaterThan(folded, open * 1.1)

        try await turn(hinge, to: nil, in: window)
        try await assertLanded(at: middleBesidePanel, on: mapView, model: model, within: 1)
        XCTAssertEqual(mapView.camera.centerCoordinateDistance, open, accuracy: open * 0.02)

        try await turn(hinge, to: fold, in: window)
        try await assertLanded(at: trailingHalf, on: mapView, model: model, within: 1)
        XCTAssertEqual(mapView.camera.centerCoordinateDistance, folded, accuracy: folded * 0.02)
    }

    /// The other way: located open like a book, then opened and folded again.
    func testOpeningAndFoldingAfterLocatingInTheBookPoseLandsWhereLocatingWould() async throws {
        let fold = CGRect(x: 465, y: 0, width: 20, height: 669)
        let hinge = TestHinge(fold: fold)
        let (model, manager) = modelLocatedByTheTest()
        let (window, mapView) = try await panelWindow(showing: model, hinge: hinge)
        defer { window.isHidden = true }
        let pastTheFold = await waitUntil { mapView.layoutMargins.left >= fold.maxX + 15 }
        XCTAssertTrue(pastTheFold, "\(mapView.layoutMargins)")
        try await Task.sleep(for: .milliseconds(500))
        let trailingHalf = CGPoint(x: (fold.maxX + 951) / 2, y: 669 / 2)
        model.locationManager(manager, didUpdateLocations: [fix(at: Self.rider)])
        let located = await waitUntil(attempts: 400) { self.shows(Self.rider, at: trailingHalf, on: mapView) }
        XCTAssertTrue(located, "\(mapView.convert(Self.rider, toPointTo: mapView))")
        try await Task.sleep(for: .milliseconds(800))
        let folded = mapView.camera.centerCoordinateDistance

        try await turn(hinge, to: nil, in: window)
        try await assertLanded(at: CGPoint(x: (16 + 380 + 951) / 2, y: 669 / 2), on: mapView, model: model, within: 1)
        XCTAssertLessThan(mapView.camera.centerCoordinateDistance, folded / 1.1)

        try await turn(hinge, to: fold, in: window)
        try await assertLanded(at: trailingHalf, on: mapView, model: model, within: 1)
        XCTAssertEqual(mapView.camera.centerCoordinateDistance, folded, accuracy: folded * 0.02)
    }

    /// The card's header centres its scooter at the zoom the map has, and
    /// folding like a book makes that move again, inside the fold's
    /// animation: the scooter lands where the header puts it, in the middle
    /// of the half where the map shows, at the same zoom. Its centre is
    /// measured outside the animation, as a move that fits a region is;
    /// measured inside it, on the open Duo held upright, it came out the same.
    func testFoldingAfterTheCardHeaderCentresAScooterLandsWhereTheHeaderWould() async throws {
        let fold = CGRect(x: 465, y: 0, width: 20, height: 669)
        let hinge = TestHinge()
        let parked = scooter(id: "one", provider: "lime", latitude: 47.3728, longitude: 8.5412)
        let api = StubScooterAPI(response: ScooterResponse(vehicles: [parked]))
        let (model, manager) = modelLocatedByTheTest(api: api)
        let (window, mapView) = try await panelWindow(showing: model, hinge: hinge)
        defer { window.isHidden = true }
        let besidePanel = await waitUntil { mapView.directionalLayoutMargins.leading >= 16 + 380 + 16 }
        XCTAssertTrue(besidePanel, "\(mapView.directionalLayoutMargins)")
        try await Task.sleep(for: .milliseconds(500))
        model.locationManager(manager, didUpdateLocations: [fix(at: Self.rider)])
        let located = await waitUntil(attempts: 400) { self.isBesideThePanel(Self.rider, on: mapView) }
        XCTAssertTrue(located, "\(mapView.convert(Self.rider, toPointTo: mapView))")
        // The map asks again each time it moves, so how many requests that takes isn't fixed.
        let loaded = await waitUntil(attempts: 400) {
            await api.snapshot().calls >= 1 && model.mapScooters.contains { $0.id == parked.id }
        }
        XCTAssertTrue(loaded)
        // The header is on the card of the scooter chosen.
        model.selectScooter(parked.id)
        try await Task.sleep(for: .milliseconds(1500))
        model.focusOnScooter(parked)
        let centred = await waitUntil(attempts: 300) {
            self.shows(parked.coordinate, at: CGPoint(x: (16 + 380 + 951) / 2, y: 669 / 2), on: mapView, within: 80)
        }
        XCTAssertTrue(centred, "\(mapView.convert(parked.coordinate, toPointTo: mapView))")
        try await waitUntilAtRest(mapView, showing: parked.coordinate)
        let open = mapView.convert(parked.coordinate, toPointTo: mapView)
        let distance = mapView.camera.centerCoordinateDistance

        try await turn(hinge, to: fold, in: window)
        try await assertLanded(
            parked.coordinate,
            at: CGPoint(x: (fold.maxX + 951) / 2, y: open.y),
            on: mapView,
            model: model,
            within: 1,
            movingAgain: { model.focusOnScooter(parked) }
        )
        XCTAssertEqual(mapView.camera.centerCoordinateDistance, distance, accuracy: distance * 0.01)
    }

    /// Once the person has moved the map, here a step in from the keyboard,
    /// the fold takes what was in the middle beside the panel to the middle
    /// of the trailing half, and opening brings it back, at the zoom it has.
    func testFoldingAndOpeningAfterTheMapWasMovedKeepsWhatIsInTheMiddle() async throws {
        let fold = CGRect(x: 465, y: 0, width: 20, height: 669)
        let hinge = TestHinge()
        let (model, manager) = modelLocatedByTheTest()
        let (window, mapView) = try await panelWindow(showing: model, hinge: hinge)
        defer { window.isHidden = true }
        model.locationManager(manager, didUpdateLocations: [fix(at: Self.rider)])
        let located = await waitUntil(attempts: 400) { self.isBesideThePanel(Self.rider, on: mapView) }
        XCTAssertTrue(located, "\(mapView.convert(Self.rider, toPointTo: mapView))")
        try await Task.sleep(for: .milliseconds(800))
        model.zoom(by: 1)
        try await Task.sleep(for: .milliseconds(1200))
        let middleBesidePanel = CGPoint(x: (16 + 380 + 951) / 2, y: 669 / 2)
        let kept = mapView.convert(middleBesidePanel, toCoordinateFrom: mapView)
        let zoomed = mapView.camera.centerCoordinateDistance

        try await turn(hinge, to: fold, in: window)
        try await Task.sleep(for: .milliseconds(1200))
        let trailingHalf = CGPoint(x: (fold.maxX + 951) / 2, y: 669 / 2)
        XCTAssertTrue(shows(kept, at: trailingHalf, on: mapView, within: 8), "\(mapView.convert(kept, toPointTo: mapView))")
        XCTAssertEqual(mapView.camera.centerCoordinateDistance, zoomed, accuracy: zoomed * 0.01)

        try await turn(hinge, to: nil, in: window)
        try await Task.sleep(for: .milliseconds(1200))
        XCTAssertTrue(shows(kept, at: middleBesidePanel, on: mapView, within: 8), "\(mapView.convert(kept, toPointTo: mapView))")
        XCTAssertEqual(mapView.camera.centerCoordinateDistance, zoomed, accuracy: zoomed * 0.01)
    }

    /// Upright and located, then turned sideways inside an animation, as
    /// the Duo is: the rider lands beside the panel where locating would,
    /// at locating's zoom. The panel took its place while the map was still
    /// upright, and the move fitted the place into the sliver beside it:
    /// once the map had turned, the rider was off the middle, zoomed far out.
    func testTurnedSidewaysWhileLocatingTheRiderLandsBesideThePanel() async throws {
        let (model, manager) = modelLocatedByTheTest()
        let (window, mapView) = try await panelWindow(showing: model, size: CGSize(width: 669, height: 951), resizable: true)
        defer { window.isHidden = true }
        try await Task.sleep(for: .milliseconds(500))
        model.locationManager(manager, didUpdateLocations: [fix(at: Self.rider)])
        try await Task.sleep(for: .milliseconds(1500))
        let screen = try XCTUnwrap(window.rootViewController?.children.first?.view)
        UIView.animate(withDuration: 0.3) {
            screen.frame = CGRect(x: 0, y: 0, width: 951, height: 669)
            window.layoutIfNeeded()
        }
        try await Task.sleep(for: .milliseconds(1500))
        try await assertLanded(at: CGPoint(x: (16 + 380 + 951) / 2, y: 669 / 2), on: mapView, model: model)
    }

    /// On the Duo the map takes its new size as the screen turns and its new
    /// safe area only once it is on its way to the rider: the status bar's
    /// room, still at the top, leaves it then.
    func testTurnedSidewaysTheRiderLandsBesideThePanelOnceTheSafeAreaHasTurned() async throws {
        let (model, manager) = modelLocatedByTheTest()
        let (window, mapView) = try await panelWindow(showing: model, size: CGSize(width: 669, height: 951), resizable: true)
        defer { window.isHidden = true }
        let host = try XCTUnwrap(window.rootViewController?.children.first)
        host.additionalSafeAreaInsets = UIEdgeInsets(top: 48, left: 0, bottom: 0, right: 0)
        try await Task.sleep(for: .milliseconds(500))
        model.locationManager(manager, didUpdateLocations: [fix(at: Self.rider)])
        try await Task.sleep(for: .milliseconds(1500))
        let upright = mapView.camera.centerCoordinateDistance
        UIView.animate(withDuration: 0.3) {
            host.view.frame = CGRect(x: 0, y: 0, width: 951, height: 669)
            window.layoutIfNeeded()
        }
        let onItsWay = await waitUntil(attempts: 150) {
            abs(mapView.camera.centerCoordinateDistance / upright - 1) > 0.01
        }
        XCTAssertTrue(onItsWay)
        host.additionalSafeAreaInsets = .zero
        window.layoutIfNeeded()
        try await Task.sleep(for: .milliseconds(1500))
        try await assertLanded(at: CGPoint(x: (16 + 380 + 951) / 2, y: 669 / 2), on: mapView, model: model)
    }

    /// Once the map has landed on the rider, the status bar's room leaving it
    /// makes no region change: the move is made again for the new safe area
    /// all the same, and the rider is where locating again puts them.
    func testTheMoveIsMadeAgainWhenOnlyTheSafeAreaChangesAfterItLanded() async throws {
        let (model, manager) = modelLocatedByTheTest()
        let (window, mapView) = try await panelWindow(showing: model, resizable: true)
        defer { window.isHidden = true }
        let host = try XCTUnwrap(window.rootViewController?.children.first)
        host.additionalSafeAreaInsets = UIEdgeInsets(top: 48, left: 0, bottom: 0, right: 0)
        try await Task.sleep(for: .milliseconds(500))
        model.locationManager(manager, didUpdateLocations: [fix(at: Self.rider)])
        let located = await waitUntil(attempts: 400) { self.isBesideThePanel(Self.rider, on: mapView) }
        XCTAssertTrue(located)
        try await waitUntilAtRest(mapView)
        host.additionalSafeAreaInsets = .zero
        window.layoutIfNeeded()
        try await assertLanded(
            at: CGPoint(x: (16 + 380 + 951) / 2, y: 669 / 2), on: mapView, model: model, within: 0.5
        )
    }

    /// Opens or folds the Duo as iOS does, inside an animation, and lets it end.
    private func turn(_ hinge: TestHinge, to fold: CGRect?, in window: UIWindow) async throws {
        UIView.animate(withDuration: 0.5) {
            hinge.fold = fold
            window.layoutIfNeeded()
        }
        try await Task.sleep(for: .milliseconds(1200))
    }

    /// The rider, or `place`, is at `point` once the map has settled, and
    /// locating again, or moving there again as `moveAgain` does, leaves the
    /// map where it is, within `tolerance` points: it is where that move
    /// puts it, at its zoom.
    private func assertLanded(
        _ place: CLLocationCoordinate2D = ScooterMapModelTests.rider,
        at point: CGPoint,
        on mapView: MKMapView,
        model: ScooterMapModel,
        within tolerance: CGFloat = 3,
        movingAgain moveAgain: (() -> Void)? = nil,
        file: StaticString = #filePath,
        line: UInt = #line
    ) async throws {
        _ = await waitUntil(attempts: 300) { self.shows(place, at: point, on: mapView, within: 8) }
        try await waitUntilAtRest(mapView, showing: place)
        let shown = mapView.convert(place, toPointTo: mapView)
        XCTAssertTrue(shows(place, at: point, on: mapView, within: 8), "\(shown) for \(point)", file: file, line: line)
        let distance = mapView.camera.centerCoordinateDistance
        if let moveAgain { moveAgain() } else { model.focusOnUser() }
        try await Task.sleep(for: .milliseconds(600))
        try await waitUntilAtRest(mapView, showing: place)
        let relocated = mapView.convert(place, toPointTo: mapView)
        XCTAssertEqual(relocated.x, shown.x, accuracy: tolerance, "\(shown) → \(relocated)", file: file, line: line)
        XCTAssertEqual(relocated.y, shown.y, accuracy: tolerance, "\(shown) → \(relocated)", file: file, line: line)
        XCTAssertEqual(
            mapView.camera.centerCoordinateDistance, distance, accuracy: distance * 0.01,
            "zoom", file: file, line: line
        )
    }

    /// Waits for the rider, or `place`, to keep its place and the camera its
    /// distance for 600 ms, for 5 s at most. A move made again waits for a
    /// region change, and on a slow runner the map came near the place, then
    /// was measured 600 ms later while its last move was still to come: the
    /// rider 7 pt low, where locating left it in the middle (run 39852766517).
    private func waitUntilAtRest(
        _ mapView: MKMapView,
        showing place: CLLocationCoordinate2D = ScooterMapModelTests.rider
    ) async throws {
        var shown = mapView.convert(place, toPointTo: mapView)
        var distance = mapView.camera.centerCoordinateDistance
        var still = 0
        for _ in 0 ..< 50 {
            try await Task.sleep(for: .milliseconds(100))
            let now = mapView.convert(place, toPointTo: mapView)
            let nowDistance = mapView.camera.centerCoordinateDistance
            let moved = hypot(now.x - shown.x, now.y - shown.y) > 0.5 || abs(nowDistance / distance - 1) > 0.001
            still = moved ? 0 : still + 1
            if still == 6 { return }
            shown = now
            distance = nowDistance
        }
    }

    /// Whether a place shows at `point` on the map, within a little.
    private func shows(
        _ coordinate: CLLocationCoordinate2D,
        at point: CGPoint,
        on mapView: MKMapView,
        within tolerance: CGFloat = 24
    ) -> Bool {
        let shown = mapView.convert(coordinate, toPointTo: mapView)
        return abs(shown.x - point.x) <= tolerance && abs(shown.y - point.y) <= tolerance
    }
}

// The keyboard's shortcuts.
extension ScooterMapModelTests {
    func testTheKeyboardsShortcutsEachHaveTheirOwnKeys() {
        let keys = ScooterKeyCommand.allCases.map { "\($0.modifiers.rawValue) \($0.key.character)" }
        XCTAssertEqual(Set(keys).count, keys.count, "\(keys)")
        XCTAssertEqual(ScooterKeyCommand.search.modifiers, .command)
        XCTAssertEqual(ScooterKeyCommand.filters.key, ScooterKeyCommand.search.key)
        XCTAssertEqual(ScooterKeyCommand.filters.modifiers, [.command, .option])
        XCTAssertEqual(ScooterKeyCommand.close.key, .escape)
        XCTAssertEqual(ScooterKeyCommand.fold.key.character, "\\")
        // Only "/" and Esc go without ⌘.
        XCTAssertEqual(
            Set(ScooterKeyCommand.allCases.filter { !$0.modifiers.contains(.command) }),
            [.searchWithSlash, .close]
        )
    }

    /// The keys a sheet or a popover doesn't take go on to the screen that
    /// presented it: while the filters or Settings are open the screen
    /// makes none, so that a "/" typed there, or an Esc meant for it, stays
    /// there.
    func testTheShortcutsStandDownWhileTheFiltersOrSettingsAreOpen() {
        for layout in [ScooterChromeLayout.dock, .panel] {
            for isSearching in [false, true] {
                for hasCard in [false, true] {
                    let situation = ScooterKeyCommand.Situation(
                        layout: layout,
                        isSearching: isSearching,
                        isPresenting: true,
                        hasCard: hasCard
                    )
                    XCTAssertEqual(ScooterKeyCommand.available(in: situation), [], "\(situation)")
                }
            }
        }
    }

    func testSlashSearchesOnlyWhileTheSearchsFieldIsntThereToTakeIt() {
        let atRest = ScooterKeyCommand.available(in: .init(layout: .panel))
        XCTAssertTrue(atRest.contains(.searchWithSlash))
        XCTAssertTrue(atRest.contains(.search))

        let searching = ScooterKeyCommand.available(in: .init(layout: .panel, isSearching: true))
        XCTAssertFalse(searching.contains(.searchWithSlash))
        // ⌘ keys aren't typed into the field: they still go.
        XCTAssertTrue(searching.contains(.search))
        XCTAssertTrue(searching.contains(.nearMe))
    }

    func testEscClosesTheSearchFirstThenTheCardAndIsLeftAloneWithNothingToClose() {
        typealias Situation = ScooterKeyCommand.Situation
        XCTAssertEqual(ScooterKeyCommand.closing(in: Situation(layout: .panel, isSearching: true, hasCard: true)), .search)
        XCTAssertEqual(ScooterKeyCommand.closing(in: Situation(layout: .dock, isSearching: true, hasCard: true)), .search)
        XCTAssertEqual(ScooterKeyCommand.closing(in: Situation(layout: .panel, hasCard: true)), .card)
        XCTAssertEqual(ScooterKeyCommand.closing(in: Situation(layout: .dock, isSearching: true)), .search)
        XCTAssertNil(ScooterKeyCommand.closing(in: Situation(layout: .panel)))

        XCTAssertFalse(ScooterKeyCommand.available(in: Situation(layout: .panel)).contains(.close))
        XCTAssertTrue(ScooterKeyCommand.available(in: Situation(layout: .dock, hasCard: true)).contains(.close))
        XCTAssertTrue(ScooterKeyCommand.available(in: Situation(layout: .dock, isSearching: true)).contains(.close))
    }

    func testFoldingStandsBesideAPanelAndLocatingNotWhileLocating() {
        XCTAssertTrue(ScooterKeyCommand.available(in: .init(layout: .panel)).contains(.fold))
        XCTAssertFalse(ScooterKeyCommand.available(in: .init(layout: .dock)).contains(.fold))
        XCTAssertEqual(ScooterKeyCommand.fold.title(in: .init(layout: .panel)), String(localized: "Collapse panel"))
        XCTAssertEqual(ScooterKeyCommand.fold.title(in: .init(layout: .panel, isFolded: true)), String(localized: "Expand panel"))
        XCTAssertFalse(ScooterKeyCommand.available(in: .init(layout: .panel, isLocating: true)).contains(.nearMe))
    }

    func testTheShortcutsAreNamedInEveryLanguage() throws {
        for language in ["en", "de", "fr", "it", "nl", "nb", "pt", "es", "is"] {
            let strings = try XCTUnwrap(
                Bundle.main.path(forResource: language, ofType: "lproj").flatMap(Bundle.init(path:))
            )
            for key in ["Search", "Zoom in", "Zoom out", "Close", "Near me", "Filters", "Settings", "Collapse panel", "Expand panel", "Map"] {
                let name = strings.localizedString(forKey: key, value: "-", table: nil)
                XCTAssertNotEqual(name, "-", "\(language): \(key)")
                XCTAssertFalse(name.isEmpty, "\(language): \(key)")
            }
        }
    }

    /// The menu bar lists each shortcut once, with Settings in the app's
    /// menu; "/", ⌘= and Esc stand in for others or close, and stay off it.
    func testTheMenuBarListsEveryShortcutButTheOnesThatStandInOnce() {
        let listed = (ScooterMenuBar.map + ScooterMenuBar.view).flatMap { $0 } + [.settings]
        XCTAssertEqual(Set(listed).count, listed.count, "\(listed)")
        XCTAssertEqual(
            Set(ScooterKeyCommand.allCases).subtracting(listed),
            [.searchWithSlash, .zoomInWithoutShift, .close]
        )
        XCTAssertEqual(ScooterMenuBar.view.first?.compactMap(\.mapStyle), AppleMapStyle.allCases)
        // A phone has no menu bar: the screen's own keys answer, as before.
        if UIDevice.current.userInterfaceIdiom == .phone {
            XCTAssertFalse(ScooterMenuBar.shown)
        }
    }

    /// A 375 pt iPhone's card gives its figures 321 pt and keeps them side by
    /// side; a 320 pt window's gives them 266 and puts the third under the
    /// other two, so that the price keeps its ride length.
    func testTheCardsFiguresGoTwoOverOneOnlyInAWindowNarrowerThanAPhone() {
        XCTAssertFalse(CardFigureRow.wraps(3, across: 321))
        XCTAssertTrue(CardFigureRow.wraps(3, across: 266))
        XCTAssertFalse(CardFigureRow.wraps(2, across: 266))
        XCTAssertFalse(CardFigureRow.wraps(3, across: nil))

        func size(across width: CGFloat) -> CGSize {
            ImageRenderer(content: CardFigureRow {
                Color.red.frame(maxWidth: .infinity).frame(height: 50)
                Color.green.frame(maxWidth: .infinity).frame(height: 60)
                Color.blue.frame(maxWidth: .infinity).frame(height: 40)
            }.frame(width: width)).uiImage?.size ?? .zero
        }
        XCTAssertEqual(size(across: 321), CGSize(width: 321, height: 60))
        XCTAssertEqual(size(across: 266), CGSize(width: 266, height: 60 + 8 + 40))
    }

    /// The keyboard's frame, turned into the window's coordinates, limits the
    /// search only when it covers the window's bottom.
    func testTheSearchEndsAboveOnlyAKeyboardThatCoversTheWindowsBottom() {
        // A phone: the window is the screen, and the keyboard's top is where it was.
        XCTAssertEqual(KeyboardOverlap.top(of: CGRect(x: 0, y: 596, width: 402, height: 278), windowHeight: 874), 596)
        // Its shortcuts bar alone, with a hardware keyboard.
        XCTAssertEqual(KeyboardOverlap.top(of: CGRect(x: 0, y: 1_312, width: 1_032, height: 64), windowHeight: 1_376), 1_312)
        // Gone: below the window.
        XCTAssertEqual(KeyboardOverlap.top(of: CGRect(x: 0, y: 874, width: 402, height: 278), windowHeight: 874), .infinity)
        // A Stage Manager window 200 pt down the screen, 700 tall, over a keyboard
        // whose top is 820 down the screen: 620 into the window.
        XCTAssertEqual(KeyboardOverlap.top(of: CGRect(x: -100, y: 620, width: 1_376, height: 300), windowHeight: 700), 620)
        // The same window ending above the keyboard.
        XCTAssertEqual(KeyboardOverlap.top(of: CGRect(x: -100, y: 760, width: 1_376, height: 300), windowHeight: 700), .infinity)
        // A floating keyboard: an empty frame, or one over the middle of the window.
        XCTAssertEqual(KeyboardOverlap.top(of: .zero, windowHeight: 874), .infinity)
        XCTAssertEqual(KeyboardOverlap.top(of: CGRect(x: 300, y: 400, width: 320, height: 250), windowHeight: 1_000), .infinity)
    }

    func testZoomingFromTheKeyboardAsksTheMapForAStepEachTime() {
        let model = ScooterMapModel(
            api: StubScooterAPI(response: ScooterResponse(vehicles: [])),
            locationManager: StubLocationManager(status: .denied),
            defaults: isolatedDefaults()
        )
        XCTAssertNil(model.zoomRequest)
        model.zoom(by: 1)
        let first = model.zoomRequest
        XCTAssertEqual(first?.steps, 1)
        model.zoom(by: 1)
        XCTAssertEqual(model.zoomRequest?.steps, 1)
        XCTAssertNotEqual(model.zoomRequest?.token, first?.token)
        model.zoom(by: -1)
        XCTAssertEqual(model.zoomRequest?.steps, -1)

        XCTAssertEqual(ScooterMapCameraPolicy.distance(1_000, zoomedBy: 1), 500, accuracy: 0.001)
        XCTAssertEqual(ScooterMapCameraPolicy.distance(1_000, zoomedBy: -1), 2_000, accuracy: 0.001)
    }

    /// ⌘+ and ⌘− beside the panel: the camera comes a step in, then goes
    /// two out, and what was in the middle of the map stays there. A status
    /// bar over the map leaves the middle where locating puts it. Each step
    /// waits for the map to be at rest: on a slow runner the rider showed
    /// beside the panel while locating was still under way, and the step
    /// out was measured from where locating ended (run 40047027732).
    func testTheMapZoomsAStepAtATimeAroundItsMiddle() async throws {
        let (model, manager) = modelLocatedByTheTest()
        let (window, mapView) = try await panelWindow(
            showing: model,
            safeArea: UIEdgeInsets(top: 40, left: 0, bottom: 0, right: 0)
        )
        defer { window.isHidden = true }
        model.locationManager(manager, didUpdateLocations: [fix(at: Self.rider)])
        let located = await waitUntil(attempts: 400) { self.isBesideThePanel(Self.rider, on: mapView) }
        XCTAssertTrue(located)
        try await waitUntilAtRest(mapView)
        let start = mapView.camera.centerCoordinateDistance

        model.zoom(by: 1)
        let closer = await waitUntil(attempts: 300) {
            abs(mapView.camera.centerCoordinateDistance - start / 2) < start * 0.02
        }
        XCTAssertTrue(closer, "\(start) → \(mapView.camera.centerCoordinateDistance)")
        try await waitUntilAtRest(mapView)
        XCTAssertEqual(mapView.camera.centerCoordinateDistance, start / 2, accuracy: start * 0.02, "the step in held")
        XCTAssertTrue(isBesideThePanel(Self.rider, on: mapView), whereTheMiddleShows(on: mapView))

        model.zoom(by: -2)
        let further = await waitUntil(attempts: 300) {
            abs(mapView.camera.centerCoordinateDistance - start * 2) < start * 0.04
        }
        XCTAssertTrue(further, "\(start) → \(mapView.camera.centerCoordinateDistance)")
        try await waitUntilAtRest(mapView)
        XCTAssertTrue(isBesideThePanel(Self.rider, on: mapView), whereTheMiddleShows(on: mapView))
    }

    /// The rider, the camera's centre and the map's centre as shown, and the
    /// map's margins, for a failure to say where the step went.
    private func whereTheMiddleShows(on mapView: MKMapView) -> String {
        let rider = mapView.convert(Self.rider, toPointTo: mapView)
        let camera = mapView.convert(mapView.camera.centerCoordinate, toPointTo: mapView)
        let centre = mapView.convert(mapView.centerCoordinate, toPointTo: mapView)
        return "rider \(rider), camera \(camera), centre \(centre), bounds \(mapView.bounds.size), margins \(mapView.directionalLayoutMargins), safe area \(mapView.safeAreaInsets)"
    }

    /// The screen in a window makes its shortcuts as key commands; the
    /// keyboard can't be pressed here, so they are looked for and run.
    func testTheScreenMakesItsShortcutsAndTheyActOnIt() async throws {
        let (model, _) = modelLocatedByTheTest()
        let (window, _) = try await panelWindow(showing: model)
        defer { window.isHidden = true }
        try await Task.sleep(for: .milliseconds(300))

        let atRest = keyCommands(in: window)
        XCTAssertEqual(command(input: "f", flags: .command, in: atRest)?.title, String(localized: "Search"))
        XCTAssertNotNil(command(input: "/", flags: [], in: atRest))
        XCTAssertNil(command(input: UIKeyCommand.inputEscape, flags: [], in: atRest))

        try perform("2", .command, in: window)
        let quiet = await waitUntil { model.mapStyle == .quiet }
        XCTAssertTrue(quiet)

        try perform("\\", .command, in: window)
        let folded = await waitUntil { model.isPanelCollapsed }
        XCTAssertTrue(folded)
        try perform("\\", .command, in: window)
        let opened = await waitUntil { !model.isPanelCollapsed }
        XCTAssertTrue(opened)

        // A card, then the search over it: Esc closes the search in front,
        // then the card.
        model.selectScooter("lime:test")
        try perform("f", .command, in: window)
        let searching = await waitUntil {
            self.command(input: "/", flags: [], in: self.keyCommands(in: window)) == nil
        }
        XCTAssertTrue(searching, "the field takes a typed /")
        try perform(UIKeyCommand.inputEscape, [], in: window)
        let searchClosed = await waitUntil {
            self.command(input: "/", flags: [], in: self.keyCommands(in: window)) != nil
        }
        XCTAssertTrue(searchClosed)
        XCTAssertEqual(model.selectedScooterID, "lime:test", "the card stays")
        try perform(UIKeyCommand.inputEscape, [], in: window)
        let cardClosed = await waitUntil {
            model.selectedScooterID == nil
                && self.command(input: UIKeyCommand.inputEscape, flags: [], in: self.keyCommands(in: window)) == nil
        }
        XCTAssertTrue(cardClosed)

        // The filters open, and the screen leaves every key to them.
        try perform("f", [.command, .alternate], in: window)
        let presenting = await waitUntil { self.keyCommands(in: window).isEmpty }
        XCTAssertTrue(presenting, "\(keyCommands(in: window).map { $0.input ?? "?" })")
    }

    /// The key commands of every responder in a window.
    private func keyCommands(in window: UIWindow) -> [UIKeyCommand] {
        responders(in: window).flatMap { $0.keyCommands ?? [] }
    }

    /// The window's views and view controllers.
    private func responders(in window: UIWindow) -> [UIResponder] {
        var responders: [UIResponder] = []
        func visit(_ view: UIView) {
            responders.append(view)
            view.subviews.forEach(visit)
        }
        func visit(_ controller: UIViewController) {
            responders.append(controller)
            controller.children.forEach(visit)
        }
        visit(window as UIView)
        window.rootViewController.map(visit)
        return responders
    }

    private func command(input: String, flags: UIKeyModifierFlags, in commands: [UIKeyCommand]) -> UIKeyCommand? {
        commands.first { $0.input == input && $0.modifierFlags == flags }
    }

    /// Runs the screen's key command for a key, as the keyboard would.
    private func perform(_ input: String, _ flags: UIKeyModifierFlags, in window: UIWindow) throws {
        let command = try XCTUnwrap(
            command(input: input, flags: flags, in: keyCommands(in: window)),
            "no key command for \(flags.rawValue) \(input)"
        )
        let action = try XCTUnwrap(command.action)
        // Up the responder chain from the screen that makes the command, as
        // UIKit sends it. The screen was taken as the window's root, as in the
        // app, but where the window takes the simulator's shape, as on the
        // open Duo held upright, it is a child of the root (panelWindow), and
        // the chain from the root never reached its hosting view.
        let screen = try XCTUnwrap(
            responders(in: window).first { self.command(input: input, flags: flags, in: $0.keyCommands ?? []) != nil }
        )
        let target = try XCTUnwrap(
            ((screen as? UIViewController)?.view ?? screen).target(forAction: action, withSender: command) as? NSObject
        )
        target.perform(action, with: command)
    }
}

/// The hinge of the iPhone Duo a test puts the map screen in: the fold it
/// reserves, in window coordinates, which the test can open and close.
@Observable
private final class TestHinge {
    var fold: CGRect?

    init(fold: CGRect? = nil) {
        self.fold = fold
    }
}

/// The map screen beside the fold of a test's hinge.
private struct HingedScreen: View {
    let model: ScooterMapModel
    let hinge: TestHinge

    var body: some View {
        ScooterMapScreen(model: model, fold: hinge.fold)
    }
}

// Asking for a rating when the rider is back from a ride.
extension ScooterMapModelTests {
    func testAReturnFromARideIsTheMomentOnceTheMapIsCalmWithAFreshFeed() async throws {
        let clock = TestClock()
        let (model, api) = await reviewModel(clock: clock)

        // Back within minutes: the rental mostly did not happen.
        await returnFromRide(model, api, after: 2 * 60, clock: clock)
        XCTAssertEqual(model.reviewMoments, 0)

        // Back to the card of a scooter still on the map: the rider is choosing.
        let id = try XCTUnwrap(model.mapScooters.first?.id)
        model.selectScooter(id)
        await returnFromRide(model, api, after: 20 * 60, clock: clock)
        XCTAssertEqual(model.reviewMoments, 0)

        // That return was its one try; the next ride's return, to the map at rest, is the moment.
        model.clearSelection()
        await returnFromRide(model, api, after: 20 * 60, clock: clock)
        XCTAssertEqual(model.reviewMoments, 1)
        XCTAssertTrue(model.reviewDue)
        XCTAssertTrue(model.takeReviewMoment())
        XCTAssertFalse(model.takeReviewMoment())

        // This version asked.
        await returnFromRide(model, api, after: 20 * 60, clock: clock)
        XCTAssertEqual(model.reviewMoments, 1)
    }

    func testAFailedRefreshKeepsTheRestOfTheDayFromAsking() async throws {
        let clock = TestClock()
        let (model, api) = await reviewModel(clock: clock)

        await api.setFailure(.offline)
        await returnFromRide(model, api, after: 20 * 60, clock: clock)
        XCTAssertNotNil(model.loadIssue)
        XCTAssertEqual(model.reviewMoments, 0)

        // Back online later that day: still no ask.
        await api.setFailure(nil)
        await returnFromRide(model, api, after: 20 * 60, clock: clock)
        XCTAssertNil(model.loadIssue)
        XCTAssertEqual(model.reviewMoments, 0)

        // The next day, a calm return asks.
        clock.advance(86_400)
        await returnFromRide(model, api, after: 20 * 60, clock: clock)
        XCTAssertEqual(model.reviewMoments, 1)
    }

    /// A model with a fresh feed on the map and two earlier days with one: the third day.
    private func reviewModel(clock: TestClock) async -> (ScooterMapModel, StubScooterAPI) {
        let defaults = isolatedDefaults()
        let earlier = ScooterReviewPrompt(defaults: defaults, version: ScooterLinks.appVersion)
        earlier.noteUse(at: clock.now.addingTimeInterval(-2 * 86_400))
        earlier.noteUse(at: clock.now.addingTimeInterval(-86_400))
        let api = StubScooterAPI(response: ScooterResponse(vehicles: [scooter(id: "one", provider: "lime")]))
        let model = ScooterMapModel(api: api, locationManager: CLLocationManager(), defaults: defaults, now: { clock.now })
        model.refresh()
        let loaded = await waitUntil { model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        XCTAssertEqual(model.reviewMoments, 0, "Not without a ride")
        return (model, api)
    }

    /// "Open in", the app in the background for `seconds`, then in front again until the refresh is in.
    private func returnFromRide(
        _ model: ScooterMapModel,
        _ api: StubScooterAPI,
        after seconds: TimeInterval,
        clock: TestClock
    ) async {
        model.rentalOpened()
        model.becameInactive()
        clock.advance(seconds)
        let calls = await api.snapshot().calls
        model.becameActive()
        let refreshed = await waitUntil { await api.snapshot().calls == calls + 1 && !model.isLoading }
        XCTAssertTrue(refreshed)
    }
}
