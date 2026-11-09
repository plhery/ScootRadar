package com.plhery.scootradar.map

import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File

/** The tiles an earlier build kept in the app's files go once MapLibre keeps them among the caches (MAP-248). */
class MapTileCacheTest {
    @get:Rule
    val folder = TemporaryFolder()

    @Test
    fun theDatabaseLeftInTheFilesGoesAndNothingElse() {
        val files = folder.newFolder("files")
        for (name in listOf("mbgl-offline.db", "mbgl-offline.db-journal", "ScooterDefaults.xml", "profileInstalled")) {
            File(files, name).writeText(name)
        }

        MapTileCache.removeEarlier(files)
        // Again, as each start does: nothing there is no harm.
        MapTileCache.removeEarlier(files)

        assertEquals(listOf("ScooterDefaults.xml", "profileInstalled"), files.list().orEmpty().sorted())
    }
}
