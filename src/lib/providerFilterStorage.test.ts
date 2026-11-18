import { describe, expect, it } from 'vitest';
import { PROVIDERS } from '@/lib/types';
import {
  LEGACY_PROVIDERS_STORAGE_KEY, PROVIDER_ONLY_STORAGE_KEY, PROVIDERS_OF_NOVEMBER_2026, PROVIDERS_OFF_CHECKED_STORAGE_KEY,
  PROVIDERS_OFF_STORAGE_KEY, providerOnlyToSave, providersOffToSave, savedProvidersOff,
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
    expect(sorted(savedProvidersOff(reading({ [LEGACY_PROVIDERS_STORAGE_KEY]: JSON.stringify([...BEFORE, 'whoosh']) }), NOW))).toEqual(['zeus']);
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

describe('a visitor who kept one provider before the map kept that choice', () => {
  const FORTY = [...PROVIDERS_OF_NOVEMBER_2026];
  const LATER = [...FORTY, 'newco'];
  /** The providers shown with what was kept, on a map with the providers given. */
  const shown = (providers: string[], stored: Record<string, string>) => {
    const off = savedProvidersOff(reading(stored), providers);
    return providers.filter(provider => !off?.has(provider)).sort();
  };
  /** What a save keeps with the providers given shown, flag and all. */
  const saved = (providers: string[], on: string[]) => {
    const only = providerOnlyToSave(providers, new Set(on));
    return {
      [PROVIDERS_OFF_STORAGE_KEY]: providersOffToSave(providers, new Set(on)),
      ...(only ? { [PROVIDER_ONLY_STORAGE_KEY]: only } : {}),
      [PROVIDERS_OFF_CHECKED_STORAGE_KEY]: '1',
    };
  };

  it('are the map\'s providers of 14 November 2026', () => {
    expect(FORTY).toHaveLength(40);
    expect(FORTY.every(provider => provider in PROVIDERS)).toBe(true);
  });

  it('keeps Lime alone from a list of those off kept before 10 November, on a map that adds a provider since', () => {
    const before = { [PROVIDERS_OFF_STORAGE_KEY]: JSON.stringify(FORTY.filter(provider => provider !== 'lime')) };
    expect(shown(LATER, before)).toEqual(['lime']);
    expect(shown(FORTY, before)).toEqual(['lime']);
    // A one-provider key kept with it goes first, as before.
    expect(shown(LATER, { ...before, [PROVIDER_ONLY_STORAGE_KEY]: 'voi' })).toEqual(['voi']);
  });

  it('turns a provider added since on for a visitor who kept two, with or without the flag', () => {
    const two = { [PROVIDERS_OFF_STORAGE_KEY]: JSON.stringify(FORTY.filter(provider => !['bolt', 'lime'].includes(provider))) };
    expect(shown(LATER, two)).toEqual(['bolt', 'lime', 'newco']);
    expect(shown(LATER, saved(FORTY, ['bolt', 'lime']))).toEqual(['bolt', 'lime', 'newco']);
  });

  it('reads the list once: Lime and a provider added since, saved with the flag, stay both on', () => {
    const both = saved(LATER, ['lime', 'newco']);
    expect(both[PROVIDER_ONLY_STORAGE_KEY]).toBeUndefined();
    expect(shown(LATER, both)).toEqual(['lime', 'newco']);
    // Without the flag the same list would read as Lime alone.
    const unflagged = Object.fromEntries(Object.entries(both).filter(([key]) => key !== PROVIDERS_OFF_CHECKED_STORAGE_KEY));
    expect(shown(LATER, unflagged)).toEqual(['lime']);
  });

  it('reads the list as kept where its one provider left on is no longer on the map', () => {
    const gone = FORTY.filter(provider => provider !== 'zippy');
    expect(shown(gone, { [PROVIDERS_OFF_STORAGE_KEY]: JSON.stringify(gone) })).toEqual([]);
  });
});
