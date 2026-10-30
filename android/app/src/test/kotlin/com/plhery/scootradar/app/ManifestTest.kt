package com.plhery.scootradar.app

import android.app.NotificationManager
import android.content.Context
import android.content.pm.ShortcutManager
import android.os.Looper
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.MainActivity
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.Shadows.shadowOf
import org.w3c.dom.Element
import java.io.File
import java.time.Duration
import java.util.Properties
import javax.xml.parsers.DocumentBuilderFactory

// X.md's Android rows that are the manifest's (X-AD02, X-AD06, X-AD07, X-AD19, X-AD20, X-AD29), read from the
// manifest as the build merged it, the libraries' parts included.

@RunWith(AndroidJUnit4::class)
class ManifestTest {
    private val manifest: Element by lazy {
        val config = Properties().apply {
            ManifestTest::class.java.classLoader!!.getResourceAsStream("com/android/tools/test_config.properties").use { load(it) }
        }
        val factory = DocumentBuilderFactory.newInstance().apply { isNamespaceAware = true }
        factory.newDocumentBuilder().parse(File(config.getProperty("android_merged_manifest"))).documentElement
    }

    private val application: Element get() = manifest.children("application").single()

    private val activity: Element get() = application.children("activity").single { it.android("name") == "com.plhery.scootradar.MainActivity" }

    /**
     * X-AD02: Back is predictive on Android 13 to 15 too, where the app has to ask for it, so that the sheets' own
     * Back (PredictiveBackHandler) follows the gesture and Back with nothing open shows the home screen coming.
     */
    @Test
    fun backIsPredictive() {
        assertEquals("true", application.android("enableOnBackInvokedCallback"))
        assertNull(activity.android("enableOnBackInvokedCallback"))
    }

    /** X-AD06: the iPhone app sends no notifications, and the app asks for no permission to, nor makes a channel. */
    @Test
    fun theAppSendsNoNotifications() {
        val permissions = manifest.children("uses-permission").map { it.android("name") }
        assertTrue(permissions.toString(), "android.permission.POST_NOTIFICATIONS" !in permissions)

        Robolectric.buildActivity(MainActivity::class.java).create().start().resume()
        val notifications = ApplicationProvider.getApplicationContext<Context>().getSystemService(NotificationManager::class.java)
        assertEquals(emptyList<Any>(), notifications.notificationChannels)
    }

    /**
     * X-AD07: no widget, as the iPhone app has no widget extension, and no launcher shortcuts, as it has no quick
     * actions: none on a receiver, an activity or an activity's alias, where a launcher reads them too.
     */
    @Test
    fun theAppHasNoWidgetsAndNoShortcuts() {
        val components = listOf("receiver", "activity", "activity-alias").flatMap { application.children(it) }
        val actions = components.flatMap { component ->
            component.children("intent-filter").flatMap { filter -> filter.children("action").map { it.android("name") } }
        }
        assertTrue(actions.toString(), "android.appwidget.action.APPWIDGET_UPDATE" !in actions)
        assertTrue(actions.toString(), "android.intent.action.CREATE_SHORTCUT" !in actions)
        val metaData = components.flatMap { it.children("meta-data") }.map { it.android("name") }
        assertTrue(metaData.toString(), "android.appwidget.provider" !in metaData && "android.app.shortcuts" !in metaData)
    }

    /**
     * X-AD07: nor any the code publishes as the app runs, a dynamic shortcut or a pinned one: none as it opens, none
     * once what it posted and put off has run 10 s on, none once it has gone to the background (review-app-v finding
     * 7). The screen is not composed here, as the map's native library does not load in a JVM test.
     */
    @Test
    fun theAppPublishesNoShortcutsAsItRuns() {
        val shortcuts = ApplicationProvider.getApplicationContext<Context>().getSystemService(ShortcutManager::class.java)
        val published = { shortcuts.dynamicShortcuts + shortcuts.pinnedShortcuts }
        val activity = Robolectric.buildActivity(MainActivity::class.java).create().start().resume()
        assertEquals("as it opens", emptyList<Any>(), published())
        shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(10))
        assertEquals("10 s on", emptyList<Any>(), published())
        activity.pause().stop()
        shadowOf(Looper.getMainLooper()).idle()
        assertEquals("in the background", emptyList<Any>(), published())
        activity.destroy()
    }

    /**
     * X-AD19, X-AD20: the activity runs in split screen, in a free window and on any screen, its layout following its
     * window, as the iPad's does: nothing keeps it to one size, shape or way up. A phone's screen keeps it upright
     * in code (ScreenOrientation), as the manifest can't tell a phone from a tablet.
     */
    @Test
    fun theActivityRunsInAnyWindow() {
        for (element in listOf(application, activity)) {
            assertTrue(element.android("resizeableActivity") != "false")
            for (attribute in listOf("screenOrientation", "maxAspectRatio", "minAspectRatio")) assertNull(attribute, element.android(attribute))
        }
        assertEquals("singleTask", activity.android("launchMode"))
    }

    /**
     * X-AD29: HTTPS only, as App Transport Security has it on the iPhone: Android's defaults for an app targeting
     * Android 9 and later (no clear text) and 7 and later (no certificate the user added), which nothing loosens.
     */
    @Test
    fun theAppTalksHttpsOnly() {
        assertTrue(manifest.children("uses-sdk").single().android("targetSdkVersion")!!.toInt() >= 28)
        assertNull(application.android("usesCleartextTraffic"))
        assertNull(application.android("networkSecurityConfig"))
    }

    private fun Element.children(tag: String): List<Element> =
        (0 until childNodes.length).map { childNodes.item(it) }.filterIsInstance<Element>().filter { it.tagName == tag }

    private fun Element.android(attribute: String): String? =
        getAttributeNodeNS(ANDROID, attribute)?.value

    private companion object {
        const val ANDROID = "http://schemas.android.com/apk/res/android"
    }
}
