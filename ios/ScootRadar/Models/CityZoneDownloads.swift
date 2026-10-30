import CryptoKit
import Foundation

/// A city whose zones the app downloads rather than has built in (docs/city-zone-downloads.md): as the
/// index at /zones/v1/index.json lists it, or as data/city-zones.json had it when the app was built.
struct CityZoneDownload: Equatable, Sendable, Identifiable {
    let id: String
    /// "Berlin", as the legend names it while its zones are not drawn.
    let place: String
    /// Who sets its zones, as the legend names them.
    let authority: String
    let timeZone: String
    /// Where they say so.
    let source: URL
    /// Around all its zones.
    let bounds: GeoBounds
    /// The SHA-256 of its file, in hex: nil in the list built into the app, which vouches for no file.
    var sha256: String?

    /// The name of its file under /zones/v1/.
    var fileName: String { "\(id).json" }
}

/// The cities to download, as /zones/v1/index.json lists them.
struct CityZoneIndex: Equatable, Sendable {
    /// The format this app reads, that of /zones/v1/.
    static let format = 1
    static let fileName = "index.json"

    let cities: [CityZoneDownload]
}

enum CityZoneDownloadError: Error, Equatable {
    /// An index of a format this app does not read.
    case format
    /// A file that is not the one the index vouches for: of another deploy, cut short or changed on the way.
    case mismatch
}

extension CityZoneIndex {
    /// A city this version cannot read is left out; an index of another format is none.
    init(data: Data) throws {
        struct Payload: Decodable {
            struct City: Decodable {
                struct Source: Decodable { let url: String }
                struct Bounds: Decodable { let south, west, north, east: Double }
                let id: String
                let place: String
                let authority: String
                let timeZone: String
                let source: Source
                let bounds: Bounds
                let sha256: String
            }

            let format: Int
            let cities: [Lossy<City>]
        }
        let payload = try JSONDecoder().decode(Payload.self, from: data)
        guard payload.format == Self.format else { throw CityZoneDownloadError.format }
        cities = payload.cities.compactMap { entry in
            guard let city = entry.value, let source = URL(string: city.source.url), source.scheme == "https",
                  city.id.allSatisfy({ $0.isASCII && $0.isLowercase }), !city.id.isEmpty else { return nil }
            return CityZoneDownload(
                id: city.id, place: city.place, authority: city.authority, timeZone: city.timeZone, source: source,
                bounds: GeoBounds(south: city.bounds.south, west: city.bounds.west, north: city.bounds.north, east: city.bounds.east),
                sha256: city.sha256.lowercased()
            )
        }
    }
}

/// A value decoded if it can be, nil if not.
private struct Lossy<Value: Decodable>: Decodable {
    let value: Value?

    init(from decoder: any Decoder) throws {
        value = try? Value(from: decoder)
    }
}

/// A city's file, /zones/v1/<id>.json: its id, and its zones, each one ring as latitude, longitude, latitude…
enum CityZoneFile {
    /// Its zones, each in force always and credited to the city; a zone of a kind added later is left out, as
    /// is a ring of fewer than three points.
    static func zones(of city: CityZoneDownload, from data: Data) throws -> [CityRuleZone] {
        struct Payload: Decodable {
            struct Zone: Decodable {
                let id: String
                let kind: String
                let ring: [Double]
            }

            let id: String
            let zones: [Zone]
        }
        let payload = try JSONDecoder().decode(Payload.self, from: data)
        guard payload.id == city.id else { throw CityZoneDownloadError.mismatch }
        return payload.zones.compactMap { zone in
            guard let kind = ScooterZoneKind(rawValue: zone.kind), zone.ring.count >= 6, zone.ring.count.isMultiple(of: 2) else {
                return nil
            }
            return CityRuleZone(
                id: zone.id, authority: city.authority, timeZone: city.timeZone, kind: kind, source: city.source,
                ring: stride(from: 0, to: zone.ring.count, by: 2).map { GeoPoint(latitude: zone.ring[$0], longitude: zone.ring[$0 + 1]) }
            )
        }
    }

    /// The SHA-256 of the data, in hex, as the index gives it.
    static func digest(_ data: Data) -> String {
        SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
    }
}

/// The index and the cities' files as last downloaded, in a directory of the app's caches, which iOS does not
/// back up and may empty when space runs short: they are then downloaded again. When a file was last saved,
/// or the index last confirmed, is its modification date.
struct CityZoneCache: Sendable {
    let directory: URL

    /// Library/Caches/CityZones/v1.
    static let standard: CityZoneCache? = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first.map {
        CityZoneCache(directory: $0.appending(path: "CityZones/v1", directoryHint: .isDirectory))
    }

    func read(_ name: String) -> (data: Data, savedAt: Date)? {
        let url = directory.appending(path: name)
        guard let data = try? Data(contentsOf: url),
              let savedAt = (try? FileManager.default.attributesOfItem(atPath: url.path))?[.modificationDate] as? Date else {
            return nil
        }
        return (data, savedAt)
    }

    func write(_ name: String, _ data: Data, at date: Date) {
        let url = directory.appending(path: name)
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            try data.write(to: url, options: .atomic)
            try FileManager.default.setAttributes([.modificationDate: date], ofItemAtPath: url.path)
        } catch {
            // Not kept: downloaded again when next needed.
        }
    }

    /// Deletes every file but those named.
    func keepOnly(_ names: Set<String>) {
        let files = (try? FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil)) ?? []
        for file in files where !names.contains(file.lastPathComponent) {
            try? FileManager.default.removeItem(at: file)
        }
    }
}

/// The zones of the cities the app downloads (docs/city-zone-downloads.md): the index of them, asked for
/// every 6 hours while views from zoom 14 are shown, and the file of each city such a view reaches, checked
/// against the index and kept on the device. A rider never sees a wrong rule because a file is missing or
/// stale: a city whose file of the index's version is not here, or whose index was not confirmed in the last
/// 7 days, has nothing drawn, and a notice says its zones are loading or unavailable.
@MainActor
final class CityZoneDownloads {
    /// How long the index serves before it is asked for again.
    static let indexRefresh: TimeInterval = 6 * 3600
    /// How long an index that could not be confirmed again still vouches for the files on the device.
    static let indexLifetime: TimeInterval = 7 * 24 * 3600
    /// How long after a failure the same is asked for again.
    static let retryAfter: TimeInterval = 30

    /// What the legend says of a city over the map whose zones are not drawn.
    struct Notice: Equatable, Sendable {
        enum State: Equatable, Sendable {
            case loading
            case unavailable
        }

        let city: CityZoneDownload
        let state: State
    }

    /// Told when the index or a city's file has come, or failed to, for the map to draw what is new.
    var onChange: (() -> Void)?

    private let api: any ScooterAPIClient
    private let cache: CityZoneCache?
    private let clock: () -> Date
    /// The download cities of the app's build, until an index has come.
    private let builtInDownloads: [CityZoneDownload]
    /// The cities whose zones are built into the app.
    private let builtInZones: Set<String>

    private var index: CityZoneIndex?
    private var indexConfirmedAt: Date?
    private var indexTask: Task<Void, Never>?
    private var indexFailedAt: Date?
    /// A file did not match the index: another deploy has published since, and the index is asked for again.
    private var indexOutdated = false
    /// Each city's zones read so far, with the version they are.
    private var loaded: [String: (sha256: String, zones: [CityRuleZone])] = [:]
    private var downloads: [String: Task<Void, Never>] = [:]
    private var failedAt: [String: Date] = [:]
    /// The latest area asked for, whose cities' files follow the index when it comes.
    private var lastArea: GeoBounds?

    init(
        api: any ScooterAPIClient, cache: CityZoneCache?, now: @escaping () -> Date = Date.init,
        builtIn: [CityZoneDownload] = CityZoneDownloads.builtIn, builtInCities: Set<String> = CityZoneDownloads.builtInCities
    ) {
        self.api = api
        self.cache = cache
        clock = now
        builtInDownloads = builtIn
        builtInZones = builtInCities
        // The index kept from before, confirmed when it was last saved.
        if let saved = cache?.read(CityZoneIndex.fileName), let index = try? CityZoneIndex(data: saved.data) {
            self.index = index
            indexConfirmedAt = saved.savedAt
        }
    }

    /// The cities to download: the index's, or until one has come those of the app's build; less any city
    /// whose zones are built into this app, which are drawn from the catalog.
    var cities: [CityZoneDownload] {
        (index?.cities ?? builtInDownloads).filter { !builtInZones.contains($0.id) }
    }

    /// Asks for what the area, a view's from zoom 14, needs: the index if it is due, and the file of each city
    /// it reaches whose zones of the index's version are not here. What failed is asked for again after a while.
    func request(over area: GeoBounds) {
        lastArea = area
        let now = clock()
        let due = indexOutdated || indexConfirmedAt.map { now.timeIntervalSince($0) >= Self.indexRefresh } ?? true
        if due, indexTask == nil, !Self.failedLately(indexFailedAt, now: now) { fetchIndex() }
        guard indexIsCurrent(at: now) else { return }
        for city in cities where city.bounds.intersects(area) {
            guard let sha256 = city.sha256, loaded[city.id]?.sha256 != sha256, downloads[city.id] == nil,
                  !Self.failedLately(failedAt[city.id], now: now) else { continue }
            download(city, sha256: sha256)
        }
    }

    /// The zones of the cities the area reaches whose file of the index's version is here, and a notice for
    /// each of the others: loading while it is on its way, unavailable once it or the index has failed.
    func shown(over area: GeoBounds) -> (zones: [CityRuleZone], notices: [Notice]) {
        let current = indexIsCurrent(at: clock())
        var zones: [CityRuleZone] = []
        var notices: [Notice] = []
        for city in cities where city.bounds.intersects(area) {
            if current, let sha256 = city.sha256, let entry = loaded[city.id], entry.sha256 == sha256 {
                zones += entry.zones
                continue
            }
            let failed = current ? failedAt[city.id] != nil : indexFailedAt != nil || indexTask == nil
            notices.append(Notice(city: city, state: failed ? .unavailable : .loading))
        }
        return (zones, notices)
    }

    private func indexIsCurrent(at now: Date) -> Bool {
        guard index != nil, let indexConfirmedAt else { return false }
        return now.timeIntervalSince(indexConfirmedAt) < Self.indexLifetime
    }

    private static func failedLately(_ date: Date?, now: Date) -> Bool {
        date.map { now.timeIntervalSince($0) < retryAfter } ?? false
    }

    private func fetchIndex() {
        indexTask = Task { [weak self, api] in
            let result: Result<(CityZoneIndex, Data), any Error>
            do {
                let data = try await api.cityZoneFile(CityZoneIndex.fileName)
                result = .success((try CityZoneIndex(data: data), data))
            } catch {
                result = .failure(error)
            }
            self?.indexArrived(result)
        }
    }

    private func indexArrived(_ result: Result<(CityZoneIndex, Data), any Error>) {
        indexTask = nil
        let now = clock()
        switch result {
        case let .success((index, data)):
            let versions = Self.versions(of: index)
            let before = self.index.map(Self.versions(of:)) ?? [:]
            // A city of a new version is asked for at once, and the zones of an old one are let go.
            failedAt = failedAt.filter { before[$0.key] == versions[$0.key] }
            loaded = loaded.filter { versions[$0.key] == $0.value.sha256 }
            self.index = index
            indexConfirmedAt = now
            indexFailedAt = nil
            indexOutdated = false
            cache?.write(CityZoneIndex.fileName, data, at: now)
            cache?.keepOnly(Set([CityZoneIndex.fileName] + index.cities.map(\.fileName)))
        case .failure:
            indexFailedAt = now
        }
        if let lastArea { request(over: lastArea) }
        onChange?()
    }

    private static func versions(of index: CityZoneIndex) -> [String: String] {
        Dictionary(index.cities.compactMap { city in city.sha256.map { (city.id, $0) } }, uniquingKeysWith: { first, _ in first })
    }

    private func download(_ city: CityZoneDownload, sha256: String) {
        downloads[city.id] = Task { [weak self, api, cache] in
            // Read and checked away from the main thread: a big city's file is a megabyte or two.
            let result = await Task.detached(priority: .utility) { () -> Result<[CityRuleZone], any Error> in
                do {
                    // The file kept from before, if it is still the index's.
                    if let saved = cache?.read(city.fileName)?.data, CityZoneFile.digest(saved) == sha256 {
                        return .success(try CityZoneFile.zones(of: city, from: saved))
                    }
                    let data = try await api.cityZoneFile(city.fileName)
                    guard CityZoneFile.digest(data) == sha256 else { throw CityZoneDownloadError.mismatch }
                    let zones = try CityZoneFile.zones(of: city, from: data)
                    cache?.write(city.fileName, data, at: Date())
                    return .success(zones)
                } catch {
                    return .failure(error)
                }
            }.value
            self?.downloaded(city, sha256: sha256, result: result)
        }
    }

    private func downloaded(_ city: CityZoneDownload, sha256: String, result: Result<[CityRuleZone], any Error>) {
        downloads[city.id] = nil
        switch result {
        case let .success(zones):
            loaded[city.id] = (sha256, zones)
            failedAt[city.id] = nil
        case let .failure(error):
            failedAt[city.id] = clock()
            // Another deploy has published since the index came: it is asked for again at once.
            if error as? CityZoneDownloadError == .mismatch {
                indexOutdated = true
                if let lastArea { request(over: lastArea) }
            }
        }
        onChange?()
    }
}
