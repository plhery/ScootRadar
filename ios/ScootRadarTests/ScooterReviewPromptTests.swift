import Foundation
import XCTest
@testable import ScootRadar

/// When the app asks for a rating: on a calm return from a ride, from the third day with a fresh feed, never on a
/// day something went wrong, once per version and a month apart at the soonest.
final class ScooterReviewPromptTests: XCTestCase {
    /// 09:00 UTC: the hours added below stay on the same day.
    private let start = ISO8601DateFormatter().date(from: "2026-10-01T09:00:00Z")!

    /// A store of its own, so that the tests write nothing to the app's.
    private func withDefaults(_ body: (UserDefaults) throws -> Void) rethrows {
        let name = "ScooterReviewPromptTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: name)!
        defer { defaults.removePersistentDomain(forName: name) }
        try body(defaults)
    }

    private func prompt(_ defaults: UserDefaults, version: String = "1.0.1") -> ScooterReviewPrompt {
        ScooterReviewPrompt(defaults: defaults, version: version, timeZone: .gmt)
    }

    private func day(_ days: Int, hours: Double = 0) -> Date {
        start.addingTimeInterval(Double(days) * 86_400 + hours * 3_600)
    }

    /// A fresh feed at `date`, then whether a calm moment then is the one to ask.
    private func isDue(_ prompt: ScooterReviewPrompt, on date: Date, calm: Bool = true) -> Bool {
        prompt.noteUse(at: date)
        return prompt.isDue(at: date, calm: calm)
    }

    func testAsksOnTheThirdDayWithAFreshFeedThenNotAgain() {
        withDefaults { defaults in
            let prompt = prompt(defaults)
            XCTAssertFalse(isDue(prompt, on: day(0)))
            // Days without a fresh feed do not count.
            XCTAssertFalse(isDue(prompt, on: day(4)))
            XCTAssertTrue(isDue(prompt, on: day(9)))
            prompt.asked(at: day(9))
            XCTAssertFalse(isDue(prompt, on: day(10)))
            XCTAssertFalse(isDue(prompt, on: day(90)))
        }
    }

    func testStaysDueUntilTheAppAsks() {
        withDefaults { defaults in
            let prompt = prompt(defaults)
            XCTAssertFalse(isDue(prompt, on: day(0)))
            XCTAssertFalse(isDue(prompt, on: day(1)))
            XCTAssertTrue(isDue(prompt, on: day(2)))
            XCTAssertTrue(isDue(prompt, on: day(2, hours: 1)))
            prompt.asked(at: day(2, hours: 1))
            XCTAssertFalse(isDue(prompt, on: day(2, hours: 2)))
        }
    }

    func testCountsTheRidersOwnDays() {
        withDefaults { defaults in
            let zurich = ScooterReviewPrompt(
                defaults: defaults, version: "1.0.1", timeZone: TimeZone(identifier: "Europe/Zurich")!
            )
            func at(_ text: String) -> Date { ISO8601DateFormatter().date(from: text)! }
            // 23:30 and 00:30 in Zürich: two days there, one in UTC.
            XCTAssertFalse(isDue(zurich, on: at("2026-10-01T21:30:00Z")))
            XCTAssertFalse(isDue(zurich, on: at("2026-10-01T22:30:00Z")))
            // The afternoon of that second day: it counts once.
            XCTAssertFalse(isDue(zurich, on: at("2026-10-02T12:00:00Z")))
            // 00:30 in Zürich: the third day there, still the second in UTC.
            XCTAssertTrue(isDue(zurich, on: at("2026-10-02T22:30:00Z")))
            zurich.asked(at: at("2026-10-02T22:30:00Z"))
            // The next version counts the month in Zürich's days too, winter time by then.
            let next = ScooterReviewPrompt(
                defaults: defaults, version: "1.0.2", timeZone: TimeZone(identifier: "Europe/Zurich")!
            )
            XCTAssertFalse(isDue(next, on: at("2026-11-01T22:30:00Z")))
            XCTAssertTrue(isDue(next, on: at("2026-11-01T23:30:00Z")))
        }
    }

    func testWaitsForACalmMoment() {
        withDefaults { defaults in
            let prompt = prompt(defaults)
            XCTAssertFalse(isDue(prompt, on: day(0)))
            XCTAssertFalse(isDue(prompt, on: day(1)))
            XCTAssertFalse(isDue(prompt, on: day(2), calm: false))
            XCTAssertTrue(isDue(prompt, on: day(2, hours: 2)))
        }
    }

    func testEachVersionAsksOnceAMonthAfterTheLastAsk() {
        withDefaults { defaults in
            let first = prompt(defaults, version: "1.0.1")
            XCTAssertFalse(isDue(first, on: day(0)))
            XCTAssertFalse(isDue(first, on: day(1)))
            XCTAssertTrue(isDue(first, on: day(2)))
            first.asked(at: day(2))

            // A new version the next day waits for the month to pass.
            let next = prompt(defaults, version: "1.1")
            XCTAssertFalse(isDue(next, on: day(3)))
            XCTAssertFalse(isDue(next, on: day(2 + ScooterReviewPrompt.gap - 1)))
            XCTAssertTrue(isDue(next, on: day(2 + ScooterReviewPrompt.gap)))
            next.asked(at: day(2 + ScooterReviewPrompt.gap))
            XCTAssertFalse(isDue(next, on: day(2 + 3 * ScooterReviewPrompt.gap)))
        }
    }

    func testABadMomentKeepsTheRestOfTheDayFromAsking() {
        withDefaults { defaults in
            let prompt = prompt(defaults)
            XCTAssertFalse(isDue(prompt, on: day(0)))
            XCTAssertFalse(isDue(prompt, on: day(1)))
            // A failed refresh in the morning: the calm evening asks nothing.
            prompt.noteBadMoment(at: day(2, hours: 1))
            XCTAssertFalse(isDue(prompt, on: day(2, hours: 2)))
            XCTAssertFalse(isDue(prompt, on: day(2, hours: 12)))
            // The bad day still counted as a day with use, and the next one asks.
            XCTAssertTrue(isDue(prompt, on: day(3)))
        }
    }

    func testOnlyAReturnFiveMinutesToTwoHoursAfterOpenInIsTheEndOfARide() {
        withDefaults { defaults in
            let prompt = prompt(defaults)
            // Nothing was opened.
            XCTAssertFalse(prompt.takeRentalReturn(at: start))

            // Back within minutes: the rental mostly did not happen, and the tap is used up.
            prompt.noteRentalOpened(at: start)
            XCTAssertFalse(prompt.takeRentalReturn(at: start.addingTimeInterval(4 * 60 + 59)))
            XCTAssertFalse(prompt.takeRentalReturn(at: start.addingTimeInterval(20 * 60)))

            for minutes in [5.0, 20, 120] {
                prompt.noteRentalOpened(at: start)
                XCTAssertTrue(prompt.takeRentalReturn(at: start.addingTimeInterval(minutes * 60)), "\(minutes) min")
                // One try per return.
                XCTAssertFalse(prompt.takeRentalReturn(at: start.addingTimeInterval(minutes * 60 + 1)))
            }

            // Later, it is another trip.
            prompt.noteRentalOpened(at: start)
            XCTAssertFalse(prompt.takeRentalReturn(at: start.addingTimeInterval(2 * 3_600 + 1)))

            // The last tap is the one that counts, and it survives the app being closed.
            prompt.noteRentalOpened(at: start)
            prompt.noteRentalOpened(at: start.addingTimeInterval(30 * 60))
            let reopened = ScooterReviewPrompt(defaults: defaults, version: "1.0.1", timeZone: .gmt)
            XCTAssertFalse(reopened.takeRentalReturn(at: start.addingTimeInterval(33 * 60)))
            prompt.noteRentalOpened(at: start.addingTimeInterval(30 * 60))
            XCTAssertTrue(reopened.takeRentalReturn(at: start.addingTimeInterval(40 * 60)))
        }
    }
}
