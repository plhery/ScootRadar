package com.plhery.scootradar.map

import android.content.ComponentCallbacks2
import android.content.res.Configuration
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.graphics.toColorInt
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.plhery.scootradar.core.api.ScooterAnalytics
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterMapStart
import com.plhery.scootradar.core.model.ScooterScreenshotCamera
import com.plhery.scootradar.ui.glass.LocalGlass
import org.maplibre.android.MapLibre
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.maps.MapLibreMapOptions

// ScooterMapView's makeUIView, from ios/ScootRadar/Views/ScooterMapView.swift.

/**
 * The camera the map last came to rest on, which a recreated activity opens on, and the requests it has taken. The
 * view model keeps it, so it goes with the process: a new launch opens at the start place, as the iPhone's does
 * (X-AD18).
 */
class MapCameraMemory {
    var position: CameraPosition? = null

    /**
     * The last focus and zoom step taken. The iPhone's map lives as long as its screen and takes each token once;
     * a recreated map must not take the controller's last request again.
     */
    var focusToken: Int? = null
    var zoomToken: Int? = null
}

/**
 * The map, under everything else on the screen: MapLibre's view in TextureView mode, so that the chrome can blur
 * what is under it, without its attribution, logo or compass, which the app draws itself. The composition's
 * lifecycle drives the view by hand, and a phone short of memory has it drop its caches. It moves to the places
 * the controller asks for, and tells it where it comes to rest. Its ground is the controller's map style, dark
 * or light as the app is, with names in the app's language; over it, the controller's scooters and bays.
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
            .camera(memory.position ?: MapCamera.opening(start, screenshot))
        ScooterMapView(context, options).also { it.onCreate(null) }
    }
    val currentLook by rememberUpdatedState(look)
    var camera by remember { mutableStateOf<MapCamera?>(null) }
    var ground by remember { mutableStateOf<MapGround?>(null) }
    var markers by remember { mutableStateOf<ScooterMarkers?>(null) }
    var rider by remember { mutableStateOf<ScooterRider?>(null) }
    DisposableEffect(view) {
        var made: MapCamera? = null
        var drawn: MapGround? = null
        var marked: ScooterMarkers? = null
        var shown: ScooterRider? = null
        view.getMapAsync { map ->
            drawn = MapGround(map, currentLook, tiles, imagery, scope).also { ground = it }
            val moving = MapCamera(map, view, controller, memory, scope).also { made = it; camera = it }
            marked = ScooterMarkers(map, view, controller, analytics, scope, move = { moving.show(it) }).also { markers = it }
            // After the markers, whose layers it goes above.
            shown = ScooterRider(map, view, controller, scope).also { rider = it }
        }
        onDispose {
            made?.close()
            drawn?.close()
            marked?.close()
            shown?.close()
            camera = null
            ground = null
            markers = null
            rider = null
        }
    }
    LaunchedEffect(ground, look) { ground?.show(look) }
    LaunchedEffect(markers, dark, look.satellite) { markers?.setDark(dark || look.satellite) }
    // The dot is the app's blue, whatever the ground; Increase Contrast is read again as the configuration changes.
    val configuration = LocalConfiguration.current
    LaunchedEffect(rider, dark, configuration) {
        rider?.setLook(RiderArt.Look(dark = dark, highContrast = RiderArt.isHighContrast(context)))
    }
    val density = LocalDensity.current
    val direction = LocalLayoutDirection.current
    val safe = WindowInsets.safeDrawing
    val points = density.density.toDouble()
    val safeArea = MapInsets(
        top = safe.getTop(density) / points,
        left = safe.getLeft(density, direction) / points,
        bottom = safe.getBottom(density) / points,
        right = safe.getRight(density, direction) / points,
    )
    val focus by controller.focusRequest.collectAsStateWithLifecycle()
    val zoom by controller.zoomRequest.collectAsStateWithLifecycle()
    LaunchedEffect(camera, safeArea) { camera?.safeAreaDidChange(safeArea) }
    LaunchedEffect(markers, safeArea) { markers?.safeAreaDidChange(safeArea) }
    // The chrome over the map, as the screen measures it: the map keeps its names and the places it shows clear of it.
    val chrome = LocalMapChrome.current
    LaunchedEffect(camera, markers, chrome) {
        if (chrome == null) return@LaunchedEffect
        snapshotFlow { chrome.chrome }.collect {
            camera?.chromeDidChange(it)
            markers?.chromeDidChange(it)
        }
    }
    LaunchedEffect(camera, focus) { camera?.applyFocus(focus) }
    LaunchedEffect(camera, zoom) { camera?.applyZoom(zoom) }
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
    Box(modifier.fillMaxSize()) {
        AndroidView(factory = { backdrop?.hold(view) ?: view }, modifier = Modifier.fillMaxSize())
        MapCredits(
            dark = dark || look.satellite,
            imagery = imagery?.credit?.takeIf { look.satellite },
            modifier = Modifier.align(Alignment.BottomStart).windowInsetsPadding(WindowInsets.safeDrawing).padding(8.dp),
        )
    }
}
