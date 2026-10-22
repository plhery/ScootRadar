import MapKit
import SwiftUI
import UIKit

/// Whether the map shows a scale while it zooms: where the region measures in
/// miles, so a rider can judge feet and miles on the map as Apple Maps lets
/// them. Metric regions keep the map as it was.
enum ScooterMapScalePolicy {
    static func showsScale(locale: Locale) -> Bool {
        locale.measurementSystem != .metric
    }
}

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

    /// Moves the map and keeps the tilt and the turn it has. Beside a panel the
    /// region's centre goes to the middle of the part of the map left `visible`
    /// beside it. Up and down it stays the middle of the whole map, as a region
    /// always was on a phone, where nothing covers the sides.
    @MainActor
    static func setRegionPreservingPerspective(
        _ region: MKCoordinateRegion,
        on mapView: MKMapView,
        animated: Bool,
        visible: CGRect? = nil
    ) {
        let startingCamera = mapView.camera.copy() as! MKMapCamera
        let pitch = startingCamera.pitch
        let heading = startingCamera.heading
        let beside = aside(visible, in: mapView.bounds)

        guard pitch > 0 || heading != 0 || beside != nil else {
            mapView.setRegion(region, animated: animated)
            return
        }

        mapView.setRegion(region, animated: false)
        var targetCamera = mapView.camera.copy() as! MKMapCamera
        targetCamera.pitch = pitch
        targetCamera.heading = heading
        if let beside {
            // Where the centre goes is measured on the map as the camera will show it.
            mapView.setCamera(targetCamera, animated: false)
            targetCamera = targetCamera.copy() as! MKMapCamera
            targetCamera.centerCoordinate = center(showing: region.center, on: mapView, visible: beside)
        }

        if animated {
            mapView.setCamera(startingCamera, animated: false)
        }
        mapView.setCamera(targetCamera, animated: animated)
    }

    /// The centre that shows a point in the middle of the part of the map left
    /// visible by what covers it, at the current zoom. The search bar, the
    /// locate button and above all the dock cover the map, and in a large
    /// window a panel down one side: centred on the point itself, a scooter
    /// can end up behind its own card. `marginsMoved` says that the map's
    /// margins were moved past a panel or a fold.
    @MainActor
    static func center(
        showing coordinate: CLLocationCoordinate2D,
        on mapView: MKMapView,
        visible: CGRect,
        marginsMoved: Bool = false
    ) -> CLLocationCoordinate2D {
        let bounds = mapView.bounds
        let top = max(bounds.minY, visible.minY)
        let bottom = min(bounds.maxY, visible.maxY)
        let leading = max(bounds.minX, visible.minX)
        let trailing = min(bounds.maxX, visible.maxX)
        // MapKit shows the centre in the middle of the map's layout margins,
        // which a panel or a fold moves past it: then the offset is measured
        // from where the centre is shown, not from the middle of the map.
        let middle = marginsMoved || trailing - leading < bounds.width
            ? mapView.convert(mapView.centerCoordinate, toPointTo: mapView)
            : CGPoint(x: bounds.midX, y: bounds.midY)
        // With hardly anything left to show it in, the plain centre is as good.
        let offsetY = bottom - top >= 44 ? middle.y - (top + bottom) / 2 : 0
        let offsetX = trailing - leading >= 44 ? middle.x - (leading + trailing) / 2 : 0
        guard abs(offsetX) >= 1 || abs(offsetY) >= 1 else { return coordinate }
        let point = mapView.convert(coordinate, toPointTo: mapView)
        return mapView.convert(CGPoint(x: point.x + offsetX, y: point.y + offsetY), toCoordinateFrom: mapView)
    }

    /// What a region is centred in beside a panel or a fold: as wide as the
    /// part of the map left `visible`, as tall as the map. None where nothing
    /// covers a side, and the region keeps to the middle of the map's margins.
    static func aside(_ visible: CGRect?, in bounds: CGRect) -> CGRect? {
        guard let visible else { return nil }
        let beside = CGRect(x: visible.minX, y: bounds.minY, width: visible.width, height: bounds.height)
        return abs(beside.intersection(bounds).midX - bounds.midX) >= 1 ? beside : nil
    }

    /// Where a move to a place shows it, so where a step in or out keeps
    /// what is shown: beside a panel or a fold, the middle of the part of the
    /// map left `visible` across and of the whole map up and down; elsewhere
    /// where MapKit shows the centre, the middle of the map's margins.
    @MainActor
    static func focus(on mapView: MKMapView, visible: CGRect) -> CGPoint {
        let shown = mapView.convert(mapView.centerCoordinate, toPointTo: mapView)
        guard let beside = aside(visible, in: mapView.bounds) else { return shown }
        let across = beside.intersection(mapView.bounds)
        return CGPoint(x: across.width >= 44 ? across.midX : shown.x, y: mapView.bounds.midY)
    }

    /// The part of a map of `bounds` left visible between what covers its
    /// `top` and its `bottom`, and beside `panel`, the panel down one side of
    /// a large window. The panel counts as tall as the map, as far down as a
    /// card in it may grow. On a phone nothing covers the sides.
    static func visibleRect(in bounds: CGRect, top: CGFloat, bottom: CGFloat, beside panel: CGRect?) -> CGRect {
        let band = CGRect(x: bounds.minX, y: top, width: bounds.width, height: bottom - top)
        guard let panel, !panel.isNull, !panel.isEmpty else { return band }
        let minX = panel.midX < bounds.midX ? min(max(panel.maxX, bounds.minX), bounds.maxX) : bounds.minX
        let maxX = panel.midX < bounds.midX ? bounds.maxX : max(min(panel.minX, bounds.maxX), bounds.minX)
        return CGRect(x: minX, y: band.minY, width: maxX - minX, height: band.height)
    }

    /// Where the map shows what it centres beside the fold of a partly open
    /// iPhone Duo.
    enum FoldSide: Equatable {
        /// Above a fold across the map, standing like a laptop: the upright
        /// half, with the search bar, the notices and the dock on the flat one.
        case above
        /// Left or right of a fold down the map, open like a book: the half
        /// away from the panel, or the trailing one without a panel.
        case left
        case right
    }

    static func side(of fold: CGRect, panel: CGRect?, rightToLeft: Bool) -> FoldSide {
        if ScooterFold.isAcross(fold) { return .above }
        if let panel, !panel.isNull, !panel.isEmpty { return panel.midX < fold.midX ? .right : .left }
        return rightToLeft ? .left : .right
    }

    /// The part of `visible` on the `side` of a `fold` where the map shows.
    /// What covers the map on the other side covers none of it: above a fold
    /// across the map, the search bar lying under it with the dock doesn't,
    /// and the map shows from the top of its safe area, `safeTop`, down to
    /// the fold. With hardly any room left the fold is let be.
    static func visibleRect(_ visible: CGRect, safeTop: CGFloat, beside fold: CGRect, on side: FoldSide) -> CGRect {
        let rect: CGRect
        switch side {
        case .above:
            let top = visible.minY < fold.minY ? visible.minY : safeTop
            rect = CGRect(x: visible.minX, y: top, width: visible.width, height: min(visible.maxY, fold.minY) - top)
        case .right:
            let minX = max(visible.minX, fold.maxX)
            rect = CGRect(x: minX, y: visible.minY, width: visible.maxX - minX, height: visible.height)
        case .left:
            let maxX = min(visible.maxX, fold.minX)
            rect = CGRect(x: visible.minX, y: visible.minY, width: maxX - visible.minX, height: visible.height)
        }
        return rect.width >= 44 && rect.height >= 44 ? rect : visible
    }

    /// The camera's distance `steps` in, or out when negative: each step
    /// halves or doubles it, as a double tap or a tap with two fingers does.
    static func distance(_ distance: CLLocationDistance, zoomedBy steps: Int) -> CLLocationDistance {
        distance / pow(2, Double(steps))
    }

    /// The widest phone. Its spans were chosen on phones.
    static let phoneWidth: CGFloat = 440

    /// How much more ground than asked a map `length` points across shows, so
    /// that a span chosen on a phone looks there as it does on a phone instead
    /// of closer in: locating shows the same streets, larger windows more of
    /// them around. 1 up to the widest phone, so phones are as they were.
    static func spanScale(across length: CGFloat) -> Double {
        max(1, Double(length / phoneWidth))
    }
}

#if DEBUG
/// A camera to open the map on, for screenshots, in DEBUG builds only:
/// `-ScreenshotCamera "lat,lng,distance,pitch,heading"` is the point looked at,
/// the camera's distance from it in metres, its tilt and the direction it
/// faces in degrees, and `-ScreenshotTerrain realistic` draws the ground in 3D,
/// with Apple's models of landmarks where it has them. A located rider leaves
/// the map where the camera put it.
enum ScooterScreenshotCamera {
    static func fromLaunchArguments(_ defaults: UserDefaults = .standard) -> MKMapCamera? {
        guard let values = defaults.string(forKey: "ScreenshotCamera")?
            .split(separator: ",")
            .compactMap({ Double($0.trimmingCharacters(in: .whitespaces)) }),
            values.count == 5 else { return nil }
        return MKMapCamera(
            lookingAtCenter: CLLocationCoordinate2D(latitude: values[0], longitude: values[1]),
            fromDistance: values[2],
            pitch: values[3],
            heading: values[4]
        )
    }

    static func drawsTerrain(_ defaults: UserDefaults = .standard) -> Bool {
        defaults.string(forKey: "ScreenshotTerrain") == "realistic"
    }
}
#endif

struct ScooterMapView: UIViewRepresentable {
    let scooters: [Scooter]
    let scooterRevision: Int
    let clusters: [ScooterCluster]
    let clusterRevision: Int
    let usesServerClusters: Bool
    let mapStyle: AppleMapStyle
    let showsUserLocation: Bool
    let focusRequest: MapFocusRequest?
    /// A step in or out asked from the keyboard.
    var zoomRequest: MapZoomRequest? = nil
    let destination: MapDestination?
    let selectedScooterID: String?
    var interactionExclusionFrame: CGRect = .null
    /// Where the locate button and the dock under it begin, in window
    /// coordinates; the map from there down is covered.
    var bottomChromeTop: CGFloat? = nil
    /// The locate button and the dock, in window coordinates. The names of
    /// the scooters keep clear of them.
    var bottomChromeFrames: [CGRect] = []
    /// The panel down the leading side of a large window, in window
    /// coordinates. The map shows a scooter beside it, keeps names and taps
    /// off it, and moves Apple's logo and Legal link out from under it.
    var panelFrame: CGRect = .null
    /// The fold of a partly open iPhone Duo, in window coordinates. The map
    /// shows a scooter above it, or on the far side of it from the panel,
    /// and keeps names, the compass and Apple's logo off it.
    var foldFrame: CGRect = .null
    /// The region, the zoom asked of the server and the zoom as drawn.
    let onRegionChange: (MKCoordinateRegion, Int, Double) -> Void
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
    /// The walking route to the selected scooter or bay, while one is shown.
    var walkTrail: WalkTrail? = nil
    /// A walk is under way: the selected scooter or bay stays selected and
    /// on its own whatever the zoom, and a tap on the empty map keeps it.
    var isWalking = false
    /// What is left of the route, for the time on the selected scooter's name.
    var walkRemainingMetres: CLLocationDistance? = nil

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView(frame: ScooterMapCameraPolicy.openingFrame)
        mapView.delegate = context.coordinator
        context.coordinator.applyMapStyle(mapStyle, to: mapView)
        mapView.showsUserLocation = false
        mapView.showsCompass = false
        // The scale MapKit places itself would sit under the search bar; see installScale(on:).
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
        #if DEBUG
        if let camera = ScooterScreenshotCamera.fromLaunchArguments() {
            mapView.setCamera(camera, animated: false)
        }
        #endif
        context.coordinator.installCompass(on: mapView)
        context.coordinator.installScale(on: mapView)
        // The dots and the names are drawn for one appearance.
        mapView.registerForTraitChanges([UITraitUserInterfaceStyle.self]) {
            [coordinator = context.coordinator] (mapView: MKMapView, _) in
            coordinator.updateLook(on: mapView)
            coordinator.updateTrailLook(on: mapView)
        }
        return mapView
    }

    func updateUIView(_ mapView: MKMapView, context: Context) {
        context.coordinator.parent = self
        context.coordinator.updates += 1
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
        context.coordinator.applyWalking(on: mapView)
        // The margins first: a move is measured with the margins it is shown
        // with, and a change of them doesn't stop a move begun in this update.
        context.coordinator.updateMargins(on: mapView)
        context.coordinator.applyFocus(focusRequest, on: mapView)
        context.coordinator.applyZoom(zoomRequest, on: mapView)
        context.coordinator.keepSelectionClearOfPanel(on: mapView)
        context.coordinator.applyTrail(walkTrail, on: mapView)
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
        /// How many times SwiftUI has updated the map, and how many times the
        /// map has come to rest somewhere new. A screen at rest adds to neither.
        fileprivate(set) var updates = 0
        private(set) var regionChanges = 0
        private var lastZoomToken: Int?
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
        private var scaleView: MKScaleView?
        private var scaleTopConstraint: NSLayoutConstraint?
        /// The scale's leading edge: at the map's safe area, or beside a panel.
        private var scaleBesideSafeArea: NSLayoutConstraint?
        private var scaleBesidePanel: NSLayoutConstraint?
        /// The map's layout margins before a panel or a fold moved them.
        private var restingMargins: NSDirectionalEdgeInsets?
        /// The margins set beside the panel or the fold, as they were set.
        private var movedMargins: NSDirectionalEdgeInsets?
        /// The place last asked for, from its move until the person moves the
        /// map or chooses something else to show, or another place is asked
        /// for. Once made, the move is done for the margins it was made with:
        /// only the leading margin moving, with the panel or a fold down the
        /// map, takes the map on to the place again, measured beside them as
        /// they now are.
        private var focusUnderWay: FocusUnderWay?
        /// How many moves to a place asked for were made, first moves and
        /// moves made again: tests hold it to one for each place and a few
        /// more for the panel moving, which no loop could keep to.
        private(set) var movesToPlaces = 0
        /// A selection just made, until when it is brought out from under a panel.
        private var watchedSelection: (key: String, until: TimeInterval)?
        private var appliedMapStyle: AppleMapStyle?
        private var appliedLook: LookInputs?
        /// The scooters that carry their name, in the order the names are placed.
        private var namedIDs: [String] = []
        private var pillSides: [String: ScooterPillSide] = [:]
        /// The dots without a name around each named one, from its centre.
        private var pillNeighbours: [String: [CGRect]] = [:]
        /// The dots light up once, the first time they appear.
        private var lightUpEnds: TimeInterval?
        private let trail = WalkTrailOverlay()
        /// The scooter walked to, which MapKit never gathers into a cluster.
        private var heldScooterID: String?
        /// A route waits for the camera to fit it before it draws itself.
        private var pendingReveal: (revision: Int, since: TimeInterval)?
        private var revealFallback: Task<Void, Never>?

        static let mapKitTapResolutionGracePeriod: TimeInterval = 1
        /// The dots are sized again when the scale of the map has changed by this much.
        private static let scaleStep = 0.04

        /// Everything the look of the dots depends on.
        private struct LookInputs: Equatable {
            let revision: Int?
            let origin: GeoPoint?
            let selectedID: String?
            /// Along the route to the selected scooter, while one is shown.
            let walkMinutes: Int?
            let isDark: Bool
            let isStreetLevel: Bool
            let usesServerClusters: Bool
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

        /// A scale while the map zooms, for a region that measures in miles,
        /// where Apple Maps shows one too, opposite the compass under the search bar.
        func installScale(on mapView: MKMapView, locale: Locale = .current) {
            guard ScooterMapScalePolicy.showsScale(locale: locale) else { return }
            let scale = MKScaleView(mapView: mapView)
            scale.translatesAutoresizingMaskIntoConstraints = false
            scale.scaleVisibility = .adaptive
            scale.legendAlignment = .leading
            scale.accessibilityIdentifier = "map-scale"
            mapView.addSubview(scale)
            let top = scale.topAnchor.constraint(equalTo: mapView.topAnchor)
            let leading = scale.leadingAnchor.constraint(equalTo: mapView.safeAreaLayoutGuide.leadingAnchor, constant: 16)
            NSLayoutConstraint.activate([top, leading])
            scaleView = scale
            scaleTopConstraint = top
            scaleBesideSafeArea = leading
            scaleBesidePanel = scale.leadingAnchor.constraint(equalTo: mapView.layoutMarginsGuide.leadingAnchor)
            updateCompass(on: mapView)
        }

        func updateCompass(on mapView: MKMapView) {
            let searchFrame = parent.interactionExclusionFrame
            let panel = panel(in: mapView)
            let top: CGFloat
            let search = searchFrame.isNull || searchFrame.isEmpty ? nil : mapView.convert(searchFrame, from: nil)
            if let panel {
                // Beside a panel, level with its top, the compass on the far
                // side of the map and the scale next to the panel.
                top = panel.minY
            } else if let fold = fold(in: mapView), ScooterFold.isAcross(fold),
                      search.map({ $0.minY >= fold.minY }) ?? true {
                // Above a fold across the map, with the search bar on the flat
                // half under it: at the top of the upright half.
                top = mapView.safeAreaInsets.top + 12
            } else if search == nil {
                top = mapView.safeAreaInsets.top + 80
            } else {
                top = mapView.convert(
                    CGPoint(x: searchFrame.midX, y: searchFrame.maxY),
                    from: nil
                ).y + 12
            }
            if let scaleView {
                scaleTopConstraint?.constant = top
                let besidePanel = panel != nil
                if besidePanel != (scaleBesidePanel?.isActive == true) {
                    // The one in place goes first, so that the two never pull at once.
                    (besidePanel ? scaleBesideSafeArea : scaleBesidePanel)?.isActive = false
                    (besidePanel ? scaleBesidePanel : scaleBesideSafeArea)?.isActive = true
                }
                mapView.bringSubviewToFront(scaleView)
            }
            guard let compassButton else { return }
            compassButton.compassVisibility = parent.showsMapCompass ? .adaptive : .hidden
            compassTopConstraint?.constant = top
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
            let configuration = style.configuration
            #if DEBUG
            if ScooterScreenshotCamera.drawsTerrain() { configuration.elevationStyle = .realistic }
            #endif
            mapView.preferredConfiguration = configuration
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
            focusUnderWay = FocusUnderWay(request: request, margins: margins(of: mapView))
            move(to: request, on: mapView)
        }

        /// The margins as last set, or as the map has them, without the safe
        /// area UIKit adds to them.
        private func margins(of mapView: MKMapView) -> NSDirectionalEdgeInsets {
            movedMargins ?? restingMargins ?? Self.withoutSafeArea(mapView.directionalLayoutMargins, of: mapView)
        }

        /// A step in or out from the keyboard: the camera comes closer or goes
        /// further, keeps its tilt and its turn, and what is shown where a move
        /// to a place shows it stays there. The camera looks at another point
        /// than that beside a panel: zoomed around it, the rider just located
        /// slid away from the middle. Up and down that is the middle of the
        /// whole map, where locating leaves it, not of the part under the
        /// status bar.
        func applyZoom(_ request: MapZoomRequest?, on mapView: MKMapView) {
            guard let request, request.token != lastZoomToken else { return }
            lastZoomToken = request.token
            guard mapView.bounds.width > 0, mapView.bounds.height > 0 else { return }
            // A step from the keyboard moves the map as the person's hand does.
            focusUnderWay = nil
            let middle = ScooterMapCameraPolicy.focus(on: mapView, visible: visibleRect(of: mapView))
            let kept = mapView.convert(middle, toCoordinateFrom: mapView)
            let starting = mapView.camera.copy() as! MKMapCamera
            var target = starting.copy() as! MKMapCamera
            target.centerCoordinateDistance = ScooterMapCameraPolicy.distance(
                starting.centerCoordinateDistance,
                zoomedBy: request.steps
            )
            // Where the middle goes is measured on the map as the camera will show it.
            mapView.setCamera(target, animated: false)
            let shown = mapView.convert(kept, toPointTo: mapView)
            let lookedAt = mapView.convert(target.centerCoordinate, toPointTo: mapView)
            target = target.copy() as! MKMapCamera
            target.centerCoordinate = mapView.convert(
                CGPoint(x: lookedAt.x + shown.x - middle.x, y: lookedAt.y + shown.y - middle.y),
                toCoordinateFrom: mapView
            )
            let animated = !UIAccessibility.isReduceMotionEnabled
            if animated {
                mapView.setCamera(starting, animated: false)
            }
            mapView.setCamera(target, animated: animated)
        }

        /// Moves the map to show the place asked for in the middle of the part
        /// of it left in view.
        private func move(to request: MapFocusRequest, on mapView: MKMapView) {
            movesToPlaces += 1
            let visible = visibleRect(of: mapView)
            guard !request.keepsZoom else {
                mapView.setCenter(
                    ScooterMapCameraPolicy.center(
                        showing: request.point.coordinate,
                        on: mapView,
                        visible: visible,
                        marginsMoved: movedMargins != nil
                    ),
                    animated: !UIAccessibility.isReduceMotionEnabled
                )
                return
            }
            // A span fits the map's shorter side.
            let scale = ScooterMapCameraPolicy.spanScale(across: min(mapView.bounds.width, mapView.bounds.height))
            let region = MKCoordinateRegion(
                center: request.point.coordinate,
                latitudinalMeters: request.latitudinalMeters * scale,
                longitudinalMeters: request.longitudinalMeters * scale
            )
            ScooterMapCameraPolicy.setRegionPreservingPerspective(
                region,
                on: mapView,
                animated: !UIAccessibility.isReduceMotionEnabled,
                visible: visible
            )
        }

        /// The part of the map between the search bar and the locate button
        /// with the dock under it, and beside the panel of a large window,
        /// unless `besidePanel` is false. Beside the fold of a partly open
        /// iPhone Duo, only the part on the side where the map shows.
        private func visibleRect(of mapView: MKMapView, besidePanel: Bool = true) -> CGRect {
            let topFrame = parent.interactionExclusionFrame
            let top = topFrame.isNull || topFrame.isEmpty
                ? mapView.safeAreaInsets.top
                : mapView.convert(CGPoint(x: topFrame.midX, y: topFrame.maxY), from: nil).y
            let bottom = parent.bottomChromeTop
                .map { mapView.convert(CGPoint(x: 0, y: $0), from: nil).y } ?? mapView.bounds.maxY
            let visible = ScooterMapCameraPolicy.visibleRect(
                in: mapView.bounds,
                top: top,
                bottom: bottom,
                beside: besidePanel ? panel(in: mapView) : nil
            )
            guard let fold = fold(in: mapView) else { return visible }
            return ScooterMapCameraPolicy.visibleRect(
                visible,
                safeTop: mapView.safeAreaInsets.top,
                beside: fold,
                on: foldSide(fold, on: mapView)
            )
        }

        /// The panel of a large window, in the map's own coordinates.
        private func panel(in mapView: MKMapView) -> CGRect? {
            let frame = parent.panelFrame
            guard !frame.isNull, !frame.isEmpty else { return nil }
            return mapView.convert(frame, from: nil)
        }

        /// The fold of a partly open iPhone Duo, in the map's own coordinates.
        private func fold(in mapView: MKMapView) -> CGRect? {
            let frame = parent.foldFrame
            guard !frame.isNull, !frame.isEmpty else { return nil }
            let fold = mapView.convert(frame, from: nil)
            return fold.intersects(mapView.bounds) ? fold : nil
        }

        private func foldSide(_ fold: CGRect, on mapView: MKMapView) -> ScooterMapCameraPolicy.FoldSide {
            ScooterMapCameraPolicy.side(
                of: fold,
                panel: panel(in: mapView),
                rightToLeft: mapView.effectiveUserInterfaceLayoutDirection == .rightToLeft
            )
        }

        /// Between the panel or the fold and Apple's logo, and the scale, beside it.
        private static let panelGap: CGFloat = 16

        /// A move to a place asked for, made on a map with a size, with what
        /// it was measured with.
        private struct FocusUnderWay {
            let request: MapFocusRequest
            /// The margins, without the safe area, the move was last made with.
            var margins: NSDirectionalEdgeInsets
            /// How many times it was made again since.
            var madeAgain = 0
        }

        /// The most times a move is made again: each is a real change of the
        /// leading margin, which a move of the camera doesn't change, and a
        /// panel, a fold, a turn of the screen and larger text are about all
        /// that changes it. Past this the move is over, whatever else might
        /// keep moving the margin.
        private static let mostMovesAgain = 6

        /// Apple's logo and the Legal link sit inside the map's layout margins:
        /// beside a panel the leading margin reaches past it, so that they stay
        /// in view. Beside the fold of a partly open iPhone Duo the margin on
        /// its far side from the map reaches past it too: the bottom one above
        /// a fold across the map, so that the map centres what it shows in the
        /// upright half, a side one beside a fold down it. Without either the
        /// margins are left as they were.
        ///
        /// UIKit reads a view's margins back with its safe area added to the
        /// margins set, so the margins are compared with those last set, and
        /// the resting ones are taken without the safe area. Compared with
        /// what is read back, they never matched beside a panel once the map
        /// had a safe area: the map was set again and re-centred at every
        /// update, which stopped every move of the camera where it began, and
        /// locating left the rider off the screen.
        func updateMargins(on mapView: MKMapView) {
            let panel = panel(in: mapView)
            let fold = fold(in: mapView)
            guard panel != nil || fold != nil else {
                if let restingMargins {
                    setMargins(restingMargins, on: mapView)
                    self.restingMargins = nil
                    movedMargins = nil
                }
                return
            }
            let resting = restingMargins ?? Self.withoutSafeArea(mapView.directionalLayoutMargins, of: mapView)
            restingMargins = resting
            // Measured from the map's safe area, as its margins are, on the
            // left and the right as they show.
            let bounds = mapView.bounds
            let safe = mapView.safeAreaInsets
            let isRightToLeft = mapView.effectiveUserInterfaceLayoutDirection == .rightToLeft
            var left = isRightToLeft ? resting.trailing : resting.leading
            var right = isRightToLeft ? resting.leading : resting.trailing
            var bottom = resting.bottom
            if let panel {
                if isRightToLeft {
                    right = max(right, bounds.maxX - safe.right - panel.minX + Self.panelGap)
                } else {
                    left = max(left, panel.maxX - bounds.minX - safe.left + Self.panelGap)
                }
            }
            if let fold {
                switch foldSide(fold, on: mapView) {
                case .above: bottom = max(bottom, bounds.maxY - safe.bottom - fold.minY + Self.panelGap)
                case .right: left = max(left, fold.maxX - bounds.minX - safe.left + Self.panelGap)
                case .left: right = max(right, bounds.maxX - safe.right - fold.minX + Self.panelGap)
                }
            }
            let margins = NSDirectionalEdgeInsets(
                top: resting.top,
                leading: isRightToLeft ? right : left,
                bottom: bottom,
                trailing: isRightToLeft ? left : right
            )
            // A frame converted between views may differ in its last digits
            // from one update to the next: that is no move of the panel or
            // the fold.
            if let movedMargins, Self.nearlyEqual(margins, movedMargins, within: 0.5) { return }
            movedMargins = margins
            setMargins(margins, on: mapView)
        }

        private static func nearlyEqual(
            _ some: NSDirectionalEdgeInsets,
            _ other: NSDirectionalEdgeInsets,
            within tolerance: CGFloat
        ) -> Bool {
            abs(some.top - other.top) < tolerance && abs(some.leading - other.leading) < tolerance
                && abs(some.bottom - other.bottom) < tolerance && abs(some.trailing - other.trailing) < tolerance
        }

        /// Margins as read back from the map, without the safe area UIKit adds to them.
        private static func withoutSafeArea(
            _ margins: NSDirectionalEdgeInsets,
            of mapView: MKMapView
        ) -> NSDirectionalEdgeInsets {
            let safe = mapView.safeAreaInsets
            let isRightToLeft = mapView.effectiveUserInterfaceLayoutDirection == .rightToLeft
            return NSDirectionalEdgeInsets(
                top: max(0, margins.top - safe.top),
                leading: max(0, margins.leading - (isRightToLeft ? safe.right : safe.left)),
                bottom: max(0, margins.bottom - safe.bottom),
                trailing: max(0, margins.trailing - (isRightToLeft ? safe.left : safe.right))
            )
        }

        /// MapKit shows the map's centre in the middle of its margins, and
        /// leaves the map where it is when they change: what was in the middle
        /// of the part left in view, the rider's place after locating, goes to
        /// the middle of the part left in view now, as a panel comes or goes.
        ///
        /// A move to a place asked for may still be under way: the rider's
        /// first fix can come before the panel has its place. Until the person
        /// moves the map or chooses something else, the map goes on to the
        /// place, measured beside the panel; keeping the centre would stop it
        /// where it was, short of the place. However long the first layout
        /// takes: a move given a second and a half to be over left the rider
        /// in the middle of the whole map after a slow one.
        ///
        /// The move is made again only when the leading margin really moves,
        /// with the panel or a fold down the map, once for each time, and no
        /// more than a few times in all: nothing the camera shows, such as the
        /// dock or a card, moves it. Made again at every change of the margins,
        /// it had no bound but the changes, as long as the person left the map
        /// alone. Any other margin moving, the bottom one rising to the fold of
        /// a Duo standing like a laptop, ends it, and the map keeps its centre.
        ///
        /// A map SwiftUI hasn't given a size yet shows nothing to keep, and
        /// MapKit holds back a centre or a camera given to it until it has
        /// one, then sets it over any move made in between: at launch the panel
        /// takes its place then, and the centre kept for it took the map back
        /// from the rider's first fix, with the rider off the bottom of the
        /// screen. Such a map only takes the margins, and a move under way is
        /// made again once the map has its size, at its first region change.
        ///
        /// iOS opens and folds an iPhone Duo inside an animation, as it turns
        /// the screen. Margins set in it reached MapKit only at its end, after
        /// the move had been measured against the old ones: the rider ended
        /// off the middle by half their change, at the zoom that fitted the old
        /// margins. The map takes them at once, outside the animation.
        private func setMargins(_ margins: NSDirectionalEdgeInsets, on mapView: MKMapView) {
            let centre = mapView.centerCoordinate
            UIView.performWithoutAnimation {
                mapView.directionalLayoutMargins = margins
                mapView.layoutIfNeeded()
            }
            guard mapView.bounds.width > 0, mapView.bounds.height > 0 else {
                if focusUnderWay != nil {
                    lastFocusToken = nil
                    focusUnderWay = nil
                }
                return
            }
            guard var focus = focusUnderWay else {
                mapView.setCenter(centre, animated: false)
                return
            }
            // Margins much as the move had them leave it on its way.
            guard !Self.nearlyEqual(margins, focus.margins, within: 1) else { return }
            guard abs(margins.leading - focus.margins.leading) >= 1,
                  focus.madeAgain < Self.mostMovesAgain else {
                focusUnderWay = nil
                mapView.setCenter(centre, animated: false)
                return
            }
            focus.margins = margins
            focus.madeAgain += 1
            focusUnderWay = focus
            move(to: focus.request, on: mapView)
        }

        /// A scooter or bay doesn't move the map when it is chosen. Beside a
        /// panel, though, its card opens in the panel, which may then grow over
        /// it: the map brings it out once, in the second after it was chosen.
        func keepSelectionClearOfPanel(on mapView: MKMapView) {
            let key = parent.selectedScooterID.map { "scooter:\($0)" }
                ?? parent.selectedParkingID.map { "parking:\($0)" }
            let now = ProcessInfo.processInfo.systemUptime
            if key != watchedSelection?.key {
                watchedSelection = key.map { ($0, now + 1) }
                // A scooter or a bay chosen is what the map shows now.
                if key != nil { focusUnderWay = nil }
            }
            guard let watched = watchedSelection, now < watched.until,
                  let panel = panel(in: mapView) else { return }
            let annotation: MKAnnotation? = parent.selectedScooterID.flatMap { annotationsByID[$0] }
                ?? parent.selectedParkingID.flatMap { parkingAnnotationsByID[$0] }
            guard let coordinate = annotation?.coordinate,
                  panel.contains(mapView.convert(coordinate, toPointTo: mapView)) else { return }
            watchedSelection = (watched.key, 0)
            mapView.setCenter(
                ScooterMapCameraPolicy.center(
                    showing: coordinate,
                    on: mapView,
                    visible: visibleRect(of: mapView),
                    marginsMoved: movedMargins != nil
                ),
                animated: !UIAccessibility.isReduceMotionEnabled
            )
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
                // The scooter walked to was selected before and stays so.
                if let heldScooterID, let annotation = annotationsByID[heldScooterID] {
                    mapView.selectAnnotation(annotation, animated: false)
                }
            }
        }

        func mapView(_ mapView: MKMapView, regionWillChangeAnimated animated: Bool) {
            // The person moving the map ends the move to a place asked for.
            if focusUnderWay != nil, Self.isMovedByHand(mapView) { focusUnderWay = nil }
        }

        /// Whether one of the map's gestures, a pan, a pinch, a turn, a tilt
        /// or a double tap, is moving it.
        private static func isMovedByHand(_ mapView: MKMapView) -> Bool {
            func moving(_ view: UIView, depth: Int) -> Bool {
                let recognizers = view.gestureRecognizers ?? []
                if recognizers.contains(where: { [.began, .changed, .ended].contains($0.state) }) { return true }
                return depth > 0 && view.subviews.contains { moving($0, depth: depth - 1) }
            }
            return moving(mapView, depth: 2)
        }

        func mapView(_ mapView: MKMapView, regionDidChangeAnimated animated: Bool) {
            regionChanges += 1
            // The camera has fitted a new route: it draws itself now. Not on
            // what the fit itself does at once, before its move.
            if let pendingReveal, pendingReveal.revision == trail.revision,
               animated || ProcessInfo.processInfo.systemUptime - pendingReveal.since > 0.1 {
                revealPendingRoute()
            }
            trail.mapDidMove(on: mapView)
            applyFocus(parent.focusRequest, on: mapView)
            updateClusteringMode(on: mapView)
            updateLook(on: mapView)
            let region = mapView.region
            let zoomLevel = Self.zoomLevel(on: mapView)
            let zoom = ScooterClusteringPolicy.apiZoom(for: zoomLevel)
            Task { @MainActor [parent] in
                parent.onRegionChange(region, zoom, zoomLevel)
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
                walkMinutes: parent.walkRemainingMetres.map(ScooterMapLook.walkingMinutes(metres:)),
                isDark: isDark(mapView),
                // Zoomed out, MapKit gathers the scooters into clusters.
                isStreetLevel: clusteringEnabled == false,
                usesServerClusters: parent.usesServerClusters,
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
                }, countedInGroups: inputs.usesServerClusters)
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
                // The scooter walked to says the time along its route.
                let minutes = (id == inputs.selectedID ? inputs.walkMinutes : nil)
                    ?? annotation.metres.map(ScooterMapLook.walkingMinutes(metres:))
                let pill = named.contains(id) ? ScooterNamePillView.Content(
                    provider: annotation.scooter.providerInfo,
                    name: annotation.scooter.providerInfo?.briefName ?? annotation.scooter.provider.capitalized,
                    time: minutes.map {
                        String(format: String(localized: "%lld min"), Int64($0))
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
            // A panel covers only as far down as it reaches: below it the
            // names show as anywhere else.
            var chrome = (parent.bottomChromeFrames + [parent.panelFrame])
                .filter { !$0.isNull && !$0.isEmpty }
                .map { mapView.convert($0, from: nil) }
            // Beside the locate button the map is free down to the dock.
            var visible = visibleRect(of: mapView, besidePanel: false)
            if !chrome.isEmpty {
                visible.size.height = mapView.bounds.maxY - visible.minY
            }
            // Beside the fold of a partly open iPhone Duo the names show on
            // both halves, off the fold and what covers either of them.
            if let fold = fold(in: mapView) {
                let top = mapView.safeAreaInsets.top
                visible = CGRect(x: mapView.bounds.minX, y: top, width: mapView.bounds.width, height: mapView.bounds.maxY - top)
                chrome.append(fold)
                let search = parent.interactionExclusionFrame
                if !search.isNull, !search.isEmpty { chrome.append(mapView.convert(search, from: nil)) }
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

            guard let scooter = annotation as? ScooterMapAnnotation else { return nil }
            let view = mapView.dequeueReusableAnnotationView(
                withIdentifier: ScooterAnnotationView.reuseIdentifier,
                for: annotation
            ) as! ScooterAnnotationView
            view.setClusteringEnabled(scooter.scooter.id != heldScooterID && ScooterClusteringPolicy.shouldCluster(
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
            } else if !parent.isWalking {
                // During a walk the card stays open: the map is for looking around.
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
                || Self.point(windowPoint, isInside: parent.panelFrame)
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
                focusUnderWay = nil
                // A city's span is a phone's, as when a city is chosen.
                let city = ScooterMapCameraPolicy.spanScale(across: min(mapView.bounds.width, mapView.bounds.height))
                let visible = visibleRect(of: mapView)
                // A group opens onto its cities, each a total of its own again.
                if let bounds = cluster.cluster.bounds {
                    ScooterMapCameraPolicy.setRegionPreservingPerspective(
                        MKCoordinateRegion(
                            center: bounds.center.coordinate,
                            span: MKCoordinateSpan(
                                latitudeDelta: max((bounds.north - bounds.south) * 1.6, 0.08 * city),
                                longitudeDelta: max(bounds.longitudeSpan * 1.6, 0.12 * city)
                            )
                        ),
                        on: mapView,
                        animated: !UIAccessibility.isReduceMotionEnabled,
                        visible: visible
                    )
                    mapView.deselectAnnotation(cluster, animated: false)
                    return
                }
                let span = mapView.region.span
                ScooterMapCameraPolicy.setRegionPreservingPerspective(
                    MKCoordinateRegion(
                        center: cluster.coordinate,
                        span: MKCoordinateSpan(
                            latitudeDelta: cluster.cluster.city == nil ? span.latitudeDelta / 4 : 0.08 * city,
                            longitudeDelta: cluster.cluster.city == nil ? span.longitudeDelta / 4 : 0.12 * city
                        )
                    ),
                    on: mapView,
                    animated: !UIAccessibility.isReduceMotionEnabled,
                    visible: visible
                )
                mapView.deselectAnnotation(cluster, animated: false)
                return
            }

            if let cluster = view.annotation as? MKClusterAnnotation {
                ScooterAnalytics.shared.track("cluster_select")
                showMembers(of: cluster, on: mapView)
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
            if parent.isWalking, keepWalkSelection(of: view.annotation, on: mapView) { return }
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

        // MARK: Walking route

        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            trail.renderer(for: overlay) ?? MKOverlayRenderer(overlay: overlay)
        }

        private func isDark(_ mapView: MKMapView) -> Bool {
            mapView.traitCollection.userInterfaceStyle == .dark || parent.mapStyle == .satellite
        }

        func updateTrailLook(on mapView: MKMapView) {
            trail.setDark(isDark(mapView))
        }

        /// The scooter walked to stands on its own, outside MapKit's clusters.
        func applyWalking(on mapView: MKMapView) {
            let held = parent.isWalking ? parent.selectedScooterID : nil
            guard held != heldScooterID else { return }
            let previous = heldScooterID
            heldScooterID = held
            for id in [previous, held].compactMap({ $0 }) {
                guard let annotation = annotationsByID[id],
                      let view = mapView.view(for: annotation) as? ScooterAnnotationView else { continue }
                view.setClusteringEnabled(id != held && clusteringEnabled == true)
            }
        }

        /// A new route is fitted on the map and then draws itself; a route
        /// found again on the way takes the old one's place as it is; the
        /// part walked goes; a route no longer wanted fades.
        func applyTrail(_ walkTrail: WalkTrail?, on mapView: MKMapView) {
            trail.setDark(isDark(mapView))
            guard let walkTrail else {
                pendingReveal = nil
                revealFallback?.cancel()
                trail.hide(on: mapView)
                return
            }
            guard walkTrail.revision != trail.revision else {
                trail.setWalked(walkTrail.walked)
                return
            }
            let animated = !UIAccessibility.isReduceMotionEnabled && mapView.window != nil
            let reveals = walkTrail.reveals && animated
            trail.show(walkTrail, on: mapView, drawn: reveals ? 0 : 1)
            pendingReveal = nil
            revealFallback?.cancel()
            guard walkTrail.reveals else { return }
            fitRoute(walkTrail, on: mapView, animated: animated)
            guard reveals else {
                // Fitted at once: the dots are spaced for where the camera is now.
                trail.mapDidMove(on: mapView)
                return
            }
            pendingReveal = (walkTrail.revision, ProcessInfo.processInfo.systemUptime)
            revealFallback = Task { @MainActor [weak self] in
                try? await Task.sleep(for: .seconds(WalkTrailLook.fitDuration))
                guard !Task.isCancelled else { return }
                self?.revealPendingRoute()
            }
        }

        private func revealPendingRoute() {
            guard pendingReveal != nil else { return }
            pendingReveal = nil
            revealFallback?.cancel()
            revealFallback = nil
            trail.revealRoute(animated: !UIAccessibility.isReduceMotionEnabled)
        }

        /// Shows the whole route between the search bar and the dock, or
        /// beside the panel, turned and tilted as the map is, no closer than
        /// street level.
        private func fitRoute(_ walkTrail: WalkTrail, on mapView: MKMapView, animated: Bool) {
            focusUnderWay = nil
            fit(walkTrail.points.map(\.coordinate), on: mapView, animated: animated)
        }

        /// A cluster opens onto its scooters. Beside a panel or a fold they
        /// are fitted like a route into the part of the map left visible; on
        /// a phone MapKit shows them, as it always has.
        private func showMembers(of cluster: MKClusterAnnotation, on mapView: MKMapView) {
            focusUnderWay = nil
            guard movedMargins != nil else {
                mapView.showAnnotations(cluster.memberAnnotations, animated: true)
                return
            }
            fit(cluster.memberAnnotations.map(\.coordinate), on: mapView, animated: !UIAccessibility.isReduceMotionEnabled)
        }

        private func fit(_ coordinates: [CLLocationCoordinate2D], on mapView: MKMapView, animated: Bool) {
            let bounds = mapView.bounds
            guard bounds.width > 0, bounds.height > 0, let first = coordinates.first else { return }
            var band = visibleRect(of: mapView)
            // MapKit frames a region within the map's layout margins, which a
            // panel or a fold moves past it.
            var frame = bounds
            if movedMargins != nil {
                frame = bounds.inset(by: mapView.layoutMargins)
                band = band.intersection(frame)
            }
            var visible = band.insetBy(dx: WalkTrailLook.fitMargin, dy: WalkTrailLook.fitMargin)
            // With very little room left, the margin goes first.
            if visible.width < 88 || visible.height < 88 { visible = band }
            if visible.isNull || visible.width < 44 || visible.height < 44 { visible = frame }
            // Street level is a phone's: measured across the map's width, as
            // locating shows it across the shorter side of a larger one.
            let minimumScale = MKMapPointsPerMeterAtLatitude(first.latitude)
                * WalkTrailLook.closestFitWidth
                * ScooterMapCameraPolicy.spanScale(across: bounds.width) / Double(bounds.width)
            guard let rect = ScooterMapCameraPolicy.rect(
                fitting: coordinates.map { MKMapPoint($0) },
                heading: mapView.camera.heading,
                size: frame.size,
                visible: visible.offsetBy(dx: -frame.minX, dy: -frame.minY),
                minimumScale: minimumScale
            ) else { return }
            ScooterMapCameraPolicy.setRegionPreservingPerspective(
                MKCoordinateRegion(rect),
                on: mapView,
                animated: animated
            )
        }

        /// MapKit deselects what a tap on the empty map leaves behind, and
        /// what it takes off the map to cluster again. During a walk its
        /// scooter or bay is selected again. Returns whether the deselection
        /// is answered here, and so not passed on as the card closing.
        private func keepWalkSelection(of annotation: MKAnnotation?, on mapView: MKMapView) -> Bool {
            if let scooter = annotation as? ScooterMapAnnotation {
                let id = scooter.scooter.id
                guard id == appliedSelectionID else { return false }
                // The walk went on with the same scooter under a new id, which
                // the map selects next: the old one leaving closes nothing.
                guard id == parent.selectedScooterID else { return true }
                Task { @MainActor [weak self, weak mapView] in
                    guard let self, let mapView, parent.isWalking, appliedSelectionID == id,
                          let annotation = annotationsByID[id],
                          !mapView.selectedAnnotations.contains(where: { $0 === annotation }) else { return }
                    mapView.selectAnnotation(annotation, animated: false)
                }
                return true
            }
            if let parking = annotation as? ScooterParkingAnnotation {
                let id = parking.parking.id
                guard id == appliedParkingID, id == parent.selectedParkingID else { return false }
                Task { @MainActor [weak self, weak mapView] in
                    guard let self, let mapView, parent.isWalking, appliedParkingID == id,
                          let annotation = parkingAnnotationsByID[id],
                          !mapView.selectedAnnotations.contains(where: { $0 === annotation }) else { return }
                    mapView.selectAnnotation(annotation, animated: false)
                }
                return true
            }
            return false
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
        // Where totals touch, as neighbouring countries do zoomed out, the larger is drawn over the smaller.
        zPriority = MKAnnotationViewZPriority(rawValue: Float(500 + log10(Double(count) + 1) * 60))
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
