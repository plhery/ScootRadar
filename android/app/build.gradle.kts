plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
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
        unitTests.all { it.jvmArgs("--add-exports=java.base/jdk.internal.access=ALL-UNNAMED", "--add-opens=java.base/java.io=ALL-UNNAMED") }
    }
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

    androidTestImplementation(libs.junit)
    androidTestImplementation(libs.androidx.test.core)
    androidTestImplementation(libs.androidx.test.runner)
    androidTestImplementation(libs.androidx.test.rules)
    androidTestImplementation(libs.androidx.test.ext.junit)
}
