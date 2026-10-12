import CoreLocation
import Foundation
import MapKit

/// Finds the way on foot between two points. MapKit's in the app; tests hand
/// in their own, which answers when they say so.
@MainActor
protocol WalkingDirectionsClient: AnyObject {
    /// The points of the walking route, from its start to its end, which
    /// MapKit puts on the paths nearest to the two points. Throws when there
    /// is no route, or when the task is cancelled.
    func walkingPath(from origin: GeoPoint, to target: GeoPoint) async throws -> [GeoPoint]
}

enum WalkingDirectionsError: Error, Equatable {
    /// MapKit answered without a route.
    case noRoute
}

/// Apple's walking directions, the ones Apple Maps gives: no other service is asked.
@MainActor
final class MapKitWalkingDirections: WalkingDirectionsClient {
    func walkingPath(from origin: GeoPoint, to target: GeoPoint) async throws -> [GeoPoint] {
        let request = MKDirections.Request()
        request.source = MKMapItem(location: CLLocation(latitude: origin.latitude, longitude: origin.longitude), address: nil)
        request.destination = MKMapItem(location: CLLocation(latitude: target.latitude, longitude: target.longitude), address: nil)
        request.transportType = .walking
        request.requestsAlternateRoutes = false
        let calculation = DirectionsCalculation(MKDirections(request: request))
        return try await withTaskCancellationHandler {
            try await withCheckedThrowingContinuation { continuation in
                calculation.start(continuation)
            }
        } onCancel: {
            Task { @MainActor in calculation.cancel() }
        }
    }
}

/// One request to MapKit, which answers once: with the route, with an error,
/// or with the cancellation of a route no longer wanted.
@MainActor
private final class DirectionsCalculation {
    private let directions: MKDirections
    private var continuation: CheckedContinuation<[GeoPoint], Error>?
    private var isCancelled = false

    init(_ directions: MKDirections) {
        self.directions = directions
    }

    func start(_ continuation: CheckedContinuation<[GeoPoint], Error>) {
        guard !isCancelled else {
            continuation.resume(throwing: CancellationError())
            return
        }
        self.continuation = continuation
        // MapKit answers on the main queue.
        directions.calculate { [self] response, error in
            let result: Result<[GeoPoint], Error> = if let polyline = response?.routes.first?.polyline,
                                                       polyline.pointCount > 0 {
                .success(polyline.geoPoints)
            } else {
                .failure(error ?? WalkingDirectionsError.noRoute)
            }
            MainActor.assumeIsolated { finish(result) }
        }
    }

    func cancel() {
        isCancelled = true
        directions.cancel()
        finish(.failure(CancellationError()))
    }

    private func finish(_ result: Result<[GeoPoint], Error>) {
        continuation?.resume(with: result)
        continuation = nil
    }
}

private extension MKPolyline {
    var geoPoints: [GeoPoint] {
        var coordinates = [CLLocationCoordinate2D](repeating: kCLLocationCoordinate2DInvalid, count: pointCount)
        getCoordinates(&coordinates, range: NSRange(location: 0, length: pointCount))
        return coordinates.map { GeoPoint(latitude: $0.latitude, longitude: $0.longitude) }
    }
}

extension ScooterWalkTarget {
    /// Apple Maps with walking directions to the scooter or the bay: what
    /// Directions did before the route was drawn in the app, and still does
    /// for a walk of more than ten kilometres or when no route was found.
    @MainActor
    func openInMaps() {
        let destination = MKMapItem(location: CLLocation(latitude: point.latitude, longitude: point.longitude), address: nil)
        switch self {
        case let .scooter(scooter):
            destination.name = String(
                format: String(localized: "%@ scooter"),
                scooter.providerInfo?.name ?? scooter.provider.capitalized
            )
        case let .parking(parking):
            destination.name = parking.name.isEmpty ? parking.bayTitle : parking.name
        }
        destination.openInMaps(launchOptions: [
            MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeWalking
        ])
    }
}
