package com.plhery.scootradar.ui

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.view.View
import android.view.accessibility.AccessibilityManager
import android.view.accessibility.AccessibilityNodeInfo
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.node.RootForTest
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getAllSemanticsNodes
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.plhery.scootradar.EmptyScooterAPI
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.chrome.FloatingMapControls
import com.plhery.scootradar.ui.chrome.ZoneLegend
import com.plhery.scootradar.ui.dock.DOCK_TAG
import com.plhery.scootradar.ui.theme.PHONE
import com.plhery.scootradar.ui.theme.ScootTheme
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import java.time.Instant
import java.time.ZoneId
import java.util.Locale
import java.util.TimeZone

/**
 * TalkBack's swipes through the screen, as VoiceOver's go (app-ai's TalkBack pass): Settings scrolled at half height,
 * the legend read whole before the locate button, and a folded panel's line before its grabber. TalkBack is played
 * through Compose's node provider, with a service on and touch exploration, as Compose gives TalkBack its order then.
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = PHONE)
class TalkBackSwipesTest {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val timeZone = TimeZone.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale

    @Before
    fun setUp() {
        val swiss = Locale.forLanguageTag("en-CH")
        Locale.setDefault(swiss)
        ScooterLanguage.launchLocale = { swiss }
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Zurich"))
        ScooterDateFormat.timeZone = { ZoneId.of("Europe/Zurich") }
        ScooterLanguage.current = ScooterLanguage.En
        // TalkBack on: a service, which Compose orders its nodes for, and touch exploration.
        val accessibility = ApplicationProvider.getApplicationContext<Context>().getSystemService(AccessibilityManager::class.java)
        shadowOf(accessibility).setEnabled(true)
        shadowOf(accessibility).setTouchExplorationEnabled(true)
        shadowOf(accessibility).setEnabledAccessibilityServiceList(listOf(AccessibilityServiceInfo()))
    }

    @After
    fun tearDown() {
        controllers.close()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        ScooterDateFormat.timeZone = ZoneId::systemDefault
        Locale.setDefault(locale)
        TimeZone.setDefault(timeZone)
    }

    /** The screen's view, whose nodes TalkBack is given. */
    private lateinit var view: View

    private fun show(model: ScooterMapController) {
        val clock = TestClock()
        compose.setContent {
            view = LocalView.current
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = {}, glassBlurs = false)
            }
        }
        compose.waitForIdle()
    }

    /** TalkBack's [action] on the node, as TalkBack sends it: whether the node took it. */
    private fun SemanticsNodeInteraction.talkBack(action: Int): Boolean {
        val id = fetchSemanticsNode().id
        return compose.runOnIdle { view.accessibilityNodeProvider.performAction(id, action, null) }
            .also { compose.waitForIdle() }
    }

    private val SemanticsNodeInteraction.state: String?
        get() = fetchSemanticsNode().config.getOrElseNullable(SemanticsProperties.StateDescription) { null }

    /**
     * The nodes in the order TalkBack's swipes go through them, as Compose gives it: each node's next, which Compose
     * hands TalkBack as the node it is read before.
     */
    private fun swipeOrder(): List<Int> {
        val provider = view.accessibilityNodeProvider
        val next = compose.runOnIdle {
            (view as RootForTest).semanticsOwner.getAllSemanticsNodes(mergingEnabled = false).mapNotNull { node ->
                val info = provider.createAccessibilityNodeInfo(node.id) ?: return@mapNotNull null
                provider.addExtraDataToAccessibilityNodeInfo(node.id, info, TRAVERSAL_BEFORE, null)
                info.extras.getInt(TRAVERSAL_BEFORE, -1).takeIf { it != -1 }?.let { node.id to it }
            }.toMap()
        }
        val first = next.keys.single { it !in next.values }
        return generateSequence(first) { next[it] }.toList()
    }

    /** Where TalkBack's swipes reach the node, among the screen's. */
    private fun List<Int>.place(node: SemanticsNodeInteraction): Int = indexOf(node.fetchSemanticsNode().id).also { check(it >= 0) }

    /**
     * SH2: at half height, TalkBack's swipe past the last row in view scrolls Settings, and the sheet stays at half
     * height, as VoiceOver's scrolls a sheet's list; it grew the sheet, and the focus went round its grabber.
     */
    @Test
    fun talkBacksScrollMovesSettingsAndNotItsSheet() {
        show(controllers.make(EmptyScooterAPI))
        compose.onNode(hasContentDescription(localized("Settings")) and hasClickAction()).talkBack(AccessibilityNodeInfo.ACTION_CLICK)
        val grabber = compose.onNode(hasContentDescription(localized("Sheet Grabber")))
        assertEquals(localized("Sheet at half screen"), grabber.state)
        val list = compose.onNode(hasScrollAction() and hasAnyDescendant(hasText(localized("Appearance"))))

        // Past the last row in view, TalkBack scrolls the list forward, as it does through ScrollBy for a row it
        // shows that is partly in view.
        assertTrue(list.talkBack(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD))
        assertEquals("the sheet after TalkBack's scroll", localized("Sheet at half screen"), grabber.state)
        val scrolled = list.fetchSemanticsNode().config[SemanticsProperties.VerticalScrollAxisRange].value()
        assertTrue("Settings scrolled by TalkBack: $scrolled", scrolled > 0f)
    }

    /**
     * F5: the legend's kinds and its city lines are read together, then the locate button, as the iPhone's HStack
     * lists them, the legend then the button; TalkBack read the button between them.
     */
    @Test
    fun theLegendIsReadWholeBeforeTheLocateButton() {
        val model = controllers.make(EmptyScooterAPI)
        // Located once: the round button.
        model.locationsUpdated(listOf(ScooterLocationFix(GeoPoint(47.3769, 8.5417), horizontalAccuracy = 5.0, timestamp = Instant.now())))
        assertTrue(controllers.waitUntil { model.hasLocatedOnce.value })
        val rule = CityRuleZone(
            id = "zurich",
            authority = "Stadt Zürich",
            timeZone = "Europe/Zurich",
            firstDay = "2026-05-01",
            hours = emptyList(),
            source = "https://example.com/zurich",
            lines = listOf(listOf(GeoPoint(47.3769, 8.5417), GeoPoint(47.3779, 8.5427))),
        )
        val clock = TestClock()
        compose.setContent {
            view = LocalView.current
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScootTheme(dark = false, reduceMotion = true) {
                    // The phone's row: the legend at the leading edge, the button at the trailing one, their feet level.
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.Bottom) {
                        Box(Modifier.weight(1f), contentAlignment = Alignment.BottomStart) {
                            ZoneLegend(state = ScooterZoneState.Shown, count = 3, rules = listOf(CityRuleZone.Shown(rule, inForce = true)))
                        }
                        FloatingMapControls(model)
                    }
                }
            }
        }
        compose.waitForIdle()

        val order = swipeOrder()
        val kinds = order.place(compose.onNode(hasContentDescription(localized("Zones"))))
        val line = order.place(compose.onNode(hasText("Stadt Zürich", substring = true)))
        val button = order.place(compose.onNode(hasContentDescription(localized("Go to my location"))))
        assertTrue("the kinds, the city's line, then the button: $kinds, $line, $button", kinds < line && line < button)
    }

    /**
     * F13: with the panel folded, its line is read before its grabber, in the order they are drawn, as VoiceOver reads
     * them; TalkBack read the grabber, which reaches up over the line's foot, first.
     */
    @Test
    @Config(qualifiers = "w1280dp-h800dp-mdpi")
    fun aFoldedPanelsLineIsReadBeforeItsGrabber() {
        val model = controllers.make(EmptyScooterAPI)
        show(model)
        compose.runOnIdle { model.setPanelCollapsed(true) }
        compose.waitForIdle()

        val order = swipeOrder()
        val grabber = compose.onNode(hasContentDescription(localized("Expand panel")))
        assertEquals(localized("Collapsed"), grabber.state)
        // The card's one button, folded: its line.
        val line = compose.onNode(hasClickAction() and hasAnyAncestor(hasTestTag(DOCK_TAG)))
        assertTrue("the folded line, then the grabber", order.place(line) < order.place(grabber))
    }

    private companion object {
        /** Compose's extra for tests, which holds the node a node is read before. */
        const val TRAVERSAL_BEFORE = "android.view.accessibility.extra.EXTRA_DATA_TEST_TRAVERSALBEFORE_VAL"
    }
}
