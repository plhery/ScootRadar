import Foundation
import MapKit
import SwiftUI
import UIKit

/// Colours for small text and filled controls. The system tints are too light
/// for that on glass; these keep a contrast of at least 4.5:1.
enum ScooterPalette {
    /// The app's blue under white text.
    static let actionFill = Color(red: 0, green: 0.42, blue: 0.9)
    /// Blue text on glass or on a blue tint.
    static let actionText = adaptive(
        light: UIColor(red: 0, green: 0.35, blue: 0.745, alpha: 1),
        dark: UIColor(red: 0.36, green: 0.69, blue: 1, alpha: 1)
    )
    static let warning = adaptive(
        light: UIColor(red: 0.54, green: 0.3, blue: 0, alpha: 1),
        dark: .systemOrange
    )
    static let good = adaptive(
        light: UIColor(red: 0.11, green: 0.47, blue: 0.2, alpha: 1),
        dark: .systemGreen
    )
    static let critical = adaptive(
        light: UIColor(red: 0.7, green: 0.15, blue: 0.12, alpha: 1),
        dark: .systemRed
    )
    /// Red under white text.
    static let criticalFill = Color(red: 0.76, green: 0.15, blue: 0.14)
    /// How much black the glass over the map gets in dark appearance, and how
    /// much white in light appearance.
    static let darkGlassTint = 0.62
    static let lightGlassTint = 0.15
    /// Grey for small text and its icons. The system's secondary label is
    /// about 3.5:1 on the light dock and on a light sheet; this is 5:1 there.
    /// In dark appearance it is the system's colour, which is light enough.
    static let secondaryText = adaptive(
        light: UIColor(red: 0.38, green: 0.39, blue: 0.42, alpha: 1),
        dark: UIColor.secondaryLabel.resolvedColor(with: UITraitCollection(userInterfaceStyle: .dark))
    )

    /// The dock and its cards: text, the line under a title, and labels and
    /// counts, which are quieter still.
    static let dockText = adaptive(
        light: UIColor(red: 0.063, green: 0.075, blue: 0.102, alpha: 1),
        dark: UIColor(red: 0.957, green: 0.961, blue: 0.969, alpha: 1)
    )
    static let dockSecondary = adaptive(
        light: UIColor(red: 0.231, green: 0.263, blue: 0.314, alpha: 1),
        dark: UIColor(red: 0.773, green: 0.788, blue: 0.82, alpha: 1)
    )
    static let dockQuiet = adaptive(
        light: UIColor(red: 0.4, green: 0.439, blue: 0.502, alpha: 1),
        dark: UIColor(red: 0.639, green: 0.659, blue: 0.702, alpha: 1)
    )
    /// What stands out from the dock: a chip.
    static let dockRaised = adaptive(
        light: .white,
        dark: UIColor(red: 0.086, green: 0.102, blue: 0.141, alpha: 1)
    )
    /// What sits on the glass of a card, a figure or the close button: by day
    /// a little brighter than the glass, so the card still reads as glass.
    static let dockTile = adaptive(
        light: UIColor(white: 1, alpha: 0.5),
        dark: UIColor(red: 0.086, green: 0.102, blue: 0.141, alpha: 1)
    )
    /// Under the quiet button of a card. By day a grey veil over the glass.
    static let dockQuietFill = adaptive(
        light: UIColor(red: 0.4, green: 0.439, blue: 0.502, alpha: 0.17),
        dark: UIColor(red: 0.114, green: 0.137, blue: 0.188, alpha: 1)
    )
    static let dockHairline = adaptive(
        light: UIColor(red: 0.063, green: 0.075, blue: 0.102, alpha: 0.1),
        dark: UIColor(white: 1, alpha: 0.1)
    )
    /// The text of a chip that is filled with the text colour.
    static let dockGround = adaptive(
        light: UIColor(red: 0.933, green: 0.941, blue: 0.957, alpha: 1),
        dark: UIColor(red: 0.043, green: 0.055, blue: 0.078, alpha: 1)
    )
    /// Under the white text of a card's main button.
    static let cardActionFill = Color(red: 0, green: 0.439, blue: 0.922)

    private static func adaptive(light: UIColor, dark: UIColor) -> Color {
        Color(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? dark : light
        })
    }
}

/// A size from the design of the dock, in points at the standard text size.
/// It grows and shrinks with the text size the rider has set.
private struct DesignFont: ViewModifier {
    @ScaledMetric private var size: CGFloat
    private let weight: Font.Weight

    init(size: CGFloat, weight: Font.Weight, relativeTo style: Font.TextStyle) {
        _size = ScaledMetric(wrappedValue: size, relativeTo: style)
        self.weight = weight
    }

    func body(content: Content) -> some View {
        content.font(.system(size: size, weight: weight))
    }
}

private extension View {
    func designFont(
        _ size: CGFloat,
        _ weight: Font.Weight = .regular,
        relativeTo style: Font.TextStyle = .body
    ) -> some View {
        modifier(DesignFont(size: size, weight: weight, relativeTo: style))
    }
}

/// Liquid Glass for the dock and for what floats at the top of the map. The
/// map shows through too strongly for small text: too brightly in dark
/// appearance, and too saturated over water in light appearance. So the glass
/// is tinted, darker in dark appearance and lighter in light appearance.
private struct ChromeGlass<S: Shape>: ViewModifier {
    let shape: S
    let isInteractive: Bool
    @Environment(\.colorScheme) private var colorScheme

    func body(content: Content) -> some View {
        let glass = colorScheme == .dark
            ? Glass.regular.tint(Color.black.opacity(ScooterPalette.darkGlassTint))
            : Glass.regular.tint(Color.white.opacity(ScooterPalette.lightGlassTint))
        content.glassEffect(glass.interactive(isInteractive), in: shape)
    }
}

extension View {
    func chromeGlass(in shape: some Shape, isInteractive: Bool = false) -> some View {
        modifier(ChromeGlass(shape: shape, isInteractive: isInteractive))
    }
}

struct ScooterControlDock: View {
    @Bindable var model: ScooterMapModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.colorScheme) private var colorScheme
    /// A phone's dock at the bottom, or the card of a large window's panel,
    /// which lists the providers one under the other and folds.
    private let layout: ScooterChromeLayout
    private let maximumContentHeight: CGFloat
    private let onEditFilters: () -> Void
    private let onHeightChange: (CGFloat) -> Void

    init(
        model: ScooterMapModel,
        layout: ScooterChromeLayout = .dock,
        maximumContentHeight: CGFloat = .infinity,
        onEditFilters: @escaping () -> Void = {},
        onHeightChange: @escaping (CGFloat) -> Void = { _ in }
    ) {
        self.model = model
        self.layout = layout
        self.maximumContentHeight = maximumContentHeight
        self.onEditFilters = onEditFilters
        self.onHeightChange = onHeightChange
    }

    var body: some View {
        let content = model.dock
        // Only the panel folds; a phone's dock always shows all it has.
        let isFolded = layout == .panel && model.isPanelCollapsed

        card(content, isFolded: isFolded)
        .foregroundStyle(ScooterPalette.dockText)
        .frame(maxWidth: 560)
        .background {
            if !isFolded { cardGlow(content) }
        }
        .chromeGlass(in: Self.shape)
        .overlay {
            Self.shape
                .strokeBorder(ScooterPalette.dockHairline, lineWidth: 1)
                .allowsHitTesting(false)
        }
        .shadow(color: .black.opacity(colorScheme == .dark ? 0.3 : 0.1), radius: 16, y: 10)
        .contentShape(Self.shape)
        .overlay(alignment: .bottom) {
            if layout == .panel {
                PanelGrabber(isFolded: isFolded) { folded in
                    model.isPanelCollapsed = folded
                }
                // Its 44 pt reach from the foot of the card to just past its
                // edge, and the handle shows 12 pt above the edge.
                .offset(y: Self.grabberOverhang)
            }
        }
        .onGeometryChange(for: CGFloat.self) { proxy in
            proxy.size.height
        } action: { height in
            onHeightChange(height)
        }
        .animation(
            reduceMotion ? nil : .snappy(duration: 0.28, extraBounce: 0.06),
            value: content.kind
        )
        .animation(reduceMotion ? nil : .snappy(duration: 0.3), value: isFolded)
        .onChange(of: content.kind) {
            // A card opens down here while VoiceOver is still on the marker,
            // and the out-of-date card replaces the count unasked.
            guard UIAccessibility.isVoiceOverRunning, let announcement = model.dockAnnouncement else { return }
            UIAccessibility.post(notification: .announcement, argument: announcement)
        }
        // The walking route is drawn on the map, away from the button that
        // asked for it, and the walk can end on its own.
        .animation(reduceMotion ? nil : .snappy(duration: 0.24), value: model.walk?.phase)
        .onChange(of: model.walkAnnouncement) { _, announcement in
            guard UIAccessibility.isVoiceOverRunning, let announcement else { return }
            UIAccessibility.post(notification: .announcement, argument: announcement.text)
        }
        .sensoryFeedback(.selection, trigger: model.enabledProviders)
    }

    private static let shape = RoundedRectangle(cornerRadius: 28, style: .continuous)

    /// Under the content of the panel's card, the room its grabber takes.
    static let panelFoot: CGFloat = 34
    /// Under the line of a folded card, where the grabber reaches up over the
    /// line's own foot: both unfold the card.
    private static let foldedFoot: CGFloat = 22
    /// How far the grabber's reach goes past the card's edge.
    private static let grabberOverhang: CGFloat = 10

    /// What the card holds, inside its edges: all of the content, which
    /// scrolls when taller than the room, or in a folded panel one line.
    @ViewBuilder
    private func card(_ content: ScooterDockContent, isFolded: Bool) -> some View {
        switch layout {
        case .dock:
            fullContent(content)
                .padding(16)
        case .panel:
            if isFolded {
                foldedLine
                    .padding(.top, 4)
                    .padding(.bottom, Self.foldedFoot)
                    .padding(.horizontal, 16)
                    .transition(.opacity)
            } else {
                fullContent(content)
                    .padding(.top, 16)
                    .padding(.bottom, Self.panelFoot)
                    .padding(.horizontal, 16)
                    .transition(.opacity)
            }
        }
    }

    /// Content taller than the room above the dock scrolls, as with large text.
    private func fullContent(_ content: ScooterDockContent) -> some View {
        HeightLimit(maximum: maximumContentHeight) {
            ViewThatFits(in: .vertical) {
                dockContent(content)
                ScrollView(.vertical) {
                    dockContent(content)
                }
            }
        }
    }

    /// The line a folded panel shows under its search bar. A tap on it opens
    /// the panel again, as the grabber does.
    private var foldedLine: some View {
        TimelineView(.periodic(from: .now, by: 30)) { context in
            let line = model.dockLine(at: context.date)
            Button {
                model.isPanelCollapsed = false
            } label: {
                FoldedDockLine(line: line)
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(line.accessibilityLabel)
            .accessibilityHint(String(localized: "Expands the panel"))
        }
    }

    /// A soft light in the provider's colour from the top left corner of a
    /// scooter's card.
    @ViewBuilder
    private func cardGlow(_ content: ScooterDockContent) -> some View {
        if case let .scooter(scooter) = content {
            let tint = providerAccent(scooter.providerInfo, colorScheme: colorScheme)
            GeometryReader { proxy in
                EllipticalGradient(
                    stops: [
                        .init(color: tint.opacity(0.2), location: 0),
                        .init(color: tint.opacity(0), location: 0.7)
                    ],
                    center: .topLeading,
                    startRadiusFraction: 0,
                    endRadiusFraction: 1
                )
                .frame(width: proxy.size.width * 0.9, height: proxy.size.height * 0.7)
            }
            .clipShape(Self.shape)
            .allowsHitTesting(false)
            .transition(.opacity)
        }
    }

    @ViewBuilder
    private func dockContent(_ content: ScooterDockContent) -> some View {
        switch content {
        case let .scooter(scooter):
            ScooterCard(model: model, scooter: scooter)
        case let .parking(parking):
            ParkingBayCard(model: model, parking: parking)
        case let .outOfDate(failure, lastUpdate):
            outOfDateCard(failure, lastUpdate: lastUpdate)
        case let .finding(chips, notices):
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    ProgressView()
                        .controlSize(.small)
                        .accessibilityHidden(true)
                    Text(String(localized: "Finding scooters…"))
                        .font(.subheadline.weight(.semibold))
                }
                .frame(maxWidth: .infinity, minHeight: Self.headerHeight, alignment: .leading)

                if !notices.isEmpty {
                    noticeRows(notices)
                }

                if !chips.isEmpty {
                    providerFilters(chips)
                }
            }
        case .waiting:
            Text(String(localized: "Waiting for scooter data"))
                .font(.subheadline.weight(.semibold))
                .frame(maxWidth: .infinity, minHeight: Self.headerHeight, alignment: .leading)
        case let .outsideCoverage(cities):
            outsideCoverageCard(cities)
        case let .filtersHideEverything(summary):
            hiddenByFiltersCard(summary)
        case let .summary(summary):
            summaryContent(summary)
        }
    }

    /// Count and status, and "Finding scooters…" in their place, keep one
    /// height so the dock does not jump while the map moves.
    private static let headerHeight: CGFloat = 38

    private func summaryContent(_ summary: ScooterDockSummary) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            // Very large text leaves no room for the pill beside the count
            // and the status, so it goes under them.
            let header = dynamicTypeSize.isAccessibilitySize
                ? AnyLayout(VStackLayout(alignment: .leading, spacing: 8))
                : AnyLayout(HStackLayout(spacing: 10))

            if let lead = summary.lead {
                VStack(alignment: .leading, spacing: 8) {
                    DockLeadButton(lead: lead, tint: providerAccent(lead.scooter.providerInfo, colorScheme: colorScheme)) {
                        model.focusOnScooter(lead.scooter)
                    }

                    // While all is well the status stays out of the way; a
                    // delay, old data or a failed refresh is always said.
                    TimelineView(.periodic(from: .now, by: 30)) { context in
                        if let status = summary.status(at: context.date), !status.isLive || summary.showsTryAgain {
                            header {
                                DockStatusLabel(status: status)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                if summary.showsTryAgain {
                                    TryAgainPill(isLoading: model.isLoading, action: model.retryLoad)
                                        .fixedSize(horizontal: !dynamicTypeSize.isAccessibilitySize, vertical: false)
                                        .transition(.opacity)
                                }
                            }
                        }
                    }
                }
            } else {
                header {
                    VStack(alignment: .leading, spacing: 1) {
                        countLine(summary)

                        TimelineView(.periodic(from: .now, by: 30)) { context in
                            if let status = summary.status(at: context.date) {
                                DockStatusLabel(status: status)
                            }
                        }
                    }
                    .frame(
                        maxWidth: .infinity,
                        minHeight: Self.headerHeight,
                        alignment: .leading
                    )

                    if summary.showsTryAgain {
                        TryAgainPill(isLoading: model.isLoading, action: model.retryLoad)
                            .fixedSize(horizontal: !dynamicTypeSize.isAccessibilitySize, vertical: false)
                            .transition(.opacity)
                    }
                }
            }

            if !summary.notices.isEmpty {
                noticeRows(summary.notices)
            }

            providerFilters(summary.chips)

            if let hint = summary.hint {
                DockNoteRow(
                    systemImage: hint == .tapCity ? "mappin.and.ellipse" : "scooter",
                    text: hint.text
                )
            }
        }
    }

    private func noticeRows(_ notices: [ScooterDockNotice]) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            ForEach(notices) { notice in
                DockNoteRow(
                    systemImage: notice.systemImage,
                    text: notice.text,
                    tint: notice.isCalm ? ScooterPalette.actionText : nil
                )
            }
        }
    }

    /// "22 scooters nearby": the count stands out, and the two are one
    /// text, so a long line wraps like a sentence.
    private func countLine(_ summary: ScooterDockSummary) -> some View {
        var count = AttributedString(summary.count.formatted(.number.locale(ScooterLanguage.current.locale)))
        count.swiftUI.font = .headline.weight(.bold).monospacedDigit()
        var label = AttributedString(" \(summary.countLabel)")
        label.swiftUI.font = .subheadline.weight(.semibold)

        return Text(count + label)
            .contentTransition(.numericText())
            .fixedSize(horizontal: false, vertical: true)
    }

    /// The providers: chips side by side in a phone's dock, and in the panel
    /// of a large window a list.
    @ViewBuilder
    private func providerFilters(_ chips: [ScooterProviderEntry]) -> some View {
        switch layout {
        case .dock: providerChips(chips)
        case .panel: providerList(chips)
        }
    }

    private func providerChips(_ chips: [ScooterProviderEntry]) -> some View {
        ScrollView(.horizontal) {
            HStack(spacing: 7) {
                QuickProviderFilterChip(
                    title: String(localized: "All"),
                    accessibilityTitle: String(localized: "All providers"),
                    count: model.allProviderCount,
                    color: nil,
                    isSelected: model.allProvidersSelected,
                    accessibilityIsShown: model.allProvidersSelected,
                    action: model.showAllProviders
                )

                ForEach(chips) { entry in
                    providerChip(entry)
                }
            }
            .animation(
                reduceMotion ? nil : .snappy(duration: 0.25),
                value: chips.map(\.provider)
            )
        }
        .scrollIndicators(.hidden)
        // The row runs to the edges of the dock, and a chip is 40 pt to look
        // at in a row that is 44 to touch.
        .contentMargins(.horizontal, 16, for: .scrollContent)
        .padding(.horizontal, -16)
        .padding(.vertical, -2)
    }

    private func providerChip(_ entry: ScooterProviderEntry) -> some View {
        QuickProviderFilterChip(
            title: entry.provider.name,
            accessibilityTitle: entry.isDown ? entry.downLabel : entry.provider.name,
            count: entry.count,
            color: providerAccent(entry.provider, colorScheme: colorScheme),
            isSelected: entry.isSelected,
            isDown: entry.isDown,
            accessibilityIsShown: entry.isEnabled
        ) {
            model.toggleQuickProvider(entry.provider)
        }
        .accessibilityHint(quickProviderHint(entry.provider))
    }

    /// The providers one under the other, as the website's legend beside the
    /// map on a computer: "All providers", then each provider with its dot,
    /// its count and a check while it is shown. A row does what its chip
    /// does, so folding an iPhone Duo between the panel and the dock changes
    /// nothing but the look.
    private func providerList(_ chips: [ScooterProviderEntry]) -> some View {
        VStack(spacing: 0) {
            ProviderListRow(
                title: String(localized: "All providers"),
                accessibilityTitle: String(localized: "All providers"),
                count: model.allProviderCount,
                color: nil,
                isShown: model.allProvidersSelected,
                action: model.showAllProviders
            )

            ForEach(chips) { entry in
                ProviderListRow(
                    title: entry.provider.name,
                    accessibilityTitle: entry.isDown ? entry.downLabel : entry.provider.name,
                    count: entry.count,
                    color: providerAccent(entry.provider, colorScheme: colorScheme),
                    isShown: entry.isEnabled,
                    isDown: entry.isDown
                ) {
                    model.toggleQuickProvider(entry.provider)
                }
                .accessibilityHint(quickProviderHint(entry.provider))
            }
        }
        .animation(
            reduceMotion ? nil : .snappy(duration: 0.25),
            value: chips.map(\.provider)
        )
        // The rows and the lines between them run to the edges of the card.
        .padding(.horizontal, -16)
    }

    private func quickProviderHint(_ provider: ScooterProvider) -> String {
        if model.allProvidersSelected {
            return String(localized: "Shows only this provider")
        }
        if model.enabledProviders == [provider] {
            return String(localized: "Shows all providers")
        }
        if model.enabledProviders.contains(provider) {
            return String(localized: "Hides this provider")
        }
        return String(localized: "Adds this provider")
    }

    private func outOfDateCard(_ failure: ScooterLoadFailure, lastUpdate: Date) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            DockCardHeader(
                systemImage: "clock",
                tint: ScooterPalette.warning,
                title: String(localized: "These positions are out of date"),
                message: ScooterDockStatus.outOfDateBody(failure, lastUpdate: lastUpdate)
            )

            DockActionRow {
                Button(action: model.retryLoad) {
                    ZStack {
                        Label("Try again", systemImage: "arrow.clockwise")
                            .opacity(model.isLoading ? 0 : 1)
                        if model.isLoading {
                            ProgressView()
                                .tint(.white)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .foregroundStyle(.white)
                }
                .dockActionStyle(prominent: true)
                .disabled(model.isLoading)
                .accessibilityLabel(String(localized: "Try again"))
            }
        }
    }

    private func outsideCoverageCard(_ cities: [ScooterCityDistance]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            DockCardHeader(
                systemImage: "map",
                tint: ScooterPalette.actionText,
                title: String(localized: "No scooter data here yet"),
                message: ScooterCoverageSummary.text()
            )

            VStack(alignment: .leading, spacing: 8) {
                Text("Closest cities")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(ScooterPalette.secondaryText)
                    .accessibilityAddTraits(.isHeader)

                FlowLayout(spacing: 8, lineSpacing: 8) {
                    ForEach(cities) { entry in
                        Button {
                            model.focusOnCity(entry.city)
                        } label: {
                            Label(entry.label, systemImage: "mappin.and.ellipse")
                                .font(.subheadline.weight(.semibold))
                                .monospacedDigit()
                                .padding(.horizontal, 12)
                                .frame(minHeight: 44)
                                .background(Color.primary.opacity(0.055), in: Capsule())
                                .overlay {
                                    Capsule().stroke(Color.secondary.opacity(0.16), lineWidth: 1)
                                }
                                .contentShape(Capsule())
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private func hiddenByFiltersCard(_ summary: ScooterFilterSummary) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            DockCardHeader(
                systemImage: "line.3.horizontal.decrease",
                tint: ScooterPalette.actionText,
                title: summary.title,
                message: summary.body
            )

            DockActionRow {
                Button(action: model.resetFilters) {
                    // "Show all 1" reads badly; one hidden scooter gets the plain label.
                    Text(summary.hiddenCount == 1 ? String(localized: "Show all") : summary.showAllTitle)
                        .frame(maxWidth: .infinity)
                        .foregroundStyle(.white)
                }
                .dockActionStyle(prominent: true)

                Button(action: onEditFilters) {
                    Text("Edit filters")
                        .frame(maxWidth: .infinity)
                }
                .dockActionStyle(prominent: false)
            }
        }
    }
}

private extension ScooterDockContent {
    /// What the dock shows, without its details: a change of kind animates.
    var kind: String {
        switch self {
        case let .scooter(scooter): "scooter:\(scooter.id)"
        case let .parking(parking): "parking:\(parking.id)"
        case .outOfDate: "outOfDate"
        case .finding: "finding"
        case .waiting: "waiting"
        case .outsideCoverage: "outsideCoverage"
        case .filtersHideEverything: "filtersHideEverything"
        case .summary: "summary"
        }
    }
}

/// Gives its content the height it asks for, up to a limit.
struct HeightLimit: Layout {
    let maximum: CGFloat

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        guard let content = subviews.first else { return .zero }
        let ideal = content.sizeThatFits(ProposedViewSize(width: proposal.width, height: nil))
        return CGSize(width: ideal.width, height: min(ideal.height, maximum))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        subviews.first?.place(
            at: bounds.origin,
            proposal: ProposedViewSize(width: bounds.width, height: bounds.height)
        )
    }

    // The default answers a question about alignment by placing the content again.
    // With very large text, a card taller than the limit that opened in a dock
    // already on screen kept the layout busy without end and the app froze.
    func explicitAlignment(
        of guide: HorizontalAlignment, in bounds: CGRect, proposal: ProposedViewSize,
        subviews: Subviews, cache: inout ()
    ) -> CGFloat? { nil }

    func explicitAlignment(
        of guide: VerticalAlignment, in bounds: CGRect, proposal: ProposedViewSize,
        subviews: Subviews, cache: inout ()
    ) -> CGFloat? { nil }
}

/// Rows that wrap: pills and chips move to the next line when one is full.
struct FlowLayout: Layout {
    var spacing: CGFloat = 6
    var lineSpacing: CGFloat = 6

    private struct Row {
        var sizes: [CGSize] = []
        var width: CGFloat = 0
        var height: CGFloat = 0
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let rows = rows(for: subviews, width: proposal.width)
        let height = rows.reduce(0) { $0 + $1.height } + lineSpacing * CGFloat(max(0, rows.count - 1))
        return CGSize(width: rows.map(\.width).max() ?? 0, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var index = subviews.startIndex
        var y = bounds.minY
        for row in rows(for: subviews, width: bounds.width) {
            var x = bounds.minX
            for size in row.sizes {
                subviews[index].place(
                    at: CGPoint(x: x, y: y + (row.height - size.height) / 2),
                    proposal: ProposedViewSize(size)
                )
                x += size.width + spacing
                index = subviews.index(after: index)
            }
            y += row.height + lineSpacing
        }
    }

    private func rows(for subviews: Subviews, width: CGFloat?) -> [Row] {
        let available = width ?? .infinity
        var rows = [Row()]
        for subview in subviews {
            let size = subview.sizeThatFits(ProposedViewSize(width: width, height: nil))
            var row = rows[rows.count - 1]
            if !row.sizes.isEmpty, row.width + spacing + size.width > available {
                row = Row()
                rows.append(row)
            }
            row.width += (row.sizes.isEmpty ? 0 : spacing) + size.width
            row.height = max(row.height, size.height)
            row.sizes.append(size)
            rows[rows.count - 1] = row
        }
        return rows
    }
}

/// The status line under the count, and at the top of a card while data is
/// failing. It wraps rather than lose the time at its end.
private struct DockStatusLabel: View {
    let status: ScooterDockStatus

    var body: some View {
        HStack(spacing: 5) {
            if status.isLive {
                LiveIndicator()
            } else if status.isUpdating {
                ProgressView()
                    .controlSize(.mini)
                    .accessibilityHidden(true)
            } else if status.isWarning {
                Image(systemName: "exclamationmark.triangle")
                    .font(.caption2.weight(.semibold))
                    .accessibilityHidden(true)
            }

            Text(status.text)
                .font(.caption)
                .monospacedDigit()
                .fixedSize(horizontal: false, vertical: true)
        }
        .foregroundStyle(status.isWarning ? ScooterPalette.warning : ScooterPalette.secondaryText)
    }
}

/// A calm line in the dock: a small icon and secondary text.
private struct DockNoteRow: View {
    let systemImage: String
    let text: String
    /// The symbol's own colour; the text's when nil.
    var tint: Color?

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Image(systemName: systemImage)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(tint ?? ScooterPalette.secondaryText)
                .accessibilityHidden(true)
            Text(text)
                .font(.caption)
                .monospacedDigit()
                .fixedSize(horizontal: false, vertical: true)
        }
        .foregroundStyle(ScooterPalette.secondaryText)
        .padding(.leading, 2)
    }
}

private struct TryAgainPill: View {
    let isLoading: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                Text("Try again")
                    .opacity(isLoading ? 0 : 1)
                if isLoading {
                    ProgressView()
                        .controlSize(.small)
                }
            }
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(ScooterPalette.actionText)
            .padding(.horizontal, 14)
            .frame(minHeight: 44)
            .background(ScooterPalette.actionText.opacity(0.12), in: Capsule())
            .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .disabled(isLoading)
        .accessibilityLabel(String(localized: "Try again"))
    }
}

/// The head of a dock card: a tinted symbol, a title and the sentence under it.
private struct DockCardHeader: View {
    let systemImage: String
    let tint: Color
    let title: String
    let message: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            DockSymbolTile(systemImage: systemImage, foreground: tint, tint: tint)

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.headline)
                if !message.isEmpty {
                    Text(message)
                        .font(.subheadline)
                        .foregroundStyle(ScooterPalette.secondaryText)
                }
            }
            .fixedSize(horizontal: false, vertical: true)

            Spacer(minLength: 0)
        }
        .accessibilityElement(children: .combine)
    }
}

private struct DockSymbolTile: View {
    let systemImage: String
    var foreground: Color = .primary
    let tint: Color
    var size: CGFloat = 44

    var body: some View {
        Image(systemName: systemImage)
            .font(.system(size: size * 0.43, weight: .semibold))
            .foregroundStyle(foreground)
            .frame(width: size, height: size)
            .background(
                tint.opacity(0.16),
                in: RoundedRectangle(cornerRadius: size / 3, style: .continuous)
            )
            .accessibilityHidden(true)
    }
}

/// One or two buttons whose labels stay on one line: side by side where
/// they fit, one above the other where they do not or the text is very large.
private struct DockActionRow<Content: View>: View {
    /// The share of the row each button takes; equal shares when empty.
    var weights: [CGFloat] = []
    @ViewBuilder let content: Content
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        DockActionLayout(spacing: 8, weights: weights, alwaysStacks: dynamicTypeSize.isAccessibilitySize) { content }
    }
}

/// Buttons share the row, equally or by their weights, while every label
/// fits on one line. When the shares are too narrow the last button takes the
/// room the others leave, and when that is too narrow as well each button
/// gets a row.
private struct DockActionLayout: Layout {
    var spacing: CGFloat = 9
    var weights: [CGFloat] = []
    var alwaysStacks = false

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let frames = frames(for: subviews, width: proposal.width)
        return CGSize(
            width: frames.map(\.maxX).max() ?? 0,
            height: frames.map(\.maxY).max() ?? 0
        )
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for (subview, frame) in zip(subviews, frames(for: subviews, width: bounds.width)) {
            subview.place(
                at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
                proposal: ProposedViewSize(frame.size)
            )
        }
    }

    private func frames(for subviews: Subviews, width: CGFloat?) -> [CGRect] {
        // What each button needs to keep its label on one line.
        let ideal = subviews.map { $0.sizeThatFits(.unspecified).width }
        let widest = ideal.max() ?? 0
        let count = CGFloat(subviews.count)
        let gaps = spacing * max(0, count - 1)
        let available = width ?? widest * count + gaps

        let weights = weights.count == subviews.count
            ? weights
            : Array(repeating: 1, count: subviews.count)
        let shares = weights.map { (available - gaps) * $0 / max(1, weights.reduce(0, +)) }

        var widths: [CGFloat]?
        if subviews.count == 1 || (!alwaysStacks && zip(ideal, shares).allSatisfy { $0 <= $1 + 0.5 }) {
            widths = shares
        } else if !alwaysStacks, ideal.reduce(0, +) + gaps <= available + 0.5 {
            widths = ideal
            widths?[subviews.count - 1] = available - gaps - ideal.dropLast().reduce(0, +)
        }

        guard let widths else {
            var y: CGFloat = 0
            return subviews.map { subview in
                let height = subview.sizeThatFits(ProposedViewSize(width: available, height: nil)).height
                defer { y += height + spacing }
                return CGRect(x: 0, y: y, width: available, height: height)
            }
        }

        let height = zip(subviews, widths)
            .map { $0.sizeThatFits(ProposedViewSize(width: $1, height: nil)).height }
            .max() ?? 0
        var x: CGFloat = 0
        return widths.map { width in
            defer { x += width + spacing }
            return CGRect(x: x, y: 0, width: width, height: height)
        }
    }
}

/// A button of a dock card, 48 pt high: filled with the app's blue, or quiet
/// beside it.
private struct DockActionStyle: ButtonStyle {
    let prominent: Bool
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        let shape = RoundedRectangle(cornerRadius: 16, style: .continuous)
        configuration.label
            .designFont(14, .bold, relativeTo: .subheadline)
            .lineLimit(1)
            .foregroundStyle(prominent ? Color.white : ScooterPalette.dockText)
            .padding(.horizontal, 12)
            .frame(maxWidth: .infinity, minHeight: 48)
            .background(prominent ? ScooterPalette.cardActionFill : ScooterPalette.dockQuietFill, in: shape)
            .opacity(configuration.isPressed ? 0.78 : isEnabled ? 1 : 0.6)
            .contentShape(shape)
    }
}

private extension View {
    func dockActionStyle(prominent: Bool) -> some View {
        buttonStyle(DockActionStyle(prominent: prominent))
    }

    func dockPill(_ foreground: Color = .primary, background: Color = Color(uiColor: .tertiarySystemFill)) -> some View {
        font(.caption.weight(.semibold))
            .monospacedDigit()
            .foregroundStyle(foreground)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .frame(minHeight: 32)
            .background(background, in: Capsule())
    }
}

private struct DockCloseButton: View {
    let accessibilityLabel: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: "xmark")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(ScooterPalette.dockQuiet)
                .frame(width: 40, height: 40)
                .background(ScooterPalette.dockTile, in: Circle())
                .overlay {
                    Circle().strokeBorder(ScooterPalette.dockHairline, lineWidth: 1)
                }
                // 40 pt to look at, 44 to touch.
                .padding(2)
                .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .padding(-2)
        .accessibilityLabel(accessibilityLabel)
    }
}

/// A scooter or bay card hides the dock's status line, so a failed refresh or
/// delayed data is reported here. Nothing shows while the data is healthy.
private struct CardStatusLine: View {
    let model: ScooterMapModel
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        if let status = model.cardStatus {
            if dynamicTypeSize.isAccessibilitySize {
                // Very large text: the status keeps the whole width.
                VStack(alignment: .leading, spacing: 0) {
                    DockStatusLabel(status: status)
                    if status.isWarning {
                        tryAgain
                    }
                }
            } else {
                HStack(spacing: 8) {
                    DockStatusLabel(status: status)
                    Spacer(minLength: 4)
                    if status.isWarning {
                        tryAgain
                            .fixedSize(horizontal: true, vertical: false)
                    }
                }
                // The button keeps its 44 pt target; the line stays compact.
                .padding(.vertical, status.isWarning ? -8 : 0)
            }
        }
    }

    private var tryAgain: some View {
        Button(action: model.retryLoad) {
            Text("Try again")
                .font(.caption.weight(.semibold))
                .foregroundStyle(ScooterPalette.actionText)
                .frame(minHeight: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(model.isLoading)
    }
}

private struct QuickProviderFilterChip: View {
    let title: String
    let accessibilityTitle: String
    let count: Int
    /// The provider's colour; nil for "All".
    let color: Color?
    let isSelected: Bool
    /// Not sharing data and none in view: dashed, with a warning instead of a count.
    var isDown = false
    let accessibilityIsShown: Bool
    let action: () -> Void

    private static let shape = RoundedRectangle(cornerRadius: 14, style: .continuous)

    var body: some View {
        Button(action: action) {
            HStack(spacing: 7) {
                if let color {
                    Circle()
                        .fill(isDown ? ScooterPalette.dockQuiet : color)
                        .frame(width: 8, height: 8)
                        .accessibilityHidden(true)
                }

                Text(title)
                    .designFont(13, .semibold, relativeTo: .footnote)
                    .lineLimit(1)

                if isDown {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(ScooterPalette.warning)
                } else {
                    Text(count, format: .number)
                        .designFont(11.5, .bold, relativeTo: .caption2)
                        .monospacedDigit()
                        .foregroundStyle(isSelected ? foreground.opacity(0.6) : ScooterPalette.dockQuiet)
                        .contentTransition(.numericText())
                }
            }
            .foregroundStyle(foreground)
            .padding(.horizontal, 12)
            .frame(minHeight: 40)
            .background(background, in: Self.shape)
            .overlay {
                if isDown {
                    Self.shape
                        .strokeBorder(
                            ScooterPalette.dockQuiet.opacity(0.7),
                            style: StrokeStyle(lineWidth: 1, dash: [4, 3])
                        )
                } else if !isSelected {
                    Self.shape.strokeBorder(ScooterPalette.dockHairline, lineWidth: 1)
                }
            }
            .padding(.vertical, 2)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(accessibilityLabel)
        .accessibilityValue(
            accessibilityIsShown ? String(localized: "Shown") : String(localized: "Hidden")
        )
    }

    /// A chosen chip is filled with the text colour and written in the ground's.
    private var foreground: Color {
        if isDown { return ScooterPalette.dockQuiet }
        return isSelected ? ScooterPalette.dockGround : ScooterPalette.dockText
    }

    private var background: Color {
        if isDown { return .clear }
        return isSelected ? ScooterPalette.dockText : ScooterPalette.dockRaised
    }

    private var accessibilityLabel: String {
        Self.accessibilityLabel(title: accessibilityTitle, count: count, isDown: isDown)
    }

    /// "Lime, 12 scooters", or what is said of a provider that isn't sharing
    /// data. The rows of the panel's list read the same.
    static func accessibilityLabel(title: String, count: Int, isDown: Bool) -> String {
        if isDown { return title }
        if count == 1 {
            return String(format: String(localized: "%@, one scooter"), title)
        }
        return String(
            format: String(localized: "%@, %lld scooters"),
            title,
            Int64(count)
        )
    }
}

/// A provider in the panel's list, as in the website's legend: its dot, its
/// name, its count and a check while its scooters are shown. One that isn't
/// sharing data is quiet, as its chip is, with a warning in place of the
/// count and, while it is chosen, a dashed circle in place of the check.
private struct ProviderListRow: View {
    let title: String
    let accessibilityTitle: String
    let count: Int
    /// The provider's colour; nil for "All providers".
    let color: Color?
    /// Shown on the map: the check, and the selected state for VoiceOver.
    let isShown: Bool
    var isDown = false
    let action: () -> Void
    @ScaledMetric(relativeTo: .subheadline) private var checkSize: CGFloat = 20

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                if let color {
                    Circle()
                        .fill(isDown ? ScooterPalette.dockQuiet : color)
                        .frame(width: 10, height: 10)
                }

                Text(title)
                    .designFont(14.5, .semibold, relativeTo: .subheadline)
                    .foregroundStyle(isShown && !isDown ? ScooterPalette.dockText : ScooterPalette.dockQuiet)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)

                if isDown {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(ScooterPalette.warning)
                } else {
                    Text(count, format: .number)
                        .designFont(12.5, .semibold, relativeTo: .footnote)
                        .monospacedDigit()
                        .foregroundStyle(ScooterPalette.dockQuiet)
                        .contentTransition(.numericText())
                }

                check
                    .frame(width: checkSize, height: checkSize)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 6)
            .frame(minHeight: 44)
            .overlay(alignment: .top) {
                Rectangle()
                    .fill(ScooterPalette.dockHairline)
                    .frame(height: 1)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(
            QuickProviderFilterChip.accessibilityLabel(title: accessibilityTitle, count: count, isDown: isDown)
        )
        .accessibilityValue(isShown ? String(localized: "Shown") : String(localized: "Hidden"))
        .accessibilityAddTraits(isShown ? .isSelected : [])
    }

    @ViewBuilder
    private var check: some View {
        if isShown && isDown {
            Circle()
                .strokeBorder(ScooterPalette.dockQuiet, style: StrokeStyle(lineWidth: 1.5, dash: [3.5, 3]))
                .padding(2)
        } else if isShown {
            Image(systemName: "checkmark")
                .designFont(14, .bold, relativeTo: .subheadline)
                .foregroundStyle(ScooterPalette.actionText)
        }
    }
}

/// The line of a folded panel: a mark, then what the dock shows in a few
/// words, the first of them standing out. With large text it wraps between
/// its parts, never inside one, unless a part is wider than the line.
struct FoldedDockLine: View {
    let line: ScooterDockLine
    @Environment(\.colorScheme) private var colorScheme
    /// The mark's column and the height of the first line of text, beside
    /// which it stands, grow with the text: a symbol drawn at the text's size
    /// stays inside the card at every size.
    @ScaledMetric(relativeTo: .subheadline) private var markWidth: CGFloat = 18
    @ScaledMetric(relativeTo: .subheadline) private var lineHeight: CGFloat = 20
    @ScaledMetric(relativeTo: .subheadline) private var dotSize: CGFloat = 10
    /// The room of a space between two parts.
    @ScaledMetric(relativeTo: .subheadline) private var gap: CGFloat = 4

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            mark
                .fixedSize()
                .frame(minWidth: markWidth, minHeight: lineHeight)
                .accessibilityHidden(true)

            PartsFlow(spacing: gap) {
                ForEach(Array(line.parts.enumerated()), id: \.offset) { index, part in
                    Text(text(of: part, at: index))
                        .multilineTextAlignment(.leading)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private var mark: some View {
        switch line.mark {
        case let .provider(provider):
            Circle()
                .fill(providerAccent(provider, colorScheme: colorScheme))
                .frame(width: dotSize, height: dotSize)
        case .progress:
            ProgressView()
                .controlSize(.small)
        case let .symbol(name):
            Image(systemName: name)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(line.isWarning ? ScooterPalette.warning : ScooterPalette.actionText)
        }
    }

    /// A part as it is written: the first in bold, the status last, in the
    /// warning colour after a failed refresh, and every part but the last
    /// followed by a dot, which stays at the end of a line when the line wraps.
    private func text(of part: String, at index: Int) -> AttributedString {
        let parts = line.parts
        let isStatus = line.status != nil && index == parts.count - 1
        var text = AttributedString(part)
        text.swiftUI.font = index == 0
            ? .subheadline.weight(.semibold).monospacedDigit()
            : .subheadline.monospacedDigit()
        if index > 0 {
            text.swiftUI.foregroundColor = isStatus && line.status?.isWarning == true
                ? ScooterPalette.warning
                : ScooterPalette.dockQuiet
        }
        guard index < parts.count - 1 else { return text }
        var dot = AttributedString("\u{00A0}·")
        dot.swiftUI.font = .subheadline
        dot.swiftUI.foregroundColor = ScooterPalette.dockQuiet
        return text + dot
    }
}

/// Lays out its parts as the words of a paragraph: side by side while they
/// fit, and the next on a new row when it doesn't. A part is never broken,
/// unless it is wider than a row on its own; it then takes a row of its own
/// and wraps inside it.
struct PartsFlow: Layout {
    var spacing: CGFloat

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let frames = arrange(subviews, in: proposal.width ?? .infinity)
        return CGSize(
            width: frames.map(\.maxX).max() ?? 0,
            height: frames.map(\.maxY).max() ?? 0
        )
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let frames = arrange(subviews, in: bounds.width)
        for (subview, frame) in zip(subviews, frames) {
            subview.place(
                at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
                proposal: ProposedViewSize(frame.size)
            )
        }
    }

    private func arrange(_ subviews: Subviews, in width: CGFloat) -> [CGRect] {
        Self.frames(
            of: subviews.map { subview in subview.sizeThatFits(.unspecified) },
            in: width,
            spacing: spacing,
            wrapped: { index, width in subviews[index].sizeThatFits(ProposedViewSize(width: width, height: nil)) }
        )
    }

    /// Where each part goes, row after row, in a width, from the size each
    /// takes on one line and the size `wrapped` gives one wrapped to a width.
    static func frames(
        of sizes: [CGSize],
        in width: CGFloat,
        spacing: CGFloat,
        wrapped: (Int, CGFloat) -> CGSize
    ) -> [CGRect] {
        var frames: [CGRect] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        for (index, oneLine) in sizes.enumerated() {
            var size = oneLine
            if x > 0, x + spacing + size.width > width {
                y += rowHeight
                x = 0
                rowHeight = 0
            }
            if size.width > width {
                // Wider than a row: it wraps, in a row of its own.
                size = wrapped(index, width)
            }
            let originX = x > 0 ? x + spacing : 0
            frames.append(CGRect(origin: CGPoint(x: originX, y: y), size: size))
            x = originX + size.width
            rowHeight = max(rowHeight, size.height)
        }
        return frames
    }
}

/// The handle at the foot of the panel's card, as on the card of Maps: a tap
/// folds the card down to one line under the search bar or opens it again,
/// and so does a swipe up or down on it.
private struct PanelGrabber: View {
    let isFolded: Bool
    let setFolded: (Bool) -> Void

    var body: some View {
        Button {
            setFolded(!isFolded)
        } label: {
            Capsule()
                .fill(ScooterPalette.dockQuiet.opacity(0.55))
                .frame(width: 36, height: 5)
                // The width of the card and 44 pt high take the tap.
                .frame(maxWidth: .infinity, minHeight: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .highPriorityGesture(
            DragGesture(minimumDistance: 10)
                .onEnded { drag in
                    let distance = drag.translation.height
                    guard abs(distance) >= 16 else { return }
                    setFolded(distance < 0)
                }
        )
        .accessibilityLabel(isFolded ? String(localized: "Expand panel") : String(localized: "Collapse panel"))
        .accessibilityValue(isFolded ? String(localized: "Collapsed") : String(localized: "Expanded"))
    }
}

/// The nearest scooter at the head of the dock: its distance as a large
/// figure, whose it is and how long the walk takes. One button, which opens
/// its card and brings it into view.
private struct DockLeadButton: View {
    let lead: ScooterDockLead
    let tint: Color
    let action: () -> Void
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        Button(action: action) {
            // Very large text: the figure keeps a line to itself.
            let row = dynamicTypeSize.isAccessibilitySize
                ? AnyLayout(VStackLayout(alignment: .leading, spacing: 4))
                : AnyLayout(HStackLayout(spacing: 14))

            HStack(spacing: 10) {
                row {
                    Text(lead.distance)
                        .designFont(38, .black, relativeTo: .largeTitle)
                        .tracking(-1.5)
                        .monospacedDigit()
                        .lineLimit(1)
                        .fixedSize()
                        .contentTransition(.numericText())

                    VStack(alignment: .leading, spacing: 3) {
                        Text(String(localized: "to the nearest scooter"))
                            .designFont(14.5, .bold, relativeTo: .subheadline)
                        HStack(alignment: .firstTextBaseline, spacing: 6) {
                            Circle()
                                .fill(tint)
                                .frame(width: 8, height: 8)
                                .alignmentGuide(.firstTextBaseline) { $0[.bottom] + 1 }
                            Text(lead.detail)
                                .designFont(12.5, relativeTo: .footnote)
                                .monospacedDigit()
                        }
                        .foregroundStyle(ScooterPalette.dockQuiet)
                    }
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Image(systemName: "chevron.right")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(ScooterPalette.dockQuiet)
            }
            .frame(minHeight: 44)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(lead.accessibilityLabel)
    }
}

private struct ScooterCard: View {
    let model: ScooterMapModel
    let scooter: Scooter
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        let content = model.cardContent(for: scooter)

        VStack(alignment: .leading, spacing: 0) {
            if model.cardStatus != nil {
                CardStatusLine(model: model)
                    .padding(.bottom, 10)
            }

            header(content)

            if !content.figures.isEmpty {
                figures(content.figures)
                    .padding(.top, 14)
            }

            Text(content.note)
                .designFont(12, relativeTo: .caption)
                .monospacedDigit()
                .foregroundStyle(ScooterPalette.dockQuiet)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 2)
                .padding(.top, 10)

            if let curfew = content.curfew {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Image(systemName: "moon.fill")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(ScooterPalette.actionText)
                        .accessibilityHidden(true)
                    Text(curfew)
                        .designFont(12, relativeTo: .caption)
                        .monospacedDigit()
                        .foregroundStyle(ScooterPalette.dockQuiet)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.horizontal, 2)
                .padding(.top, 4)
            }

            if let note = model.walkNote(for: .scooter(scooter)) {
                WalkNoteRow(note: note)
                    .padding(.top, 12)
                    .transition(.opacity)
            }

            // "Open in …" is the wider of the two. Where the feed links no scooter, as Lime's
            // and Bird's never do, it opens the operator's app, or else its App Store page.
            DockActionRow(weights: scooter.rentalURL == nil && scooter.operatorApp == nil ? [] : [1.5, 1]) {
                if scooter.rentalURL != nil || scooter.operatorApp != nil {
                    Button {
                        model.rentalOpened()
                        if scooter.rentalURL != nil {
                            ScooterAnalytics.shared.track("rental_open", provider: scooter.provider)
                            Task { await scooter.openRental() }
                        } else {
                            ScooterAnalytics.shared.track("rental_open", provider: scooter.provider, result: "app")
                            Task { await scooter.openOperatorApp() }
                        }
                    } label: {
                        Label(
                            String(format: String(localized: "Open in %@"), providerName),
                            systemImage: "scooter"
                        )
                    }
                    .dockActionStyle(prominent: true)
                }

                DirectionsButton(model: model, target: .scooter(scooter), prominent: false)
            }
            .padding(.top, 12)
            // A scooter gone from the map can be neither rented nor walked to.
            .removed(model.directionsControl(for: .scooter(scooter)) == .none)
        }
    }

    private func header(_ content: ScooterCardContent) -> some View {
        HStack(spacing: 11) {
            if model.straightLineDistance(to: scooter) != nil {
                Button {
                    model.focusOnScooter(scooter)
                } label: {
                    HStack(spacing: 11) {
                        tile
                        titleBlock {
                            if let facts = content.facts {
                                Text(facts)
                                    .foregroundStyle(ScooterPalette.dockQuiet)
                                    .monospacedDigit()
                            }
                        }
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityHint(String(localized: "Centers this scooter on the map"))
            } else {
                Button {
                    model.focusOnScooter(scooter)
                } label: {
                    tile
                }
                .buttonStyle(.plain)
                .accessibilityLabel(providerName)
                .accessibilityHint(String(localized: "Centers this scooter on the map"))

                if model.isLocating {
                    titleBlock {
                        HStack(spacing: 6) {
                            ProgressView()
                                .controlSize(.mini)
                                .accessibilityHidden(true)
                            Text("Finding your location…")
                        }
                        .foregroundStyle(ScooterPalette.dockQuiet)
                    }
                    .accessibilityElement(children: .combine)
                } else {
                    // Locates without moving the map, so this card stays open.
                    Button(action: model.locateForWalkingTime) {
                        titleBlock {
                            Text("Turn on location to see walking time")
                                .foregroundStyle(ScooterPalette.actionText)
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            }

            Spacer(minLength: 4)

            DockCloseButton(accessibilityLabel: String(localized: "Close scooter details")) {
                model.selectScooter(nil)
            }
        }
    }

    /// The provider's colour with its initials, in the ink that reads on it.
    private var tile: some View {
        let provider = scooter.providerInfo
        let isDark = colorScheme == .dark
        return Text(verbatim: provider?.shortName ?? "?")
            .font(.system(size: 14, weight: .heavy))
            .foregroundStyle(Color(uiColor: ScooterMapLook.ink(on: provider, isDark: isDark)))
            .frame(width: 40, height: 40)
            .background(
                Color(uiColor: ScooterMapLook.dotColor(provider, isDark: isDark)),
                in: RoundedRectangle(cornerRadius: 12, style: .continuous)
            )
            .accessibilityHidden(true)
    }

    private func titleBlock(@ViewBuilder subtitle: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(providerName)
                .designFont(19, .heavy, relativeTo: .headline)
                .tracking(-0.38)
            subtitle()
                .designFont(12.5, relativeTo: .footnote)
        }
        .multilineTextAlignment(.leading)
        .fixedSize(horizontal: false, vertical: true)
        .frame(minHeight: 40, alignment: .leading)
    }

    /// Up to three figures in equal cells; with very large text, one a row.
    private func figures(_ figures: [ScooterCardFigure]) -> some View {
        let cells = dynamicTypeSize.isAccessibilitySize
            ? AnyLayout(VStackLayout(spacing: 8))
            : AnyLayout(CardFigureRow())

        return cells {
            ForEach(figures) { figure in
                if figure.kind == .price, let quote = model.ridePriceQuote(for: scooter) {
                    priceCell(figure, quote: quote)
                } else {
                    CardFigureCell(figure: figure)
                        .accessibilityElement(children: .combine)
                }
            }
        }
        .fixedSize(horizontal: false, vertical: true)
    }

    /// The price of a ride of the chosen length. The cell is the menu that
    /// changes the length.
    private func priceCell(_ figure: ScooterCardFigure, quote: RidePriceQuote) -> some View {
        Menu {
            ForEach(RideEstimateDuration.allowedMinutes, id: \.self) { minutes in
                Button {
                    model.setRideEstimateMinutes(minutes)
                } label: {
                    if minutes == model.rideEstimateMinutes {
                        Label(durationLabel(minutes), systemImage: "checkmark")
                    } else {
                        Text(durationLabel(minutes))
                    }
                }
            }
        } label: {
            CardFigureCell(
                figure: figure,
                tint: quote.passApplied ? ScooterPalette.good : nil,
                symbol: quote.passApplied ? "ticket.fill" : nil,
                opensMenu: true
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(String(
            format: String(localized: "Ride estimate, %lld minutes. Change duration."),
            Int64(model.rideEstimateMinutes)
        ))
        .accessibilityValue(priceLabel(quote))
    }

    /// "≈ CHF 4.50 for 10 min", or "From USD 5.50 for 10 min" where the minute fee is the lowest
    /// of a range, followed by "Pass applied" when a pass lowers it.
    private func priceLabel(_ quote: RidePriceQuote) -> String {
        let price = RidePriceFormatter.string(minorUnits: quote.totalMinorUnits, currency: quote.currency)
        let estimate = String(
            format: quote.minuteFeeFrom
                ? String(localized: "From %1$@ for %2$lld min")
                : String(localized: "≈ %1$@ for %2$lld min"),
            quote.plusTax ? String(format: String(localized: "%@ + tax"), price) : price,
            Int64(quote.durationMinutes)
        )
        guard quote.passApplied else { return estimate }
        return String(
            format: String(localized: "%1$@ · %2$@"),
            estimate,
            String(localized: "Pass applied")
        )
    }

    private func durationLabel(_ minutes: Int) -> String {
        String(format: String(localized: "%lld min"), Int64(minutes))
    }

    private var providerName: String {
        scooter.providerInfo?.name ?? scooter.provider.capitalized
    }
}

/// The card's figures side by side in equal cells as tall as the tallest, as
/// on every iPhone. In a window narrower than any iPhone's, such as an iPad's
/// narrowest, three would cut what each measures short ("CHF, 10…"), so the
/// third goes under the other two, at their width.
struct CardFigureRow: Layout {
    private static let spacing: CGFloat = 8

    /// Whether three cells across `width` go two over one. A 375 pt iPhone's
    /// card gives them 321 pt.
    static func wraps(_ count: Int, across width: CGFloat?) -> Bool {
        guard count == 3, let width else { return false }
        return width < 300
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? subviews.reduce(Self.spacing * CGFloat(max(subviews.count - 1, 0))) {
            $0 + $1.sizeThatFits(.unspecified).width
        }
        let heights = rows(of: subviews, across: width).map(\.height)
        return CGSize(width: width, height: heights.reduce(0, +) + Self.spacing * CGFloat(max(heights.count - 1, 0)))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var y = bounds.minY
        for row in rows(of: subviews, across: bounds.width) {
            for (column, cell) in row.cells.enumerated() {
                subviews[cell].place(
                    at: CGPoint(x: bounds.minX + CGFloat(column) * (row.cellWidth + Self.spacing), y: y),
                    proposal: ProposedViewSize(width: row.cellWidth, height: row.height)
                )
            }
            y += row.height + Self.spacing
        }
    }

    private struct Row {
        let cells: Range<Int>
        let cellWidth: CGFloat
        let height: CGFloat
    }

    private func rows(of subviews: Subviews, across width: CGFloat) -> [Row] {
        let ranges = Self.wraps(subviews.count, across: width) ? [0..<2, 2..<3] : [0..<subviews.count]
        return ranges.map { cells in
            let cellWidth = (width - Self.spacing * CGFloat(max(cells.count - 1, 0))) / CGFloat(max(cells.count, 1))
            let height = cells.map { subviews[$0].sizeThatFits(ProposedViewSize(width: cellWidth, height: nil)).height }.max() ?? 0
            return Row(cells: cells, cellWidth: cellWidth, height: height)
        }
    }
}

/// One figure of the scooter card: a large number with its unit, and what it
/// measures under it.
private struct CardFigureCell: View {
    let figure: ScooterCardFigure
    /// The number's colour when it is not the text colour.
    var tint: Color? = nil
    var symbol: String? = nil
    /// The cell opens a menu: its label says so with a small mark.
    var opensMenu = false
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    private static let shape = RoundedRectangle(cornerRadius: 16, style: .continuous)

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(figure.value)
                    .designFont(25, .black, relativeTo: .title2)
                    .tracking(-1)
                    .monospacedDigit()
                if let unit = figure.unit {
                    Text(unit)
                        .designFont(12, .bold, relativeTo: .caption)
                }
            }
            .lineLimit(1)
            .minimumScaleFactor(0.6)
            .foregroundStyle(tint ?? ScooterPalette.dockText)

            HStack(spacing: 4) {
                if let symbol {
                    Image(systemName: symbol)
                        .foregroundStyle(tint ?? ScooterPalette.dockQuiet)
                        .accessibilityHidden(true)
                }
                // With text larger than standard, two lines rather than
                // "de dista…"; at the standard size it shrinks a little.
                Text(figure.label)
                    .monospacedDigit()
                    .lineLimit(dynamicTypeSize > .large ? 2 : 1)
                    .minimumScaleFactor(0.8)
                if opensMenu {
                    Image(systemName: "chevron.up.chevron.down")
                        .imageScale(.small)
                        .accessibilityHidden(true)
                }
            }
            .designFont(11.5, .medium, relativeTo: .caption2)
            .foregroundStyle(ScooterPalette.dockQuiet)
        }
        .padding(EdgeInsets(top: 12, leading: 12, bottom: 11, trailing: 10))
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(ScooterPalette.dockTile, in: Self.shape)
        .overlay {
            Self.shape.strokeBorder(ScooterPalette.dockHairline, lineWidth: 1)
        }
    }
}

private struct ParkingBayCard: View {
    let model: ScooterMapModel
    let parking: ScooterParking
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            CardStatusLine(model: model)

            HStack(spacing: 12) {
                HStack(spacing: 12) {
                    Text(verbatim: "P")
                        .font(.system(size: 23, weight: .heavy, design: .rounded))
                        .frame(width: 48, height: 48)
                        .background(
                            Color(uiColor: .systemBackground),
                            in: RoundedRectangle(cornerRadius: 14, style: .continuous)
                        )
                        .overlay {
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .strokeBorder(
                                    providerAccent(parking.providerInfo, colorScheme: colorScheme),
                                    lineWidth: 3
                                )
                        }
                        .accessibilityHidden(true)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(parking.bayTitle)
                            .font(.headline)
                        let subtitle = model.parkingSubtitle(for: parking)
                        if !subtitle.isEmpty {
                            Text(subtitle)
                                .font(.footnote)
                                .foregroundStyle(ScooterPalette.secondaryText)
                                .monospacedDigit()
                        }
                    }
                    .fixedSize(horizontal: false, vertical: true)
                }
                .accessibilityElement(children: .combine)

                Spacer(minLength: 4)

                DockCloseButton(accessibilityLabel: String(localized: "Close parking details")) {
                    model.selectParking(nil)
                }
            }

            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Image(systemName: "info.circle")
                    .accessibilityHidden(true)
                Text(parking.notice)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
            }
            .font(.footnote.weight(.semibold))
            .foregroundStyle(parking.mandatory ? ScooterPalette.warning : Color.primary)
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(
                parking.mandatory
                    ? ScooterPalette.warning.opacity(0.14)
                    : Color(uiColor: .tertiarySystemFill),
                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
            )

            if let note = model.walkNote(for: .parking(parking)) {
                WalkNoteRow(note: note)
                    .transition(.opacity)
            }

            DockActionRow {
                DirectionsButton(model: model, target: .parking(parking), prominent: true)
            }

            Text(parking.footnote)
                .font(.caption2)
                .foregroundStyle(ScooterPalette.secondaryText)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity)
        }
    }
}

private extension ScooterBatteryLevel {
    var color: Color {
        switch self {
        case .good: ScooterPalette.good
        case .low: ScooterPalette.warning
        case .critical: ScooterPalette.critical
        }
    }
}

/// The provider's colour; Bird's near black turns almost white in dark
/// appearance, as its dots do on the map.
private func providerAccent(_ provider: ScooterProvider?, colorScheme: ColorScheme) -> Color {
    guard let provider else { return .blue }
    return Color(uiColor: ScooterMapLook.dotColor(provider, isDark: colorScheme == .dark))
}

enum RidePriceFormatter {
    /// "5.20": the amount without its currency, which the label under a figure names.
    static func amount(minorUnits: Int, currency: String) -> String {
        (Decimal(minorUnits) / 100).formatted(
            .number.precision(.fractionLength(fractionDigits(currency))).locale(ScooterLanguage.current.locale)
        )
    }

    static func string(minorUnits: Int, currency: String) -> String {
        let formatter = NumberFormatter()
        formatter.locale = ScooterLanguage.current.locale
        formatter.numberStyle = .currency
        formatter.currencyCode = currency.uppercased()
        formatter.minimumFractionDigits = fractionDigits(currency)
        formatter.maximumFractionDigits = fractionDigits(currency)

        let amount = NSDecimalNumber(value: minorUnits)
            .dividing(by: NSDecimalNumber(value: 100))
        return formatter.string(from: amount)
            ?? "\(currency.uppercased()) \(amount.stringValue)"
    }

    /// "18 Oct", or "18 Oct 2026" when that is not this year: the day, "2026-10-18", a price
    /// copied from an operator's price list was last checked there.
    static func listedDay(_ day: String, now: Date = .now) -> String? {
        guard let date = try? Date("\(day)T00:00:00Z", strategy: .iso8601) else { return nil }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = .gmt
        var style = Date.FormatStyle(locale: ScooterLanguage.current.locale, calendar: calendar, timeZone: .gmt)
            .day().month(.abbreviated)
        if calendar.component(.year, from: date) != calendar.component(.year, from: now) {
            style = style.year()
        }
        return date.formatted(style)
    }

    /// Two decimals, or none for a currency that has no cents: "ISK 350", "HUF 272".
    static func fractionDigits(_ currency: String) -> Int {
        let code = currency.uppercased()
        if wholeUnitCurrencies.contains(code) { return 0 }
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = code
        return formatter.maximumFractionDigits == 0 ? 0 : 2
    }

    /// Forints are written whole: the fillér left circulation in 1999, yet ISO
    /// 4217 still gives HUF two decimals, and some systems follow it ("HUF 272.00").
    /// src/lib/ridePrice.ts lists the same.
    private static let wholeUnitCurrencies: Set<String> = ["HUF"]
}

/// Filters: a minimum battery and the providers to show. Choices apply at
/// once, so the button at the bottom can say what the map will show.
struct ScooterFilterSheet: View {
    @Bindable var model: ScooterMapModel
    /// In a popover, it asks for the height that shows the whole list, where the window has it.
    var inPopover = false
    /// The list's height with the title bar and the button above and below it.
    @State private var wholeHeight: CGFloat = 620
    @Environment(\.dismiss) private var dismiss
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    batteryFilters
                    providerFilters
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 16)
            }
            .background(Self.sheetBackground)
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Reset", action: model.resetFilters)
                        .disabled(!model.hasActiveFilters)
                }
            }
            .safeAreaInset(edge: .bottom, spacing: 0) {
                showResultsButton
            }
            .onScrollGeometryChange(for: CGFloat.self) { geometry in
                geometry.contentSize.height + geometry.contentInsets.top + geometry.contentInsets.bottom
            } action: { _, height in
                wholeHeight = height
            }
            .sensoryFeedback(.selection, trigger: model.enabledProviders)
            .sensoryFeedback(.selection, trigger: model.minimumBattery)
        }
        // No least height: in a short window the popover gets less, and the list scrolls.
        .frame(minWidth: inPopover ? 360 : nil, idealWidth: inPopover ? 400 : nil, idealHeight: inPopover ? wholeHeight : nil)
    }

    private var batteryFilters: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader("Battery")

            batteryPresetLayout {
                ForEach(ScooterBatteryFilter.presets, id: \.self) { preset in
                    batteryPreset(preset)
                }
            }
            .padding(4)
            .background(
                Color(uiColor: .tertiarySystemFill),
                in: RoundedRectangle(cornerRadius: 16, style: .continuous)
            )
            .accessibilityElement(children: .contain)
            .accessibilityLabel(String(localized: "Battery"))

            if model.minimumBattery > 0 {
                Text(String(localized: "Scooters without battery info are hidden while a minimum is set."))
                    .font(.footnote)
                    .foregroundStyle(ScooterPalette.secondaryText)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 4)
            }
        }
    }

    /// Side by side; one above the other when the text is very large.
    private var batteryPresetLayout: AnyLayout {
        dynamicTypeSize.isAccessibilitySize
            ? AnyLayout(VStackLayout(spacing: 4))
            : AnyLayout(HStackLayout(spacing: 4))
    }

    private func batteryPreset(_ preset: Int) -> some View {
        let selected = Int(model.minimumBattery) == preset
        return Button {
            model.setMinimumBattery(Double(preset))
        } label: {
            // "30%+" reads the same in every language; only "Any" is translated.
            // "Indifférent" outgrows its segment before the presets stack: it
            // shrinks a little rather than break in the middle of the word.
            Text(verbatim: ScooterBatteryFilter.label(for: preset))
                .font(.subheadline.weight(selected ? .semibold : .regular))
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(Self.presetMinimumScale)
                .frame(maxWidth: .infinity, minHeight: 44)
                .background {
                    if selected {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(Self.selectedPresetFill)
                            .shadow(color: .black.opacity(0.1), radius: 2, y: 1)
                    }
                }
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(
            preset == 0
                ? String(localized: "Any")
                : String(format: String(localized: "%lld percent or more"), Int64(preset))
        )
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    /// How far the label of a battery preset may shrink to stay on one line.
    static let presetMinimumScale = 0.75

    /// The raised segment of the chosen minimum, as in a segmented control.
    private static let selectedPresetFill = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark ? .systemGray2 : .white
    })

    private var providerFilters: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader("Providers")

            VStack(alignment: .leading, spacing: 0) {
                let entries = model.filterProviders
                if entries.isEmpty {
                    // No provider operates in this part of the map.
                    Text(String(localized: "No scooter data here yet"))
                        .font(.subheadline)
                        .foregroundStyle(ScooterPalette.secondaryText)
                        .padding(.horizontal, 14)
                        .frame(maxWidth: .infinity, minHeight: 56, alignment: .leading)
                }
                ForEach(entries) { entry in
                    providerRow(entry)
                    if entry.id != entries.last?.id {
                        Divider()
                            .padding(.leading, 62)
                    }
                }
            }
            .background(
                Color(uiColor: .secondarySystemGroupedBackground),
                in: RoundedRectangle(cornerRadius: 16, style: .continuous)
            )
        }
    }

    private func providerRow(_ entry: ScooterProviderEntry) -> some View {
        Button {
            model.toggle(provider: entry.provider)
        } label: {
            HStack(spacing: 12) {
                // Dark initials on a tint of the provider's colour, never white on the colour itself.
                Text(verbatim: entry.provider.shortName)
                    .font(.footnote.weight(.bold))
                    // The tile keeps its size, so with very large text the initials shrink to fit.
                    .lineLimit(1)
                    .minimumScaleFactor(0.4)
                    .foregroundStyle(entry.isDown ? ScooterPalette.secondaryText : Color.primary)
                    .frame(width: 36, height: 36)
                    .background(
                        entry.isDown
                            ? Color.secondary.opacity(0.14)
                            : providerAccent(entry.provider, colorScheme: colorScheme).opacity(0.2),
                        in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                    )

                VStack(alignment: .leading, spacing: 1) {
                    Text(entry.provider.name)
                        .font(.body.weight(.medium))
                        .foregroundStyle(entry.isDown ? ScooterPalette.secondaryText : Color.primary)
                    if entry.isDown {
                        Text("Not sharing data right now")
                            .font(.caption)
                            .foregroundStyle(ScooterPalette.warning)
                    }
                }
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)

                Spacer(minLength: 8)

                if !entry.isDown {
                    Text(entry.count, format: .number)
                        .font(.subheadline)
                        .foregroundStyle(ScooterPalette.secondaryText)
                        .monospacedDigit()
                        .contentTransition(.numericText())
                }

                providerCheck(entry)
                    .frame(width: 26, height: 26)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .frame(minHeight: 56)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(providerAccessibilityLabel(entry))
        .accessibilityValue(entry.isEnabled ? String(localized: "Shown") : String(localized: "Hidden"))
    }

    /// A check for a provider that is shown, an empty circle for one that is
    /// hidden, and a dashed circle for one that is chosen but shares no data.
    @ViewBuilder
    private func providerCheck(_ entry: ScooterProviderEntry) -> some View {
        if !entry.isEnabled {
            Image(systemName: "circle")
                .font(.system(size: 22))
                .foregroundStyle(ScooterPalette.secondaryText)
        } else if entry.isDown {
            Circle()
                .strokeBorder(ScooterPalette.secondaryText, style: StrokeStyle(lineWidth: 1.5, dash: [3.5, 3]))
                .padding(2)
        } else {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 22))
                .foregroundStyle(ScooterPalette.actionFill)
        }
    }

    private var showResultsButton: some View {
        Button {
            dismiss()
        } label: {
            Text(showResultsTitle)
                .frame(maxWidth: .infinity)
                .foregroundStyle(.white)
        }
        .buttonStyle(.glassProminent)
        .tint(ScooterPalette.actionFill)
        .font(.headline)
        .controlSize(.large)
        // The button stays over the list, so its text stops growing before it covers it.
        .dynamicTypeSize(...DynamicTypeSize.accessibility1)
        .padding(.horizontal, 20)
        .padding(.vertical, 8)
        // The list ends above the button instead of showing through and under it.
        .background {
            Self.sheetBackground
                .ignoresSafeArea(edges: .bottom)
        }
        .overlay(alignment: .top) {
            LinearGradient(
                colors: [Self.sheetBackground.opacity(0), Self.sheetBackground],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(height: 14)
            .offset(y: -14)
            .allowsHitTesting(false)
        }
    }

    private static let sheetBackground = Color(uiColor: .systemGroupedBackground)

    /// What the map will show with the current choices. While the answer for
    /// a new minimum is still on its way there is no count to promise.
    private var showResultsTitle: String {
        if case .finding = model.dock {
            return String(localized: "Finding scooters…")
        }
        return model.showResultsTitle
    }

    private func sectionHeader(_ title: LocalizedStringKey) -> some View {
        Text(title)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(ScooterPalette.secondaryText)
            .padding(.horizontal, 4)
            .accessibilityAddTraits(.isHeader)
    }

    private func providerAccessibilityLabel(_ entry: ScooterProviderEntry) -> String {
        if entry.isDown { return entry.downLabel }
        if entry.count == 1 {
            return String(format: String(localized: "%@, one scooter"), entry.provider.name)
        }
        return String(
            format: String(localized: "%@, %lld scooters"),
            entry.provider.name,
            Int64(entry.count)
        )
    }
}

/// Settings: how the app and its map look, the language, the rider's passes,
/// and About with a mail for feedback and the version, the credits, the privacy
/// choice and the source code.
struct ScooterSettingsSheet: View {
    @Bindable var model: ScooterMapModel
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        NavigationStack {
            Form {
                Section("Appearance") {
                    SettingsTileRow(title: String(localized: "Appearance")) {
                        ForEach(ScooterAppearance.allCases) { appearance in
                            SettingsTile(title: appearance.label, isSelected: model.appearance == appearance) {
                                model.appearance = appearance
                            } picture: {
                                AppearancePicture(appearance: appearance)
                            }
                        }
                    }
                }

                Section {
                    SettingsTileRow(title: String(localized: "Map")) {
                        ForEach(AppleMapStyle.allCases) { style in
                            SettingsTile(title: style.label, isSelected: model.mapStyle == style) {
                                model.mapStyle = style
                            } picture: {
                                MapStylePicture(style: style)
                            }
                        }
                    }
                    Toggle("Ride and parking zones", isOn: $model.showsZones)
                } header: {
                    Text("Map")
                } footer: {
                    Text("A preview: where operators forbid riding or parking, or slow scooters down, as their feeds publish it. Each operator’s app has the final word.")
                }

                Section("Language") {
                    // The sheet reads the language here, so its titles are
                    // written again when another is chosen.
                    NavigationLink {
                        ScooterLanguageSettings(model: model)
                    } label: {
                        languageRow
                    }
                }

                Section {
                    // Only the providers that matter here: those operating on
                    // this part of the map, and those the rider has a pass for.
                    ForEach(model.passProviders) { provider in
                        NavigationLink {
                            ProviderRidePassEditor(model: model, provider: provider)
                        } label: {
                            HStack(spacing: 10) {
                                Circle()
                                    .fill(providerAccent(provider, colorScheme: colorScheme))
                                    .frame(width: 10, height: 10)
                                if dynamicTypeSize.isAccessibilitySize {
                                    // Very large text: the status goes under the name, so neither is cut off.
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(provider.name)
                                        Text(passStatus(for: provider))
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                } else {
                                    Text(provider.name)
                                    Spacer(minLength: 8)
                                    Text(passStatus(for: provider))
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                        .multilineTextAlignment(.trailing)
                                        .lineLimit(2)
                                }
                            }
                        }
                    }
                } header: {
                    Text("Passes")
                } footer: {
                    Text("Pass benefits are used only for estimates. Free-minute balances are not reduced automatically.")
                }

                Section {
                    // A way to write rather than rate, open to every rider.
                    Link(destination: ScooterLinks.feedback) {
                        ExternalLinkRow(
                            title: String(localized: "Send feedback"),
                            detail: String(format: String(localized: "Version %@"), ScooterLinks.appVersion),
                            systemImage: "envelope"
                        )
                    }

                    NavigationLink {
                        ScooterCreditsList()
                    } label: {
                        Label("Map & data credits", systemImage: "map")
                    }

                    NavigationLink {
                        ScooterPrivacySettings()
                    } label: {
                        Label("Privacy", systemImage: "hand.raised")
                    }

                    Link(destination: ScooterLinks.sourceCode) {
                        ExternalLinkRow(
                            title: String(localized: "Source code on GitHub"),
                            systemImage: "chevron.left.forwardslash.chevron.right"
                        )
                    }
                } header: {
                    Text("About")
                } footer: {
                    Text(String(localized: "Availability refreshes automatically. Opening a provider app doesn’t reserve a scooter."))
                }
            }
            // As a string: a title given as a key stays in the language it was first shown in.
            .navigationTitle(String(localized: "Settings"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .sensoryFeedback(.selection, trigger: model.appearance)
            .sensoryFeedback(.selection, trigger: model.mapStyle)
            .sensoryFeedback(.selection, trigger: model.languageChoice)
        }
    }

    /// The language the app is shown in, by its own name, and Automatic
    /// beside it while the app follows the iPhone.
    @ViewBuilder private var languageRow: some View {
        let name = Text(verbatim: model.language.name)
            // For VoiceOver, which reads a text in the language of its locale.
            .environment(\.locale, Locale(identifier: model.language.rawValue))
        let automatic = model.languageChoice == .automatic
            ? String(localized: "Automatic (language)")
            : nil
        if dynamicTypeSize.isAccessibilitySize {
            // Very large text: Automatic goes under the name, so neither is cut off.
            VStack(alignment: .leading, spacing: 2) {
                name
                if let automatic {
                    Text(automatic)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
        } else {
            HStack {
                name
                Spacer(minLength: 8)
                if let automatic {
                    Text(automatic)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private func passStatus(for provider: ScooterProvider) -> String {
        // A row is drawn apart from the rest of the sheet: it reads the
        // language itself to be written again when another is chosen.
        _ = model.language
        let pass = model.ridePass(for: provider)
        guard pass.enabled else { return String(localized: "Not set") }
        guard pass.isActive(on: .now) else { return String(localized: "Expired") }

        var benefits: [String] = []
        if pass.freeUnlock {
            benefits.append(String(localized: "Free unlock"))
        }
        if pass.freeMinutes > 0 {
            benefits.append(String(
                format: String(localized: "%lld free min"),
                Int64(pass.freeMinutes)
            ))
        }
        return benefits.isEmpty
            ? String(localized: "Pass active")
            : benefits.joined(separator: " · ")
    }
}

/// Settings › Language: Automatic, which follows the iPhone, then each
/// language of the app by its own name, with its name in the language shown.
/// A tap shows the app in it at once.
struct ScooterLanguageSettings: View {
    @Bindable var model: ScooterMapModel

    var body: some View {
        Form {
            Section {
                row(for: .automatic) {
                    Text(String(localized: "Automatic (language)"))
                    Text(String(format: String(localized: "%@, the language of your iPhone"), model.iPhoneLanguage.name))
                        .font(.subheadline)
                        .foregroundStyle(Color.secondary)
                }
            } footer: {
                Text(String(localized: "Follows your iPhone’s language, if you change it there."))
            }

            Section {
                ForEach(ScooterLanguage.byName) { language in
                    row(for: .language(language)) {
                        Text(verbatim: language.name)
                            // For VoiceOver, which reads a text in the language of its locale.
                            .environment(\.locale, Locale(identifier: language.rawValue))
                        if let name = language.name(in: model.language) {
                            Text(name)
                                .font(.subheadline)
                                .foregroundStyle(Color.secondary)
                        }
                    }
                }
            }
        }
        // As a string: a title given as a key stays in the language it was first shown in.
        .navigationTitle(String(localized: "Language"))
        .navigationBarTitleDisplayMode(.inline)
    }

    /// A choice, ticked once chosen. Its text wraps under very large text.
    private func row(
        for choice: ScooterLanguageChoice,
        @ViewBuilder label: () -> some View
    ) -> some View {
        let isSelected = model.languageChoice == choice
        return Button {
            model.languageChoice = choice
        } label: {
            HStack(spacing: 12) {
                // Color.primary, not .primary: in a button, .primary is the tint.
                VStack(alignment: .leading, spacing: 2) {
                    label()
                }
                .foregroundStyle(Color.primary)
                Spacer(minLength: 8)
                Image(systemName: "checkmark")
                    .font(.body.weight(.semibold))
                    .foregroundStyle(.tint)
                    .opacity(isSelected ? 1 : 0)
                    .accessibilityHidden(true)
            }
            .contentShape(Rectangle())
        }
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

enum ScooterLinks {
    static let privacyNotice = URL(string: "https://scootradar.com/privacy")!
    static let sourceCode = URL(string: "https://github.com/plhery/ScootRadar")!
    /// The version on sale, such as "1.0.1".
    static let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? ""
    /// A mail to ScootRadar whose subject names the version: "ScootRadar 1.0.1 feedback", with an empty body.
    static var feedback: URL {
        var mail = URLComponents()
        mail.scheme = "mailto"
        mail.path = "hello@scootradar.com"
        mail.queryItems = [URLQueryItem(name: "subject", value: "ScootRadar \(appVersion) feedback")]
        return mail.url!
    }
}

/// Settings › About › Privacy: the one choice about usage data, and the notice.
struct ScooterPrivacySettings: View {
    @AppStorage(ScooterAnalytics.disabledKey) private var analyticsDisabled = false

    var body: some View {
        Form {
            Section {
                Toggle("Share anonymous usage", isOn: Binding(
                    get: { !analyticsDisabled },
                    set: { analyticsDisabled = !$0 }
                ))
            } footer: {
                Text("Helps improve ScootRadar. No addresses or precise locations are sent.")
            }

            Section {
                Link(destination: ScooterLinks.privacyNotice) {
                    ExternalLinkRow(title: String(localized: "Read the privacy notice"))
                }
            }
        }
        .navigationTitle("Privacy")
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// Settings › About › Map & data credits: where the map and the data come from.
struct ScooterCreditsList: View {
    struct Source: Identifiable {
        let title: String
        let url: URL

        /// Two sources may share a licence's address, never a title.
        var id: String { title }
    }

    /// The same sources as the credits list on the web. Names of feeds and
    /// operators are not translated.
    static var sources: [Source] {
        // Each country's own, from data/countries.json.
        let countries = ScooterCountryCatalog.credits.map { Source(title: $0.title, url: URL(string: $0.url)!) }
        return [
            Source(
                title: String(localized: "Mobility data sources"),
                url: URL(string: "https://opentransportdata.swiss/en/cookbook/shared-mobility/")!
            ),
            Source(
                title: String(localized: "French mobility data"),
                url: URL(string: "https://transport.data.gouv.fr/datasets?type=vehicles-sharing")!
            ),
        ] + countries + [
            Source(
                title: String(localized: "Address search by Geoapify"),
                url: URL(string: "https://www.geoapify.com/")!
            ),
            Source(
                title: String(localized: "Address data © OpenStreetMap contributors"),
                url: URL(string: "https://www.openstreetmap.org/copyright")!
            ),
            Source(
                title: String(
                    format: String(localized: "%1$@ · %2$@"),
                    String(localized: "Parking"),
                    "Métropole Européenne de Lille"
                ),
                url: URL(string: "https://data.lillemetropole.fr/")!
            )
        ]
    }

    var body: some View {
        Form {
            Section {
                // Apple shows its own map credits on the map, behind "Legal".
                LabeledContent {
                    Text(verbatim: "Apple Maps")
                } label: {
                    Text("Map")
                }
            }

            Section {
                ForEach(Self.sources) { source in
                    Link(destination: source.url) {
                        ExternalLinkRow(title: source.title)
                    }
                }
            }
        }
        .navigationTitle("Map & data credits")
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// A row that leaves the app: its text, and an arrow that says so.
private struct ExternalLinkRow: View {
    let title: String
    /// A smaller line under the title.
    var detail: String?
    var systemImage: String?

    var body: some View {
        HStack(spacing: 8) {
            if let systemImage {
                Label {
                    text
                } icon: {
                    Image(systemName: systemImage)
                }
            } else {
                text
            }

            Spacer(minLength: 8)

            Image(systemName: "arrow.up.right")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(Color(uiColor: .tertiaryLabel))
                .accessibilityHidden(true)
        }
        .multilineTextAlignment(.leading)
    }

    private var text: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .foregroundStyle(Color.primary)
            if let detail {
                Text(detail)
                    .font(.footnote)
                    // Grey, not `.secondary`: inside a `Link` that takes the accent tint.
                    .foregroundStyle(Color(uiColor: .secondaryLabel))
            }
        }
    }
}

private struct ProviderRidePassEditor: View {
    @Bindable var model: ScooterMapModel
    let provider: ScooterProvider

    var body: some View {
        Form {
            Section {
                Toggle("I have a pass", isOn: passBinding(\.enabled))
            } footer: {
                Text("Your pass details stay on this iPhone.")
            }

            if pass.enabled {
                Section("Pass benefits") {
                    Toggle("Free unlock", isOn: passBinding(\.freeUnlock))

                    Stepper(
                        value: passBinding(\.freeMinutes),
                        in: 0 ... 500,
                        step: 5
                    ) {
                        HStack {
                            Text("Free minutes available")
                            Spacer()
                            Text(pass.freeMinutes, format: .number)
                                .foregroundStyle(.secondary)
                                .monospacedDigit()
                        }
                    }
                }

                Section {
                    Toggle("Has expiry date", isOn: hasExpiryBinding)

                    if pass.expiryDate != nil {
                        DatePicker(
                            "Valid through",
                            selection: expiryDateBinding,
                            displayedComponents: .date
                        )

                        if !pass.isActive(on: .now) {
                            Label("This pass has expired", systemImage: "exclamationmark.circle.fill")
                                .font(.subheadline)
                                .foregroundStyle(ScooterPalette.warning)
                        }
                    }
                } header: {
                    Text("Expiry")
                } footer: {
                    Text("Benefits remain active through the end of the selected day.")
                }
            }

            Section {
                Text("Pricing can vary. Confirm the final price and pass eligibility in the provider app before riding.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle(String(format: String(localized: "%@ pass"), provider.name))
        .navigationBarTitleDisplayMode(.inline)
    }

    private var pass: ProviderRidePass {
        model.ridePass(for: provider)
    }

    private func passBinding<Value>(
        _ keyPath: WritableKeyPath<ProviderRidePass, Value>
    ) -> Binding<Value> {
        Binding {
            model.ridePass(for: provider)[keyPath: keyPath]
        } set: { value in
            var updatedPass = model.ridePass(for: provider)
            updatedPass[keyPath: keyPath] = value
            model.setRidePass(updatedPass, for: provider)
        }
    }

    private var hasExpiryBinding: Binding<Bool> {
        Binding {
            model.ridePass(for: provider).expiryDate != nil
        } set: { hasExpiry in
            var updatedPass = model.ridePass(for: provider)
            updatedPass.expiryDate = hasExpiry ? defaultExpiryDate : nil
            model.setRidePass(updatedPass, for: provider)
        }
    }

    private var expiryDateBinding: Binding<Date> {
        Binding {
            model.ridePass(for: provider).expiryDate ?? defaultExpiryDate
        } set: { expiryDate in
            var updatedPass = model.ridePass(for: provider)
            updatedPass.expiryDate = expiryDate
            model.setRidePass(updatedPass, for: provider)
        }
    }

    private var defaultExpiryDate: Date {
        Calendar.current.date(byAdding: .month, value: 1, to: .now) ?? .now
    }
}

/// The locate button above the dock. Until this device has located once it
/// is a labelled blue pill; after that the round icon button is enough.
struct FloatingMapControls: View {
    let model: ScooterMapModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Group {
            if model.hasLocatedOnce {
                Button(action: model.focusOnUser) {
                    indicator
                        .font(.system(size: 18, weight: .semibold))
                        .frame(width: 50, height: 50)
                }
                .buttonStyle(.glass)
                .accessibilityLabel(String(localized: "Go to my location"))
            } else {
                Button(action: model.focusOnUser) {
                    HStack(spacing: 8) {
                        indicator
                        Text("Near me")
                    }
                    .font(.body.weight(.semibold))
                    // While locating the button is disabled and the system greys the pill:
                    // white would be lost on that grey.
                    .foregroundStyle(model.isLocating ? Color.primary : Color.white)
                    .padding(.horizontal, 4)
                    .frame(minHeight: 40)
                }
                .buttonStyle(.glassProminent)
                .tint(ScooterPalette.actionFill)
                .shadow(color: ScooterPalette.actionFill.opacity(0.28), radius: 7, y: 6)
            }
        }
        .disabled(model.isLocating)
        .accessibilityValue(model.isLocating ? String(localized: "Finding your location…") : "")
        .animation(reduceMotion ? nil : .snappy(duration: 0.28), value: model.hasLocatedOnce)
    }

    private var indicator: some View {
        ZStack {
            Image(systemName: "location.fill")
                .opacity(model.isLocating ? 0 : 1)
            if model.isLocating {
                ProgressView()
                    .controlSize(.small)
            }
        }
        .accessibilityHidden(true)
    }
}

/// What the colours of the zones mean while they are on, or why none are
/// drawn, at the foot of the map beside the locate button, as on the web
/// (ZoneLegend.tsx). Taps go through it to the map.
struct ZoneLegend: View {
    let state: ScooterZoneState
    /// The operators' zones drawn.
    let count: Int
    /// The cities' rules and zones over the map, whether or not the zones are
    /// on: a line for each kind, hours and who sets them, linked to where they
    /// say so (as on the web, ZoneLegend.tsx).
    var rules: [CityRuleZone.Shown] = []

    var body: some View {
        let lines = ruleLines
        let note = note(rules: !lines.isEmpty)
        VStack(alignment: .leading, spacing: 4) {
            if let note {
                Text(note)
                    .foregroundStyle(ScooterPalette.dockSecondary)
                    .accessibilityLabel(String(localized: "Zones"))
                    .accessibilityValue(note)
            } else if showsKinds {
                FlowLayout(spacing: 12, lineSpacing: 4) {
                    ForEach(ScooterZoneKind.operatorKinds, id: \.self) { kind in
                        HStack(spacing: 6) {
                            ZoneSwatch(kind: kind)
                            Text(kind.label)
                                .lineLimit(1)
                        }
                    }
                }
                .foregroundStyle(ScooterPalette.dockText)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(String(localized: "Zones"))
                .accessibilityValue(ScooterZoneKind.operatorKinds.map(\.label).joined(separator: ", "))
            }
            ForEach(lines, id: \.key) { line in
                HStack(spacing: 6) {
                    ZoneSwatch(kind: line.kind)
                        .opacity(line.inForce ? 1 : CityRuleZone.dimmed)
                    Text(line.text)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .foregroundStyle(ScooterPalette.dockText)
                .tint(ScooterPalette.dockText)
                .accessibilityElement(children: .combine)
            }
        }
        .font(.caption.weight(.medium))
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .chromeGlass(in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        // Only a city's line has anything to tap: who sets it.
        .allowsHitTesting(!lines.isEmpty)
    }

    private var showsKinds: Bool {
        state != .off && !(state == .shown && count == 0)
    }

    private func note(rules: Bool) -> String? {
        switch state {
        case .zoomIn: String(localized: "Zoom in to see the zones")
        case .failed: String(localized: "Zones unavailable right now")
        case .shown where count == 0 && !rules: String(localized: "No zones published here")
        default: nil
        }
    }

    /// One line for each kind, authority, hours and whether they hold now,
    /// the strongest rule first: "No riding 12:00–23:00 · Seoul", "Parking · Porto".
    var ruleLines: [(key: String, kind: ScooterZoneKind, inForce: Bool, text: AttributedString)] {
        var lines: [(key: String, kind: ScooterZoneKind, inForce: Bool, text: AttributedString)] = []
        // Hundreds of a city's zones may be in view, and make a few lines.
        var keys = Set<String>()
        for kind in ScooterZoneKind.allCases {
            for shown in rules where shown.rule.kind == kind {
                let hours = shown.rule.hours.map { "\(Self.wallTime($0.fromMinute))–\(Self.wallTime($0.untilMinute))" }
                    .joined(separator: ", ")
                let key = "\(kind.rawValue) \(shown.rule.authority) \(hours) \(shown.inForce)"
                guard keys.insert(key).inserted else { continue }
                var text = AttributedString(hours.isEmpty ? "\(kind.label) · " : "\(kind.label) \(hours) · ")
                var authority = AttributedString(shown.rule.authority)
                authority.link = shown.rule.source
                authority.underlineStyle = .single
                text += authority
                if !shown.inForce { text += AttributedString(" (\(String(localized: "not now")))") }
                lines.append((key, kind, shown.inForce, text))
            }
        }
        return lines
    }

    /// "23:00" or "11:00 PM", a time on the place's clock in the user's format (formatWallTime on the web).
    private static func wallTime(_ minute: Int) -> String {
        Date(timeIntervalSince1970: TimeInterval(minute * 60)).formatted(
            Date.FormatStyle(date: .omitted, time: .shortened, locale: ScooterLanguage.current.locale, timeZone: .gmt)
        )
    }
}

/// A zone as the map draws it, so that the edge and the hatching tell the
/// kinds apart without their colours.
private struct ZoneSwatch: View {
    let kind: ScooterZoneKind
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        let color = Color(uiColor: ScooterZoneLook.color(kind, isDark: colorScheme == .dark))
        let shape = RoundedRectangle(cornerRadius: 3, style: .continuous)
        ZStack {
            shape.fill(color.opacity(fillOpacity))
            if kind == .noRide {
                Canvas { context, size in
                    var lines = Path()
                    for c in stride(from: 0, through: size.width + size.height, by: 4) {
                        lines.move(to: CGPoint(x: c, y: 0))
                        lines.addLine(to: CGPoint(x: c - size.height, y: size.height))
                    }
                    context.stroke(lines, with: .color(color.opacity(0.55)), lineWidth: 1.5)
                }
                .clipShape(shape)
            }
            shape.inset(by: 1).stroke(color, style: edge)
        }
        .frame(width: 16, height: 12)
        .accessibilityHidden(true)
    }

    private var fillOpacity: Double {
        switch kind {
        case .noRide, .noParking: 0.16
        case .slow: 0.1
        case .parking: 0.25
        }
    }

    private var edge: StrokeStyle {
        switch kind {
        case .noRide, .parking: StrokeStyle(lineWidth: 2)
        case .noParking: StrokeStyle(lineWidth: 2, dash: [4, 2.5])
        case .slow: StrokeStyle(lineWidth: 2, lineCap: .round, dash: [0.1, 3.5])
        }
    }
}

private struct LiveIndicator: View {
    @State private var isPulsing = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            Circle()
                .stroke(.green.opacity(reduceMotion ? 0.18 : (isPulsing ? 0 : 0.32)), lineWidth: 2)
                .scaleEffect(reduceMotion ? 1.35 : (isPulsing ? 1.75 : 0.8))
            Circle()
                .fill(.green)
        }
        .frame(width: 7, height: 7)
        .accessibilityHidden(true)
        .task {
            guard !reduceMotion else { return }
            withAnimation(.easeOut(duration: 1.6).repeatForever(autoreverses: false)) {
                isPulsing = true
            }
        }
    }
}

/// The banner under the search bar while nothing has loaded and the load
/// failed: the reason and a filled Try again button.
struct MapStatusBanner: View {
    let message: String
    let actionTitle: String
    var isBusy = false
    let action: () -> Void
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        Group {
            if stacks {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(alignment: .top, spacing: 9) {
                        statusIndicator
                        statusMessage
                    }

                    statusAction
                        .frame(maxWidth: .infinity)
                }
            } else {
                HStack(spacing: 9) {
                    statusIndicator
                    statusMessage
                    Spacer(minLength: 0)
                    statusAction
                }
            }
        }
        .padding(.leading, 14)
        .padding(.trailing, stacks ? 14 : 5)
        .padding(.vertical, stacks ? 10 : 2)
        // As wide as the search bar above it, whatever the length of the sentence.
        .frame(maxWidth: 560)
        .background {
            TopChromeTapShield(cornerRadius: bannerCornerRadius)
        }
        .chromeGlass(in: RoundedRectangle(cornerRadius: bannerCornerRadius, style: .continuous))
        .shadow(color: .black.opacity(0.07), radius: 9, y: 4)
        .task(id: message) {
            guard UIAccessibility.isVoiceOverRunning else { return }
            UIAccessibility.post(notification: .announcement, argument: message)
        }
    }

    /// Beside the button a German or French reason already takes three lines
    /// at the standard text size on a narrow phone. Any larger, the button
    /// goes under the sentence, which is never cut short.
    private var stacks: Bool {
        dynamicTypeSize >= .xLarge
    }

    private var bannerCornerRadius: CGFloat {
        stacks ? 22 : 999
    }

    private var statusIndicator: some View {
        Image(systemName: "exclamationmark.triangle.fill")
            .foregroundStyle(ScooterPalette.critical)
            .accessibilityHidden(true)
    }

    private var statusMessage: some View {
        Text(message)
            .font(.caption.weight(.semibold))
            .fixedSize(horizontal: false, vertical: true)
    }

    private var statusAction: some View {
        Button(action: action) {
            ZStack {
                Text(actionTitle)
                    .opacity(isBusy ? 0 : 1)
                if isBusy {
                    ProgressView()
                        .controlSize(.small)
                        .tint(.white)
                }
            }
            .font(.caption.weight(.bold))
            .foregroundStyle(.white)
            .padding(.horizontal, 14)
            .frame(minHeight: 34)
            .background(ScooterPalette.criticalFill, in: Capsule())
            // The pill stays small; its target is 44 pt high.
            .frame(minHeight: 44)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(isBusy)
        .accessibilityLabel(actionTitle)
    }
}

/// The dismissible card under the search bar when locating did not work:
/// what happened and the ways forward.
struct LocationIssueCard: View {
    let issue: ScooterLocationIssue
    let onOpenSettings: () -> Void
    let onSearchPlace: () -> Void
    let onRetry: () -> Void
    let onDismiss: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            DockSymbolTile(
                systemImage: "location.slash",
                foreground: ScooterPalette.warning,
                tint: ScooterPalette.warning,
                size: 40
            )
            .padding(.top, 2)

            VStack(alignment: .leading, spacing: 0) {
                VStack(alignment: .leading, spacing: 2) {
                    if let title = issue.title {
                        Text(title)
                            .font(.subheadline.weight(.semibold))
                        Text(issue.message)
                            .font(.footnote)
                            .foregroundStyle(ScooterPalette.secondaryText)
                    } else {
                        Text(issue.message)
                            .font(.subheadline.weight(.medium))
                    }
                }
                .fixedSize(horizontal: false, vertical: true)
                .frame(minHeight: 44, alignment: .leading)
                .accessibilityElement(children: .combine)

                FlowLayout(spacing: 20, lineSpacing: 0) {
                    if issue.canOpenSettings {
                        action("Open Settings", perform: onOpenSettings)
                    }
                    if issue.canSearchPlace {
                        action("Search a place", perform: onSearchPlace)
                    }
                    if issue.canRetry {
                        action("Try again", perform: onRetry)
                    }
                }
            }

            Spacer(minLength: 0)

            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(ScooterPalette.secondaryText)
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(String(localized: "Dismiss"))
        }
        .padding(.leading, 12)
        .padding(.trailing, 4)
        .padding(.top, 6)
        .padding(.bottom, 2)
        .frame(maxWidth: 560)
        .background {
            TopChromeTapShield(cornerRadius: 24)
        }
        .chromeGlass(in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        .shadow(color: .black.opacity(0.08), radius: 10, y: 4)
        .task(id: issue) {
            guard UIAccessibility.isVoiceOverRunning else { return }
            UIAccessibility.post(
                notification: .announcement,
                argument: [issue.title, issue.message].compactMap { $0 }.joined(separator: " ")
            )
        }
    }

    private func action(_ title: LocalizedStringKey, perform: @escaping () -> Void) -> some View {
        Button(action: perform) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(ScooterPalette.actionText)
                .frame(minHeight: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

/// Taps on the empty parts of a banner or card stay there instead of
/// reaching the map underneath.
private struct TopChromeTapShield: View {
    let cornerRadius: CGFloat

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(Color.clear)
            .contentShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .onTapGesture { }
            .accessibilityHidden(true)
    }
}

/// Directions on a scooter or bay card. It draws the walking route on the
/// map, and is Hide route while the route is there; while the way is being
/// found, a small spinner takes the place of its icon. When no route was
/// found it opens Apple Maps instead.
private struct DirectionsButton: View {
    let model: ScooterMapModel
    let target: ScooterWalkTarget
    let prominent: Bool

    var body: some View {
        let control = model.directionsControl(for: target)
        let isFinding = control == .finding
        Button {
            switch control {
            case .directions: model.showWalkingRoute(to: target)
            case .hideRoute: model.hideWalkingRoute()
            case .openInMaps: model.openWalkInMaps(to: target)
            // Busy: the tap waits for the way like the rider does.
            case .finding, .none: break
            }
        } label: {
            Label {
                Text(Self.title(control))
            } icon: {
                Image(systemName: Self.symbol(control))
                    .opacity(isFinding ? 0 : 1)
                    .overlay {
                        if isFinding {
                            ProgressView()
                                .controlSize(.mini)
                                .tint(prominent ? Color.white : ScooterPalette.dockText)
                        }
                    }
            }
        }
        .dockActionStyle(prominent: prominent)
        .accessibilityLabel(isFinding ? String(localized: "Finding the way…") : Self.title(control))
        .accessibilityAddTraits(isFinding ? .updatesFrequently : [])
    }

    private static func title(_ control: ScooterDirectionsControl) -> String {
        switch control {
        case .directions, .finding, .none: String(localized: "Directions")
        case .hideRoute: String(localized: "Hide route")
        case .openInMaps: String(localized: "Open in Maps")
        }
    }

    private static func symbol(_ control: ScooterDirectionsControl) -> String {
        switch control {
        case .directions, .finding, .none: "figure.walk"
        case .hideRoute: "xmark"
        case .openInMaps: "map"
        }
    }
}

/// What became of a walk, on its card: no location or no route, in the
/// colour of a warning; there, in green; or the scooter gone from the map.
private struct WalkNoteRow: View {
    let note: ScooterWalkNote

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Image(systemName: note.systemImage)
                .font(.caption.weight(.semibold))
                .accessibilityHidden(true)
            Text(note.text)
                .font(.footnote.weight(.semibold))
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .foregroundStyle(color)
        .padding(.horizontal, 2)
        .accessibilityElement(children: .combine)
    }

    private var color: Color {
        switch note {
        case .noLocation, .noRoute: ScooterPalette.warning
        case .arrived: ScooterPalette.good
        case .gone: ScooterPalette.secondaryText
        }
    }
}

private extension View {
    /// The view, or nothing in its place.
    @ViewBuilder
    func removed(_ isRemoved: Bool) -> some View {
        if !isRemoved { self }
    }
}

private func batterySymbol(for battery: Int) -> String {
    switch battery {
    case 75 ... 100: "battery.100percent"
    case 50 ..< 75: "battery.75percent"
    case 25 ..< 50: "battery.50percent"
    case 10 ..< 25: "battery.25percent"
    default: "battery.0percent"
    }
}
