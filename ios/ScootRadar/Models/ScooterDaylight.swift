import Foundation

/// Day and night at a place, for the Automatic appearance: dark from half an
/// hour after sunset to half an hour before sunrise, when the sky has gone
/// dark too. Sunrise and sunset come from the sunrise equation
/// (en.wikipedia.org/wiki/Sunrise_equation), right to a minute or two, which
/// is all a change of colours needs. Nothing leaves the iPhone.
enum ScooterDaylight {
    /// How long after sunset the app turns dark, and before sunrise light.
    static let twilight: TimeInterval = 30 * 60

    /// Dark all day in a polar night, and never under the midnight sun.
    static func isDark(at date: Date, in place: GeoPoint) -> Bool {
        let day = solarDay(near: date)
        return !(day - 1 ... day + 1).contains { lightHours(onSolarDay: $0, at: place)?.contains(date) == true }
    }

    /// Light from half an hour before sunrise to half an hour after sunset;
    /// all of the day under the midnight sun, and none of it in a polar night.
    static func lightHours(onSolarDay day: Int, at place: GeoPoint) -> ClosedRange<Date>? {
        let sun = passage(onSolarDay: day, at: place)
        guard sun.hourAngle > 0 else { return nil }
        // Half a turn is the whole day around the sun's highest.
        let halfDay = min(sun.hourAngle, 180) / 360
        return date(julianDay: sun.transit - halfDay).addingTimeInterval(-twilight)
            ... date(julianDay: sun.transit + halfDay).addingTimeInterval(twilight)
    }

    /// When the sun is highest on a day, as a Julian day, and how far it turns
    /// from rising to then, in degrees: 0 when it stays under the horizon all
    /// day, more than 180 when it stays above it.
    private static func passage(onSolarDay day: Int, at place: GeoPoint) -> (transit: Double, hourAngle: Double) {
        let meanNoon = Double(day) - place.longitude / 360
        let anomaly = (357.5291 + 0.98560028 * meanNoon).truncatingRemainder(dividingBy: 360)
        let centre = 1.9148 * sine(anomaly) + 0.0200 * sine(2 * anomaly) + 0.0003 * sine(3 * anomaly)
        let longitude = (anomaly + centre + 180 + 102.9372).truncatingRemainder(dividingBy: 360)
        let transit = j2000 + meanNoon + 0.0053 * sine(anomaly) - 0.0069 * sine(2 * longitude)
        let declination = asin(sine(longitude) * sine(23.4397))
        // The sun's top on the horizon, as refraction raises it.
        let cosHourAngle = (sine(-0.833) - sine(place.latitude) * sin(declination))
            / (cos(place.latitude * .pi / 180) * cos(declination))
        if cosHourAngle >= 1 { return (transit, 0) }
        if cosHourAngle <= -1 { return (transit, 360) }
        return (transit, acos(cosHourAngle) * 180 / .pi)
    }

    /// The day since 1 January 2000 whose noon at Greenwich is the first after the date.
    private static func solarDay(near date: Date) -> Int {
        Int((julianDay(date) - j2000 + 0.0008).rounded(.up))
    }

    /// Noon at Greenwich on 1 January 2000.
    private static let j2000 = 2_451_545.0
    /// Midnight at Greenwich on 1 January 1970.
    private static let unixEpoch = 2_440_587.5

    private static func julianDay(_ date: Date) -> Double {
        date.timeIntervalSince1970 / 86_400 + unixEpoch
    }

    private static func date(julianDay: Double) -> Date {
        Date(timeIntervalSince1970: (julianDay - unixEpoch) * 86_400)
    }

    private static func sine(_ degrees: Double) -> Double {
        sin(degrees * .pi / 180)
    }
}
