import MapKit
import UIKit

/// The operators' zones and the cities' as one overlay on the map, drawn
/// above the roads and under their names, the walking route and the scooters.
/// Each kind's zones are merged into one shape, as on the web (zoneShapes.ts):
/// where several operators, or an operator and the city, forbid the same over
/// a street, it is drawn once, within one edge. Only the zones handed in are
/// merged, those of the providers shown, so a filter on one provider leaves its
/// own. Zones drawn dimmer, a city's rules outside their hours, are merged
/// apart from the others.
final class ScooterZoneOverlay: NSObject, MKOverlay, @unchecked Sendable {
    /// One piece of a kind's merged zones, its outline and its holes, in map
    /// points from the corner of the overlay.
    struct Shape {
        let kind: ScooterZoneKind
        let strength: CGFloat
        let path: CGPath
        let bounds: MKMapRect
    }

    let shapes: [Shape]
    let boundingMapRect: MKMapRect
    let isDark: Bool

    var coordinate: CLLocationCoordinate2D {
        MKMapPoint(x: boundingMapRect.midX, y: boundingMapRect.midY).coordinate
    }

    init(zones: [ScooterZone], isDark: Bool) {
        let polygons = zones.map { zone in
            (kind: zone.kind, strength: CGFloat(zone.strength),
             points: zone.polygons.map { polygon in polygon.map { ring in ring.map { MKMapPoint($0.coordinate) } } })
        }
        let points = polygons.flatMap { $0.points.flatMap { $0.flatMap { $0 } } }
        let corner = MKMapPoint(x: points.map(\.x).min() ?? 0, y: points.map(\.y).min() ?? 0)
        boundingMapRect = points.isEmpty ? .null : MKMapRect(
            x: corner.x, y: corner.y,
            width: (points.map(\.x).max() ?? 0) - corner.x, height: (points.map(\.y).max() ?? 0) - corner.y
        )
        // Near the corner, where a CGFloat has its centimetres to spare.
        shapes = ScooterZoneKind.allCases.flatMap { kind -> [Shape] in
            let ofKind = polygons.filter { $0.kind == kind }
            return Set(ofKind.map(\.strength)).sorted().flatMap { strength -> [Shape] in
                let paths = ofKind.filter { $0.strength == strength }.flatMap(\.points).map { polygon in
                    let path = CGMutablePath()
                    for ring in polygon {
                        path.addLines(between: ring.map { CGPoint(x: $0.x - corner.x, y: $0.y - corner.y) })
                        path.closeSubpath()
                    }
                    return path as CGPath
                }
                guard let merged = Self.union(paths) else { return [] }
                return merged.componentsSeparated(using: .evenOdd).map { piece in
                    let box = piece.boundingBoxOfPath
                    return Shape(
                        kind: kind, strength: strength, path: piece,
                        bounds: MKMapRect(x: corner.x + box.minX, y: corner.y + box.minY, width: box.width, height: box.height)
                    )
                }
            }
        }
        self.isDark = isDark
        super.init()
    }

    /// Two by two, so that each union is of two shapes of about the same size.
    /// Even-odd, so that a hole is one whichever way its ring turns.
    private static func union(_ paths: [CGPath]) -> CGPath? {
        var level = paths
        while level.count > 1 {
            level = stride(from: 0, to: level.count, by: 2).map { index in
                index + 1 < level.count ? level[index].union(level[index + 1], using: .evenOdd) : level[index]
            }
        }
        return level.first
    }
}

/// Draws the zones as the web does (MapComponent.tsx): each kind's fills as
/// one translucent layer, the strongest rule on top, those drawn dimmer in a
/// fainter layer of their own; then every edge. MapKit
/// draws tiles of it on several threads at once: all it reads is made when
/// it is.
final class ScooterZoneRenderer: MKOverlayRenderer, @unchecked Sendable {
    private struct Shape {
        let kind: ScooterZoneKind
        let strength: CGFloat
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
        let rect = overlay.boundingMapRect
        let corner = point(for: MKMapPoint(x: rect.minX, y: rect.minY))
        let step = point(for: MKMapPoint(x: rect.minX + 1, y: rect.minY + 1))
        var transform = CGAffineTransform(
            a: step.x - corner.x, b: 0, c: 0, d: step.y - corner.y, tx: corner.x, ty: corner.y
        )
        shapes = overlay.shapes.map { shape in
            Shape(
                kind: shape.kind, strength: shape.strength,
                path: shape.path.copy(using: &transform) ?? shape.path, bounds: shape.bounds
            )
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
            let ofKind = near.filter { $0.kind == kind }
            guard let color = colors[kind] else { continue }
            for strength in Set(ofKind.map(\.strength)).sorted() {
                context.saveGState()
                context.setAlpha(ScooterZoneLook.fillOpacity(kind) * strength)
                context.beginTransparencyLayer(auxiliaryInfo: nil)
                for shape in ofKind where shape.strength == strength {
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
        }

        // Where riding is forbidden, nothing more needs saying: no parking's
        // and slow zones' edges give way within no riding's zones and along
        // their edge, which other operators' zones of the same street often
        // follow to the metre. A city's parking place there still says where
        // to leave the scooter once walked in, so its edge is kept whole.
        let noRide = near.filter { $0.kind == .noRide }
        let giving = near.filter { $0.kind == .noParking || $0.kind == .slow }
        if !giving.isEmpty {
            context.saveGState()
            context.beginTransparencyLayer(auxiliaryInfo: nil)
            for shape in giving { stroke(shape, unit: unit, context: context) }
            context.setBlendMode(.clear)
            context.setLineWidth(2 * ScooterZoneLook.edgeClearance * unit)
            context.setLineJoin(.round)
            for shape in noRide {
                context.addPath(shape.path)
                context.fillPath(using: .evenOdd)
                context.addPath(shape.path)
                context.strokePath()
            }
            context.endTransparencyLayer()
            context.restoreGState()
        }
        for shape in near where shape.kind == .parking { stroke(shape, unit: unit, context: context) }
        for shape in noRide { stroke(shape, unit: unit, context: context) }
    }

    private func stroke(_ shape: Shape, unit: CGFloat, context: CGContext) {
        guard let color = colors[shape.kind] else { return }
        let edge = ScooterZoneLook.edge(shape.kind)
        context.saveGState()
        context.setAlpha(ScooterZoneLook.edgeOpacity * shape.strength)
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
