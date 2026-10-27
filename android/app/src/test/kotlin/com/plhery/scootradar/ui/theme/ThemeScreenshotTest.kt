package com.plhery.scootradar.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.After
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** The tokens of ui.md §10 drawn side by side: the colours, the type, the corners, the shadows and the symbols. */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = PHONE)
class ThemeScreenshotTest {
    @get:Rule
    val compose = createComposeRule()

    @After
    fun tearDown() {
        resetFontScale()
    }

    @Test
    fun tokensLight() = tokens(Look.Light)

    @Test
    fun tokensDark() = tokens(Look.Dark)

    @Test
    fun tokensLightLargeText() = tokens(Look.LightLargeText)

    @Test
    fun tokensDarkLargeText() = tokens(Look.DarkLargeText)

    private fun tokens(look: Look) {
        useFontScale(look.fontScale)
        compose.setContent { ScootTheme(dark = look.dark, reduceMotion = true) { TokenSheet() } }
        compose.screenshot("theme/tokens_${look.suffix}")
    }
}

@Composable
private fun TokenSheet() {
    val colors = scootColors
    Column(
        Modifier.fillMaxWidth().background(colors.dockGround).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            listOf(
                colors.actionFill, colors.actionText, colors.warning, colors.good, colors.critical, colors.criticalFill,
                colors.secondaryText, colors.dockText, colors.dockSecondary, colors.dockQuiet, colors.dockRaised,
                colors.dockTile, colors.dockQuietFill, colors.dockHairline, colors.cardActionFill, colors.accent,
            ).forEach { Box(Modifier.size(28.dp).clip(SquircleShape(8.dp)).background(it).hairline(SquircleShape(8.dp), colors.dockHairline)) }
        }
        Text("Finding scooters…", style = ScootType.subheadline.weight(IosWeight.semibold))
        Text("These positions are out of date", style = ScootType.headline)
        Text("Updated 12:04 · 1,234 scooters", style = ScootType.caption.monospacedDigit(), color = colors.secondaryText)
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("240", style = designFont(38f, IosWeight.black, tracking = -1.5f, tabular = true))
            Text("m", style = designFont(25f, IosWeight.black, tracking = -1f))
            Text("Lime", style = designFont(19f, IosWeight.heavy, tracking = -0.38f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            listOf(12, 16, 28).forEach { radius ->
                Box(
                    Modifier.size(64.dp, 48.dp)
                        .iosShadow(SquircleShape(radius.dp), Color.Black.copy(alpha = if (colors.isDark) 0.3f else 0.1f), 16.dp, y = 10.dp)
                        .clip(SquircleShape(radius.dp))
                        .background(colors.dockRaised),
                )
            }
            Box(Modifier.size(64.dp, 34.dp).clip(CapsuleShape).background(colors.criticalFill))
        }
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf(
                Symbols.warning, Symbols.warningFill, Symbols.moonFill, Symbols.calendar, Symbols.scooter, Symbols.clock,
                Symbols.hourglass, Symbols.map, Symbols.filter, Symbols.refresh, Symbols.close, Symbols.chevronRight,
                Symbols.check, Symbols.unfold, Symbols.ticketFill, Symbols.info, Symbols.locationFill,
                Symbols.locationSlash, Symbols.walk, Symbols.checkCircleFill, Symbols.questionCircle, Symbols.mapPin,
            ).forEach { Icon(it, contentDescription = null, tint = colors.dockText, modifier = Modifier.size(20.dp)) }
        }
    }
}
