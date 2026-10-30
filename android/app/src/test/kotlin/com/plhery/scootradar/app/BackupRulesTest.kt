package com.plhery.scootradar.app

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.R
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.xmlpull.v1.XmlPullParser
import java.io.File
import java.util.Properties

/**
 * LOG-298: the settings go into the phone's backups and to a new phone, as the iPhone's UserDefaults go into its
 * backups, with the language chosen for the app; nothing else does. The rules are read from the app's resources and
 * the manifest as the build merged it.
 */
@RunWith(AndroidJUnit4::class)
class BackupRulesTest {
    private val context: Context = ApplicationProvider.getApplicationContext()

    /** A rule: whether it takes or leaves out the files, their domain and their path. */
    private data class Rule(val tag: String, val domain: String, val path: String)

    /** The settings, which the app keeps in one file of shared preferences, and AppCompat's file of the app's language. */
    private val kept = listOf(
        Rule("include", "sharedpref", "ScooterDefaults.xml"),
        // AppLocalesStorageHelper's file, in the app's files, where AppCompat keeps the language on Android 12.
        Rule("include", "file", "androidx.appcompat.app.AppCompatDelegate.application_locales_record_file"),
    )

    /** Each section of a rules file, with its rules in order. */
    private fun sections(resource: Int): Map<String, List<Rule>> {
        val parser = context.resources.getXml(resource)
        val sections = linkedMapOf<String, MutableList<Rule>>()
        var section: String? = null
        while (parser.next() != XmlPullParser.END_DOCUMENT) {
            if (parser.eventType != XmlPullParser.START_TAG) continue
            when (parser.name) {
                "include", "exclude" -> sections.getOrPut(section ?: "") { mutableListOf() } +=
                    Rule(parser.name, parser.getAttributeValue(null, "domain"), parser.getAttributeValue(null, "path"))
                "data-extraction-rules" -> Unit
                else -> section = parser.name
            }
        }
        return sections
    }

    @Test
    fun aBackupAndANewPhoneTakeTheSettingsAndTheAppsLanguageOnly() {
        // Rules that name files leave every other out: the tiles and glyphs MapLibre keeps among the app's files too.
        assertEquals(mapOf("cloud-backup" to kept, "device-transfer" to kept), sections(R.xml.data_extraction_rules))
        assertEquals(mapOf("full-backup-content" to kept), sections(R.xml.backup_rules))
    }

    @Test
    fun theManifestPointsAtTheRulesAndLeavesBackupsOn() {
        val config = Properties().apply {
            BackupRulesTest::class.java.classLoader!!.getResourceAsStream("com/android/tools/test_config.properties").use { load(it) }
        }
        val manifest = File(config.getProperty("android_merged_manifest")).readText()
        val application = Regex("<application\\b[^>]*>").find(manifest)!!.value
        assertTrue(application, application.contains("""android:dataExtractionRules="@xml/data_extraction_rules""""))
        assertTrue(application, application.contains("""android:fullBackupContent="@xml/backup_rules""""))
        assertTrue(application, !application.contains("""android:allowBackup="false""""))
    }

    @Test
    fun theCitiesZonesAreKeptAmongTheCachesWhichTheRulesLeaveOut() {
        // LOG-422: the rules take only the files above, and a backup never takes the app's caches.
        assertEquals(File(context.cacheDir, "CityZones/v1"), AppContainer(context).cityZoneCache.directory)
        val rules = sections(R.xml.data_extraction_rules).values.flatten() + sections(R.xml.backup_rules).values.flatten()
        assertTrue(rules.all { it.tag == "include" && it.domain != "root" })
    }

    @Test
    fun theSettingsAreInTheFileTheRulesName() {
        val defaults = AppContainer(context).defaults
        defaults.set(true, forKey = "analytics-disabled")
        val file = kept.first { it.domain == "sharedpref" }.path.removeSuffix(".xml")
        assertTrue(context.getSharedPreferences(file, Context.MODE_PRIVATE).contains("analytics-disabled"))
    }
}
