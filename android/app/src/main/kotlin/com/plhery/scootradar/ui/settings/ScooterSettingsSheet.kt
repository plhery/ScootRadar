package com.plhery.scootradar.ui.settings

import android.content.ActivityNotFoundException
import android.content.Intent
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.ContentTransform
import androidx.compose.animation.Crossfade
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.VisibilityThreshold
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.intl.LocaleList
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.core.net.toUri
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.api.ScooterAnalytics
import com.plhery.scootradar.core.generated.ScooterProvider
import com.plhery.scootradar.core.map.ScooterMapController
import com.plhery.scootradar.core.map.passProviders
import com.plhery.scootradar.core.model.AppleMapStyle
import com.plhery.scootradar.core.model.ProviderRidePass
import com.plhery.scootradar.core.model.ScooterAppearance
import com.plhery.scootradar.core.model.ScooterCreditsList
import com.plhery.scootradar.core.model.ScooterDateFormat
import com.plhery.scootradar.core.model.ScooterDefaults
import com.plhery.scootradar.core.model.ScooterLanguage
import com.plhery.scootradar.core.model.ScooterLanguageChoice
import com.plhery.scootradar.core.model.ScooterLinks
import com.plhery.scootradar.core.model.formatted
import com.plhery.scootradar.core.model.localized
import com.plhery.scootradar.core.model.stringFormat
import com.plhery.scootradar.ui.LocalClock
import com.plhery.scootradar.ui.dock.SymbolIcon
import com.plhery.scootradar.ui.dock.textSymbolSize
import com.plhery.scootradar.ui.rememberControllerChanges
import com.plhery.scootradar.ui.sheet.SheetBackButton
import com.plhery.scootradar.ui.sheet.SheetDoneButton
import com.plhery.scootradar.ui.sheet.SheetTitleBar
import com.plhery.scootradar.ui.theme.CapsuleShape
import com.plhery.scootradar.ui.theme.LocalReduceMotion
import com.plhery.scootradar.ui.theme.ScootType
import com.plhery.scootradar.ui.theme.SelectionFeedback
import com.plhery.scootradar.ui.theme.Symbols
import com.plhery.scootradar.ui.theme.TextSize
import com.plhery.scootradar.ui.theme.animation
import com.plhery.scootradar.ui.theme.motion
import com.plhery.scootradar.ui.theme.scootColors
import java.net.URI
import java.time.Instant
import java.time.ZoneOffset

// ScooterSettingsSheet, ScooterLanguageSettings, ScooterPrivacySettings, ScooterCreditsList and
// ProviderRidePassEditor in ios/ScootRadar/Views/ScooterControls.swift (ui.md UI-070, UI-072, UI-077, UI-080 to
// UI-089, UI-210).

/** A page of the sheet's NavigationStack. */
sealed interface SettingsPage {
    data object Root : SettingsPage
    data object Language : SettingsPage
    data class Pass(val provider: ScooterProvider) : SettingsPage
    data object Credits : SettingsPage
    data object Privacy : SettingsPage
    data object Notices : SettingsPage
    data class Licence(val notice: OpenSourceNotice) : SettingsPage
}

/**
 * Settings, on a sheet: how the app looks, the map, its language, the rider's passes and About, with pages of their
 * own for the language, each pass, the credits and privacy. A page slides in from the end, and Back or the back
 * button takes it away; Done closes the sheet. A choice applies at once.
 */
@Composable
fun ScooterSettingsSheet(
    controller: ScooterMapController,
    bottomInset: Dp,
    /** Where ScooterAnalytics reads whether the rider has turned usage off. */
    defaults: ScooterDefaults?,
    onDone: () -> Unit,
    /** The providers under Passes: the controller's; tests pin them. */
    passProviders: List<ScooterProvider>? = null,
    /** The credits' sources: the catalogue's; tests pin them, so that a new country in data/ changes none. */
    sources: List<ScooterCreditsList.Source>? = null,
    /** The pages open as the sheet opens, the first at the bottom; tests open one directly. */
    pages: List<SettingsPage> = listOf(SettingsPage.Root),
) {
    val stack = remember { mutableStateListOf<SettingsPage>().apply { addAll(pages) } }
    // Each page keeps where it is scrolled to while pages above it come and go, as in a NavigationStack; a page
    // pushed again starts at its top.
    val scrolls = remember { mutableMapOf<Int, ScrollState>() }
    val push: (SettingsPage) -> Unit = {
        scrolls.remove(stack.size + 1)
        stack.add(it)
    }
    val pop: () -> Unit = { if (stack.size > 1) stack.removeAt(stack.lastIndex) }
    // Back takes a page away before it closes the sheet.
    BackHandler(enabled = stack.size > 1, onBack = pop)

    val changes = rememberControllerChanges(controller)
    val appearance by controller.appearance.collectAsState()
    val mapStyle by controller.mapStyle.collectAsState()
    val languageChoice by controller.languageChoice.collectAsState()
    // The sheet reads the language here, so that its titles are written again when another is chosen.
    val language by controller.language.collectAsState()
    SelectionFeedback(appearance)
    SelectionFeedback(mapStyle)
    SelectionFeedback(languageChoice)
    val providers = passProviders ?: remember(controller, changes) { controller.passProviders }

    val links = rememberLinks()
    val reduceMotion = LocalReduceMotion.current
    val colors = scootColors
    Column(Modifier.fillMaxSize()) {
        // The title cross-fades as a page comes or goes.
        Crossfade(stack.last() to language, animationSpec = motion(IosMotion.smooth(duration = 0.35)), label = "bar") { (page, _) ->
            SheetTitleBar(
                title = page.title(),
                leading = if (page != SettingsPage.Root) ({ SheetBackButton(onClick = pop) }) else null,
                trailing = if (page == SettingsPage.Root) ({ SheetDoneButton(localized("Done"), onClick = onDone) }) else null,
            )
        }
        AnimatedContent(
            targetState = stack.toList(),
            transitionSpec = { pageTransition(forward = targetState.size > initialState.size, reduceMotion) },
            label = "page",
        ) { shown ->
            Column(
                Modifier
                    .fillMaxSize()
                    .background(colors.systemGroupedBackground)
                    .verticalScroll(scrolls.getOrPut(shown.size) { ScrollState(0) })
                    .padding(bottom = bottomInset + 20.dp),
            ) {
                when (val page = shown.last()) {
                    SettingsPage.Root -> SettingsRoot(controller, providers, language, links, push)
                    SettingsPage.Language -> LanguageSettings(controller, language)
                    is SettingsPage.Pass -> PassEditor(controller, page.provider, language)
                    SettingsPage.Credits -> CreditsList(sources ?: ScooterCreditsList.sources, language, links, push)
                    SettingsPage.Privacy -> PrivacySettings(defaults, language, links)
                    SettingsPage.Notices -> NoticesList(language, push)
                    is SettingsPage.Licence -> LicenceText(page.notice)
                }
            }
        }
    }
}

/**
 * A NavigationStack's push: the new page slides in from the end over the one it covers, which slides a third of
 * its width toward the start; a pop runs it backwards. Remove animations swaps them at once.
 */
private fun pageTransition(forward: Boolean, reduceMotion: Boolean): ContentTransform {
    if (reduceMotion) return EnterTransition.None togetherWith ExitTransition.None
    val spring = IosMotion.smooth(duration = 0.4).animation(visibilityThreshold = IntOffset.VisibilityThreshold)
    val transition = if (forward) {
        slideInHorizontally(spring) { it } togetherWith slideOutHorizontally(spring) { -it / 3 }
    } else {
        slideInHorizontally(spring) { -it / 3 } togetherWith slideOutHorizontally(spring) { it }
    }
    // The deeper page is drawn over the other, coming or going.
    transition.targetContentZIndex = if (forward) 1f else -1f
    return transition
}

private fun SettingsPage.title(): String = when (this) {
    SettingsPage.Root -> localized("Settings")
    SettingsPage.Language -> localized("Language")
    is SettingsPage.Pass -> stringFormat(localized("%@ pass"), provider.displayName)
    SettingsPage.Credits -> localized("Map & data credits")
    SettingsPage.Privacy -> localized("Privacy")
    SettingsPage.Notices -> localized("Open-source licences")
    is SettingsPage.Licence -> notice.name
}

/** Where a row leaving the app goes: a page in the browser, or a new mail in the phone's mail app. */
private class Links(val open: (URI) -> Unit, val mail: (URI) -> Unit)

@Composable
private fun rememberLinks(): Links {
    val uriHandler = LocalUriHandler.current
    val context = LocalContext.current
    return remember(uriHandler, context) {
        Links(
            open = { uri ->
                try {
                    uriHandler.openUri(uri.toString())
                } catch (_: IllegalArgumentException) {
                    // Nothing on the phone opens a web address.
                }
            },
            mail = { uri ->
                try {
                    context.startActivity(Intent(Intent.ACTION_SENDTO, uri.toString().toUri()))
                } catch (_: ActivityNotFoundException) {
                    // No mail app.
                }
            },
        )
    }
}

@Composable
private fun SettingsRoot(
    controller: ScooterMapController,
    providers: List<ScooterProvider>,
    language: ScooterLanguage,
    links: Links,
    push: (SettingsPage) -> Unit,
) {
    val appearance by controller.appearance.collectAsState()
    val mapStyle by controller.mapStyle.collectAsState()
    val showsZones by controller.showsZones.collectAsState()
    val languageChoice by controller.languageChoice.collectAsState()
    val ridePasses by controller.ridePasses.collectAsState()
    val now = LocalClock.current()

    FormSection(
        header = localized("Appearance"),
        bare = {
            val choices = ScooterAppearance.entries
            SettingsTileRow(localized("Appearance"), choices.size) { index, modifier ->
                val choice = choices[index]
                SettingsTile(choice.label, appearance == choice, { controller.setAppearance(choice) }, modifier) {
                    AppearancePicture(choice)
                }
            }
        },
    )

    // Satellite stays out while the app has no imagery to lay under it (NEEDS-USER #3).
    val styles = AppleMapStyle.entries - AppleMapStyle.Satellite
    FormSection(
        header = localized("Map"),
        footer = localized(
            "A preview: where operators forbid riding or parking, or slow scooters down, as their feeds publish it. Each operator’s app has the final word.",
        ),
        bare = {
            SettingsTileRow(localized("Map"), styles.size) { index, modifier ->
                val style = styles[index]
                SettingsTile(style.label, mapStyle == style, { controller.setMapStyle(style) }, modifier) {
                    MapStylePicture(style)
                }
            }
        },
        rows = listOf { FormToggleRow(localized("Ride and parking zones"), showsZones, controller::setShowsZones) },
    )

    FormSection(
        header = localized("Language"),
        rows = listOf {
            FormNavigationRow(onClick = { push(SettingsPage.Language) }) {
                val name = ownName(language)
                val automatic = if (languageChoice == ScooterLanguageChoice.Automatic) localized("Automatic (language)") else null
                if (TextSize.isAccessibility) {
                    // Very large text: Automatic goes under the name, so neither is cut off.
                    FormText(name, Modifier.weight(1f), automatic, Detail.Subheadline)
                } else {
                    // The name takes the room it needs, and Automatic the rest, at the end.
                    Text(name, style = ScootType.body, color = scootColors.label)
                    if (automatic != null) {
                        Text(
                            automatic,
                            style = ScootType.subheadline,
                            color = scootColors.secondaryLabel,
                            textAlign = TextAlign.End,
                            modifier = Modifier.weight(1f),
                        )
                    } else {
                        Spacer(Modifier.weight(1f))
                    }
                }
            }
        },
    )

    // Only the providers that matter here: those operating on this part of the map, and those the rider has a
    // pass for.
    FormSection(
        header = localized("Passes"),
        footer = localized("Pass benefits are used only for estimates. Free-minute balances are not reduced automatically."),
        separatorInset = ROW_PADDING + PASS_DOT + PASS_GAP,
        rows = providers.map { provider ->
            @Composable {
                FormNavigationRow(onClick = { push(SettingsPage.Pass(provider)) }) {
                    // HStack(spacing: 10): the row's own gap, and the rest after the dot.
                    Box(Modifier.padding(end = PASS_GAP - 8.dp).size(PASS_DOT).background(scootColors.providerAccent(provider), CircleShape))
                    val status = passStatus(ridePasses[provider] ?: ProviderRidePass(), now)
                    if (TextSize.isAccessibility) {
                        // Very large text: the status goes under the name, so neither is cut off.
                        FormText(AnnotatedString(provider.displayName), Modifier.weight(1f), status, Detail.Subheadline)
                    } else {
                        // The name takes the room it needs, and the status the rest, at the end.
                        Text(provider.displayName, style = ScootType.body, color = scootColors.label)
                        Text(
                            status,
                            style = ScootType.subheadline,
                            color = scootColors.secondaryLabel,
                            textAlign = TextAlign.End,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
            }
        },
    )

    FormSection(
        header = localized("About"),
        footer = localized("Availability refreshes automatically. Opening a provider app doesn’t reserve a scooter."),
        separatorInset = LABEL_TEXT_INSET,
        rows = listOf(
            {
                // A way to write rather than rate, open to every rider.
                ExternalLinkRow(
                    title = localized("Send feedback"),
                    onOpen = { links.mail(ScooterLinks.feedback) },
                    detail = stringFormat(localized("Version %@"), ScooterLinks.appVersion),
                    symbol = Symbols.envelope,
                )
            },
            { FormNavigationRow(onClick = { push(SettingsPage.Credits) }) { FormLabel(localized("Map & data credits"), Symbols.map) } },
            { FormNavigationRow(onClick = { push(SettingsPage.Privacy) }) { FormLabel(localized("Privacy"), Symbols.handRaised) } },
            {
                ExternalLinkRow(
                    title = localized("Source code on GitHub"),
                    onOpen = { links.open(ScooterLinks.sourceCode) },
                    symbol = Symbols.code,
                )
            },
        ),
    )
}

/** What a pass gives, or why it gives nothing: "Not set", "Expired", "Free unlock · 15 free min". */
internal fun passStatus(pass: ProviderRidePass, now: Instant): String {
    if (!pass.enabled) return localized("Not set")
    if (!pass.isActive(now)) return localized("Expired")
    val benefits = buildList {
        if (pass.freeUnlock) add(localized("Free unlock"))
        if (pass.freeMinutes > 0) add(stringFormat(localized("%lld free min"), pass.freeMinutes.toLong()))
    }
    return if (benefits.isEmpty()) localized("Pass active") else benefits.joinToString(" · ")
}

/** A language's own name, which TalkBack reads in that language, as VoiceOver reads a text in its locale's. */
private fun ownName(language: ScooterLanguage): AnnotatedString =
    AnnotatedString(language.displayName, SpanStyle(localeList = LocaleList(language.rawValue)))

/**
 * Settings › Language: Automatic, which follows the phone, then each language of the app by its own name, with its
 * name in the language shown. A tap shows the app in it at once.
 */
@Composable
private fun LanguageSettings(controller: ScooterMapController, language: ScooterLanguage) {
    val choice by controller.languageChoice.collectAsState()

    @Composable
    fun Choice(value: ScooterLanguageChoice, name: AnnotatedString, detail: String?) {
        FormRow(onClick = { controller.setLanguageChoice(value) }, selected = choice == value) {
            FormText(name, Modifier.weight(1f), detail, Detail.Subheadline)
            Box(Modifier.clearAndSetSemantics { }) {
                // `.body.semibold`, which grows with the text.
                SymbolIcon(Symbols.check, textSymbolSize(17f), if (choice == value) scootColors.accent else Color.Transparent)
            }
        }
    }

    FormSection(
        footer = localized("Follows your phone’s language, if you change it there."),
        rows = listOf {
            Choice(
                ScooterLanguageChoice.Automatic,
                AnnotatedString(localized("Automatic (language)")),
                stringFormat(localized("%@, the language of your phone"), controller.phoneLanguage.displayName),
            )
        },
    )
    FormSection(
        rows = ScooterLanguage.byName.map { each ->
            @Composable { Choice(ScooterLanguageChoice.Language(each), ownName(each), each.nameIn(language)) }
        },
    )
}

/** A pass with one thing changed. */
private fun ProviderRidePass.changed(
    enabled: Boolean = this.enabled,
    freeUnlock: Boolean = this.freeUnlock,
    freeMinutes: Int = this.freeMinutes,
    expiryDate: Instant? = this.expiryDate,
) = ProviderRidePass(enabled, freeUnlock, freeMinutes, expiryDate)

/** Settings › Passes › a provider: whether the rider has a pass with it, what it gives, and until when. */
@Composable
private fun PassEditor(controller: ScooterMapController, provider: ScooterProvider, language: ScooterLanguage) {
    val passes by controller.ridePasses.collectAsState()
    val pass = passes[provider] ?: ProviderRidePass()
    val now = LocalClock.current()
    fun update(change: (ProviderRidePass) -> ProviderRidePass) = controller.setRidePass(change(controller.ridePass(provider)), provider)

    FormSection(
        footer = localized("Your pass details stay on this phone."),
        rows = listOf { FormToggleRow(localized("I have a pass"), pass.enabled) { on -> update { it.changed(enabled = on) } } },
    )

    if (pass.enabled) {
        FormSection(
            header = localized("Pass benefits"),
            rows = listOf(
                { FormToggleRow(localized("Free unlock"), pass.freeUnlock) { on -> update { it.changed(freeUnlock = on) } } },
                {
                    FormStepperRow(
                        title = localized("Free minutes available"),
                        value = pass.freeMinutes,
                        valueText = pass.freeMinutes.formatted(language.locale),
                        range = 0..500,
                        step = 5,
                    ) { minutes -> update { it.changed(freeMinutes = minutes) } }
                },
            ),
        )

        val expiry = pass.expiryDate
        FormSection(
            header = localized("Expiry"),
            footer = localized("Benefits remain active through the end of the selected day."),
            rows = buildList {
                add {
                    FormToggleRow(localized("Has expiry date"), expiry != null) { on ->
                        // A month from now, as the iPhone's calendar adds one.
                        val inAMonth = now.atZone(ScooterDateFormat.timeZone()).plusMonths(1).toInstant()
                        update { it.changed(expiryDate = if (on) inAMonth else null) }
                    }
                }
                if (expiry != null) {
                    add { DateRow(localized("Valid through"), expiry) { date -> update { it.changed(expiryDate = date) } } }
                    if (!pass.isActive(now)) add { ExpiredRow() }
                }
            },
        )
    }

    FormSection(
        rows = listOf {
            FormRow {
                Text(
                    localized("Pricing can vary. Confirm the final price and pass eligibility in the provider app before riding."),
                    style = ScootType.footnote,
                    color = scootColors.secondaryLabel,
                )
            }
        },
    )
}

/**
 * DatePicker with only the date, in its compact style: the day on a grey capsule, which opens a calendar to choose
 * another. The time of day [date] has stays as it is.
 */
@Composable
private fun DateRow(title: String, date: Instant, onChange: (Instant) -> Unit) {
    var picking by remember { mutableStateOf(false) }
    val zone = ScooterDateFormat.timeZone()
    val day = ScooterDateFormat.skeleton("yMMMd", date, zone, ScooterLanguage.current.locale)
    // Only the capsule opens the calendar, and greys under the finger; TalkBack reads the row as the picker, one
    // button that opens it.
    var pressed by remember { mutableStateOf(false) }
    FormValueRow(
        label = { Text(title, style = ScootType.body, color = scootColors.label) },
        modifier = Modifier.semantics {
            role = Role.Button
            onClick { picking = true; true }
        },
    ) {
        Box(
            Modifier
                .background(scootColors.tertiarySystemFill, CapsuleShape)
                .then(if (pressed) Modifier.background(scootColors.tertiarySystemFill, CapsuleShape) else Modifier)
                .pointerInput(Unit) {
                    detectTapGestures(
                        onPress = {
                            pressed = true
                            tryAwaitRelease()
                            pressed = false
                        },
                        onTap = { picking = true },
                    )
                }
                .padding(horizontal = 12.dp, vertical = 6.dp),
        ) {
            Text(day, style = ScootType.body, color = scootColors.label)
        }
    }
    if (picking) {
        val state = rememberDatePickerState(
            initialSelectedDateMillis = date.atZone(zone).toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli(),
        )
        DatePickerDialog(
            onDismissRequest = { picking = false },
            confirmButton = {
                TextButton(onClick = {
                    state.selectedDateMillis?.let { millis ->
                        val chosen = Instant.ofEpochMilli(millis).atZone(ZoneOffset.UTC).toLocalDate()
                        onChange(date.atZone(zone).with(chosen).toInstant())
                    }
                    picking = false
                }) { Text(localized("Done")) }
            },
            dismissButton = { TextButton(onClick = { picking = false }) { Text(localized("Cancel")) } },
        ) {
            DatePicker(state)
        }
    }
}

/** `Label("This pass has expired", systemImage: "exclamationmark.circle.fill")` in the warning's colour. */
@Composable
private fun ExpiredRow() {
    FormRow {
        val warning = scootColors.warning
        SymbolIcon(Symbols.exclamationCircleFill, textSymbolSize(15f), warning)
        Text(localized("This pass has expired"), style = ScootType.subheadline, color = warning, modifier = Modifier.weight(1f))
    }
}

/**
 * Settings › About › Privacy: the one choice about usage data, and the notice. It is given the [language] to be
 * written again when another is chosen.
 */
@Suppress("UNUSED_PARAMETER")
@Composable
private fun PrivacySettings(defaults: ScooterDefaults?, language: ScooterLanguage, links: Links) {
    var sharing by remember { mutableStateOf(defaults?.bool(forKey = ScooterAnalytics.disabledKey) != true) }
    FormSection(
        footer = localized("Helps improve ScootRadar. No addresses or precise locations are sent."),
        rows = listOf {
            FormToggleRow(localized("Share anonymous usage"), sharing) { on ->
                sharing = on
                defaults?.set(!on, forKey = ScooterAnalytics.disabledKey)
            }
        },
    )
    FormSection(
        rows = listOf { ExternalLinkRow(localized("Read the privacy notice"), onOpen = { links.open(ScooterLinks.privacyNotice) }) },
    )
}

/**
 * Settings › About › Map & data credits: where the map and the data come from, and the open-source notices of what
 * the app is built with. It is given the [language] to be written again when another is chosen.
 */
@Suppress("UNUSED_PARAMETER")
@Composable
private fun CreditsList(
    sources: List<ScooterCreditsList.Source>,
    language: ScooterLanguage,
    links: Links,
    push: (SettingsPage) -> Unit,
) {
    FormSection(
        rows = listOf {
            // The map's own credits are on the map, as on the web.
            FormValueRow(label = { Text(localized("Map"), style = ScootType.body, color = scootColors.label) }) {
                Text("OpenFreeMap · OpenStreetMap", style = ScootType.body, color = scootColors.secondaryLabel)
            }
        },
    )
    FormSection(rows = sources.map { source -> @Composable { ExternalLinkRow(source.title, onOpen = { links.open(source.url) }) } })
    FormSection(
        rows = listOf {
            FormNavigationRow(onClick = { push(SettingsPage.Notices) }) {
                FormText(localized("Open-source licences"), modifier = Modifier.weight(1f))
            }
        },
    )
}

/** The libraries and fonts the app ships, each with its licence, written again in the [language] chosen. */
@Suppress("UNUSED_PARAMETER")
@Composable
private fun NoticesList(language: ScooterLanguage, push: (SettingsPage) -> Unit) {
    FormSection(
        rows = openSourceNotices.map { notice ->
            @Composable {
                FormNavigationRow(onClick = { push(SettingsPage.Licence(notice)) }) {
                    FormText(notice.name, Modifier.weight(1f), notice.licence)
                }
            }
        },
    )
}

/** A licence's text, as the app ships it. */
@Composable
private fun LicenceText(notice: OpenSourceNotice) {
    val context = LocalContext.current
    val text = remember(notice) {
        reflowedLicence(context.assets.open("licences/${notice.file}").bufferedReader().use { it.readText() })
    }
    FormSection(
        rows = listOf {
            FormRow {
                Text(text, style = ScootType.footnote, color = scootColors.label, modifier = Modifier.fillMaxWidth())
            }
        },
    )
}

/** The provider's dot in a pass's row, and the room after it. */
private val PASS_DOT = 10.dp
private val PASS_GAP = 10.dp
