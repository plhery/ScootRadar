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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.model.ScooterMapStart
import com.plhery.scootradar.core.model.ScooterScreenshotCamera
import org.maplibre.android.MapLibre
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.maps.MapLibreMapOptions
import org.maplibre.android.maps.Style

// ScooterMapView's makeUIView, from ios/ScootRadar/Views/ScooterMapView.swift.

/**
 * The camera the map last came to rest on, which a recreated activity opens on. The view model keeps it, so it
 * goes with the process: a new launch opens at the start place, as the iPhone's does (X-AD18).
 */
class MapCameraMemory {
    var position: CameraPosition? = null
}

/**
 * The map, under everything else on the screen: MapLibre's view in TextureView mode, so that the chrome can blur
 * what is under it, without its attribution, logo or compass, which the app draws itself. The composition's
 * lifecycle drives the view by hand, and a phone short of memory has it drop its caches. It moves to the places
 * the controller asks for, and tells it where it comes to rest.
 */
@Composable
fun ScooterMap(
    controller: ScooterMapController,
    start: ScooterMapStart,
    memory: MapCameraMemory,
    modifier: Modifier = Modifier,
    /** A debug build's camera for screenshots, in place of the start place. */
    screenshot: ScooterScreenshotCamera.Camera? = null,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val view = remember {
        MapLibre.getInstance(context)
        val options = MapLibreMapOptions.createFromAttributes(context)
            .textureMode(true)
            .attributionEnabled(false)
            .logoEnabled(false)
            .compassEnabled(false)
            .minZoomPreference(MapZoom.minimum)
            .maxZoomPreference(MapZoom.maximum)
            .camera(memory.position ?: MapCamera.opening(start, screenshot))
        ScooterMapView(context, options).also { it.onCreate(null) }
    }
    var camera by remember { mutableStateOf<MapCamera?>(null) }
    DisposableEffect(view) {
        var made: MapCamera? = null
        view.getMapAsync { map ->
            map.setStyle(Style.Builder().fromJson(BLANK_STYLE))
            made = MapCamera(map, view, controller, memory, scope).also { camera = it }
        }
        onDispose {
            made?.close()
            camera = null
        }
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
                @Suppress("DEPRECATION")
                if (level >= ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW) view.onLowMemory()
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
    Box(modifier.fillMaxSize()) {
        AndroidView(factory = { view }, modifier = Modifier.fillMaxSize())
        MapCredits(Modifier.align(Alignment.BottomStart).windowInsetsPadding(WindowInsets.safeDrawing).padding(8.dp))
    }
}

/** The land alone, until the ground styles come. */
private const val BLANK_STYLE = """{"version":8,"sources":{},"layers":[{"id":"land","type":"background","paint":{"background-color":"#eef0f4"}}]}"""
