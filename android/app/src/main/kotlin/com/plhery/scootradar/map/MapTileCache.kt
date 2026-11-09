package com.plhery.scootradar.map

import android.content.Context
import androidx.annotation.MainThread
import org.maplibre.android.storage.FileSource
import java.io.File

/**
 * MapLibre's tile cache, the ambient cache in its offline database (MAP-248), kept among the app's caches, as MapKit
 * keeps its own: Android's "Clear cache", and its clean-up when storage runs low, can free it. MapLibre 13.7.1 keeps
 * it in the app's files unless told otherwise, where only "Clear storage" reaches it, and builds up to 1.3.0 left it
 * there.
 *
 * The earlier database isn't moved: renamed into the caches it would keep the files' group, which Android doesn't count
 * as cache and the app may not change, and a copy of up to 50 MiB before the map opens isn't cheap. The tiles are
 * fetched again instead.
 */
object MapTileCache {
    /** The database's name in its folder, MapLibre's DATABASE_FILE. */
    const val DATABASE = "mbgl-offline.db"

    /** The database and what SQLite keeps beside it: MapLibre's keeps a rollback journal (journal_mode DELETE). */
    private val parts = listOf("", "-journal", "-wal", "-shm").map { DATABASE + it }

    private var used = false

    /**
     * Before MapLibre looks for its database: the caches' folder, made again if "Clear cache" took it, where MapLibre
     * would otherwise forget the path it was given and go back to the files.
     */
    @MainThread
    fun prepare(context: Context) {
        context.cacheDir
    }

    /**
     * Once MapLibre is loaded: its database in the caches from now on, and the one left in the files removed. On the
     * first start after an update MapLibre opens the files' one until it moves; later starts open the caches' at once.
     */
    @MainThread
    fun use(context: Context, done: (Boolean) -> Unit = {}) {
        if (used) return done(true)
        used = true
        val files = context.filesDir
        FileSource.setResourcesCachePath(
            context.cacheDir.absolutePath,
            object : FileSource.ResourcesCachePathChangeCallback {
                override fun onSuccess(path: String) {
                    removeEarlier(files)
                    done(true)
                }

                override fun onError(message: String) {
                    // The next start tries again; meanwhile the tiles stay where they are.
                    used = false
                    done(false)
                }
            },
        )
    }

    /** Removes the database left in [files], once MapLibre has closed it. */
    internal fun removeEarlier(files: File) {
        for (part in parts) File(files, part).delete()
    }
}
