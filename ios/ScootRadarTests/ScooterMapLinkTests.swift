import XCTest
@testable import ScootRadar

final class ScooterMapLinkTests: XCTestCase {
    func testReadsTheMapLinksOfTheSite() throws {
        let link = try XCTUnwrap(ScooterMapLink(url: URL(string: "https://scootradar.com/map?origin=47.3769,8.5417&minRange=5000&theme=dark")!))
        XCTAssertEqual(link.origin, GeoPoint(latitude: 47.3769, longitude: 8.5417))
        XCTAssertEqual(link.minimumRange, 5_000)

        XCTAssertEqual(ScooterMapLink(url: URL(string: "https://scootradar.com/map")!), ScooterMapLink())
        XCTAssertEqual(ScooterMapLink(url: URL(string: "https://www.scootradar.com/map/?origin=%2046.2%2C%206.15")!)?.origin,
                       GeoPoint(latitude: 46.2, longitude: 6.15))
        // The map was at "/" before the landing page: such a link carries what only the map reads.
        XCTAssertEqual(ScooterMapLink(url: URL(string: "https://scootradar.com/?origin=46.9481,7.4474")!)?.origin,
                       GeoPoint(latitude: 46.9481, longitude: 7.4474))
        XCTAssertEqual(ScooterMapLink(url: URL(string: "https://scootradar.com/?tile=dark")!), ScooterMapLink())
    }

    func testLeavesOtherPagesAndHostsAlone() {
        for address in [
            "https://scootradar.com/",
            "https://scootradar.com/de",
            "https://scootradar.com/guides/zurich?origin=47.3769,8.5417",
            "https://scootradar.com/privacy",
            "https://scooters.plhery.com/map?origin=47.3769,8.5417",
            "http://scootradar.com/map",
            "scootradar://map",
        ] {
            XCTAssertNil(ScooterMapLink(url: URL(string: address)!), address)
        }
    }

    func testIgnoresWhatTheWebIgnores() {
        for origin in ["", "47.3", "47.3,", ",8.5", "91,8.5", "47.3,181", "abc,8.5", "47.3,8.5,1", "nan,8.5"] {
            XCTAssertNil(ScooterMapLink.coordinate(origin), origin)
        }
    }

    /// A minimum range in whole metres. The filters have no battery minimum any more: a link's minBattery is
    /// left out, beside a range or alone, and a link to "/" with it still opens the map.
    func testReadsAMinimumRangeAndLeavesOutTheBatteryOfAnOlderLink() throws {
        let link = try XCTUnwrap(ScooterMapLink(url: URL(string: "https://scootradar.com/map?origin=48.7758,9.1829&minRange=5000")!))
        XCTAssertEqual(link.minimumRange, 5_000)
        XCTAssertEqual(ScooterMapLink(url: URL(string: "https://scootradar.com/map?minRange=4828")!)?.minimumRange, 4_828)
        // The map was at "/" before minRange existed: the site reads it on the map alone, as zones (clientParams.ts).
        XCTAssertNil(ScooterMapLink(url: URL(string: "https://scootradar.com/?minRange=4828")!))
        XCTAssertEqual(ScooterMapLink(url: URL(string: "https://scootradar.com/map?minRange=0")!)?.minimumRange, 0)

        let both = try XCTUnwrap(ScooterMapLink(url: URL(string: "https://scootradar.com/map?minBattery=60&minRange=5000")!))
        XCTAssertEqual(both, ScooterMapLink(minimumRange: 5_000))
        let battery = try XCTUnwrap(ScooterMapLink(url: URL(string: "https://scootradar.com/map?origin=47.3769,8.5417&minBattery=60")!))
        XCTAssertEqual(battery, ScooterMapLink(origin: GeoPoint(latitude: 47.3769, longitude: 8.5417)))
        XCTAssertEqual(ScooterMapLink(url: URL(string: "https://scootradar.com/?minBattery=60")!), ScooterMapLink())
    }

    func testIgnoresARangeThatIsNoWholeNumberOfMetres() {
        for text in ["", "far", "-1000", "5000.5", "5e3", "nan", "5000m"] {
            XCTAssertNil(ScooterMapLink.range(text), text)
        }
        XCTAssertEqual(ScooterMapLink.range(" 12000 "), 12_000)
        XCTAssertNil(ScooterMapLink(url: URL(string: "https://scootradar.com/map?minRange=-5")!)?.minimumRange)
    }

    func testFindsTheCityWhoseCentreALinkNames() throws {
        let zurich = try XCTUnwrap(ScooterCityCatalog.cities.first { $0.id == "ch:zurich" })
        let near = GeoPoint(latitude: zurich.center.latitude + 0.0001, longitude: zurich.center.longitude - 0.0001)
        XCTAssertEqual(ScooterCityCatalog.city(linkedAt: near)?.id, "ch:zurich")
        XCTAssertNil(ScooterCityCatalog.city(linkedAt: GeoPoint(latitude: zurich.center.latitude + 0.01,
                                                              longitude: zurich.center.longitude)))
    }
}
