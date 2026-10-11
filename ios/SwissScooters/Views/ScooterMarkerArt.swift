import UIKit

/// The pictures of the dots. A glow drawn live under several hundred markers
/// makes the map stutter while it moves, so each picture is drawn once, with
/// its ring and its glow, and shared by every marker that looks the same.
@MainActor
enum ScooterDotArt {
    struct Key: Hashable {
        let provider: ScooterProvider?
        let diameter: CGFloat
        let state: ScooterDotState
        let showsInitials: Bool
        /// Dark appearance, and the satellite picture in either appearance.
        let isDark: Bool
    }

    struct ClusterKey: Hashable {
        /// The provider with the most scooters in the cluster lends its colour to the glow.
        let provider: ScooterProvider?
        let diameter: CGFloat
        let isDark: Bool
    }

    private static var dots: [Key: UIImage] = [:]
    private static var clusters: [ClusterKey: UIImage] = [:]
    /// Zooming through every scale draws many sizes; they are not all kept.
    private static let maximumDots = 600

    static func image(for key: Key) -> UIImage {
        if let image = dots[key] { return image }
        if dots.count >= maximumDots { dots.removeAll(keepingCapacity: true) }
        let image = draw(key)
        dots[key] = image
        return image
    }

    static func clusterImage(for key: ClusterKey) -> UIImage {
        if let image = clusters[key] { return image }
        let image = draw(key)
        clusters[key] = image
        return image
    }

    private static let raisedDark = UIColor(red: 0.086, green: 0.102, blue: 0.141, alpha: 1)
    private static let shade = (red: CGFloat(0.063), green: CGFloat(0.075), blue: CGFloat(0.102))

    private struct Glow {
        /// The disc that glows, and how far its light is blurred.
        let radius: CGFloat
        let blur: CGFloat
        var alpha: CGFloat = 0.6

        /// A blurred disc is close to a bell: this is how wide.
        var spread: CGFloat { (blur * blur + radius * radius / 2).squareRoot() }
        var extent: CGFloat { 2.4 * spread }
    }

    private static func glow(for key: Key) -> Glow? {
        let diameter = key.diameter
        switch key.state {
        case .plain:
            return key.isDark ? Glow(radius: diameter * 0.8, blur: diameter * 0.75) : nil
        case .head:
            let scale = diameter / 14
            return key.isDark ? Glow(radius: diameter / 2 + 6 * scale, blur: 11 * scale) : nil
        case .selected:
            let scale = diameter / 16
            return Glow(radius: diameter / 2 + 8 * scale, blur: 13 * scale, alpha: key.isDark ? 0.6 : 0.5)
        }
    }

    private static func draw(_ key: Key) -> UIImage {
        let color = ScooterMapLook.dotColor(key.provider, isDark: key.isDark)
        let radius = key.diameter / 2
        let glow = glow(for: key)
        let ring = ScooterMapLook.ringReach(for: key.state)
        // Room for the glow, or for the ring and the shadow that falls under it.
        let margin = ceil(max((glow?.extent ?? 0) - radius, ring + (key.state == .plain ? 12 : 16)))
        let side = key.diameter + 2 * margin
        let centre = CGPoint(x: side / 2, y: side / 2)
        let ground = key.isDark ? ScooterMapLook.darkGround : UIColor.white
        let shadow = shadowColor(of: color).cgColor

        return UIGraphicsImageRenderer(size: CGSize(width: side, height: side)).image { renderer in
            let context = renderer.cgContext
            if let glow {
                draw(glow, of: color, at: centre, in: context)
            }

            func disc(_ radius: CGFloat, _ color: UIColor) {
                context.setFillColor(color.cgColor)
                context.fillEllipse(in: CGRect(x: centre.x - radius, y: centre.y - radius, width: 2 * radius, height: 2 * radius))
            }
            // In light appearance a short shadow in the dot's own colour falls
            // under its white ring.
            func shadowed(_ offset: CGFloat, _ blur: CGFloat, _ body: () -> Void) {
                guard !key.isDark else { return body() }
                context.saveGState()
                context.setShadow(offset: CGSize(width: 0, height: offset), blur: blur, color: shadow)
                body()
                context.restoreGState()
            }

            switch key.state {
            case .plain:
                shadowed(2, 7) { disc(radius + (key.isDark ? 1.5 : 2), ground) }
            case .head:
                shadowed(3, 10) { disc(radius + 4, color) }
                disc(radius + 2.5, ground)
            case .selected:
                shadowed(3, 10) { disc(radius + 6, ScooterMapLook.selectionRing) }
                disc(radius + 3, ground)
            }
            disc(radius, color)

            if key.showsInitials {
                let initials = key.provider?.shortName ?? "?"
                let text = NSAttributedString(string: initials, attributes: [
                    .font: UIFont.systemFont(ofSize: key.diameter * (initials.count > 1 ? 0.43 : 0.54), weight: .heavy),
                    .foregroundColor: ScooterMapLook.ink(on: key.provider, isDark: key.isDark)
                ])
                let size = text.size()
                text.draw(at: CGPoint(x: centre.x - size.width / 2, y: centre.y - size.height / 2))
            }
        }
    }

    private static func draw(_ key: ClusterKey) -> UIImage {
        let tint = ScooterMapLook.dotColor(key.provider, isDark: key.isDark)
        let radius = key.diameter / 2
        let glow = Glow(radius: radius + 5, blur: 11, alpha: 0.55)
        let margin = ceil(key.isDark ? glow.extent - radius : 16)
        let side = key.diameter + 2 * margin
        let centre = CGPoint(x: side / 2, y: side / 2)
        let disc = CGRect(x: centre.x - radius, y: centre.y - radius, width: key.diameter, height: key.diameter)

        return UIGraphicsImageRenderer(size: CGSize(width: side, height: side)).image { renderer in
            let context = renderer.cgContext
            if key.isDark {
                draw(glow, of: tint, at: centre, in: context)
                context.setFillColor(raisedDark.cgColor)
                context.fillEllipse(in: disc)
                context.setStrokeColor(tint.withAlphaComponent(0.55).cgColor)
            } else {
                context.saveGState()
                context.setShadow(offset: CGSize(width: 0, height: 3), blur: 10, color: shadowColor(of: tint).cgColor)
                context.setFillColor(UIColor.white.cgColor)
                context.fillEllipse(in: disc)
                context.restoreGState()
                context.setStrokeColor(tint.withAlphaComponent(0.7).cgColor)
            }
            context.setLineWidth(1.5)
            context.strokeEllipse(in: disc.insetBy(dx: 0.75, dy: 0.75))
        }
    }

    /// The light around a dot: strongest under it and gone at the edge of the picture.
    private static func draw(_ glow: Glow, of color: UIColor, at centre: CGPoint, in context: CGContext) {
        let peak = glow.alpha * (1 - exp(-glow.radius * glow.radius / (2 * glow.blur * glow.blur)))
        let steps = 10
        var colors: [CGColor] = []
        var locations: [CGFloat] = []
        for step in 0 ... steps {
            let position = CGFloat(step) / CGFloat(steps)
            let distance = position * glow.extent
            let fall = exp(-distance * distance / (2 * glow.spread * glow.spread))
            colors.append(color.withAlphaComponent(step == steps ? 0 : peak * fall).cgColor)
            locations.append(position)
        }
        guard let gradient = CGGradient(
            colorsSpace: CGColorSpace(name: CGColorSpace.sRGB),
            colors: colors as CFArray,
            locations: locations
        ) else { return }
        context.drawRadialGradient(
            gradient,
            startCenter: centre,
            startRadius: 0,
            endCenter: centre,
            endRadius: glow.extent,
            options: []
        )
    }

    /// The dot's colour, a little over half, with a dark shade.
    private static func shadowColor(of color: UIColor) -> UIColor {
        var red: CGFloat = 0
        var green: CGFloat = 0
        var blue: CGFloat = 0
        var alpha: CGFloat = 0
        guard color.getRed(&red, green: &green, blue: &blue, alpha: &alpha) else {
            return UIColor.black.withAlphaComponent(0.35)
        }
        let own: CGFloat = 0.55
        let dark: CGFloat = 0.45 * 0.35
        let total = own + dark
        return UIColor(
            red: (red * own + shade.red * dark) / total,
            green: (green * own + shade.green * dark) / total,
            blue: (blue * own + shade.blue * dark) / total,
            alpha: total
        )
    }
}

/// The name beside the nearest scooter of a provider: a small dot in the
/// provider's colour, the name and the walking time. The pill of the selected
/// scooter is filled with the provider's colour.
final class ScooterNamePillView: UIView {
    struct Content: Equatable {
        let provider: ScooterProvider?
        let name: String
        /// "1 min"; nil without an origin.
        let time: String?
        let isFilled: Bool
        let isDark: Bool

        @MainActor
        var width: CGFloat {
            var width = leading + ScooterNamePillView.dotSize + gap + ceil(textWidth(name, ScooterNamePillView.nameFont))
            if let time {
                width += gap + ceil(textWidth(time, ScooterNamePillView.timeFont))
            }
            return width + trailing
        }

        fileprivate var leading: CGFloat { 8 }
        fileprivate var trailing: CGFloat { 10 }
        fileprivate var gap: CGFloat { 6 }

        private func textWidth(_ text: String, _ font: UIFont) -> CGFloat {
            (text as NSString).size(withAttributes: [.font: font]).width
        }
    }

    fileprivate static let dotSize: CGFloat = 7
    fileprivate static let nameFont = UIFont.systemFont(ofSize: 12, weight: .bold)
    fileprivate static let timeFont = UIFont.systemFont(ofSize: 12, weight: .semibold)

    private let material = UIVisualEffectView(effect: nil)
    private let dot = UIView()
    private let nameLabel = UILabel()
    private let timeLabel = UILabel()
    private(set) var content: Content?

    override init(frame: CGRect) {
        super.init(frame: frame)
        configureView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        configureView()
    }

    private func configureView() {
        isUserInteractionEnabled = false
        // The marker speaks for its pill.
        isAccessibilityElement = false
        layer.cornerRadius = ScooterMapLook.pillHeight / 2
        layer.cornerCurve = .continuous
        layer.borderWidth = 1
        layer.shadowColor = UIColor.black.cgColor
        layer.shadowRadius = 7
        layer.shadowOffset = CGSize(width: 0, height: 4)

        material.layer.cornerRadius = ScooterMapLook.pillHeight / 2
        material.layer.cornerCurve = .continuous
        material.clipsToBounds = true
        addSubview(material)

        dot.layer.cornerRadius = Self.dotSize / 2
        addSubview(dot)

        nameLabel.font = Self.nameFont
        timeLabel.font = Self.timeFont
        addSubview(nameLabel)
        addSubview(timeLabel)
    }

    func show(_ content: Content) {
        guard content != self.content else { return }
        self.content = content
        let color = ScooterMapLook.dotColor(content.provider, isDark: content.isDark)
        let ink = ScooterMapLook.ink(on: content.provider, isDark: content.isDark)
        let text = content.isDark
            ? UIColor(red: 0.957, green: 0.961, blue: 0.969, alpha: 1)
            : UIColor(red: 0.063, green: 0.075, blue: 0.102, alpha: 1)
        let quiet = content.isDark
            ? UIColor(red: 0.639, green: 0.659, blue: 0.702, alpha: 1)
            : UIColor(red: 0.4, green: 0.439, blue: 0.502, alpha: 1)

        nameLabel.text = content.name
        timeLabel.text = content.time
        timeLabel.isHidden = content.time == nil
        if content.isFilled {
            material.isHidden = true
            backgroundColor = color
            layer.borderColor = UIColor.clear.cgColor
            dot.backgroundColor = ink
            nameLabel.textColor = ink
            timeLabel.textColor = ink.withAlphaComponent(0.8)
        } else {
            material.isHidden = false
            material.effect = UIBlurEffect(style: content.isDark ? .systemThinMaterialDark : .systemThinMaterialLight)
            // The material alone lets a bright map through the small text.
            material.contentView.backgroundColor = content.isDark
                ? UIColor(red: 0.063, green: 0.075, blue: 0.102, alpha: 0.62)
                : UIColor.white.withAlphaComponent(0.66)
            backgroundColor = .clear
            layer.borderColor = (content.isDark ? UIColor.white : text).withAlphaComponent(0.1).cgColor
            dot.backgroundColor = color
            nameLabel.textColor = text
            timeLabel.textColor = quiet
        }
        layer.shadowOpacity = content.isDark ? 0.3 : 0.16

        bounds = CGRect(x: 0, y: 0, width: content.width, height: ScooterMapLook.pillHeight)
        setNeedsLayout()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        guard let content else { return }
        material.frame = bounds
        layer.shadowPath = UIBezierPath(roundedRect: bounds, cornerRadius: bounds.height / 2).cgPath
        dot.frame = CGRect(
            x: content.leading,
            y: (bounds.height - Self.dotSize) / 2,
            width: Self.dotSize,
            height: Self.dotSize
        )
        let nameWidth = ceil(nameLabel.intrinsicContentSize.width)
        let nameLeft = dot.frame.maxX + content.gap
        nameLabel.frame = CGRect(x: nameLeft, y: 0, width: nameWidth, height: bounds.height)
        timeLabel.frame = CGRect(
            x: nameLeft + nameWidth + content.gap,
            y: 0,
            width: max(0, bounds.width - content.trailing - nameLeft - nameWidth - content.gap),
            height: bounds.height
        )
    }
}
