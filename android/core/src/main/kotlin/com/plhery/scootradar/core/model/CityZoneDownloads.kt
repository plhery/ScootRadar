package com.plhery.scootradar.core.model

import com.plhery.scootradar.core.api.ScooterAPIClient
import java.io.File
import java.io.IOException
import java.security.MessageDigest
import java.time.Instant
import kotlin.coroutines.CoroutineContext
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

// ios/ScootRadar/Models/CityZoneDownloads.swift.

/**
 * A city whose zones the app downloads rather than has built in (docs/city-zone-downloads.md): as the index at
 * /zones/v1/index.json lists it, or as data/city-zones.json had it when the app was built.
 */
data class CityZoneDownload(
    val id: String,
    /** "Berlin", as the legend names it while its zones are not drawn. */
    val place: String,
    /** Who sets its zones, as the legend names them. */
    val authority: String,
    val timeZone: String,
    /** Where they say so, an https address. */
    val source: String,
    /** Around all its zones. */
    val bounds: GeoBounds,
    /** The SHA-256 of its file, in hex: null in the list built into the app, which vouches for no file. */
    val sha256: String? = null,
) {
    /** The name of its file under /zones/v1/. */
    val fileName: String get() = "$id.json"
}

/** The cities to download, as /zones/v1/index.json lists them. */
data class CityZoneIndex(val cities: List<CityZoneDownload>) {
    companion object {
        /** The format this app reads, that of /zones/v1/. */
        const val format = 1
        const val fileName = "index.json"

        /** A city this version cannot read is left out; an index of another format is none. */
        operator fun invoke(data: ByteArray): CityZoneIndex {
            val payload = CityZoneJson.decodeFromString(Payload.serializer(), data.decodeToString())
            if (payload.format != format) throw CityZoneDownloadError.Format()
            return CityZoneIndex(
                payload.cities.mapNotNull { entry ->
                    val city = try {
                        CityZoneJson.decodeFromJsonElement(Payload.City.serializer(), entry)
                    } catch (_: IllegalArgumentException) {
                        return@mapNotNull null
                    }
                    if (!city.source.url.startsWith("https:") || city.source.url.toHttpUrlOrNull() == null) return@mapNotNull null
                    if (city.id.isEmpty() || !city.id.all { it in 'a'..'z' }) return@mapNotNull null
                    CityZoneDownload(
                        id = city.id, place = city.place, authority = city.authority, timeZone = city.timeZone,
                        source = city.source.url,
                        bounds = GeoBounds(south = city.bounds.south, west = city.bounds.west, north = city.bounds.north, east = city.bounds.east),
                        sha256 = city.sha256.lowercase(),
                    )
                },
            )
        }
    }

    @Serializable
    private class Payload(val format: Int, val cities: List<JsonElement>) {
        @Serializable
        class City(
            val id: String,
            val place: String,
            val authority: String,
            val timeZone: String,
            val source: Source,
            val bounds: Bounds,
            val sha256: String,
        )

        @Serializable
        class Source(val url: String)

        @Serializable
        class Bounds(val south: Double, val west: Double, val north: Double, val east: Double)
    }
}

sealed class CityZoneDownloadError(message: String) : Exception(message) {
    /** An index of a format this app does not read. */
    class Format : CityZoneDownloadError("format")

    /** A file that is not the one the index vouches for: of another deploy, cut short or changed on the way. */
    class Mismatch : CityZoneDownloadError("mismatch")
}

/** Reads the files as the iPhone's JSONDecoder does: keys it does not know are skipped. */
private val CityZoneJson = Json { ignoreUnknownKeys = true }

/** A city's file, /zones/v1/<id>.json: its id, and its zones, each one ring as latitude, longitude, latitude… */
object CityZoneFile {
    /**
     * Its zones, each in force always and credited to the city; a zone of a kind added later is left out, as is a
     * ring of fewer than three points.
     */
    fun zones(of: CityZoneDownload, from: ByteArray): List<CityRuleZone> {
        val payload = CityZoneJson.decodeFromString(Payload.serializer(), from.decodeToString())
        if (payload.id != of.id) throw CityZoneDownloadError.Mismatch()
        return payload.zones.mapNotNull { zone ->
            val kind = ScooterZoneKind.fromRawValue(zone.kind)
            if (kind == null || zone.ring.size < 6 || zone.ring.size % 2 != 0) return@mapNotNull null
            CityRuleZone(
                id = zone.id, authority = of.authority, timeZone = of.timeZone, kind = kind, source = of.source,
                ring = List(zone.ring.size / 2) { GeoPoint(latitude = zone.ring[2 * it], longitude = zone.ring[2 * it + 1]) },
            )
        }
    }

    /** The SHA-256 of the data, in hex, as the index gives it. */
    fun digest(data: ByteArray): String {
        val hash = MessageDigest.getInstance("SHA-256").digest(data)
        val hex = "0123456789abcdef"
        return buildString(hash.size * 2) {
            for (byte in hash) {
                append(hex[(byte.toInt() shr 4) and 0xF])
                append(hex[byte.toInt() and 0xF])
            }
        }
    }

    @Serializable
    private class Payload(val id: String, val zones: List<Zone>) {
        @Serializable
        class Zone(val id: String, val kind: String, val ring: DoubleArray)
    }
}

/**
 * The index and the cities' files as last downloaded, in a directory of the app's caches, which Android does not back
 * up and may clear when space runs short: they are then downloaded again. When a file was last saved, or the index
 * last confirmed, is its modification time.
 */
class CityZoneCache(val directory: File) {
    /** A file as it was saved. */
    class Saved(val data: ByteArray, val savedAt: Instant)

    fun read(name: String): Saved? {
        val file = File(directory, name)
        return try {
            val data = file.readBytes()
            val modified = file.lastModified()
            if (modified == 0L) null else Saved(data, Instant.ofEpochMilli(modified))
        } catch (_: IOException) {
            null
        }
    }

    /** Written whole or not at all: to a file beside it, dated, then put in its place. */
    fun write(name: String, data: ByteArray, at: Instant) {
        try {
            directory.mkdirs()
            val written = File.createTempFile(".$name.", ".tmp", directory)
            try {
                written.writeBytes(data)
                written.setLastModified(at.toEpochMilli())
                if (!written.renameTo(File(directory, name))) throw IOException("Not moved: $name")
            } finally {
                written.delete()
            }
        } catch (_: IOException) {
            // Not kept: downloaded again when next needed.
        }
    }

    /** Deletes every file but those named. */
    fun keepOnly(names: Set<String>) {
        for (file in directory.listFiles().orEmpty()) {
            if (file.name !in names) file.delete()
        }
    }

    companion object {
        /** cacheDir/CityZones/v1, of the app's [caches] directory. */
        fun standard(caches: File): CityZoneCache = CityZoneCache(File(caches, "CityZones/v1"))
    }
}

/**
 * The zones of the cities the app downloads (docs/city-zone-downloads.md): the index of them, asked for every 6 hours
 * while views from zoom 14 are shown, and the file of each city such a view reaches, checked against the index and
 * kept on the device. A rider never sees a wrong rule because a file is missing or stale: a city whose file of the
 * index's version is not here, or whose index was not confirmed in the last 7 days, has nothing drawn, and a notice
 * says its zones are loading or unavailable.
 *
 * Confined to the thread of [scope], the map's main thread, as the iPhone's is to the main actor; the files are read,
 * checked and written on [files]' thread, away from it.
 */
class CityZoneDownloads(
    private val api: ScooterAPIClient,
    private val cache: CityZoneCache?,
    /**
     * Where it asks and hears back: the map's controller's scope. Its dispatcher must dispatch (not
     * `Dispatchers.Main.immediate` or `Unconfined`), as a job is kept only once it is launched.
     */
    private val scope: CoroutineScope,
    now: () -> Instant = Instant::now,
    /** The download cities of the app's build, until an index has come. */
    builtIn: List<CityZoneDownload> = CityZoneDownloads.builtIn,
    /** The cities whose zones are built into the app. */
    builtInCities: Set<String> = CityZoneDownloads.builtInCities,
    /** Where the files are read, checked and written: a big city's is a megabyte or two. */
    private val files: CoroutineContext = Dispatchers.IO,
) {
    /** What the legend says of a city over the map whose zones are not drawn. */
    data class Notice(val city: CityZoneDownload, val state: State) {
        enum class State { Loading, Unavailable }
    }

    /** What is drawn of the cities an area reaches, and what is said of the others. */
    data class Shown(val zones: List<CityRuleZone>, val notices: List<Notice>)

    /** Told when the index or a city's file has come, or failed to, for the map to draw what is new. */
    var onChange: (() -> Unit)? = null

    private val clock = now
    private val builtInDownloads = builtIn
    private val builtInZones = builtInCities

    private var index: CityZoneIndex? = null
    private var indexConfirmedAt: Instant? = null
    private var indexTask: Job? = null
    private var indexFailedAt: Instant? = null

    /** A file did not match the index: another deploy has published since, and the index is asked for again. */
    private var indexOutdated = false

    /** Each city's zones read so far, with the version they are. */
    private val loaded = mutableMapOf<String, Pair<String, List<CityRuleZone>>>()
    private val downloads = mutableMapOf<String, Job>()
    private val failedAt = mutableMapOf<String, Instant>()

    /** The latest area asked for, whose cities' files follow the index when it comes. */
    private var lastArea: GeoBounds? = null

    /** One file at a time: a city's is never written while the index lets go of others. */
    private val fileLock = Mutex()

    /**
     * The index kept from before, confirmed when it was last saved, read away from the main thread as the app opens;
     * until it is, nothing is asked for and the cities' zones are loading.
     */
    private var restoring: Job? = cache?.let { cache ->
        scope.launch {
            val kept = withContext(files) {
                fileLock.withLock { cache.read(CityZoneIndex.fileName) }?.let { saved ->
                    try {
                        CityZoneIndex(data = saved.data) to saved.savedAt
                    } catch (_: Exception) {
                        null
                    }
                }
            }
            restoring = null
            val restored = kept?.takeIf { index == null }
            if (restored != null) {
                index = restored.first
                indexConfirmedAt = restored.second
            }
            lastArea?.let { request(over = it) }
            // The map drew the build's cities as loading: what it draws now is the kept index's.
            if (restored != null) onChange?.invoke()
        }
    }

    /**
     * The cities to download: the index's, or until one has come those of the app's build; less any city whose zones
     * are built into this app, which are drawn from the catalog.
     */
    val cities: List<CityZoneDownload>
        get() = (index?.cities ?: builtInDownloads).filter { it.id !in builtInZones }

    /**
     * Asks for what the area, a view's from zoom 14, needs: the index if it is due, and the file of each city it
     * reaches whose zones of the index's version are not here. What failed is asked for again after a while.
     */
    fun request(over: GeoBounds) {
        lastArea = over
        if (restoring != null) return
        val now = clock()
        val due = indexOutdated || (indexConfirmedAt?.let { now.timeIntervalSince(it) >= indexRefresh } ?: true)
        if (due && indexTask == null && !failedLately(indexFailedAt, now)) fetchIndex()
        if (!indexIsCurrent(now)) return
        for (city in cities) {
            if (!city.bounds.intersects(over)) continue
            val sha256 = city.sha256 ?: continue
            if (loaded[city.id]?.first == sha256 || city.id in downloads || failedLately(failedAt[city.id], now)) continue
            download(city, sha256)
        }
    }

    /**
     * The zones of the cities the area reaches whose file of the index's version is here, and a notice for each of the
     * others: loading while it is on its way, unavailable once it or the index has failed.
     */
    fun shown(over: GeoBounds): Shown {
        val current = indexIsCurrent(clock())
        val zones = mutableListOf<CityRuleZone>()
        val notices = mutableListOf<Notice>()
        for (city in cities) {
            if (!city.bounds.intersects(over)) continue
            val sha256 = city.sha256
            val entry = loaded[city.id]
            if (current && sha256 != null && entry != null && entry.first == sha256) {
                zones += entry.second
                continue
            }
            val failed = if (current) city.id in failedAt else indexFailedAt != null || (indexTask == null && restoring == null)
            notices += Notice(city, if (failed) Notice.State.Unavailable else Notice.State.Loading)
        }
        return Shown(zones, notices)
    }

    private fun indexIsCurrent(now: Instant): Boolean {
        val confirmedAt = indexConfirmedAt
        if (index == null || confirmedAt == null) return false
        return now.timeIntervalSince(confirmedAt) < indexLifetime
    }

    private fun fetchIndex() {
        indexTask = scope.launch {
            val result = try {
                val data = api.cityZoneFile(CityZoneIndex.fileName)
                Result.success(withContext(files) { CityZoneIndex(data = data) } to data)
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                Result.failure(error)
            }
            indexArrived(result)
        }
    }

    private fun indexArrived(result: Result<Pair<CityZoneIndex, ByteArray>>) {
        indexTask = null
        val now = clock()
        val arrived = result.getOrNull()
        if (arrived != null) {
            val (index, data) = arrived
            val versions = versions(of = index)
            val before = this.index?.let(::versions) ?: emptyMap()
            // A city of a new version is asked for at once, and the zones of an old one are let go.
            failedAt.keys.retainAll { before[it] == versions[it] }
            loaded.entries.retainAll { versions[it.key] == it.value.first }
            this.index = index
            indexConfirmedAt = now
            indexFailedAt = null
            indexOutdated = false
            val keep = setOf(CityZoneIndex.fileName) + index.cities.map { it.fileName }
            cache?.let { cache ->
                scope.launch(files) {
                    fileLock.withLock {
                        cache.write(CityZoneIndex.fileName, data, at = now)
                        cache.keepOnly(keep)
                    }
                }
            }
        } else {
            indexFailedAt = now
        }
        lastArea?.let { request(over = it) }
        onChange?.invoke()
    }

    private fun download(city: CityZoneDownload, sha256: String) {
        downloads[city.id] = scope.launch {
            val result = try {
                // The file kept from before, if it is still the index's.
                val kept = withContext(files) {
                    val saved = fileLock.withLock { cache?.read(city.fileName) }?.data
                    if (saved != null && CityZoneFile.digest(saved) == sha256) CityZoneFile.zones(of = city, from = saved) else null
                }
                val zones = kept ?: run {
                    val data = api.cityZoneFile(city.fileName)
                    withContext(files) {
                        if (CityZoneFile.digest(data) != sha256) throw CityZoneDownloadError.Mismatch()
                        val zones = CityZoneFile.zones(of = city, from = data)
                        fileLock.withLock { cache?.write(city.fileName, data, at = Instant.now()) }
                        zones
                    }
                }
                Result.success(zones)
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                Result.failure(error)
            }
            downloaded(city, sha256, result)
        }
    }

    private fun downloaded(city: CityZoneDownload, sha256: String, result: Result<List<CityRuleZone>>) {
        downloads.remove(city.id)
        val zones = result.getOrNull()
        if (zones != null) {
            loaded[city.id] = sha256 to zones
            failedAt.remove(city.id)
        } else {
            failedAt[city.id] = clock()
            // Another deploy has published since the index came: it is asked for again at once.
            if (result.exceptionOrNull() is CityZoneDownloadError.Mismatch) {
                indexOutdated = true
                lastArea?.let { request(over = it) }
            }
        }
        onChange?.invoke()
    }

    companion object {
        /** How long the index serves before it is asked for again, in seconds. */
        const val indexRefresh: Double = 6 * 3600.0

        /** How long an index that could not be confirmed again still vouches for the files on the device. */
        const val indexLifetime: Double = 7 * 24 * 3600.0

        /** How long after a failure the same is asked for again. */
        const val retryAfter: Double = 30.0

        /** The cities whose zones the app downloads, as data/city-zones.json had them when the app was built. */
        val builtIn: List<CityZoneDownload> get() = CatalogData.value.zoneDownloads

        /** The cities whose zones are built into the app's catalog. */
        val builtInCities: Set<String> get() = CatalogData.value.zoneCities

        private fun failedLately(date: Instant?, now: Instant): Boolean =
            date?.let { now.timeIntervalSince(it) < retryAfter } ?: false

        private fun versions(of: CityZoneIndex): Map<String, String> = buildMap {
            for (city in of.cities) {
                val sha256 = city.sha256 ?: continue
                if (city.id !in this) put(city.id, sha256)
            }
        }
    }
}
