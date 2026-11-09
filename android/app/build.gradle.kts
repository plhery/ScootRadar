import com.android.build.api.artifact.SingleArtifact
import java.util.Properties
import org.gradle.api.artifacts.component.ModuleComponentIdentifier
import org.gradle.api.artifacts.result.ResolvedComponentResult
import org.gradle.api.artifacts.result.ResolvedDependencyResult

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.roborazzi)
    // The Baseline Profile, recorded by :baselineprofile and shipped in the release build (X-AD30).
    alias(libs.plugins.baselineprofile)
}

android {
    namespace = "com.plhery.scootradar"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.plhery.scootradar"
        minSdk = 31
        targetSdk = 37
        versionCode = 6
        // The iPhone app's version (MARKETING_VERSION); versionCode goes up by one with each upload to Play.
        versionName = "1.3.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    // The upload key for Play, which Play App Signing re-signs with the app's own key. It is kept outside the repo, in
    // a properties file named by the Gradle property scootradar.uploadKey: storeFile, keyAlias and passwordFile, a
    // file holding the store's and the key's one password. Without it, as on CI, the release build is unsigned.
    val uploadKey = providers.gradleProperty("scootradar.uploadKey").orNull?.let(::File)
    if (uploadKey != null) {
        val properties = Properties().apply { uploadKey.inputStream().use(::load) }
        fun path(name: String) = uploadKey.resolveSibling(checkNotNull(properties.getProperty(name)) { "no $name in $uploadKey" })
        val password = path("passwordFile").readText().trim()
        signingConfigs.create("upload") {
            storeFile = path("storeFile")
            storePassword = password
            keyAlias = checkNotNull(properties.getProperty("keyAlias")) { "no keyAlias in $uploadKey" }
            keyPassword = password
        }
    }

    buildTypes {
        // The build for Play: shrunk, optimised and obfuscated by R8, its unused resources taken out, and signed with
        // the upload key where one is given.
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.findByName("upload")
        }
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
            // All the app's tests share one JVM, and the frame-by-frame tests hold a dozen screens of pixels each:
            // Gradle's 512 MB ran out (ReduceMotionAtOnceTest, OutOfMemoryError).
            it.maxHeapSize = "2g"
        }
    }
}

baselineProfile {
    // The profile is recorded on a device by hand (generateReleaseBaselineProfile) and kept in
    // src/release/generated/baselineProfiles, so neither a plain build nor CI needs a device.
    automaticGenerationDuringBuild = false
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
    // Installs the Baseline Profile where Play does not, and lets the startup benchmark compile the app with it.
    implementation(libs.profileinstaller)
    // Google Play's card to rate the app, as StoreKit's requestReview on the iPhone (X-AD27); its FakeReviewManager
    // stands in for Play in the tests.
    implementation(libs.play.review)
    baselineProfile(project(":baselineprofile"))
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
 * nothing of Play services or Firebase but the two that Google Play's review card is asked through (X-AD27): the Task
 * API and the base it stands on, which read no id. The unit tests run once the debug and the release builds are
 * checked.
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
        val found = libraries.get().filter { library -> GROUPS.any { library.startsWith("$it:") } && library !in ALLOWED }.sorted()
        if (found.isNotEmpty()) throw GradleException("The build ships ${found.joinToString()} (LOG-331)")
        checked.get().asFile.writeText(
            "No $PERMISSION and none of ${GROUPS.joinToString()} but ${ALLOWED.joinToString()} among ${libraries.get().size} libraries.\n",
        )
    }

    companion object {
        const val PERMISSION = "com.google.android.gms.permission.AD_ID"
        val GROUPS = listOf("com.google.android.gms", "com.google.firebase")

        /** What com.google.android.play:review stands on: Play services' Task API and its base, no id among them. */
        val ALLOWED = setOf("com.google.android.gms:play-services-basement", "com.google.android.gms:play-services-tasks")

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
