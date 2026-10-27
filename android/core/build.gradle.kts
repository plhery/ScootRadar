plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.serialization)
    // Android Lint, run from :app (checkDependencies), reads :core's sources too.
    alias(libs.plugins.android.lint)
    // Lint's NewApi check skips a JVM module, so :core's classes are checked against Android 12's API
    // (minSdk 31) by animal sniffer: the JVM has APIs Android 12 lacks, such as LocalDate.ofInstant (API 34).
    alias(libs.plugins.animalsniffer)
}

kotlin {
    jvmToolchain(21)
}

val repo: File = rootDir.parentFile

// The API contract's models and the provider catalog come from the scripts that write the website's and
// the iPhone app's (scripts/generate-api-contract.mjs, generate-provider-catalog.mjs), run with node into
// the build directory: never stale, and never checked in for the website's checks to fail on. The
// catalog's script needs the repository's npm packages (`npm ci` at the top of the repository).
// -Pscootradar.node=/path/to/node when node is not on the PATH Gradle sees.
val node = providers.gradleProperty("scootradar.node").orElse("node")
val apiContractKotlin = layout.buildDirectory.dir("generated/apiContract/kotlin")
val catalogSources = layout.buildDirectory.dir("generated/catalog")

val generateApiContract by tasks.registering(Exec::class) {
    inputs.files(repo.resolve("data/scooter-api.schema.json"), repo.resolve("scripts/generate-api-contract.mjs"))
        .withPropertyName("sources")
    outputs.dir(apiContractKotlin)
    workingDir(repo)
    commandLine(node.get(), "scripts/generate-api-contract.mjs", "--kotlin=${apiContractKotlin.get().asFile}")
}

val generateCatalog by tasks.registering(Exec::class) {
    inputs.dir(repo.resolve("data")).withPropertyName("data")
    inputs.files(
        repo.resolve("scripts/generate-provider-catalog.mjs"),
        repo.resolve("scripts/country-catalog.mjs"),
        repo.resolve("src/lib/limeGrid.ts"),
        repo.resolve("src/generated/timeZones.ts"),
    ).withPropertyName("sources")
    outputs.dir(catalogSources)
    workingDir(repo)
    commandLine(node.get(), "scripts/generate-provider-catalog.mjs", "--android=${catalogSources.get().asFile}")
}

// The app's strings are the iPhone app's, read as they are when the app runs (ScooterStrings.kt): a
// translation changed for the iPhone is changed here too.
val iosStrings = layout.buildDirectory.dir("generated/iosStrings")
val copyIosStrings by tasks.registering(Sync::class) {
    from(repo.resolve("ios/ScootRadar")) {
        include("*.lproj/Localizable.strings", "*.lproj/Localizable.stringsdict")
    }
    into(iosStrings.map { it.dir("com/plhery/scootradar/core/strings") })
}

sourceSets.main {
    kotlin.srcDir(files(apiContractKotlin).builtBy(generateApiContract))
    kotlin.srcDir(files(catalogSources.map { it.dir("kotlin") }).builtBy(generateCatalog))
    resources.srcDir(files(catalogSources.map { it.dir("resources") }).builtBy(generateCatalog))
    resources.srcDir(files(iosStrings).builtBy(copyIosStrings))
}

dependencies {
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.core)
    // The clients of the app's server and of analytics take an OkHttpClient and an HttpUrl.
    api(libs.okhttp)
    // The zones' shapes, merged and clipped as the iPhone does with Core Graphics' paths
    // (ScooterZoneOverlay.kt); the map draws them from JTS's polygons and lines.
    api(libs.jts.core)

    signature(variantOf(libs.gummy.bears.api31) { artifactType("signature") })

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.mockwebserver3)
}

animalsniffer {
    sourceSets = listOf(project.sourceSets.main.get())
    // The JVM's defaults of what the app sets from Android at launch.
    annotation = "com.plhery.scootradar.core.JvmOnly"
}

// ScooterGridClusteringTest holds the port to the web's clusterVehicles, run with node on the same scooters
// (src/test/web/clustering.mjs, which bundles it with the repository's esbuild).
val webClusteringScript = file("src/test/web/clustering.mjs")
val webClustering = layout.buildDirectory.file("generated/webClustering/clustering.json")
val runWebClustering by tasks.registering(Exec::class) {
    inputs.files(repo.resolve("src/lib/clustering.ts"), repo.resolve("src/generated/countries.ts"), webClusteringScript)
        .withPropertyName("sources")
    outputs.file(webClustering)
    workingDir(repo)
    commandLine(node.get(), webClusteringScript.absolutePath, webClustering.get().asFile.absolutePath)
}

// CatalogParityTest and TimeZonesParityTest read the iPhone app's generated files to check the Android
// ones hold the same; RentalLinkPolicyParityTest reads its rental link table.
val iosModels = repo.resolve("ios/ScootRadar/Models")
tasks.test {
    dependsOn(runWebClustering)
    inputs.file(webClustering).withPropertyName("webClustering")
    systemProperty("scootradar.webClustering", webClustering.get().asFile.absolutePath)
    inputs.files(
        iosModels.resolve("ProviderCatalog.generated.swift"),
        iosModels.resolve("TimeZones.generated.swift"),
        iosModels.resolve("ScooterModels.swift"),
    ).withPropertyName("iosModels")
    // SourceCharactersTest reads every module's sources.
    inputs.files(fileTree(rootDir) { include("*.kts", "gradle/*.toml", "*/*.kts", "*/src/**") })
        .withPropertyName("androidSources")
    systemProperty("scootradar.repo", repo.absolutePath)
}
