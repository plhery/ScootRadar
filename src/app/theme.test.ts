import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { GROUND_PALETTES } from '@/lib/quietGround';

const css = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');

/** The declarations of the first rule with this selector. */
function declarations(selector: string): string[] {
  const start = css.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThan(-1);
  const open = css.indexOf('{', start);
  return css.slice(open + 1, css.indexOf('}', open)).split('\n').map(line => line.trim()).filter(Boolean);
}

/** The rule with this selector sits inside the media query for a dark system. */
function onlyInDarkSystem(selector: string): boolean {
  const pattern = selector.replace(/[.[\]()']/g, '\\$&');
  return new RegExp(`@media \\(prefers-color-scheme: dark\\) \\{\\s*${pattern} \\{`).test(css);
}

// CSS cannot share one block between a selector and a media query, so the dark
// appearance is written twice. They must not drift apart.
it('gives Automatic on a dark system exactly the declarations of the chosen dark appearance', () => {
  const chosen = declarations(".app-shell[data-theme='dark']");
  expect(chosen).toContain('color-scheme: dark;');
  expect(chosen.length).toBeGreaterThan(30);
  expect(declarations(".app-shell[data-theme='auto']")).toEqual(chosen);
  expect(onlyInDarkSystem(".app-shell[data-theme='auto']")).toBe(true);
  expect(onlyInDarkSystem(".app-shell[data-theme='dark']")).toBe(false);
});

it('lets the page behind the app follow the same appearance', () => {
  const chosen = declarations("html:has(.app-shell[data-theme='dark'])");
  expect(chosen).toContain('color-scheme: dark;');
  expect(declarations("html:has(.app-shell[data-theme='auto'])")).toEqual(chosen);
  expect(onlyInDarkSystem("html:has(.app-shell[data-theme='auto'])")).toBe(true);
  // Past the edges of the app the page shows the app's own dark background.
  const background = declarations(".app-shell[data-theme='dark']").find(line => line.startsWith('--page-bg:'));
  expect(background).toBeDefined();
  expect(chosen).toContain(background);
});

// The map is drawn on a canvas from src/lib/quietGround.ts; the page around it,
// the preview of the map styles and the rings of the scooters use the tokens.
it.each([
  ['day', ':root'],
  ['night', ".app-shell[data-theme='dark']"],
] as const)('gives the page the colours the ground of the map is drawn in, by %s', (theme, block) => {
  const palette = GROUND_PALETTES[theme];
  const tokens = declarations(block);
  expect(tokens).toContain(`--map-bg: ${palette.land};`);
  expect(tokens).toContain(`--page-bg: ${palette.land};`);
  expect(tokens).toContain(`--ground-green: ${palette.green};`);
  expect(tokens).toContain(`--ground-water: ${palette.water};`);
  expect(tokens).toContain(`--ground-street: ${palette.mid};`);
  expect(tokens).toContain(`--ground-name: ${palette.label};`);
});

type Rgb = [number, number, number];
interface Paint { rgb: Rgb; alpha: number }

/** Reads '#rgb', '#rrggbb', 'rgba(r, g, b, a)', 'var(--token)' and 'color-mix(in srgb, <colour> N%, transparent)'. */
function paint(value: string, tokens: Map<string, string>): Paint {
  const text = value.trim();
  const token = /^var\((--[\w-]+)\)$/.exec(text);
  if (token) return paint(tokens.get(token[1]) ?? '', tokens);
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(text);
  if (short) return paint(`#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`, tokens);
  const hex = /^#([0-9a-f]{6})$/i.exec(text);
  if (hex) return { rgb: [0, 2, 4].map(at => parseInt(hex[1].slice(at, at + 2), 16)) as Rgb, alpha: 1 };
  const rgba = /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(text);
  if (rgba) return { rgb: [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])], alpha: Number(rgba[4]) };
  const mix = /^color-mix\(in srgb, (.+) (\d+)%, transparent\)$/.exec(text);
  if (mix) return { rgb: paint(mix[1], tokens).rgb, alpha: Number(mix[2]) / 100 };
  throw new Error(`Cannot read the colour "${value}"`);
}

function over(top: Paint, below: Rgb): Rgb {
  return top.rgb.map((channel, index) => channel * top.alpha + below[index] * (1 - top.alpha)) as Rgb;
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

function value(lines: string[], property: string): string {
  const line = lines.find(candidate => candidate.startsWith(`${property}:`));
  expect(line, property).toBeDefined();
  return line!.slice(property.length + 1).replace(/;$/, '').trim();
}

// A filled chip and a battery said in its colour are where the contrast gets
// thin. Worked out from the tokens, over the glass of the dock as it lies on the
// map's own background.
it.each([
  ['light', ':root'],
  ['dark', ".app-shell[data-theme='dark']"],
])('keeps a filled chip, its count and a low battery at 4.5:1 in the %s appearance', (_name, block) => {
  const tokens = new Map(
    [...declarations(':root'), ...declarations(block)]
      .filter(line => line.startsWith('--'))
      .map(line => [line.slice(0, line.indexOf(':')), line.slice(line.indexOf(':') + 1).replace(/;$/, '').trim()])
  );
  const glass = over(paint('var(--glass-bg)', tokens), paint('var(--map-bg)', tokens).rgb);
  const ink = (selector: string) => paint(value(declarations(selector), 'color'), tokens).rgb;

  const chip = declarations('.chip-selected');
  const chipSurface = over(paint(value(chip, 'background'), tokens), glass);
  expect(contrast(ink('.chip-selected'), chipSurface)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(ink('.chip-selected .chip-count'), chipSurface)).toBeGreaterThanOrEqual(4.5);
  // The count of a chip that is not filled, on the chip itself.
  const plainChip = over(paint(value(declarations('.chip'), 'background'), tokens), glass);
  expect(contrast(ink('.chip-count'), plainChip)).toBeGreaterThanOrEqual(4.5);

  // A battery among the figures of a card, and in the line under its name.
  const figure = over(paint(value(declarations('.card-figure'), 'background'), tokens), glass);
  expect(contrast(ink('.card-figure-low strong'), figure)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(ink('.card-figure-critical strong'), figure)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(ink('.card-figure-label'), figure)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(ink('.card-title .card-facts-low'), glass)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(ink('.card-title .card-facts-critical'), glass)).toBeGreaterThanOrEqual(4.5);
  // What says whose the nearest scooter is, under the figure of the dock.
  expect(contrast(ink('.dock-lead-detail'), glass)).toBeGreaterThanOrEqual(4.5);
});
