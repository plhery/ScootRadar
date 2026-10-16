import XCTest
@testable import ScootRadar

final class ScooterMapLinkTests: XCTestCase {
    func testReadsTheMapLinksOfTheSite() throws {
        let link = try XCTUnwrap(ScooterMapLink(url: URL(string: "https://scootradar.com/map?origin=47.3769,8.5417&minBattery=45&theme=dark")!))
        XCTAssertEqual(link.origin, GeoPoint(latitude: 47.3769, longitude: 8.5417))
        XCTAssertEqual(link.minimumBattery, 30, "A slider-era value snaps down to a preset")

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
        XCTAssertNil(ScooterMapLink.battery(""))
        XCTAssertNil(ScooterMapLink.battery("lots"))
        XCTAssertEqual(ScooterMapLink.battery("150"), 80)
        XCTAssertEqual(ScooterMapLink.battery("-5"), 0)
    }

    func testFindsTheCityWhoseCentreALinkNames() throws {
        let zurich = try XCTUnwrap(ScooterCityCatalog.cities.first { $0.id == "ch:zurich" })
        let near = GeoPoint(latitude: zurich.center.latitude + 0.0001, longitude: zurich.center.longitude - 0.0001)
        XCTAssertEqual(ScooterCityCatalog.city(linkedAt: near)?.id, "ch:zurich")
        XCTAssertNil(ScooterCityCatalog.city(linkedAt: GeoPoint(latitude: zurich.center.latitude + 0.01,
                                                              longitude: zurich.center.longitude)))
    }
}
