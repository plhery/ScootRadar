import CoreLocation
import MapKit
import UIKit
import XCTest
@testable import ScootRadar

final class ScooterMapLookTests: XCTestCase {
    // MARK: Heads

    func testTheNearestScooterOfEachProviderIsItsHeadNearestFirst() {
        let heads = ScooterMapLook.heads(among: [
            ScooterDistance(id: "voi:far", provider: "voi", metres: 310),
            ScooterDistance(id: "lime:only", provider: "lime", metres: 120),
            ScooterDistance(id: "voi:near", provider: "voi", metres: 60),
            ScooterDistance(id: "bolt:only", provider: "bolt", metres: 90)
        ])

        XCTAssertEqual(heads.map(\.id), ["voi:near", "bolt:only", "lime:only"])
    }

    func testScootersAtTheSameDistanceGiveTheSameHeadWhateverTheirOrder() {
        let pair = [
            ScooterDistance(id: "voi:b", provider: "voi", metres: 40),
            ScooterDistance(id: "voi:a", provider: "voi", metres: 40)
        ]

        XCTAssertEqual(ScooterMapLook.heads(among: pair).map(\.id), ["voi:a"])
        XCTAssertEqual(ScooterMapLook.heads(among: pair.reversed()).map(\.id), ["voi:a"])
        XCTAssertTrue(ScooterMapLook.heads(among: []).isEmpty)
    }

    // MARK: Size and strength

    func testDotsShrinkAndFadeWithTheirDistance() {
        XCTAssertEqual(ScooterMapLook.dotDiameter(metres: 80, state: .plain), 12)
        XCTAssertEqual(ScooterMapLook.dotDiameter(metres: 81, state: .plain), 10)
        XCTAssertEqual(ScooterMapLook.dotDiameter(metres: 240, state: .plain), 10)
        XCTAssertEqual(ScooterMapLook.dotDiameter(metres: 241, state: .plain), 8)
        XCTAssertEqual(ScooterMapLook.dotDiameter(metres: 900, state: .head), 14)
        XCTAssertEqual(ScooterMapLook.dotDiameter(metres: 900, state: .selected), 16)

        XCTAssertEqual(ScooterMapLook.dotStrength(metres: 0, state: .plain), 1)
        XCTAssertEqual(ScooterMapLook.dotStrength(metres: 310, state: .plain), 0.5, accuracy: 0.001)
        XCTAssertEqual(ScooterMapLook.dotStrength(metres: 5_000, state: .plain), 0.42)
        // The nearest of a provider and the selected scooter never fade.
        XCTAssertEqual(ScooterMapLook.dotStrength(metres: 5_000, state: .head), 1)
        XCTAssertEqual(ScooterMapLook.dotStrength(metres: 5_000, state: .selected), 1)
    }

    func testWithoutAnOriginEveryDotLooksTheSame() {
        XCTAssertEqual(ScooterMapLook.dotDiameter(metres: nil, state: .plain), 10)
        XCTAssertEqual(ScooterMapLook.dotStrength(metres: nil, state: .plain), 1)
        XCTAssertEqual(ScooterMapLook.zPriority(metres: nil, state: .plain), 500)
    }

    @MainActor
    func testNearerDotsAreDrawnOnTopAndTheSelectedOneOnTopOfAll() {
        let far = ScooterMapLook.zPriority(metres: 400, state: .plain)
        let near = ScooterMapLook.zPriority(metres: 20, state: .plain)
        let farHead = ScooterMapLook.zPriority(metres: 2_000, state: .head)
        let selected = ScooterMapLook.zPriority(metres: 2_000, state: .selected)

        XCTAssertGreaterThan(near, far)
        XCTAssertGreaterThan(farHead, ScooterMapLook.zPriority(metres: 0, state: .plain))
        XCTAssertGreaterThan(selected, ScooterMapLook.zPriority(metres: 0, state: .head))
        XCTAssertEqual(selected, ScooterAnnotationView.selectedMarkerZPriority.rawValue)
        XCTAssertLessThan(selected, MKAnnotationViewZPriority.max.rawValue)
    }

    // MARK: Scale

    func testDotsGrowAsTheMapClosesInAndNameThemselvesCloseUp() {
        XCTAssertEqual(ScooterMapLook.zoomFactor(metresPerPoint: 1.07), 1, accuracy: 0.001)
        XCTAssertEqual(ScooterMapLook.zoomFactor(metresPerPoint: 12), 0.8)
        XCTAssertEqual(ScooterMapLook.zoomFactor(metresPerPoint: 0.1), 1.9)

        let street = ScooterMapLook.look(metres: 60, state: .plain, metresPerPoint: 1.07)
        XCTAssertEqual(street.diameter, 12)
        XCTAssertFalse(street.showsInitials)

        let closer = ScooterMapLook.look(metres: 60, state: .plain, metresPerPoint: 0.7)
        XCTAssertGreaterThan(closer.diameter, street.diameter)
        XCTAssertLessThan(closer.diameter, 20)
        XCTAssertFalse(closer.showsInitials)

        // Close up every dot is a disc with its provider's initials, however far it is.
        let closeUp = ScooterMapLook.look(metres: 500, state: .plain, metresPerPoint: 0.5)
        XCTAssertEqual(closeUp.diameter, 20)
        XCTAssertTrue(closeUp.showsInitials)
        XCTAssertGreaterThanOrEqual(closeUp.strength, 0.7)
        XCTAssertEqual(ScooterMapLook.look(metres: 500, state: .head, metresPerPoint: 0.4).diameter, 24)
    }

    // MARK: Scooters on one spot

    func testTwoScootersOnOneSpotStandSideBySide() {
        let offsets = ScooterMapLook.spread([
            dot("b", x: 100, y: 100),
            dot("a", x: 100, y: 100)
        ])

        // One dot and a point between the centres, on one line.
        XCTAssertEqual(offsets["a"], CGPoint(x: -6.5, y: 0))
        XCTAssertEqual(offsets["b"], CGPoint(x: 6.5, y: 0))
    }

    func testThreeScootersOnOneSpotFormATriangleWithTheFirstOnTop() throws {
        let offsets = ScooterMapLook.spread([
            dot("a", x: 0, y: 0), dot("b", x: 0, y: 0), dot("c", x: 0, y: 0)
        ])
        let a = try XCTUnwrap(offsets["a"])
        let b = try XCTUnwrap(offsets["b"])
        let c = try XCTUnwrap(offsets["c"])

        let radius = 13 / (2 * sin(CGFloat.pi / 3))
        XCTAssertEqual(a.x, 0, accuracy: 0.001)
        XCTAssertEqual(a.y, -radius, accuracy: 0.001)
        // Clockwise from twelve o'clock, each a dot and a point from the next.
        XCTAssertGreaterThan(b.x, 0)
        XCTAssertLessThan(c.x, 0)
        for (first, second) in [(a, b), (b, c), (c, a)] {
            XCTAssertEqual(hypot(first.x - second.x, first.y - second.y), 13, accuracy: 0.001)
        }
    }

    func testAGroupStaysOnItsSharedCentre() throws {
        // A metre or two apart: the dots still cover each other.
        let offsets = ScooterMapLook.spread([
            dot("a", x: 50, y: 50), dot("b", x: 54, y: 50), dot("c", x: 52, y: 53), dot("d", x: 51, y: 49)
        ])

        XCTAssertEqual(offsets.count, 4)
        let places = [("a", 50.0, 50.0), ("b", 54.0, 50.0), ("c", 52.0, 53.0), ("d", 51.0, 49.0)].map { id, x, y in
            CGPoint(x: x + offsets[id]!.x, y: y + offsets[id]!.y)
        }
        XCTAssertEqual(places.map(\.x).reduce(0, +) / 4, 51.75, accuracy: 0.001)
        XCTAssertEqual(places.map(\.y).reduce(0, +) / 4, 50.5, accuracy: 0.001)
        // Four on a ring: neighbours a dot and a point apart, the first on top.
        XCTAssertEqual(hypot(places[0].x - places[1].x, places[0].y - places[1].y), 13, accuracy: 0.001)
        XCTAssertEqual(places[0].x, 51.75, accuracy: 0.001)
        XCTAssertLessThan(places[0].y, 50.5)
    }

    func testMoreThanEightOnOneSpotArePackedAroundItRatherThanSetOnAWideRing() throws {
        let twenty = (0 ..< 20).map { dot(String(format: "s%02d", $0), x: 0, y: 0) }
        let offsets = ScooterMapLook.spread(twenty)
        let places = try twenty.map { try XCTUnwrap(offsets[$0.id]) }

        // A ring of twenty would reach 41.5 pt from the spot.
        XCTAssertLessThan(places.map { hypot($0.x, $0.y) }.max() ?? 0, 34)
        // None covers another: 70% of a 12 pt dot is 8.4 pt.
        for (index, first) in places.enumerated() {
            for second in places[(index + 1)...] {
                XCTAssertGreaterThan(hypot(first.x - second.x, first.y - second.y), 8.4)
            }
        }

        // Eight still share a ring.
        let eight = ScooterMapLook.spread(Array(twenty.prefix(8)))
        XCTAssertEqual(eight.count, 8)
        for offset in eight.values {
            XCTAssertEqual(hypot(offset.x, offset.y), 13 / (2 * sin(CGFloat.pi / 8)), accuracy: 0.001)
        }
    }

    func testScootersThatAreCloseButDoNotCoverEachOtherKeepTheirPlaces() {
        // 70% of a 12 pt dot is 8.4 pt.
        XCTAssertTrue(ScooterMapLook.spread([dot("a", x: 0, y: 0), dot("b", x: 9, y: 0)]).isEmpty)
        XCTAssertEqual(ScooterMapLook.spread([dot("a", x: 0, y: 0), dot("b", x: 8, y: 0)]).count, 2)
        XCTAssertTrue(ScooterMapLook.spread([dot("a", x: 0, y: 0)]).isEmpty)
        XCTAssertTrue(ScooterMapLook.spread([]).isEmpty)
    }

    func testSpreadingDoesNotDependOnTheOrderTheScootersArriveIn() {
        var dots: [ScooterSpreadDot] = []
        for index in 0 ..< 40 {
            // Piles of one to four on a line of spots, and a few stragglers.
            dots.append(dot("s\(index)", x: CGFloat(index / 4) * 60 + CGFloat(index % 3), y: CGFloat(index % 2) * 3))
        }
        let expected = ScooterMapLook.spread(dots)

        XCTAssertFalse(expected.isEmpty)
        XCTAssertEqual(ScooterMapLook.spread(dots.reversed()), expected)
        XCTAssertEqual(ScooterMapLook.spread(dots.sorted { $0.point.x > $1.point.x }), expected)
    }

    func testANeighbourStaysClearOfTheRingOfAHeadOrOfTheSelectedDot() throws {
        var head = ScooterDotLook(state: .head)
        head.diameter = 14
        let plain = ScooterDotLook()
        XCTAssertEqual(head.footprint, 22)
        XCTAssertEqual(plain.footprint, 10)

        let offsets = ScooterMapLook.spread([
            ScooterSpreadDot(id: "a", point: .zero, footprint: head.footprint),
            ScooterSpreadDot(id: "b", point: .zero, footprint: plain.footprint)
        ])
        // Half of each and a point.
        XCTAssertEqual(try XCTUnwrap(offsets["b"]).x - (try XCTUnwrap(offsets["a"]).x), 17, accuracy: 0.001)
    }

    // MARK: Touches

    func testATouchPicksTheDotWhoseCentreIsNearest() {
        let dots: [(id: String, centre: CGPoint, reach: CGFloat)] = [
            ("a", CGPoint(x: 100, y: 100), 22),
            ("b", CGPoint(x: 113, y: 100), 22),
            ("c", CGPoint(x: 106.5, y: 111), 22)
        ]

        XCTAssertEqual(ScooterMapLook.nearestDot(to: CGPoint(x: 111, y: 99), among: dots)?.id, "b")
        XCTAssertEqual(ScooterMapLook.nearestDot(to: CGPoint(x: 104, y: 110), among: dots)?.id, "c")
        // 44 pt across: a touch 20 pt from a lone dot still means it, 23 pt does not.
        XCTAssertEqual(ScooterMapLook.nearestDot(to: CGPoint(x: 80, y: 100), among: dots)?.id, "a")
        XCTAssertNil(ScooterMapLook.nearestDot(to: CGPoint(x: 77, y: 100), among: dots))
        XCTAssertNil(ScooterMapLook.nearestDot(to: .zero, among: []))
    }

    // MARK: Names

    func testANameGoesToTheRightOfItsDotWhenNothingIsInTheWay() {
        let placements = ScooterMapLook.placePills([pill("voi", x: 200, y: 300)])

        XCTAssertEqual(placements.map(\.side), [.right])
        // 2 pt clear of the ring of a head, centred on the dot.
        XCTAssertEqual(placements.first?.origin, CGPoint(x: 13, y: -13))
    }

    func testANameAvoidsTheRiderTheOtherNamedDotsAndTheNamesAlreadyPlaced() {
        // The rider stands just right of the first dot.
        let rider = CGRect(x: 215, y: 285, width: 30, height: 30)
        XCTAssertEqual(
            ScooterMapLook.placePills([pill("voi", x: 200, y: 300)], avoiding: [rider]).map(\.side),
            [.left]
        )

        // A second named dot where the first name would go: the first name
        // moves aside, and the second keeps clear of it.
        let pair = ScooterMapLook.placePills([pill("voi", x: 200, y: 300), pill("lime", x: 240, y: 300)])
        XCTAssertEqual(pair.map(\.side), [.left, .right])

        // Two dots one above the other both want the right; they both fit.
        let stacked = ScooterMapLook.placePills([pill("voi", x: 200, y: 300), pill("lime", x: 200, y: 340)])
        XCTAssertEqual(stacked.map(\.side), [.right, .right])
        // Closer than a name is high, the second gives way.
        let tight = ScooterMapLook.placePills([pill("voi", x: 200, y: 300), pill("lime", x: 200, y: 320)])
        XCTAssertEqual(tight.first?.side, .right)
        XCTAssertNotEqual(tight.last?.side, .right)
        XCTAssertFalse(frame(tight[0], of: pill("voi", x: 200, y: 300))
            .intersects(frame(tight[1], of: pill("lime", x: 200, y: 320))))
    }

    func testWhereNoSideIsFreeANameTakesTheOneThatCoversLeast() {
        // Walls all around, with a gap of a few points at the bottom left.
        let walls = [
            CGRect(x: 0, y: 0, width: 400, height: 285),
            CGRect(x: 211, y: 0, width: 200, height: 600),
            CGRect(x: 0, y: 330, width: 400, height: 300),
            CGRect(x: 0, y: 0, width: 150, height: 600)
        ]

        let placement = ScooterMapLook.placePills([pill("voi", x: 200, y: 300, width: 60)], avoiding: walls)
        XCTAssertEqual(placement.map(\.side), [.left])
    }

    func testANameMakesRoomForOneThatHasNoOtherPlace() {
        // The second name has room only above its dot, where the first
        // would stand; the first is as well off on its left.
        let walls = [
            CGRect(x: 0, y: 329, width: 289, height: 300),
            CGRect(x: 343, y: 300, width: 300, height: 400),
            CGRect(x: 0, y: 352, width: 600, height: 300)
        ]
        let requests = [pill("voi", x: 200, y: 300), pill("lime", x: 300, y: 340)]

        let placements = ScooterMapLook.placePills(requests, avoiding: walls)

        XCTAssertEqual(placements.map(\.side), [.left, .above])
        XCTAssertFalse(frame(placements[0], of: requests[0]).intersects(frame(placements[1], of: requests[1])))
    }

    func testANameDoesNotHopBetweenSidesThatAllCoverSomething() {
        // Walls all around: the left covers least, the right a little more.
        let walls = [
            CGRect(x: 0, y: 0, width: 400, height: 285),
            CGRect(x: 0, y: 330, width: 400, height: 300),
            CGRect(x: 0, y: 0, width: 146, height: 600),
            CGRect(x: 250, y: 0, width: 200, height: 600)
        ]
        var request = pill("voi", x: 200, y: 300, width: 60)
        XCTAssertEqual(ScooterMapLook.placePills([request], avoiding: walls).map(\.side), [.left])

        request.preferred = .right
        XCTAssertEqual(ScooterMapLook.placePills([request], avoiding: walls).map(\.side), [.right])
        // A side that covers far more is left for a better one.
        request.preferred = .above
        XCTAssertEqual(ScooterMapLook.placePills([request], avoiding: walls).map(\.side), [.left])
    }

    func testANameKeepsItsSideWhileThatSideIsFree() {
        var request = pill("voi", x: 200, y: 300)
        request.preferred = .below
        XCTAssertEqual(ScooterMapLook.placePills([request]).map(\.side), [.below])

        // Once something covers that side, the usual order applies again.
        let obstacle = CGRect(x: 180, y: 320, width: 40, height: 20)
        XCTAssertEqual(ScooterMapLook.placePills([request], avoiding: [obstacle]).map(\.side), [.right])
    }

    func testANameStaysInsideWhatIsVisibleAndPrefersNotToCoverADot() {
        // The dot is near the right edge: the name goes to its left.
        let visible = CGRect(x: 0, y: 100, width: 390, height: 500)
        XCTAssertEqual(
            ScooterMapLook.placePills([pill("voi", x: 360, y: 300)], inside: visible).map(\.side),
            [.left]
        )

        // A dot without a name to the right: the name takes another free side.
        let neighbour = CGRect(x: 225, y: 294, width: 12, height: 12)
        XCTAssertEqual(
            ScooterMapLook.placePills([pill("voi", x: 200, y: 300)], sparing: [neighbour]).map(\.side),
            [.left]
        )
        // Between a name and a dot without one, the dot is covered.
        let name = CGRect(x: 100, y: 280, width: 86, height: 120)
        let boxedIn = ScooterMapLook.placePills(
            [pill("voi", x: 200, y: 300)],
            avoiding: [name, CGRect(x: 100, y: 240, width: 200, height: 44), CGRect(x: 100, y: 316, width: 200, height: 44)],
            sparing: [neighbour]
        )
        XCTAssertEqual(boxedIn.map(\.side), [.right])
    }

    func testANameThatWouldBeCutIsNotShown() {
        let visible = CGRect(x: 0, y: 100, width: 390, height: 700)
        let dock = CGRect(x: 10, y: 600, width: 370, height: 180)
        let whole = CGRect(x: 100, y: 300, width: 90, height: 26)

        XCTAssertTrue(ScooterMapLook.pillCanBeRead(whole, inside: visible, under: [dock]))
        // A third may hide behind the edge of the map, not more.
        XCTAssertTrue(ScooterMapLook.pillCanBeRead(whole.offsetBy(dx: -130, dy: 0), inside: visible, under: [dock]))
        XCTAssertFalse(ScooterMapLook.pillCanBeRead(whole.offsetBy(dx: -131, dy: 0), inside: visible, under: [dock]))
        // The search bar above and the dock below hide as the edge does.
        XCTAssertFalse(ScooterMapLook.pillCanBeRead(whole.offsetBy(dx: 0, dy: -210), inside: visible, under: [dock]))
        XCTAssertFalse(ScooterMapLook.pillCanBeRead(whole.offsetBy(dx: 0, dy: 290), inside: visible, under: [dock]))
        XCTAssertTrue(ScooterMapLook.pillCanBeRead(whole.offsetBy(dx: 0, dy: 280), inside: visible, under: [dock]))
    }

    func testOfTwoNamesOnEachOtherTheFirstStays() {
        let visible = CGRect(x: 0, y: 100, width: 390, height: 700)
        let first = CGRect(x: 100, y: 300, width: 90, height: 26)

        // Half of the second lies under the first.
        XCTAssertEqual(
            ScooterMapLook.unreadablePills(
                [("selected", first), ("bird", first.offsetBy(dx: 45, dy: 0)), ("voi", first.offsetBy(dx: 0, dy: 40))],
                inside: visible,
                under: []
            ),
            ["bird"]
        )
        // Names that merely touch both stay.
        XCTAssertTrue(
            ScooterMapLook.unreadablePills(
                [("a", first), ("b", first.offsetBy(dx: 84, dy: 0))],
                inside: visible,
                under: []
            ).isEmpty
        )
        // A name that is left out hides no one: the third is clear of the first.
        XCTAssertEqual(
            ScooterMapLook.unreadablePills(
                [("a", first), ("b", first.offsetBy(dx: 60, dy: 0)), ("c", first.offsetBy(dx: 120, dy: 0))],
                inside: visible,
                under: []
            ),
            ["b"]
        )
        // And so is a name cut by the dock, whatever its place in the order.
        XCTAssertEqual(
            ScooterMapLook.unreadablePills(
                [("a", first.offsetBy(dx: 0, dy: 290)), ("b", first)],
                inside: visible,
                under: [CGRect(x: 10, y: 600, width: 370, height: 180)]
            ),
            ["a"]
        )
    }

    func testNamesSitFurtherOutAroundLargerDots() {
        for side in ScooterPillSide.allCases {
            let small = ScooterMapLook.pillOrigin(side, width: 80, reach: 11)
            let large = ScooterMapLook.pillOrigin(side, width: 80, reach: 16)
            let box = CGRect(origin: large, size: CGSize(width: 80, height: ScooterMapLook.pillHeight))
            // Never over its own dot, rings included.
            XCTAssertFalse(box.intersects(CGRect(x: -16, y: -16, width: 32, height: 32).insetBy(dx: 5, dy: 5)), "\(side)")
            XCTAssertNotEqual(small, large, "\(side)")
        }
    }

    // MARK: Colours

    func testInitialsAndNamesReadOnEveryProviderColour() {
        for provider in ScooterProvider.allCases {
            for isDark in [false, true] {
                let ratio = ScooterMapLook.contrastRatio(
                    between: ScooterMapLook.ink(on: provider, isDark: isDark),
                    and: ScooterMapLook.dotColor(provider, isDark: isDark)
                )
                // White stands out from every colour: least from Lime's green, at 2.1 to 1.
                XCTAssertGreaterThanOrEqual(ratio, 2, "\(provider.name), dark: \(isDark)")
            }
        }
    }

    func testBirdIsDrawnAlmostWhiteOnADarkMap() {
        XCTAssertEqual(ScooterMapLook.dotColor(.bird, isDark: false), ScooterProvider.bird.uiColor)
        XCTAssertGreaterThanOrEqual(
            ScooterMapLook.contrastRatio(
                between: ScooterMapLook.dotColor(.bird, isDark: true),
                and: ScooterMapLook.darkGround
            ),
            10
        )
        // The others keep their colour in both appearances.
        for provider in ScooterProvider.allCases where provider != .bird {
            XCTAssertEqual(ScooterMapLook.dotColor(provider, isDark: true), provider.uiColor)
        }
    }

    func testANameOnAPillIsShortEnoughForIt() {
        XCTAssertEqual(ScooterProvider.publibike.briefName, "PubliBike")
        XCTAssertEqual(ScooterProvider.voi.briefName, "Voi")
    }

    // MARK: The pictures of the dots

    @MainActor
    func testDotPicturesAreDrawnOnceAndLeaveRoomForTheirGlow() throws {
        let key = ScooterDotArt.Key(provider: .voi, diameter: 12, state: .plain, showsInitials: false, isDark: true)
        let image = ScooterDotArt.image(for: key)

        XCTAssertTrue(ScooterDotArt.image(for: key) === image)
        XCTAssertEqual(image.size.width, image.size.height)
        XCTAssertGreaterThan(image.size.width, 12 * 3)

        // The middle is the provider's colour, the corner is clear.
        let voi = try XCTUnwrap(ScooterProvider.voi.uiColor.cgColor.components)
        let middle = try pixel(of: image, at: CGPoint(x: image.size.width / 2, y: image.size.height / 2))
        XCTAssertEqual(middle.red, voi[0], accuracy: 0.03)
        XCTAssertEqual(middle.green, voi[1], accuracy: 0.03)
        XCTAssertEqual(middle.blue, voi[2], accuracy: 0.03)
        XCTAssertEqual(middle.alpha, 1, accuracy: 0.01)
        XCTAssertEqual(try pixel(of: image, at: CGPoint(x: 1, y: 1)).alpha, 0, accuracy: 0.02)

        for state in [ScooterDotState.plain, .head, .selected] {
            for isDark in [false, true] {
                let picture = ScooterDotArt.image(for: ScooterDotArt.Key(
                    provider: .bird, diameter: 24, state: state, showsInitials: true, isDark: isDark
                ))
                let ring = ScooterMapLook.ringReach(for: state)
                XCTAssertGreaterThan(picture.size.width, 24 + 2 * ring, "\(state), dark: \(isDark)")
            }
        }
    }

    // MARK: The card

    func testCardShowsWalkDistanceAndPriceAndLeavesTheRestToTheLineUnderTheName() {
        let scooter = scooter(battery: 80, rangeMeters: 50_000, pricing: pricing)
        let quote = RidePriceEstimator.quote(pricing: pricing, durationMinutes: 10)
        let content = ScooterCardContent(scooter: scooter, metres: 60, quote: quote, locale: Self.swiss)

        XCTAssertEqual(content.figures.map(\.kind), [.walk, .distance, .price])
        XCTAssertEqual(content.figures[0].value, "1")
        XCTAssertEqual(content.figures[0].unit, "min")
        XCTAssertEqual(content.figures[0].label, "on foot")
        XCTAssertEqual(content.figures[1].value, "60")
        XCTAssertEqual(content.figures[1].unit, "m")
        XCTAssertEqual(content.figures[1].label, "away")
        XCTAssertEqual(content.figures[2].value, RidePriceFormatter.amount(minorUnits: 520, currency: "CHF"))
        XCTAssertNil(content.figures[2].unit)
        XCTAssertEqual(content.figures[2].label, "CHF, 10 min")
        XCTAssertEqual(content.facts, "80% battery, 50\u{00A0}km range")
        XCTAssertEqual(
            content.note,
            "\(price(100)) to unlock, then \(price(42)) a minute"
        )
    }

    func testWithoutAPriceTheBatteryTakesTheThirdCellOrElseTheRange() {
        let both = ScooterCardContent(
            scooter: scooter(battery: 80, rangeMeters: 39_000), metres: 400, quote: nil, locale: Self.swiss
        )
        XCTAssertEqual(both.figures.map(\.kind), [.walk, .distance, .battery])
        XCTAssertEqual(both.figures[0].value, "5")
        XCTAssertEqual(both.figures[2].value, "80")
        XCTAssertEqual(both.figures[2].unit, "%")
        XCTAssertEqual(both.figures[2].label, "battery")
        XCTAssertEqual(both.facts, "39\u{00A0}km range")
        XCTAssertEqual(both.note, "Price shown in the Voi app")

        let rangeOnly = ScooterCardContent(scooter: scooter(rangeMeters: 39_000), metres: 400, quote: nil, locale: Self.swiss)
        XCTAssertEqual(rangeOnly.figures.map(\.kind), [.walk, .distance, .range])
        XCTAssertEqual(rangeOnly.figures[2].value, "39")
        XCTAssertEqual(rangeOnly.figures[2].unit, "km")
        XCTAssertEqual(rangeOnly.figures[2].label, "range")
        XCTAssertNil(rangeOnly.facts)

        let bare = ScooterCardContent(scooter: scooter(), metres: 400, quote: nil)
        XCTAssertEqual(bare.figures.map(\.kind), [.walk, .distance])
        XCTAssertNil(bare.facts)
    }

    func testWithoutAnOriginTheCellsShowWhatIsKnownOfTheScooter() {
        let scooter = scooter(battery: 80, rangeMeters: 39_000, pricing: pricing)
        let quote = RidePriceEstimator.quote(pricing: pricing, durationMinutes: 20)
        let content = ScooterCardContent(scooter: scooter, metres: nil, quote: quote)

        XCTAssertEqual(content.figures.map(\.kind), [.battery, .range, .price])
        XCTAssertEqual(content.figures[2].label, "CHF, 20 min")
        // Nothing is left for the line under the name, which asks for the location.
        XCTAssertNil(content.facts)

        XCTAssertTrue(ScooterCardContent(scooter: self.scooter(), metres: nil, quote: nil).figures.isEmpty)
    }

    func testTheWalkNamesTheSearchedPlaceItStartsFrom() {
        let content = ScooterCardContent(
            scooter: scooter(), metres: 1_250, placeTitle: "Zürich HB", quote: nil, locale: Self.swiss
        )

        XCTAssertEqual(content.figures[0].value, "16")
        XCTAssertEqual(content.figures[0].label, "from Zürich HB")
        // Halves go up, as everywhere in the app.
        XCTAssertEqual(content.figures[1].value, "1.3")
        XCTAssertEqual(content.figures[1].unit, "km")
    }

    func testThePriceNoteSaysWhenUnlockingIsFreeAndWhenAPassApplies() {
        let free = ScooterRidePricing(currency: "CHF", unlockFeeMinorUnits: 0, minuteFeeMinorUnits: 35)
        let plain = ScooterCardContent(
            scooter: scooter(pricing: free),
            metres: 60,
            quote: RidePriceEstimator.quote(pricing: free, durationMinutes: 10)
        )
        XCTAssertEqual(plain.note, "No unlock fee, \(price(35)) a minute")

        let pass = ProviderRidePass(enabled: true, freeUnlock: true, freeMinutes: 5)
        let withPass = ScooterCardContent(
            scooter: scooter(pricing: pricing),
            metres: 60,
            quote: RidePriceEstimator.quote(pricing: pricing, durationMinutes: 10, pass: pass)
        )
        XCTAssertEqual(withPass.figures[2].value, RidePriceFormatter.amount(minorUnits: 210, currency: "CHF"))
        // The note keeps the provider's tariff and says a pass lowers the figure.
        XCTAssertEqual(withPass.note, "\(price(100)) to unlock, then \(price(42)) a minute · Pass applied")
    }

    func testTheCardSaysPlusTaxAfterThePricesTaxIsAddedTo() {
        defer { ScooterLanguage.current = .atLaunch }
        ScooterLanguage.current = .en
        // Veo in New York: USD 1 to unlock and USD 0.42 a minute, before sales tax.
        let taxed = ScooterRidePricing(currency: "USD", unlockFeeMinorUnits: 100, minuteFeeMinorUnits: 42, plusTax: true)
        let content = ScooterCardContent(
            scooter: scooter(pricing: taxed),
            metres: 60,
            quote: RidePriceEstimator.quote(pricing: taxed, durationMinutes: 10)
        )
        let unlock = RidePriceFormatter.string(minorUnits: 100, currency: "USD")
        let minute = RidePriceFormatter.string(minorUnits: 42, currency: "USD")
        XCTAssertEqual(content.note, "\(unlock) to unlock, then \(minute) a minute + tax")
        XCTAssertEqual(content.figures[2].label, "USD, 10 min")

        ScooterLanguage.current = .fr
        XCTAssertEqual(taxed.taxed("x"), "x + taxes")
        ScooterLanguage.current = .de
        XCTAssertEqual(taxed.taxed("x"), "x + Steuern")
    }

    func testTheCardShowsForintsAndKronurWithoutDecimals() {
        // Hopp in Pécs: HUF 272 to start and HUF 76 a minute.
        let forints = ScooterRidePricing(currency: "HUF", unlockFeeMinorUnits: 27_200, minuteFeeMinorUnits: 7_600)
        let content = ScooterCardContent(
            scooter: scooter(provider: "hopp", pricing: forints),
            metres: 60,
            quote: RidePriceEstimator.quote(pricing: forints, durationMinutes: 10)
        )
        let separator = ScooterLanguage.current.locale.decimalSeparator ?? "."
        let decimals = { (text: String) in text.contains(separator) }

        XCTAssertEqual(content.figures[2].value.filter(\.isNumber), "1032")
        XCTAssertFalse(decimals(content.figures[2].value), content.figures[2].value)
        XCTAssertEqual(content.figures[2].label, "HUF, 10 min")
        let unlock = RidePriceFormatter.string(minorUnits: 27_200, currency: "HUF")
        let minute = RidePriceFormatter.string(minorUnits: 7_600, currency: "huf")
        XCTAssertEqual(content.note, "\(unlock) to unlock, then \(minute) a minute")
        XCTAssertTrue(unlock.contains("272") && !decimals(unlock), unlock)
        XCTAssertTrue(minute.contains("76") && !decimals(minute), minute)

        let kronur = RidePriceFormatter.string(minorUnits: 35_000, currency: "ISK")
        XCTAssertTrue(kronur.contains("350") && !decimals(kronur), kronur)
        XCTAssertEqual(
            [RidePriceFormatter.fractionDigits("HUF"), RidePriceFormatter.fractionDigits("huf"),
             RidePriceFormatter.fractionDigits("ISK"), RidePriceFormatter.fractionDigits("CHF"),
             RidePriceFormatter.fractionDigits("UAH")],
            [0, 0, 0, 2, 2]
        )
        // 3electra's UAH 5.60 a minute in Kyiv keeps its kopiyky.
        let hryvnias = RidePriceFormatter.string(minorUnits: 560, currency: "UAH")
        XCTAssertTrue(hryvnias.contains("5") && hryvnias.contains("60") && decimals(hryvnias), hryvnias)
    }

    // MARK: The lead of the dock

    func testTheLeadNamesTheNearestScooterItsDistanceAndTheWalk() {
        let lead = ScooterDockLead(scooter: scooter(provider: "publibike"), metres: 62)

        XCTAssertEqual(lead.minutes, 1)
        XCTAssertEqual(lead.distance(locale: Self.swiss), "62\u{00A0}m")
        XCTAssertEqual(lead.distance, Scooter.formattedLength(meters: 62))
        XCTAssertEqual(lead.detail, "PubliBike, 1 min on foot")
        XCTAssertEqual(
            lead.accessibilityLabel(locale: Self.swiss),
            "Nearest scooter: PubliBike / Velospot, 62\u{00A0}m away, 1 min on foot. Show details."
        )
        XCTAssertEqual(ScooterDockLead(scooter: scooter(), metres: 161).minutes, 3)
    }

    func testTheLeadIsTheNearestOfTheScootersInView() {
        let rider = GeoPoint(latitude: 47.3763, longitude: 8.5395)
        let view = GeoBounds(south: 47.3760, west: 8.5390, north: 47.3790, east: 8.5440)
        let outside = scooter(provider: "publibike", latitude: 47.3758, longitude: 8.5395, vehicleID: "outside")
        let near = scooter(provider: "bolt", latitude: 47.3770, longitude: 8.5400, vehicleID: "near")
        let far = scooter(provider: "dott", latitude: 47.3785, longitude: 8.5430, vehicleID: "far")

        // The one just off the map is nearer, and is not among those the chips count.
        let lead = ScooterDockLead.nearest(of: [far, outside, near], from: rider, in: view, grouped: false)
        XCTAssertEqual(lead?.scooter, near)
        XCTAssertEqual(lead?.metres ?? 0, near.distance(from: rider), accuracy: 0.01)
        // The order the server gives them in changes nothing.
        XCTAssertEqual(ScooterDockLead.nearest(of: [near, far, outside], from: rider, in: view, grouped: false), lead)
        XCTAssertNil(ScooterDockLead.nearest(of: [outside], from: rider, in: view, grouped: false))
        XCTAssertNil(ScooterDockLead.nearest(of: [], from: rider, in: view, grouped: false))
    }

    func testTheDockCountsInsteadWhileTheRiderIsOffTheMapOrScootersAreGrouped() {
        let view = GeoBounds(south: 47.3760, west: 8.5390, north: 47.3790, east: 8.5440)
        let inside = GeoPoint(latitude: 47.3763, longitude: 8.5395)
        let justOutside = GeoPoint(latitude: 47.3759, longitude: 8.5395)
        let scooters = [scooter(latitude: 47.3770, longitude: 8.5400)]

        XCTAssertNotNil(ScooterDockLead.nearest(of: scooters, from: inside, in: view, grouped: false))
        XCTAssertNil(ScooterDockLead.nearest(of: scooters, from: justOutside, in: view, grouped: false))
        XCTAssertNil(ScooterDockLead.nearest(of: scooters, from: nil, in: view, grouped: false))
        XCTAssertNil(ScooterDockLead.nearest(of: scooters, from: inside, in: view, grouped: true))
    }

    func testTwoScootersOnOneSpotGiveTheSameLeadWhateverTheirOrder() {
        let rider = GeoPoint(latitude: 47.3763, longitude: 8.5395)
        let view = GeoBounds(south: 47.37, west: 8.53, north: 47.38, east: 8.55)
        let first = scooter(vehicleID: "a")
        let second = scooter(vehicleID: "b")

        XCTAssertEqual(
            ScooterDockLead.nearest(of: [first, second], from: rider, in: view, grouped: false)?.scooter,
            first
        )
        XCTAssertEqual(
            ScooterDockLead.nearest(of: [second, first], from: rider, in: view, grouped: false)?.scooter,
            first
        )
    }

    // MARK: Helpers

    /// Lengths in metres whatever the region of the simulator: a US one writes them in feet.
    private static let swiss = Locale(identifier: "en_CH")

    private let pricing = ScooterRidePricing(currency: "CHF", unlockFeeMinorUnits: 100, minuteFeeMinorUnits: 42)

    private func dot(_ id: String, x: CGFloat, y: CGFloat, footprint: CGFloat = 12) -> ScooterSpreadDot {
        ScooterSpreadDot(id: id, point: CGPoint(x: x, y: y), footprint: footprint)
    }

    /// A name of 80 pt beside a head: a 14 pt dot with its gap and its ring.
    private func pill(_ id: String, x: CGFloat, y: CGFloat, width: CGFloat = 80) -> ScooterPillRequest {
        ScooterPillRequest(id: id, anchor: CGPoint(x: x, y: y), reach: 11, width: width)
    }

    private func frame(_ placement: ScooterPillPlacement, of request: ScooterPillRequest) -> CGRect {
        CGRect(
            x: request.anchor.x + placement.origin.x,
            y: request.anchor.y + placement.origin.y,
            width: request.width,
            height: ScooterMapLook.pillHeight
        )
    }

    private func price(_ minorUnits: Int) -> String {
        RidePriceFormatter.string(minorUnits: minorUnits, currency: "CHF")
    }

    private func scooter(
        provider: String = "voi",
        latitude: Double = 47.3769,
        longitude: Double = 8.5417,
        battery: Int? = nil,
        rangeMeters: Int? = nil,
        vehicleID: String = "one",
        pricing: ScooterRidePricing? = nil
    ) -> Scooter {
        Scooter(
            provider: provider,
            latitude: latitude,
            longitude: longitude,
            battery: battery,
            rangeMeters: rangeMeters,
            vehicleID: vehicleID,
            deepLink: nil,
            rentalURIs: nil,
            distanceMeters: 0,
            pricing: pricing
        )
    }

    private func pixel(
        of image: UIImage,
        at point: CGPoint
    ) throws -> (red: CGFloat, green: CGFloat, blue: CGFloat, alpha: CGFloat) {
        let cgImage = try XCTUnwrap(image.cgImage)
        var bytes = [UInt8](repeating: 0, count: 4)
        let context = try XCTUnwrap(CGContext(
            data: &bytes,
            width: 1,
            height: 1,
            bitsPerComponent: 8,
            bytesPerRow: 4,
            space: CGColorSpace(name: CGColorSpace.sRGB)!,
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ))
        // The bitmap's origin is at the bottom left.
        let x = point.x * image.scale
        let y = CGFloat(cgImage.height) - point.y * image.scale - 1
        context.draw(cgImage, in: CGRect(x: -x, y: -y, width: CGFloat(cgImage.width), height: CGFloat(cgImage.height)))
        let alpha = CGFloat(bytes[3]) / 255
        guard alpha > 0 else { return (0, 0, 0, 0) }
        return (
            CGFloat(bytes[0]) / 255 / alpha,
            CGFloat(bytes[1]) / 255 / alpha,
            CGFloat(bytes[2]) / 255 / alpha,
            alpha
        )
    }
}
