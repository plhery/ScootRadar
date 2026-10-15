import CoreLocation
import UIKit

/// What a dot on the map is: one scooter among others, the nearest of its
/// provider, or the one whose card is open.
enum ScooterDotState: Sendable {
    case plain
    case head
    case selected
}

/// How one scooter is drawn. The map's coordinator works this out for every
/// scooter and the marker draws what it is given.
struct ScooterDotLook: Equatable, Sendable {
    var state = ScooterDotState.plain
    var diameter = ScooterMapLook.plainDiameter
    /// Close up the dot is large enough to carry its provider's initials.
    var showsInitials = false
    /// The opacity: scooters far from the origin fade back.
    var strength = 1.0
    /// The nearest are drawn on top, the selected one on top of all.
    var zPriority: Float = 500
    /// Where the dot is drawn from its real place, when scooters on one spot
    /// are spread on a ring.
    var offset = CGPoint.zero

    /// How wide the dot is with its rings, which a neighbour stays clear of.
    var footprint: CGFloat {
        diameter + 2 * ScooterMapLook.ringReach(for: state)
    }
}

struct ScooterDistance: Equatable, Sendable {
    let id: String
    let provider: String
    let metres: CLLocationDistance
}

struct ScooterSpreadDot: Equatable, Sendable {
    let id: String
    /// On screen, or in any plane with the screen's scale and directions.
    let point: CGPoint
    let footprint: CGFloat
}

enum ScooterPillSide: CaseIterable, Sendable {
    case right
    case left
    case above
    case below
    case aboveRight
    case aboveLeft
    case belowRight
    case belowLeft
}

struct ScooterPillRequest: Equatable, Sendable {
    let id: String
    /// The centre of the dot the pill names.
    let anchor: CGPoint
    /// How far the dot reaches from its centre, rings included.
    let reach: CGFloat
    let width: CGFloat
    /// The side the pill is on now. It stays there while that side is free,
    /// so a pill does not hop about as the map moves.
    var preferred: ScooterPillSide?
}

struct ScooterPillPlacement: Equatable, Sendable {
    let id: String
    let side: ScooterPillSide
    /// The pill's top left corner, from the centre of its dot.
    let origin: CGPoint
}

/// The look of the map at street level: every scooter is a dot at its own
/// place, the nearest of each provider carries its name, and nothing merges.
/// What can be decided without a map is decided here.
enum ScooterMapLook {
    static let plainDiameter: CGFloat = 10
    static let pillHeight: CGFloat = 26
    /// At this scale and closer a dot is a disc with its provider's initials.
    /// Bolt and Lime are nearly the same green: close up they name themselves.
    static let closeUpMetresPerPoint = 0.5
    /// The scale at which dots have their plain sizes: a little wider than the
    /// view the map opens on around the rider.
    static let referenceMetresPerPoint = 1.07
    private static let walkingMetresPerMinute = 80.0
    /// Dots whose centres are closer than this share of their width cover each other.
    private static let overlapShare: CGFloat = 0.7

    /// The app's walking estimate: 80 m a minute in a straight line, at least a minute.
    static func walkingMinutes(metres: CLLocationDistance) -> Int {
        max(1, Int(ceil(metres / walkingMetresPerMinute)))
    }

    /// The nearest scooter of each provider, nearest first. Equal distances go
    /// to the smaller id, so a refresh does not hand the name to a neighbour.
    static func heads(among scooters: [ScooterDistance]) -> [ScooterDistance] {
        var nearest: [String: ScooterDistance] = [:]
        for scooter in scooters where scooter.metres.isFinite {
            if let current = nearest[scooter.provider], !isNearer(scooter, than: current) { continue }
            nearest[scooter.provider] = scooter
        }
        return nearest.values.sorted(by: isNearer)
    }

    private static func isNearer(_ first: ScooterDistance, than second: ScooterDistance) -> Bool {
        first.metres != second.metres ? first.metres < second.metres : first.id < second.id
    }

    /// 12 pt within 80 m, 10 within 240 m and 8 beyond; 10 without an origin.
    static func dotDiameter(metres: CLLocationDistance?, state: ScooterDotState) -> CGFloat {
        switch state {
        case .selected:
            return 16
        case .head:
            return 14
        case .plain:
            guard let metres else { return plainDiameter }
            return metres <= 80 ? 12 : metres <= 240 ? 10 : 8
        }
    }

    static func dotStrength(metres: CLLocationDistance?, state: ScooterDotState) -> Double {
        guard state == .plain, let metres else { return 1 }
        return max(0.42, 1 - metres / 620)
    }

    /// Dots grow as the map closes in and shrink a little as it backs away.
    static func zoomFactor(metresPerPoint: Double) -> CGFloat {
        guard metresPerPoint > 0 else { return 1 }
        return CGFloat(min(1.9, max(0.8, (referenceMetresPerPoint / metresPerPoint).squareRoot())))
    }

    static func look(
        metres: CLLocationDistance?,
        state: ScooterDotState,
        metresPerPoint: Double
    ) -> ScooterDotLook {
        var look = ScooterDotLook(state: state)
        look.strength = dotStrength(metres: metres, state: state)
        look.zPriority = zPriority(metres: metres, state: state)
        if metresPerPoint <= closeUpMetresPerPoint {
            look.showsInitials = true
            look.diameter = switch state {
            case .plain: 20
            case .head: 24
            case .selected: 26
            }
            // Faded further, the initials could not be read.
            look.strength = max(0.7, look.strength)
        } else {
            // Half points keep the number of pictures to draw small.
            let scaled = dotDiameter(metres: metres, state: state) * zoomFactor(metresPerPoint: metresPerPoint)
            look.diameter = (scaled * 2).rounded() / 2
        }
        return look
    }

    /// Plain dots keep MapKit's default and rise with their nearness; a head
    /// is above them, a selected dot above the heads and the rider above all.
    static func zPriority(metres: CLLocationDistance?, state: ScooterDotState) -> Float {
        let nearness = metres.map { Float(1 - min(1, max(0, $0) / 620)) } ?? 0
        switch state {
        case .plain: return 500 + 200 * nearness
        case .head: return 720 + 60 * nearness
        case .selected: return 900
        }
    }

    /// The gap and the ring around a head or a selected dot.
    static func ringReach(for state: ScooterDotState) -> CGFloat {
        switch state {
        case .plain: 0
        case .head: 4
        case .selected: 6
        }
    }

    /// Scooters standing on one spot would be one dot. Each group of dots that
    /// cover each other goes on a small ring around its shared centre: two
    /// side by side, three in a triangle, more in a ring with the first at
    /// twelve o'clock, and beyond eight packed as the seeds of a sunflower,
    /// as on the web. The result is how far each of them moves; a dot alone
    /// is not in it. Groups are made in the order of the ids, so the same
    /// scooters get the same places whatever order they arrive in.
    static func spread(_ dots: [ScooterSpreadDot]) -> [String: CGPoint] {
        let sorted = dots.sorted { $0.id < $1.id }
        let reach = overlapShare * (sorted.map(\.footprint).max() ?? 0)
        guard sorted.count > 1, reach > 0 else { return [:] }

        // Only the dots of the neighbouring cells can be close enough.
        func cell(_ point: CGPoint) -> SpreadCell {
            SpreadCell(x: Int((point.x / reach).rounded(.down)), y: Int((point.y / reach).rounded(.down)))
        }
        var cells: [SpreadCell: [Int]] = [:]
        for (index, dot) in sorted.enumerated() {
            cells[cell(dot.point), default: []].append(index)
        }

        var isGrouped = [Bool](repeating: false, count: sorted.count)
        var offsets: [String: CGPoint] = [:]
        for (index, seed) in sorted.enumerated() where !isGrouped[index] {
            isGrouped[index] = true
            var members = [index]
            let home = cell(seed.point)
            for x in home.x - 1 ... home.x + 1 {
                for y in home.y - 1 ... home.y + 1 {
                    for other in cells[SpreadCell(x: x, y: y)] ?? [] where !isGrouped[other] {
                        let candidate = sorted[other]
                        let limit = overlapShare * (seed.footprint + candidate.footprint) / 2
                        let distance = hypot(candidate.point.x - seed.point.x, candidate.point.y - seed.point.y)
                        if distance < limit {
                            isGrouped[other] = true
                            members.append(other)
                        }
                    }
                }
            }
            guard members.count > 1 else { continue }
            members.sort()

            let count = CGFloat(members.count)
            let centre = CGPoint(
                x: members.reduce(0) { $0 + sorted[$1].point.x } / count,
                y: members.reduce(0) { $0 + sorted[$1].point.y } / count
            )
            // Neighbours are one dot and a point apart; a head or a selected
            // dot is wider by its ring, which its neighbour stays clear of.
            let widest = members.map { sorted[$0].footprint }.sorted(by: >)
            let spacing = (widest[0] + widest[1]) / 2 + 1
            let ring = members.count == 2 ? spacing / 2 : spacing / (2 * sin(.pi / count))
            for (slot, member) in members.enumerated() {
                let radius: CGFloat
                let angle: CGFloat
                if members.count == 2 {
                    radius = ring
                    angle = slot == 0 ? .pi : 0
                } else if members.count <= ringLimit {
                    radius = ring
                    angle = -.pi / 2 + 2 * .pi * CGFloat(slot) / count
                } else {
                    // A ring of so many would be wide and empty.
                    radius = 0.58 * spacing * (CGFloat(slot) + 0.5).squareRoot()
                    angle = -.pi / 2 + CGFloat(slot) * goldenAngle
                }
                let dot = sorted[member]
                offsets[dot.id] = CGPoint(
                    x: centre.x + radius * cos(angle) - dot.point.x,
                    y: centre.y + radius * sin(angle) - dot.point.y
                )
            }
        }
        return offsets
    }

    /// Up to this many share a ring.
    private static let ringLimit = 8
    private static let goldenAngle = CGFloat.pi * (3 - CGFloat(5).squareRoot())

    private struct SpreadCell: Hashable {
        let x: Int
        let y: Int
    }

    /// The dot a touch means: the one whose drawn centre is nearest, among
    /// those the touch is within reach of. Dots are far smaller than a finger.
    static func nearestDot(
        to point: CGPoint,
        among dots: [(id: String, centre: CGPoint, reach: CGFloat)]
    ) -> (id: String, distance: CGFloat)? {
        var nearest: (id: String, distance: CGFloat)?
        for dot in dots {
            let distance = hypot(dot.centre.x - point.x, dot.centre.y - point.y)
            guard distance <= dot.reach else { continue }
            if let current = nearest,
               current.distance < distance || (current.distance == distance && current.id < dot.id) {
                continue
            }
            nearest = (dot.id, distance)
        }
        return nearest
    }

    /// Where a pill sits on one side of its dot: its top left corner, from
    /// the centre of the dot.
    static func pillOrigin(_ side: ScooterPillSide, width: CGFloat, reach: CGFloat) -> CGPoint {
        let beside = reach + 2
        let over = reach + 5
        let corner = reach - 2
        let nearCorner = reach + 1
        switch side {
        case .right: return CGPoint(x: beside, y: -pillHeight / 2)
        case .left: return CGPoint(x: -beside - width, y: -pillHeight / 2)
        case .above: return CGPoint(x: -width / 2, y: -over - pillHeight)
        case .below: return CGPoint(x: -width / 2, y: over)
        case .aboveRight: return CGPoint(x: corner, y: -nearCorner - pillHeight)
        case .aboveLeft: return CGPoint(x: -corner - width, y: -nearCorner - pillHeight)
        case .belowRight: return CGPoint(x: corner, y: nearCorner)
        case .belowLeft: return CGPoint(x: -corner - width, y: nearCorner)
        }
    }

    /// Puts each pill, in the order given, on the first of the eight sides of
    /// its dot where it covers no pill already placed, no named dot and no
    /// obstacle, and stays inside what is visible; where no side is free, on
    /// the one that covers least. Dots without a name count for a quarter:
    /// better over one of them than over a name. A pill placed early may
    /// stand in the only room a later one had, so those that cover
    /// something look once more among all the others.
    static func placePills(
        _ requests: [ScooterPillRequest],
        avoiding obstacles: [CGRect] = [],
        sparing dots: [CGRect] = [],
        inside visible: CGRect? = nil
    ) -> [ScooterPillPlacement] {
        let fixed = requests.map { request in
            CGRect(x: request.anchor.x, y: request.anchor.y, width: 0, height: 0)
                .insetBy(dx: 1 - request.reach, dy: 1 - request.reach)
        } + obstacles
        var sides: [ScooterPillSide?] = requests.map(\.preferred)
        var boxes = [CGRect?](repeating: nil, count: requests.count)

        func box(_ index: Int, _ side: ScooterPillSide) -> CGRect {
            let request = requests[index]
            let origin = pillOrigin(side, width: request.width, reach: request.reach)
            return CGRect(
                x: request.anchor.x + origin.x,
                y: request.anchor.y + origin.y,
                width: request.width,
                height: pillHeight
            ).insetBy(dx: -3, dy: -3)
        }
        func cost(_ index: Int, _ box: CGRect) -> CGFloat {
            var cost = fixed.reduce(0) { $0 + area($1.intersection(box)) }
            for (other, otherBox) in boxes.enumerated() where other != index {
                cost += otherBox.map { area($0.intersection(box)) } ?? 0
            }
            cost += dots.reduce(0) { $0 + area($1.intersection(box)) } / 4
            if let visible {
                cost += area(box) - area(visible.intersection(box))
            }
            return cost
        }
        func settle(_ index: Int) {
            var order = ScooterPillSide.allCases
            // The side it is on comes first; the others keep their order behind it.
            if let current = sides[index], let position = order.firstIndex(of: current) {
                order.insert(order.remove(at: position), at: 0)
            }
            var best: (side: ScooterPillSide, box: CGRect, cost: CGFloat)?
            var current: (side: ScooterPillSide, box: CGRect, cost: CGFloat)?
            for side in order {
                let candidate = box(index, side)
                let candidateCost = cost(index, candidate)
                if side == sides[index] {
                    current = (side, candidate, candidateCost)
                }
                if best == nil || candidateCost < best!.cost {
                    best = (side, candidate, candidateCost)
                }
                if candidateCost <= 0 { break }
            }
            // Among sides that all cover something, a name does not hop for
            // a small gain while the map moves under it.
            if let current, let found = best, found.cost > 0, current.cost - found.cost < area(current.box) / 10 {
                best = current
            }
            sides[index] = best!.side
            boxes[index] = best!.box
        }

        for index in requests.indices {
            settle(index)
        }
        for _ in 0 ..< 2 {
            var moved = false
            for index in requests.indices {
                guard let side = sides[index], let place = boxes[index], cost(index, place) > 0 else { continue }
                settle(index)
                moved = moved || sides[index] != side
            }
            if !moved { break }
        }

        return requests.indices.map { index in
            let request = requests[index]
            let side = sides[index]!
            return ScooterPillPlacement(
                id: request.id,
                side: side,
                origin: pillOrigin(side, width: request.width, reach: request.reach)
            )
        }
    }

    /// Whether a pill shows enough of itself: at least two thirds inside
    /// what is visible and clear of what floats over the map.
    static func pillCanBeRead(_ frame: CGRect, inside visible: CGRect, under chrome: [CGRect]) -> Bool {
        let hidden = area(frame) - area(visible.intersection(frame)) +
            chrome.reduce(0) { $0 + area($1.intersection(visible).intersection(frame)) }
        return hidden * 3 <= area(frame)
    }

    /// The names to leave out of those placed, the first of them counting
    /// most: one cut by the edge of the map or by what floats over it, and
    /// one lying on a name that stays. Where there is no room, a name less
    /// is better than two that cannot be read.
    static func unreadablePills(
        _ pills: [(id: String, frame: CGRect)],
        inside visible: CGRect,
        under chrome: [CGRect]
    ) -> Set<String> {
        var unreadable: Set<String> = []
        var shown: [CGRect] = []
        for pill in pills {
            let covered = shown.reduce(0) { $0 + area($1.intersection(pill.frame)) }
            if pillCanBeRead(pill.frame, inside: visible, under: chrome), covered * 10 <= area(pill.frame) {
                shown.append(pill.frame)
            } else {
                unreadable.insert(pill.id)
            }
        }
        return unreadable
    }

    private static func area(_ rect: CGRect) -> CGFloat {
        rect.isNull || rect.isEmpty ? 0 : rect.width * rect.height
    }

    // MARK: Colours

    /// The lab's ground under the dots, for the ring that parts a dot from its neighbours.
    static let darkGround = UIColor(red: 0.043, green: 0.055, blue: 0.078, alpha: 1)
    static let selectionRing = UIColor(red: 0.039, green: 0.518, blue: 1, alpha: 1)
    private static let nearBlackInk = UIColor(red: 0.063, green: 0.075, blue: 0.102, alpha: 1)
    private static let birdOnDark = UIColor(red: 0.949, green: 0.949, blue: 0.969, alpha: 1)

    /// The provider's colour. Bird's near black cannot be seen on a dark map
    /// or on a satellite picture: there it is drawn almost white.
    static func dotColor(_ provider: ScooterProvider?, isDark: Bool) -> UIColor {
        guard let provider else { return .systemGray }
        return provider == .bird && isDark ? birdOnDark : provider.uiColor
    }

    /// The colour of what is written on the provider's colour: the initials
    /// on a dot or on the card's tile, and the name on a filled pill. White,
    /// as on the badge of an app; dark only on Bird's near white of a dark map.
    static func ink(on provider: ScooterProvider?, isDark: Bool) -> UIColor {
        provider == .bird && isDark ? nearBlackInk : .white
    }

    static func contrastRatio(between first: UIColor, and second: UIColor) -> Double {
        let firstLuminance = relativeLuminance(of: first)
        let secondLuminance = relativeLuminance(of: second)
        return (max(firstLuminance, secondLuminance) + 0.05) /
            (min(firstLuminance, secondLuminance) + 0.05)
    }

    private static func relativeLuminance(of color: UIColor) -> Double {
        var red: CGFloat = 0
        var green: CGFloat = 0
        var blue: CGFloat = 0
        var alpha: CGFloat = 0
        if !color.getRed(&red, green: &green, blue: &blue, alpha: &alpha) {
            var white: CGFloat = 0
            guard color.getWhite(&white, alpha: &alpha) else { return 0 }
            (red, green, blue) = (white, white, white)
        }

        func linearized(_ component: CGFloat) -> Double {
            let value = Double(component)
            return value <= 0.04045
                ? value / 12.92
                : pow((value + 0.055) / 1.055, 2.4)
        }

        return 0.2126 * linearized(red) + 0.7152 * linearized(green) + 0.0722 * linearized(blue)
    }
}

extension ScooterProvider {
    /// The name where there is little room, on a pill beside a dot or in the
    /// dock's lead: "PubliBike", not "PubliBike / Velospot".
    var briefName: String {
        name.components(separatedBy: " / ").first ?? name
    }
}

/// The head of the dock while the rider or the searched place is on the map:
/// the nearest scooter the map shows.
struct ScooterDockLead: Equatable, Sendable {
    let scooter: Scooter
    let metres: CLLocationDistance

    /// The nearest of the scooters in view, the ones the count and the chips
    /// are of: one just off the map may be nearer, but the dock speaks of
    /// what it shows. None while the place walked from is off the map, nor
    /// while scooters are counted in groups; the dock then counts them.
    static func nearest(
        of scooters: [Scooter],
        from origin: GeoPoint?,
        in viewport: GeoBounds,
        grouped: Bool
    ) -> ScooterDockLead? {
        guard let origin, !grouped, viewport.contains(origin) else { return nil }
        var nearest: ScooterDockLead?
        for scooter in scooters where viewport.contains(latitude: scooter.latitude, longitude: scooter.longitude) {
            let metres = scooter.distance(from: origin)
            guard metres.isFinite else { continue }
            if let current = nearest,
               current.metres < metres || (current.metres == metres && current.scooter.id < scooter.id) {
                continue
            }
            nearest = ScooterDockLead(scooter: scooter, metres: metres)
        }
        return nearest
    }

    var minutes: Int { ScooterMapLook.walkingMinutes(metres: metres) }
    var distance: String { distance(locale: ScooterLanguage.current.locale) }
    var providerName: String { scooter.providerInfo?.name ?? scooter.provider.capitalized }
    var briefProviderName: String { scooter.providerInfo?.briefName ?? scooter.provider.capitalized }

    /// "Voi, 1 min on foot".
    var detail: String {
        String(format: String(localized: "%1$@, %2$lld min on foot"), briefProviderName, Int64(minutes))
    }

    var accessibilityLabel: String { accessibilityLabel(locale: ScooterLanguage.current.locale) }

    /// "62 m" where the region measures in metres, "200 ft" where it measures in miles.
    func distance(locale: Locale) -> String { Scooter.formattedLength(meters: metres, locale: locale) }

    func accessibilityLabel(locale: Locale) -> String {
        String(
            format: String(localized: "Nearest scooter: %1$@, %2$@ away, %3$lld min on foot. Show details."),
            providerName,
            distance(locale: locale),
            Int64(minutes)
        )
    }
}

/// One of the three figures of the scooter card: "1 min" over "on foot".
struct ScooterCardFigure: Equatable, Identifiable, Sendable {
    enum Kind: Sendable {
        case walk
        case distance
        case price
        case battery
        case range
    }

    let kind: Kind
    let value: String
    let unit: String?
    let label: String

    var id: Kind { kind }
}

/// What the scooter card says under its name: up to three figures, the facts
/// the figures leave out, and how the price is made up.
struct ScooterCardContent: Equatable, Sendable {
    let figures: [ScooterCardFigure]
    /// "80% battery, 50 km range": what is known and not among the figures.
    let facts: String?
    /// "CHF 1.00 to unlock, then CHF 0.42 a minute", and "+ tax" where tax is added.
    let note: String
    /// "Night ban in Oslo: you can rent it from 05:00", while the ban holds.
    let curfew: String?

    /// With an origin the figures are the walk, the distance and the price of
    /// a ride; without a price the battery takes its cell, or else the range.
    /// Without an origin they are what is known of battery, range and price.
    /// Lengths are written as the locale's region measures them.
    init(
        scooter: Scooter,
        metres: CLLocationDistance?,
        placeTitle: String? = nil,
        quote: RidePriceQuote?,
        curfew: RentalCurfew.Active? = nil,
        locale: Locale = ScooterLanguage.current.locale
    ) {
        self.curfew = curfew.map { curfew in
            String(
                format: String(localized: "Night ban in %1$@: you can rent it from %2$@"),
                curfew.city,
                ScooterDockStatus.clockTime(curfew.until, in: curfew.timeZone)
            )
        }
        let providerName = scooter.providerInfo?.name ?? scooter.provider.capitalized
        let price = quote.map { quote in
            ScooterCardFigure(
                kind: .price,
                value: RidePriceFormatter.amount(minorUnits: quote.totalMinorUnits, currency: quote.currency),
                unit: nil,
                label: String(
                    format: String(localized: "%1$@, %2$lld min"),
                    quote.currency.uppercased(),
                    Int64(quote.durationMinutes)
                )
            )
        }
        let battery = scooter.battery.map { battery in
            ScooterCardFigure(kind: .battery, value: "\(battery)", unit: "%", label: String(localized: "battery"))
        }
        let range = scooter.rangeMeters.map { range in
            let parts = Scooter.lengthParts(meters: Double(range), locale: locale)
            return ScooterCardFigure(kind: .range, value: parts.value, unit: parts.unit, label: String(localized: "range"))
        }

        var figures: [ScooterCardFigure] = []
        if let metres, metres.isFinite {
            let parts = Scooter.lengthParts(meters: metres, locale: locale)
            figures = [
                ScooterCardFigure(
                    kind: .walk,
                    value: "\(ScooterMapLook.walkingMinutes(metres: metres))",
                    unit: String(localized: "min"),
                    label: placeTitle.map { String(format: String(localized: "from %@"), $0.isolated) }
                        ?? String(localized: "on foot")
                ),
                ScooterCardFigure(kind: .distance, value: parts.value, unit: parts.unit, label: String(localized: "away"))
            ]
            if let third = price ?? battery ?? range {
                figures.append(third)
            }
        } else {
            figures = [battery, range, price].compactMap { $0 }
        }
        self.figures = figures

        let shown = Set(figures.map(\.kind))
        let leftBattery = shown.contains(.battery) ? nil : scooter.battery
        let leftRange = shown.contains(.range)
            ? nil
            : scooter.rangeMeters.map { Scooter.formattedLength(meters: Double($0), locale: locale) }
        facts = switch (leftBattery, leftRange) {
        case let (battery?, range?):
            String(format: String(localized: "%1$lld%% battery, %2$@ range"), Int64(battery), range)
        case let (battery?, nil):
            String(format: String(localized: "%lld%% battery"), Int64(battery))
        case let (nil, range?):
            String(format: String(localized: "%@ range"), range)
        case (nil, nil):
            nil
        }

        guard let pricing = scooter.pricing else {
            note = String(format: String(localized: "Price shown in the %@ app"), providerName)
            return
        }
        let minute = RidePriceFormatter.string(minorUnits: pricing.minuteFeeMinorUnits, currency: pricing.currency)
        let tariff = pricing.taxed(pricing.unlockFeeMinorUnits > 0
            ? String(
                format: String(localized: "%1$@ to unlock, then %2$@ a minute"),
                RidePriceFormatter.string(minorUnits: pricing.unlockFeeMinorUnits, currency: pricing.currency),
                minute
            )
            : String(format: String(localized: "No unlock fee, %@ a minute"), minute))
        note = quote?.passApplied == true
            ? String(format: String(localized: "%1$@ · %2$@"), tariff, String(localized: "Pass applied"))
            : tariff
    }
}
