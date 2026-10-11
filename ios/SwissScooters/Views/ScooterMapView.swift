import MapKit
import SwiftUI
import UIKit

enum ScooterMapCameraPolicy {
    /// The tilt the map opens with, in degrees, so that the buildings stand up
    /// a little. It is the least MapKit keeps: under 20° it lays the map flat
    /// again at the first zoom, the rider's or the app's own.
    static let openingPitch: CGFloat = 20
    /// A map without a size cannot take a region: it lost the opening view of
    /// Switzerland and started out empty. This stands in until the first layout.
    static let openingFrame = CGRect(x: 0, y: 0, width: 390, height: 844)

    @MainActor
    static func applyOpeningPitch(to mapView: MKMapView) {
        let camera = mapView.camera
        camera.pitch = openingPitch
        mapView.setCamera(camera, animated: false)
    }

    /// Moves the map and keeps the tilt and the turn it has.
    @MainActor
    static func setRegionPreservingPerspective(
        _ region: MKCoordinateRegion,
        on mapView: MKMapView,
        animated: Bool
    ) {
        let startingCamera = mapView.camera.copy() as! MKMapCamera
        let pitch = startingCamera.pitch
        let heading = startingCamera.heading

        guard pitch > 0 || heading != 0 else {
            mapView.setRegion(region, animated: animated)
            return
        }

        mapView.setRegion(region, animated: false)
        let targetCamera = mapView.camera.copy() as! MKMapCamera
        targetCamera.pitch = pitch
        targetCamera.heading = heading

        if animated {
            mapView.setCamera(startingCamera, animated: false)
        }
        mapView.setCamera(targetCamera, animated: animated)
    }

    /// The centre that shows a point in the middle of the part of the map left
    /// visible between what covers its top and its bottom, at the current zoom.
    /// The search bar, the locate button and above all the dock cover the map:
    /// centred on the point itself, a scooter can end up behind its own card.
    @MainActor
    static func center(
        showing coordinate: CLLocationCoordinate2D,
        on mapView: MKMapView,
        visibleTop: CGFloat,
        visibleBottom: CGFloat
    ) -> CLLocationCoordinate2D {
        let bounds = mapView.bounds
        let top = max(bounds.minY, visibleTop)
        let bottom = min(bounds.maxY, visibleBottom)
        // With hardly anything left to show it in, the plain centre is as good.
        guard bottom - top >= 44 else { return coordinate }
        let offset = bounds.midY - (top + bottom) / 2
        guard abs(offset) >= 1 else { return coordinate }
        let point = mapView.convert(coordinate, toPointTo: mapView)
        return mapView.convert(CGPoint(x: point.x, y: point.y + offset), toCoordinateFrom: mapView)
    }
}

struct ScooterMapView: UIViewRepresentable {
    let scooters: [Scooter]
    let scooterRevision: Int
    let clusters: [ScooterCluster]
    let clusterRevision: Int
    let usesServerClusters: Bool
    let mapStyle: AppleMapStyle
    let showsUserLocation: Bool
    let focusRequest: MapFocusRequest?
    let destination: MapDestination?
    let selectedScooterID: String?
    var interactionExclusionFrame: CGRect = .null
    /// Where the locate button and the dock under it begin, in window
    /// coordinates; the map from there down is covered.
    var bottomChromeTop: CGFloat? = nil
    /// The locate button and the dock, in window coordinates. The names of
    /// the scooters keep clear of them.
    var bottomChromeFrames: [CGRect] = []
    let onRegionChange: (MKCoordinateRegion, Int) -> Void
    let onSelectionChange: (String?) -> Void
    var userHeading: ScooterUserHeading? = nil
    var showsMapCompass = true
    var parking: [ScooterParking] = []
    var selectedParkingID: String? = nil
    var onParkingSelectionChange: (String?) -> Void = { _ in }
    /// Where distances are counted from: the rider or the searched place,
    /// while it is on the map or near it. Without it every dot looks the same.
    var origin: GeoPoint? = nil
    /// The names on the map and what VoiceOver reads of it are written in it.
    var language = ScooterLanguage.current

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView(frame: ScooterMapCameraPolicy.openingFrame)
        mapView.delegate = context.coordinator
        context.coordinator.applyMapStyle(mapStyle, to: mapView)
        mapView.showsUserLocation = false
        mapView.showsCompass = false
        mapView.showsScale = false
        mapView.isPitchEnabled = true
        mapView.register(
            ScooterUserLocationView.self,
            forAnnotationViewWithReuseIdentifier: ScooterUserLocationView.reuseIdentifier
        )
        mapView.register(
            ScooterAnnotationView.self,
            forAnnotationViewWithReuseIdentifier: ScooterAnnotationView.reuseIdentifier
        )
        mapView.register(
            ScooterClusterAnnotationView.self,
            forAnnotationViewWithReuseIdentifier: ScooterClusterAnnotationView.reuseIdentifier
        )
        mapView.register(
            ScooterClusterAnnotationView.self,
            forAnnotationViewWithReuseIdentifier: ScooterServerClusterAnnotation.reuseIdentifier
        )
        mapView.register(
            MKMarkerAnnotationView.self,
            forAnnotationViewWithReuseIdentifier: SearchedAddressAnnotation.reuseIdentifier
        )
        mapView.register(MKMarkerAnnotationView.self,
            forAnnotationViewWithReuseIdentifier: ScooterParkingAnnotation.reuseIdentifier)
        // MapKit can defer didSelect while resolving dense, overlapping annotations.
        // Publish direct scooter taps immediately and keep the delegate as a fallback.
        let scooterTapRecognizer = UITapGestureRecognizer(
            target: context.coordinator,
            action: #selector(Coordinator.handleMapTap(_:))
        )
        scooterTapRecognizer.cancelsTouchesInView = false
        scooterTapRecognizer.delegate = context.coordinator
        mapView.addGestureRecognizer(scooterTapRecognizer)
        mapView.setRegion(ScooterMapModel.initialRegion, animated: false)
        ScooterMapCameraPolicy.applyOpeningPitch(to: mapView)
        context.coordinator.installCompass(on: mapView)
        // The dots and the names are drawn for one appearance.
        mapView.registerForTraitChanges([UITraitUserInterfaceStyle.self]) {
            [coordinator = context.coordinator] (mapView: MKMapView, _) in
            coordinator.updateLook(on: mapView)
        }
        return mapView
    }

    func updateUIView(_ mapView: MKMapView, context: Context) {
        context.coordinator.parent = self
        context.coordinator.applyMapStyle(mapStyle, to: mapView)
        if mapView.showsUserLocation != showsUserLocation {
            mapView.showsUserLocation = showsUserLocation
        }
        context.coordinator.updateClusteringMode(on: mapView)
        context.coordinator.reconcile(scooters, revision: scooterRevision, on: mapView)
        context.coordinator.reconcile(clusters, revision: clusterRevision, on: mapView)
        context.coordinator.reconcileParking(parking, on: mapView)
        context.coordinator.applyDestination(destination, on: mapView)
        context.coordinator.applySelection(selectedScooterID, on: mapView)
        context.coordinator.applyParkingSelection(selectedParkingID, on: mapView)
        context.coordinator.applyFocus(focusRequest, on: mapView)
        context.coordinator.updateUserHeading(on: mapView, animated: true)
        context.coordinator.updateCompass(on: mapView)
        context.coordinator.updateLook(on: mapView)
        // The dock may have grown over a name.
        context.coordinator.movePills(on: mapView)
    }

    final class Coordinator: NSObject, MKMapViewDelegate, UIGestureRecognizerDelegate {
        var parent: ScooterMapView
        private var annotationsByID: [String: ScooterMapAnnotation] = [:]
        private var clusterAnnotationsByID: [String: ScooterServerClusterAnnotation] = [:]
        private var parkingAnnotationsByID: [String: ScooterParkingAnnotation] = [:]
        private var reconciledParking: [ScooterParking] = []
        private(set) var lastFocusToken: Int?
        private var appliedSelectionID: String?
        private var appliedParkingID: String?
        private var reconciledScooterRevision: Int?
        private var reconciledClusterRevision: Int?
        private var clusteringEnabled: Bool?
        private var appliedDestination: MapDestination?
        private var destinationAnnotation: SearchedAddressAnnotation?
        private var directTapSelectionID: String?
        private var suppressMapKitSelectionUntil: TimeInterval = 0
        private var suppressAllMapKitSelectionsUntil: TimeInterval = 0
        private var compassButton: MKCompassButton?
        private var compassTopConstraint: NSLayoutConstraint?
        private var appliedMapStyle: AppleMapStyle?
        private var appliedLook: LookInputs?
        /// The scooters that carry their name, in the order the names are placed.
        private var namedIDs: [String] = []
        private var pillSides: [String: ScooterPillSide] = [:]
        /// The dots without a name around each named one, from its centre.
        private var pillNeighbours: [String: [CGRect]] = [:]
        /// The dots light up once, the first time they appear.
        private var lightUpEnds: TimeInterval?

        static let mapKitTapResolutionGracePeriod: TimeInterval = 1
        /// The dots are sized again when the scale of the map has changed by this much.
        private static let scaleStep = 0.04

        /// Everything the look of the dots depends on.
        private struct LookInputs: Equatable {
            let revision: Int?
            let origin: GeoPoint?
            let selectedID: String?
            let isDark: Bool
            let isStreetLevel: Bool
            let scaleStep: Int
            let headingStep: Int
            let language: ScooterLanguage
        }

        init(parent: ScooterMapView) {
            self.parent = parent
        }

        func installCompass(on mapView: MKMapView) {
            let compass = MKCompassButton(mapView: mapView)
            compass.translatesAutoresizingMaskIntoConstraints = false
            compass.accessibilityIdentifier = "map-north-compass"
            mapView.addSubview(compass)
            let top = compass.topAnchor.constraint(equalTo: mapView.topAnchor)
            NSLayoutConstraint.activate([
                top,
                compass.trailingAnchor.constraint(equalTo: mapView.safeAreaLayoutGuide.trailingAnchor, constant: -16),
                compass.widthAnchor.constraint(equalToConstant: 44),
                compass.heightAnchor.constraint(equalToConstant: 44)
            ])
            compassButton = compass
            compassTopConstraint = top
            updateCompass(on: mapView)
        }

        func updateCompass(on mapView: MKMapView) {
            guard let compassButton else { return }
            compassButton.compassVisibility = parent.showsMapCompass ? .adaptive : .hidden
            let searchFrame = parent.interactionExclusionFrame
            if searchFrame.isNull || searchFrame.isEmpty {
                compassTopConstraint?.constant = mapView.safeAreaInsets.top + 80
            } else {
                let searchBottom = mapView.convert(
                    CGPoint(x: searchFrame.midX, y: searchFrame.maxY),
                    from: nil
                ).y
                compassTopConstraint?.constant = searchBottom + 12
            }
            mapView.bringSubviewToFront(compassButton)
        }

        static func isCompassView(_ view: UIView?) -> Bool {
            var candidate = view
            while let current = candidate {
                if current is MKCompassButton { return true }
                candidate = current.superview
            }
            return false
        }

        func applyMapStyle(_ style: AppleMapStyle, to mapView: MKMapView) {
            guard style != appliedMapStyle else { return }
            appliedMapStyle = style
            mapView.preferredConfiguration = style.configuration
        }

        func reconcile(_ scooters: [Scooter], revision: Int, on mapView: MKMapView) {
            guard revision != reconciledScooterRevision else { return }
            reconciledScooterRevision = revision

            let incomingIDs = Set(scooters.map(\.id))
            let removedAnnotations = annotationsByID.compactMap { id, annotation in
                incomingIDs.contains(id) ? nil : annotation
            }

            if !removedAnnotations.isEmpty {
                mapView.removeAnnotations(removedAnnotations)
                for annotation in removedAnnotations {
                    annotationsByID.removeValue(forKey: annotation.scooter.id)
                }
            }

            var additions: [ScooterMapAnnotation] = []
            for scooter in scooters {
                if let annotation = annotationsByID[scooter.id] {
                    if annotation.update(with: scooter),
                       let view = mapView.view(for: annotation) as? ScooterAnnotationView {
                        view.refreshAppearance()
                    }
                } else {
                    let annotation = ScooterMapAnnotation(scooter: scooter)
                    annotationsByID[scooter.id] = annotation
                    additions.append(annotation)
                }
            }

            if !additions.isEmpty {
                mapView.addAnnotations(additions)
            }
        }

        func reconcileParking(_ locations: [ScooterParking], on mapView: MKMapView) {
            guard locations != reconciledParking else { return }
            reconciledParking = locations
            let incoming = Dictionary(locations.map { ($0.id, $0) }, uniquingKeysWith: { _, latest in latest })
            let removed = parkingAnnotationsByID.values.filter { incoming[$0.parking.id] != $0.parking }
            if removed.contains(where: { $0.parking.id == appliedParkingID }) {
                // A bay that is still selected is selected again once it is back on the map.
                appliedParkingID = nil
            }
            mapView.removeAnnotations(removed)
            for annotation in removed { parkingAnnotationsByID.removeValue(forKey: annotation.parking.id) }
            let added = locations.filter { parkingAnnotationsByID[$0.id] == nil }.map(ScooterParkingAnnotation.init)
            for annotation in added { parkingAnnotationsByID[annotation.parking.id] = annotation }
            mapView.addAnnotations(added)
        }

        func reconcile(_ clusters: [ScooterCluster], revision: Int, on mapView: MKMapView) {
            guard revision != reconciledClusterRevision else { return }
            reconciledClusterRevision = revision

            let incomingIDs = Set(clusters.map(\.id))
            let removedAnnotations = clusterAnnotationsByID.compactMap { id, annotation in
                incomingIDs.contains(id) ? nil : annotation
            }
            if !removedAnnotations.isEmpty {
                mapView.removeAnnotations(removedAnnotations)
                for annotation in removedAnnotations {
                    clusterAnnotationsByID.removeValue(forKey: annotation.cluster.id)
                }
            }

            var additions: [ScooterServerClusterAnnotation] = []
            for cluster in clusters {
                if let annotation = clusterAnnotationsByID[cluster.id] {
                    if annotation.update(with: cluster),
                       let view = mapView.view(for: annotation) as? ScooterClusterAnnotationView {
                        view.refreshAppearance()
                    }
                } else {
                    let annotation = ScooterServerClusterAnnotation(cluster: cluster)
                    clusterAnnotationsByID[cluster.id] = annotation
                    additions.append(annotation)
                }
            }

            if !additions.isEmpty {
                mapView.addAnnotations(additions)
            }
        }

        func applySelection(_ selectedID: String?, on mapView: MKMapView) {
            guard selectedID != appliedSelectionID else { return }
            appliedSelectionID = selectedID

            for annotation in mapView.selectedAnnotations where annotation is ScooterMapAnnotation {
                mapView.deselectAnnotation(annotation, animated: true)
            }

            if let selectedID, let annotation = annotationsByID[selectedID] {
                mapView.selectAnnotation(annotation, animated: true)
            }
            updateLook(on: mapView)
        }

        func applyParkingSelection(_ selectedID: String?, on mapView: MKMapView) {
            guard selectedID != appliedParkingID else { return }
            appliedParkingID = selectedID

            let animated = !UIAccessibility.isReduceMotionEnabled
            for case let annotation as ScooterParkingAnnotation in mapView.selectedAnnotations
            where annotation.parking.id != selectedID {
                mapView.deselectAnnotation(annotation, animated: animated)
            }

            if let selectedID, let annotation = parkingAnnotationsByID[selectedID] {
                mapView.selectAnnotation(annotation, animated: animated)
            }
        }

        func applyFocus(_ request: MapFocusRequest?, on mapView: MKMapView) {
            guard let request, request.token != lastFocusToken else { return }
            // A map without a size drops the region it is given, so the request
            // waits for the layout; the first region change then applies it.
            guard mapView.bounds.width > 0, mapView.bounds.height > 0 else { return }
            lastFocusToken = request.token
            guard !request.keepsZoom else {
                let visible = visibleBand(of: mapView)
                mapView.setCenter(
                    ScooterMapCameraPolicy.center(
                        showing: request.point.coordinate,
                        on: mapView,
                        visibleTop: visible.minY,
                        visibleBottom: visible.maxY
                    ),
                    animated: !UIAccessibility.isReduceMotionEnabled
                )
                return
            }
            let region = MKCoordinateRegion(
                center: request.point.coordinate,
                latitudinalMeters: request.latitudinalMeters,
                longitudinalMeters: request.longitudinalMeters
            )
            ScooterMapCameraPolicy.setRegionPreservingPerspective(
                region,
                on: mapView,
                animated: !UIAccessibility.isReduceMotionEnabled
            )
        }

        /// The part of the map between the search bar and the locate button
        /// with the dock under it.
        private func visibleBand(of mapView: MKMapView) -> CGRect {
            let topFrame = parent.interactionExclusionFrame
            let top = topFrame.isNull || topFrame.isEmpty
                ? mapView.safeAreaInsets.top
                : mapView.convert(CGPoint(x: topFrame.midX, y: topFrame.maxY), from: nil).y
            let bottom = parent.bottomChromeTop
                .map { mapView.convert(CGPoint(x: 0, y: $0), from: nil).y } ?? mapView.bounds.maxY
            return CGRect(x: mapView.bounds.minX, y: top, width: mapView.bounds.width, height: bottom - top)
        }

        func applyDestination(_ destination: MapDestination?, on mapView: MKMapView) {
            guard destination != appliedDestination else { return }
            appliedDestination = destination

            if let destinationAnnotation {
                mapView.removeAnnotation(destinationAnnotation)
                self.destinationAnnotation = nil
            }

            guard let destination else { return }
            let annotation = SearchedAddressAnnotation(destination: destination)
            destinationAnnotation = annotation
            mapView.addAnnotation(annotation)
        }

        func updateClusteringMode(on mapView: MKMapView) {
            guard mapView.bounds.width > 0, mapView.visibleMapRect.width > 0 else { return }

            let shouldCluster = !parent.usesServerClusters && ScooterClusteringPolicy.shouldCluster(
                at: Self.zoomLevel(on: mapView)
            )
            guard shouldCluster != clusteringEnabled else { return }
            clusteringEnabled = shouldCluster

            let scooterAnnotations = mapView.annotations.compactMap { annotation in
                annotation as? ScooterMapAnnotation
            }
            if !scooterAnnotations.isEmpty {
                // Re-adding the annotations makes MapKit immediately rebuild or
                // dissolve clusters when the zoom threshold is crossed.
                mapView.removeAnnotations(scooterAnnotations)
                mapView.addAnnotations(scooterAnnotations)
            }
        }

        func mapView(_ mapView: MKMapView, regionDidChangeAnimated animated: Bool) {
            applyFocus(parent.focusRequest, on: mapView)
            updateClusteringMode(on: mapView)
            updateLook(on: mapView)
            let region = mapView.region
            let zoom = ScooterClusteringPolicy.apiZoom(for: Self.zoomLevel(on: mapView))
            Task { @MainActor [parent] in
                parent.onRegionChange(region, zoom)
            }
        }

        func mapViewDidChangeVisibleRegion(_ mapView: MKMapView) {
            updateUserHeading(on: mapView, animated: false)
            updateLook(on: mapView)
            movePills(on: mapView)
        }

        func mapView(_ mapView: MKMapView, didUpdate userLocation: MKUserLocation) {
            updateUserHeading(on: mapView, animated: false)
            movePills(on: mapView)
        }

        /// Sizes every dot for its distance and for the scale of the map, names
        /// the nearest of each provider and spreads the scooters that stand on
        /// one spot. It is called whenever something may have changed and
        /// works only when something has.
        func updateLook(on mapView: MKMapView) {
            guard let metresPerPoint = Self.metresPerPoint(on: mapView) else { return }
            let inputs = LookInputs(
                revision: reconciledScooterRevision,
                origin: parent.origin,
                selectedID: appliedSelectionID,
                isDark: mapView.traitCollection.userInterfaceStyle == .dark || parent.mapStyle == .satellite,
                // Zoomed out, MapKit gathers the scooters into clusters.
                isStreetLevel: clusteringEnabled == false,
                scaleStep: Int((log(metresPerPoint) / Self.scaleStep).rounded()),
                headingStep: Int((mapView.camera.heading / 3).rounded()),
                language: parent.language
            )
            guard inputs != appliedLook else { return }
            let previous = appliedLook
            appliedLook = inputs

            let annotations = Array(annotationsByID.values)
            if previous?.revision != inputs.revision || previous?.origin != inputs.origin {
                for annotation in annotations {
                    annotation.metres = inputs.origin.map { annotation.scooter.distance(from: $0) }
                }
            }
            if previous?.isDark != inputs.isDark {
                for case let view as ScooterClusterAnnotationView in mapView.annotations.compactMap(mapView.view(for:)) {
                    view.usesDarkArt = inputs.isDark
                }
            }
            if let previous, previous.language != inputs.language {
                // What VoiceOver reads of the map was written when it was drawn.
                for annotation in mapView.annotations {
                    switch mapView.view(for: annotation) {
                    case let view as ScooterAnnotationView:
                        view.refreshAppearance()
                    case let view as ScooterClusterAnnotationView:
                        view.refreshAccessibility()
                    case let view?:
                        if let parking = annotation as? ScooterParkingAnnotation {
                            Self.describe(view, as: parking.parking)
                        }
                    case nil:
                        break
                    }
                }
            }

            // A name needs single scooters to stand beside and an origin to be near.
            let heads = inputs.isStreetLevel
                ? ScooterMapLook.heads(among: annotations.compactMap { annotation in
                    annotation.metres.map {
                        ScooterDistance(id: annotation.scooter.id, provider: annotation.scooter.provider, metres: $0)
                    }
                })
                : []
            let headIDs = Set(heads.map(\.id))
            var named = heads.map(\.id)
            if inputs.isStreetLevel, let selectedID = inputs.selectedID, !headIDs.contains(selectedID),
               annotationsByID[selectedID] != nil {
                named.insert(selectedID, at: 0)
            }

            // The plane of the screen without its tilt: the scale and the
            // directions are right, which is all that spreading needs.
            let scale = exp(Double(inputs.scaleStep) * Self.scaleStep)
            let pointsPerMapPoint = MKMetersPerMapPointAtLatitude(mapView.centerCoordinate.latitude) / scale
            let turn = -mapView.camera.heading * .pi / 180
            var looks: [String: ScooterDotLook] = [:]
            var dots: [ScooterSpreadDot] = []
            looks.reserveCapacity(annotations.count)
            for annotation in annotations {
                let id = annotation.scooter.id
                let state: ScooterDotState = id == inputs.selectedID
                    ? .selected
                    : headIDs.contains(id) ? .head : .plain
                let look = ScooterMapLook.look(metres: annotation.metres, state: state, metresPerPoint: scale)
                looks[id] = look
                guard inputs.isStreetLevel else { continue }
                let x = annotation.mapPoint.x * pointsPerMapPoint
                let y = annotation.mapPoint.y * pointsPerMapPoint
                dots.append(ScooterSpreadDot(
                    id: id,
                    point: CGPoint(x: x * cos(turn) - y * sin(turn), y: x * sin(turn) + y * cos(turn)),
                    footprint: look.footprint
                ))
            }
            let offsets = ScooterMapLook.spread(dots)

            pillNeighbours = [:]
            let namedDots = dots.filter { named.contains($0.id) }
            for namedDot in namedDots {
                let offset = offsets[namedDot.id] ?? .zero
                let centre = CGPoint(x: namedDot.point.x + offset.x, y: namedDot.point.y + offset.y)
                pillNeighbours[namedDot.id] = dots.compactMap { dot in
                    guard !named.contains(dot.id) else { return nil }
                    let offset = offsets[dot.id] ?? .zero
                    let x = dot.point.x + offset.x - centre.x
                    let y = dot.point.y + offset.y - centre.y
                    guard abs(x) < 160, abs(y) < 60 else { return nil }
                    return CGRect(x: x, y: y, width: 0, height: 0)
                        .insetBy(dx: -dot.footprint / 2, dy: -dot.footprint / 2)
                }
            }

            var changed: [ScooterMapAnnotation] = []
            // A scooter drawn for the first time has no earlier look to ease from.
            var fresh: Set<String> = []
            for annotation in annotations {
                let id = annotation.scooter.id
                guard var look = looks[id] else { continue }
                if !annotation.isStyled {
                    annotation.isStyled = true
                    fresh.insert(id)
                }
                look.offset = offsets[id] ?? .zero
                let pill = named.contains(id) ? ScooterNamePillView.Content(
                    provider: annotation.scooter.providerInfo,
                    name: annotation.scooter.providerInfo?.briefName ?? annotation.scooter.provider.capitalized,
                    time: annotation.metres.map {
                        String(
                            format: String(localized: "%lld min"),
                            Int64(ScooterMapLook.walkingMinutes(metres: $0))
                        )
                    },
                    isFilled: id == inputs.selectedID,
                    isDark: inputs.isDark
                ) : nil
                guard annotation.look != look || annotation.usesDarkArt != inputs.isDark || annotation.pill != pill else {
                    continue
                }
                annotation.look = look
                annotation.usesDarkArt = inputs.isDark
                annotation.pill = pill
                changed.append(annotation)
            }
            namedIDs = named
            pillSides = pillSides.filter { named.contains($0.key) }
            changed += placePills(on: mapView)

            // A change of scale is drawn at once; anything else eases in.
            let animated = previous != nil &&
                previous?.scaleStep == inputs.scaleStep &&
                previous?.headingStep == inputs.headingStep &&
                mapView.window != nil &&
                !UIAccessibility.isReduceMotionEnabled
            for annotation in changed {
                (mapView.view(for: annotation) as? ScooterAnnotationView)?.refreshLook(
                    animated: animated && !fresh.contains(annotation.scooter.id)
                )
            }
        }

        /// Metres across one point in the middle of the map, whatever its tilt.
        private static func metresPerPoint(on mapView: MKMapView) -> Double? {
            let bounds = mapView.bounds
            guard bounds.width > 0, bounds.height > 0 else { return nil }
            let left = mapView.convert(CGPoint(x: bounds.midX - 50, y: bounds.midY), toCoordinateFrom: mapView)
            let right = mapView.convert(CGPoint(x: bounds.midX + 50, y: bounds.midY), toCoordinateFrom: mapView)
            guard CLLocationCoordinate2DIsValid(left), CLLocationCoordinate2DIsValid(right) else { return nil }
            let metres = MKMapPoint(left).distance(to: MKMapPoint(right))
            guard metres.isFinite, metres > 0 else { return nil }
            return metres / 100
        }

        /// Chooses a side for each name. Returns the scooters whose name moved.
        private func placePills(on mapView: MKMapView) -> [ScooterMapAnnotation] {
            guard !namedIDs.isEmpty else { return [] }
            let chrome = parent.bottomChromeFrames
                .filter { !$0.isNull && !$0.isEmpty }
                .map { mapView.convert($0, from: nil) }
            // Beside the locate button the map is free down to the dock.
            var visible = visibleBand(of: mapView)
            if !chrome.isEmpty {
                visible.size.height = mapView.bounds.maxY - visible.minY
            }

            var requests: [ScooterPillRequest] = []
            var neighbours: [CGRect] = []
            // A name without its dot says nothing: off the screen or under
            // the dock it waits.
            var covered: Set<String> = []
            for id in namedIDs {
                guard let annotation = annotationsByID[id], let pill = annotation.pill else { continue }
                let point = mapView.convert(annotation.coordinate, toPointTo: mapView)
                let anchor = CGPoint(x: point.x + annotation.look.offset.x, y: point.y + annotation.look.offset.y)
                guard visible.contains(anchor), !chrome.contains(where: { $0.contains(anchor) }) else {
                    covered.insert(id)
                    continue
                }
                requests.append(ScooterPillRequest(
                    id: id,
                    anchor: anchor,
                    reach: annotation.look.footprint / 2,
                    width: pill.width,
                    preferred: pillSides[id]
                ))
                neighbours += (pillNeighbours[id] ?? []).map { $0.offsetBy(dx: anchor.x, dy: anchor.y) }
            }

            var obstacles = chrome
            if mapView.showsUserLocation, mapView.userLocation.location != nil {
                let point = mapView.convert(mapView.userLocation.coordinate, toPointTo: mapView)
                obstacles.append(CGRect(x: point.x - 15, y: point.y - 15, width: 30, height: 30))
            }
            if let destinationAnnotation {
                // The pin stands on its place.
                let point = mapView.convert(destinationAnnotation.coordinate, toPointTo: mapView)
                obstacles.append(CGRect(x: point.x - 16, y: point.y - 44, width: 32, height: 46))
            }

            var moved: [ScooterMapAnnotation] = []
            let placements = ScooterMapLook.placePills(
                requests,
                avoiding: obstacles,
                sparing: neighbours,
                inside: visible
            )
            var frames: [(id: String, frame: CGRect)] = []
            for (request, placement) in zip(requests, placements) {
                pillSides[placement.id] = placement.side
                frames.append((placement.id, CGRect(
                    x: request.anchor.x + placement.origin.x,
                    y: request.anchor.y + placement.origin.y,
                    width: request.width,
                    height: ScooterMapLook.pillHeight
                )))
                guard let annotation = annotationsByID[placement.id],
                      annotation.pillOrigin != placement.origin else { continue }
                annotation.pillOrigin = placement.origin
                moved.append(annotation)
            }
            // Nor does a name that would be cut by the edge of the map or by
            // the dock, or that found no place but on another name.
            covered.formUnion(ScooterMapLook.unreadablePills(frames, inside: visible, under: chrome))
            for id in namedIDs {
                guard let annotation = annotationsByID[id],
                      annotation.pillIsCovered != covered.contains(id) else { continue }
                annotation.pillIsCovered.toggle()
                if !moved.contains(where: { $0 === annotation }) {
                    moved.append(annotation)
                }
            }
            return moved
        }

        /// The names travel with their dots; what changes while the map moves
        /// is the side a name is on, when its own gets covered or leaves the screen.
        func movePills(on mapView: MKMapView) {
            for annotation in placePills(on: mapView) {
                (mapView.view(for: annotation) as? ScooterAnnotationView)?.refreshLook(
                    animated: !UIAccessibility.isReduceMotionEnabled
                )
            }
        }

        func updateUserHeading(on mapView: MKMapView, animated: Bool) {
            guard let view = mapView.view(for: mapView.userLocation) as? ScooterUserLocationView else {
                return
            }
            view.updateHeading(parent.userHeading, on: mapView, animated: animated)
        }

        func mapView(_ mapView: MKMapView, didAdd views: [MKAnnotationView]) {
            for view in views where view.annotation is MKUserLocation {
                Self.prioritizeUserLocationView(view)
                (view as? ScooterUserLocationView)?.updateHeading(
                    parent.userHeading,
                    on: mapView,
                    animated: false
                )
            }
            lightUp(views, on: mapView)
        }

        /// The one moment of motion: the first time scooters appear, they light
        /// up from the rider outwards. Never again, and not with Reduce Motion.
        private func lightUp(_ views: [MKAnnotationView], on mapView: MKMapView) {
            let now = ProcessInfo.processInfo.systemUptime
            // MapKit may hand over the first scooters in more than one go.
            if let lightUpEnds, now > lightUpEnds { return }
            let dots = views.compactMap { $0 as? ScooterAnnotationView }
            guard !dots.isEmpty else { return }
            if lightUpEnds == nil {
                lightUpEnds = now + 0.3
            }
            guard parent.origin != nil, !UIAccessibility.isReduceMotionEnabled else { return }
            // The distances the delays are counted from.
            updateLook(on: mapView)
            for view in dots {
                view.lightUp()
            }
        }

        static func prioritizeUserLocationView(_ view: MKAnnotationView) {
            view.displayPriority = .required
            view.zPriority = .max
            view.selectedZPriority = .max
        }

        func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
            if annotation is MKUserLocation {
                let view = mapView.dequeueReusableAnnotationView(
                    withIdentifier: ScooterUserLocationView.reuseIdentifier,
                    for: annotation
                )
                Self.prioritizeUserLocationView(view)
                return view
            }

            if let parking = annotation as? ScooterParkingAnnotation {
                let view = mapView.dequeueReusableAnnotationView(
                    withIdentifier: ScooterParkingAnnotation.reuseIdentifier, for: parking
                ) as! MKMarkerAnnotationView
                view.markerTintColor = parking.parking.providerInfo?.uiColor ?? .systemBlue
                view.glyphText = "P"
                view.glyphImage = nil
                // The bay opens in the dock, like a scooter.
                view.canShowCallout = false
                view.displayPriority = .required
                view.clusteringIdentifier = nil
                Self.describe(view, as: parking.parking)
                view.accessibilityTraits = .button
                return view
            }

            if let address = annotation as? SearchedAddressAnnotation {
                let view = mapView.dequeueReusableAnnotationView(
                    withIdentifier: SearchedAddressAnnotation.reuseIdentifier,
                    for: address
                ) as! MKMarkerAnnotationView
                view.markerTintColor = .systemBlue
                view.glyphImage = UIImage(systemName: "magnifyingglass")
                view.canShowCallout = true
                view.displayPriority = .required
                view.clusteringIdentifier = nil
                view.accessibilityLabel = address.title
                return view
            }

            if let cluster = annotation as? MKClusterAnnotation {
                let view = mapView.dequeueReusableAnnotationView(
                    withIdentifier: ScooterClusterAnnotationView.reuseIdentifier,
                    for: cluster
                ) as! ScooterClusterAnnotationView
                view.usesDarkArt = appliedLook?.isDark ?? false
                view.refreshAppearance()
                return view
            }

            if let cluster = annotation as? ScooterServerClusterAnnotation {
                let view = mapView.dequeueReusableAnnotationView(
                    withIdentifier: ScooterServerClusterAnnotation.reuseIdentifier,
                    for: cluster
                ) as! ScooterClusterAnnotationView
                view.usesDarkArt = appliedLook?.isDark ?? false
                view.refreshAppearance()
                return view
            }

            guard annotation is ScooterMapAnnotation else { return nil }
            let view = mapView.dequeueReusableAnnotationView(
                withIdentifier: ScooterAnnotationView.reuseIdentifier,
                for: annotation
            ) as! ScooterAnnotationView
            view.setClusteringEnabled(ScooterClusteringPolicy.shouldCluster(
                at: Self.zoomLevel(on: mapView)
            ))
            view.refreshAppearance()
            return view
        }

        /// What VoiceOver reads of a parking bay.
        private static func describe(_ view: MKAnnotationView, as parking: ScooterParking) {
            view.accessibilityLabel = [parking.bayTitle, parking.name]
                .filter { !$0.isEmpty }
                .joined(separator: ", ")
            // Whether parking here is mandatory is heard at the marker already.
            view.accessibilityValue = parking.notice
            view.accessibilityHint = String(localized: "Shows parking details")
        }

        private static func zoomLevel(on mapView: MKMapView) -> Double {
            guard mapView.bounds.width > 0, mapView.visibleMapRect.width > 0 else { return 0 }
            let zoomScale = Double(mapView.bounds.width) / mapView.visibleMapRect.width
            return log2(zoomScale * MKMapSize.world.width / 256)
        }

        @objc func handleMapTap(_ gestureRecognizer: UITapGestureRecognizer) {
            guard let mapView = gestureRecognizer.view as? MKMapView else { return }
            let point = gestureRecognizer.location(in: mapView)
            guard !Self.isCompassView(mapView.hitTest(point, with: nil)) else { return }
            guard !isExcludedFromMapInteraction(point, on: mapView) else {
                registerExcludedChromeInteraction()
                return
            }
            let scooter = scooterAnnotation(at: point, on: mapView)
            // A bay under the touch is meant, unless the touch is on a dot itself.
            let isOnDot = scooter.map { $0.distance <= $0.annotation.look.footprint / 2 + 4 } ?? false
            if !isOnDot, let parking = parkingAnnotation(at: point, on: mapView) {
                // Like a scooter: publish the tap at once, whatever MapKit resolves later.
                registerDirectMapTap(selectionID: nil)
                publishParkingSelection(parking)
                mapView.selectAnnotation(parking, animated: !UIAccessibility.isReduceMotionEnabled)
                return
            }

            let annotation = scooter?.annotation
            registerDirectMapTap(selectionID: annotation?.scooter.id)

            if let annotation {
                publishSelection(annotation)
                mapView.selectAnnotation(
                    annotation,
                    animated: !UIAccessibility.isReduceMotionEnabled
                )
                updateLook(on: mapView)
            } else {
                clearSelection(on: mapView)
            }
        }

        func gestureRecognizer(
            _ gestureRecognizer: UIGestureRecognizer,
            shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
        ) -> Bool {
            true
        }

        func gestureRecognizer(
            _ gestureRecognizer: UIGestureRecognizer,
            shouldReceive touch: UITouch
        ) -> Bool {
            guard !Self.isCompassView(touch.view) else { return false }
            guard let mapView = gestureRecognizer.view as? MKMapView else { return true }
            guard isExcludedFromMapInteraction(touch.location(in: mapView), on: mapView) else {
                return true
            }

            // Suppress any delayed MapKit selection caused by the same touch,
            // including client and server cluster expansion.
            registerExcludedChromeInteraction()
            return false
        }

        private func isExcludedFromMapInteraction(_ point: CGPoint, on mapView: MKMapView) -> Bool {
            let windowPoint = mapView.convert(point, to: nil)
            return Self.point(windowPoint, isInside: parent.interactionExclusionFrame)
        }

        static func point(_ point: CGPoint, isInside exclusionFrame: CGRect) -> Bool {
            guard !exclusionFrame.isNull,
                  !exclusionFrame.isEmpty,
                  exclusionFrame.width > 0,
                  exclusionFrame.height > 0 else { return false }
            return exclusionFrame.contains(point)
        }

        /// The scooter a touch means, and how far from the centre of its dot
        /// the touch is. Dots are small and stand close together, so the first
        /// marker under the finger is often the wrong one: the nearest centre
        /// wins. A name stands for its dot.
        private func scooterAnnotation(
            at point: CGPoint,
            on mapView: MKMapView
        ) -> (annotation: ScooterMapAnnotation, distance: CGFloat)? {
            var pills: [(annotation: ScooterMapAnnotation, frame: CGRect)] = []
            for id in namedIDs {
                guard let annotation = annotationsByID[id],
                      let view = mapView.view(for: annotation) as? ScooterAnnotationView,
                      view.window != nil,
                      let frame = view.pillFrame else { continue }
                pills.append((annotation, view.convert(frame, to: mapView)))
            }
            if let pill = pills.first(where: { $0.frame.contains(point) }) {
                return (pill.annotation, 0)
            }

            var dots: [(id: String, centre: CGPoint, reach: CGFloat)] = []
            for annotation in annotationsByID.values {
                guard let view = mapView.view(for: annotation),
                      !view.isHidden,
                      view.alpha > 0.01,
                      view.window != nil else { continue }
                let frame = view.convert(view.bounds, to: mapView)
                dots.append((
                    annotation.scooter.id,
                    CGPoint(x: frame.midX, y: frame.midY),
                    max(Self.tapReach, annotation.look.footprint / 2 + 6)
                ))
            }
            if let nearest = ScooterMapLook.nearestDot(to: point, among: dots),
               let annotation = annotationsByID[nearest.id] {
                return (annotation, nearest.distance)
            }

            // A name is 26 pt high; its target is 44.
            if let pill = pills.first(where: { $0.frame.insetBy(dx: -4, dy: -9).contains(point) }) {
                return (pill.annotation, 0)
            }
            return nil
        }

        /// Half of the 44 pt a target needs.
        private static let tapReach: CGFloat = 22

        private func parkingAnnotation(
            at point: CGPoint,
            on mapView: MKMapView
        ) -> ScooterParkingAnnotation? {
            var hitView = mapView.hitTest(point, with: nil)
            while let view = hitView, view !== mapView {
                if let parking = (view as? MKAnnotationView)?.annotation as? ScooterParkingAnnotation {
                    return parking
                }
                hitView = view.superview
            }
            // The target of a dot nearby can lie over the bay.
            return parkingAnnotationsByID.values.first { annotation in
                guard let view = mapView.view(for: annotation), !view.isHidden, view.window != nil else {
                    return false
                }
                return view.convert(view.bounds, to: mapView).contains(point)
            }
        }

        private func publishSelection(_ annotation: ScooterMapAnnotation) {
            let scooterID = annotation.scooter.id
            guard appliedSelectionID != scooterID else { return }
            appliedSelectionID = scooterID
            parent.onSelectionChange(scooterID)
        }

        private func publishParkingSelection(_ annotation: ScooterParkingAnnotation) {
            let parkingID = annotation.parking.id
            guard appliedParkingID != parkingID else { return }
            appliedParkingID = parkingID
            ScooterAnalytics.shared.track("parking_select", provider: annotation.parking.provider)
            parent.onParkingSelectionChange(parkingID)
        }

        func clearSelection(on mapView: MKMapView) {
            if appliedParkingID != nil {
                appliedParkingID = nil
                for case let annotation as ScooterParkingAnnotation in mapView.selectedAnnotations {
                    mapView.deselectAnnotation(annotation, animated: false)
                }
                parent.onParkingSelectionChange(nil)
            }

            guard appliedSelectionID != nil else { return }
            appliedSelectionID = nil
            for annotation in mapView.selectedAnnotations where annotation is ScooterMapAnnotation {
                mapView.deselectAnnotation(annotation, animated: false)
            }
            parent.onSelectionChange(nil)
            updateLook(on: mapView)
        }

        private func registerDirectMapTap(selectionID: String?) {
            directTapSelectionID = selectionID
            suppressMapKitSelectionUntil = ProcessInfo.processInfo.systemUptime +
                Self.mapKitTapResolutionGracePeriod
        }

        private func registerExcludedChromeInteraction() {
            suppressAllMapKitSelectionsUntil = ProcessInfo.processInfo.systemUptime +
                Self.mapKitTapResolutionGracePeriod
        }

        static func shouldSuppressMapKitSelection(
            candidateID: String,
            intendedID: String?,
            until deadline: TimeInterval,
            now: TimeInterval
        ) -> Bool {
            now < deadline && candidateID != intendedID
        }

        static func shouldSuppressAllMapKitSelections(
            until deadline: TimeInterval,
            now: TimeInterval
        ) -> Bool {
            now < deadline
        }

        private func restoreDirectSelection(on mapView: MKMapView) {
            if let directTapSelectionID {
                guard let annotation = annotationsByID[directTapSelectionID] else { return }
                mapView.selectAnnotation(annotation, animated: false)
            } else if let appliedParkingID, let annotation = parkingAnnotationsByID[appliedParkingID] {
                mapView.selectAnnotation(annotation, animated: false)
            }
        }

        func mapView(_ mapView: MKMapView, didSelect view: MKAnnotationView) {
            let now = ProcessInfo.processInfo.systemUptime
            if Self.shouldSuppressAllMapKitSelections(
                until: suppressAllMapKitSelectionsUntil,
                now: now
            ) {
                if let annotation = view.annotation {
                    mapView.deselectAnnotation(annotation, animated: false)
                }
                return
            }
            if now >= suppressAllMapKitSelectionsUntil {
                suppressAllMapKitSelectionsUntil = 0
            }

            if let cluster = view.annotation as? ScooterServerClusterAnnotation {
                ScooterAnalytics.shared.track("cluster_select")
                let span = mapView.region.span
                ScooterMapCameraPolicy.setRegionPreservingPerspective(
                    MKCoordinateRegion(
                        center: cluster.coordinate,
                        span: MKCoordinateSpan(
                            latitudeDelta: cluster.cluster.city == nil ? span.latitudeDelta / 4 : 0.08,
                            longitudeDelta: cluster.cluster.city == nil ? span.longitudeDelta / 4 : 0.12
                        )
                    ),
                    on: mapView,
                    animated: !UIAccessibility.isReduceMotionEnabled
                )
                mapView.deselectAnnotation(cluster, animated: false)
                return
            }

            if let cluster = view.annotation as? MKClusterAnnotation {
                ScooterAnalytics.shared.track("cluster_select")
                mapView.showAnnotations(cluster.memberAnnotations, animated: true)
                mapView.deselectAnnotation(cluster, animated: false)
                return
            }

            if let parking = view.annotation as? ScooterParkingAnnotation {
                // A bay MapKit resolves after a direct tap on something else does not replace it.
                if now < suppressMapKitSelectionUntil, appliedParkingID != parking.parking.id {
                    mapView.deselectAnnotation(parking, animated: false)
                    restoreDirectSelection(on: mapView)
                    return
                }
                publishParkingSelection(parking)
                return
            }
            guard let annotation = view.annotation as? ScooterMapAnnotation else { return }
            if Self.shouldSuppressMapKitSelection(
                candidateID: annotation.scooter.id,
                intendedID: directTapSelectionID,
                until: suppressMapKitSelectionUntil,
                now: now
            ) {
                mapView.deselectAnnotation(annotation, animated: false)
                restoreDirectSelection(on: mapView)
                return
            }
            if now >= suppressMapKitSelectionUntil {
                directTapSelectionID = nil
                suppressMapKitSelectionUntil = 0
            }
            publishSelection(annotation)
            updateLook(on: mapView)
        }

        func mapView(_ mapView: MKMapView, didDeselect view: MKAnnotationView) {
            let now = ProcessInfo.processInfo.systemUptime
            guard now >= suppressMapKitSelectionUntil,
                  now >= suppressAllMapKitSelectionsUntil else { return }
            if let parking = view.annotation as? ScooterParkingAnnotation {
                guard appliedParkingID == parking.parking.id else { return }
                appliedParkingID = nil
                parent.onParkingSelectionChange(nil)
                return
            }
            guard let annotation = view.annotation as? ScooterMapAnnotation,
                  appliedSelectionID == annotation.scooter.id else { return }
            appliedSelectionID = nil
            parent.onSelectionChange(nil)
            updateLook(on: mapView)
        }
    }
}

final class ScooterParkingAnnotation: NSObject, MKAnnotation {
    static let reuseIdentifier = "scooter-parking"
    let parking: ScooterParking
    var coordinate: CLLocationCoordinate2D { parking.coordinate }
    var title: String? { parking.bayTitle }
    var subtitle: String? { parking.name }
    init(parking: ScooterParking) { self.parking = parking; super.init() }
}

final class SearchedAddressAnnotation: NSObject, MKAnnotation {
    static let reuseIdentifier = "searched-address"

    let coordinate: CLLocationCoordinate2D
    let title: String?

    init(destination: MapDestination) {
        coordinate = destination.point.coordinate
        title = destination.title
        super.init()
    }
}

final class ScooterMapAnnotation: NSObject, MKAnnotation {
    @objc dynamic var coordinate: CLLocationCoordinate2D
    private(set) var scooter: Scooter
    private(set) var mapPoint: MKMapPoint
    /// How the marker draws this scooter. The map's coordinator sets these
    /// for every scooter; the marker shows what it finds.
    var look = ScooterDotLook()
    var isStyled = false
    var usesDarkArt = false
    /// From the origin; nil without one.
    var metres: CLLocationDistance?
    /// The name beside the dot, and where it sits from the centre of the dot.
    var pill: ScooterNamePillView.Content?
    var pillOrigin = CGPoint.zero
    /// The dot is off the map or under the dock, or its name would be cut
    /// or lie on another: the name is not shown.
    var pillIsCovered = false

    init(scooter: Scooter) {
        self.scooter = scooter
        coordinate = scooter.coordinate
        mapPoint = MKMapPoint(scooter.coordinate)
        super.init()
    }

    @discardableResult
    func update(with scooter: Scooter) -> Bool {
        guard self.scooter != scooter else { return false }
        let coordinateChanged = coordinate.latitude != scooter.latitude ||
            coordinate.longitude != scooter.longitude
        self.scooter = scooter
        if coordinateChanged {
            coordinate = scooter.coordinate
            mapPoint = MKMapPoint(scooter.coordinate)
        }
        return true
    }
}

final class ScooterServerClusterAnnotation: NSObject, MKAnnotation {
    static let reuseIdentifier = "server-scooter-cluster"

    @objc dynamic var coordinate: CLLocationCoordinate2D
    private(set) var cluster: ScooterCluster

    init(cluster: ScooterCluster) {
        self.cluster = cluster
        coordinate = cluster.coordinate
        super.init()
    }

    @discardableResult
    func update(with cluster: ScooterCluster) -> Bool {
        guard self.cluster != cluster else { return false }
        let coordinateChanged = coordinate.latitude != cluster.latitude ||
            coordinate.longitude != cluster.longitude
        self.cluster = cluster
        if coordinateChanged {
            coordinate = cluster.coordinate
        }
        return true
    }
}

final class ScooterAnnotationView: MKAnnotationView {
    static let reuseIdentifier = "scooter"
    static let clusteringIdentifier = "scooters"
    static let selectedMarkerZPriority = MKAnnotationViewZPriority(rawValue: 900)
    /// The dot is far smaller than a finger; the marker around it is not.
    static let markerSize = CGSize(width: 44, height: 44)

    private let dotLayer = CALayer()
    private var pillView: ScooterNamePillView?
    /// The picture the marker shows: the dot with its ring and its glow.
    private(set) var art: ScooterDotArt.Key?

    override var annotation: MKAnnotation? {
        didSet { refreshAppearance() }
    }

    override init(annotation: MKAnnotation?, reuseIdentifier: String?) {
        super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)
        configureView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        configureView()
    }

    private func configureView() {
        bounds = CGRect(origin: .zero, size: Self.markerSize)
        centerOffset = .zero
        setClusteringEnabled(false)
        zPriority = .defaultUnselected
        selectedZPriority = Self.selectedMarkerZPriority
        canShowCallout = false
        backgroundColor = .clear

        // The glow and the name reach beyond the marker.
        layer.masksToBounds = false
        layer.addSublayer(dotLayer)

        isAccessibilityElement = true
        accessibilityTraits = .button
        refreshAppearance()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        dotLayer.position = CGPoint(x: bounds.midX, y: bounds.midY)
        CATransaction.commit()
    }

    override func prepareForReuse() {
        super.prepareForReuse()
        art = nil
        dotLayer.removeAllAnimations()
        dotLayer.contents = nil
        pillView?.removeFromSuperview()
        pillView = nil
        centerOffset = .zero
        zPriority = .defaultUnselected
        accessibilityLabel = nil
        accessibilityValue = nil
        accessibilityTraits = .button
    }

    /// The name beside the dot, in the marker's own coordinates.
    var pillFrame: CGRect? {
        pillView?.frame
    }

    func setClusteringEnabled(_ enabled: Bool) {
        clusteringIdentifier = enabled ? Self.clusteringIdentifier : nil
        collisionMode = enabled ? .circle : .none
        displayPriority = enabled ? .defaultHigh : .required
    }

    func refreshAppearance() {
        guard let scooterAnnotation = annotation as? ScooterMapAnnotation else { return }
        refreshLook(animated: false)

        let scooter = scooterAnnotation.scooter
        let provider = scooter.providerInfo
        accessibilityLabel = String(
            format: String(localized: "%@ scooter"),
            provider?.name ?? scooter.provider.capitalized
        )
        var accessibilityDetails: [String] = []
        if let metres = scooterAnnotation.metres, metres.isFinite {
            accessibilityDetails.append(String(
                format: String(localized: "≈%1$lld min walk · %2$@"),
                Int64(ScooterMapLook.walkingMinutes(metres: metres)),
                Scooter.formattedLength(meters: metres)
            ))
        }
        if let battery = scooter.battery {
            let batteryValue = String(
                format: String(localized: "%lld percent"),
                Int64(battery)
            )
            accessibilityDetails.append("\(String(localized: "Battery")): \(batteryValue)")
        }
        if let range = scooter.formattedRange {
            accessibilityDetails.append("\(String(localized: "Estimated range")): \(range)")
        }
        accessibilityValue = accessibilityDetails.isEmpty
            ? nil
            : accessibilityDetails.joined(separator: ", ")
        accessibilityHint = String(localized: "Shows scooter details")
    }

    /// Draws the dot, its place among the others and its name as the
    /// annotation has them now.
    func refreshLook(animated: Bool) {
        guard let scooterAnnotation = annotation as? ScooterMapAnnotation else { return }
        let look = scooterAnnotation.look
        let key = ScooterDotArt.Key(
            provider: scooterAnnotation.scooter.providerInfo,
            diameter: look.diameter,
            state: look.state,
            showsInitials: look.showsInitials,
            isDark: scooterAnnotation.usesDarkArt
        )

        CATransaction.begin()
        CATransaction.setDisableActions(!animated)
        if key != art {
            art = key
            let image = ScooterDotArt.image(for: key)
            dotLayer.contents = image.cgImage
            dotLayer.contentsScale = image.scale
            dotLayer.bounds = CGRect(origin: .zero, size: image.size)
        }
        dotLayer.position = CGPoint(x: bounds.midX, y: bounds.midY)
        dotLayer.opacity = Float(look.strength)
        CATransaction.commit()

        if zPriority.rawValue != look.zPriority {
            zPriority = MKAnnotationViewZPriority(rawValue: look.zPriority)
        }
        if centerOffset != look.offset {
            if animated {
                UIView.animate(withDuration: 0.22) { self.centerOffset = look.offset }
            } else {
                centerOffset = look.offset
            }
        }
        showPill(
            scooterAnnotation.pillIsCovered ? nil : scooterAnnotation.pill,
            at: scooterAnnotation.pillOrigin,
            animated: animated
        )
    }

    private func showPill(_ content: ScooterNamePillView.Content?, at origin: CGPoint, animated: Bool) {
        guard let content else {
            pillView?.removeFromSuperview()
            pillView = nil
            return
        }
        let frame = CGRect(
            x: bounds.midX + origin.x,
            y: bounds.midY + origin.y,
            width: content.width,
            height: ScooterMapLook.pillHeight
        )
        guard let pillView else {
            let pill = ScooterNamePillView()
            pill.show(content)
            pill.frame = frame
            addSubview(pill)
            pillView = pill
            if animated {
                pill.alpha = 0
                UIView.animate(withDuration: 0.2) { pill.alpha = 1 }
            }
            return
        }
        pillView.show(content)
        if animated, pillView.frame != frame {
            UIView.animate(withDuration: 0.2) { pillView.frame = frame }
        } else {
            pillView.frame = frame
        }
    }

    /// The dot comes up from nothing, later the farther it is from the origin
    /// (1.5 ms a metre), and the names follow once the dots are there.
    func lightUp() {
        guard let scooterAnnotation = annotation as? ScooterMapAnnotation else { return }
        let delay = min(1.2, max(0, scooterAnnotation.metres ?? 0) * 0.0015)

        let fade = CABasicAnimation(keyPath: "opacity")
        fade.fromValue = 0
        let grow = CABasicAnimation(keyPath: "transform.scale")
        grow.fromValue = 0.2
        let appear = CAAnimationGroup()
        appear.animations = [fade, grow]
        appear.duration = 0.62
        appear.beginTime = dotLayer.convertTime(CACurrentMediaTime(), from: nil) + delay
        appear.fillMode = .backwards
        appear.timingFunction = CAMediaTimingFunction(controlPoints: 0.22, 1, 0.36, 1)
        dotLayer.add(appear, forKey: "light-up")

        guard let pillView else { return }
        let name = CABasicAnimation(keyPath: "opacity")
        name.fromValue = 0
        name.duration = 0.52
        name.beginTime = pillView.layer.convertTime(CACurrentMediaTime(), from: nil) + 0.9
        name.fillMode = .backwards
        pillView.layer.add(name, forKey: "name-in")
    }

    override func setSelected(_ selected: Bool, animated: Bool) {
        super.setSelected(selected, animated: animated)
        if selected {
            accessibilityTraits.insert(.selected)
        } else {
            accessibilityTraits.remove(.selected)
        }
    }
}

/// A cluster or a city total: a soft glowing disc with its number, in the
/// family of the dots.
final class ScooterClusterAnnotationView: MKAnnotationView {
    static let reuseIdentifier = "scooter-cluster"

    private let discLayer = CALayer()
    private let countLabel = UILabel()
    private var art: ScooterDotArt.ClusterKey?
    private var renderedProviderCounts: [ScooterProvider: Int] = [:]
    private var renderedCount = 0
    private var renderedCity: String?
    /// Dark appearance, and the satellite picture in either appearance.
    var usesDarkArt = false {
        didSet {
            if usesDarkArt != oldValue { refreshArt() }
        }
    }

    override var annotation: MKAnnotation? {
        didSet { refreshAppearance() }
    }

    override init(annotation: MKAnnotation?, reuseIdentifier: String?) {
        super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)
        configureView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        configureView()
    }

    private func configureView() {
        bounds = CGRect(x: 0, y: 0, width: 48, height: 48)
        centerOffset = .zero
        collisionMode = .circle
        displayPriority = .required
        zPriority = .defaultUnselected
        selectedZPriority = .defaultUnselected
        canShowCallout = false

        layer.masksToBounds = false
        layer.addSublayer(discLayer)

        countLabel.textAlignment = .center
        countLabel.font = .monospacedDigitSystemFont(ofSize: 13, weight: .bold)
        // Four digits fit; a larger city total shrinks instead of being cut off.
        countLabel.adjustsFontSizeToFitWidth = true
        countLabel.minimumScaleFactor = 0.6
        countLabel.baselineAdjustment = .alignCenters
        addSubview(countLabel)

        isAccessibilityElement = true
        accessibilityTraits = .button
        accessibilityHint = String(localized: "Zooms in to show individual scooters")
    }

    /// Writes what VoiceOver reads of the total again, in the language the
    /// app is now shown in.
    func refreshAccessibility() {
        accessibilityLabel = Self.accessibilityLabel(count: renderedCount, city: renderedCity)
        accessibilityHint = String(localized: "Zooms in to show individual scooters")
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        discLayer.position = CGPoint(x: bounds.midX, y: bounds.midY)
        CATransaction.commit()
        let diameter = art?.diameter ?? 36
        countLabel.bounds = CGRect(x: 0, y: 0, width: diameter - 8, height: diameter - 8)
        countLabel.center = CGPoint(x: bounds.midX, y: bounds.midY)
    }

    func refreshAppearance() {
        var providerCounts: [ScooterProvider: Int] = [:]
        providerCounts.reserveCapacity(ScooterProvider.allCases.count)
        let count: Int
        // Only a city total has a name.
        var city: String?

        if let cluster = annotation as? MKClusterAnnotation {
            for case let member as ScooterMapAnnotation in cluster.memberAnnotations {
                if let provider = member.scooter.providerInfo {
                    providerCounts[provider, default: 0] += 1
                }
            }
            count = cluster.memberAnnotations.count
        } else if let annotation = annotation as? ScooterServerClusterAnnotation {
            for (providerID, providerCount) in annotation.cluster.providers {
                if let provider = ScooterProvider(rawValue: providerID) {
                    providerCounts[provider, default: 0] += providerCount
                }
            }
            count = annotation.cluster.count
            city = annotation.cluster.city
        } else {
            return
        }

        // A reused view with the same numbers must not keep another city's name.
        guard count != renderedCount || providerCounts != renderedProviderCounts || city != renderedCity else {
            return
        }
        renderedCount = count
        renderedProviderCounts = providerCounts
        renderedCity = city
        countLabel.text = "\(count)"
        accessibilityLabel = Self.accessibilityLabel(count: count, city: city)
        refreshArt()
    }

    /// The disc grows with the digits of its number and glows in the colour
    /// of the provider with the most scooters in it.
    private func refreshArt() {
        let leading = ScooterProvider.allCases.max { first, second in
            (renderedProviderCounts[first] ?? 0) < (renderedProviderCounts[second] ?? 0)
        }
        let key = ScooterDotArt.ClusterKey(
            provider: leading.flatMap { renderedProviderCounts[$0] == nil ? nil : $0 },
            diameter: renderedCount < 100 ? 36 : renderedCount < 1_000 ? 40 : 44,
            isDark: usesDarkArt
        )
        countLabel.textColor = usesDarkArt
            ? UIColor(red: 0.957, green: 0.961, blue: 0.969, alpha: 1)
            : UIColor(red: 0.063, green: 0.075, blue: 0.102, alpha: 1)
        guard key != art else { return }
        art = key
        let image = ScooterDotArt.clusterImage(for: key)
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        discLayer.contents = image.cgImage
        discLayer.contentsScale = image.scale
        discLayer.bounds = CGRect(origin: .zero, size: image.size)
        CATransaction.commit()
        setNeedsLayout()
    }

    /// "Zürich, 1’288 scooters" for a city total, so a rider who cannot see the
    /// map can pick a city; "40 scooters" for any other cluster.
    static func accessibilityLabel(count: Int, city: String?) -> String {
        guard let city, !city.isEmpty else {
            return String(
                format: String(localized: "%@ scooters"),
                count.formatted(.number.locale(ScooterLanguage.current.locale))
            )
        }
        if count == 1 {
            return String(format: String(localized: "%@, one scooter"), city)
        }
        return String(
            format: String(localized: "%@, %lld scooters"),
            locale: ScooterLanguage.current.locale,
            city,
            Int64(count)
        )
    }
}
