package com.plhery.scootradar.map

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.system.Os
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeFalse
import org.junit.Test
import org.junit.runner.RunWith
import org.maplibre.android.MapLibre
import org.maplibre.android.constants.MapLibreConstants
import org.maplibre.android.storage.FileSource
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** MapLibre's tiles among the app's caches, where "Clear cache" and the clean-up of a full phone reach them (MAP-248). */
@RunWith(AndroidJUnit4::class)
class MapTileCacheTest {
    /**
     * The first start after an update from 1.3.0, which kept the tiles in the app's files: MapLibre's database is in
     * the caches from then on, counted as cache (the caches' group), and nothing of the earlier one is left. Run alone,
     * before any map in its process, as the app's first map is.
     */
    @Test
    fun anEarlierBuildsTilesGiveWayToACacheAmongTheCaches() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        assumeFalse("a map was made before in this process", MapLibre.hasInstance())
        // As 1.3.0 left it: no path chosen, and the database in the files, here with a mark of its own.
        context.getSharedPreferences(MapLibreConstants.MAPLIBRE_SHARED_PREFERENCES, Context.MODE_PRIVATE).edit().clear().commit()
        MapTileCache.removeEarlier(context.filesDir)
        MapTileCache.removeEarlier(context.cacheDir)
        val earlier = File(context.filesDir, MapTileCache.DATABASE)
        SQLiteDatabase.openOrCreateDatabase(earlier, null).use { it.execSQL("CREATE TABLE planted (mark INTEGER)") }

        val done = CountDownLatch(1)
        var moved = false
        instrumentation.runOnMainSync {
            // ScooterMap's order.
            MapTileCache.prepare(context)
            MapLibre.getInstance(context)
            MapTileCache.use(context) {
                moved = it
                done.countDown()
            }
        }
        assertTrue("the path changed in time", done.await(10, TimeUnit.SECONDS))
        assertTrue(moved)

        assertEquals(context.cacheDir.absolutePath, FileSource.getResourcesCachePath(context))
        assertFalse("nothing left in the files", earlier.exists())
        val database = File(context.cacheDir, MapTileCache.DATABASE)
        assertEquals("counted as cache", Os.stat(context.cacheDir.path).st_gid, Os.stat(database.path).st_gid)
        // MapLibre's own, new database.
        val tables = SQLiteDatabase.openDatabase(database.path, null, SQLiteDatabase.OPEN_READONLY).use { db ->
            db.rawQuery("SELECT name FROM sqlite_master WHERE type = 'table'", null).use { rows ->
                buildList { while (rows.moveToNext()) add(rows.getString(0)) }
            }
        }
        assertTrue("$tables", "tiles" in tables && "resources" in tables && "planted" !in tables)
    }
}
