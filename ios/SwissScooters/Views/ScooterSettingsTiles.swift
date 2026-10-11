import SwiftUI
import UIKit

/// The choices of Settings that change how the app looks, as tiles
/// side by side: a picture of the choice over its name, as on the web.
struct SettingsTileRow<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        layout { content }
            .accessibilityElement(children: .contain)
            .accessibilityLabel(title)
            // The tiles stand on the sheet itself, not in a row of the list.
            .listRowInsets(EdgeInsets())
            .listRowBackground(Color.clear)
    }

    /// Side by side; one above the other when the text is very large.
    private var layout: AnyLayout {
        dynamicTypeSize.isAccessibilitySize
            ? AnyLayout(VStackLayout(spacing: 10))
            : AnyLayout(HStackLayout(spacing: 10))
    }
}

struct SettingsTile<Picture: View>: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    @ViewBuilder let picture: Picture

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                picture
                    .frame(height: 64)
                    .frame(maxWidth: .infinity)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .accessibilityHidden(true)
                Text(verbatim: title)
                    .font(.footnote.weight(.semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                    .padding(.horizontal, 2)
            }
            .padding(EdgeInsets(top: 4, leading: 4, bottom: 10, trailing: 4))
            .settingsTile(isSelected: isSelected, cornerRadius: 17)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

private extension View {
    /// The frame of a tile: a hairline around a faint fill, blue once chosen.
    func settingsTile(isSelected: Bool, cornerRadius: CGFloat) -> some View {
        let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
        return foregroundStyle(isSelected ? ScooterPalette.actionText : Color.primary)
            .background(
                isSelected ? Color.accentColor.opacity(0.08) : Color(uiColor: .quaternarySystemFill),
                in: shape
            )
            .overlay {
                shape.strokeBorder(isSelected ? Color.accentColor : ScooterPalette.dockHairline, lineWidth: 1.5)
            }
            .contentShape(shape)
    }
}

/// The app in small, in the light or in the dark: the map, a few scooters,
/// the search bar and the dock. Automatic shows half of each.
struct AppearancePicture: View {
    let appearance: ScooterAppearance

    var body: some View {
        switch appearance {
        case .light:
            SmallScreen(isDark: false)
        case .dark:
            SmallScreen(isDark: true)
        case .automatic:
            SmallScreen(isDark: false)
                .overlay { SmallScreen(isDark: true).clipShape(LowerHalf()) }
        }
    }

    /// The half of a rectangle under the diagonal from its top right corner.
    private struct LowerHalf: Shape {
        func path(in rect: CGRect) -> Path {
            Path { path in
                path.move(to: CGPoint(x: rect.maxX, y: rect.minY))
                path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
                path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
                path.closeSubpath()
            }
        }
    }

    private struct SmallScreen: View {
        let isDark: Bool

        var body: some View {
            Canvas { context, size in
                MapGround.quiet(isDark: isDark).draw(in: &context, size: size)

                let raised = isDark ? Color(red: 0.086, green: 0.102, blue: 0.141) : Color.white
                let ink = isDark ? Color.white : Color(red: 0.063, green: 0.075, blue: 0.102)
                let edge = ink.opacity(isDark ? 0.14 : 0.08)

                // The scooters, as the lights they are on the map.
                let lights: [(CGPoint, Color)] = [
                    (CGPoint(x: 0.3, y: 0.34), Color(red: 0.2, green: 0.78, blue: 0.35)),
                    (CGPoint(x: 0.62, y: 0.3), Color(red: 0.93, green: 0.16, blue: 0.55)),
                    (CGPoint(x: 0.47, y: 0.5), Color(red: 0.1, green: 0.67, blue: 0.86)),
                    (CGPoint(x: 0.8, y: 0.48), Color(red: 1, green: 0.55, blue: 0.1))
                ]
                for (place, colour) in lights {
                    let centre = CGPoint(x: place.x * size.width, y: place.y * size.height)
                    if isDark {
                        context.fill(Path(ellipseIn: Self.square(centre, 11)), with: .color(colour.opacity(0.3)))
                    }
                    context.fill(Path(ellipseIn: Self.square(centre, 6)), with: .color(colour))
                }

                // The search bar.
                let bar = Path(
                    roundedRect: CGRect(x: 7, y: 5, width: size.width - 14, height: 9),
                    cornerRadius: 4.5
                )
                context.fill(bar, with: .color(raised))
                context.stroke(bar, with: .color(edge), lineWidth: 0.5)

                // The dock: the distance to the nearest scooter, and two providers.
                let dock = CGRect(x: 6, y: size.height - 23, width: size.width - 12, height: 18)
                let dockShape = Path(roundedRect: dock, cornerRadius: 6)
                context.fill(dockShape, with: .color(raised))
                context.stroke(dockShape, with: .color(edge), lineWidth: 0.5)
                context.fill(
                    Path(roundedRect: CGRect(x: dock.minX + 6, y: dock.minY + 4, width: 20, height: 4), cornerRadius: 2),
                    with: .color(ink.opacity(0.85))
                )
                for index in 0 ..< 2 {
                    context.fill(
                        Path(
                            roundedRect: CGRect(
                                x: dock.minX + 6 + CGFloat(index) * 17,
                                y: dock.minY + 11,
                                width: 14,
                                height: 3
                            ),
                            cornerRadius: 1.5
                        ),
                        with: .color(ink.opacity(0.28))
                    )
                }
            }
        }

        private static func square(_ centre: CGPoint, _ side: CGFloat) -> CGRect {
            CGRect(x: centre.x - side / 2, y: centre.y - side / 2, width: side, height: side)
        }
    }
}

/// A park, a river and a street in the colours of the ground of a map style.
/// Quiet keeps to them; Standard and Satellite write names on it.
struct MapStylePicture: View {
    let style: AppleMapStyle
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Canvas { context, size in
            MapGround(style: style, isDark: colorScheme == .dark).draw(in: &context, size: size)
        }
    }
}

/// The ground of a map in a few strokes, in the colours Apple's map has for a
/// style in the light or in the dark, read from the map itself.
private struct MapGround {
    let land: Color
    let green: Color
    let water: Color
    let street: Color
    /// The colour of the names; nil on a ground without names.
    var names: Color?

    init(style: AppleMapStyle, isDark: Bool) {
        switch style {
        case .quiet:
            self = .quiet(isDark: isDark)
        case .standard:
            self = isDark
                ? MapGround(land: 0x617F9F, green: 0x006768, water: 0x29498D, street: 0x374C62, names: 0xD5DAE2)
                : MapGround(land: 0xEEEDED, green: 0xC1E2A6, water: 0x9CE2F9, street: 0xFFFFFF, names: 0x6B6E73)
        case .satellite:
            // The picture from above is the same by day and by night.
            self = MapGround(land: 0x6F7B6C, green: 0x3D5444, water: 0x374F5B, street: 0xBDBAB0, names: 0xFFFFFF)
        }
    }

    private init(land: UInt32, green: UInt32, water: UInt32, street: UInt32, names: UInt32? = nil) {
        self.land = Color(hex: land)
        self.green = Color(hex: green)
        self.water = Color(hex: water)
        self.street = Color(hex: street)
        self.names = names.map(Color.init(hex:))
    }

    static func quiet(isDark: Bool) -> MapGround {
        isDark
            ? MapGround(land: 0x374B65, green: 0x064C56, water: 0x1E386C, street: 0x25334C)
            : MapGround(land: 0xF4F3F2, green: 0xE6F0DD, water: 0xC8ECFA, street: 0xFFFFFF)
    }

    func draw(in context: inout GraphicsContext, size: CGSize) {
        context.fill(Path(CGRect(origin: .zero, size: size)), with: .color(land))

        // The park, a block set at the angle of the street.
        var park = context
        park.translateBy(x: size.width * 0.2, y: size.height * 0.44)
        park.rotate(by: .degrees(-25))
        park.fill(
            Path(
                roundedRect: CGRect(
                    x: -size.width * 0.28,
                    y: -size.height * 0.3,
                    width: size.width * 0.56,
                    height: size.height * 0.6
                ),
                cornerRadius: 12
            ),
            with: .color(green)
        )

        // The river crosses the street.
        var river = context
        river.translateBy(x: size.width * 0.62, y: size.height / 2)
        river.rotate(by: .degrees(25))
        river.fill(
            Path(CGRect(
                x: -size.width * 0.1,
                y: -size.height,
                width: size.width * 0.2,
                height: size.height * 2
            )),
            with: .color(water)
        )

        var road = context
        road.translateBy(x: size.width / 2, y: size.height / 2)
        road.rotate(by: .degrees(-25))
        road.fill(Path(CGRect(x: -size.width, y: -4, width: size.width * 2, height: 8)), with: .color(street))

        // Three names, as short strokes along the street.
        if let names {
            for (x, y) in [(-0.34, -11.0), (0.02, -11.0), (0.2, 9.0)] {
                road.fill(
                    Path(roundedRect: CGRect(x: size.width * x, y: y, width: 20, height: 3), cornerRadius: 1.5),
                    with: .color(names)
                )
            }
        }
    }
}

private extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}
