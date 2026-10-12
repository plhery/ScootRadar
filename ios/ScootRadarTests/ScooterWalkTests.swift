import CoreLocation
import Foundation
import MapKit
import SwiftUI
import XCTest
@testable import ScootRadar

/// Directions on a card: the walking route drawn in the app, from the tap to
/// the rider's arrival, and everything that ends it on the way.
@MainActor
final class ScooterWalkTests: XCTestCase {
    private let rider = GeoPoint(latitude: 47.3769, longitude: 8.5417)

    // MARK: Showing the route

    func testDirectionsDrawsTheWayFromTheRiderAndTheCardCountsAlongIt() async throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let h = try await harness(vehicles: [target], rider: rider)
        h.model.selectScooter(target.id)
        let straight = try XCTUnwrap(h.model.straightLineDistance(to: target))

        h.model.showWalkingRoute(to: .scooter(target))

        XCTAssertEqual(h.model.directionsControl(for: .scooter(target)), .finding)
        XCTAssertEqual(h.model.walkAnnouncement?.text, String(localized: "Finding the way…"))
        let shown = await waitUntil { h.model.walk?.phase == .shown }
        XCTAssertTrue(shown)
        XCTAssertEqual(h.directions.requests.count, 1)
        XCTAssertEqual(h.directions.requests.first?.origin, rider)
        XCTAssertEqual(h.directions.requests.first?.target, GeoPoint(target.coordinate))

        let trail = try XCTUnwrap(h.model.walkTrail)
        XCTAssertTrue(trail.reveals)
        XCTAssertEqual(trail.walked, 0)
        XCTAssertEqual(trail.points.first, rider)
        XCTAssertEqual(trail.points.last, GeoPoint(target.coordinate))
        XCTAssertEqual(h.model.directionsControl(for: .scooter(target)), .hideRoute)
        XCTAssertNil(h.model.walkNote(for: .scooter(target)))
        XCTAssertTrue(h.model.isWalking)
        // The trail behind the rider goes a few metres at a time.
        XCTAssertEqual(h.manager.distanceFilter, 5)

        // The card, the pill and VoiceOver count along the route, not as the crow flies.
        let remaining = try XCTUnwrap(h.model.walkRemainingMetres)
        XCTAssertEqual(remaining, 500, accuracy: 3)
        XCTAssertGreaterThan(remaining, straight + 100)
        let minutes = ScooterMapLook.walkingMinutes(metres: remaining)
        XCTAssertEqual(h.model.approximateWalkingMinutes(to: target), minutes)
        XCTAssertEqual(h.model.cardContent(for: target).figures.first?.value, "\(minutes)")
        XCTAssertEqual(h.model.formattedDistance(for: target), Scooter.formattedLength(meters: remaining))
        XCTAssertEqual(h.model.walkAnnouncement?.text, String(
            format: String(localized: "Route shown: ≈%1$lld min walk · %2$@"),
            Int64(minutes),
            Scooter.formattedLength(meters: remaining)
        ))
    }

    func testWithoutALocationTheRiderIsLocatedFirstAndTheMapStaysPut() async throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let h = try await harness(vehicles: [target], rider: nil)
        h.model.selectScooter(target.id)
        let focus = h.model.focusRequest

        h.model.showWalkingRoute(to: .scooter(target))

        XCTAssertEqual(h.model.walk?.phase, .locating)
        XCTAssertTrue(h.model.isLocating)
        XCTAssertEqual(h.model.directionsControl(for: .scooter(target)), .finding)
        XCTAssertTrue(h.directions.requests.isEmpty)

        h.model.locationManager(h.manager, didUpdateLocations: [fix(at: rider)])

        let shown = await waitUntil { h.model.walk?.phase == .shown }
        XCTAssertTrue(shown)
        XCTAssertEqual(h.directions.requests.first?.origin, rider)
        XCTAssertEqual(h.model.focusRequest, focus)
        XCTAssertEqual(h.model.selectedScooterID, target.id)
    }

    func testWhenTheRiderCannotBeLocatedTheCardOffersAppleMaps() async throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let h = try await harness(vehicles: [target], rider: nil, status: .denied)
        h.model.selectScooter(target.id)

        h.model.showWalkingRoute(to: .scooter(target))

        XCTAssertEqual(h.model.walk?.phase, .failed(.noLocation))
        XCTAssertEqual(h.model.directionsControl(for: .scooter(target)), .openInMaps)
        XCTAssertEqual(h.model.walkNote(for: .scooter(target)), .noLocation)
        XCTAssertEqual(h.model.walkAnnouncement?.text, String(localized: "Couldn’t find your location."))
        XCTAssertTrue(h.opened.targets.isEmpty)

        h.model.openWalkInMaps(to: .scooter(target))

        XCTAssertEqual(h.opened.targets, [.scooter(target)])
    }

    func testAWalkOfMoreThanTenKilometresOpensAppleMapsAsBefore() async throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let h = try await harness(vehicles: [target], rider: point(east: 0, north: 12_000))
        h.model.selectScooter(target.id)

        h.model.showWalkingRoute(to: .scooter(target))

        XCTAssertNil(h.model.walk)
        XCTAssertEqual(h.opened.targets, [.scooter(target)])
        XCTAssertTrue(h.directions.requests.isEmpty)
        XCTAssertEqual(h.model.directionsControl(for: .scooter(target)), .directions)
    }

    func testWithoutARouteTheCardOffersAppleMapsAndCountsAsTheCrowFlies() async throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let h = try await harness(vehicles: [target], rider: rider)
        h.directions.result = .failure(WalkingDirectionsError.noRoute)
        h.model.selectScooter(target.id)

        h.model.showWalkingRoute(to: .scooter(target))

        let failed = await waitUntil { h.model.walk?.phase == .failed(.noRoute) }
        XCTAssertTrue(failed)
        XCTAssertNil(h.model.walkTrail)
        XCTAssertFalse(h.model.isWalking)
        XCTAssertEqual(h.model.directionsControl(for: .scooter(target)), .openInMaps)
        XCTAssertEqual(h.model.walkNote(for: .scooter(target)), .noRoute)
        XCTAssertEqual(h.model.walkAnnouncement?.text, String(localized: "Couldn’t find a walking route."))
        XCTAssertEqual(h.model.walkingDistance(to: target), h.model.straightLineDistance(to: target))
        XCTAssertEqual(h.manager.distanceFilter, 20)
    }

    func testARiderAlreadyThereArrivesWithoutAskingForARoute() async throws {
        let target = scooter("s1", at: point(east: 10, north: 0))
        let h = try await harness(vehicles: [target], rider: rider)
        h.model.selectScooter(target.id)

        h.model.showWalkingRoute(to: .scooter(target))

        XCTAssertEqual(h.model.walk?.phase, .arrived)
        XCTAssertTrue(h.directions.requests.isEmpty)
        XCTAssertEqual(h.model.walkNote(for: .scooter(target)), .arrived)
        XCTAssertEqual(h.model.directionsControl(for: .scooter(target)), .directions)
        XCTAssertEqual(h.model.walkAnnouncement?.text, String(localized: "You’re there."))
    }

    // MARK: Walking

    func testWalkingAlongShrinksTheRouteUntilTheRiderIsThere() async throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let h = try await shownWalk(to: target)
        let revision = try XCTUnwrap(h.model.walkTrail?.revision)

        h.model.userLocation = point(east: 3, north: 60)

        XCTAssertEqual(h.model.walk?.progress ?? 0, 60, accuracy: 1)
        XCTAssertEqual(h.model.walkRemainingMetres ?? 0, 440, accuracy: 3)
        XCTAssertEqual(h.model.walkTrail?.walked ?? 0, 60.0 / 500, accuracy: 0.01)
        XCTAssertEqual(h.model.walkTrail?.revision, revision)

        h.model.userLocation = point(east: 200, north: 104)
        XCTAssertEqual(h.model.walk?.progress ?? 0, 300, accuracy: 1)

        h.model.userLocation = point(east: 300, north: 15)

        XCTAssertEqual(h.model.walk?.phase, .arrived)
        XCTAssertNil(h.model.walkTrail)
        XCTAssertEqual(h.model.walkNote(for: .scooter(target)), .arrived)
        XCTAssertEqual(h.model.directionsControl(for: .scooter(target)), .directions)
        XCTAssertEqual(h.model.walkAnnouncement?.text, String(localized: "You’re there."))
        XCTAssertEqual(h.manager.distanceFilter, 20)
        XCTAssertEqual(h.directions.requests.count, 1)
        // The card stays open on the scooter.
        XCTAssertEqual(h.model.dock, .scooter(target))
    }

    func testLeavingTheRouteFindsANewOneAtMostEveryFifteenSecondsAndTenTimes() async throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let h = try await shownWalk(to: target)
        let revision = try XCTUnwrap(h.model.walkTrail?.revision)

        h.clock.advance(5)
        h.model.userLocation = point(east: -100, north: 0)
        await settle()
        XCTAssertEqual(h.directions.requests.count, 1, "Too soon after the first route")

        h.directions.holds = true
        h.clock.advance(11)
        h.model.userLocation = point(east: -110, north: 0)
        let asked = await waitUntil { h.directions.requests.count == 2 }
        XCTAssertTrue(asked)
        XCTAssertEqual(h.directions.requests.last?.origin, point(east: -110, north: 0))
        // The old route stays on the map meanwhile.
        XCTAssertEqual(h.model.walk?.phase, .shown)
        XCTAssertEqual(h.model.walkTrail?.revision, revision)

        h.directions.releaseAll(with: .success([point(east: -110, north: 0), point(east: 300, north: 0)]))
        let swapped = await waitUntil { h.model.walkTrail.map { $0.revision != revision } == true }
        XCTAssertTrue(swapped)
        // Swapped in as it is: no fit, no drawing.
        XCTAssertEqual(h.model.walkTrail?.reveals, false)
        XCTAssertEqual(h.model.walkRemainingMetres ?? 0, 410, accuracy: 3)

        h.directions.holds = false
        h.directions.result = nil
        var expected = 2
        for index in 0 ..< 12 {
            h.clock.advance(16)
            let away = point(east: -100, north: index.isMultiple(of: 2) ? 200 : -200)
            h.model.userLocation = away
            if expected < 1 + WalkRoute.maximumReroutes {
                expected += 1
                let found = await waitUntil { h.model.walkTrail?.points.first == away }
                XCTAssertTrue(found, "Route \(expected)")
            } else {
                await settle()
            }
            XCTAssertEqual(h.directions.requests.count, expected)
        }
        XCTAssertEqual(h.directions.requests.count, 11)
        XCTAssertEqual(h.model.walk?.reroutes, WalkRoute.maximumReroutes)
    }

    func testAScooterThatMovedGetsANewRoute() async throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let h = try await shownWalk(to: target)
        let moved = scooter("s1", at: point(east: 300, north: 40))
        await h.api.setResponse(ScooterResponse(vehicles: [moved]))
        h.clock.advance(16)

        h.model.refresh()

        let rerouted = await waitUntil { h.directions.requests.count == 2 }
        XCTAssertTrue(rerouted)
        XCTAssertEqual(h.directions.requests.last?.target, GeoPoint(moved.coordinate))
        XCTAssertEqual(h.model.selectedScooter, moved)
    }

    // MARK: Ending the walk

    func testHidingClosingOrChoosingAnotherScooterOrBayEndsTheWalk() async throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let other = scooter("s2", at: point(east: -200, north: 0))
        let h = try await shownWalk(to: target, others: [other])

        h.model.hideWalkingRoute()
        XCTAssertNil(h.model.walk)
        XCTAssertNil(h.model.walkTrail)
        XCTAssertEqual(h.model.directionsControl(for: .scooter(target)), .directions)
        XCTAssertEqual(h.model.selectedScooterID, target.id)
        XCTAssertEqual(h.manager.distanceFilter, 20)

        let ends: [@MainActor (ScooterMapModel) -> Void] = [
            { $0.selectScooter(other.id) },
            { $0.selectParking("dott:bay") },
            { $0.selectScooter(nil) }
        ]
        for end in ends {
            h.model.selectScooter(target.id)
            h.model.showWalkingRoute(to: .scooter(target))
            let shown = await waitUntil { h.model.walk?.phase == .shown }
            XCTAssertTrue(shown)

            end(h.model)

            XCTAssertNil(h.model.walk)
            XCTAssertNil(h.model.walkTrail)
        }
    }

    func testAnAnswerToAnEarlierRequestIsIgnored() async throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let h = try await harness(vehicles: [target], rider: rider)
        h.model.selectScooter(target.id)
        h.directions.holds = true

        h.model.showWalkingRoute(to: .scooter(target))
        h.model.hideWalkingRoute()
        h.model.showWalkingRoute(to: .scooter(target))
        let asked = await waitUntil { h.directions.requests.count == 2 }
        XCTAssertTrue(asked)

        h.directions.release(0, with: .success([rider, point(east: 300, north: 0)]))
        await settle()
        XCTAssertEqual(h.model.walk?.phase, .finding)

        h.directions.release(1, with: .success(detour))
        let shown = await waitUntil { h.model.walk?.phase == .shown }
        XCTAssertTrue(shown)
        XCTAssertEqual(h.model.walkRemainingMetres ?? 0, 500, accuracy: 3)
    }

    func testAnotherPlaceFindsTheRouteFromThereAndTheRouteIsFittedInsteadOfThePlace() async throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let h = try await shownWalk(to: target)
        let revision = try XCTUnwrap(h.model.walkTrail?.revision)
        let focus = h.model.focusRequest
        let place = MapDestination(title: "Paradeplatz", point: point(east: 100, north: -150))

        h.model.focusOnAddress(place)

        XCTAssertEqual(h.model.selectedScooterID, target.id)
        XCTAssertEqual(h.model.walk?.phase, .finding)
        XCTAssertNil(h.model.walkTrail)
        XCTAssertEqual(h.model.focusRequest, focus)
        let fromPlace = await waitUntil { h.model.walk?.phase == .shown }
        XCTAssertTrue(fromPlace)
        XCTAssertEqual(h.directions.requests.last?.origin, place.point)
        XCTAssertEqual(h.model.walkTrail?.reveals, true)
        XCTAssertGreaterThan(h.model.walkTrail?.revision ?? 0, revision)

        h.model.clearAddressSearch()

        let fromRider = await waitUntil { h.directions.requests.count == 3 && h.model.walk?.phase == .shown }
        XCTAssertTrue(fromRider)
        XCTAssertEqual(h.directions.requests.last?.origin, rider)
        XCTAssertEqual(h.model.walkTrail?.reveals, true)
    }

    func testARouteFromASearchedPlaceDoesNotFollowTheRider() async throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let h = try await harness(vehicles: [target], rider: nil)
        h.model.focusOnAddress(MapDestination(title: "Paradeplatz", point: rider))
        h.model.selectScooter(target.id)
        h.model.showWalkingRoute(to: .scooter(target))
        let shown = await waitUntil { h.model.walk?.phase == .shown }
        XCTAssertTrue(shown)

        h.model.userLocation = point(east: 300, north: 5)
        h.model.userLocation = point(east: -500, north: 0)

        XCTAssertEqual(h.model.walk?.phase, .shown)
        XCTAssertEqual(h.model.walk?.progress, 0)
        XCTAssertEqual(h.directions.requests.count, 1)
        XCTAssertEqual(h.manager.distanceFilter, 20)
    }

    // MARK: Selection while walking

    func testTheScooterWalkedToStaysSelectedAndDrawnWhereverTheMapGoes() async throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let h = try await shownWalk(to: target)
        await h.api.setResponse(ScooterResponse(
            vehicles: [],
            meta: ScooterResponseMetadata(partial: false, failedSources: [], mode: "clusters")
        ))

        // Far away and zoomed out, where the data only counts scooters.
        let away = MKCoordinateRegion(
            center: point(east: 4_000, north: 4_000).coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.2, longitudeDelta: 0.2)
        )
        h.model.updateViewport(away, zoom: 12)
        let loaded = await waitUntil { await h.api.calls == 2 && !h.model.isLoading }
        XCTAssertTrue(loaded)

        XCTAssertEqual(h.model.selectedScooterID, target.id)
        XCTAssertEqual(h.model.selectedScooter, target)
        XCTAssertEqual(h.model.dock, .scooter(target))
        XCTAssertTrue(h.model.mapScooters.contains(target))
        XCTAssertEqual(h.model.walk?.phase, .shown)

        // Once the walk is over the map is as it was.
        h.model.hideWalkingRoute()
        XCTAssertFalse(h.model.mapScooters.contains(target))
    }

    func testTheBayWalkedToStaysOnTheMapWhenZoomedOut() async throws {
        let bay = ScooterParking(
            id: "dott:bay", provider: "dott", name: "Place test",
            latitude: point(east: 200, north: 100).latitude,
            longitude: point(east: 200, north: 100).longitude,
            mandatory: false
        )
        let h = try await harness(vehicles: [], parking: [bay], rider: rider)
        h.directions.result = nil
        h.model.selectParking(bay.id)
        XCTAssertEqual(h.model.selectedParking, bay)

        h.model.showWalkingRoute(to: .parking(bay))
        let shown = await waitUntil { h.model.walk?.phase == .shown }
        XCTAssertTrue(shown)
        let minutes = ScooterMapLook.walkingMinutes(metres: try XCTUnwrap(h.model.walkRemainingMetres))
        XCTAssertEqual(h.model.approximateWalkingMinutes(to: bay), minutes)

        h.model.updateViewport(region, zoom: 14)

        XCTAssertEqual(h.model.mapParking, [bay])
        XCTAssertEqual(h.model.selectedParking, bay)
        XCTAssertEqual(h.model.dock, .parking(bay))
        XCTAssertEqual(h.model.directionsControl(for: .parking(bay)), .hideRoute)
    }

    // MARK: Taken scooters

    func testATakenScooterKeepsItsCardWithoutActionsUntilItIsBack() async throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let other = scooter("s2", at: point(east: -200, north: 0))
        // Another provider's scooter where it stood is not it.
        let neighbour = scooter("b1", provider: "bird", at: point(east: 303, north: 0))
        let h = try await shownWalk(to: target, others: [other])
        await h.api.setResponse(ScooterResponse(
            vehicles: [other, neighbour],
            meta: ScooterResponseMetadata(partial: false, failedSources: [])
        ))

        h.model.refresh()

        let gone = await waitUntil { h.model.walk?.phase == .gone }
        XCTAssertTrue(gone)
        XCTAssertEqual(h.model.selectedScooterID, target.id)
        XCTAssertEqual(h.model.dock, .scooter(target))
        XCTAssertEqual(h.model.directionsControl(for: .scooter(target)), ScooterDirectionsControl.none)
        XCTAssertEqual(h.model.walkNote(for: .scooter(target)), .gone)
        XCTAssertNil(h.model.walkTrail)
        XCTAssertFalse(h.model.isWalking)
        XCTAssertFalse(h.model.mapScooters.contains(target))
        XCTAssertEqual(
            h.model.walkAnnouncement?.text,
            String(localized: "No longer on the map. Someone may have taken it.")
        )

        await h.api.setResponse(ScooterResponse(vehicles: [target, other]))
        h.model.refresh()

        let back = await waitUntil { h.model.walk == nil }
        XCTAssertTrue(back)
        XCTAssertEqual(h.model.dock, .scooter(target))
        XCTAssertEqual(h.model.directionsControl(for: .scooter(target)), .directions)
    }

    func testAScooterUnderANewIDIsStillTheOneWalkedTo() async throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let h = try await shownWalk(to: target)
        let renamed = scooter("s1-new", at: point(east: 305, north: 0))
        await h.api.setResponse(ScooterResponse(vehicles: [renamed]))

        h.model.refresh()

        let followed = await waitUntil { h.model.selectedScooterID == renamed.id }
        XCTAssertTrue(followed)
        XCTAssertEqual(h.model.walk?.phase, .shown)
        XCTAssertEqual(h.model.walk?.target, .scooter(renamed))
        XCTAssertEqual(h.model.dock, .scooter(renamed))
        XCTAssertEqual(h.model.directionsControl(for: .scooter(renamed)), .hideRoute)
    }

    func testAScooterIsNotTakenWhenTheDataCannotTell() async throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let other = scooter("s2", at: point(east: -200, north: 0))
        let h = try await shownWalk(to: target, others: [other])
        let unclear = [
            // Its provider's feed failed.
            ScooterResponseMetadata(partial: true, failedSources: ["lime_zurich"]),
            // A feed nobody can name failed.
            ScooterResponseMetadata(partial: true, failedSources: ["mystery-feed"]),
            // The list was cut short.
            ScooterResponseMetadata(partial: false, failedSources: [], truncated: true)
        ]

        for (index, meta) in unclear.enumerated() {
            await h.api.setResponse(ScooterResponse(vehicles: [other], meta: meta))
            h.model.refresh()
            let loaded = await waitUntil { await h.api.calls == index + 2 && !h.model.isLoading }
            XCTAssertTrue(loaded)

            XCTAssertEqual(h.model.walk?.phase, .shown, "\(meta.failedSources)")
            XCTAssertEqual(h.model.selectedScooter, target)
            XCTAssertTrue(h.model.mapScooters.contains(target))
        }
    }

    // MARK: Map and card

    func testTheMapKeepsTheScooterWalkedToSelectedAndDrawsItsTrail() throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let trail = WalkTrail(revision: 1, points: detour, walked: 0.2, reveals: true)
        var published: [String?] = []
        func view(walking: Bool, trail: WalkTrail?) -> ScooterMapView {
            ScooterMapView(
                scooters: [target], scooterRevision: 1, clusters: [], clusterRevision: 0,
                usesServerClusters: false, mapStyle: .quiet, showsUserLocation: false,
                focusRequest: nil, destination: nil, selectedScooterID: target.id,
                onRegionChange: { _, _ in }, onSelectionChange: { published.append($0) },
                walkTrail: trail, isWalking: walking
            )
        }
        let coordinator = ScooterMapView.Coordinator(parent: view(walking: true, trail: trail))
        let map = MKMapView(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        coordinator.reconcile([target], revision: 1, on: map)
        coordinator.applySelection(target.id, on: map)

        coordinator.applyTrail(trail, on: map)

        XCTAssertEqual(map.overlays.count, 2)
        let renderers = map.overlays.compactMap { coordinator.mapView(map, rendererFor: $0) as? MKMultiPolylineRenderer }
        XCTAssertEqual(renderers.map(\.lineWidth).sorted(), [WalkTrailLook.dotWidth, WalkTrailLook.casingWidth])
        // Off screen there is nothing to watch being drawn: every dot is
        // there at once, but those of the part already walked.
        let spacing = try XCTUnwrap(WalkTrailLook.mapPointsPerPoint(on: map)) * Double(WalkTrailLook.dotSpacing)
        let expected = WalkTrailLook.dots(
            along: detour.map { MKMapPoint($0.coordinate) }, spacing: spacing, from: 0.2
        )
        XCTAssertGreaterThan(expected.count, 5)
        for renderer in renderers {
            XCTAssertEqual(renderer.lineCap, .round)
            XCTAssertEqual(renderer.multiPolyline.polylines.count, expected.count)
            XCTAssertEqual(renderer.multiPolyline.polylines.first?.points()[0].x, expected.first?.x)
            XCTAssertEqual(renderer.multiPolyline.polylines.first?.points()[0].y, expected.first?.y)
        }

        // A tap on the empty map deselects in MapKit; the walk keeps its scooter.
        let annotation = try XCTUnwrap(map.annotations.first { $0 is ScooterMapAnnotation })
        let marker = MKAnnotationView(annotation: annotation, reuseIdentifier: nil)
        coordinator.mapView(map, didDeselect: marker)
        XCTAssertTrue(published.isEmpty)

        coordinator.parent = view(walking: false, trail: nil)
        coordinator.applyTrail(nil, on: map)
        XCTAssertTrue(map.overlays.isEmpty)
        coordinator.mapView(map, didDeselect: marker)
        XCTAssertEqual(published, [nil])
    }

    func testTheCardsDrawEveryStateOfTheWalk() async throws {
        let target = scooter("s1", at: point(east: 300, north: 0))
        let h = try await harness(vehicles: [target], rider: rider)
        h.model.selectScooter(target.id)
        h.directions.holds = true
        h.model.showWalkingRoute(to: .scooter(target))
        assertRenders(ScooterControlDock(model: h.model), "finding")

        _ = await waitUntil { h.directions.requests.count == 1 }
        h.directions.releaseAll(with: .success(detour))
        _ = await waitUntil { h.model.walk?.phase == .shown }
        assertRenders(ScooterControlDock(model: h.model), "shown")

        h.model.userLocation = point(east: 300, north: 10)
        assertRenders(ScooterControlDock(model: h.model), "arrived")

        h.directions.result = .failure(WalkingDirectionsError.noRoute)
        h.directions.holds = false
        h.model.userLocation = rider
        h.model.showWalkingRoute(to: .scooter(target))
        _ = await waitUntil { h.model.walk?.phase == .failed(.noRoute) }
        assertRenders(ScooterControlDock(model: h.model), "failed")
    }

    // MARK: Helpers

    private struct Harness {
        let model: ScooterMapModel
        let api: WalkStubAPI
        let directions: FakeWalkingDirections
        let manager: WalkLocationManager
        let clock: WalkClock
        let opened: OpenedTargets
    }

    /// MapKit's path from the rider to a scooter 300 m east: 100 m north,
    /// 300 m east and 100 m back south, 500 m in all.
    private var detour: [GeoPoint] {
        [rider, point(east: 0, north: 100), point(east: 300, north: 100), point(east: 300, north: 0)]
    }

    private var region: MKCoordinateRegion {
        MKCoordinateRegion(center: rider.coordinate, span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01))
    }

    private func harness(
        vehicles: [Scooter],
        parking: [ScooterParking] = [],
        rider: GeoPoint?,
        status: CLAuthorizationStatus = .authorizedWhenInUse
    ) async throws -> Harness {
        let api = WalkStubAPI(response: ScooterResponse(vehicles: vehicles, parking: parking))
        let directions = FakeWalkingDirections(result: .success(detour))
        let manager = WalkLocationManager(status: status)
        let clock = WalkClock()
        let opened = OpenedTargets()
        let suiteName = "ScootRadarWalkTests.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defaults.removePersistentDomain(forName: suiteName)
        let model = ScooterMapModel(
            api: api,
            locationManager: manager,
            defaults: defaults,
            now: { clock.now },
            directions: directions,
            openInMaps: { opened.targets.append($0) }
        )
        model.userLocation = rider
        model.updateViewport(region, zoom: 17)
        let loaded = await waitUntil { model.lastUpdated != nil && !model.isLoading }
        XCTAssertTrue(loaded)
        return Harness(model: model, api: api, directions: directions, manager: manager, clock: clock, opened: opened)
    }

    /// A walk from the rider to `target`, with its route on the map.
    private func shownWalk(to target: Scooter, others: [Scooter] = []) async throws -> Harness {
        let h = try await harness(vehicles: [target] + others, rider: rider)
        h.model.selectScooter(target.id)
        h.model.showWalkingRoute(to: .scooter(target))
        let shown = await waitUntil { h.model.walk?.phase == .shown }
        XCTAssertTrue(shown)
        return h
    }

    private func scooter(_ id: String, provider: String = "lime", at point: GeoPoint) -> Scooter {
        Scooter(
            provider: provider, latitude: point.latitude, longitude: point.longitude, battery: 80,
            rangeMeters: nil, vehicleID: id, deepLink: nil, rentalURIs: nil, distanceMeters: 0
        )
    }

    private func point(east: CLLocationDistance, north: CLLocationDistance) -> GeoPoint {
        let metresPerDegree = 6_371_008.8 * Double.pi / 180
        return GeoPoint(
            latitude: rider.latitude + north / metresPerDegree,
            longitude: rider.longitude + east / (metresPerDegree * cos(rider.latitude * .pi / 180))
        )
    }

    private func fix(at point: GeoPoint) -> CLLocation {
        CLLocation(
            coordinate: point.coordinate, altitude: 0, horizontalAccuracy: 10,
            verticalAccuracy: -1, timestamp: Date()
        )
    }

    private func waitUntil(
        attempts: Int = 200,
        condition: @escaping () async -> Bool
    ) async -> Bool {
        for _ in 0 ..< attempts {
            if await condition() { return true }
            try? await Task.sleep(for: .milliseconds(10))
        }
        return false
    }

    /// Lets the requests the model just started reach the directions.
    private func settle() async {
        try? await Task.sleep(for: .milliseconds(50))
    }

    private func assertRenders(_ view: some View, _ name: String, file: StaticString = #filePath, line: UInt = #line) {
        for (scheme, size) in [(ColorScheme.light, DynamicTypeSize.large), (.dark, .accessibility3)] {
            let renderer = ImageRenderer(
                content: view
                    .frame(width: 390)
                    .environment(\.colorScheme, scheme)
                    .environment(\.dynamicTypeSize, size)
            )
            XCTAssertGreaterThan(renderer.uiImage?.size.height ?? 0, 0, "\(name), \(scheme), \(size)", file: file, line: line)
        }
    }
}

/// MapKit's directions, answering at once or when the test says so.
@MainActor
private final class FakeWalkingDirections: WalkingDirectionsClient {
    /// What it answers; nil for the straight line between the two points.
    var result: Result<[GeoPoint], Error>?
    /// Holds the answers back until they are released.
    var holds = false
    private(set) var requests: [(origin: GeoPoint, target: GeoPoint)] = []
    private var waiting: [Int: CheckedContinuation<[GeoPoint], Error>] = [:]

    init(result: Result<[GeoPoint], Error>?) {
        self.result = result
    }

    func walkingPath(from origin: GeoPoint, to target: GeoPoint) async throws -> [GeoPoint] {
        let index = requests.count
        requests.append((origin, target))
        if holds {
            return try await withCheckedThrowingContinuation { waiting[index] = $0 }
        }
        return try (result ?? .success([origin, target])).get()
    }

    func release(_ index: Int, with result: Result<[GeoPoint], Error>) {
        waiting.removeValue(forKey: index)?.resume(with: result)
    }

    func releaseAll(with result: Result<[GeoPoint], Error>) {
        for index in waiting.keys.sorted() { release(index, with: result) }
    }
}

private actor WalkStubAPI: ScooterAPIClient {
    private var response: ScooterResponse
    private(set) var calls = 0

    init(response: ScooterResponse) {
        self.response = response
    }

    func scooters(bounds: GeoBounds, zoom: Int, minimumBattery: Int) async throws -> ScooterResponse {
        calls += 1
        return response
    }

    func setResponse(_ response: ScooterResponse) {
        self.response = response
    }
}

private final class WalkLocationManager: CLLocationManager {
    private let status: CLAuthorizationStatus

    init(status: CLAuthorizationStatus) {
        self.status = status
        super.init()
    }

    override var authorizationStatus: CLAuthorizationStatus { status }
    override var location: CLLocation? { nil }
    override func requestWhenInUseAuthorization() {}
    override func startUpdatingLocation() {}
    override func startUpdatingHeading() {}
    override func stopUpdatingHeading() {}
}

private final class WalkClock {
    var now = Date(timeIntervalSince1970: 1_790_000_000)

    func advance(_ seconds: TimeInterval) {
        now = now.addingTimeInterval(seconds)
    }
}

@MainActor
private final class OpenedTargets {
    var targets: [ScooterWalkTarget] = []
}
