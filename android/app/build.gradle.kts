import com.android.build.api.artifact.SingleArtifact
import org.gradle.api.artifacts.component.ModuleComponentIdentifier
import org.gradle.api.artifacts.result.ResolvedComponentResult
import org.gradle.api.artifacts.result.ResolvedDependencyResult

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.roborazzi)
}

android {
    namespace = "com.plhery.scootradar"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.plhery.scootradar"
        minSdk = 31
        targetSdk = 37
        versionCode = 1
        versionName = "1.2.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        compose = true
        // The version the feedback mail and the review prompt name, and whether this is a debug build.
        buildConfig = true
    }

    lint {
        // :core too, with this minSdk.
        checkDependencies = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }

    testOptions {
        // Robolectric reads the app's manifest and resources.
        unitTests.isIncludeAndroidResources = true
        // Robolectric's newest Android sets up its shared memory through FileDescriptor's internals.
        unitTests.all {
            it.jvmArgs("--add-exports=java.base/jdk.internal.access=ALL-UNNAMED", "--add-opens=java.base/java.io=ALL-UNNAMED")
            // Screenshots draw through Android's own renderer, so the glass's blur and the shadows show (Roborazzi).
            it.systemProperty("robolectric.pixelCopyRenderMode", "hardware")
        }
    }
}

roborazzi {
    // The baselines, recorded on the Mac with recordRoborazziDebug and checked on CI with verifyRoborazziDebug.
    outputDir.set(file("src/test/screenshots"))
}

dependencies {
    implementation(project(":core"))
    implementation(libs.androidx.core.ktx)
    // The app's languages are AppCompat's per-app locales, which it keeps itself on Android 12 (X-AD14).
    implementation(libs.appcompat)
    implementation(libs.activity.compose)
    implementation(libs.lifecycle.runtime.compose)
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.foundation)
    implementation(libs.compose.material3)
    implementation(libs.compose.ui.tooling.preview)
    // The OpenGL ES build of MapLibre Native; `android-sdk` is the Vulkan one (PLAN §4).
    implementation(libs.maplibre.android)
    // ExploreByTouchHelper, the markers' virtual views for TalkBack (MAP-307). Apache 2.0.
    implementation(libs.customview)
    // The ground's style is written as JSON, and OpenFreeMap's index read from it.
    implementation(libs.kotlinx.serialization.json)
    // The fold of a partly open foldable, which the chrome and the map keep clear of (UI-116). Apache 2.0.
    implementation(libs.androidx.window)
    debugImplementation(libs.compose.ui.tooling)
    debugImplementation(libs.compose.ui.test.manifest)

    testImplementation(libs.junit)
    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.test.core)
    testImplementation(libs.androidx.test.ext.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(platform(libs.compose.bom))
    testImplementation(libs.compose.ui.test.junit4)
    // Compose's test rule idles through Espresso; the one it brings looks for an InputManager newer Androids lack.
    testImplementation(libs.espresso.core)
    testImplementation(libs.roborazzi)
    testImplementation(libs.roborazzi.compose)
    // A fold given to the screen as WindowManager would give it.
    testImplementation(libs.androidx.window.testing)

    androidTestImplementation(libs.junit)
    androidTestImplementation(libs.androidx.test.core)
    androidTestImplementation(libs.androidx.test.runner)
    androidTestImplementation(libs.androidx.test.rules)
    androidTestImplementation(libs.androidx.test.ext.junit)
    // The chrome's tests over the live map (ui/DockOverTheMapTest).
    androidTestImplementation(platform(libs.compose.bom))
    androidTestImplementation(libs.compose.ui.test.junit4)
    androidTestImplementation(libs.espresso.core)
    // Android's own permission dialog and Settings, in the rider's location tests (map/RiderLocationTest).
    androidTestImplementation(libs.uiautomator)
    // The fold of the foldable's tests (ui/FoldTest).
    androidTestImplementation(libs.androidx.window.testing)
}

/**
 * LOG-331 (ScooterAnalytics.swift:4): the app reads no advertising id, as the iPhone's reads none. A build's merged
 * manifest asks for no AD_ID permission, which Play services' ads libraries merge in, and the libraries it ships hold
 * nothing of Play services or Firebase. The unit tests run once the debug and the release builds are checked.
 */
abstract class AdvertisingIdCheck : DefaultTask() {
    @get:InputFile
    @get:PathSensitive(PathSensitivity.NONE)
    abstract val manifest: RegularFileProperty

    /** The libraries the build ships, as group:name. */
    @get:Input
    abstract val libraries: SetProperty<String>

    @get:OutputFile
    abstract val checked: RegularFileProperty

    @TaskAction
    fun check() {
        val merged = manifest.get().asFile
        if (merged.readText().contains(PERMISSION)) throw GradleException("$merged asks for $PERMISSION (LOG-331)")
        val found = libraries.get().filter { library -> GROUPS.any { library.startsWith("$it:") } }.sorted()
        if (found.isNotEmpty()) throw GradleException("The build ships ${found.joinToString()} (LOG-331)")
        checked.get().asFile.writeText("No $PERMISSION and none of ${GROUPS.joinToString()} among ${libraries.get().size} libraries.\n")
    }

    companion object {
        const val PERMISSION = "com.google.android.gms.permission.AD_ID"
        val GROUPS = listOf("com.google.android.gms", "com.google.firebase")

        /** Every library the dependency graph under [root] selects. */
        fun libraries(root: ResolvedComponentResult): Set<String> {
            val seen = mutableSetOf<ResolvedComponentResult>()
            val next = ArrayDeque(listOf(root))
            while (next.isNotEmpty()) {
                val component = next.removeFirst()
                if (seen.add(component)) next += component.dependencies.filterIsInstance<ResolvedDependencyResult>().map { it.selected }
            }
            return seen.mapNotNullTo(sortedSetOf()) { (it.id as? ModuleComponentIdentifier)?.let { id -> "${id.group}:${id.module}" } }
        }
    }
}

androidComponents {
    onVariants { variant ->
        val name = variant.name.replaceFirstChar { it.uppercase() }
        tasks.register<AdvertisingIdCheck>("check${name}AdvertisingId") {
            manifest.set(variant.artifacts.get(SingleArtifact.MERGED_MANIFEST))
            libraries.set(variant.runtimeConfiguration.incoming.resolutionResult.rootComponent.map { AdvertisingIdCheck.libraries(it) })
            checked.set(layout.buildDirectory.file("advertising-id/${variant.name}.txt"))
        }
    }
}

tasks.withType<Test>().configureEach {
    if (name == "testDebugUnitTest") dependsOn("checkDebugAdvertisingId", "checkReleaseAdvertisingId")
}
