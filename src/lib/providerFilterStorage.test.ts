import { describe, expect, it } from 'vitest';
import {
  LEGACY_PROVIDERS_STORAGE_KEY, PROVIDER_ONLY_STORAGE_KEY, PROVIDERS_OFF_STORAGE_KEY, providerOnlyToSave, providersOffToSave, savedProvidersOff,
} from './providerFilterStorage';

const BEFORE = ['bird', 'bolt', 'dott', 'hopp', 'lime', 'pony', 'publibike', 'voi'];
const NOW = [...BEFORE, 'zeus', 'whoosh', 'ridemovi'];
const reading = (stored: Record<string, string>) => (key: string) => stored[key] ?? null;
const sorted = (set: Set<string> | null) => set && [...set].sort();

describe('the providers a visitor keeps off', () => {
  it('reads those turned off, among the providers the map has', () => {
    expect(sorted(savedProvidersOff(reading({ [PROVIDERS_OFF_STORAGE_KEY]: '["bolt","gone"]' }), NOW))).toEqual(['bolt']);
    expect(sorted(savedProvidersOff(reading({ [PROVIDERS_OFF_STORAGE_KEY]: '[]' }), NOW))).toEqual([]);
    // Ahead of a legacy list, which a visit since then removes.
    expect(sorted(savedProvidersOff(reading({ [PROVIDERS_OFF_STORAGE_KEY]: '["voi"]', [LEGACY_PROVIDERS_STORAGE_KEY]: '["lime"]' }), NOW))).toEqual(['voi']);
  });

  it('turns no provider added since 11 October 2026 off from a legacy list of those on', () => {
    // Written on a visit before 11 October, filters untouched: every provider then.
    expect(sorted(savedProvidersOff(reading({ [LEGACY_PROVIDERS_STORAGE_KEY]: JSON.stringify(BEFORE) }), NOW))).toEqual([]);
    // Lime alone, then or since: the others of then go off, the providers added since stay on.
    expect(sorted(savedProvidersOff(reading({ [LEGACY_PROVIDERS_STORAGE_KEY]: '["lime"]' }), NOW)))
      .toEqual(['bird', 'bolt', 'dott', 'hopp', 'pony', 'publibike', 'voi']);
    expect(sorted(savedProvidersOff(reading({ [LEGACY_PROVIDERS_STORAGE_KEY]: '["lime","zeus"]' }), NOW)))
      .toEqual(['bird', 'bolt', 'dott', 'hopp', 'pony', 'publibike', 'voi']);
    // Written since: every provider of its day, those added after it missing.
    expect(sorted(savedProvidersOff(reading({ [LEGACY_PROVIDERS_STORAGE_KEY]: JSON.stringify([...BEFORE, 'zeus']) }), NOW))).toEqual([]);
  });

  it('keeps nothing from a list it cannot read, or one naming a provider the map no longer has, as before', () => {
    expect(savedProvidersOff(reading({}), NOW)).toBeNull();
    expect(savedProvidersOff(reading({ [PROVIDERS_OFF_STORAGE_KEY]: '{', [LEGACY_PROVIDERS_STORAGE_KEY]: '[1]' }), NOW)).toBeNull();
    expect(savedProvidersOff(reading({ [LEGACY_PROVIDERS_STORAGE_KEY]: '["lime","gone"]' }), NOW)).toBeNull();
  });

  it('keeps a visitor with one provider on to that one, whatever the map adds since', () => {
    const lime = { [PROVIDER_ONLY_STORAGE_KEY]: 'lime', [PROVIDERS_OFF_STORAGE_KEY]: JSON.stringify(BEFORE.filter(provider => provider !== 'lime')) };
    expect(sorted(savedProvidersOff(reading(lime), BEFORE))).toEqual(BEFORE.filter(provider => provider !== 'lime'));
    expect(sorted(savedProvidersOff(reading(lime), NOW))).toEqual(NOW.filter(provider => provider !== 'lime').sort());
    // Ahead of a legacy list too.
    expect(sorted(savedProvidersOff(reading({ [PROVIDER_ONLY_STORAGE_KEY]: 'voi', [LEGACY_PROVIDERS_STORAGE_KEY]: '["lime"]' }), NOW)))
      .toEqual(NOW.filter(provider => provider !== 'voi').sort());
  });

  it('reads the list of those off as before where the one provider kept on is not one the map has', () => {
    expect(sorted(savedProvidersOff(reading({ [PROVIDER_ONLY_STORAGE_KEY]: 'gone', [PROVIDERS_OFF_STORAGE_KEY]: '["bolt"]' }), NOW))).toEqual(['bolt']);
    expect(sorted(savedProvidersOff(reading({ [PROVIDER_ONLY_STORAGE_KEY]: 'gone', [LEGACY_PROVIDERS_STORAGE_KEY]: '["lime"]' }), NOW)))
      .toEqual(['bird', 'bolt', 'dott', 'hopp', 'pony', 'publibike', 'voi']);
    expect(savedProvidersOff(reading({ [PROVIDER_ONLY_STORAGE_KEY]: '' }), NOW)).toBeNull();
  });

  it('keeps the one provider on where exactly one of the map\'s is, and none otherwise', () => {
    expect(providerOnlyToSave(NOW, new Set(['lime']))).toBe('lime');
    expect(providerOnlyToSave(NOW, new Set(['lime', 'gone']))).toBe('lime');
    expect(providerOnlyToSave(NOW, new Set(['lime', 'zeus']))).toBeNull();
    expect(providerOnlyToSave(NOW, new Set())).toBeNull();
    expect(providerOnlyToSave(NOW, new Set(NOW))).toBeNull();
  });

  it('keeps the providers not shown, sorted', () => {
    expect(providersOffToSave(NOW, new Set(NOW))).toBe('[]');
    expect(providersOffToSave(NOW, new Set(['lime', 'zeus']))).toBe(JSON.stringify(['bird', 'bolt', 'dott', 'hopp', 'pony', 'publibike', 'ridemovi', 'voi', 'whoosh']));
  });
});
