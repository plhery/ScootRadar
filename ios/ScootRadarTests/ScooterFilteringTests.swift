import MapKit
import XCTest
@testable import ScootRadar

final class ScooterFilteringTests: XCTestCase {
    private let viewport = GeoBounds(region: MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 47.3769, longitude: 8.5417),
        span: MKCoordinateSpan(latitudeDelta: 0.02, longitudeDelta: 0.02)
    ))

    func testBatteryAndProviderFilteringForMapAnnotations() {
        let scooters = [
            scooter(id: "lime-high", provider: "lime", battery: 80),
            scooter(id: "lime-low", provider: "lime", battery: 20),
            scooter(id: "bird-high", provider: "bird", battery: 90),
            scooter(id: "unknown", provider: "future-provider", battery: 95)
        ]

        let filtered = ScooterFiltering.mapScooters(
            from: scooters,
            minimumBattery: 50,
            enabledProviders: [.lime]
        )

        XCTAssertEqual(filtered.map(\.id), ["lime:lime-high"])
    }

    func testVisibleSummaryCountsOnlyViewportButKeepsProviderBreakdown() {
        let scooters = [
            scooter(id: "lime-inside", provider: "lime", battery: 80),
            scooter(id: "bird-inside", provider: "bird", battery: 90),
            scooter(id: "bird-outside", provider: "bird", battery: 90, latitude: 47.5),
            scooter(id: "lime-low", provider: "lime", battery: 10)
        ]

        let summary = ScooterFiltering.visibleSummary(
            for: scooters,
            viewport: viewport,
            minimumBattery: 50,
            enabledProviders: [.lime]
        )

        XCTAssertEqual(summary.count, 1)
        XCTAssertEqual(summary.providerCounts[.lime], 1)
        XCTAssertEqual(summary.providerCounts[.bird], 1)
    }

    func testUnknownProvidersRemainVisibleWhenNoProviderIsSelected() {
        let summary = ScooterFiltering.visibleSummary(
            for: [scooter(id: "unknown", provider: "future-provider", battery: 70)],
            viewport: viewport,
            minimumBattery: 0,
            enabledProviders: Set(ScooterProvider.allCases)
        )

        XCTAssertEqual(summary.count, 1)
        XCTAssertTrue(summary.providerCounts.isEmpty)
    }

    func testMultipleProvidersCanBeEnabledTogether() {
        let scooters = [
            scooter(id: "lime", provider: "lime", battery: 80),
            scooter(id: "bird", provider: "bird", battery: 80),
            scooter(id: "voi", provider: "voi", battery: 80)
        ]

        let filtered = ScooterFiltering.mapScooters(
            from: scooters,
            minimumBattery: 0,
            enabledProviders: [.lime, .bird]
        )

        XCTAssertEqual(Set(filtered.map(\.provider)), Set(["lime", "bird"]))
    }

    func testClusteringStopsAfterZoomFifteen() {
        XCTAssertTrue(ScooterClusteringPolicy.shouldCluster(at: 10))
        XCTAssertTrue(ScooterClusteringPolicy.shouldCluster(at: 15))
        XCTAssertFalse(ScooterClusteringPolicy.shouldCluster(at: 15.01))
        XCTAssertFalse(ScooterClusteringPolicy.shouldCluster(at: 20))
    }

    @MainActor
    func testMapStartsWithASizeSoItOpensOnSwitzerland() {
        // A map created without a size drops the region it is given.
        XCTAssertFalse(ScooterMapCameraPolicy.openingFrame.isEmpty)

        let mapView = MKMapView(frame: ScooterMapCameraPolicy.openingFrame)
        mapView.setRegion(ScooterMapStart.switzerland.region, animated: false)
        ScooterMapCameraPolicy.applyOpeningPitch(to: mapView)

        let center = mapView.camera.centerCoordinate
        XCTAssertEqual(center.latitude, ScooterMapModel.switzerlandCenter.latitude, accuracy: 0.5)
        XCTAssertEqual(center.longitude, ScooterMapModel.switzerlandCenter.longitude, accuracy: 0.5)
    }

    @MainActor
    func testMapOpensOnTheCityOfTheTimeZone() throws {
        let start = ScooterStartPlace.start(forTimeZone: "Europe/Berlin")
        let berlin = try XCTUnwrap(ScooterCityCatalog.cities.first { $0.id == "de:Berlin" })
        let mapView = MKMapView(frame: ScooterMapCameraPolicy.openingFrame)
        mapView.setRegion(start.region, animated: false)
        ScooterMapCameraPolicy.applyOpeningPitch(to: mapView)

        let center = mapView.camera.centerCoordinate
        XCTAssertEqual(center.latitude, berlin.center.latitude, accuracy: 0.02)
        XCTAssertEqual(center.longitude, berlin.center.longitude, accuracy: 0.02)
        XCTAssertEqual(start.zoom, ScooterStartPlace.cityZoom)
    }

    @MainActor
    func testCentringAScooterShowsItInTheMapLeftVisibleAboveTheDock() {
        let scooter = CLLocationCoordinate2D(latitude: 47.3769, longitude: 8.5417)
        let mapView = MKMapView(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        mapView.setRegion(
            MKCoordinateRegion(center: scooter, latitudinalMeters: 850, longitudinalMeters: 850),
            animated: false
        )

        // The search bar ends at 110 pt and a tall card begins at 380 pt: the middle is at 245 pt.
        let center = ScooterMapCameraPolicy.center(
            showing: scooter, on: mapView, visible: CGRect(x: 0, y: 110, width: 390, height: 270)
        )
        XCTAssertLessThan(center.latitude, scooter.latitude)
        XCTAssertEqual(center.longitude, scooter.longitude, accuracy: 0.0001)

        mapView.setCenter(center, animated: false)
        let shown = mapView.convert(scooter, toPointTo: mapView)
        XCTAssertEqual(shown.y, 245, accuracy: 3)
        XCTAssertEqual(shown.x, 195, accuracy: 3)

        // Nothing covers the map, or nearly all of it is covered: the scooter itself is the centre.
        let uncovered = ScooterMapCameraPolicy.center(
            showing: scooter, on: mapView, visible: CGRect(x: 0, y: 0, width: 390, height: 844)
        )
        XCTAssertEqual(uncovered.latitude, scooter.latitude, accuracy: 0.000_001)
        let covered = ScooterMapCameraPolicy.center(
            showing: scooter, on: mapView, visible: CGRect(x: 0, y: 400, width: 390, height: 20)
        )
        XCTAssertEqual(covered.latitude, scooter.latitude, accuracy: 0.000_001)
    }

    func testWithoutAPanelTheMapLeftVisibleIsTheBandBetweenTheSearchBarAndTheDock() {
        let phone = CGRect(x: 0, y: 0, width: 390, height: 844)
        let band = CGRect(x: 0, y: 110, width: 390, height: 270)
        XCTAssertEqual(ScooterMapCameraPolicy.visibleRect(in: phone, top: 110, bottom: 380, beside: nil), band)
        XCTAssertEqual(ScooterMapCameraPolicy.visibleRect(in: phone, top: 110, bottom: 380, beside: .null), band)
        XCTAssertEqual(ScooterMapCameraPolicy.visibleRect(in: phone, top: 110, bottom: 380, beside: .zero), band)
    }

    func testBesideAPanelTheMapLeftVisibleStartsWhereThePanelEnds() {
        let window = CGRect(x: 0, y: 0, width: 1376, height: 1032)
        // A short panel still takes its side of the map from top to bottom:
        // a card opened in it may grow down.
        let leading = ScooterMapCameraPolicy.visibleRect(
            in: window, top: 24, bottom: 1032, beside: CGRect(x: 16, y: 40, width: 380, height: 300)
        )
        XCTAssertEqual(leading, CGRect(x: 396, y: 24, width: 980, height: 1008))

        // Right to left the panel is on the right.
        let trailing = ScooterMapCameraPolicy.visibleRect(
            in: window, top: 24, bottom: 1032, beside: CGRect(x: 980, y: 40, width: 380, height: 300)
        )
        XCTAssertEqual(trailing, CGRect(x: 0, y: 24, width: 980, height: 1008))
    }

    func testSpansChosenOnAPhoneAreUnchangedOnEveryPhone() {
        // Every iPhone's shorter side, the widest the Pro Max's.
        for width: CGFloat in [320, 375, 390, 393, 402, 414, 428, 430, 440] {
            XCTAssertEqual(ScooterMapCameraPolicy.spanScale(across: width), 1, "\(width)")
        }
    }

    func testALargerMapShowsMoreGroundAroundTheSameStreets() {
        XCTAssertEqual(ScooterMapCameraPolicy.spanScale(across: 466), 466.0 / 440, accuracy: 0.000_1)
        XCTAssertEqual(ScooterMapCameraPolicy.spanScale(across: 744), 744.0 / 440, accuracy: 0.000_1)
        XCTAssertEqual(ScooterMapCameraPolicy.spanScale(across: 1032), 1032.0 / 440, accuracy: 0.000_1)
        XCTAssertLessThan(
            ScooterMapCameraPolicy.spanScale(across: 669),
            ScooterMapCameraPolicy.spanScale(across: 1032)
        )
    }

    @MainActor
    func testCentringAScooterBesideAPanelShowsItInTheMiddleOfTheMapLeftVisible() {
        let scooter = CLLocationCoordinate2D(latitude: 47.3769, longitude: 8.5417)
        let mapView = MKMapView(frame: CGRect(x: 0, y: 0, width: 1376, height: 1032))
        mapView.setRegion(
            MKCoordinateRegion(center: scooter, latitudinalMeters: 850, longitudinalMeters: 850),
            animated: false
        )

        // A panel 380 pt wide 16 pt from the edge: the middle of the rest is at 886 pt.
        let center = ScooterMapCameraPolicy.center(
            showing: scooter, on: mapView, visible: CGRect(x: 396, y: 0, width: 980, height: 1032)
        )
        mapView.setCenter(center, animated: false)
        let shown = mapView.convert(scooter, toPointTo: mapView)
        XCTAssertEqual(shown.x, 886, accuracy: 3)
        XCTAssertEqual(shown.y, 516, accuracy: 3)
    }

    @MainActor
    func testARegionBesideAPanelIsShownInTheMiddleOfTheMapLeftVisibleAtTheSameZoom() {
        let scooter = CLLocationCoordinate2D(latitude: 47.3769, longitude: 8.5417)
        let region = MKCoordinateRegion(center: scooter, latitudinalMeters: 850, longitudinalMeters: 850)
        let bounds = CGRect(x: 0, y: 0, width: 1376, height: 1032)

        // As on a phone: the band between the search bar and the dock leaves
        // the sides alone, and the region is MapKit's own.
        let alone = MKMapView(frame: bounds)
        ScooterMapCameraPolicy.setRegionPreservingPerspective(
            region, on: alone, animated: false, visible: CGRect(x: 0, y: 110, width: 1376, height: 700)
        )
        let centred = alone.convert(scooter, toPointTo: alone)
        XCTAssertEqual(centred.x, 688, accuracy: 3)
        XCTAssertEqual(centred.y, 516, accuracy: 3)

        let beside = MKMapView(frame: bounds)
        ScooterMapCameraPolicy.setRegionPreservingPerspective(
            region, on: beside, animated: false, visible: CGRect(x: 396, y: 24, width: 980, height: 1008)
        )
        let shown = beside.convert(scooter, toPointTo: beside)
        XCTAssertEqual(shown.x, 886, accuracy: 3)
        XCTAssertEqual(shown.y, 516, accuracy: 3)
        XCTAssertEqual(
            beside.camera.centerCoordinateDistance,
            alone.camera.centerCoordinateDistance,
            accuracy: alone.camera.centerCoordinateDistance * 0.01
        )
    }

    @MainActor
    func testFocusRequestWaitsUntilTheMapHasASize() {
        let request = MapFocusRequest(
            point: GeoPoint(latitude: 47.3769, longitude: 8.5417),
            token: 7,
            latitudinalMeters: 350,
            longitudinalMeters: 350
        )
        let parent = ScooterMapView(
            scooters: [],
            scooterRevision: 0,
            clusters: [],
            clusterRevision: 0,
            usesServerClusters: false,
            mapStyle: .standard,
            showsUserLocation: false,
            focusRequest: request,
            destination: nil,
            selectedScooterID: nil,
            onRegionChange: { _, _, _ in },
            onSelectionChange: { _ in }
        )
        let coordinator = ScooterMapView.Coordinator(parent: parent)
        let mapView = MKMapView(frame: .zero)

        // Before the first layout the request is kept for later, not dropped.
        coordinator.applyFocus(request, on: mapView)
        XCTAssertNil(coordinator.lastFocusToken)

        // The region change that follows the layout applies it.
        mapView.frame = ScooterMapCameraPolicy.openingFrame
        coordinator.mapView(mapView, regionDidChangeAnimated: false)
        XCTAssertEqual(coordinator.lastFocusToken, 7)
    }

    @MainActor
    func testAnnotationPinsCannotBeHiddenByCollisions() {
        let view = ScooterAnnotationView(annotation: nil, reuseIdentifier: nil)

        XCTAssertEqual(view.bounds.size, ScooterAnnotationView.markerSize)
        XCTAssertLessThan(view.bounds.width, 46)
        XCTAssertEqual(view.centerOffset, .zero)
        XCTAssertFalse(view.layer.sublayers?.contains(where: { $0 is CAGradientLayer }) == true)
        XCTAssertEqual(view.collisionMode, .none)
        XCTAssertEqual(view.displayPriority, .required)
        XCTAssertEqual(view.zPriority, .defaultUnselected)
        XCTAssertEqual(view.selectedZPriority, ScooterAnnotationView.selectedMarkerZPriority)
        XCTAssertNil(view.clusteringIdentifier)

        view.setClusteringEnabled(true)

        XCTAssertEqual(view.collisionMode, .circle)
        XCTAssertEqual(view.displayPriority, .defaultHigh)
        XCTAssertEqual(view.clusteringIdentifier, ScooterAnnotationView.clusteringIdentifier)
    }

    @MainActor
    func testScootersLastSeenLieFadedUnderTheOthersAndAreNotTappedThemselves() throws {
        let annotation = ScooterLastSeenAnnotation(
            id: "v:lime:seen",
            coordinate: CLLocationCoordinate2D(latitude: 47.3769, longitude: 8.5417),
            mark: .scooter(.lime)
        )
        let view = ScooterLastSeenView(annotation: annotation, reuseIdentifier: nil)
        let live = ScooterAnnotationView(annotation: nil, reuseIdentifier: nil)

        XCTAssertEqual(view.zPriority, .min)
        XCTAssertLessThan(view.zPriority.rawValue, live.zPriority.rawValue)
        XCTAssertEqual(view.displayPriority, .required)
        XCTAssertEqual(view.collisionMode, .none)
        XCTAssertNil(view.clusteringIdentifier)
        XCTAssertFalse(view.isEnabled)
        XCTAssertFalse(view.isUserInteractionEnabled)
        XCTAssertFalse(view.isAccessibilityElement)
        XCTAssertTrue(view.accessibilityElementsHidden)
        XCTAssertFalse(view.canShowCallout)
        // A 10 pt dot inside a ring of 1.5 pt.
        XCTAssertEqual(
            ScooterDotArt.lastSeenImage(for: .init(provider: .lime, isDark: false)).size,
            CGSize(width: 13, height: 13)
        )
        XCTAssertEqual(
            ScooterDotArt.lastSeenClusterImage(for: .init(provider: .lime, diameter: 40, isDark: true)).size,
            CGSize(width: 40, height: 40)
        )

        // Nothing known of its app, or nothing on its way for it: it stands still, even on screen.
        let scene = try XCTUnwrap(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let window = UIWindow(windowScene: scene)
        window.addSubview(view)
        let faded = try XCTUnwrap(view.subviews.first)
        XCTAssertNil(faded.layer.animation(forKey: "breath"))
        XCTAssertEqual(faded.layer.opacity, ScooterLastSeenView.idleDot)
        let seenAt = Date().addingTimeInterval(-600)
        annotation.update(coordinate: annotation.coordinate, mark: .scooter(.lime, status: ScooterLastSeenStatus(seenAt: seenAt, updating: false)))
        view.refreshAppearance()
        XCTAssertNil(faded.layer.animation(forKey: "breath"))
        XCTAssertEqual(faded.layer.opacity, ScooterLastSeenView.idleDot)
        // VoiceOver reads it as its tip says it, now that its app is known.
        let idleTip = ScooterLastSeenTip(provider: .lime, status: ScooterLastSeenStatus(seenAt: seenAt, updating: false))
        XCTAssertTrue(view.isAccessibilityElement)
        XCTAssertFalse(view.accessibilityElementsHidden)
        XCTAssertEqual(view.accessibilityLabel, idleTip.title)
        XCTAssertEqual(view.accessibilityValue, idleTip.body)

        // New positions on their way: it breathes in light and size, and stands still with Reduce Motion.
        let updating = ScooterLastSeenStatus(seenAt: seenAt, updating: true)
        annotation.update(coordinate: annotation.coordinate, mark: .scooter(.lime, status: updating))
        view.refreshAppearance()
        XCTAssertEqual(view.accessibilityValue, ScooterLastSeenTip(provider: .lime, status: updating).body)
        if UIAccessibility.isReduceMotionEnabled {
            XCTAssertNil(faded.layer.animation(forKey: "breath"))
            XCTAssertEqual(faded.layer.opacity, ScooterLastSeenView.still)
        } else {
            let breath = try XCTUnwrap(faded.layer.animation(forKey: "breath") as? CAAnimationGroup)
            XCTAssertEqual(breath.duration, 1.4)
            XCTAssertTrue(breath.autoreverses)
            XCTAssertEqual(breath.repeatCount, .infinity)
            let parts = try XCTUnwrap(breath.animations as? [CABasicAnimation])
            let light = try XCTUnwrap(parts.first { $0.keyPath == "opacity" })
            XCTAssertEqual(light.fromValue as? Float, 0.25)
            XCTAssertEqual(light.toValue as? Float, 0.75)
            let size = try XCTUnwrap(parts.first { $0.keyPath == "transform.scale" })
            XCTAssertEqual(size.fromValue as? CGFloat, 0.8)
            XCTAssertEqual(size.toValue as? CGFloat, 1.2)
        }
        view.removeFromSuperview()
        XCTAssertNil(faded.layer.animation(forKey: "breath"))

        // Back to nothing on its way: still again.
        window.addSubview(view)
        annotation.update(coordinate: annotation.coordinate, mark: .scooter(.lime, status: updating.idle))
        view.refreshAppearance()
        XCTAssertNil(faded.layer.animation(forKey: "breath"))
        XCTAssertEqual(faded.layer.opacity, ScooterLastSeenView.idleDot)
        view.removeFromSuperview()

        // A group is passed by.
        let group = ScooterLastSeenView(
            annotation: ScooterLastSeenAnnotation(
                id: "c:seen", coordinate: annotation.coordinate, mark: .group(count: 12, provider: .lime, updating: true)
            ),
            reuseIdentifier: nil
        )
        XCTAssertFalse(group.isAccessibilityElement)
        XCTAssertTrue(group.accessibilityElementsHidden)
    }

    @MainActor
    func testOnlyFadedMarkersWhoseNewPositionsAreOnTheirWayBreathe() {
        let updating = ScooterLastSeenStatus(seenAt: Date(timeIntervalSince1970: 1_790_000_000), updating: true)
        typealias Look = ScooterLastSeenView
        XCTAssertEqual(Look.pose(for: .scooter(.ryde, status: updating), reduceMotion: false), .breathing(Look.dotBreath))
        XCTAssertEqual(Look.pose(for: .scooter(.ryde, status: updating), reduceMotion: true), .still(Look.still))
        XCTAssertEqual(Look.pose(for: .scooter(.ryde, status: updating.idle), reduceMotion: false), .still(Look.idleDot))
        XCTAssertEqual(Look.pose(for: .scooter(.ryde), reduceMotion: false), .still(Look.idleDot))
        XCTAssertEqual(Look.pose(for: .group(count: 9, provider: .lime, updating: true), reduceMotion: false), .breathing(Look.groupBreath))
        XCTAssertEqual(Look.pose(for: .group(count: 9, provider: .lime, updating: true), reduceMotion: true), .still(Look.still))
        XCTAssertEqual(Look.pose(for: .group(count: 9, provider: .lime), reduceMotion: false), .still(Look.idleGroup))

        XCTAssertEqual(Look.dotBreath, .init(faintest: 0.25, strongest: 0.75, smallest: 0.8, largest: 1.2))
        XCTAssertEqual(Look.groupBreath, .init(faintest: 0.45, strongest: 0.85, smallest: 0.95, largest: 1.05))
        XCTAssertEqual(Look.idleDot, 0.42)
        XCTAssertEqual(Look.idleGroup, 0.6)
        XCTAssertEqual(Look.still, 0.55)

        // A group breathes while any app among it is updating.
        let cluster = ScooterCluster(id: "seen", latitude: 47.38, longitude: 8.54, count: 12, providers: ["lime": 5, "bird": 7])
        XCTAssertEqual(ScooterLastSeenAnnotation.Mark.group(of: cluster, statuses: [.lime: updating]),
                       .group(count: 12, provider: .bird, updating: true))
        XCTAssertEqual(ScooterLastSeenAnnotation.Mark.group(of: cluster, statuses: [.lime: updating.idle]),
                       .group(count: 12, provider: .bird, updating: false))
    }

    @MainActor
    func testAChipWithNoneOfItsOwnCountedShowsItsFadedOnesGreyedAndSaysSo() {
        let seenAt = Date().addingTimeInterval(-600)
        let updating = ScooterProviderEntry.Faded(count: 44, seenAt: seenAt, updating: true)
        XCTAssertEqual(ScooterProviderEntry.Faded.shown(count: 0, faded: updating), updating)
        XCTAssertNil(ScooterProviderEntry.Faded.shown(count: 3, faded: updating))
        XCTAssertNil(ScooterProviderEntry.Faded.shown(count: 0, faded: nil))

        XCTAssertEqual(updating.note, String(localized: "updating…"))
        let idle = ScooterProviderEntry.Faded(count: 44, seenAt: seenAt, updating: false)
        XCTAssertEqual(idle.note, String(format: String(localized: "last seen %@"), ScooterDockStatus.seenTime(seenAt)))
        for faded in [updating, idle] {
            XCTAssertTrue(faded.accessibilityText.contains("44"), faded.accessibilityText)
            XCTAssertTrue(faded.accessibilityText.contains(ScooterDockStatus.seenTime(seenAt)), faded.accessibilityText)
        }
        XCTAssertNotEqual(updating.accessibilityText, idle.accessibilityText)
    }

    @MainActor
    func testFadedMarkersAreKeptAndMovedWhileTheirScootersStay() {
        let parent = ScooterMapView(
            scooters: [],
            scooterRevision: 0,
            clusters: [],
            clusterRevision: 0,
            usesServerClusters: true,
            mapStyle: .standard,
            showsUserLocation: false,
            focusRequest: nil,
            destination: nil,
            selectedScooterID: nil,
            onRegionChange: { _, _, _ in },
            onSelectionChange: { _ in }
        )
        let coordinator = ScooterMapView.Coordinator(parent: parent)
        let mapView = MKMapView()
        let seen = scooter(id: "seen", provider: "lime", battery: 80)
        let group = ScooterCluster(id: "seen:13:4290:2868", latitude: 47.38, longitude: 8.54,
            count: 12, providers: ["lime": 5, "bird": 7])
        func faded() -> [ScooterLastSeenAnnotation] {
            mapView.annotations.compactMap { $0 as? ScooterLastSeenAnnotation }.sorted { $0.id < $1.id }
        }

        coordinator.reconcileLastSeen([seen], [group], revision: 1, on: mapView)
        let first = faded()
        XCTAssertEqual(first.map(\.id), ["c:seen:13:4290:2868", "v:lime:seen"])
        // The ring takes the colour of the provider with the most of them.
        XCTAssertEqual(first[0].mark, .group(count: 12, provider: .bird))
        XCTAssertEqual(first[1].mark, .scooter(.lime))

        // The same revision changes nothing.
        coordinator.reconcileLastSeen([], [], revision: 1, on: mapView)
        XCTAssertEqual(faded().count, 2)

        // A scooter that moved keeps its marker; a group that went takes its marker with it.
        let moved = scooter(id: "seen", provider: "lime", battery: 80, latitude: 47.3779)
        coordinator.reconcileLastSeen([moved], [], revision: 2, on: mapView)
        let second = faded()
        XCTAssertEqual(second.map(\.id), ["v:lime:seen"])
        XCTAssertTrue(second[0] === first[1])
        XCTAssertEqual(second[0].coordinate.latitude, 47.3779)

        coordinator.reconcileLastSeen([], [], revision: 3, on: mapView)
        XCTAssertTrue(faded().isEmpty)

        // What is known of their apps changes their marks at the same revision.
        let updating = ScooterLastSeenStatus(seenAt: Date().addingTimeInterval(-600), updating: true)
        coordinator.reconcileLastSeen([seen], [group], revision: 4, on: mapView)
        coordinator.reconcileLastSeen([seen], [group], revision: 4, statuses: [.lime: updating], on: mapView)
        let third = faded()
        XCTAssertEqual(third[0].mark, .group(count: 12, provider: .bird, updating: true))
        XCTAssertEqual(third[1].mark, .scooter(.lime, status: updating))
    }

    @MainActor
    func testATappedFadedScooterOpensItsTipWhichFollowsWhatIsKnownAndGoesWithIt() throws {
        let parent = ScooterMapView(
            scooters: [],
            scooterRevision: 0,
            clusters: [],
            clusterRevision: 0,
            usesServerClusters: true,
            mapStyle: .standard,
            showsUserLocation: false,
            focusRequest: nil,
            destination: nil,
            selectedScooterID: nil,
            onRegionChange: { _, _, _ in },
            onSelectionChange: { _ in }
        )
        let coordinator = ScooterMapView.Coordinator(parent: parent)
        let mapView = MKMapView(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        let seen = scooter(id: "seen", provider: "ryde", battery: 80)
        let group = ScooterCluster(id: "seen:13:4290:2868", latitude: 47.38, longitude: 8.54, count: 12, providers: ["ryde": 12])
        let updating = ScooterLastSeenStatus(seenAt: Date().addingTimeInterval(-600), updating: true)
        coordinator.reconcileLastSeen([seen], [group], revision: 1, statuses: [.ryde: updating], on: mapView)
        let annotations = mapView.annotations.compactMap { $0 as? ScooterLastSeenAnnotation }
        let dot = try XCTUnwrap(annotations.first { $0.id == "v:ryde:seen" })
        let ring = try XCTUnwrap(annotations.first { $0.id.hasPrefix("c:") })

        coordinator.showFadedTip(for: dot, on: mapView)
        let tip = try XCTUnwrap(coordinator.fadedTipView)
        XCTAssertTrue(tip.superview === mapView)
        XCTAssertFalse(tip.isHidden)
        XCTAssertFalse(tip.isUserInteractionEnabled, "The map under it keeps its touches")
        XCTAssertEqual(tip.tip, ScooterLastSeenTip(provider: .ryde, status: updating))
        XCTAssertEqual(tip.accessibilityLabel, tip.tip?.title)
        XCTAssertEqual(coordinator.fadedTipID, dot.id)
        XCTAssertLessThanOrEqual(tip.bounds.width, ScooterLastSeenTipView.maximumWidth)
        XCTAssertGreaterThanOrEqual(tip.frame.minX, ScooterLastSeenTipView.margin)
        XCTAssertLessThanOrEqual(tip.frame.maxX, mapView.bounds.width - ScooterLastSeenTipView.margin)

        // It says what is now known: nothing more on its way.
        coordinator.reconcileLastSeen([seen], [group], revision: 1, statuses: [.ryde: updating.idle], on: mapView)
        XCTAssertEqual(tip.tip?.body, String(localized: "May have moved since"))
        XCTAssertFalse(tip.isHidden)

        // A group has no tip.
        coordinator.showFadedTip(for: ring, on: mapView)
        XCTAssertTrue(tip.isHidden)
        XCTAssertNil(coordinator.fadedTipID)

        // The scooter gone, its tip goes with it.
        coordinator.showFadedTip(for: dot, on: mapView)
        XCTAssertFalse(tip.isHidden)
        coordinator.reconcileLastSeen([], [], revision: 2, statuses: [.ryde: updating.idle], on: mapView)
        XCTAssertTrue(tip.isHidden)
        XCTAssertNil(coordinator.fadedTipID)

        // Of a scooter whose app is not known, none.
        coordinator.reconcileLastSeen([seen], [], revision: 3, on: mapView)
        let unknown = try XCTUnwrap(mapView.annotations.compactMap { $0 as? ScooterLastSeenAnnotation }.first)
        coordinator.showFadedTip(for: unknown, on: mapView)
        XCTAssertTrue(tip.isHidden)
    }

    @MainActor
    func testSelectedScooterTakesItsRingAndReturnsToItsDot() {
        let annotation = ScooterMapAnnotation(scooter: scooter(id: "voi", provider: "voi", battery: 82))
        let view = ScooterAnnotationView(annotation: annotation, reuseIdentifier: nil)
        XCTAssertEqual(view.art?.state, .plain)
        XCTAssertEqual(view.art?.diameter, ScooterMapLook.plainDiameter)

        annotation.look = ScooterMapLook.look(metres: 400, state: .selected, metresPerPoint: 1.07)
        annotation.pill = ScooterNamePillView.Content(
            provider: .voi, name: "Voi", time: "5 min", isFilled: true, isDark: false
        )
        annotation.pillOrigin = ScooterMapLook.pillOrigin(.right, width: 80, reach: annotation.look.footprint / 2)
        view.refreshLook(animated: false)

        XCTAssertEqual(view.art?.state, .selected)
        XCTAssertEqual(view.art?.diameter, 16)
        XCTAssertEqual(view.zPriority, ScooterAnnotationView.selectedMarkerZPriority)
        // The name stands beside the dot, clear of its ring, and the marker itself keeps its size.
        let name = try? XCTUnwrap(view.pillFrame)
        XCTAssertEqual(name?.height, ScooterMapLook.pillHeight)
        XCTAssertGreaterThanOrEqual(name?.minX ?? 0, view.bounds.midX + annotation.look.footprint / 2)
        view.setSelected(true, animated: false)
        XCTAssertEqual(view.transform, .identity)

        annotation.look = ScooterMapLook.look(metres: 400, state: .plain, metresPerPoint: 1.07)
        annotation.pill = nil
        view.setSelected(false, animated: false)
        view.refreshLook(animated: false)

        XCTAssertEqual(view.art?.state, .plain)
        XCTAssertEqual(view.art?.diameter, 8)
        XCTAssertNil(view.pillFrame)
    }

    @MainActor
    func testTheDotTakesItsProviderWhenScooterAnnotationsAreReused() {
        let view = ScooterAnnotationView(
            annotation: ScooterMapAnnotation(scooter: scooter(id: "bolt", provider: "bolt", battery: 82)),
            reuseIdentifier: nil
        )
        XCTAssertEqual(view.art?.provider, .bolt)
        // The letters are part of the picture, and nothing of it is read out on its own.
        XCTAssertTrue(view.subviews.isEmpty)

        for (provider, expected) in [("bird", ScooterProvider.bird), ("publibike", .publibike), ("lime", .lime), ("unknown", nil)] {
            view.prepareForReuse()
            XCTAssertNil(view.art)
            let annotation = ScooterMapAnnotation(scooter: scooter(id: provider, provider: provider, battery: 82))
            // Close up, where each dot carries its provider's initials.
            annotation.look = ScooterMapLook.look(metres: nil, state: .plain, metresPerPoint: 0.4)
            view.annotation = annotation
            view.layoutIfNeeded()

            XCTAssertEqual(view.art?.provider, expected)
            XCTAssertEqual(view.art?.showsInitials, true)
            XCTAssertEqual(view.art?.diameter, 20)
            XCTAssertEqual(view.bounds.size, ScooterAnnotationView.markerSize)
        }
    }

    @MainActor
    func testProviderInitialsAreWrittenInTheInkOfTheirColour() {
        let white = UIColor.white
        // White on the darker colours, Bolt's deep green among them since issue #13, near black on the bright ones.
        for provider in [ScooterProvider.publibike, .ride_mobility, .yoio, .jet, .bolt] {
            XCTAssertEqual(ScooterMapLook.ink(on: provider, isDark: false), white, provider.name)
            XCTAssertEqual(ScooterMapLook.ink(on: provider, isDark: true), white, provider.name)
        }
        for provider in [ScooterProvider.lime, .voi, .dott, .hopp] {
            XCTAssertNotEqual(ScooterMapLook.ink(on: provider, isDark: false), white, provider.name)
            XCTAssertNotEqual(ScooterMapLook.ink(on: provider, isDark: true), white, provider.name)
        }
        // Bird and Swing are near black by day and almost white on a dark map.
        for provider in [ScooterProvider.bird, .swing] {
            XCTAssertEqual(ScooterMapLook.ink(on: provider, isDark: false), white, provider.name)
            XCTAssertNotEqual(ScooterMapLook.ink(on: provider, isDark: true), white, provider.name)
        }
    }

    @MainActor
    func testUserLocationAlwaysRendersAboveScooterMarkers() {
        let userLocationView = MKAnnotationView(annotation: nil, reuseIdentifier: nil)

        ScooterMapView.Coordinator.prioritizeUserLocationView(userLocationView)

        XCTAssertEqual(userLocationView.displayPriority, .required)
        XCTAssertEqual(userLocationView.zPriority, .max)
        XCTAssertEqual(userLocationView.selectedZPriority, .max)
        XCTAssertGreaterThan(
            userLocationView.zPriority.rawValue,
            ScooterAnnotationView.selectedMarkerZPriority.rawValue
        )
    }

    func testCompassUsesTrueNorthAndFallsBackToMagneticNorth() throws {
        let north = try XCTUnwrap(ScooterUserHeading(trueHeading: 0, magneticHeading: 8, accuracy: 5))
        let fallback = try XCTUnwrap(ScooterUserHeading(trueHeading: -1, magneticHeading: 358, accuracy: 12))
        XCTAssertEqual(north.direction, 0)
        XCTAssertEqual(fallback.direction, 358)
        XCTAssertNil(ScooterUserHeading(trueHeading: 20, magneticHeading: 25, accuracy: -1))
        XCTAssertNil(ScooterUserHeading(trueHeading: 20, magneticHeading: 25, accuracy: 90))
        XCTAssertNil(ScooterUserHeading(trueHeading: -1, magneticHeading: -1, accuracy: 5))
        XCTAssertNil(ScooterUserHeading(trueHeading: .nan, magneticHeading: .nan, accuracy: 5))
    }

    func testCompassBeamWidensWithUncertainty() throws {
        let precise = try XCTUnwrap(ScooterUserHeading(trueHeading: 45, magneticHeading: 45, accuracy: 5))
        let uncertain = try XCTUnwrap(ScooterUserHeading(trueHeading: 45, magneticHeading: 45, accuracy: 50))
        let veryUncertain = try XCTUnwrap(ScooterUserHeading(trueHeading: 45, magneticHeading: 45, accuracy: 85))
        XCTAssertEqual(precise.halfAngle, 22 * .pi / 180, accuracy: 0.001)
        XCTAssertGreaterThan(uncertain.halfAngle, precise.halfAngle)
        XCTAssertEqual(veryUncertain.halfAngle, 60 * .pi / 180, accuracy: 0.001)
    }

    @MainActor
    func testCompassProjectionFollowsMapRotationAndPitch() throws {
        let coordinate = CLLocationCoordinate2D(latitude: 47.3769, longitude: 8.5417)
        let map = MKMapView(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        let camera = MKMapCamera(lookingAtCenter: coordinate, fromDistance: 500, pitch: 0, heading: 0)
        map.setCamera(camera, animated: false)

        func projectedAngle(_ direction: Double) throws -> Double {
            let heading = try XCTUnwrap(ScooterUserHeading(trueHeading: direction, magneticHeading: direction, accuracy: 5))
            let origin = map.convert(coordinate, toPointTo: map)
            let ahead = map.convert(heading.coordinateAhead(of: coordinate), toPointTo: map)
            return atan2(ahead.x - origin.x, origin.y - ahead.y) * 180 / .pi
        }

        XCTAssertEqual(try projectedAngle(0), 0, accuracy: 1)
        XCTAssertEqual(try projectedAngle(90), 90, accuracy: 1)
        XCTAssertEqual(try projectedAngle(359), -1, accuracy: 1)
        XCTAssertEqual(try projectedAngle(1), 1, accuracy: 1)

        camera.heading = 90
        map.setCamera(camera, animated: false)
        XCTAssertEqual(try projectedAngle(90), 0, accuracy: 1)
        XCTAssertEqual(try projectedAngle(0), -90, accuracy: 1)

        camera.heading = 0
        camera.pitch = 45
        map.setCamera(camera, animated: false)
        XCTAssertGreaterThan(try projectedAngle(45), 45)
        XCTAssertLessThan(try projectedAngle(45), 90)
    }

    @MainActor
    func testAnnotationAccessibilityDescribesAvailabilityAndSelection() throws {
        let scooter = Scooter(
            provider: "lime",
            latitude: 47.3769,
            longitude: 8.5417,
            battery: 82,
            rangeMeters: 12_500,
            vehicleID: "accessible",
            deepLink: nil,
            rentalURIs: nil,
            distanceMeters: 0
        )
        let view = ScooterAnnotationView(annotation: nil, reuseIdentifier: nil)
        view.annotation = ScooterMapAnnotation(scooter: scooter)

        XCTAssertEqual(
            view.accessibilityLabel,
            String(format: String(localized: "%@ scooter"), "Lime")
        )
        let value = try XCTUnwrap(view.accessibilityValue)
        XCTAssertTrue(value.contains(String(localized: "Battery")))
        XCTAssertTrue(value.contains(String(
            format: String(localized: "%lld percent"),
            Int64(82)
        )))
        // "Estimated" alone left open what the figure is, right after a distance.
        let range = try XCTUnwrap(scooter.formattedRange)
        XCTAssertTrue(value.contains("\(String(localized: "Estimated range")): \(range)"), value)
        XCTAssertFalse(view.accessibilityTraits.contains(.selected))

        view.setSelected(true, animated: false)

        XCTAssertTrue(view.accessibilityTraits.contains(.button))
        XCTAssertTrue(view.accessibilityTraits.contains(.selected))

        view.setSelected(false, animated: false)

        XCTAssertFalse(view.accessibilityTraits.contains(.selected))
    }

    @MainActor
    func testCityTotalsAreAnnouncedWithTheNameOfTheCity() {
        let zurich = ScooterCluster(id: "city:ch:zurich", latitude: 47.38, longitude: 8.54,
            count: 1_288, providers: ["lime": 1_288], city: "Zürich")
        let view = ScooterClusterAnnotationView(annotation: nil, reuseIdentifier: nil)
        view.annotation = ScooterServerClusterAnnotation(cluster: zurich)

        let label = view.accessibilityLabel ?? ""
        XCTAssertTrue(label.hasPrefix("Zürich, "), label)
        XCTAssertEqual(label, ScooterClusterAnnotationView.accessibilityLabel(count: 1_288, city: "Zürich"))
        XCTAssertTrue(view.accessibilityTraits.contains(.button))

        // A view reused for a city with the same numbers takes the new name.
        view.annotation = ScooterServerClusterAnnotation(cluster: ScooterCluster(
            id: "city:ch:bern", latitude: 46.948, longitude: 7.4474,
            count: 1_288, providers: ["lime": 1_288], city: "Bern"
        ))
        XCTAssertTrue(view.accessibilityLabel?.hasPrefix("Bern, ") == true)

        // A cluster inside a city has no name and keeps its count alone.
        view.annotation = ScooterServerClusterAnnotation(cluster: ScooterCluster(
            id: "13:4290:2868", latitude: 47.3769, longitude: 8.5417, count: 1_288, providers: ["lime": 1_288]
        ))
        XCTAssertEqual(
            view.accessibilityLabel,
            String(format: String(localized: "%@ scooters"), 1_288.formatted())
        )

        XCTAssertEqual(
            ScooterClusterAnnotationView.accessibilityLabel(count: 1, city: "Uster"),
            String(format: String(localized: "%@, one scooter"), "Uster")
        )
    }

    @MainActor
    func testBirdDotRemainsDistinctOnADarkMap() {
        let ground = ScooterMapLook.darkGround
        let originalContrast = ScooterMapLook.contrastRatio(
            between: ScooterProvider.bird.uiColor,
            and: ground
        )

        let dot = ScooterMapLook.dotColor(.bird, isDark: true)

        XCTAssertLessThan(originalContrast, 3.5)
        XCTAssertGreaterThanOrEqual(
            ScooterMapLook.contrastRatio(between: dot, and: ground),
            3.5
        )
    }

    @MainActor
    func testDelayedMapKitSelectionCannotReplaceTheDirectTapTarget() {
        let deadline = 11.0

        XCTAssertTrue(ScooterMapView.Coordinator.shouldSuppressMapKitSelection(
            candidateID: "voi:underneath",
            intendedID: "lime:tapped",
            until: deadline,
            now: 10.5
        ))
        XCTAssertFalse(ScooterMapView.Coordinator.shouldSuppressMapKitSelection(
            candidateID: "lime:tapped",
            intendedID: "lime:tapped",
            until: deadline,
            now: 10.5
        ))
        XCTAssertFalse(ScooterMapView.Coordinator.shouldSuppressMapKitSelection(
            candidateID: "voi:underneath",
            intendedID: "lime:tapped",
            until: deadline,
            now: deadline
        ))
        XCTAssertTrue(ScooterMapView.Coordinator.shouldSuppressMapKitSelection(
            candidateID: "voi:late",
            intendedID: nil,
            until: deadline,
            now: 10.5
        ))
    }

    @MainActor
    func testATapOnAClusterWithADotWithinReachDoesOneThing() {
        // On the cluster's bubble beside a dot: the cluster zooms in, and the dot is not chosen.
        XCTAssertTrue(ScooterMapView.Coordinator.tapMeansCluster(isOnCluster: true, isOnDot: false))
        // On the dot itself: the dot is chosen...
        XCTAssertFalse(ScooterMapView.Coordinator.tapMeansCluster(isOnCluster: true, isOnDot: true))
        XCTAssertFalse(ScooterMapView.Coordinator.tapMeansCluster(isOnCluster: false, isOnDot: false))
        // ...and the cluster MapKit selects after the tap stays shut.
        XCTAssertTrue(ScooterMapView.Coordinator.shouldSuppressClusterSelection(
            intendedID: "lime:tapped",
            until: 11,
            now: 10.5
        ))
        // A tap that chose no dot opens the cluster, and so does a later selection (VoiceOver).
        XCTAssertFalse(ScooterMapView.Coordinator.shouldSuppressClusterSelection(
            intendedID: nil,
            until: 11,
            now: 10.5
        ))
        XCTAssertFalse(ScooterMapView.Coordinator.shouldSuppressClusterSelection(
            intendedID: "lime:tapped",
            until: 11,
            now: 11
        ))
    }

    @MainActor
    func testTopChromeFrameExcludesUnderlyingMapInteractions() {
        let chromeFrame = CGRect(x: 12, y: 62, width: 369, height: 62)

        XCTAssertTrue(ScooterMapView.Coordinator.point(
            CGPoint(x: 200, y: 90),
            isInside: chromeFrame
        ))
        XCTAssertFalse(ScooterMapView.Coordinator.point(
            CGPoint(x: 200, y: 140),
            isInside: chromeFrame
        ))
        XCTAssertFalse(ScooterMapView.Coordinator.point(
            CGPoint(x: 0, y: 0),
            isInside: .null
        ))

        XCTAssertTrue(ScooterMapView.Coordinator.shouldSuppressAllMapKitSelections(
            until: 10,
            now: 9.99
        ))
        XCTAssertFalse(ScooterMapView.Coordinator.shouldSuppressAllMapKitSelections(
            until: 10,
            now: 10
        ))
    }

    @MainActor
    func testMapBackgroundTapClearsSelectionSynchronously() {
        var selectionChanges: [String?] = []
        let parent = ScooterMapView(
            scooters: [],
            scooterRevision: 0,
            clusters: [],
            clusterRevision: 0,
            usesServerClusters: false,
            mapStyle: .standard,
            showsUserLocation: false,
            focusRequest: nil,
            destination: nil,
            selectedScooterID: nil,
            onRegionChange: { _, _, _ in },
            onSelectionChange: { selectionChanges.append($0) }
        )
        let coordinator = ScooterMapView.Coordinator(parent: parent)
        let mapView = MKMapView()
        coordinator.applySelection("lime:tapped", on: mapView)

        coordinator.clearSelection(on: mapView)
        coordinator.clearSelection(on: mapView)

        XCTAssertEqual(selectionChanges.count, 1)
        XCTAssertNil(selectionChanges[0])
    }

    @MainActor
    func testMapBackgroundTapClosesTheSelectedParkingBay() {
        var parkingChanges: [String?] = []
        let bay = ScooterParking(id: "dott:bay", provider: "dott", name: "Rue Faidherbe",
            latitude: 50.63, longitude: 3.06, mandatory: true)
        let parent = ScooterMapView(
            scooters: [],
            scooterRevision: 0,
            clusters: [],
            clusterRevision: 0,
            usesServerClusters: false,
            mapStyle: .standard,
            showsUserLocation: false,
            focusRequest: nil,
            destination: nil,
            selectedScooterID: nil,
            onRegionChange: { _, _, _ in },
            onSelectionChange: { _ in },
            parking: [bay],
            onParkingSelectionChange: { parkingChanges.append($0) }
        )
        let coordinator = ScooterMapView.Coordinator(parent: parent)
        let mapView = MKMapView()
        coordinator.reconcileParking([bay], on: mapView)

        // Selecting from the model is not reported back to it.
        coordinator.applyParkingSelection(bay.id, on: mapView)
        XCTAssertTrue(parkingChanges.isEmpty)
        XCTAssertEqual(mapView.selectedAnnotations.count, 1)

        coordinator.clearSelection(on: mapView)
        coordinator.clearSelection(on: mapView)

        XCTAssertEqual(parkingChanges.count, 1)
        XCTAssertNil(parkingChanges[0])
        XCTAssertTrue(mapView.selectedAnnotations.isEmpty)
    }

    @MainActor
    func testParkingBaysOpenInTheDockWithoutACallout() throws {
        let bay = ScooterParking(id: "dott:bay", provider: "dott", name: "Rue Faidherbe",
            latitude: 50.63, longitude: 3.06, mandatory: true)
        let annotation = ScooterParkingAnnotation(parking: bay)
        let parent = ScooterMapView(
            scooters: [],
            scooterRevision: 0,
            clusters: [],
            clusterRevision: 0,
            usesServerClusters: false,
            mapStyle: .standard,
            showsUserLocation: false,
            focusRequest: nil,
            destination: nil,
            selectedScooterID: nil,
            onRegionChange: { _, _, _ in },
            onSelectionChange: { _ in }
        )
        let coordinator = ScooterMapView.Coordinator(parent: parent)
        let mapView = MKMapView()
        mapView.register(
            MKMarkerAnnotationView.self,
            forAnnotationViewWithReuseIdentifier: ScooterParkingAnnotation.reuseIdentifier
        )

        let view = try XCTUnwrap(coordinator.mapView(mapView, viewFor: annotation))

        XCTAssertFalse(view.canShowCallout)
        XCTAssertEqual(view.accessibilityLabel, "\(bay.bayTitle), Rue Faidherbe")
        XCTAssertEqual(annotation.title, bay.bayTitle)
        // Without the callout, the marker itself says what it does and what the rule is.
        XCTAssertEqual(view.accessibilityHint, String(localized: "Shows parking details"))
        XCTAssertEqual(view.accessibilityValue, String(localized: "You must park in a bay in this zone."))
        XCTAssertTrue(view.accessibilityTraits.contains(.button))
    }

    @MainActor
    func testCreditsNameEverySourceOnceAndAboutLinksAreSecure() {
        let sources = ScooterCreditsList.sources

        // The sources of the credits list on the web, Lille's parking bays and the
        // boundaries of the night bans included: Switzerland's, France's, each country's
        // own from data/countries.json, then the search's and Lille's.
        XCTAssertEqual(sources.count, 5 + ScooterCountryCatalog.credits.count)
        XCTAssertTrue(sources.contains { $0.title == "DE/NO/SE/FI: Ryde map" })
        XCTAssertEqual(Set(sources.map(\.title)).count, sources.count)
        XCTAssertEqual(sources[2].title.prefix(3), "DE/")
        XCTAssertTrue(sources.contains { $0.title == "CH/FR/DE/IT/BE/UK/PT/ES/SE/PL/FI/UA/US/CA/IL/NZ/AU/TR/KR: OpenStreetMap boundaries · ODbL" })
        XCTAssertTrue(sources.contains { $0.title == "DE/AT/IT/ES/PL/HU/GR/FI: Dott map" })
        XCTAssertTrue(sources.contains { $0.title == "DE/SE: Qick map" })
        XCTAssertTrue(sources.contains { $0.title == "JP: LUUP map" })
        XCTAssertTrue(sources.contains { $0.title == "BR: IBGE boundaries" })
        XCTAssertTrue(sources.contains { $0.title == "KR: Alpaca map" })
        XCTAssertTrue(sources.contains { $0.title == "AE/SA/IL/BH: Dott, SAHAM, Bird, Lime, Hopp" })
        XCTAssertTrue(sources.contains { $0.title == "NZ: Flamingo · CC BY 4.0" })
        XCTAssertTrue(sources.contains { $0.title == "BR/CL/MX/KZ/AZ/GE: JET map" })
        XCTAssertTrue(sources.contains { $0.title == "BR/CL/MX/KZ/CO/BY: Whoosh map" })
        XCTAssertTrue(sources.contains { $0.title == "TR/MK/BA/XK: BinBin map" })
        XCTAssertTrue(sources.contains { $0.title == "Voi Technology Germany GmbH via NRW.Mobidrom, CC BY-SA 4.0, modified" })
        // MobiData BW's licence, dl-de/by-2-0, asks for the dataset and the licence to be named.
        XCTAssertTrue(sources.contains { $0.title == "DE: MobiData BW · dl-de/by-2-0, modified" && $0.url.host() == "www.govdata.de" })
        XCTAssertTrue(sources.contains { $0.url.absoluteString == "https://mobidata-bw.de/dataset/escootch" })
        XCTAssertTrue(sources.allSatisfy { $0.url.scheme == "https" && !$0.title.isEmpty })
        XCTAssertTrue(sources.contains { $0.url.host() == "data.lillemetropole.fr" })
        // Searched places come from Geoapify, whose free plan asks for its name to be shown,
        // and are OpenStreetMap data, whose licence asks for this credit.
        XCTAssertTrue(sources.contains { $0.url.absoluteString == "https://www.geoapify.com/" })
        XCTAssertTrue(sources.contains { $0.url.absoluteString == "https://www.openstreetmap.org/copyright" })

        XCTAssertEqual(ScooterLinks.privacyNotice.absoluteString, "https://scootradar.com/privacy")
        XCTAssertEqual(ScooterLinks.sourceCode.absoluteString, "https://github.com/plhery/ScootRadar")
    }

    @MainActor
    func testCompassTouchesAreExcludedFromScooterTapHandling() {
        let compass = MKCompassButton(mapView: MKMapView())
        let container = UIView()
        let touchTarget = UIView()
        compass.addSubview(container)
        container.addSubview(touchTarget)

        XCTAssertTrue(ScooterMapView.Coordinator.isCompassView(compass))
        XCTAssertTrue(ScooterMapView.Coordinator.isCompassView(touchTarget))
        XCTAssertFalse(ScooterMapView.Coordinator.isCompassView(UIView()))
        XCTAssertFalse(ScooterMapView.Coordinator.isCompassView(nil))
    }

    private func scooter(
        id: String,
        provider: String,
        battery: Int?,
        rangeMeters: Int? = nil,
        batteryEstimate: Int? = nil,
        latitude: Double = 47.3769,
        longitude: Double = 8.5417
    ) -> Scooter {
        Scooter(
            provider: provider,
            latitude: latitude,
            longitude: longitude,
            battery: battery,
            rangeMeters: rangeMeters,
            batteryEstimate: batteryEstimate,
            vehicleID: id,
            deepLink: nil,
            rentalURIs: nil,
            distanceMeters: 0
        )
    }
}

// Filter presets and the filtered-out summary.
extension ScooterFilteringTests {
    func testBatteryFilterOffersFourPresetsAndSnapsOtherValuesDown() {
        XCTAssertEqual(ScooterBatteryFilter.presets, [0, 30, 60, 80])

        let examples = [(0, 0), (29, 0), (30, 30), (45, 30), (60, 60), (79, 60), (80, 80), (95, 80), (100, 80), (-10, 0)]
        for (value, preset) in examples {
            XCTAssertEqual(ScooterBatteryFilter.snapped(value), preset, "\(value)")
        }
        XCTAssertEqual(ScooterBatteryFilter.label(for: 0), String(localized: "Any"))
        XCTAssertEqual(ScooterBatteryFilter.label(for: 60), "60%+")
    }

    /// "Indifférent" is the longest word for "Any". Side by side until the text
    /// is very large, the presets must hold it on one line.
    @MainActor
    func testTheLongestBatteryPresetFitsItsSegmentAtTheLargestStandardTextSize() throws {
        // A 375 pt phone: 20 pt margins, 4 pt inside the control and three 4 pt gaps.
        let segment: CGFloat = (375 - 40 - 8 - 12) / 4
        let traits = UITraitCollection(preferredContentSizeCategory: .extraExtraExtraLarge)
        let pointSize = UIFont.preferredFont(forTextStyle: .subheadline, compatibleWith: traits).pointSize
        let smallest = UIFont.systemFont(
            ofSize: pointSize * ScooterFilterSheet.presetMinimumScale,
            weight: .semibold
        )

        for language in ["en", "de", "fr", "it", "nl", "nb", "pt", "es", "is"] {
            let strings = try XCTUnwrap(
                Bundle.main.path(forResource: language, ofType: "lproj").flatMap(Bundle.init(path:))
            )
            let any = strings.localizedString(forKey: "Any", value: nil, table: nil)
            let width = (any as NSString).size(withAttributes: [.font: smallest]).width
            XCTAssertLessThanOrEqual(width, segment, "\(language): \(any)")
        }
    }

    func testVisibleSummaryAlsoCountsWhatTheFiltersHide() {
        let scooters = [
            scooter(id: "lime-inside", provider: "lime", battery: 80),
            scooter(id: "lime-low", provider: "lime", battery: 10),
            scooter(id: "bird-inside", provider: "bird", battery: 90),
            scooter(id: "unknown", provider: "future-provider", battery: 95),
            scooter(id: "bird-outside", provider: "bird", battery: 90, latitude: 47.5)
        ]

        let summary = ScooterFiltering.visibleSummary(
            for: scooters,
            viewport: viewport,
            minimumBattery: 50,
            enabledProviders: [.lime]
        )

        XCTAssertEqual(summary.count, 1)
        XCTAssertEqual(summary.unfilteredCount, 4)
        XCTAssertEqual(summary.unfilteredProviders, [.lime, .bird])
    }

    func testFilterResultTitlesUseSingularAndPluralForms() {
        XCTAssertEqual(ScooterFiltering.showResultsTitle(count: 1), String(localized: "Show 1 scooter"))
        XCTAssertTrue(ScooterFiltering.showResultsTitle(count: 16).contains("16"))
        XCTAssertNotEqual(
            ScooterFiltering.showResultsTitle(count: 0),
            ScooterFiltering.showResultsTitle(count: 1)
        )
        // Nothing to show is its own sentence, which each language writes in its own form.
        XCTAssertEqual(ScooterFiltering.showResultsTitle(count: 0), String(localized: "Show 0 scooters"))
    }

    func testFilterSummaryDescribesTheActiveFilters() {
        let both = ScooterFilterSummary(hiddenCount: 26, providers: [.lime], minimumBattery: 60)

        XCTAssertTrue(both.title.contains("26"))
        XCTAssertTrue(both.showAllTitle.contains("26"))
        XCTAssertEqual(both.parts.count, 2)
        XCTAssertTrue(both.parts[0].contains("Lime"))
        XCTAssertTrue(both.parts[1].contains("60%"))
        XCTAssertFalse(both.parts[1].contains("%%"))
        XCTAssertEqual(both.body, both.parts.joined(separator: " · "))

        let one = ScooterFilterSummary(hiddenCount: 1, providers: [.bird, .voi], minimumBattery: nil)
        XCTAssertEqual(one.title, String(localized: "1 scooter hidden by your filters"))
        XCTAssertEqual(one.parts.count, 1)
        XCTAssertTrue(one.body.contains("Bird") && one.body.contains("Voi"))

        let unknown = ScooterFilterSummary(hiddenCount: nil, providers: [], minimumBattery: 80)
        XCTAssertEqual(unknown.title, String(localized: "No scooters match your filters here"))
        XCTAssertEqual(unknown.showAllTitle, String(localized: "Show all"))
        XCTAssertEqual(unknown.parts.count, 1)
        // On its own the battery part opens the line, so it starts with a capital.
        XCTAssertEqual(String(unknown.body.prefix(1)), unknown.parts[0].prefix(1).localizedUppercase)
        XCTAssertEqual(unknown.body.dropFirst(), unknown.parts[0].dropFirst())
        XCTAssertNotEqual(unknown.body, unknown.parts[0])
    }
}

// The battery the server estimates from a range, and how far the minimum takes the scooters (issue #12).
extension ScooterFilteringTests {
    /// Lime and Voi give a range and no battery in Stuttgart: the server estimates one from it, which the
    /// filter judges them by. A battery the feed gives is the one judged.
    func testTheBatteryFilterJudgesAScooterWithoutABatteryByItsEstimate() {
        let scooters = [
            scooter(id: "lime-full", provider: "lime", battery: nil, rangeMeters: 9_000, batteryEstimate: 78),
            scooter(id: "lime-flat", provider: "lime", battery: nil, rangeMeters: 2_000, batteryEstimate: 17),
            scooter(id: "voi-unknown", provider: "voi", battery: nil),
            scooter(id: "bolt-own", provider: "bolt", battery: 50, batteryEstimate: 90),
            scooter(id: "bolt-full", provider: "bolt", battery: 90)
        ]

        let filtered = ScooterFiltering.mapScooters(
            from: scooters, minimumBattery: 60, enabledProviders: Set(ScooterProvider.allCases)
        )
        XCTAssertEqual(filtered.map(\.id), ["lime:lime-full", "bolt:bolt-full"])

        let summary = ScooterFiltering.visibleSummary(
            for: scooters, viewport: viewport, minimumBattery: 60, enabledProviders: [.lime]
        )
        XCTAssertEqual(summary.count, 1)
        XCTAssertEqual(summary.providerCounts, [.lime: 1, .bolt: 1])
        XCTAssertEqual(summary.unfilteredCount, 5)

        // At Any, every scooter is shown, with or without a battery.
        XCTAssertEqual(ScooterFiltering.mapScooters(
            from: scooters, minimumBattery: 0, enabledProviders: Set(ScooterProvider.allCases)
        ).count, 5)
        XCTAssertEqual(scooters[0].filterBattery, 78)
        XCTAssertNil(scooters[0].battery, "The card and the marker never show the estimate")
        XCTAssertEqual(scooters[3].filterBattery, 50)
    }

    /// The website's examples (src/lib/battery.ts): Lime's full battery reads 11.5 km, Voi's 80 and Bolt's 61.
    func testHowFarABatteryLevelTakesTheScootersOfTheAppsSwitchedOnInView() throws {
        let fullRanges: [ScooterProvider: Int] = [.lime: 11_500, .voi: 80_000, .bolt: 61_000]
        let all: (ScooterProvider) -> Bool = { _ in true }

        // One app: its full range, scaled to the level.
        let voi = try XCTUnwrap(ScooterBatteryReach(level: 100, fullRanges: fullRanges, counts: [.voi: 40], enabled: all))
        XCTAssertEqual(voi.low, 80_000)
        XCTAssertEqual(voi.high, 80_000)
        XCTAssertEqual(voi.mean, 80_000)
        XCTAssertEqual(plainSpaces(voi.formatted(locale: Self.metric)), "80 km")
        let voi30 = try XCTUnwrap(ScooterBatteryReach(level: 30, fullRanges: fullRanges, counts: [.voi: 40], enabled: all))
        XCTAssertEqual(plainSpaces(voi30.formatted(locale: Self.metric)), "24 km")

        // Several apps apart by over a quarter: the shortest to the longest; an app with none in view is left out.
        let counts: [ScooterProvider: Int] = [.lime: 30, .voi: 10, .bolt: 0]
        let mixed = try XCTUnwrap(ScooterBatteryReach(level: 100, fullRanges: fullRanges, counts: counts, enabled: all))
        XCTAssertEqual(mixed.low, 11_500)
        XCTAssertEqual(mixed.high, 80_000)
        XCTAssertEqual(mixed.mean, 28_625, accuracy: 0.001)
        XCTAssertEqual(plainSpaces(mixed.formatted(locale: Self.metric)), "12–80 km")
        XCTAssertEqual(plainSpaces(mixed.formatted(locale: Self.miles)), "7–50 mi")

        // An app switched off is left out, and so is one with under a tenth of the scooters.
        let voiOff = try XCTUnwrap(ScooterBatteryReach(
            level: 100, fullRanges: fullRanges, counts: counts, enabled: { $0 != .voi }
        ))
        XCTAssertEqual(plainSpaces(voiOff.formatted(locale: Self.metric)), "12 km")
        let fewVoi = try XCTUnwrap(ScooterBatteryReach(
            level: 100, fullRanges: fullRanges, counts: [.lime: 95, .voi: 5], enabled: all
        ))
        XCTAssertEqual(fewVoi.high, 11_500)
        XCTAssertEqual(plainSpaces(fewVoi.formatted(locale: Self.metric)), "12 km")
        // Unless it has the most: twelve apps with one scooter each are all under a tenth of them.
        let twelve = Array(ScooterProvider.allCases.prefix(12))
        let fewOfEach = try XCTUnwrap(ScooterBatteryReach(
            level: 100,
            fullRanges: Dictionary(uniqueKeysWithValues: twelve.map { ($0, $0 == twelve[0] ? 30_000 : 10_000) }),
            counts: Dictionary(uniqueKeysWithValues: twelve.map { ($0, 1) }),
            enabled: all
        ))
        XCTAssertEqual(fewOfEach.low, 10_000)
        XCTAssertEqual(fewOfEach.high, 30_000)

        // Nothing to say without an app in view that has a full range.
        XCTAssertNil(ScooterBatteryReach(level: 100, fullRanges: fullRanges, counts: [.dott: 30], enabled: all))
        XCTAssertNil(ScooterBatteryReach(level: 100, fullRanges: [:], counts: counts, enabled: all))
        XCTAssertNil(ScooterBatteryReach(level: 100, fullRanges: fullRanges, counts: [.voi: 40], enabled: { _ in false }))

        // Stuttgart: Bolt's 300 and Lime's 1 200 at 60%.
        let stuttgart: [ScooterProvider: Int] = [.lime: 11_500, .bolt: 61_000]
        let stuttgartCounts: [ScooterProvider: Int] = [.bolt: 300, .lime: 1_200]
        let both = try XCTUnwrap(ScooterBatteryReach(level: 60, fullRanges: stuttgart, counts: stuttgartCounts, enabled: all))
        XCTAssertEqual(plainSpaces(both.formatted(locale: Self.metric)), "7–37 km")
        let boltOff = try XCTUnwrap(ScooterBatteryReach(
            level: 60, fullRanges: stuttgart, counts: stuttgartCounts, enabled: { $0 != .bolt }
        ))
        XCTAssertEqual(plainSpaces(boltOff.formatted(locale: Self.metric)), "7 km")
    }

    /// One length where the longest is at most a quarter longer than the shortest, their mean weighed by their
    /// scooters; whole kilometres, halves going up as on the web, and never 0.
    func testTheReachIsOneLengthWithinAQuarterInWholeUnitsAndNeverZero() throws {
        let all: (ScooterProvider) -> Bool = { _ in true }
        func reach(_ fullRanges: [ScooterProvider: Int], _ counts: [ScooterProvider: Int], level: Int = 100) throws -> String {
            let reach = try XCTUnwrap(ScooterBatteryReach(
                level: level, fullRanges: fullRanges, counts: counts, enabled: all
            ))
            return self.plainSpaces(reach.formatted(locale: Self.metric))
        }
        // 20 and 25 km are within a quarter: (20 × 3 + 25) / 4 = 21.25 km.
        XCTAssertEqual(try reach([.lime: 20_000, .voi: 25_000], [.lime: 3, .voi: 1]), "21 km")
        XCTAssertEqual(try reach([.lime: 20_000, .voi: 26_000], [.lime: 3, .voi: 1]), "20–26 km")
        XCTAssertEqual(try reach([.voi: 2_500], [.voi: 1]), "3 km")
        XCTAssertEqual(try reach([.voi: 2_499], [.voi: 1]), "2 km")
        XCTAssertEqual(try reach([.voi: 400], [.voi: 1]), "1 km")
        XCTAssertEqual(try reach([.voi: 3_000], [.voi: 1], level: 30), "1 km")
        XCTAssertNil(ScooterBatteryReach(level: 100, fullRanges: [.voi: 0], counts: [.voi: 4], enabled: all))
    }

    /// The line under the presets, "60% usually allows about 22 km.", in the app's language, and with it, while
    /// a minimum is set, the sentence that scooters without battery info are hidden.
    func testTheLineSaysHowFarTheMinimumOrAFullBatteryTakesTheScooters() throws {
        defer { ScooterLanguage.current = .atLaunch }
        ScooterLanguage.current = .en
        let all: (ScooterProvider) -> Bool = { _ in true }
        let bolt: [ScooterProvider: Int] = [.bolt: 36_700]
        func line(
            _ minimum: Int,
            _ fullRanges: [ScooterProvider: Int],
            _ counts: [ScooterProvider: Int],
            locale: Locale = Locale(identifier: "en_CH")
        ) -> String? {
            ScooterBatteryReach.line(
                minimumBattery: minimum, fullRanges: fullRanges, counts: counts, enabled: all, locale: locale
            ).map { self.plainSpaces($0) }
        }

        XCTAssertEqual(line(60, bolt, [.bolt: 10]), "60% usually allows about 22 km.")
        // Any is a full battery's.
        let stuttgart: [ScooterProvider: Int] = [.lime: 11_500, .voi: 80_000]
        XCTAssertEqual(line(0, stuttgart, [.lime: 30, .voi: 10]), "100% usually allows about 12–80 km.")
        XCTAssertEqual(line(0, stuttgart, [.lime: 30, .voi: 10], locale: Self.miles), "100% usually allows about 7–50 mi.")
        // A minimum that is not a preset is read as the one below it.
        XCTAssertEqual(line(75, bolt, [.bolt: 10]), "60% usually allows about 22 km.")
        XCTAssertNil(line(60, bolt, [.dott: 10]))

        let sentence = "Scooters without battery info are hidden while a minimum is set."
        XCTAssertEqual(
            ScooterBatteryReach.help(line: "60% usually allows about 22 km.", minimumBattery: 60),
            "60% usually allows about 22 km. " + sentence
        )
        XCTAssertEqual(ScooterBatteryReach.help(line: nil, minimumBattery: 60), sentence)
        XCTAssertEqual(
            ScooterBatteryReach.help(line: "100% usually allows about 80 km.", minimumBattery: 0),
            "100% usually allows about 80 km."
        )
        XCTAssertNil(ScooterBatteryReach.help(line: nil, minimumBattery: 0))

        ScooterLanguage.current = .de
        XCTAssertEqual(
            line(60, bolt, [.bolt: 10], locale: Locale(identifier: "de_DE")),
            "Mit 60% kommt man meist etwa 22 km weit."
        )
        ScooterLanguage.current = .fr
        XCTAssertEqual(
            line(60, bolt, [.bolt: 10], locale: Locale(identifier: "fr_FR")),
            "Avec 60 %, comptez en général environ 22 km."
        )
        XCTAssertEqual(
            line(0, stuttgart, [.lime: 30, .voi: 10], locale: Locale(identifier: "fr_FR")),
            "Avec 100 %, comptez en général environ 12–80 km."
        )
    }

    private static let metric = Locale(identifier: "en_CH")
    private static let miles = Locale(identifier: "en_US")

    private func plainSpaces(_ text: String) -> String {
        text.replacingOccurrences(of: "\u{00A0}", with: " ").replacingOccurrences(of: "\u{202F}", with: " ")
    }
}
