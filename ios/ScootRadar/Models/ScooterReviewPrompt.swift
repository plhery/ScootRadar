import Foundation

/// When the app asks for a rating with the system's prompt, which StoreKit shows at most three times a year and
/// never in TestFlight: when the rider is back from the operator's app 5 minutes to 2 hours after "Open in", the end
/// of a ride, and the map shows a healthy feed. Only from the third day with a fresh feed, once per version of the
/// app, a month after the last ask at the soonest, and never on a day the feed or the rider's place had a problem.
/// The days are counted on this device, in its time zone.
struct ScooterReviewPrompt {
    /// Days with a fresh feed before the first ask.
    static let days = 3
    /// Days from one ask to the next, whatever the version.
    static let gap = 30
    /// How long after "Open in" a return is the end of a ride: sooner, the rental mostly did not happen; later, it
    /// is another trip.
    static let rentalReturn: ClosedRange<TimeInterval> = 5 * 60 ... 2 * 3_600
    /// How long the map rests with nothing over it before the ask.
    static let settle: Duration = .seconds(5)

    let defaults: UserDefaults
    /// `CFBundleShortVersionString`: each version asks once.
    let version: String
    var timeZone: TimeZone = .autoupdatingCurrent
    #if DEBUG
    /// `-ReviewPromptDue YES` (debug builds only): every calm moment is the one to ask, so that a simulator shows
    /// Apple's sheet, which development builds always show.
    var alwaysDue = false
    #endif

    private static let daysKey = "review-use-days"
    private static let lastDayKey = "review-last-use-day"
    private static let badDayKey = "review-bad-day"
    private static let askedKey = "review-asked-version"
    private static let askedDayKey = "review-asked-day"
    private static let rentalOpenedKey = "review-rental-opened-at"

    /// A fresh feed at `date`: its calendar day counts as a day with use, once.
    func noteUse(at date: Date) {
        let day = day(of: date)
        guard defaults.object(forKey: Self.lastDayKey) as? Int != day else { return }
        defaults.set(day, forKey: Self.lastDayKey)
        defaults.set(defaults.integer(forKey: Self.daysKey) + 1, forKey: Self.daysKey)
    }

    /// Something went wrong at `date`: nothing asks for the rest of that day.
    func noteBadMoment(at date: Date) {
        defaults.set(day(of: date), forKey: Self.badDayKey)
    }

    /// True when a moment at `date` is the one to ask: `calm`, from the third day with a fresh feed, on a day with
    /// nothing wrong, for a version that has not asked, a month after the last ask. Nothing is asked until `asked`.
    func isDue(at date: Date, calm: Bool) -> Bool {
        #if DEBUG
        if alwaysDue { return calm }
        #endif
        let day = day(of: date)
        guard calm, defaults.integer(forKey: Self.daysKey) >= Self.days,
              defaults.object(forKey: Self.badDayKey) as? Int != day,
              defaults.string(forKey: Self.askedKey) != version else { return false }
        if let askedDay = defaults.object(forKey: Self.askedDayKey) as? Int, day - askedDay < Self.gap { return false }
        return true
    }

    /// The app asked at `date`: this version asks no more, and the next one waits for the gap.
    func asked(at date: Date) {
        defaults.set(version, forKey: Self.askedKey)
        defaults.set(day(of: date), forKey: Self.askedDayKey)
    }

    /// "Open in" took the rider to the operator's app at `date`. Kept on disk: iOS may close the app meanwhile.
    func noteRentalOpened(at date: Date) {
        defaults.set(date, forKey: Self.rentalOpenedKey)
    }

    /// The app is in front again at `date`: true when this is the end of a ride, 5 minutes to 2 hours after
    /// "Open in". Each return is one try, so the time of the tap goes, whatever the answer.
    func takeRentalReturn(at date: Date) -> Bool {
        guard let opened = defaults.object(forKey: Self.rentalOpenedKey) as? Date else { return false }
        defaults.removeObject(forKey: Self.rentalOpenedKey)
        return Self.rentalReturn.contains(date.timeIntervalSince(opened))
    }

    /// The calendar day of `date` in the rider's time zone, as days since 1970.
    private func day(of date: Date) -> Int {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        let parts = calendar.dateComponents([.year, .month, .day], from: date)
        calendar.timeZone = .gmt
        let midnight = calendar.date(from: parts) ?? date
        return Int((midnight.timeIntervalSince1970 / 86_400).rounded(.down))
    }
}
