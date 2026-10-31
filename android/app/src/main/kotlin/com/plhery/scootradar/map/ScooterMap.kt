package com.plhery.scootradar.map

import android.content.ComponentCallbacks2
import android.content.res.Configuration
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.displayCutout
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.systemBars
import androidx.compose.foundation.layout.union
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.graphics.toColorInt
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.plhery.scootradar.core.api.ScooterAnalytics
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterChromeLayout
import com.plhery.scootradar.core.model.ScooterMapStart
import com.plhery.scootradar.core.model.ScooterScreenshotCamera
import com.plhery.scootradar.core.model.ScreenRect
import com.plhery.scootradar.ui.glass.LocalGlass
import com.plhery.scootradar.ui.theme.scootColors
import com.plhery.scootradar.ui.windowSizeClasses
import org.maplibre.android.MapLibre
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.maps.MapLibreMapOptions

// ScooterMapView's makeUIView, from ios/ScootRadar/Views/ScooterMapView.swift.

/**
 * The map's safe area: the system's bars and the display's cutout, not the keyboard. The iPhone's map ignores the safe
 * area (ScooterMapScreen.swift:95) on a screen that ignores the keyboard's at its foot (:110), so MKMapView's own safe
 * area has no keyboard: the camera frames a region or a route and makes a move to a place as with the keyboard down,
 * the keyboard going down moves nothing, and Apple's Legal stays in the map's margins, under the keyboard. In
 * safeDrawing, which counts it, a cluster tapped beside a tablet's panel with the search's keyboard up opened about 0.7
 * levels less close than on the iPad, a place picked on a phone was moved again 100 ms after each step of the keyboard
 * going down, and the credits rose to 8 over it wherever the dock did not place them (review-app-ad (a)).
 */
internal val mapSafeArea: WindowInsets
    @Composable get() = WindowInsets.systemBars.union(WindowInsets.displayCutout)

/** [mapSafeArea] in the map's points, as its camera and its markers take it. */
@Composable
internal fun mapSafeInsets(): MapInsets {
    val density = LocalDensity.current
    val direction = LocalLayoutDirection.current
    val safe = mapSafeArea
    val points = density.density.toDouble()
    return MapInsets(
        top = safe.getTop(density) / points,
        left = safe.getLeft(density, direction) / points,
        bottom = safe.getBottom(density) / points,
        right = safe.getRight(density, direction) / points,
    )
}

/**
 * The camera the map last came to rest on, which a recreated activity opens on, the requests it has taken and the
 * route it has shown. The view model keeps it, so it goes with the process: a new launch opens at the start place,
 * as the iPhone's does (X-AD18).
 */
class MapCameraMemory {
    /** Where the map came to rest, or where the camera's own move under way lands: the iPhone's goes on to it. */
    var position: CameraPosition? = null

    /**
     * The last focus and zoom step taken. The iPhone's map lives as long as its screen and takes each token once;
     * a recreated map must not take the controller's last request again.
     */
    var focusToken: Int? = null
    var zoomToken: Int? = null

    /**
     * The route the map has shown, fitted and drawn: the iPhone's fits a route once, as it is found, so a recreated
     * map shows it as it is, neither fitting it again nor drawing it again.
     */
    var trailRevision: Int? = null
}

/**
 * The map, under everything else on the screen: MapLibre's view in TextureView mode, so that the chrome can blur
 * what is under it, without its attribution, logo or compass, which the app draws itself. The composition's
 * lifecycle drives the view by hand, and a phone short of memory has it drop its caches. It moves to the places
 * the controller asks for, and tells it where it comes to rest. Its ground is the controller's map style, dark
 * or light as the app is, with names in the app's language; on it, the controller's zones and the walk's trail;
 * over it, the controller's scooters and bays.
 */
@Composable
fun ScooterMap(
    controller: ScooterMapController,
    start: ScooterMapStart,
    memory: MapCameraMemory,
    tiles: GroundTiles,
    dark: Boolean,
    modifier: Modifier = Modifier,
    /** Imagery for the Satellite style; none yet (NEEDS-USER #3). */
    imagery: SatelliteSource? = null,
    /** A debug build's camera for screenshots, in place of the start place. */
    screenshot: ScooterScreenshotCamera.Camera? = null,
    /** Where the taps on bays go, as the iPhone's map tracks parking_select. */
    analytics: ScooterAnalytics? = null,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val mapStyle by controller.mapStyle.collectAsStateWithLifecycle()
    val language by controller.language.collectAsStateWithLifecycle()
    val look = GroundLook.of(mapStyle, dark, language.rawValue, hasImagery = imagery != null)
    // MapKit's camera stands closer on an iPad's map than on an iPhone's.
    val mapKit = windowSizeClasses().mapKit
    val view = remember {
        MapLibre.getInstance(context)
        val options = MapLibreMapOptions.createFromAttributes(context)
            .textureMode(true)
            .attributionEnabled(false)
            .logoEnabled(false)
            .compassEnabled(false)
            // The land, until the style is drawn.
            .foregroundLoadColor(GroundPalettes.of(look.theme).land.toColorInt())
            .minZoomPreference(MapZoom.minimum)
            .maxZoomPreference(MapZoom.maximum)
            .camera(memory.position ?: MapCamera.opening(start, mapKit, screenshot))
        ScooterMapView(context, options).also { it.onCreate(null) }
    }
    val currentLook by rememberUpdatedState(look)
    val currentMapKit by rememberUpdatedState(mapKit)
    var camera by remember { mutableStateOf<MapCamera?>(null) }
    var ground by remember { mutableStateOf<MapGround?>(null) }
    var markers by remember { mutableStateOf<ScooterMarkers?>(null) }
    var rider by remember { mutableStateOf<ScooterRider?>(null) }
    var zones by remember { mutableStateOf<ScooterZoneLayer?>(null) }
    var trail by remember { mutableStateOf<WalkTrailLayer?>(null) }
    var watch by remember { mutableStateOf<MapCameraWatch?>(null) }
    DisposableEffect(view) {
        var made: MapCamera? = null
        var drawn: MapGround? = null
        var marked: ScooterMarkers? = null
        var shown: ScooterRider? = null
        var zoned: ScooterZoneLayer? = null
        var trailed: WalkTrailLayer? = null
        var watching: MapCameraWatch? = null
        view.getMapAsync { map ->
            drawn = MapGround(map, currentLook, tiles, imagery, scope).also { ground = it }
            val moving = MapCamera(map, view, controller, memory, scope).also {
                it.mapKit = currentMapKit
                made = it
                camera = it
                view.camera = it
            }
            // On the ground, under the markers' layers, whichever comes first.
            val zoning = ScooterZoneLayer(map, view, controller, scope).also { zoned = it; zones = it }
            val walking = WalkTrailLayer(map, view, controller, memory, scope, fit = { moving.show(it) }).also { trailed = it; trail = it }
            // The trail first, as the iPhone's regionDidChange has it.
            moving.rested = { animated ->
                walking.mapDidRest(animated)
                zoning.mapDidRest()
            }
            marked = ScooterMarkers(map, view, controller, analytics, scope, move = { moving.show(it) }).also {
                markers = it
                view.markers = it
            }
            // After the markers, whose layers it goes above.
            shown = ScooterRider(map, view, controller, scope).also { rider = it }
            watching = MapCameraWatch(map).also { watch = it }
        }
        onDispose {
            made?.close()
            view.camera = null
            view.markers = null
            drawn?.close()
            marked?.close()
            shown?.close()
            zoned?.close()
            trailed?.close()
            watching?.close()
            camera = null
            ground = null
            markers = null
            rider = null
            zones = null
            trail = null
            watch = null
        }
    }
    // Each update of the map by the screen, as SwiftUI's updateUIView: a screen at rest makes none (MAP-246).
    SideEffect { camera?.let { it.updates += 1 } }
    LaunchedEffect(ground, look) { ground?.show(look) }
    LaunchedEffect(camera, mapKit) { camera?.mapKit = mapKit }
    LaunchedEffect(markers, dark, look.satellite) { markers?.setDark(dark || look.satellite) }
    LaunchedEffect(zones, dark, look.satellite) { zones?.setDark(dark || look.satellite) }
    LaunchedEffect(trail, dark, look.satellite) { trail?.setDark(dark || look.satellite) }
    // The dot is the app's blue, whatever the ground.
    // With Increase Contrast, as the rest of the app follows it (ui.md UI-186, MAP-192).
    val highContrast = scootColors.isContrastIncreased
    LaunchedEffect(rider, dark, highContrast) { rider?.setLook(RiderArt.Look(dark = dark, highContrast = highContrast)) }
    val density = LocalDensity.current
    val direction = LocalLayoutDirection.current
    val points = density.density.toDouble()
    val safeArea = mapSafeInsets()
    val focus by controller.focusRequest.collectAsStateWithLifecycle()
    val zoom by controller.zoomRequest.collectAsStateWithLifecycle()
    LaunchedEffect(camera, safeArea) { camera?.safeAreaDidChange(safeArea) }
    LaunchedEffect(markers, safeArea) { markers?.safeAreaDidChange(safeArea) }
    // The chrome over the map, as the screen measures it: the map keeps its names and the places it shows clear of it.
    val chrome = LocalMapChrome.current
    LaunchedEffect(camera, markers, chrome) {
        if (chrome == null) return@LaunchedEffect
        // The camera reads it as the map takes a new size, which comes before the flow hears of the new chrome.
        camera?.currentChrome = { chrome.chrome }
        snapshotFlow { chrome.chrome }.collect {
            camera?.chromeDidChange(it)
            markers?.chromeDidChange(it)
        }
    }
    LaunchedEffect(camera, focus) { camera?.applyFocus(focus) }
    LaunchedEffect(camera, zoom) { camera?.applyZoom(zoom) }
    // A scooter or bay chosen beside a panel is brought out from under it.
    val selectedScooter by controller.selectedScooterID.collectAsStateWithLifecycle()
    val selectedParking by controller.selectedParkingID.collectAsStateWithLifecycle()
    LaunchedEffect(camera, selectedScooter, selectedParking) { camera?.keepSelectionClearOfPanel() }
    // Beside a panel or a fold the credits sit past it, in the map's margins, as Apple's logo does: read only as the
    // panel's sides and the fold move, not as its card grows.
    val panelSides by remember(chrome) {
        derivedStateOf {
            chrome?.takeIf { it.layout == ScooterChromeLayout.Panel }?.panel?.takeIf { !it.isEmpty }?.let { it.minX to it.maxX }
        }
    }
    val fold by remember(chrome) { derivedStateOf { chrome?.fold?.takeIf { !it.isEmpty } } }
    // The zones' legend and the locate button in the corner beside a panel, which the credits go up over where they
    // would cover them.
    val corner by remember(chrome) {
        derivedStateOf { chrome?.takeIf { it.layout == ScooterChromeLayout.Panel }?.let { listOfNotNull(it.zoneLegend, it.locateButton) }.orEmpty() }
    }
    // The dock, and the legend and the locate button on it, which the credits go up over where the dock would cut them.
    val dock by remember(chrome) {
        derivedStateOf { chrome?.takeIf { it.layout == ScooterChromeLayout.Dock }?.dock }
    }
    val onDock by remember(chrome) {
        derivedStateOf { chrome?.takeIf { it.layout == ScooterChromeLayout.Dock }?.let { listOfNotNull(it.zoneLegend, it.locateButton) }.orEmpty() }
    }
    // The foot of the search bar and the notices under it over the dock, which the credits keep under.
    val chromeTop by remember(chrome) {
        derivedStateOf { chrome?.takeIf { it.layout == ScooterChromeLayout.Dock }?.top?.takeIf { !it.isEmpty }?.maxY }
    }
    var creditsSides by remember { mutableStateOf<Pair<Double, Double>?>(null) }
    var creditsHeight by remember { mutableDoubleStateOf(0.0) }
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    DisposableEffect(lifecycle, view) {
        // A new observer is brought up to the lifecycle's state at once: ON_CREATE, ON_START, ON_RESUME.
        var state = Lifecycle.State.CREATED
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_START -> view.onStart()
                Lifecycle.Event.ON_RESUME -> view.onResume()
                Lifecycle.Event.ON_PAUSE -> view.onPause()
                Lifecycle.Event.ON_STOP -> view.onStop()
                else -> Unit
            }
            state = event.targetState
        }
        val memoryCallbacks = object : ComponentCallbacks2 {
            override fun onTrimMemory(level: Int) {
                // The iPhone's memory warning: the phone short of memory, the app running or not. Going to the
                // background (UI_HIDDEN, BACKGROUND) is not one, and keeps the tiles for the return.
                @Suppress("DEPRECATION")
                if (level == ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW ||
                    level == ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL ||
                    level >= ComponentCallbacks2.TRIM_MEMORY_MODERATE
                ) {
                    view.onLowMemory()
                }
            }

            override fun onConfigurationChanged(newConfig: Configuration) = Unit

            @Deprecated("Deprecated in Java")
            override fun onLowMemory() = view.onLowMemory()
        }
        lifecycle.addObserver(observer)
        context.registerComponentCallbacks(memoryCallbacks)
        onDispose {
            lifecycle.removeObserver(observer)
            context.unregisterComponentCallbacks(memoryCallbacks)
            if (state.isAtLeast(Lifecycle.State.RESUMED)) view.onPause()
            if (state.isAtLeast(Lifecycle.State.STARTED)) view.onStop()
            view.onDestroy()
        }
    }
    // The chrome's glass blurs what the map draws (ui/glass).
    val backdrop = LocalGlass.current.backdrop
    BoxWithConstraints(modifier.fillMaxSize()) {
        AndroidView(factory = { backdrop?.hold(view) ?: view }, modifier = Modifier.fillMaxSize())
        // The pin's callout, once a tap has selected the pin, among the map's markers under its ornaments (MAP-270).
        markers?.let { shown -> shown.calloutTitle?.let { PinCallout(it, anchor = { shown.calloutAnchor }, dark = dark) } }
        // MapKit's compass and scale, which the app adds itself, at the top of the map's sides (MAP-021, MAP-022).
        val mapBounds = ScreenRect(0.0, 0.0, maxWidth.value.toDouble(), maxHeight.value.toDouble())
        val ornamentsTop by remember(chrome, safeArea, mapBounds) {
            derivedStateOf {
                MapOrnaments.top(
                    panel = chrome?.takeIf { it.layout == ScooterChromeLayout.Panel }?.panel,
                    fold = chrome?.fold,
                    search = chrome?.takeIf { it.layout == ScooterChromeLayout.Dock }?.top,
                    safeTop = safeArea.top,
                    bounds = mapBounds,
                )
            }
        }
        val compassTop by remember(chrome, safeArea, mapBounds, direction) {
            derivedStateOf {
                MapOrnaments.compassTop(
                    ornamentsTop,
                    width = mapBounds.width,
                    safeLeft = safeArea.left,
                    safeRight = safeArea.right,
                    rightToLeft = direction == LayoutDirection.Rtl,
                    captionButtons = chrome?.captionButtons.orEmpty(),
                )
            }
        }
        val showsMapCompass by remember(chrome) {
            derivedStateOf {
                MapOrnaments.showsMapCompass(panelLayout = chrome?.layout == ScooterChromeLayout.Panel, isSearching = chrome?.isSearching == true)
            }
        }
        MapCompass(
            bearing = { watch?.bearing ?: 0.0 },
            showsMapCompass = showsMapCompass,
            dark = dark,
            onTap = { camera?.turnNorth() },
            modifier = Modifier
                .align(Alignment.TopEnd)
                .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.End))
                // No less than 0, which a padding can't be: while a dialog's keyboard shows (a pass's date typed in
                // Settings), a phone's chrome measures as far as 245 above the window's top, the search bar's foot too.
                .padding(top = compassTop.coerceAtLeast(0.0).dp, end = MapOrnaments.EDGE_GAP.dp),
        )
        val margins = if (panelSides == null && fold == null) {
            null
        } else {
            MapCamera.beside(
                panel = panelSides?.let { (minX, maxX) -> ScreenRect(minX, 0.0, maxX - minX, 1.0) },
                fold = fold,
                bounds = ScreenRect(0.0, 0.0, maxWidth.value.toDouble(), maxHeight.value.toDouble()),
                safeTop = 0.0,
                rightToLeft = direction == LayoutDirection.Rtl,
            )
        }
        val leading = margins?.let { if (direction == LayoutDirection.Rtl) it.right else it.left } ?: 0.0
        // Past a panel or a fold down the map by the map's leading margin, or where a phone has them.
        val sideways = if (leading > 0) {
            Modifier.padding(start = leading.dp)
        } else {
            Modifier.windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Start)).padding(start = 8.dp)
        }
        // The scale, in a region that measures in miles, on the leading side: past a panel by the map's leading margin,
        // as the iPhone's layout margins put it, else 16 inside the safe area (MAP-023).
        MapScaleBar(
            metresPerPoint = { watch?.let { MapScale.metresPerPoint(it.zoom, it.latitude) } ?: 0.0 },
            zoomChanges = { watch?.zoomChanges ?: 0 },
            locale = language.locale,
            dark = dark || look.satellite,
            modifier = Modifier
                .align(Alignment.TopStart)
                .then(
                    if (panelSides != null && leading > 0) {
                        Modifier.padding(start = leading.dp)
                    } else {
                        Modifier.windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Start)).padding(start = MapOrnaments.EDGE_GAP.dp)
                    },
                )
                .padding(top = ornamentsTop.coerceAtLeast(0.0).dp),
        )
        val overCorner = creditsOverCorner(creditsSides, corner, maxHeight.value.toDouble())
        val overDock = creditsOverDock(creditsSides, dock, onDock, maxHeight.value.toDouble())
        // Clear of the bars, but not of the keyboard, which they stay under as the iPhone's Legal does.
        val safe = mapSafeArea
        val creditsBottom = safe.getBottom(density) / points
        // Under a phone's dock whose foot would cut them, under it or below it.
        val underDock = creditsUnderDock(creditsSides, creditsHeight, dock, creditsBottom, maxHeight.value.toDouble())
        // Under it, past the curve of its leading corner, which would show them, where they stand on its foot or near.
        val startUnderDock = if (margins == null && overDock == null) {
            val foot = maxHeight.value.toDouble() - (underDock ?: (creditsBottom + 8))
            creditsStartUnderDock(creditsSides, creditsHeight, foot, dock, maxWidth.value.toDouble(), direction == LayoutDirection.Rtl)
        } else {
            null
        }
        // Up over the dock as far as the search bar, a notice under it or the scale under them, they have no room, and
        // wait out of sight; above a fold across the map they are in its upright half, clear of the dock.
        val measurer = rememberTextMeasurer()
        val shownDensity = LocalDensity.current
        val scaleFoot = if (remember(language.locale) { MapScale.showsScale(language.locale) }) {
            ornamentsTop + remember(measurer, shownDensity) { scaleHeight(measurer, shownDensity) }
        } else {
            null
        }
        val seen = overDock == null || (margins != null && margins.bottom > 0) ||
            creditsHaveRoom(overDock, creditsHeight, creditsCeiling(chromeTop, safeArea.top, scaleFoot), maxHeight.value.toDouble())
        val density = LocalDensity.current.density
        MapCredits(
            dark = dark || look.satellite,
            imagery = imagery?.credit?.takeIf { look.satellite },
            seen = seen,
            modifier = Modifier.align(Alignment.BottomStart).then(
                when {
                    margins == null -> when {
                        overDock != null -> sideways.padding(bottom = overDock.dp)
                        startUnderDock != null -> {
                            val foot = underDock?.let { Modifier.padding(bottom = it.dp) }
                                ?: Modifier.windowInsetsPadding(safe.only(WindowInsetsSides.Bottom)).padding(bottom = 8.dp)
                            foot.padding(start = startUnderDock.dp)
                        }
                        underDock != null -> sideways.padding(bottom = underDock.dp)
                        else -> Modifier.windowInsetsPadding(safe).padding(8.dp)
                    }
                    // Above a fold across the map, on the upright half, as far up as the map's bottom margin.
                    margins.bottom > 0 -> sideways.padding(bottom = margins.bottom.dp)
                    overCorner != null -> sideways.padding(bottom = overCorner.dp)
                    overDock != null -> sideways.padding(bottom = overDock.dp)
                    else -> Modifier
                        .windowInsetsPadding(safe.only(WindowInsetsSides.Bottom))
                        .then(sideways)
                        .padding(bottom = 8.dp)
                },
            ).onGloballyPositioned {
                val bounds = it.boundsInWindow()
                creditsSides = (bounds.left / density).toDouble() to (bounds.right / density).toDouble()
                creditsHeight = (bounds.height / density).toDouble()
            },
        )
    }
}
