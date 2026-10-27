package com.plhery.scootradar.ui

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.snap
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.max
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.api.ScooterLoadFailure
import com.plhery.scootradar.core.model.ScooterLoadIssue
import com.plhery.scootradar.core.model.ScooterLocationIssue
import com.plhery.scootradar.core.model.UserInterfaceStyle
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.ui.chrome.FloatingMapControls
import com.plhery.scootradar.ui.chrome.LocationIssueCard
import com.plhery.scootradar.ui.chrome.MapStatusBanner
import com.plhery.scootradar.ui.dock.ScooterControlDock
import com.plhery.scootradar.ui.glass.Glass
import com.plhery.scootradar.ui.glass.LocalGlass
import com.plhery.scootradar.ui.glass.MapBackdrop
import com.plhery.scootradar.ui.glass.glassMayBlur
import com.plhery.scootradar.ui.theme.LocalReduceMotion
import com.plhery.scootradar.ui.theme.ScootTheme
import com.plhery.scootradar.ui.theme.SelectionFeedback
import com.plhery.scootradar.ui.theme.TextSize
import com.plhery.scootradar.ui.theme.animation

// ios/ScootRadar/Views/ScooterMapScreen.swift: the screen around the map, and a phone's chrome over it (dockChrome,
// ui.md UI-004 to UI-006). The search bar is app-d's; its place is kept.

/** The app's one screen: the map, edge to edge, the chrome over it, and the window's appearance. */
@Composable
fun ScooterMapScreen(
    controller: ScooterMapController,
    /** The map itself, dark or light; tests put something plain in its place. */
    map: @Composable (dark: Boolean) -> Unit,
    /** Whether the glass may blur the map; tests choose. */
    glassBlurs: Boolean = glassMayBlur(),
) {
    val appearance by controller.appearance.collectAsStateWithLifecycle()
    val userLocation by controller.userLocation.collectAsStateWithLifecycle()
    val minute by everyMinute()
    // Automatic turns dark or light within the minute the sun has it.
    val style = remember(appearance, userLocation, minute) { controller.interfaceStyle }
    WindowAppearance(style)
    // The app's own appearance at once, rather than the window's once Android has applied it (MAP-291).
    val dark = when (style) {
        UserInterfaceStyle.Dark -> true
        UserInterfaceStyle.Light -> false
        UserInterfaceStyle.Unspecified -> isSystemInDarkTheme()
    }

    val context = LocalContext.current
    // The frame the map draws into, which the glass blurs.
    val backdrop = remember { MapBackdrop(context) }

    ScootTheme(dark = dark) {
        CompositionLocalProvider(LocalGlass provides Glass(backdrop, glassBlurs)) {
            Box(Modifier.fillMaxSize()) {
                map(dark)
                DockChrome(controller)
            }
        }
    }
}

/**
 * A phone's chrome: the search bar and its notices at the top, the dock at the bottom, and the locate button above
 * the dock. Made anew in another language, as much of it is text written when it was drawn.
 */
@Composable
private fun DockChrome(controller: ScooterMapController) {
    val language by controller.language.collectAsStateWithLifecycle()
    val selectedScooter by controller.selectedScooterID.collectAsStateWithLifecycle()
    val selectedParking by controller.selectedParkingID.collectAsStateWithLifecycle()
    val loadIssue by controller.loadIssue.collectAsStateWithLifecycle()
    val locationIssue by controller.locationIssue.collectAsStateWithLifecycle()
    // Only a first load that failed is reported under the search bar; later failures are the dock's to report.
    val firstLoadFailure = (loadIssue as? ScooterLoadIssue.FirstLoadFailed)?.failure
    SelectionFeedback(selectedScooter)
    SelectionFeedback(selectedParking)

    val density = LocalDensity.current
    val dockHeight = remember { mutableIntStateOf(with(density) { 128.dp.roundToPx() }) }
    val locateButtonHeight = remember { mutableIntStateOf(with(density) { 52.dp.roundToPx() }) }
    val safe = WindowInsets.safeDrawing.asPaddingValues()
    val safeTop = safe.calculateTopPadding()
    val safeBottom = safe.calculateBottomPadding()
    // The room under the home indicator, or 8 where there is none.
    val bottom = max(safeBottom, 8.dp)

    key(language) {
        BoxWithConstraints(Modifier.fillMaxSize()) {
            // Measured inside the safe area, as the iPhone's GeometryReader is.
            val height = maxHeight - safeTop - safeBottom
            val dock = with(density) { dockHeight.intValue.toDp() }
            val locate = with(density) { locateButtonHeight.intValue.toDp() }
            val notices = firstLoadFailure != null || locationIssue != null

            TopStack(
                controller,
                failure = firstLoadFailure,
                locationIssue = locationIssue,
                noticesLimit = max(64.dp, height - 8.dp - SEARCH_BAR_HEIGHT - 8.dp - 8.dp - locate - (dock + bottom + 10.dp)),
                modifier = Modifier.padding(top = safeTop + 8.dp, start = 12.dp, end = 12.dp),
            )

            Row(
                Modifier
                    .align(Alignment.BottomCenter)
                    .padding(horizontal = 10.dp)
                    .widthIn(max = 560.dp)
                    .fillMaxWidth()
                    .padding(end = 2.dp)
                    .padding(bottom = dock + bottom + 10.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.Bottom,
            ) {
                Spacer(Modifier.weight(1f))
                FloatingMapControls(controller, Modifier.onSizeChanged { locateButtonHeight.intValue = it.height })
            }

            val isAccessibility = TextSize.isAccessibility
            ScooterControlDock(
                controller,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(horizontal = 10.dp)
                    .padding(bottom = bottom),
                maximumContentHeight = max(
                    160.dp,
                    height - (if (isAccessibility) 300.dp else 220.dp) -
                        // With large text a notice under the search bar needs room too.
                        (if (isAccessibility && notices) 120.dp else 0.dp),
                ),
                onHeightChange = { dockHeight.intValue = it },
            )
        }
    }
}

/** The collapsed search bar's height before it is measured, as on the iPhone; the bar itself is app-d's. */
private val SEARCH_BAR_HEIGHT: Dp = 62.dp

/**
 * The search bar and what sits under it: the banner of a first load that failed, and the card of a location that
 * could not be found. With large text they can be taller than the room above the locate button; then they scroll.
 */
@Composable
private fun TopStack(
    controller: ScooterMapController,
    failure: ScooterLoadFailure?,
    locationIssue: ScooterLocationIssue?,
    noticesLimit: Dp,
    modifier: Modifier = Modifier,
) {
    val isLoading by controller.isLoading.collectAsStateWithLifecycle()
    // What a banner or a card said stays on it while it goes.
    val lastFailure = rememberLast(failure)
    val lastIssue = rememberLast(locationIssue)
    val context = LocalContext.current
    val spring = IosMotion.snappy(duration = 0.28)
    val reduceMotion = LocalReduceMotion.current
    val enter = if (reduceMotion) fadeIn(snap()) else slideInVertically(spring.animation()) { -it } + fadeIn(spring.animation())
    val exit = if (reduceMotion) fadeOut(snap()) else slideOutVertically(spring.animation()) { -it } + fadeOut(spring.animation())

    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        // The search island's place (app-d).
        Spacer(Modifier.height(SEARCH_BAR_HEIGHT))

        Column(
            Modifier.heightIn(max = noticesLimit).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            AnimatedVisibility(failure != null, enter = enter, exit = exit) {
                val shown = lastFailure ?: return@AnimatedVisibility
                MapStatusBanner(
                    message = shown.message,
                    actionTitle = localized("Try again"),
                    onAction = controller::retryLoad,
                    isBusy = isLoading,
                )
            }
            AnimatedVisibility(locationIssue != null, enter = enter, exit = exit) {
                val issue = lastIssue ?: return@AnimatedVisibility
                LocationIssueCard(
                    issue = issue,
                    onOpenSettings = { context.startActivity(appSettings(context.packageName)) },
                    // Searching is the answer to the card, so it goes away; the search opens with app-d's island.
                    onSearchPlace = controller::dismissLocationIssue,
                    onRetry = controller::focusOnUser,
                    onDismiss = controller::dismissLocationIssue,
                )
            }
        }
    }
}

/** The last value that was not null. */
@Composable
private fun <T : Any> rememberLast(value: T?): T? {
    val last = remember { mutableStateOf(value) }
    if (value != null) last.value = value
    return last.value
}

/** The app's page in Android's Settings, where its location permission is. */
private fun appSettings(packageName: String) = Intent(
    Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
    Uri.fromParts("package", packageName, null),
).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
