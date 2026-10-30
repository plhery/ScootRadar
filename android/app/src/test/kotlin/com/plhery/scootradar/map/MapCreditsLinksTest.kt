package com.plhery.scootradar.map

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.platform.UriHandler
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
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
}
