import MapKit
import QuartzCore
import UIKit

/// How the walking route looks on the map: round dots in the blue of the
/// selected scooter's ring, each on a slightly larger dot of the map's own
/// ground, so that the trail reads over roads, parks and buildings alike.
enum WalkTrailLook {
    static let dotWidth: CGFloat = 6
    static let casingWidth: CGFloat = 9
    /// One dot every 11 points along the route, as the web draws it with a
    /// dash of no length between round caps. MapKit draws dashed lines two to
    /// three times too wide and too far apart, so each dot is a stroke of its
    /// own, this short, with round caps, laid out again when the map zooms.
    static let dotSpacing: CGFloat = 11
    static let dotStroke: CGFloat = 0.05
    /// A long route seen up close has its dots further apart rather than more of them.
    static let maximumDots = 3_000
    /// The trail draws itself from the start of the walk to the scooter in
    /// this time, once the map shows the whole route.
    static let revealDuration: CFTimeInterval = 0.7
    /// A trail that is hidden, or walked to its end, fades in this time.
    static let fadeDuration: CFTimeInterval = 0.25
    /// The camera move that fits a route lasts about this long; the trail
    /// draws itself after it, or after this at the latest.
    static let fitDuration: TimeInterval = 0.7
    /// Room around the route inside the part of the map left visible.
    static let fitMargin: CGFloat = 40
    /// The map never comes closer than this many metres across to show a
    /// route: about street level, where locating also brings it.
    static let closestFitWidth: CLLocationDistance = 350

    static let dotColor = ScooterMapLook.selectionRing

    /// White on a light map; on a dark map and on satellite pictures, the
    /// dark ground the dots are drawn on there.
    static func casingColor(isDark: Bool) -> UIColor {
        isDark ? ScooterMapLook.darkGround : .white
    }

    /// Quick at first, settling as it reaches the scooter: a cubic ease-out.
    static func easeOut(_ progress: Double) -> Double {
        let remaining = 1 - min(1, max(0, progress))
        return 1 - remaining * remaining * remaining
    }

    /// Where the dots of a route go: one every `spacing` map points from its
    /// start, in the part of it between `start` and `end`, shares of its
    /// length. Counted from the start, a dot stays where it is while the
    /// trail draws itself and while the part behind the rider goes.
    static func dots(
        along points: [MKMapPoint],
        spacing: Double,
        from start: Double = 0,
        to end: Double = 1
    ) -> [MKMapPoint] {
        guard points.count > 1, spacing > 0, spacing.isFinite, end > start else { return [] }
        var lengths = [0.0]
        for (from, to) in zip(points, points.dropFirst()) {
            lengths.append(lengths[lengths.count - 1] + hypot(to.x - from.x, to.y - from.y))
        }
        let total = lengths[lengths.count - 1]
        guard total > 0 else { return [] }
        let step = max(spacing, total / Double(maximumDots))
        let first = max(0, start) * total
        let last = min(1, end) * total
        var dots: [MKMapPoint] = []
        var segment = 0
        var index = (first / step).rounded(.up)
        while index * step <= last {
            let distance = index * step
            while segment < points.count - 2, lengths[segment + 1] < distance { segment += 1 }
            let from = points[segment]
            let to = points[segment + 1]
            let length = lengths[segment + 1] - lengths[segment]
            let share = length > 0 ? min(1, (distance - lengths[segment]) / length) : 0
            dots.append(MKMapPoint(x: from.x + (to.x - from.x) * share, y: from.y + (to.y - from.y) * share))
            index += 1
        }
        return dots
    }

    /// How many map points one screen point spans in the middle of the map.
    @MainActor
    static func mapPointsPerPoint(on mapView: MKMapView) -> Double? {
        let bounds = mapView.bounds
        guard bounds.width > 0, bounds.height > 0 else { return nil }
        let left = MKMapPoint(mapView.convert(CGPoint(x: bounds.midX - 50, y: bounds.midY), toCoordinateFrom: mapView))
        let right = MKMapPoint(mapView.convert(CGPoint(x: bounds.midX + 50, y: bounds.midY), toCoordinateFrom: mapView))
        let measured = hypot(right.x - left.x, right.y - left.y) / 100
        if measured.isFinite, measured > 0 { return measured }
        let overall = mapView.visibleMapRect.width / Double(bounds.width)
        return overall.isFinite && overall > 0 ? overall : nil
    }
}

extension ScooterMapCameraPolicy {
    /// The map rect, in map points and without the map's turn, that shows a
    /// whole route in `visible`: the part of a map of `size`, turned by
    /// `heading` degrees, that nothing covers. The route is as large as fits,
    /// but never larger than `minimumScale` map points a screen point allows.
    /// Its centre lands on the centre of `visible`, not of the map.
    static func rect(
        fitting points: [MKMapPoint],
        heading: CLLocationDirection,
        size: CGSize,
        visible: CGRect,
        minimumScale: Double
    ) -> MKMapRect? {
        guard let reference = points.first, size.width > 0, size.height > 0,
              visible.width > 0, visible.height > 0 else { return nil }
        // Along the screen: u to the right, v down, in map points.
        let angle = heading * .pi / 180
        let cosine = cos(angle)
        let sine = sin(angle)
        var minimumU = Double.infinity
        var maximumU = -Double.infinity
        var minimumV = Double.infinity
        var maximumV = -Double.infinity
        for point in points {
            let x = point.x - reference.x
            let y = point.y - reference.y
            let u = x * cosine + y * sine
            let v = -x * sine + y * cosine
            minimumU = min(minimumU, u)
            maximumU = max(maximumU, u)
            minimumV = min(minimumV, v)
            maximumV = max(maximumV, v)
        }
        let scale = max(
            minimumScale,
            (maximumU - minimumU) / Double(visible.width),
            (maximumV - minimumV) / Double(visible.height)
        )
        guard scale.isFinite, scale > 0 else { return nil }
        // The camera looks at the middle of the map; the route's middle goes
        // to the middle of what is visible.
        let centreU = (minimumU + maximumU) / 2 + Double(size.width / 2 - visible.midX) * scale
        let centreV = (minimumV + maximumV) / 2 + Double(size.height / 2 - visible.midY) * scale
        let centreX = reference.x + centreU * cosine - centreV * sine
        let centreY = reference.y + centreU * sine + centreV * cosine
        let width = Double(size.width) * scale
        let height = Double(size.height) * scale
        return MKMapRect(x: centreX - width / 2, y: centreY - height / 2, width: width, height: height)
    }
}

/// The walking route on the map: a row of casing dots and a row of blue dots
/// over it. A new route draws itself from the start of the walk to the
/// scooter; the part the rider walked disappears; a hidden route fades.
@MainActor
final class WalkTrailOverlay {
    private struct Lines {
        let casing: MKMultiPolyline
        let dots: MKMultiPolyline
        let casingRenderer: MKMultiPolylineRenderer
        let dotRenderer: MKMultiPolylineRenderer

        var overlays: [MKOverlay] { [casing, dots] }
        var renderers: [MKMultiPolylineRenderer] { [casingRenderer, dotRenderer] }
    }

    /// What the dots on the map were laid out for, so that they are laid out
    /// again only when something about them changed.
    private struct Layout: Equatable {
        let spacing: Double
        let first: Double?
        let count: Int
        let isDark: Bool
    }

    private weak var mapView: MKMapView?
    private(set) var revision: Int?
    /// The route in map points, the share of it walked, and the share drawn.
    private var points: [MKMapPoint] = []
    private var walked: Double = 0
    private var drawn: Double = 0
    /// Map points between two dots: 11 screen points at the zoom of the map.
    private var spacing: Double = 0
    private var layout: Layout?
    private var current: Lines?
    /// Dots just replaced stay a moment under the new ones, which MapKit may
    /// take a frame to draw, so the trail never blinks.
    private var retiring: [Lines] = []
    private var fading: [Lines] = []
    private var isDark = false
    private var reveal: WalkTrailAnimation?
    private var fades: [WalkTrailAnimation] = []

    func renderer(for overlay: MKOverlay) -> MKOverlayRenderer? {
        for lines in [current].compactMap({ $0 }) + retiring + fading {
            if overlay === lines.casing { return lines.casingRenderer }
            if overlay === lines.dots { return lines.dotRenderer }
        }
        return nil
    }

    /// Puts a route on the map in place of the one there, drawn up to
    /// `drawn` of its length: 0 for a route that is about to draw itself.
    func show(_ trail: WalkTrail, on mapView: MKMapView, drawn: CGFloat) {
        reveal?.stop()
        reveal = nil
        self.mapView = mapView
        points = trail.points.map { MKMapPoint($0.coordinate) }
        revision = trail.revision
        walked = trail.walked
        self.drawn = Double(drawn)
        measure(on: mapView)
        redraw()
    }

    /// Draws the route from the start of the walk to its end, its dots
    /// spaced for the map the camera settled on.
    func revealRoute(animated: Bool) {
        guard revision != nil, let mapView else { return }
        reveal?.stop()
        reveal = nil
        measure(on: mapView)
        guard animated else {
            drawn = 1
            redraw()
            return
        }
        let animation = WalkTrailAnimation(duration: WalkTrailLook.revealDuration) { [weak self] progress in
            guard let self else { return }
            drawn = WalkTrailLook.easeOut(progress)
            redraw()
        } completion: { [weak self] in
            self?.reveal = nil
        }
        reveal = animation
        animation.start()
    }

    /// The share of the route the rider has walked, which no longer shows.
    func setWalked(_ walked: Double) {
        guard revision != nil, walked != self.walked else { return }
        self.walked = walked
        redraw()
    }

    /// The casing in the ground colour of the map.
    func setDark(_ dark: Bool) {
        guard dark != isDark else { return }
        isDark = dark
        redraw()
    }

    /// After a zoom the dots are laid out again, 11 points apart.
    func mapDidMove(on mapView: MKMapView) {
        guard revision != nil, reveal == nil, let perPoint = WalkTrailLook.mapPointsPerPoint(on: mapView) else { return }
        let next = Double(WalkTrailLook.dotSpacing) * perPoint
        guard spacing <= 0 || abs(next / spacing - 1) > 0.03 else { return }
        spacing = next
        redraw()
    }

    /// The route fades from the map, quickly, and is then taken off it.
    func hide(on mapView: MKMapView) {
        guard revision != nil else { return }
        revision = nil
        points = []
        layout = nil
        reveal?.stop()
        reveal = nil
        let leaving = [current].compactMap { $0 } + retiring
        current = nil
        retiring = []
        guard !leaving.isEmpty else { return }
        guard mapView.window != nil else {
            mapView.removeOverlays(leaving.flatMap(\.overlays))
            return
        }
        fading += leaving
        var animation: WalkTrailAnimation?
        animation = WalkTrailAnimation(duration: WalkTrailLook.fadeDuration) { progress in
            for lines in leaving { Self.set(alpha: CGFloat(1 - progress), on: lines) }
        } completion: { [weak self, weak mapView] in
            mapView?.removeOverlays(leaving.flatMap(\.overlays))
            guard let self else { return }
            fading.removeAll { lines in leaving.contains { $0.casing === lines.casing } }
            fades.removeAll { $0 === animation }
        }
        if let animation {
            fades.append(animation)
            animation.start()
        }
    }

    private func measure(on mapView: MKMapView) {
        guard let perPoint = WalkTrailLook.mapPointsPerPoint(on: mapView) else { return }
        spacing = Double(WalkTrailLook.dotSpacing) * perPoint
    }

    /// Lays the dots out for what is to be seen, if that changed, and puts
    /// them on the map in place of the ones there.
    private func redraw() {
        guard let mapView, revision != nil else { return }
        let centres = WalkTrailLook.dots(along: points, spacing: spacing, from: walked, to: drawn)
        let next = Layout(spacing: spacing, first: centres.first.map { $0.x + $0.y }, count: centres.count, isDark: isDark)
        guard next != layout else { return }
        layout = next
        let previous = current
        current = nil
        if !centres.isEmpty {
            // A stroke this short between round caps is a round dot.
            let stroke = spacing * Double(WalkTrailLook.dotStroke / WalkTrailLook.dotSpacing)
            let strokes = centres.map { centre in
                var ends = [centre, MKMapPoint(x: centre.x + stroke, y: centre.y)]
                return MKPolyline(points: &ends, count: ends.count)
            }
            let casing = MKMultiPolyline(strokes)
            let dots = MKMultiPolyline(strokes)
            current = Lines(
                casing: casing,
                dots: dots,
                casingRenderer: Self.renderer(for: casing, width: WalkTrailLook.casingWidth, color: WalkTrailLook.casingColor(isDark: isDark)),
                dotRenderer: Self.renderer(for: dots, width: WalkTrailLook.dotWidth, color: WalkTrailLook.dotColor)
            )
            // The dots above their casing, both under the scooters and the rider.
            mapView.addOverlay(casing, level: .aboveRoads)
            mapView.insertOverlay(dots, above: casing)
        }
        if let previous { retire(previous, on: mapView) }
    }

    private func retire(_ lines: Lines, on mapView: MKMapView) {
        guard mapView.window != nil else {
            mapView.removeOverlays(lines.overlays)
            return
        }
        retiring.append(lines)
        Task { @MainActor [weak self, weak mapView] in
            try? await Task.sleep(for: .milliseconds(100))
            guard let self, retiring.contains(where: { $0.casing === lines.casing }) else { return }
            retiring.removeAll { $0.casing === lines.casing }
            mapView?.removeOverlays(lines.overlays)
        }
    }

    private static func renderer(for line: MKMultiPolyline, width: CGFloat, color: UIColor) -> MKMultiPolylineRenderer {
        let renderer = MKMultiPolylineRenderer(multiPolyline: line)
        renderer.lineWidth = width
        renderer.strokeColor = color
        renderer.lineCap = .round
        renderer.lineJoin = .round
        return renderer
    }

    private static func set(alpha: CGFloat, on lines: Lines) {
        for renderer in lines.renderers {
            renderer.alpha = alpha
            renderer.setNeedsDisplay()
        }
    }
}

/// Calls `step` with the share of `duration` elapsed, once a frame, until it
/// reaches 1, then `completion`.
@MainActor
private final class WalkTrailAnimation: NSObject {
    private let duration: CFTimeInterval
    private let step: @MainActor (Double) -> Void
    private let completion: @MainActor () -> Void
    private var link: CADisplayLink?
    private var startedAt: CFTimeInterval?

    init(
        duration: CFTimeInterval,
        step: @escaping @MainActor (Double) -> Void,
        completion: @escaping @MainActor () -> Void
    ) {
        self.duration = duration
        self.step = step
        self.completion = completion
    }

    func start() {
        step(0)
        let link = CADisplayLink(target: self, selector: #selector(tick(_:)))
        link.add(to: .main, forMode: .common)
        self.link = link
    }

    /// Stops without completing.
    func stop() {
        link?.invalidate()
        link = nil
    }

    @objc private func tick(_ link: CADisplayLink) {
        let startedAt = startedAt ?? link.timestamp
        self.startedAt = startedAt
        let progress = duration > 0 ? min(1, (link.targetTimestamp - startedAt) / duration) : 1
        step(progress)
        guard progress >= 1 else { return }
        stop()
        completion()
    }
}
