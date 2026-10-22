import CoreLocation
import Foundation
import XCTest
@testable import ScootRadar

final class ScooterModelsTests: XCTestCase {
    func testFrenchPonyScooterKeepsItsProviderEuroPricingAndRentalLink() throws {
        let data = Data(#"""
        {
          "provider": "pony",
          "lat": 47.4784,
          "lng": -0.5632,
          "battery": 75,
          "range_m": 32620,
          "vehicle_id": "pony_fr_angers:vehicle-1",
          "deep_link": null,
          "rental_uris": {
            "ios": "https://getapony.com/app/scan",
            "android": "https://getapony.com/app/scan",
            "web": null
          },
          "pricing": {
            "currency": "EUR",
            "unlock_fee_minor_units": 100,
            "minute_fee_minor_units": 26
          },
          "distance_m": null
        }
        """#.utf8)
        let scooter = try JSONDecoder().decode(ScooterVehiclePayload.self, from: data).model
        XCTAssertEqual(scooter.providerInfo, .pony)
        XCTAssertEqual(scooter.coordinate.latitude, 47.4784)
        XCTAssertEqual(scooter.coordinate.longitude, -0.5632)
        XCTAssertEqual(scooter.pricing?.currency, "EUR")
        XCTAssertEqual(scooter.pricing?.plusTax, false)
        XCTAssertEqual(scooter.rentalURL?.absoluteString, "https://getapony.com/app/scan")
    }

    func testAPriceTaxIsAddedToSaysSo() throws {
        // Veo in New York: USD 1 to unlock and USD 0.42 a minute, before sales tax.
        let data = Data(#"""
        {
          "provider": "lime", "lat": 40.7128, "lng": -74.006, "battery": 75, "range_m": null,
          "vehicle_id": "veo-1", "deep_link": null, "rental_uris": null, "distance_m": null,
          "pricing": { "currency": "USD", "unlock_fee_minor_units": 100, "minute_fee_minor_units": 42, "plus_tax": true }
        }
        """#.utf8)
        let pricing = try XCTUnwrap(JSONDecoder().decode(ScooterVehiclePayload.self, from: data).model.pricing)
        XCTAssertEqual(pricing, ScooterRidePricing(currency: "USD", unlockFeeMinorUnits: 100, minuteFeeMinorUnits: 42, plusTax: true))
        XCTAssertTrue(RidePriceEstimator.quote(pricing: pricing, durationMinutes: 10).plusTax)
    }

    func testAPriceCopiedFromAPriceListKeepsTheDayItWasChecked() throws {
        // Lime in Chicago publishes no price in its feed: USD 1 to unlock and USD 0.39 a minute on its site.
        func pricing(listedOn: String) throws -> ScooterRidePricing? {
            let data = Data("""
            {
              "provider": "lime", "lat": 41.88, "lng": -87.63, "battery": null, "range_m": null,
              "vehicle_id": "lime-1", "deep_link": null, "rental_uris": null, "distance_m": null,
              "pricing": { "currency": "USD", "unlock_fee_minor_units": 100, "minute_fee_minor_units": 39,
                           "plus_tax": true, "listed_on": "\(listedOn)" }
            }
            """.utf8)
            return try JSONDecoder().decode(ScooterVehiclePayload.self, from: data).model.pricing
        }
        XCTAssertEqual(
            try pricing(listedOn: "2026-10-18"),
            ScooterRidePricing(currency: "USD", unlockFeeMinorUnits: 100, minuteFeeMinorUnits: 39, plusTax: true, listedOn: "2026-10-18")
        )
        // A day it can't read is left out, and the price kept.
        XCTAssertNil(try pricing(listedOn: "soon")?.listedOn)
        XCTAssertEqual(try pricing(listedOn: "soon")?.minuteFeeMinorUnits, 39)
    }

    func testAMinuteFeeGivenAsARangeKeepsItsLowestAndSaysFrom() throws {
        // Lime in New York: USD 1 to unlock, then USD 0.45 to 0.50 a minute.
        let data = Data("""
        {
          "provider": "lime", "lat": 40.85, "lng": -73.87, "battery": null, "range_m": null,
          "vehicle_id": "lime-1", "deep_link": null, "rental_uris": null, "distance_m": null,
          "pricing": { "currency": "USD", "unlock_fee_minor_units": 100, "minute_fee_minor_units": 45,
                       "minute_fee_from": true, "plus_tax": true, "listed_on": "2026-10-18" }
        }
        """.utf8)
        let pricing = try XCTUnwrap(try JSONDecoder().decode(ScooterVehiclePayload.self, from: data).model.pricing)
        XCTAssertTrue(pricing.minuteFeeFrom)
        XCTAssertEqual(pricing.minuteFeeMinorUnits, 45)
        let quote = RidePriceEstimator.quote(pricing: pricing, durationMinutes: 10)
        XCTAssertEqual(quote.totalMinorUnits, 550)
        XCTAssertTrue(quote.minuteFeeFrom)
        XCTAssertFalse(RidePriceEstimator.quote(
            pricing: ScooterRidePricing(currency: "CHF", unlockFeeMinorUnits: 100, minuteFeeMinorUnits: 35),
            durationMinutes: 10
        ).minuteFeeFrom)
    }

    func testDecodingAndStableProviderIdentity() throws {
        let data = Data(#"""
        {
          "vehicles": [{
            "provider": "lime",
            "lat": 47.3769,
            "lng": 8.5417,
            "battery": 82,
            "range_m": 12345,
            "vehicle_id": "abc-123",
            "deep_link": "https://lime.bike/vehicle/abc-123",
            "rental_uris": {
              "ios": "limebike://vehicle/abc-123",
              "android": "https://lime.bike/vehicle/abc-123?platform=android",
              "web": "https://lime.bike/vehicle/abc-123"
            },
            "pricing": {
              "currency": "CHF",
              "unlock_fee_minor_units": 100,
              "minute_fee_minor_units": 42
            },
            "distance_m": 250.5
          }],
          "clusters": [],
          "providers": {"lime": 1},
          "meta": {
            "partial": false,
            "stale": false,
            "failedSources": [],
            "sources": {"national": "fresh", "hopp": "fresh"},
            "generatedAt": "2026-08-05T12:00:00.000Z",
            "truncated": false,
            "totalVehicles": 1,
            "mode": "vehicles",
            "zoom": null
          }
        }
        """#.utf8)

        let response = try JSONDecoder().decode(ScooterAPIResponsePayload.self, from: data).model
        let scooter = try XCTUnwrap(response.vehicles.first)

        XCTAssertEqual(scooter.id, "lime:abc-123")
        XCTAssertEqual(scooter.providerInfo, .lime)
        XCTAssertEqual(scooter.battery, 82)
        XCTAssertEqual(scooter.rangeMeters, 12_345)
        XCTAssertEqual(scooter.deepLink, "https://lime.bike/vehicle/abc-123")
        XCTAssertEqual(scooter.rentalURL?.absoluteString, "limebike://vehicle/abc-123")
        XCTAssertEqual(
            scooter.pricing,
            ScooterRidePricing(
                currency: "CHF",
                unlockFeeMinorUnits: 100,
                minuteFeeMinorUnits: 42
            )
        )
    }

    func testCoordinateIdentityIsUsedWhenVehicleIDIsMissing() throws {
        let scooter = try makeScooter(provider: "bird", latitude: 47.1, longitude: 8.2, vehicleID: nil)
        XCTAssertEqual(scooter.id, "bird:47.1:8.2")
    }

    func testVehiclePricingIsOptionalAndMalformedPricingIsDiscarded() throws {
        let missingPricingData = Data(#"""
        {
          "provider": "bird",
          "lat": 47.1,
          "lng": 8.2,
          "battery": null,
          "range_m": null,
          "vehicle_id": "without-pricing",
          "deep_link": null,
          "distance_m": null
        }
        """#.utf8)
        let malformedPricingData = Data(#"""
        {
          "provider": "lime",
          "lat": 47.1,
          "lng": 8.2,
          "battery": null,
          "range_m": null,
          "vehicle_id": "bad-pricing",
          "deep_link": null,
          "pricing": {
            "currency": "CHF",
            "unlock_fee_minor_units": -1,
            "minute_fee_minor_units": 42
          },
          "distance_m": null
        }
        """#.utf8)

        let missingPricing = try JSONDecoder()
            .decode(ScooterVehiclePayload.self, from: missingPricingData)
            .model
        let malformedPricing = try JSONDecoder()
            .decode(ScooterVehiclePayload.self, from: malformedPricingData)
            .model

        XCTAssertNil(missingPricing.pricing)
        XCTAssertNil(malformedPricing.pricing)
    }

    func testDistanceUsesCoordinatesRatherThanServerDistance() throws {
        let scooter = try makeScooter(
            provider: "bolt",
            latitude: 47.3779,
            longitude: 8.5417,
            vehicleID: "nearby",
            serverDistance: 50_000
        )

        let distance = scooter.distance(from: GeoPoint(latitude: 47.3769, longitude: 8.5417))

        XCTAssertEqual(distance, 111.2, accuracy: 1.5)
        XCTAssertEqual(
            scooter.formattedDistance(from: GeoPoint(latitude: 47.3769, longitude: 8.5417)),
            Scooter.formattedLength(meters: distance)
        )
        XCTAssertEqual(
            plainSpaces(Scooter.formattedLength(meters: distance, locale: Locale(identifier: "en_CH"))),
            "\(Int(distance.rounded())) m"
        )
    }

    func testRangeFormattingOnlyExistsWhenRangeIsProvided() throws {
        XCTAssertNotNil(try makeScooter(rangeMeters: 1_500).formattedRange)
        XCTAssertNil(try makeScooter(rangeMeters: nil).formattedRange)
    }

    /// The same scooter reads the same on the web and here: whole metres below a
    /// kilometre, then kilometres with at most one decimal. No rounding to 50 m.
    func testLengthsAreWrittenAsOnTheWeb() throws {
        let swiss = Locale(identifier: "en_CH")
        let expectations = [
            (51, "51 m"), (320, "320 m"), (337, "337 m"), (951, "951 m"),
            (1_000, "1 km"), (1_250, "1.3 km"), (1_449, "1.4 km"),
            (12_400, "12.4 km"), (24_000, "24 km")
        ]
        for (meters, text) in expectations {
            let length = Scooter.formattedLength(meters: Double(meters), locale: swiss)
            XCTAssertEqual(plainSpaces(length), text, "\(meters) m")
            // A line never breaks between the number and its unit.
            XCTAssertFalse(length.contains(" "), length)
        }
        let range = try XCTUnwrap(makeScooter(rangeMeters: 1_250).formattedRange)
        XCTAssertEqual(range, Scooter.formattedLength(meters: 1_250))
    }

    /// Feet or yards under half a mile and miles from there where the region
    /// measures in miles, rounded as iOS rounds lengths on roads; the web's
    /// src/lib/walking.test.ts expects the same.
    func testLengthsAreInMilesWhereTheRegionMeasuresInMiles() {
        let american = Locale(identifier: "en_US")
        let british = Locale(identifier: "en_GB")
        let expectations: [(Double, String, String)] = [
            (2, "7 ft", "2 yd"), (12, "40 ft", "10 yd"), (80, "250 ft", "90 yd"),
            (100, "350 ft", "100 yd"), (300, "1,000 ft", "350 yd"), (800, "2,600 ft", "850 yd"),
            (805, "0.5 mi", "0.5 mi"), (1_000, "0.62 mi", "0.62 mi"), (3_000, "1.9 mi", "1.9 mi"),
            (14_000, "8.7 mi", "8.7 mi"), (61_000, "38 mi", "38 mi")
        ]
        for (meters, us, uk) in expectations {
            XCTAssertEqual(plainSpaces(Scooter.formattedLength(meters: meters, locale: american)), us, "\(meters) m")
            XCTAssertEqual(plainSpaces(Scooter.formattedLength(meters: meters, locale: british)), uk, "\(meters) m")
        }
        let parts = Scooter.lengthParts(meters: 300, locale: american)
        XCTAssertEqual(parts.value, "1,000")
        XCTAssertEqual(parts.unit, "ft")
        XCTAssertFalse(Scooter.formattedLength(meters: 300, locale: american).contains(" "))
    }

    func testTheMapShowsItsScaleWhereTheRegionMeasuresInMiles() {
        XCTAssertTrue(ScooterMapScalePolicy.showsScale(locale: Locale(identifier: "en_US")))
        XCTAssertTrue(ScooterMapScalePolicy.showsScale(locale: Locale(identifier: "en_GB")))
        XCTAssertFalse(ScooterMapScalePolicy.showsScale(locale: Locale(identifier: "en_CH")))
        XCTAssertFalse(ScooterMapScalePolicy.showsScale(locale: Locale(identifier: "fr_CA")))
        XCTAssertFalse(ScooterMapScalePolicy.showsScale(locale: Locale(identifier: "es_MX")))
    }

    func testTheHeadingIsTakenFromTheTopOfTheScreenAsItShows() {
        XCTAssertEqual(ScooterHeadingPolicy.deviceOrientation(for: .portrait), .portrait)
        XCTAssertEqual(ScooterHeadingPolicy.deviceOrientation(for: .portraitUpsideDown), .portraitUpsideDown)
        // A screen turned left shows on a device turned right.
        XCTAssertEqual(ScooterHeadingPolicy.deviceOrientation(for: .landscapeLeft), .landscapeRight)
        XCTAssertEqual(ScooterHeadingPolicy.deviceOrientation(for: .landscapeRight), .landscapeLeft)
        XCTAssertEqual(ScooterHeadingPolicy.deviceOrientation(for: .unknown), .portrait)
    }

    private func plainSpaces(_ text: String) -> String {
        text.replacingOccurrences(of: "\u{00A0}", with: " ").replacingOccurrences(of: "\u{202F}", with: " ")
    }

    func testMapZoomRoundsUpAtTheServerClusteringBoundary() {
        XCTAssertEqual(ScooterClusteringPolicy.apiZoom(for: 15), 15)
        XCTAssertEqual(ScooterClusteringPolicy.apiZoom(for: 15.01), 16)
        XCTAssertTrue(ScooterClusteringPolicy.representationsMatch(16, 18))
        XCTAssertFalse(ScooterClusteringPolicy.representationsMatch(14, 15))
    }

    func testRentalLinkPolicyUsesTheIOSLinkAndNeverTheAndroidLink() {
        let rentalURIs = ScooterRentalURIs(
            ios: "https://go.ridedott.com/vehicles/1?platform=ios",
            android: "https://go.ridedott.com/vehicles/1?platform=android",
            web: nil
        )

        let url = ScooterRentalLinkPolicy.rentalURL(
            provider: "dott",
            rentalURIs: rentalURIs,
            legacyLink: nil
        )

        XCTAssertEqual(
            url?.absoluteString,
            "https://go.ridedott.com/vehicles/1?platform=ios"
        )
        XCTAssertFalse(url?.absoluteString.contains("platform=android") == true)
    }

    func testRentalLinkPolicyRejectsUnsafeAndCrossProviderURLs() {
        XCTAssertNil(ScooterRentalLinkPolicy.safeURL(
            provider: "lime",
            value: "javascript:alert(1)"
        ))
        XCTAssertNil(ScooterRentalLinkPolicy.safeURL(
            provider: "lime",
            value: "bolt://action/rent"
        ))
        XCTAssertNil(ScooterRentalLinkPolicy.safeURL(
            provider: "hopp",
            value: "https://app.hopp.bike.example.com/launch/1"
        ))
        XCTAssertNil(ScooterRentalLinkPolicy.safeURL(
            provider: "hopp",
            value: "https://user@app.hopp.bike/launch/1"
        ))
    }

    func testRentalLinkPolicyNeverOpensBirdsChargerSignUp() {
        // Bird's and Spin's feeds give it as their app's address, in Europe and North America alike.
        for provider in ["bird", "spin"] {
            for link in ["bird://charger-onboarding", "bird://Charger-Onboarding?source=gbfs"] {
                XCTAssertNil(ScooterRentalLinkPolicy.safeURL(provider: provider, value: link), "\(provider) \(link)")
            }
        }
        XCTAssertEqual(
            ScooterRentalLinkPolicy.safeURL(provider: "bird", value: "bird://scooter/ABC123")?.absoluteString,
            "bird://scooter/ABC123"
        )
    }

    func testRentalLinkPolicyKeepsTheNorthAmericanProvidersLinksOnTheirOwnHosts() {
        let hopp = "bolt-hopp://action/rentalsSelectVehicleByRotatedUuid?rotated_uuid=8d8f81ed"
        XCTAssertEqual(ScooterRentalLinkPolicy.safeURL(provider: "bolt_hopp", value: hopp)?.absoluteString, hopp)
        XCTAssertNil(ScooterRentalLinkPolicy.safeURL(provider: "bolt", value: hopp))
        XCTAssertNil(ScooterRentalLinkPolicy.safeURL(provider: "hopp", value: hopp))
        let veo = "https://gmjc.adj.st/?adj_t=5vyf0nr&number=10103344"
        XCTAssertEqual(ScooterRentalLinkPolicy.safeURL(provider: "veo", value: veo)?.absoluteString, veo)
        XCTAssertNil(ScooterRentalLinkPolicy.safeURL(provider: "voi", value: veo))
        let lyft = "https://chi.lft.to/lastmile_qr_scan"
        XCTAssertEqual(ScooterRentalLinkPolicy.safeURL(provider: "lyft", value: lyft)?.absoluteString, lyft)
        XCTAssertNil(ScooterRentalLinkPolicy.safeURL(provider: "spin", value: lyft))
    }

    func testRentalLinkPolicyKeepsSAHAMsLinkToTheNumberOnTheScooter() {
        let saham = "https://ride-saham.app.link/0131"
        XCTAssertEqual(ScooterRentalLinkPolicy.safeURL(provider: "saham", value: saham)?.absoluteString, saham)
        // The other operators on ATOM Mobility don't take SAHAM's links, nor SAHAM theirs.
        XCTAssertNil(ScooterRentalLinkPolicy.safeURL(provider: "hoppy", value: saham))
        XCTAssertNil(ScooterRentalLinkPolicy.safeURL(provider: "saham", value: "https://ride-hoppy.app.link/600332"))
    }

    func testRentalLinkPolicyKeepsTheNewZealandProvidersLinksOnTheirOwnHosts() {
        let flamingo = "https://ride.flamingoscooters.com/vehicle/8bee7d68e6cd88526d26554ab337e57d89cc0ea5316f5c71802205230b2ebcee"
        let urls = ScooterRentalLinkPolicy.rentalURLs(
            provider: "flamingo",
            rentalURIs: ScooterRentalURIs(ios: flamingo, android: "https://ride.flamingoscooters.com/v/8bee7d68", web: nil),
            legacyLink: nil
        )
        XCTAssertEqual(urls.map(\.absoluteString), [flamingo])
        XCTAssertNil(ScooterRentalLinkPolicy.safeURL(provider: "flamingo", value: "https://ride.flamingoscooters.com.example.com/vehicle/1"))
        let jolt = "https://joltscooters.co.nz/vehicle/79f33e40-ee98-4909-b815-d3e35795bd5d"
        XCTAssertEqual(ScooterRentalLinkPolicy.safeURL(provider: "jolt", value: jolt)?.absoluteString, jolt)
        XCTAssertNil(ScooterRentalLinkPolicy.safeURL(provider: "flamingo", value: jolt))
        XCTAssertNil(ScooterRentalLinkPolicy.safeURL(provider: "jolt", value: flamingo))
    }

    @MainActor
    func testOpeningARentalFallsBackToTheWebPageWhenTheProvidersAppIsMissing() async {
        let scooter = Scooter(
            provider: "lime",
            latitude: 47.3769,
            longitude: 8.5417,
            battery: 82,
            rangeMeters: nil,
            vehicleID: "abc-123",
            deepLink: "https://lime.bike/vehicle/abc-123",
            rentalURIs: ScooterRentalURIs(
                ios: "limebike://vehicle/abc-123",
                android: "https://lime.bike/vehicle/abc-123?platform=android",
                web: "https://lime.bike/vehicle/abc-123"
            ),
            distanceMeters: nil
        )
        XCTAssertEqual(scooter.rentalURLs.map(\.absoluteString), [
            "limebike://vehicle/abc-123",
            "https://lime.bike/vehicle/abc-123"
        ])

        // Without Lime on the iPhone nothing handles its scheme: the web page opens instead.
        var tried: [String] = []
        let opened = await scooter.openRental { url in
            tried.append(url.absoluteString)
            return url.scheme == "https"
        }
        XCTAssertEqual(tried, ["limebike://vehicle/abc-123", "https://lime.bike/vehicle/abc-123"])
        XCTAssertEqual(opened?.absoluteString, "https://lime.bike/vehicle/abc-123")

        // With the app installed, its link is the only one tried.
        tried = []
        await scooter.openRental { url in
            tried.append(url.absoluteString)
            return true
        }
        XCTAssertEqual(tried, ["limebike://vehicle/abc-123"])

        // When nothing opens, nothing is reported as opened.
        let nothing = await scooter.openRental { _ in false }
        XCTAssertNil(nothing)
    }

    func testOpensTheOperatorsAppOrItsStorePageWhereTheFeedLinksNoScooter() async {
        func scooter(_ provider: String, rentalURIs: ScooterRentalURIs? = nil) -> Scooter {
            Scooter(
                provider: provider,
                latitude: 40.7128,
                longitude: -74.006,
                battery: 64,
                rangeMeters: nil,
                vehicleID: "\(provider)-1",
                deepLink: nil,
                rentalURIs: rentalURIs,
                distanceMeters: nil
            )
        }
        let lime = scooter("lime")
        XCTAssertEqual(lime.operatorApp?.link.absoluteString, "https://lime.bike/")
        XCTAssertEqual(scooter("bird").operatorApp?.appStore.absoluteString, "https://apps.apple.com/app/id1260842311")
        XCTAssertEqual(scooter("publibike").operatorApp?.link.absoluteString, "https://app.publibike.ch/")

        // With Lime installed, its universal link opens it; only an app may take that link.
        var tried: [String] = []
        let opened = await lime.openOperatorApp { url, appOnly in
            tried.append("\(url.absoluteString) \(appOnly)")
            return true
        }
        XCTAssertEqual(tried, ["https://lime.bike/ true"])
        XCTAssertEqual(opened?.absoluteString, "https://lime.bike/")

        // Without it, the App Store page opens instead.
        tried = []
        let store = await lime.openOperatorApp { url, appOnly in
            tried.append("\(url.absoluteString) \(appOnly)")
            return !appOnly
        }
        XCTAssertEqual(tried, ["https://lime.bike/ true", "https://apps.apple.com/app/id1199780189 false"])
        XCTAssertEqual(store?.absoluteString, "https://apps.apple.com/app/id1199780189")

        // A scooter its feed links keeps that link, and other operators have no app to fall back on.
        let linked = scooter("lime", rentalURIs: ScooterRentalURIs(ios: "https://lime.bike/vehicle/1", android: nil, web: nil))
        XCTAssertNil(linked.operatorApp)
        XCTAssertNil(scooter("dott").operatorApp)
    }

    func testRideEstimateDurationPolicyAcceptsOnlyMenuDurations() {
        XCTAssertEqual(RideEstimateDuration.allowedMinutes, [5, 10, 15, 20, 30])
        XCTAssertEqual(RideEstimateDuration.defaultMinutes, 10)

        for duration in RideEstimateDuration.allowedMinutes {
            XCTAssertEqual(RideEstimateDuration.normalized(duration), duration)
        }
        XCTAssertEqual(RideEstimateDuration.normalized(0), 10)
        XCTAssertEqual(RideEstimateDuration.normalized(12), 10)
        XCTAssertEqual(RideEstimateDuration.normalized(-5), 10)
    }

    func testRidePriceEstimateUsesExactMinorUnitArithmetic() {
        let quote = RidePriceEstimator.quote(
            pricing: ScooterRidePricing(
                currency: "CHF",
                unlockFeeMinorUnits: 95,
                minuteFeeMinorUnits: 41
            ),
            durationMinutes: 30
        )

        XCTAssertEqual(quote.currency, "CHF")
        XCTAssertEqual(quote.durationMinutes, 30)
        XCTAssertEqual(quote.grossMinorUnits, 1_325)
        XCTAssertEqual(quote.totalMinorUnits, 1_325)
        XCTAssertEqual(quote.chargedUnlockFeeMinorUnits, 95)
        XCTAssertEqual(quote.billedMinutes, 30)
        XCTAssertEqual(quote.freeMinutesApplied, 0)
        XCTAssertFalse(quote.passApplied)
    }

    func testActivePassCanRemoveOnlyTheUnlockFee() {
        let quote = RidePriceEstimator.quote(
            pricing: standardPricing,
            durationMinutes: 10,
            pass: ProviderRidePass(enabled: true, freeUnlock: true)
        )

        XCTAssertEqual(quote.grossMinorUnits, 520)
        XCTAssertEqual(quote.totalMinorUnits, 420)
        XCTAssertEqual(quote.chargedUnlockFeeMinorUnits, 0)
        XCTAssertEqual(quote.billedMinutes, 10)
        XCTAssertEqual(quote.freeMinutesApplied, 0)
        XCTAssertTrue(quote.passApplied)
    }

    func testActivePassSubtractsFreeMinutesWithoutGoingBelowZero() {
        let partialQuote = RidePriceEstimator.quote(
            pricing: standardPricing,
            durationMinutes: 10,
            pass: ProviderRidePass(enabled: true, freeMinutes: 4)
        )
        let fullyCoveredQuote = RidePriceEstimator.quote(
            pricing: standardPricing,
            durationMinutes: 10,
            pass: ProviderRidePass(enabled: true, freeUnlock: true, freeMinutes: 30)
        )

        XCTAssertEqual(partialQuote.totalMinorUnits, 352)
        XCTAssertEqual(partialQuote.chargedUnlockFeeMinorUnits, 100)
        XCTAssertEqual(partialQuote.billedMinutes, 6)
        XCTAssertEqual(partialQuote.freeMinutesApplied, 4)
        XCTAssertTrue(partialQuote.passApplied)
        XCTAssertEqual(fullyCoveredQuote.totalMinorUnits, 0)
        XCTAssertEqual(fullyCoveredQuote.chargedUnlockFeeMinorUnits, 0)
        XCTAssertEqual(fullyCoveredQuote.billedMinutes, 0)
        XCTAssertEqual(fullyCoveredQuote.freeMinutesApplied, 10)
        XCTAssertTrue(fullyCoveredQuote.passApplied)
    }

    func testDisabledPassDoesNotAffectEstimate() {
        let quote = RidePriceEstimator.quote(
            pricing: standardPricing,
            durationMinutes: 10,
            pass: ProviderRidePass(
                enabled: false,
                freeUnlock: true,
                freeMinutes: 10
            )
        )

        XCTAssertEqual(quote.totalMinorUnits, 520)
        XCTAssertEqual(quote.billedMinutes, 10)
        XCTAssertFalse(quote.passApplied)
    }

    func testPassExpiryIncludesTheWholeLocalExpiryDay() throws {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = try XCTUnwrap(TimeZone(identifier: "Europe/Zurich"))
        let expiryDate = try XCTUnwrap(calendar.date(from: DateComponents(
            year: 2026,
            month: 8,
            day: 30,
            hour: 8
        )))
        let pass = ProviderRidePass(
            enabled: true,
            freeUnlock: true,
            freeMinutes: 10,
            expiryDate: expiryDate
        )
        let finalMinute = try XCTUnwrap(calendar.date(from: DateComponents(
            year: 2026,
            month: 8,
            day: 30,
            hour: 23,
            minute: 59
        )))
        let nextDay = try XCTUnwrap(calendar.date(from: DateComponents(
            year: 2026,
            month: 8,
            day: 31
        )))

        XCTAssertTrue(pass.isActive(on: finalMinute, calendar: calendar))
        XCTAssertFalse(pass.isActive(on: nextDay, calendar: calendar))
        XCTAssertEqual(
            RidePriceEstimator.quote(
                pricing: standardPricing,
                durationMinutes: 10,
                pass: pass,
                now: finalMinute,
                calendar: calendar
            ).totalMinorUnits,
            0
        )
        XCTAssertEqual(
            RidePriceEstimator.quote(
                pricing: standardPricing,
                durationMinutes: 10,
                pass: pass,
                now: nextDay,
                calendar: calendar
            ).totalMinorUnits,
            520
        )
    }

    func testEnabledPassWithoutExpiryDoesNotExpire() {
        let pass = ProviderRidePass(enabled: true, freeMinutes: 5)
        XCTAssertTrue(pass.isActive(on: .distantFuture))
    }

    func testPassInitializerClampsNegativeFreeMinutes() {
        let pass = ProviderRidePass(enabled: true, freeMinutes: -12)
        let quote = RidePriceEstimator.quote(
            pricing: standardPricing,
            durationMinutes: 10,
            pass: pass
        )

        XCTAssertEqual(pass.freeMinutes, 0)
        XCTAssertEqual(quote.totalMinorUnits, 520)
        XCTAssertFalse(quote.passApplied)
    }

    func testProviderRidePassCodableRoundTripPreservesExpiry() throws {
        let expiryDate = Date(timeIntervalSince1970: 1_788_044_400)
        let pass = ProviderRidePass(
            enabled: true,
            freeUnlock: true,
            freeMinutes: 25,
            expiryDate: expiryDate
        )

        let data = try JSONEncoder().encode(pass)
        let decoded = try JSONDecoder().decode(ProviderRidePass.self, from: data)

        XCTAssertEqual(decoded, pass)
    }

    func testRidePriceEstimateSaturatesInsteadOfOverflowing() {
        let quote = RidePriceEstimator.quote(
            pricing: ScooterRidePricing(
                currency: "CHF",
                unlockFeeMinorUnits: Int.max,
                minuteFeeMinorUnits: Int.max
            ),
            durationMinutes: 30
        )

        XCTAssertEqual(quote.grossMinorUnits, Int.max)
        XCTAssertEqual(quote.totalMinorUnits, Int.max)
        XCTAssertFalse(quote.passApplied)
    }

    private var standardPricing: ScooterRidePricing {
        ScooterRidePricing(
            currency: "CHF",
            unlockFeeMinorUnits: 100,
            minuteFeeMinorUnits: 42
        )
    }

    private func makeScooter(
        provider: String = "lime",
        latitude: Double = 47.3769,
        longitude: Double = 8.5417,
        rangeMeters: Int? = 1_000,
        vehicleID: String? = "vehicle",
        serverDistance: Double = 100
    ) throws -> Scooter {
        Scooter(
            provider: provider,
            latitude: latitude,
            longitude: longitude,
            battery: 75,
            rangeMeters: rangeMeters,
            vehicleID: vehicleID,
            deepLink: nil,
            rentalURIs: nil,
            distanceMeters: serverDistance
        )
    }
}

// Freshness, provider health and the dock.
extension ScooterModelsTests {
    func testBatteryLevelIsGoodFromFiftyLowFromTwentyAndCriticalBelow() throws {
        let levels: [(Int, ScooterBatteryLevel)] = [
            (100, .good), (50, .good), (49, .low), (20, .low), (19, .critical), (0, .critical)
        ]
        for (percent, level) in levels {
            XCTAssertEqual(ScooterBatteryLevel(percent: percent), level, "\(percent)%")
        }

        XCTAssertEqual(try makeScooter().batteryLevel, .good)
        let unknown = Scooter(provider: "lime", latitude: 47.3769, longitude: 8.5417, battery: nil,
            rangeMeters: nil, vehicleID: "unknown", deepLink: nil, rentalURIs: nil, distanceMeters: nil)
        XCTAssertNil(unknown.batteryLevel)
    }

    func testRefreshIsDueAfterTheIntervalOrFiveSecondsBeforeExpiry() {
        let loaded = Date(timeIntervalSince1970: 1_790_000_000)

        // A normal response: the interval comes first.
        XCTAssertEqual(
            ScooterRefreshPolicy.standard.refreshDue(
                lastSuccess: loaded, refreshAfter: 60, expiresAt: loaded.addingTimeInterval(300)
            ),
            loaded.addingTimeInterval(60)
        )
        // A healthy response can arrive with seconds left: refresh before it expires.
        XCTAssertEqual(
            ScooterRefreshPolicy.standard.refreshDue(
                lastSuccess: loaded, refreshAfter: 60, expiresAt: loaded.addingTimeInterval(20)
            ),
            loaded.addingTimeInterval(15)
        )
        // City totals refresh hourly.
        XCTAssertEqual(
            ScooterRefreshPolicy.standard.refreshDue(
                lastSuccess: loaded, refreshAfter: 3_600, expiresAt: loaded.addingTimeInterval(3 * 3_600)
            ),
            loaded.addingTimeInterval(3_600)
        )
        // Nothing has loaded yet: a refresh is always due.
        XCTAssertLessThan(
            ScooterRefreshPolicy.standard.refreshDue(lastSuccess: nil, refreshAfter: 60, expiresAt: nil),
            loaded
        )
    }

    func testAutomaticAttemptsAreNeverCloserThanTenSeconds() {
        let loaded = Date(timeIntervalSince1970: 1_790_000_000)
        func nextAttempt(expiresIn: TimeInterval, lastAttemptAfter: TimeInterval) -> TimeInterval {
            ScooterRefreshPolicy.standard.nextAttempt(
                lastSuccess: loaded,
                refreshAfter: 60,
                expiresAt: loaded.addingTimeInterval(expiresIn),
                lastAttempt: loaded.addingTimeInterval(lastAttemptAfter)
            ).timeIntervalSince(loaded)
        }

        XCTAssertEqual(nextAttempt(expiresIn: 300, lastAttemptAfter: 0), 60)
        // Seconds from expiry on arrival: still ten seconds after the attempt.
        XCTAssertEqual(nextAttempt(expiresIn: 8, lastAttemptAfter: 0), 10)
        // A refresh that failed at 60 s is tried again at 70 s.
        XCTAssertEqual(nextAttempt(expiresIn: 300, lastAttemptAfter: 60), 70)
        XCTAssertEqual(ScooterRefreshPolicy.standard.minimumAttemptGap, 10)
        XCTAssertEqual(ScooterRefreshPolicy.standard.expiryLead, 5)
        XCTAssertEqual(ScooterRefreshPolicy.standard.defaultRefreshAfter, 60)

        let firstAttempt = loaded
        XCTAssertEqual(
            ScooterRefreshPolicy.standard.nextAttempt(
                lastSuccess: nil, refreshAfter: 60, expiresAt: nil, lastAttempt: firstAttempt
            ),
            firstAttempt.addingTimeInterval(10)
        )
    }

    func testARefreshingResponseGetsAQuickFollowUp() {
        let loaded = Date(timeIntervalSince1970: 1_790_000_000)
        let policy = ScooterRefreshPolicy.standard
        XCTAssertEqual(policy.followUpGap, 2)
        // The server suggests three seconds; the gap allows it once.
        XCTAssertEqual(
            policy.nextAttempt(
                lastSuccess: loaded, refreshAfter: 3, expiresAt: loaded.addingTimeInterval(300),
                lastAttempt: loaded, attemptGap: policy.followUpGap
            ),
            loaded.addingTimeInterval(3)
        )
        // Without it, the usual ten seconds.
        XCTAssertEqual(
            policy.nextAttempt(
                lastSuccess: loaded, refreshAfter: 3, expiresAt: loaded.addingTimeInterval(300), lastAttempt: loaded
            ),
            loaded.addingTimeInterval(10)
        )
        let payload = try? JSONDecoder().decode(ScooterResponseMetadataPayload.self, from: Data("""
            {"partial":false,"stale":true,"failedSources":[],"sources":{},"generatedAt":"2026-10-14T10:00:00.000Z",
             "truncated":false,"totalVehicles":0,"mode":"vehicles","zoom":16,"refreshAfterSeconds":3,"refreshing":true}
            """.utf8))
        XCTAssertEqual(payload?.model.refreshing, true)
        XCTAssertEqual(payload?.model.refreshAfterSeconds, 3)
    }

    func testFailedSourcesBecomeDownProvidersOperatingInTheViewport() {
        let failedSources = ["voi_zurich", "Bird_Basel", "velospot", "pony_fr_angers", "city-overview"]
        let health = ScooterProviderHealth(
            failedSources: failedSources,
            operating: [.bolt, .bird, .voi, .publibike],
            inView: []
        )

        XCTAssertEqual(health.downProviders, [.bird, .voi, .publibike])
        XCTAssertTrue(health.hasUnknownFailures)

        // A provider whose scooters are in view is sharing data, whatever feed of its failed.
        let partlyInView = ScooterProviderHealth(
            failedSources: failedSources,
            operating: [.bolt, .bird, .voi, .publibike],
            inView: [.voi, .bolt]
        )
        XCTAssertEqual(partlyInView.downProviders, [.bird, .publibike])

        XCTAssertEqual(
            ScooterProviderHealth(failedSources: [], operating: ScooterProvider.allCases, inView: []),
            .healthy
        )
        // A source prefix does not hide the provider behind it.
        XCTAssertEqual(ScooterProviderHealth.provider(forSource: "france:dott_fr_lyon"), .dott)
        XCTAssertNil(ScooterProviderHealth.provider(forSource: "national"))
    }

    func testDockNoticesNameProvidersThenTruncationThenParking() {
        let metadata = ScooterResponseMetadata(
            partial: true, failedSources: ["bird_zurich"], truncated: true,
            totalVehicles: 5_412, parkingStatus: "partial"
        )
        let oneDown = ScooterProviderHealth(downProviders: [.bird], hasUnknownFailures: true)

        XCTAssertEqual(
            ScooterDockNotice.notices(health: oneDown, metadata: metadata, shownCount: 2_000),
            [.providersDown([.bird]), .truncated(shown: 2_000, total: 5_412), .parkingUnavailable]
        )
        XCTAssertEqual(
            ScooterDockNotice.notices(
                health: ScooterProviderHealth(downProviders: [], hasUnknownFailures: true),
                metadata: ScooterResponseMetadata(partial: true, failedSources: ["city-overview"], parkingStatus: "stale"),
                shownCount: 0
            ),
            [.someProvidersDown, .parkingOutOfDate]
        )
        XCTAssertTrue(ScooterDockNotice.notices(
            health: .healthy,
            metadata: ScooterResponseMetadata(partial: false, failedSources: [], parkingStatus: "fresh"),
            shownCount: 12
        ).isEmpty)

        let one = ScooterDockNotice.providersDown([.bird]).text
        let two = ScooterDockNotice.providersDown([.bird, .dott]).text
        let many = ScooterDockNotice.providersDown([.bird, .dott, .lime]).text
        XCTAssertTrue(one.contains("Bird"))
        XCTAssertTrue(two.contains("Bird") && two.contains("Dott"))
        XCTAssertTrue(many.contains("3"))
        XCTAssertFalse(many.contains("Bird"))
        XCTAssertEqual(Set([one, two, many, ScooterDockNotice.someProvidersDown.text]).count, 4)

        let truncated = ScooterDockNotice.truncated(shown: 2_000, total: 5_412).text
        XCTAssertTrue(truncated.contains(2_000.formatted()))
        XCTAssertTrue(truncated.contains(5_412.formatted()))
        XCTAssertNotEqual(
            ScooterDockNotice.parkingUnavailable.text,
            ScooterDockNotice.parkingOutOfDate.text
        )
    }

    func testCitiesBanRentingOnTheirNightsInLocalTime() throws {
        let oslo = GeoPoint(latitude: 59.9139, longitude: 10.7522)
        let osloTime = try XCTUnwrap(TimeZone(identifier: "Europe/Oslo"))
        let sandvika = GeoPoint(latitude: 59.8913, longitude: 10.5236)
        let iso = ISO8601DateFormatter()
        func at(_ string: String) throws -> Date { try XCTUnwrap(iso.date(from: string)) }

        // 22:59 and 23:00 in Oslo, summer time.
        XCTAssertNil(RentalCurfew.active(at: oslo, on: try at("2026-10-12T20:59:00Z")))
        XCTAssertEqual(
            RentalCurfew.active(at: oslo, on: try at("2026-10-12T21:00:00Z")),
            RentalCurfew.Active(city: "Oslo", until: try at("2026-10-13T03:00:00Z"), timeZone: osloTime)
        )
        XCTAssertNil(RentalCurfew.active(at: oslo, on: try at("2026-10-13T03:00:00Z")))
        XCTAssertNil(RentalCurfew.active(at: sandvika, on: try at("2026-10-12T22:00:00Z")))
        // The nights the clocks go back and forward end at 05:00 all the same.
        XCTAssertEqual(RentalCurfew.active(at: oslo, on: try at("2026-10-24T21:30:00Z"))?.until, try at("2026-10-25T04:00:00Z"))
        XCTAssertEqual(RentalCurfew.active(at: oslo, on: try at("2027-03-27T22:30:00Z"))?.until, try at("2027-03-28T03:00:00Z"))

        // Trondheim bans only Friday and Saturday nights; Stavanger's start at midnight, after the evening.
        let trondheim = GeoPoint(latitude: 63.4305, longitude: 10.3951)
        let stavanger = GeoPoint(latitude: 58.97, longitude: 5.7331)
        XCTAssertNil(RentalCurfew.active(at: trondheim, on: try at("2026-10-12T21:30:00Z")))
        XCTAssertEqual(RentalCurfew.active(at: trondheim, on: try at("2026-10-16T21:30:00Z"))?.until, try at("2026-10-17T03:00:00Z"))
        XCTAssertEqual(RentalCurfew.active(at: trondheim, on: try at("2026-10-17T22:30:00Z"))?.until, try at("2026-10-18T03:00:00Z"))
        XCTAssertNil(RentalCurfew.active(at: trondheim, on: try at("2026-10-18T21:30:00Z")))
        XCTAssertNil(RentalCurfew.active(at: stavanger, on: try at("2026-10-16T21:30:00Z")))
        XCTAssertEqual(RentalCurfew.active(at: stavanger, on: try at("2026-10-16T22:30:00Z"))?.until, try at("2026-10-17T03:00:00Z"))
        XCTAssertNil(RentalCurfew.active(at: stavanger, on: try at("2026-10-15T22:30:00Z")))

        // Kyiv's martial-law curfew, 01:00 to 05:00 Kyiv time, stops at the city's edge.
        let kyiv = GeoPoint(latitude: 50.4501, longitude: 30.5234)
        let brovary = GeoPoint(latitude: 50.5113, longitude: 30.7903)
        XCTAssertNil(RentalCurfew.active(at: kyiv, on: try at("2026-10-14T21:59:00Z")))
        XCTAssertEqual(
            RentalCurfew.active(at: kyiv, on: try at("2026-10-14T22:00:00Z")),
            RentalCurfew.Active(city: "Kyiv", until: try at("2026-10-15T02:00:00Z"), timeZone: try XCTUnwrap(TimeZone(identifier: "Europe/Kyiv")))
        )
        XCTAssertNil(RentalCurfew.active(at: brovary, on: try at("2026-10-14T23:00:00Z")))

        // Dallas lets rides start until 20:45, Central time; Nashville's ban stops at Davidson County's line.
        let dallas = GeoPoint(latitude: 32.7767, longitude: -96.797)
        let nashville = GeoPoint(latitude: 36.1627, longitude: -86.7816)
        let brentwood = GeoPoint(latitude: 36.0331, longitude: -86.7828)
        XCTAssertNil(RentalCurfew.active(at: dallas, on: try at("2026-10-15T01:44:00Z")))
        XCTAssertEqual(
            RentalCurfew.active(at: dallas, on: try at("2026-10-15T01:45:00Z")),
            RentalCurfew.Active(city: "Dallas", until: try at("2026-10-15T10:00:00Z"), timeZone: try XCTUnwrap(TimeZone(identifier: "America/Chicago")))
        )
        XCTAssertEqual(RentalCurfew.active(at: nashville, on: try at("2026-10-15T05:30:00Z"))?.until, try at("2026-10-15T10:00:00Z"))
        XCTAssertNil(RentalCurfew.active(at: brentwood, on: try at("2026-10-15T05:30:00Z")))

        // Minneapolis from midnight, Central time; Raleigh from 23:00, Eastern time, on NC State's campus too; Birmingham from 23:00, Central time.
        let minneapolis = GeoPoint(latitude: 44.9778, longitude: -93.265)
        let ncState = GeoPoint(latitude: 35.7847, longitude: -78.6821)
        let birmingham = GeoPoint(latitude: 33.5186, longitude: -86.8104)
        XCTAssertNil(RentalCurfew.active(at: minneapolis, on: try at("2026-10-15T04:59:00Z")))
        XCTAssertEqual(RentalCurfew.active(at: minneapolis, on: try at("2026-10-15T05:00:00Z"))?.until, try at("2026-10-15T09:00:00Z"))
        XCTAssertNil(RentalCurfew.active(at: ncState, on: try at("2026-10-15T02:59:00Z")))
        XCTAssertEqual(
            RentalCurfew.active(at: ncState, on: try at("2026-10-15T03:00:00Z")),
            RentalCurfew.Active(city: "Raleigh", until: try at("2026-10-15T10:00:00Z"), timeZone: try XCTUnwrap(TimeZone(identifier: "America/New_York")))
        )
        XCTAssertEqual(RentalCurfew.active(at: birmingham, on: try at("2026-10-15T04:00:00Z"))?.until, try at("2026-10-15T11:00:00Z"))

        // The ban comes before every other notice, with a moon.
        let curfew = RentalCurfew.Active(city: "Oslo", until: try at("2026-10-13T03:00:00Z"), timeZone: osloTime)
        XCTAssertEqual(
            ScooterDockNotice.notices(
                curfew: curfew,
                health: ScooterProviderHealth(downProviders: [.bird], hasUnknownFailures: false),
                metadata: ScooterResponseMetadata(partial: true, failedSources: ["bird_oslo"]),
                shownCount: 12
            ),
            [.curfew(curfew), .providersDown([.bird])]
        )
        XCTAssertEqual(ScooterDockNotice.curfew(curfew).systemImage, "moon.fill")
        XCTAssertTrue(ScooterDockNotice.curfew(curfew).text.contains("Oslo"))
        XCTAssertTrue(ScooterDockNotice.curfew(curfew).text.contains(ScooterDockStatus.clockTime(curfew.until, in: osloTime)))

        // By the city's clock, named after its zone where the iPhone's reads otherwise.
        let farAway = try XCTUnwrap(TimeZone(identifier: TimeZone.current.secondsFromGMT() == 14 * 3600 ? "Pacific/Pago_Pago" : "Pacific/Kiritimati"))
        let there = ScooterDockStatus.clockTime(curfew.until, in: farAway)
        XCTAssertNotEqual(there, ScooterDockStatus.clockTime(curfew.until))
        XCTAssertTrue(there.contains("GMT"), there)
        XCTAssertEqual(ScooterDockStatus.clockTime(curfew.until, in: .current), ScooterDockStatus.clockTime(curfew.until))
        let farCurfew = RentalCurfew.Active(city: "Oslo", until: curfew.until, timeZone: farAway)
        XCTAssertTrue(ScooterDockNotice.curfew(farCurfew).text.contains(there))
    }

    func testDockStatusPrefersFailureThenDelayThenCityTotalsThenAge() {
        let updated = Date(timeIntervalSince1970: 1_790_000_000)
        func summary(
            failure: ScooterLoadFailure? = nil,
            overview: Bool = false,
            delayed: Bool = false
        ) -> ScooterDockSummary {
            ScooterDockSummary(
                count: 22, countContext: .nearby, lastUpdated: updated, refreshFailure: failure,
                isOverview: overview, isDelayed: delayed, notices: [], hint: nil, chips: []
            )
        }
        func status(after seconds: TimeInterval) -> ScooterDockStatus? {
            summary().status(at: updated.addingTimeInterval(seconds))
        }

        XCTAssertEqual(status(after: 0), .live)
        XCTAssertEqual(status(after: 89), .live)
        XCTAssertEqual(status(after: 90), .updatedMinutesAgo(1))
        XCTAssertEqual(status(after: 150), .updatedMinutesAgo(2))
        XCTAssertEqual(status(after: 3_599), .updatedMinutesAgo(59))
        XCTAssertEqual(status(after: 3_600), .updatedAt(updated))
        // A clock that runs behind the server still reads as live.
        XCTAssertEqual(status(after: -30), .live)

        let later = updated.addingTimeInterval(600)
        XCTAssertEqual(summary(delayed: true).status(at: later), .delayed(showing: updated))
        XCTAssertEqual(summary(overview: true).status(at: later), .cityTotals)
        XCTAssertEqual(summary(overview: true, delayed: true).status(at: later), .delayed(showing: updated))
        XCTAssertEqual(
            summary(failure: .offline, overview: true, delayed: true).status(at: later),
            .offline(showing: updated)
        )
        for failure in ScooterLoadFailure.allCases where failure != .offline {
            XCTAssertEqual(summary(failure: failure).status(at: later), .refreshFailed(showing: updated))
        }
        XCTAssertTrue(summary(failure: .busy).showsTryAgain)
        XCTAssertFalse(summary().showsTryAgain)

        // With every provider here down, there is no line, unless a refresh failed or the data is delayed.
        var down = summary()
        down.everyProviderDown = true
        XCTAssertNil(down.status(at: updated))
        XCTAssertNil(down.status(at: later))
        var downFailed = summary(failure: .timeout)
        downFailed.everyProviderDown = true
        XCTAssertEqual(downFailed.status(at: later), .refreshFailed(showing: updated))
        var downDelayed = summary(delayed: true)
        downDelayed.everyProviderDown = true
        XCTAssertEqual(downDelayed.status(at: later), .delayed(showing: updated))
    }

    func testDockStatusTextCarriesTheTimeOrTheMinutes() {
        let updated = Date(timeIntervalSince1970: 1_790_000_000)
        let time = ScooterDockStatus.clockTime(updated)

        XCTAssertFalse(time.isEmpty)
        for status in [
            ScooterDockStatus.refreshFailed(showing: updated),
            .offline(showing: updated),
            .delayed(showing: updated),
            .updatedAt(updated)
        ] {
            XCTAssertTrue(status.text.contains(time), status.text)
        }
        XCTAssertTrue(ScooterDockStatus.updatedMinutesAgo(7).text.contains("7"))
        XCTAssertEqual(ScooterDockStatus.live.text, String(localized: "Live"))
        XCTAssertEqual(ScooterDockStatus.cityTotals.text, String(localized: "City totals · refreshed hourly"))

        XCTAssertTrue(ScooterDockStatus.live.isLive)
        XCTAssertFalse(ScooterDockStatus.updatedMinutesAgo(2).isLive)
        XCTAssertTrue(ScooterDockStatus.refreshFailed(showing: updated).isWarning)
        XCTAssertTrue(ScooterDockStatus.offline(showing: updated).isWarning)
        XCTAssertFalse(ScooterDockStatus.delayed(showing: updated).isWarning)

        let body = ScooterDockStatus.outOfDateBody(.offline, lastUpdate: updated)
        XCTAssertTrue(body.contains(time))
        XCTAssertTrue(body.hasSuffix(ScooterLoadFailure.offline.message))
    }

    func testCountLabelsHaveSingularAndPluralFormsForBothContexts() {
        XCTAssertEqual(ScooterCountContext.nearby.label(for: 1), String(localized: "scooter nearby"))
        XCTAssertEqual(ScooterCountContext.nearby.label(for: 22), String(localized: "scooters nearby"))
        XCTAssertEqual(ScooterCountContext.nearby.label(for: 0), String(localized: "scooters nearby"))
        XCTAssertEqual(ScooterCountContext.onThisMap.label(for: 1), String(localized: "scooter on this map"))
        XCTAssertEqual(ScooterCountContext.onThisMap.label(for: 2), String(localized: "scooters on this map"))
        XCTAssertNotEqual(ScooterDockHint.tapCity.text, ScooterDockHint.emptyArea.text)

        // French counts nothing in the singular: "0 trottinette à proximité".
        XCTAssertEqual([0, 1, 2].map { ScooterPlural.isSingular($0, language: "fr") }, [true, true, false])
        for language in ["en", "de", "it", "pt", "es", "is"] {
            XCTAssertEqual(
                [0, 1, 2].map { ScooterPlural.isSingular($0, language: language) },
                [false, true, false],
                language
            )
        }
        // Icelandic counts 21, 31 and 101 in the singular, but not 11: "21 rafskúta".
        XCTAssertEqual([11, 21, 31, 101, 111].map { ScooterPlural.isSingular($0, language: "is") }, [false, true, true, true, false])
        XCTAssertFalse(ScooterPlural.isSingular(21, language: "pt"))
        XCTAssertEqual(
            ScooterCountContext.nearby.label(for: 0, language: "fr"),
            String(localized: "scooter nearby")
        )
        XCTAssertEqual(
            ScooterCountContext.onThisMap.label(for: 0, language: "fr"),
            String(localized: "scooter on this map")
        )
        XCTAssertEqual(
            ScooterCountContext.onThisMap.label(for: 2, language: "fr"),
            String(localized: "scooters on this map")
        )
        XCTAssertTrue(["en", "de", "fr", "it", "nl", "nb", "pt", "es", "is"].contains(ScooterPlural.language))
    }

    func testTheCoverageCardCountsEachCityOfTheCatalogsOnceAndTheirCountries() {
        let cities = ScooterCityCatalog.cities
        XCTAssertEqual(ScooterCityCatalog.cityCount, cities.count)
        XCTAssertEqual(Set(cities.map(\.id)).count, cities.count)
        XCTAssertEqual(ScooterCityCatalog.countryCount, Set(cities.map(\.countryCode)).count)
        XCTAssertTrue(cities.contains { $0.countryCode == "CH" })
        // Dott's one feed for Wołomin, Kobyłka and Radzymin counts three towns.
        for id in ["pl:Wołomin", "pl:Kobyłka", "pl:Radzymin"] {
            XCTAssertEqual(cities.filter { $0.id == id }.count, 1, id)
        }

        defer { ScooterLanguage.current = .atLaunch }
        ScooterLanguage.current = .en
        XCTAssertEqual(
            ScooterCoverageSummary.text(),
            held("ScootRadar covers \(ScooterCityCatalog.cityCount) cities in \(ScooterCityCatalog.countryCount) countries.")
        )
    }

    /// A sentence as written here, each count held to its noun by a no-break space.
    private func held(_ sentence: String) -> String {
        sentence.replacingOccurrences(of: #"(\d) "#, with: "$1\u{00A0}", options: .regularExpression)
    }

    func testTheCoverageSentenceGivesEachCountItsOwnFormInEveryLanguage() {
        defer { ScooterLanguage.current = .atLaunch }
        let sentences: [ScooterLanguage: (many: String, one: String)] = [
            .en: ("ScootRadar covers 186 cities in 17 countries.", "ScootRadar covers 1 city in 1 country."),
            .de: ("ScootRadar deckt 186 Städte in 17 Ländern ab.", "ScootRadar deckt 1 Stadt in 1 Land ab."),
            .fr: ("ScootRadar couvre 186 villes dans 17 pays.", "ScootRadar couvre 1 ville dans 1 pays."),
            .it: ("ScootRadar copre 186 città in 17 paesi.", "ScootRadar copre 1 città in 1 paese."),
            .nl: ("ScootRadar werkt in 186 steden in 17 landen.", "ScootRadar werkt in 1 stad in 1 land."),
            .nb: ("ScootRadar dekker 186 byer i 17 land.", "ScootRadar dekker 1 by i 1 land."),
            .pt: ("O ScootRadar abrange 186 cidades em 17 países.", "O ScootRadar abrange 1 cidade em 1 país."),
            .es: ("ScootRadar cubre 186 ciudades en 17 países.", "ScootRadar cubre 1 ciudad en 1 país."),
            .is: ("ScootRadar nær yfir 186 staði í 17 löndum.", "ScootRadar nær yfir 1 stað í 1 landi."),
        ]
        XCTAssertEqual(Set(sentences.keys), Set(ScooterLanguage.allCases))
        for (language, sentence) in sentences {
            ScooterLanguage.current = language
            XCTAssertEqual(ScooterCoverageSummary.text(cities: 186, countries: 17), held(sentence.many), language.rawValue)
            XCTAssertEqual(ScooterCoverageSummary.text(cities: 1, countries: 1), held(sentence.one), language.rawValue)
        }

        // Icelandic counts 21 in the singular, but not 11 or 22, and each count picks its own form.
        ScooterLanguage.current = .is
        XCTAssertEqual(ScooterCoverageSummary.text(cities: 21, countries: 21), held("ScootRadar nær yfir 21 stað í 21 landi."))
        XCTAssertEqual(ScooterCoverageSummary.text(cities: 22, countries: 22), held("ScootRadar nær yfir 22 staði í 22 löndum."))
        XCTAssertEqual(ScooterCoverageSummary.text(cities: 11, countries: 11), held("ScootRadar nær yfir 11 staði í 11 löndum."))
        XCTAssertEqual(ScooterCoverageSummary.text(cities: 186, countries: 21), held("ScootRadar nær yfir 186 staði í 21 landi."))
        XCTAssertEqual(ScooterCoverageSummary.text(cities: 21, countries: 17), held("ScootRadar nær yfir 21 stað í 17 löndum."))
        ScooterLanguage.current = .en
        XCTAssertEqual(ScooterCoverageSummary.text(cities: 21, countries: 21), held("ScootRadar covers 21 cities in 21 countries."))
    }

    func testTheCoverageSentenceKeepsEachCountOnTheLineOfItsNounInEveryLanguage() throws {
        defer { ScooterLanguage.current = .atLaunch }
        let held = try NSRegularExpression(pattern: #"\d\u00A0\p{L}"#)
        let counts = [(ScooterCityCatalog.cityCount, ScooterCityCatalog.countryCount), (1, 1), (21, 22), (1200, 17)]
        for language in ScooterLanguage.allCases {
            ScooterLanguage.current = language
            for (cities, countries) in counts {
                let sentence = ScooterCoverageSummary.text(cities: cities, countries: countries)
                let whole = NSRange(sentence.startIndex..., in: sentence)
                XCTAssertNil(sentence.range(of: #"\d "#, options: .regularExpression), "\(language.rawValue): \(sentence)")
                XCTAssertEqual(held.numberOfMatches(in: sentence, range: whole), 2, "\(language.rawValue): \(sentence)")
            }
        }
    }

    func testPercentagesAndTheShownStateReadAsOnTheWeb() throws {
        for language in ["en", "de", "fr", "it", "nl", "nb", "pt", "es", "is"] {
            let strings = try XCTUnwrap(
                Bundle.main.path(forResource: language, ofType: "lproj").flatMap(Bundle.init(path:))
            )
            // "82%" and "Akku ab 60%", like the presets "60%+" beside them.
            XCTAssertEqual(strings.localizedString(forKey: "%lld%%", value: nil, table: nil), "%lld%%", language)
            let summary = strings.localizedString(forKey: "battery %lld%% or more", value: nil, table: nil)
            XCTAssertTrue(summary.contains("%lld%%"), "\(language): \(summary)")
            XCTAssertFalse(summary.contains(" %%"), "\(language): \(summary)")
        }
        let german = try XCTUnwrap(Bundle.main.path(forResource: "de", ofType: "lproj").flatMap(Bundle.init(path:)))
        XCTAssertEqual(german.localizedString(forKey: "Shown", value: nil, table: nil), "Eingeblendet")
        XCTAssertEqual(german.localizedString(forKey: "Hidden", value: nil, table: nil), "Ausgeblendet")
    }

    func testSettingsListTheLanguagesByTheirOwnNamesAndNameThemInTheLanguageShown() {
        XCTAssertEqual(
            ScooterLanguage.byName.map(\.name),
            ["Deutsch", "English", "Español", "Français", "Íslenska", "Italiano", "Nederlands", "Norsk", "Português"]
        )
        XCTAssertEqual(Set(ScooterLanguage.byName), Set(ScooterLanguage.allCases))

        XCTAssertEqual(ScooterLanguage.de.name(in: .fr), "Allemand")
        XCTAssertEqual(ScooterLanguage.de.name(in: .it), "Tedesco")
        XCTAssertEqual(ScooterLanguage.is.name(in: .en), "Icelandic")
        XCTAssertEqual(ScooterLanguage.is.name(in: .nl), "IJslands")
        XCTAssertEqual(ScooterLanguage.nb.name(in: .en), "Norwegian")
        XCTAssertEqual(ScooterLanguage.en.name(in: .is), "Enska")
        // A language shown in itself has no second name.
        for language in ScooterLanguage.allCases {
            XCTAssertNil(language.name(in: language), language.rawValue)
        }
    }

    func testAutomaticPicksTheFirstOfTheIPhonesLanguagesTheAppIsTranslatedInto() {
        XCTAssertEqual(ScooterLanguage(preferences: ["ja-JP", "de-CH", "fr-CH"]), .de)
        XCTAssertEqual(ScooterLanguage(preferences: ["pt-BR"]), .pt)
        XCTAssertEqual(ScooterLanguage(preferences: ["es-419"]), .es)
        XCTAssertEqual(ScooterLanguage(preferences: ["nb-NO", "en"]), .nb)
        XCTAssertEqual(ScooterLanguage(preferences: ["is-IS"]), .is)
        XCTAssertEqual(ScooterLanguage(preferences: ["ja-JP", "zh-Hans-CN"]), .en)
        XCTAssertEqual(ScooterLanguage(preferences: []), .en)
        XCTAssertFalse(ScooterLanguage.iPhoneLanguages.isEmpty)

        // The app follows the iPhone until its own defaults name a language,
        // as its Settings or the iPhone's write it.
        XCTAssertEqual(ScooterLanguageChoice(appDefaults: [:], shown: .de), .automatic)
        XCTAssertEqual(ScooterLanguageChoice(appDefaults: ["has-located-once": true], shown: .de), .automatic)
        XCTAssertEqual(ScooterLanguageChoice(appDefaults: ["AppleLanguages": ["fr"]], shown: .fr), .language(.fr))
    }

    func testTheIPhonesLanguagesStayTheIPhonesOnceTheAppHasOneOfItsOwn() {
        // Automatic says "English, the language of your iPhone" after French
        // was chosen for the app, not "Français": Locale.preferredLanguages
        // would give the app's.
        let iPhone = ScooterLanguage.iPhoneLanguages
        let chosen = iPhone.first?.hasPrefix("is") == true ? "nl" : "is"
        let appDefaults = Bundle.main.bundleIdentifier.flatMap(UserDefaults.standard.persistentDomain(forName:))
        UserDefaults.standard.set([chosen], forKey: ScooterLanguageChoice.key)
        defer { UserDefaults.standard.set(appDefaults?[ScooterLanguageChoice.key], forKey: ScooterLanguageChoice.key) }

        XCTAssertEqual(Locale.preferredLanguages.first, chosen)
        XCTAssertEqual(ScooterLanguage.iPhoneLanguages, iPhone)
    }

    func testEveryLanguageWritesTheLanguageChoices() throws {
        let keys = [
            "Automatic (language)",
            "%@, the language of your iPhone",
            "Follows your iPhone’s language, if you change it there."
        ]
        for language in ScooterLanguage.allCases {
            let strings = try XCTUnwrap(
                Bundle.main.path(forResource: language.rawValue, ofType: "lproj").flatMap(Bundle.init(path:))
            )
            for key in keys {
                let text = strings.localizedString(forKey: key, value: "?", table: nil)
                XCTAssertNotEqual(text, "?", "\(language.rawValue): \(key)")
                XCTAssertEqual(text.contains("%@"), key.contains("%@"), "\(language.rawValue): \(text)")
            }
        }
        // Italian says Automatico of the appearance, Automatica of the language: "lingua" is feminine.
        let italian = try XCTUnwrap(Bundle.main.path(forResource: "it", ofType: "lproj").flatMap(Bundle.init(path:)))
        XCTAssertEqual(italian.localizedString(forKey: "Automatic", value: nil, table: nil), "Automatico")
        XCTAssertEqual(italian.localizedString(forKey: "Automatic (language)", value: nil, table: nil), "Automatica")
    }

    func testFrenchAndItalianNameTheOperatorWithOneWordAndFrenchShowsNothingInTheSingular() throws {
        func strings(_ language: String) throws -> Bundle {
            try XCTUnwrap(Bundle.main.path(forResource: language, ofType: "lproj").flatMap(Bundle.init(path:)))
        }
        let french = try strings("fr")
        let italian = try strings("it")
        let pricing = "Pricing can vary. Confirm the final price and pass eligibility in the provider app before riding."

        XCTAssertEqual(french.localizedString(forKey: "Show 0 scooters", value: nil, table: nil), "Afficher 0 trottinette")
        XCTAssertEqual(italian.localizedString(forKey: "Show 0 scooters", value: nil, table: nil), "Mostra 0 monopattini")
        XCTAssertTrue(french.localizedString(forKey: pricing, value: nil, table: nil).contains("l’app de l’opérateur"))
        XCTAssertTrue(italian.localizedString(forKey: pricing, value: nil, table: nil).contains("nell’app dell’operatore"))
    }

    func testClosestCityLabelsShowWholeKilometres() throws {
        let lungern = GeoPoint(latitude: 46.7741, longitude: 8.1558)
        let closest = ScooterCityCatalog.nearest(to: lungern, count: 3)

        XCTAssertEqual(closest.map(\.city.name), ["Bern", "Wädenswil", "Zürich"])
        let bern = try XCTUnwrap(closest.first)
        let swiss = bern.formattedDistance(locale: Locale(identifier: "en_CH"))
        XCTAssertEqual(plainSpaces(swiss), "57 km")
        XCTAssertEqual(plainSpaces(bern.formattedDistance(locale: Locale(identifier: "en_US"))), "36 mi")
        XCTAssertEqual(bern.formattedDistance, bern.formattedDistance(locale: ScooterLanguage.current.locale))
        XCTAssertTrue(bern.label.hasPrefix("Bern"))
        XCTAssertTrue(bern.label.hasSuffix(bern.formattedDistance))
        XCTAssertFalse(ScooterCityCatalog.contains(lungern))

        let place = bern.city.destination
        XCTAssertEqual(place.title, "Bern")
        XCTAssertEqual(place.point, bern.city.center)
        XCTAssertEqual(place.kind, .city)
        XCTAssertFalse(place.subtitle.isEmpty)
        XCTAssertNotEqual(place.subtitle, "CH")
    }

    func testParkingBayCardNamesTheProviderAndTheRule() {
        let mandatory = ScooterParking(id: "dott:bay", provider: "dott", name: "Rue Faidherbe",
            latitude: 50.6365, longitude: 3.0635, mandatory: true)
        let optional = ScooterParking(id: "lime:bay", provider: "lime", name: "Place",
            latitude: 50.6365, longitude: 3.0635, mandatory: false)

        XCTAssertEqual(mandatory.providerInfo, .dott)
        XCTAssertTrue(mandatory.bayTitle.contains("Dott"))
        XCTAssertTrue(mandatory.footnote.contains("Dott"))
        XCTAssertNotEqual(mandatory.bayTitle, mandatory.footnote)
        XCTAssertEqual(mandatory.notice, String(localized: "You must park in a bay in this zone."))
        XCTAssertEqual(optional.notice, String(localized: "Designated scooter parking."))
    }

    func testLocationCardsOfferTheActionsThatCanHelp() {
        XCTAssertNotNil(ScooterLocationIssue.denied.title)
        XCTAssertTrue(ScooterLocationIssue.denied.canOpenSettings)
        XCTAssertTrue(ScooterLocationIssue.denied.canSearchPlace)
        XCTAssertFalse(ScooterLocationIssue.denied.canRetry)

        XCTAssertNil(ScooterLocationIssue.restricted.title)
        XCTAssertFalse(ScooterLocationIssue.restricted.canOpenSettings)
        XCTAssertTrue(ScooterLocationIssue.restricted.canSearchPlace)

        XCTAssertNil(ScooterLocationIssue.notFound.title)
        XCTAssertTrue(ScooterLocationIssue.notFound.canRetry)
        XCTAssertFalse(ScooterLocationIssue.notFound.canSearchPlace)

        let messages = [ScooterLocationIssue.denied, .restricted, .notFound].map(\.message)
        XCTAssertEqual(Set(messages).count, 3)
    }

    func testSearchBarStatesHaveTheirOwnLines() {
        let place = MapDestination(title: "Zürich HB", point: GeoPoint(latitude: 47.3782, longitude: 8.5402))

        XCTAssertNil(ScooterSearchBarState.empty.subtitle)
        XCTAssertNil(ScooterSearchBarState.locating.subtitle)
        XCTAssertEqual(ScooterSearchBarState.place(place).title, "Zürich HB")
        XCTAssertNotNil(ScooterSearchBarState.place(place).subtitle)
        XCTAssertTrue(ScooterSearchBarState.place(place).accessibilityLabel.contains("Zürich HB"))
        XCTAssertEqual(place.subtitle, "")
        XCTAssertEqual(place.kind, .address)
    }

    func testSearchBarPromisesScootersOnlyWhereThereIsScooterData() throws {
        let zurich = MapDestination(title: "Zürich HB", point: GeoPoint(latitude: 47.3782, longitude: 8.5402))
        let lungern = MapDestination(title: "Paradeplatz", point: GeoPoint(latitude: 46.7741, longitude: 8.1558))
        let neutral = String(localized: "Tap to search a city or address")

        // The service areas bundled with the app decide when the search did not say.
        XCTAssertTrue(zurich.isCovered)
        XCTAssertFalse(lungern.isCovered)

        let served = ScooterSearchBarState.place(zurich)
        XCTAssertEqual(served.subtitle, String(localized: "Scooters near this place"))
        XCTAssertNotEqual(served.subtitle, neutral)

        // Where no operator shares data the bar keeps to the neutral line, also for VoiceOver.
        let unserved = ScooterSearchBarState.place(lungern)
        XCTAssertEqual(unserved.subtitle, neutral)
        XCTAssertEqual(unserved.accessibilityLabel, "Paradeplatz. \(neutral)")
        XCTAssertEqual(
            served.accessibilityLabel,
            String(format: String(localized: "Showing scooters near %@. Search another place."), "Zürich HB")
        )

        // The search's own answer wins over the bundled areas, and a covered city is always served.
        let reportedUnserved = MapDestination(title: "Zürich HB", point: zurich.point, isCovered: false)
        XCTAssertEqual(ScooterSearchBarState.place(reportedUnserved).subtitle, neutral)
        let city = try XCTUnwrap(ScooterCityCatalog.cities.first)
        XCTAssertTrue(city.destination.isCovered)
    }

    func testNeighbouringCityTotalsAreDrawnAsOneOnTheLargest() {
        let paris = ScooterCluster(id: "city:Paris", latitude: 48.8566, longitude: 2.3522, count: 4000,
                                   providers: ["dott": 3000, "lime": 1000], city: "Paris")
        let boulogne = ScooterCluster(id: "city:Boulogne", latitude: 48.8397, longitude: 2.2399, count: 200,
                                      providers: ["dott": 200], city: "Boulogne")
        let lyon = ScooterCluster(id: "city:Lyon", latitude: 45.764, longitude: 4.8357, count: 900,
                                  providers: ["voi": 900], city: "Lyon")

        let grouped = ScooterCityGrouping.group([boulogne, lyon, paris], zoomLevel: 6)
        XCTAssertEqual(grouped.count, 2)
        XCTAssertEqual(grouped[0].id, "group:city:Paris")
        XCTAssertEqual(grouped[0].city, "Paris, Boulogne")
        XCTAssertEqual(grouped[0].latitude, paris.latitude)
        XCTAssertEqual(grouped[0].count, 4200)
        XCTAssertEqual(grouped[0].providers, ["dott": 3200, "lime": 1000])
        XCTAssertEqual(grouped[0].bounds, GeoBounds(south: boulogne.latitude, west: boulogne.longitude,
                                                    north: paris.latitude, east: paris.longitude))
        XCTAssertEqual(grouped[1], lyon)

        XCTAssertEqual(ScooterCityGrouping.group([paris, boulogne, lyon], zoomLevel: 12), [paris, lyon, boulogne])
    }

    func testZoomedOutToAContinentEachCountryIsOneTotal() {
        let paris = ScooterCluster(id: "city:fr:Paris", latitude: 48.8566, longitude: 2.3522, count: 3000,
                                   providers: ["dott": 3000], city: "Paris")
        let bordeaux = ScooterCluster(id: "city:fr:Bordeaux", latitude: 44.8378, longitude: -0.5792, count: 500,
                                      providers: ["dott": 500], city: "Bordeaux")
        let berlin = ScooterCluster(id: "city:de:Berlin", latitude: 52.52, longitude: 13.405, count: 700,
                                    providers: ["voi": 700], city: "Berlin")
        let names = ["fr": "France", "de": "Germany"]

        let totals = ScooterCityGrouping.group([paris, bordeaux, berlin], zoomLevel: 4) { names[$0]! }
        XCTAssertEqual(totals.map(\.id), ["country:fr", "country:de"])
        XCTAssertEqual(totals[0].city, "France")
        XCTAssertEqual(totals[0].count, 3500)
        XCTAssertEqual(totals[0].latitude, 46.6)
        XCTAssertEqual(totals[0].bounds, GeoBounds(south: bordeaux.latitude, west: bordeaux.longitude,
                                                   north: paris.latitude, east: paris.longitude))

        XCTAssertEqual(ScooterCityGrouping.group([paris, bordeaux], zoomLevel: 5).map(\.id),
                       ["city:fr:Paris", "city:fr:Bordeaux"])
    }

    func testTheIdOfATownInACountryWithStatesNamesItsCountryFirst() {
        // Two towns of one name, told apart by their state.
        let oregon = ScooterCluster(id: "city:us:or:Portland", latitude: 45.52, longitude: -122.68, count: 900,
                                    providers: ["lime": 900], city: "Portland, OR")
        let maine = ScooterCluster(id: "city:us:me:Portland", latitude: 43.66, longitude: -70.26, count: 100,
                                   providers: ["lime": 100], city: "Portland, ME")
        XCTAssertEqual(ScooterCityGrouping.country(of: oregon), "us")
        XCTAssertEqual(ScooterCityGrouping.country(of: maine), "us")
        XCTAssertNil(ScooterCityGrouping.country(of: ScooterCluster(
            id: "group:city:us:or:Portland", latitude: 45.52, longitude: -122.68, count: 1, providers: [:], city: nil
        )))

        // Without state totals, as Mexico, one for the country.
        let totals = ScooterCityGrouping.group([maine, oregon], zoomLevel: 3, regions: [:])
        XCTAssertEqual(totals.map(\.id), ["country:us"])
        XCTAssertEqual(totals[0].count, 1000)
        XCTAssertEqual(ScooterCityGrouping.group([maine, oregon], zoomLevel: 6).map(\.id),
                       ["city:us:or:Portland", "city:us:me:Portland"])
    }

    func testZoomedOutACountryWithStateTotalsShowsOnePerState() {
        // As data/countries.json would list the United States' states, with California, whose code is Canada's.
        let regions = ["us": [
            "ca": ScooterRegion(name: "California", names: ["de": "Kalifornien", "fr": "Californie"], latitude: 36.8, longitude: -119.4),
            "me": ScooterRegion(name: "Maine", latitude: 45.3, longitude: -69.2),
            "or": ScooterRegion(name: "Oregon", latitude: 43.9, longitude: -120.6),
        ]]
        let city = { (id: String, latitude: Double, longitude: Double, count: Int) in
            ScooterCluster(id: "city:\(id)", latitude: latitude, longitude: longitude, count: count,
                           providers: ["lime": count], city: id)
        }
        let cities = [
            city("us:or:Portland", 45.52, -122.68, 900), city("us:me:Portland", 43.66, -70.26, 100),
            city("us:me:South Portland", 43.63, -70.29, 50), city("us:ca:Los Angeles", 34.05, -118.24, 2000),
            city("fr:Lyon", 45.76, 4.84, 500),
        ]
        let names = ["us": "États-Unis", "fr": "France"]

        let states = ScooterCityGrouping.group(cities, zoomLevel: 4, language: .fr, regions: regions) { names[$0]! }
        XCTAssertEqual(states.map(\.id), ["region:us:ca", "region:us:or", "country:fr", "region:us:me"])
        XCTAssertEqual(states.map(\.city), ["Californie", "Oregon", "France", "Maine"])
        XCTAssertEqual(states[0].latitude, 36.8)
        XCTAssertEqual(states[3].count, 150)
        XCTAssertEqual(states[3].bounds, GeoBounds(south: 43.63, west: -70.29, north: 43.66, east: -70.26))
        XCTAssertEqual(ScooterCityGrouping.group(cities, zoomLevel: 3, language: .de, regions: regions) { names[$0]! }
            .map(\.city), ["Kalifornien", "Oregon", "France", "Maine"])

        // Zoomed out to the world, the country is one total again.
        let world = ScooterCityGrouping.group(cities, zoomLevel: 2.9, language: .fr, regions: regions) { names[$0]! }
        XCTAssertEqual(world.map(\.id), ["country:us", "country:fr"])
        XCTAssertEqual(world[0].count, 3050)
        // The generated catalog gives the United States its states' totals; without them, as Mexico, one for the country.
        XCTAssertEqual(ScooterCityGrouping.group(cities, zoomLevel: 4).map(\.id),
                       ["region:us:ca", "region:us:or", "country:fr", "region:us:me"])
        XCTAssertEqual(ScooterCityGrouping.group(cities, zoomLevel: 4, regions: [:]).map(\.id), ["country:us", "country:fr"])
        XCTAssertNil(ScooterCityGrouping.region(of: cities[4], in: regions))
        XCTAssertEqual(ScooterCityGrouping.region(of: cities[0], in: regions)?.code, "or")
    }
}

// Where the map opens when it may not use the iPhone's location.
extension ScooterModelsTests {
    private func city(_ id: String, _ countryCode: String, _ latitude: Double, _ longitude: Double) -> ScooterCity {
        ScooterCity(
            id: id,
            name: id,
            countryCode: countryCode,
            center: GeoPoint(latitude: latitude, longitude: longitude),
            bounds: GeoBounds(south: latitude - 0.1, west: longitude - 0.1, north: latitude + 0.1, east: longitude + 0.1)
        )
    }

    // North America, Oceania and the Middle East as country agents may add them, beside a few cities of Europe.
    private var startCities: [ScooterCity] {
        [
            city("ch:zurich", "CH", 47.3769, 8.5417),
            city("ch:st-gallen", "CH", 47.4245, 9.3767),
            city("fr:Nice", "FR", 43.7031, 7.2661),
            city("ca:on:toronto", "CA", 43.6532, -79.3832),
            city("ca:qc:montreal", "CA", 45.5019, -73.5674),
            city("us:tx:austin", "US", 30.2672, -97.7431),
            city("us:or:portland", "US", 45.5152, -122.6784),
            city("mx:cdmx", "MX", 19.4326, -99.1332),
            city("nz:Auckland", "NZ", -36.8485, 174.7633),
            city("au:Sydney", "AU", -33.8688, 151.2093),
            city("au:Melbourne", "AU", -37.8136, 144.9631),
            city("il:Tel Aviv", "IL", 32.0853, 34.7818),
        ]
    }

    private func startID(_ timeZone: String) -> String? {
        ScooterStartPlace.city(forTimeZone: timeZone, in: startCities)?.id
    }

    func testMapOpensOnTheCoveredCityNearestTheTimeZone() {
        XCTAssertEqual(ScooterStartPlace.city(forTimeZone: "Europe/Berlin")?.id, "de:Berlin")
        XCTAssertEqual(ScooterStartPlace.city(forTimeZone: "Europe/Zurich")?.id, "ch:zurich")
        // Paris itself has no shared scooters: the nearest town that has them.
        XCTAssertEqual(ScooterStartPlace.city(forTimeZone: "Europe/Paris")?.id, "fr:Houilles")
        // An older name the iPhone may still report.
        XCTAssertEqual(ScooterStartPlace.city(forTimeZone: "Europe/Kiev")?.id, "ua:Kyiv")

        XCTAssertEqual(startID("America/Toronto"), "ca:on:toronto")
        XCTAssertEqual(startID("America/Mexico_City"), "mx:cdmx")
        XCTAssertEqual(startID("America/Chicago"), "us:tx:austin")
        XCTAssertEqual(startID("America/Los_Angeles"), "us:or:portland")
        XCTAssertEqual(startID("America/Halifax"), "ca:qc:montreal")
        XCTAssertEqual(startID("America/Montreal"), "ca:on:toronto")
        XCTAssertEqual(startID("US/Central"), "us:tx:austin")

        XCTAssertEqual(startID("Pacific/Auckland"), "nz:Auckland")
        XCTAssertEqual(startID("Asia/Tel_Aviv"), "il:Tel Aviv")
        XCTAssertEqual(startID("Australia/Sydney"), "au:Sydney")
        // Perth has no city of its own: the nearest of Australia's.
        XCTAssertEqual(startID("Australia/Perth"), "au:Melbourne")
        XCTAssertEqual(ScooterStartPlace.country(forTimeZone: "Asia/Dubai"), "AE")
    }

    func testMapCrossesABorderOnlyToACityWithin150Kilometres() {
        XCTAssertEqual(startID("Europe/Monaco"), "fr:Nice")
        XCTAssertEqual(startID("Europe/Vaduz"), "ch:st-gallen")
        XCTAssertNil(startID("Europe/Vienna"))
    }

    func testMapKeepsSwitzerlandForZonesWithNothingNear() {
        // Zones that are no place, and Antarctica's Troll station, far from any covered city.
        for zone in ["UTC", "GMT", "Etc/UTC", "Factory", "Etc/GMT+5", "Antarctica/Troll", ""] {
            XCTAssertNil(ScooterStartPlace.city(forTimeZone: zone), zone)
            let start = ScooterStartPlace.start(forTimeZone: zone)
            XCTAssertEqual(start.zoom, ScooterMapStart.switzerland.zoom, zone)
            XCTAssertEqual(start.center, ScooterMapStart.switzerlandCenter, zone)
        }
        // North America before any of its cities is covered.
        XCTAssertNil(ScooterStartPlace.city(
            forTimeZone: "America/New_York",
            in: startCities.filter { !["CA", "US", "MX"].contains($0.countryCode) }
        ))
    }

    func testTimeZoneTableComesFromANamedReleaseAndItsOlderNamesPointAtListedZones() {
        XCTAssertNotNil(ScooterTimeZones.version.range(of: #"^\d{4}[a-z]$"#, options: .regularExpression))
        XCTAssertEqual(ScooterTimeZones.places["Europe/Oslo"]?.countryCode, "NO")
        XCTAssertEqual(ScooterTimeZones.places["America/Toronto"]?.countryCode, "CA")
        XCTAssertEqual(ScooterTimeZones.places["Pacific/Auckland"]?.countryCode, "NZ")
        XCTAssertEqual(ScooterTimeZones.places["Asia/Tokyo"]?.countryCode, "JP")
        XCTAssertEqual(ScooterTimeZones.aliases["Asia/Tel_Aviv"], "Asia/Jerusalem")
        XCTAssertNil(ScooterTimeZones.places["Etc/UTC"])
        for (alias, zone) in ScooterTimeZones.aliases {
            XCTAssertNotNil(ScooterTimeZones.places[zone], alias)
        }
    }
}

// Spanish as Mexico, the US and the rest of Latin America write it.
extension ScooterModelsTests {
    func testSpanishSaysScooterInLatinAmericaAndTheUS() {
        for region in ["MX", "US", "419", "AR", "CO", "PR"] {
            XCTAssertTrue(ScooterLanguage.es.saysScooter(in: Locale.Region(region)), region)
        }
        XCTAssertFalse(ScooterLanguage.es.saysScooter(in: Locale.Region("ES")))
        XCTAssertFalse(ScooterLanguage.es.saysScooter(in: Locale.Region("CH")))
        XCTAssertFalse(ScooterLanguage.es.saysScooter(in: nil))
        XCTAssertFalse(ScooterLanguage.en.saysScooter(in: Locale.Region("US")))
        XCTAssertFalse(ScooterLanguage.pt.saysScooter(in: Locale.Region("BR")))

        XCTAssertEqual(ScooterLanguage.es.written("Patinete de %@", in: Locale.Region("MX")), "Scooter de %@")
        XCTAssertEqual(ScooterLanguage.es.written("Patinete de %@", in: Locale.Region("ES")), "Patinete de %@")
        XCTAssertEqual(
            ScooterLanguage.es.written("Acerca el mapa para mostrar cada patinete", in: Locale.Region("US")),
            "Acerca el mapa para mostrar cada scooter"
        )
    }

    func testLatinAmericanSpanishLeavesNoPatineteInTheApp() throws {
        let path = try XCTUnwrap(Bundle.main.path(forResource: "Localizable", ofType: "strings", inDirectory: nil, forLocalization: "es"))
        let sentences = try XCTUnwrap(NSDictionary(contentsOfFile: path) as? [String: String])
        let changed = sentences.values.filter { $0.localizedCaseInsensitiveContains("patinete") }
        XCTAssertFalse(changed.isEmpty)
        for sentence in sentences.values {
            let written = ScooterLanguage.es.written(sentence, in: Locale.Region("MX"))
            XCTAssertFalse(written.localizedCaseInsensitiveContains("patinete"), written)
            // Nothing but the word changes.
            XCTAssertEqual(
                written.replacingOccurrences(of: "Scooter", with: "Patinete").replacingOccurrences(of: "scooter", with: "patinete"),
                sentence.replacingOccurrences(of: "Scooter", with: "Patinete").replacingOccurrences(of: "scooter", with: "patinete")
            )
        }
    }
}

// Cities whose scooters stop for the winter, as the catalogs' `seasonal` windows say.
extension ScooterModelsTests {
    private static let winter = ScooterSeasonalPause(from: "11-16", until: "04-15", timeZone: "America/Toronto")
    private static let early = ScooterSeasonalPause(from: "12-01", until: "04-01", timeZone: "America/Toronto")
    // Bird stops in Montréal on 16 November, Lime on 1 December; Lime runs in Laval all year.
    private static let quebec = [
        ScooterCity(
            id: "ca:Montréal", name: "Montréal", countryCode: "CA", center: GeoPoint(latitude: 45.5, longitude: -73.57),
            bounds: GeoBounds(south: 45.41, west: -73.98, north: 45.7, east: -73.47), pauses: [winter, early]
        ),
        ScooterCity(
            id: "ca:Laval", name: "Laval", countryCode: "CA", center: GeoPoint(latitude: 45.58, longitude: -73.75),
            bounds: GeoBounds(south: 45.52, west: -73.89, north: 45.7, east: -73.52)
        ),
    ]

    func testASeasonalPauseHoldsInItsTimeZoneAcrossTheNewYear() throws {
        let iso = ISO8601DateFormatter()
        func at(_ string: String) throws -> Date { try XCTUnwrap(iso.date(from: string)) }
        let winter = Self.winter
        // Midnight in Montréal is 05:00 UTC in November, 04:00 in April.
        XCTAssertFalse(winter.holds(on: try at("2026-11-16T04:59:00Z")))
        XCTAssertTrue(winter.holds(on: try at("2026-11-16T05:00:00Z")))
        XCTAssertTrue(winter.holds(on: try at("2027-01-20T17:00:00Z")))
        XCTAssertTrue(winter.holds(on: try at("2027-04-15T03:59:00Z")))
        XCTAssertFalse(winter.holds(on: try at("2027-04-15T04:00:00Z")))
        XCTAssertFalse(winter.holds(on: try at("2026-07-20T16:00:00Z")))
        let summer = ScooterSeasonalPause(from: "06-01", until: "09-01", timeZone: "Europe/Oslo")
        XCTAssertTrue(summer.holds(on: try at("2026-07-20T16:00:00Z")))
        XCTAssertFalse(summer.holds(on: try at("2027-01-20T17:00:00Z")))

        // Back with the soonest of the pauses, once every one holds.
        let january = try at("2027-01-20T17:00:00Z")
        XCTAssertEqual(ScooterSeasonalPause.back([winter, Self.early], on: january), .month(4))
        XCTAssertEqual(
            ScooterSeasonalPause.back(
                [winter, ScooterSeasonalPause(from: "12-01", until: "03-10", timeZone: "America/Toronto")], on: january
            ),
            .month(3)
        )
        XCTAssertNil(ScooterSeasonalPause.back([winter, Self.early], on: try at("2026-11-20T17:00:00Z")))
        XCTAssertNil(ScooterSeasonalPause.back([], on: january))
    }

    func testTheDockSaysWhenTheScootersOfACityInItsPauseAreBack() throws {
        defer { ScooterLanguage.current = .atLaunch }
        let iso = ISO8601DateFormatter()
        func at(_ string: String) throws -> Date { try XCTUnwrap(iso.date(from: string)) }
        let montreal = GeoPoint(latitude: 45.5, longitude: -73.57)
        let january = try at("2027-01-20T17:00:00Z")

        let season = try XCTUnwrap(ScooterSeasonalPause.active(at: montreal, on: january, among: Self.quebec))
        XCTAssertEqual(season, ScooterSeasonalPause.Active(city: "Montréal", back: .month(4)))
        // Lime runs until December, Laval all year, and Laval's bounds take in the north of Montréal.
        XCTAssertNil(ScooterSeasonalPause.active(at: montreal, on: try at("2026-11-20T17:00:00Z"), among: Self.quebec))
        XCTAssertNil(ScooterSeasonalPause.active(at: montreal, on: try at("2026-07-20T16:00:00Z"), among: Self.quebec))
        XCTAssertNil(ScooterSeasonalPause.active(at: GeoPoint(latitude: 45.65, longitude: -73.6), on: january, among: Self.quebec))
        // Of the catalogs' cities, Tignes pauses from 8 September until 22 June, Trondheim from
        // 2 December until 15 March, Porsgrunn and Skien from 15 December until the streets are
        // clear, Tromsø from 2 November until 1 May, Lillestrøm and Lørenskog from 1 December until
        // 1 March, Bodø from 1 December until 1 April, Dalvík from 21 October and Leduc from
        // 22 October until 1 May, and Ottawa from 16 November until 30 April, each by its own clock.
        XCTAssertEqual(ScooterCityCatalog.cities.filter { !$0.pauses.isEmpty }.map(\.id),
                       ["fr:Tignes", "no:Trondheim", "no:Bodø", "no:Lillestrøm", "no:Lørenskog", "no:Porsgrunn", "no:Skien", "no:Tromsø",
                        "is:Dalvík", "ca:ab:Leduc", "ca:on:Ottawa"])
        let tignes = GeoPoint(latitude: 45.4687, longitude: 6.9063)
        XCTAssertEqual(ScooterSeasonalPause.active(at: tignes, on: january), ScooterSeasonalPause.Active(city: "Tignes", back: .month(6)))
        XCTAssertNil(ScooterSeasonalPause.active(at: tignes, on: try at("2026-09-07T21:30:00Z")))
        XCTAssertNotNil(ScooterSeasonalPause.active(at: tignes, on: try at("2026-09-07T22:30:00Z")))
        XCTAssertNil(ScooterSeasonalPause.active(at: tignes, on: try at("2027-06-22T12:00:00Z")))
        let ottawa = GeoPoint(latitude: 45.4215, longitude: -75.6972)
        XCTAssertEqual(ScooterSeasonalPause.active(at: ottawa, on: january), ScooterSeasonalPause.Active(city: "Ottawa, ON", back: .month(4)))
        XCTAssertNil(ScooterSeasonalPause.active(at: ottawa, on: try at("2026-11-16T04:30:00Z")))
        XCTAssertNotNil(ScooterSeasonalPause.active(at: ottawa, on: try at("2026-11-16T05:30:00Z")))
        XCTAssertNil(ScooterSeasonalPause.active(at: ottawa, on: try at("2027-04-30T12:00:00Z")))
        // Iceland keeps UTC all year; Leduc is six hours behind it in October.
        let dalvik = GeoPoint(latitude: 65.9711, longitude: -18.5304)
        XCTAssertEqual(ScooterSeasonalPause.active(at: dalvik, on: january), ScooterSeasonalPause.Active(city: "Dalvík", back: .month(5)))
        XCTAssertNil(ScooterSeasonalPause.active(at: dalvik, on: try at("2026-10-20T23:30:00Z")))
        XCTAssertNotNil(ScooterSeasonalPause.active(at: dalvik, on: try at("2026-10-21T00:30:00Z")))
        let leduc = GeoPoint(latitude: 53.2645, longitude: -113.5593)
        XCTAssertEqual(ScooterSeasonalPause.active(at: leduc, on: january), ScooterSeasonalPause.Active(city: "Leduc, AB", back: .month(5)))
        XCTAssertNil(ScooterSeasonalPause.active(at: leduc, on: try at("2026-10-22T05:30:00Z")))
        XCTAssertNotNil(ScooterSeasonalPause.active(at: leduc, on: try at("2026-10-22T06:30:00Z")))
        XCTAssertNil(ScooterSeasonalPause.active(at: leduc, on: try at("2027-05-01T18:00:00Z")))
        // Bodø keeps Oslo's clock, one hour ahead of UTC in winter.
        let bodo = GeoPoint(latitude: 67.2804, longitude: 14.4049)
        XCTAssertEqual(ScooterSeasonalPause.active(at: bodo, on: january), ScooterSeasonalPause.Active(city: "Bodø", back: .month(4)))
        XCTAssertNil(ScooterSeasonalPause.active(at: bodo, on: try at("2026-11-30T22:30:00Z")))
        XCTAssertNotNil(ScooterSeasonalPause.active(at: bodo, on: try at("2026-11-30T23:30:00Z")))
        XCTAssertNil(ScooterSeasonalPause.active(at: bodo, on: try at("2027-04-01T12:00:00Z")))

        // After a night ban, before providers down, with a calendar, calm.
        XCTAssertEqual(
            ScooterDockNotice.notices(
                season: season,
                health: ScooterProviderHealth(downProviders: [.lime], hasUnknownFailures: false),
                metadata: ScooterResponseMetadata(partial: true, failedSources: ["canada:lime_quebec"]),
                shownCount: 0
            ),
            [.season(season), .providersDown([.lime])]
        )
        XCTAssertEqual(ScooterDockNotice.season(season).systemImage, "calendar")
        XCTAssertTrue(ScooterDockNotice.season(season).isCalm)
        XCTAssertFalse(ScooterDockNotice.parkingUnavailable.isCalm)

        let sentences: [ScooterLanguage: String] = [
            .en: "Off season in Montréal: scooters are back in April",
            .de: "Saisonpause in Montréal: Scooter wieder im April",
            .fr: "Pause saisonnière à Montréal : retour des trottinettes en avril",
            .it: "Pausa stagionale a Montréal: monopattini di nuovo in aprile",
            .nl: "Seizoenspauze in Montréal: deelsteps weer in april",
            .nb: "Sesongpause i Montréal: elsparkesykler igjen i april",
            .pt: "Pausa sazonal em Montréal: trotinetes de volta em abril",
            .es: "Pausa de temporada en Montréal: los patinetes vuelven en abril",
            .is: "Montréal: árstíðabundið hlé, rafskúturnar koma aftur í apríl",
        ]
        XCTAssertEqual(Set(sentences.keys), Set(ScooterLanguage.allCases))
        for (language, sentence) in sentences {
            ScooterLanguage.current = language
            // Spanish says scooter where the iPhone's region is in Latin America or the US.
            XCTAssertEqual(ScooterDockNotice.season(season).text, language.written(sentence, in: language.locale.region), language.rawValue)
        }
    }

    func testAPauseUntilTheStreetsAreClearHoldsUntilMayAtTheLatestAndComesBackEachWinter() throws {
        let iso = ISO8601DateFormatter()
        func at(_ string: String) throws -> Date { try XCTUnwrap(iso.date(from: string)) }
        // Skien's: from 15 December, back once the streets are clear of snow and ice.
        let clear = ScooterSeasonalPause(from: "12-15", until: "clear", timeZone: "Europe/Oslo")
        // Midnight in Oslo is 23:00 UTC in December, 22:00 in April.
        XCTAssertFalse(clear.holds(on: try at("2026-12-14T22:59:00Z")))
        XCTAssertTrue(clear.holds(on: try at("2026-12-14T23:00:00Z")))
        XCTAssertTrue(clear.holds(on: try at("2027-03-20T12:00:00Z")))
        XCTAssertTrue(clear.holds(on: try at("2027-04-30T21:59:00Z")))
        XCTAssertFalse(clear.holds(on: try at("2027-04-30T22:00:00Z")))
        XCTAssertFalse(clear.holds(on: try at("2027-10-18T12:00:00Z")))
        XCTAssertTrue(clear.holds(on: try at("2027-12-15T12:00:00Z")))

        // It says since when rather than a month, and goes first, as it may end any day.
        let january = try at("2027-01-20T12:00:00Z")
        let trondheim = ScooterSeasonalPause(from: "12-02", until: "03-15", timeZone: "Europe/Oslo")
        XCTAssertEqual(ScooterSeasonalPause.back([clear], on: january), .clear(from: "12-15"))
        XCTAssertEqual(ScooterSeasonalPause.back([trondheim, clear], on: january), .clear(from: "12-15"))
        XCTAssertNil(ScooterSeasonalPause.back([trondheim, clear], on: try at("2026-12-10T12:00:00Z")))

        // Skien and Porsgrunn in the catalog, the latter reached by both of Ryde's feeds.
        let skien = GeoPoint(latitude: 59.2075, longitude: 9.6107)
        let porsgrunn = GeoPoint(latitude: 59.1411, longitude: 9.6555)
        XCTAssertNil(ScooterSeasonalPause.active(at: skien, on: try at("2026-12-14T22:30:00Z")))
        XCTAssertEqual(ScooterSeasonalPause.active(at: skien, on: try at("2026-12-14T23:30:00Z")),
                       ScooterSeasonalPause.Active(city: "Skien", back: .clear(from: "12-15")))
        XCTAssertEqual(ScooterSeasonalPause.active(at: porsgrunn, on: try at("2027-03-20T12:00:00Z")),
                       ScooterSeasonalPause.Active(city: "Porsgrunn", back: .clear(from: "12-15")))
        XCTAssertNotNil(ScooterSeasonalPause.active(at: porsgrunn, on: try at("2027-04-30T21:30:00Z")))
        XCTAssertNil(ScooterSeasonalPause.active(at: porsgrunn, on: try at("2027-04-30T22:30:00Z")))
        XCTAssertNotNil(ScooterSeasonalPause.active(at: skien, on: try at("2027-12-15T12:00:00Z")))
    }

    func testThePauseUntilTheStreetsAreClearGivesWayOnceScootersAreInView() throws {
        defer { ScooterLanguage.current = .atLaunch }
        let season = ScooterSeasonalPause.Active(city: "Skien", back: .clear(from: "12-15"))
        let metadata = ScooterResponseMetadata(partial: false, failedSources: [])
        XCTAssertEqual(ScooterDockNotice.notices(season: season, health: .healthy, metadata: metadata, shownCount: 0),
                       [.season(season)])
        // Ryde back in March: the notice gives way.
        XCTAssertEqual(
            ScooterDockNotice.notices(season: season, scootersInView: true, health: .healthy, metadata: metadata, shownCount: 12),
            []
        )
        // A pause with a set end stays, as the town's rule.
        let montreal = ScooterSeasonalPause.Active(city: "Montréal", back: .month(4))
        XCTAssertEqual(
            ScooterDockNotice.notices(season: montreal, scootersInView: true, health: .healthy, metadata: metadata, shownCount: 1),
            [.season(montreal)]
        )

        // The day as the language and the region write it.
        XCTAssertEqual(ScooterSeasonalPause.dayName("12-15", locale: Locale(identifier: "en_GB")), "15 December")
        XCTAssertEqual(ScooterSeasonalPause.dayName("12-15", locale: Locale(identifier: "en_US")), "December 15")
        let english = ScooterSeasonalPause.dayName("12-15", locale: ScooterLanguage.en.locale)
        let sentences: [ScooterLanguage: String] = [
            .en: "Off season in Skien: from \(english) until the streets are clear",
            .de: "Saisonpause in Skien: ab 15. Dezember, bis die Strassen schnee- und eisfrei sind",
            .fr: "Pause saisonnière à Skien : dès le 15 décembre, jusqu’à ce que les rues soient dégagées",
            .it: "Pausa stagionale a Skien: dal 15 dicembre finché le strade non saranno libere da neve e ghiaccio",
            .nl: "Seizoenspauze in Skien: vanaf 15 december tot de straten sneeuw- en ijsvrij zijn",
            .nb: "Sesongpause i Skien: fra 15. desember til det er snø- og isfritt",
            .pt: "Pausa sazonal em Skien: a partir de 15 de dezembro, até as ruas estarem livres de neve e gelo",
            .es: "Pausa de temporada en Skien: desde el 15 de diciembre hasta que las calles estén libres de nieve y hielo",
            .is: "Skien: árstíðabundið hlé frá 15. desember þar til göturnar verða auðar",
        ]
        XCTAssertEqual(Set(sentences.keys), Set(ScooterLanguage.allCases))
        for (language, sentence) in sentences {
            ScooterLanguage.current = language
            XCTAssertEqual(ScooterDockNotice.season(season).text, sentence, language.rawValue)
        }
    }
}
