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

    signature(variantOf(libs.gummy.bears.api31) { artifactType("signature") })

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
}

animalsniffer {
    sourceSets = listOf(project.sourceSets.main.get())
    // The JVM's defaults of what the app sets from Android at launch.
    annotation = "com.plhery.scootradar.core.JvmOnly"
}

// CatalogParityTest and TimeZonesParityTest read the iPhone app's generated files to check the Android
// ones hold the same.
val iosGenerated = repo.resolve("ios/ScootRadar/Models")
tasks.test {
    inputs.files(iosGenerated.resolve("ProviderCatalog.generated.swift"), iosGenerated.resolve("TimeZones.generated.swift"))
        .withPropertyName("iosGenerated")
    systemProperty("scootradar.repo", repo.absolutePath)
}
