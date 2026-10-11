import { describe, expect, it } from 'vitest';
import { inkOn, providerInkColor, providerSurfaceColor } from '@/lib/providerColor';
import { PROVIDERS } from '@/lib/types';

describe('providerSurfaceColor', () => {
  it('lets the stylesheet replace a provider colour and falls back to the catalogue', () => {
    expect(providerSurfaceColor('bird', '#8e8e93')).toBe('var(--provider-bird, #222222)');
    expect(providerSurfaceColor('lime', '#8e8e93')).toBe('var(--provider-lime, #32cd32)');
  });

  it('uses the given colour for a provider that is not in the catalogue', () => {
    expect(providerSurfaceColor('unknown', '#8e8e93')).toBe('#8e8e93');
  });
});

describe('inkOn', () => {
  it('writes in white on a colour, and in dark on one too light for white', () => {
    expect(inkOn('#222222')).toBe('#ffffff');
    expect(inkOn('#9b59b6')).toBe('#ffffff');
    expect(inkOn('#32cd32')).toBe('#ffffff');
    expect(inkOn('#f2f2f7')).toBe('#10131a');
    expect(inkOn('#ffd400')).toBe('#10131a');
  });

  it('writes in white on the colour of every provider, where white stands out', () => {
    const luminance = (hex: string) => [1, 3, 5]
      .map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255)
      .map(value => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
      .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    for (const { color } of Object.values(PROVIDERS)) {
      expect(inkOn(color), color).toBe('#ffffff');
      expect(1.05 / (luminance(color) + 0.05), color).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('providerInkColor', () => {
  it('lets the stylesheet replace the ink where it replaces the colour', () => {
    expect(providerInkColor('bird')).toBe('var(--provider-bird-ink, #ffffff)');
    expect(providerInkColor('voi')).toBe('var(--provider-voi-ink, #ffffff)');
    expect(providerInkColor('unknown')).toBe('#ffffff');
  });
});
