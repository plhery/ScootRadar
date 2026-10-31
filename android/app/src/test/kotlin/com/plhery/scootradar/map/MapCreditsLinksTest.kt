package com.plhery.scootradar.map

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.platform.UriHandler
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.click
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

// X.md X-AD37, MAP-318: the map's credits where the iPhone shows Apple's logo and its Legal link, as OpenStreetMap's
// licence (ODbL) and OpenFreeMap ask; MapLibre's own logo and attribution button are off (ScooterMap), and
// MapInTheWindowTest finds the credits on the device's map.

@RunWith(AndroidJUnit4::class)
class MapCreditsLinksTest {
    @get:Rule
    val compose = createComposeRule()

    /** Each name is a button that opens its page: OpenStreetMap's copyright and OpenFreeMap's. */
    @Test
    fun eachCreditOpensItsPage() {
        val opened = mutableListOf<String>()
        compose.setContent {
            val browser = object : UriHandler {
                override fun openUri(uri: String) {
                    opened += uri
                }
            }
            CompositionLocalProvider(LocalUriHandler provides browser) { MapCredits(dark = false) }
        }
        for (name in listOf("© OpenStreetMap", "OpenFreeMap © OpenMapTiles")) {
            compose.onNodeWithText(name).assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Button)).performClick()
        }
        assertEquals(listOf("https://www.openstreetmap.org/copyright", "https://openfreemap.org/"), opened)
    }

    /**
     * Out of sight they take no touch: a tap or a pan that starts on them reaches the map under them, as MapKit's Legal
     * is never an invisible target (review-app-yz finding 2). Seen, the same tap opens the credit's page.
     */
    @Test
    fun outOfSightATapOnThemReachesTheMap() {
        var seen by mutableStateOf(true)
        var mapTaps = 0
        val opened = mutableListOf<String>()
        compose.setContent {
            val browser = object : UriHandler {
                override fun openUri(uri: String) {
                    opened += uri
                }
            }
            CompositionLocalProvider(LocalUriHandler provides browser) {
                Box(Modifier.size(300.dp, 200.dp).testTag("map")) {
                    Box(Modifier.fillMaxSize().clickable { mapTaps += 1 })
                    MapCredits(dark = false, seen = seen, modifier = Modifier.align(Alignment.BottomStart))
                }
            }
        }
        // On OpenStreetMap's name, the first, near the map's foot.
        val map = compose.onNodeWithTag("map")
        map.performTouchInput { click(Offset(20.dp.toPx(), height - 9.dp.toPx())) }
        assertEquals(listOf("https://www.openstreetmap.org/copyright"), opened)
        assertEquals(0, mapTaps)

        seen = false
        compose.waitForIdle()
        map.performTouchInput { click(Offset(20.dp.toPx(), height - 9.dp.toPx())) }
        assertEquals("Out of sight, the map has the tap", 1, mapTaps)
        assertEquals(1, opened.size)
    }
}
