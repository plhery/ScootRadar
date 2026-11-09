import { snapBatteryPreset, type BatteryPreset } from '@/lib/battery';

export type ThemeName = 'auto' | 'light' | 'dark';
export type MapStyleName = 'calm' | 'detailed';

export interface ClientParams {
  origin: [number, number] | null;
  minBattery: BatteryPreset | undefined;
  /**
   * The range minimum in whole metres, as given: the map shows it on a step of its units (range.ts). Never
   * above 0 beside a battery minimum above 0, which wins in a link that sets both, as the filters set one or
   * the other.
   */
  minRange: number | undefined;
  /** Undefined when nothing was chosen, which means automatic. */
  theme: ThemeName | undefined;
  /** Undefined when nothing was chosen, which means calm. */
  map: MapStyleName | undefined;
  /** Undefined when nothing was chosen, which means the operators' zones are shown. */
  zones: boolean | undefined;
}

/**
 * What a link to the map could carry while the map was at "/", which mark a link there as the map's
 * (mapAddress.ts, and the apps' ScooterMapLink). "tile" is the style setting of older links. Those added
 * since, zones and minRange, are read on the map alone.
 */
export const CLIENT_PARAMETERS = ['origin', 'minBattery', 'theme', 'map', 'tile'] as const;

const THEMES = new Set<ThemeName>(['auto', 'light', 'dark']);
const MAP_STYLES = new Set<MapStyleName>(['calm', 'detailed']);

function parseCoordinate(value: string | null): [number, number] | null {
  if (!value) return null;

  const parts = value.split(',').map(part => part.trim());
  if (parts.length !== 2 || parts.some(part => part === '')) return null;

  const [lat, lng] = parts.map(Number);
  if (
    !Number.isFinite(lat) || lat < -90 || lat > 90 ||
    !Number.isFinite(lng) || lng < -180 || lng > 180
  ) {
    return null;
  }

  return [lat, lng];
}

function parseMinimumBattery(value: string | null): BatteryPreset | undefined {
  if (value === null || value.trim() === '') return undefined;

  const parsed = Number(value);
  // Links and settings from the slider era hold any multiple of five.
  return Number.isFinite(parsed) ? snapBatteryPreset(parsed) : undefined;
}

// Whole metres, 0 for none; anything else, as a negative or a fraction, is no choice at all.
function parseMinimumRange(value: string | null): number | undefined {
  if (value === null || !/^\d+$/.test(value.trim())) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

// "tile" held the single map style setting before appearance and map detail were separate.
function parseTheme(value: string | null, legacyTile: string | null): ThemeName | undefined {
  if (THEMES.has(value as ThemeName)) return value as ThemeName;
  return legacyTile === 'dark' ? 'dark' : undefined;
}

function parseMapStyle(value: string | null, legacyTile: string | null): MapStyleName | undefined {
  if (MAP_STYLES.has(value as MapStyleName)) return value as MapStyleName;
  return legacyTile === 'osm' ? 'detailed' : undefined;
}

export function parseClientParams(params: URLSearchParams): ClientParams {
  const legacyTile = params.get('tile');
  const minBattery = parseMinimumBattery(params.get('minBattery'));
  const minRange = parseMinimumRange(params.get('minRange'));
  return {
    origin: parseCoordinate(params.get('origin')),
    minBattery,
    minRange: minRange !== undefined && (minBattery ?? 0) > 0 ? 0 : minRange,
    theme: parseTheme(params.get('theme'), legacyTile),
    map: parseMapStyle(params.get('map'), legacyTile),
    zones: params.get('zones') === '0' ? false : params.get('zones') === '1' ? true : undefined,
  };
}

export function parseStoredClientParams(raw: string | null): ClientParams | null {
  if (!raw) return null;

  try {
    const stored = JSON.parse(raw) as unknown;
    if (stored === null || typeof stored !== 'object' || Array.isArray(stored)) return null;

    const record = stored as Record<string, unknown>;
    const params = new URLSearchParams();
    // Origins from older releases are intentionally ignored. Preferences may
    // persist locally, but precise map/location coordinates should not.
    for (const key of ['minBattery', 'minRange', 'theme', 'map', 'tile', 'zones']) {
      if (typeof record[key] === 'string') params.set(key, record[key]);
    }

    const parsed = parseClientParams(params);
    return parsed.minBattery !== undefined || parsed.minRange !== undefined || parsed.theme || parsed.map ||
      parsed.zones !== undefined
      ? parsed
      : null;
  } catch {
    return null;
  }
}

/**
 * The settings the map starts with: each one the link sets, over the one saved on this device. A link that sets
 * none, as one with a place or a campaign's tag alone, leaves every saved setting as it is; the place itself is
 * the link's alone, never saved. A battery or range minimum the link sets clears the other one saved, as
 * choosing it in the filters would.
 */
export function startingClientParams(link: ClientParams, saved: ClientParams | null): ClientParams {
  const minBattery = link.minBattery ?? saved?.minBattery;
  const minRange = link.minRange ?? saved?.minRange;
  const both = (minBattery ?? 0) > 0 && (minRange ?? 0) > 0;
  return {
    origin: link.origin,
    minBattery: both && link.minBattery === undefined ? 0 : minBattery,
    minRange: both && link.minRange === undefined ? 0 : minRange,
    theme: link.theme ?? saved?.theme,
    map: link.map ?? saved?.map,
    zones: link.zones ?? saved?.zones,
  };
}

export function serializeClientParams({
  minBattery,
  minRange = 0,
  theme,
  map,
  zones = true,
}: {
  minBattery: number;
  /** In whole metres, as the map shows it. */
  minRange?: number;
  theme: ThemeName;
  map: MapStyleName;
  zones?: boolean;
}): URLSearchParams {
  const params = new URLSearchParams();
  if (minBattery !== 0) params.set('minBattery', String(minBattery));
  if (minRange !== 0) params.set('minRange', String(minRange));
  if (theme !== 'auto') params.set('theme', theme);
  if (map !== 'calm') params.set('map', map);
  if (!zones) params.set('zones', '0');
  return params;
}
