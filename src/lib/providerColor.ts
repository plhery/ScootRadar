import { PROVIDERS } from '@/lib/types';

/**
 * A provider's colour for what the app draws: a scooter on the map, the dot of
 * a chip, the tile of a card. The stylesheet may replace it per appearance
 * (--provider-bird in the dark one, where Bird's near-black would disappear).
 */
export function providerSurfaceColor(provider: string, fallback: string): string {
  const color = PROVIDERS[provider]?.color;
  return color ? `var(--provider-${provider}, ${color})` : fallback;
}

const DARK_INK = '#10131a';
const LIGHT_INK = '#ffffff';

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** Dark or white, whichever reads better on this colour. */
export function inkOn(color: string): string {
  const ground = luminance(color);
  return contrast(ground, luminance(DARK_INK)) >= contrast(ground, luminance(LIGHT_INK)) ? DARK_INK : LIGHT_INK;
}

/**
 * The colour of what is written on a provider's colour: its initials on the
 * map and on its card. The stylesheet replaces it where it replaces the colour
 * (--provider-bird-ink in the dark appearance).
 */
export function providerInkColor(provider: string): string {
  const color = PROVIDERS[provider]?.color;
  return color ? `var(--provider-${provider}-ink, ${inkOn(color)})` : LIGHT_INK;
}
