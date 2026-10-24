import MapKit
import UIKit

/// The operators' zones as one overlay on the map, drawn above the roads
/// and under their names, the walking route and the scooters.
final class ScooterZoneOverlay: NSObject, MKOverlay, @unchecked Sendable {
    /// One polygon of a zone: its outer ring, then its holes.
    struct Shape: Sendable {
        let kind: ScooterZoneKind
        let rings: [[MKMapPoint]]
        let bounds: MKMapRect
    }

    let shapes: [Shape]
    let boundingMapRect: MKMapRect
    let isDark: Bool

    var coordinate: CLLocationCoordinate2D {
        MKMapPoint(x: boundingMapRect.midX, y: boundingMapRect.midY).coordinate
    }

    init(zones: [ScooterZone], isDark: Bool) {
        shapes = zones.flatMap { zone in
            zone.polygons.map { polygon in
                let rings = polygon.map { ring in ring.map { MKMapPoint($0.coordinate) } }
                return Shape(kind: zone.kind, rings: rings, bounds: Self.bounds(of: rings.first ?? []))
            }
        }
        boundingMapRect = shapes.reduce(MKMapRect.null) { $0.union($1.bounds) }
        self.isDark = isDark
        super.init()
    }

    private static func bounds(of ring: [MKMapPoint]) -> MKMapRect {
        guard let first = ring.first else { return .null }
        var minX = first.x, maxX = first.x, minY = first.y, maxY = first.y
        for point in ring {
            minX = min(minX, point.x)
            maxX = max(maxX, point.x)
            minY = min(minY, point.y)
            maxY = max(maxY, point.y)
        }
        return MKMapRect(x: minX, y: minY, width: maxX - minX, height: maxY - minY)
    }
}

/// Draws the zones as the web does (MapComponent.tsx): each kind's fills as
/// one translucent layer, so that the same rule of five operators over a
/// street looks like one, the strongest rule on top; then every edge.
/// MapKit draws tiles of it on several threads at once: all it reads is
/// made when it is.
final class ScooterZoneRenderer: MKOverlayRenderer, @unchecked Sendable {
    private struct Shape {
        let kind: ScooterZoneKind
        let path: CGPath
        let bounds: MKMapRect
    }

    /// Set once, before MapKit is handed the renderer.
    private var shapes: [Shape] = []
    private let colors: [ScooterZoneKind: CGColor]

    init(zones overlay: ScooterZoneOverlay) {
        colors = Dictionary(uniqueKeysWithValues: ScooterZoneKind.allCases.map {
            ($0, ScooterZoneLook.color($0, isDark: overlay.isDark).cgColor)
        })
        super.init(overlay: overlay)
        // The paths in the renderer's own points, which no zoom changes.
        shapes = overlay.shapes.map { shape in
            let path = CGMutablePath()
            for ring in shape.rings {
                path.addLines(between: ring.map { point(for: $0) })
                path.closeSubpath()
            }
            return Shape(kind: shape.kind, path: path, bounds: shape.bounds)
        }
    }

    override func draw(_ mapRect: MKMapRect, zoomScale: MKZoomScale, in context: CGContext) {
        // A screen point, in the renderer's points.
        let unit = 1 / zoomScale
        let reach = mapRect.insetBy(dx: -4 * Double(unit), dy: -4 * Double(unit))
        let near = shapes.filter { $0.bounds.intersects(reach) }
        guard !near.isEmpty else { return }
        let tile = rect(for: mapRect)

        for kind in ScooterZoneKind.belowFirst {
            let fills = near.filter { $0.kind == kind }
            guard !fills.isEmpty, let color = colors[kind] else { continue }
            context.saveGState()
            context.setAlpha(ScooterZoneLook.fillOpacity(kind))
            context.beginTransparencyLayer(auxiliaryInfo: nil)
            for shape in fills {
                if kind == .noRide {
                    hatch(shape.path, in: tile, color: color, unit: unit, context: context)
                } else {
                    context.addPath(shape.path)
                    context.setFillColor(color)
                    // Even-odd, so a hole is one whichever way its ring turns.
                    context.fillPath(using: .evenOdd)
                }
            }
            context.endTransparencyLayer()
            context.restoreGState()
        }

        for shape in near {
            guard let color = colors[shape.kind] else { continue }
            let edge = ScooterZoneLook.edge(shape.kind)
            context.saveGState()
            context.setAlpha(ScooterZoneLook.edgeOpacity)
            context.setStrokeColor(color)
            context.setLineWidth(edge.width * unit)
            context.setLineJoin(.round)
            context.setLineCap(edge.roundCaps ? .round : .butt)
            if !edge.dashes.isEmpty {
                context.setLineDash(phase: 0, lengths: edge.dashes.map { $0 * unit })
            }
            context.addPath(shape.path)
            context.strokePath()
            context.restoreGState()
        }
    }

    /// No riding: a ground and lines across it at 45°, the lines laid on the
    /// map's own grid so that they run on from one tile to the next.
    private func hatch(_ path: CGPath, in tile: CGRect, color: CGColor, unit: CGFloat, context: CGContext) {
        let box = path.boundingBoxOfPath.intersection(tile.insetBy(dx: -unit, dy: -unit))
        guard !box.isNull, !box.isEmpty else { return }
        context.saveGState()
        context.addPath(path)
        context.clip(using: .evenOdd)
        context.setFillColor(color.copy(alpha: ScooterZoneLook.hatchGroundOpacity) ?? color)
        context.fill(box)
        // Lines x + y = c, ScooterZoneLook.hatchSpacing apart across them.
        let step = ScooterZoneLook.hatchSpacing * unit * sqrt(2)
        var c = ((box.minX + box.minY) / step).rounded(.down) * step
        while c <= box.maxX + box.maxY {
            context.move(to: CGPoint(x: c - box.minY, y: box.minY))
            context.addLine(to: CGPoint(x: c - box.maxY, y: box.maxY))
            c += step
        }
        context.setStrokeColor(color)
        context.setLineWidth(ScooterZoneLook.hatchWidth * unit)
        context.strokePath()
        context.restoreGState()
    }
}

/// Puts the zones on the map and takes them off, and draws them again for
/// another appearance. The zones just replaced stay a moment under the new
/// ones, which MapKit may take a frame to draw, so that they never blink.
@MainActor
final class ScooterZoneLayer {
    private var current: (overlay: ScooterZoneOverlay, renderer: ScooterZoneRenderer)?
    private var retiring: [(overlay: ScooterZoneOverlay, renderer: ScooterZoneRenderer)] = []
    private var applied: (revision: Int, isDark: Bool)?

    func renderer(for overlay: MKOverlay) -> MKOverlayRenderer? {
        for drawn in [current].compactMap({ $0 }) + retiring where drawn.overlay === overlay {
            return drawn.renderer
        }
        return nil
    }

    func show(_ zones: [ScooterZone], revision: Int, isDark: Bool, on mapView: MKMapView) {
        guard applied?.revision != revision || applied?.isDark != isDark else { return }
        applied = (revision, isDark)
        let previous = current
        current = nil
        if !zones.isEmpty {
            let overlay = ScooterZoneOverlay(zones: zones, isDark: isDark)
            current = (overlay, ScooterZoneRenderer(zones: overlay))
            // Under the walking route, which is on the same level.
            mapView.insertOverlay(overlay, at: 0, level: .aboveRoads)
        }
        guard let previous else { return }
        guard mapView.window != nil, current != nil else {
            mapView.removeOverlay(previous.overlay)
            return
        }
        retiring.append(previous)
        Task { @MainActor [weak self, weak mapView] in
            try? await Task.sleep(for: .milliseconds(100))
            guard let self, retiring.contains(where: { $0.overlay === previous.overlay }) else { return }
            retiring.removeAll { $0.overlay === previous.overlay }
            mapView?.removeOverlay(previous.overlay)
        }
    }
}
