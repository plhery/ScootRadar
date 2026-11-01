pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode = RepositoriesMode.FAIL_ON_PROJECT_REPOS
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "ScootRadar"
include(":app")
include(":core")
// The Baseline Profile's journey and the startup benchmark, run on a device against :app's release builds.
include(":baselineprofile")
