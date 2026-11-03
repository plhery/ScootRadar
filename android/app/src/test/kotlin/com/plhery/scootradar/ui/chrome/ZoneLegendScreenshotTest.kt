package com.plhery.scootradar.ui.chrome

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import com.github.takahirom.roborazzi.captureRoboImage
import com.plhery.scootradar.StubScooterAPI
import com.plhery.scootradar.TestCatalog
import com.plhery.scootradar.TestClock
import com.plhery.scootradar.TestControllers
import com.plhery.scootradar.core.api.ScooterAPIClient
import com.plhery.scootradar.core.map.ScooterLocationFix
import com.plhery.scootradar.core.model.CityRuleZone
import com.plhery.scootradar.core.model.CityZoneDownload
import com.plhery.scootradar.core.model.CityZoneDownloads
import com.plhery.scootradar.core.model.GeoBounds
import com.plhery.scootradar.core.model.GeoPoint
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterCatalog
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterResponse
import com.plhery.scootradar.core.model.ScooterZone
import com.plhery.scootradar.core.model.ScooterZoneArea
import com.plhery.scootradar.core.model.ScooterZoneKind
import com.plhery.scootradar.core.model.ScooterZoneResponse
import com.plhery.scootradar.core.model.ScooterZoneState
import com.plhery.scootradar.scooter
import com.plhery.scootradar.ui.LocalClock
import com.plhery.scootradar.ui.ScooterMapScreen
import com.plhery.scootradar.ui.theme.Look
import com.plhery.scootradar.ui.theme.PHONE
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.drawWindowAgain
import com.plhery.scootradar.ui.theme.resetFontScale
import com.plhery.scootradar.ui.theme.screenshot
import com.plhery.scootradar.ui.theme.screenshotOptions
import com.plhery.scootradar.ui.theme.useFontScale
import com.plhery.scootradar.zurichRegion
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.time.Instant
import java.util.Locale

/**
 * The zones' legend (ui.md UI-092, UI-093, UI-174, UI-285, UI-348, UI-409 to UI-411) in each of its states, light and dark, at font
 * scale 1.0 and 2.0, over a plain stand-in for the map, as wide as the room beside the locate button; the cities'
 * rules and zones are made here rather than read from data/ (logic.md LOG-370).
 */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = PHONE)
class ZoneLegendScreenshotTest(private val case: Case, private val look: Look) {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()

    /** The legend's states, with the operators' zones drawn and the city's rules over the map. */
    enum class Case(
        val state: ScooterZoneState,
        val count: Int,
        val rules: List<CityRuleZone.Shown>,
        val notices: List<CityZoneDownloads.Notice> = emptyList(),
    ) {
        ZoomIn(ScooterZoneState.ZoomIn, 0, emptyList()),
        Failed(ScooterZoneState.Failed, 0, emptyList()),
        NoneHere(ScooterZoneState.Shown, 0, emptyList()),
        Kinds(ScooterZoneState.Shown, 12, emptyList()),
        Rules(ScooterZoneState.Shown, 0, seoulRules),

        /** The zones off, and a city's rules drawn all the same. */
        RulesOnly(ScooterZoneState.Off, 0, seoulRules),
        KindsAndRules(ScooterZoneState.Shown, 12, seoulRules),

        /** The zones off, and each kind a city sets, the strongest first, and the city credited at the foot. */
        BergenOnly(ScooterZoneState.Off, 0, bergenZones),

        /** A city's parking places among the operators' kinds, and the city credited at the foot. */
        KindsAndPorto(ScooterZoneState.Shown, 12, portoZones),

        /**
         * No operator's zones here, and two cities whose zones are downloaded and not drawn, one on its way and one
         * unavailable: their lines, and no "No zones published here" (UI-409).
         */
        NoticesOnly(ScooterZoneState.Shown, 0, emptyList(), cityNotices),

        /**
         * A street traced on OpenStreetMap: its line, "No riding 12:00–23:00", and at the foot its credit, the whole
         * "Seoul, lines © OpenStreetMap" linked (UI-410).
         */
        CreditedStreet(ScooterZoneState.Off, 0, creditedStreet),

        /** A street at all hours: its kind alone, and at the foot "Antalya UKOME, lines © OpenStreetMap" (UI-411). */
        StreetAtAllHours(ScooterZoneState.Off, 0, boulevard),
        ;

        val suffix: String get() = name.replaceFirstChar { it.lowercase() }
    }

    @Before
    fun setUp() {
        Locale.setDefault(Locale.forLanguageTag("en-CH"))
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        controllers.close()
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
    }

    @Test
    fun legend() {
        useFontScale(look.fontScale)
        compose.setContent {
            ScootTheme(dark = look.dark, reduceMotion = true) {
                Box(Modifier.fillMaxSize().background(standIn(look.dark))) {
                    Box(
                        Modifier.testTag(LEGEND).background(standIn(look.dark)).padding(8.dp).width(ROOM),
                        contentAlignment = Alignment.BottomStart,
                    ) {
                        ZoneLegend(state = case.state, count = case.count, rules = case.rules, notices = case.notices)
                    }
                }
            }
        }
        compose.waitForIdle()
        compose.drawWindowAgain()
        compose.onNodeWithTag(LEGEND)
            .captureRoboImage("src/test/screenshots/zones/${case.suffix}_${look.suffix}.png", roborazziOptions = screenshotOptions)
    }

    companion object {
        private const val LEGEND = "legend"

        /** What the iPhone's 390 points leave the legend beside Near me, at font scale 1.0. */
        private val ROOM = 216.dp

        /** A street of Seoul forbidden at night, in force, and a district's by day, not at this hour. */
        private val seoulRules = listOf(
            CityRuleZone.Shown(rule("seoul", "Seoul", listOf(CityRuleZone.Hours(fromMinute = 22 * 60, untilMinute = 6 * 60))), inForce = true),
            CityRuleZone.Shown(rule("gangnam", "Gangnam-gu", listOf(CityRuleZone.Hours(fromMinute = 9 * 60, untilMinute = 18 * 60 + 30))), inForce = false),
        )

        /** One of Seoul's streets, its lines traced on OpenStreetMap, in force (UI-410). */
        private val creditedStreet = listOf(
            CityRuleZone.Shown(
                rule("seoul-credited", "Seoul, lines © OpenStreetMap", listOf(CityRuleZone.Hours(fromMinute = 12 * 60, untilMinute = 23 * 60))),
                inForce = true,
            ),
        )

        /** Antalya's boulevard, its lines traced on OpenStreetMap, at all hours (UI-411). */
        private val boulevard = listOf(
            CityRuleZone.Shown(
                CityRuleZone(
                    id = "antalya-boulevard",
                    authority = "Antalya UKOME, lines © OpenStreetMap",
                    timeZone = "Europe/Istanbul",
                    firstDay = "2025-09-30",
                    hours = emptyList(),
                    source = "https://example.com/antalya",
                    lines = listOf(listOf(GeoPoint(36.8602, 30.9200), GeoPoint(36.8658, 30.9234))),
                ),
                inForce = true,
            ),
        )

        /** Bergen's zones, one of each kind and a second parking place, named once. */
        private val bergenZones = listOf(
            ScooterZoneKind.Parking, ScooterZoneKind.Slow, ScooterZoneKind.NoParking, ScooterZoneKind.NoRide, ScooterZoneKind.Parking,
        ).mapIndexed { index, kind ->
            CityRuleZone.Shown(zone("bergen-$index", "Bergen kommune", "Europe/Oslo", kind, GeoPoint(60.39, 5.32)), inForce = true)
        }

        /** Berlin's zones on their way, and Hamburg's unavailable. */
        private val cityNotices = listOf(
            CityZoneDownloads.Notice(download("berlin", "Berlin"), CityZoneDownloads.Notice.State.Loading),
            CityZoneDownloads.Notice(download("hamburg", "Hamburg"), CityZoneDownloads.Notice.State.Unavailable),
        )

        private fun download(id: String, place: String) = CityZoneDownload(
            id = id, place = place, authority = place, timeZone = "Europe/Berlin", source = "https://example.com/$id",
            bounds = GeoBounds(south = 52.5, west = 13.3, north = 52.6, east = 13.5),
        )

        /** Two of Porto's parking places, named once. */
        private val portoZones = (0..1).map { index ->
            CityRuleZone.Shown(zone("porto-$index", "Porto", "Europe/Lisbon", ScooterZoneKind.Parking, GeoPoint(41.147, -8.611)), inForce = true)
        }

        /** A square of 0.0001° a side at [at]. */
        private fun zone(id: String, authority: String, timeZone: String, kind: ScooterZoneKind, at: GeoPoint) = CityRuleZone(
            id = id,
            authority = authority,
            timeZone = timeZone,
            kind = kind,
            source = "https://example.com/${id.substringBefore('-')}",
            ring = listOf(
                at, GeoPoint(at.latitude, at.longitude + 0.0001), GeoPoint(at.latitude + 0.0001, at.longitude + 0.0001),
                GeoPoint(at.latitude + 0.0001, at.longitude), at,
            ),
        )

        private fun rule(id: String, authority: String, hours: List<CityRuleZone.Hours>) = CityRuleZone(
            id = id,
            authority = authority,
            timeZone = "Asia/Seoul",
            firstDay = "2026-05-01",
            hours = hours,
            source = "https://example.com/$id",
            lines = listOf(listOf(GeoPoint(37.5665, 126.978), GeoPoint(37.5675, 126.979))),
        )

        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0} {1}")
        fun parameters(): List<Array<Any>> = Case.entries.flatMap { case -> Look.entries.map { arrayOf(case, it) } }
    }
}

/** The legend in its place, at the foot of the screen beside the locate button, Zürich's zones on. */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = PHONE)
class ZoneLegendInPlaceScreenshotTest(private val look: Look) {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()

    @Before
    fun setUp() {
        Locale.setDefault(Locale.forLanguageTag("en-CH"))
        ScooterLanguage.current = ScooterLanguage.En
    }

    @After
    fun tearDown() {
        controllers.close()
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        Locale.setDefault(locale)
    }

    @Test
    fun legendInPlace() {
        val clock = TestClock()
        val api = ZonedAPI(
            StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "a", provider = "voi", latitude = 47.3772, longitude = 8.5421)))),
            zones = listOf(
                zurichZone("slow", ScooterZoneKind.Slow, 0.0),
                zurichZone("parking", ScooterZoneKind.NoParking, 0.002),
                zurichZone("riding", ScooterZoneKind.NoRide, 0.004),
            ),
        )
        val model = controllers.make(api, clock)
        model.updateViewport(zurichRegion, zoom = 16)
        model.setShowsZones(true)
        assertTrue(controllers.waitUntil { api.zoneCalls == 1 && model.zoneState.value == ScooterZoneState.Shown && !model.isLoading.value })
        assertEquals(3, model.mapZones.value.size)
        assertEquals(emptyList<CityRuleZone.Shown>(), model.mapRuleZones.value)
        model.setAppearance(if (look.dark) ScooterAppearance.Dark else ScooterAppearance.Light)
        useFontScale(look.fontScale)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = { dark -> Box(Modifier.fillMaxSize().background(standIn(dark))) }, glassBlurs = false)
            }
        }
        compose.waitForIdle()
        compose.screenshot("zones/inPlace_${look.suffix}")
    }

    companion object {
        /** A square of 0.002° a side in Zürich's centre, `east` east of it. */
        private fun zurichZone(id: String, kind: ScooterZoneKind, east: Double): ScooterZone {
            val (lat, lon) = 47.3760 to 8.5400 + east
            val ring = listOf(
                GeoPoint(lat, lon), GeoPoint(lat, lon + 0.002), GeoPoint(lat + 0.002, lon + 0.002), GeoPoint(lat + 0.002, lon), GeoPoint(lat, lon),
            )
            return ScooterZone(id = id, provider = "voi", kind = kind, polygons = listOf(listOf(ring)))
        }

        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0}")
        fun parameters(): List<Array<Any>> = Look.entries.map { arrayOf(it) }
    }
}

/** The map's ground, light or dark, without its streets. */
private fun standIn(dark: Boolean): Color = if (dark) Color(0xFF2B2D30) else Color(0xFFF1EFEA)

/** The stub's scooters, and the zones it is given for any area. */
private class ZonedAPI(private val scooters: StubScooterAPI, private val zones: List<ScooterZone>) : ScooterAPIClient by scooters {
    var zoneCalls = 0
        private set

    override suspend fun zonesIn(area: ScooterZoneArea): ScooterZoneResponse {
        zoneCalls += 1
        return ScooterZoneResponse(zones = zones, pending = false, truncated = false)
    }
}

/**
 * The legend in its place on ScootRadar_Phone_Min, beside "Near me" before the first location, naming every kind:
 * Zürich's operators' slow zones at 6 km/h, their no-parking and no-riding zones, and a city's parking places. In the
 * languages whose names run longest, at font scale 1.0 and 1.3: a name longer than its room wraps whole, where it read
 * "Stationnement int…" (briefs/app-aq.md, 4). And once [located], beside the round locate button, where in Portuguese
 * at 1.3 the slow zones' name wraps before its speed, where it broke inside it ("6 km/" over "h").
 */
@RunWith(ParameterizedRobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "w360dp-h640dp-xhdpi")
class ZoneLegendLongLabelsScreenshotTest(private val language: String, private val fontScale: Float, private val located: Boolean) {
    @get:Rule
    val compose = createComposeRule()

    private val controllers = TestControllers()
    private val locale = Locale.getDefault()
    private val launchLocale = ScooterLanguage.launchLocale

    @After
    fun tearDown() {
        controllers.close()
        resetFontScale()
        ScooterLanguage.current = ScooterLanguage.atLaunch
        ScooterLanguage.launchLocale = launchLocale
        Locale.setDefault(locale)
    }

    @Test
    fun longLabels() {
        val region = Locale.forLanguageTag(language)
        ScooterLanguage.launchLocale = { region }
        ScooterLanguage.current = checkNotNull(ScooterLanguage.fromRawValue(region.language))
        Locale.setDefault(region)
        val clock = TestClock()
        val api = ZonedAPI(
            StubScooterAPI(ScooterResponse(vehicles = listOf(scooter(id = "a", provider = "voi", latitude = 47.3772, longitude = 8.5421)))),
            zones = listOf(
                zurichZone("slow", ScooterZoneKind.Slow, 0.0, maxSpeedKph = 6.0),
                zurichZone("parking", ScooterZoneKind.NoParking, 0.002),
                zurichZone("riding", ScooterZoneKind.NoRide, 0.004),
            ),
        )
        val places = CityRuleZone(
            id = "zurich-parking",
            authority = "Stadt Zürich",
            timeZone = "Europe/Zurich",
            kind = ScooterZoneKind.Parking,
            source = "https://example.com/zurich",
            ring = listOf(
                GeoPoint(47.3765, 8.5430), GeoPoint(47.3765, 8.5432), GeoPoint(47.3767, 8.5432), GeoPoint(47.3767, 8.5430),
                GeoPoint(47.3765, 8.5430),
            ),
        )
        val catalog = (TestCatalog.catalog as ScooterCatalog.Listed).copy(ruleZones = listOf(places))
        val model = controllers.make(api, clock, catalog = catalog)
        if (located) {
            model.locationsUpdated(listOf(ScooterLocationFix(GeoPoint(47.3769, 8.5417), horizontalAccuracy = 5.0, timestamp = Instant.now())))
            assertTrue(controllers.waitUntil { model.hasLocatedOnce.value })
        }
        model.updateViewport(zurichRegion, zoom = 16)
        model.setShowsZones(true)
        assertTrue(
            controllers.waitUntil {
                model.zoneState.value == ScooterZoneState.Shown && model.mapRuleZones.value.isNotEmpty() && !model.isLoading.value
            },
        )
        useFontScale(fontScale)
        compose.setContent {
            CompositionLocalProvider(LocalClock provides { clock.now }) {
                ScooterMapScreen(controller = model, map = { dark -> Box(Modifier.fillMaxSize().background(standIn(dark))) }, glassBlurs = false)
            }
        }
        compose.waitForIdle()
        val scale = if (fontScale == 1f) "1.0" else fontScale.toString()
        val legend = compose.onNodeWithTag(ZONE_LEGEND_TAG)
        // Beside the round button, the row's 340 less its 64 and the gap between them.
        if (located) assertTrue("the legend beside the button", legend.getUnclippedBoundsInRoot().let { it.right - it.left } < 280.dp)
        legend.captureRoboImage(
            "src/test/screenshots/zones/longLabels_${language}_$scale${if (located) "_located" else ""}.png",
            roborazziOptions = screenshotOptions,
        )
    }

    companion object {
        /** A square of 0.002° a side in Zürich's centre, `east` east of it. */
        private fun zurichZone(id: String, kind: ScooterZoneKind, east: Double, maxSpeedKph: Double? = null): ScooterZone {
            val (lat, lon) = 47.3760 to 8.5400 + east
            val ring = listOf(
                GeoPoint(lat, lon), GeoPoint(lat, lon + 0.002), GeoPoint(lat + 0.002, lon + 0.002), GeoPoint(lat + 0.002, lon), GeoPoint(lat, lon),
            )
            return ScooterZone(id = id, provider = "voi", kind = kind, maxSpeedKph = maxSpeedKph, polygons = listOf(listOf(ring)))
        }

        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0} {1} {2}")
        fun parameters(): List<Array<Any>> =
            listOf("fr-CH", "pt-PT").flatMap { language -> listOf(1f, 1.3f).map { arrayOf<Any>(language, it, false) } } +
                listOf(arrayOf<Any>("pt-PT", 1.3f, true))
    }
}
