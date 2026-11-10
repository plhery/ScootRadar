export type ThemeName = 'auto' | 'light' | 'dark';
export type MapStyleName = 'calm' | 'detailed';

export interface ClientParams {
  origin: [number, number] | null;
  /**
   * The range minimum in whole metres, as given: the map shows it on a step of its units (rangeSlider.ts).
   * The battery minimum of links and filters saved before it, minBattery, is no longer read.
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
 * (mapAddress.ts, and the apps' ScooterMapLink). "tile" is the style setting of older links, and minBattery
 * the battery minimum the range minimum replaced, both still marking a link to the map. Those added since,
 * zones and minRange, are read on the map alone.
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
  return {
    origin: parseCoordinate(params.get('origin')),
    minRange: parseMinimumRange(params.get('minRange')),
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
    // persist locally, but precise map/location coordinates should not. A battery
    // minimum saved before the range minimum is dropped with the next save.
    for (const key of ['minRange', 'theme', 'map', 'tile', 'zones']) {
      if (typeof record[key] === 'string') params.set(key, record[key]);
    }

    const parsed = parseClientParams(params);
    return parsed.minRange !== undefined || parsed.theme || parsed.map ||
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
 * the link's alone, never saved, and so are its settings until the rider changes them (settingsToSave).
 */
export function startingClientParams(link: ClientParams, saved: ClientParams | null): ClientParams {
  return {
    origin: link.origin,
    minRange: link.minRange ?? saved?.minRange,
    theme: link.theme ?? saved?.theme,
    map: link.map ?? saved?.map,
    zones: link.zones ?? saved?.zones,
  };
}

/** The settings a link can set. */
export type LinkSetting = 'minRange' | 'theme' | 'map' | 'zones';

/** The settings this link sets: shown on the visit it opens, and not saved on the device unless the rider changes them. */
export function settingsSetBy(link: ClientParams): Set<LinkSetting> {
  return new Set((['minRange', 'theme', 'map', 'zones'] as const).filter(setting => link[setting] !== undefined));
}

/**
 * What to save on this device: the settings shown, but for those a link set for its visit and the rider has not
 * changed during it, which stay as they were saved, so that the next visit without the link shows them again.
 */
export function settingsToSave(
  shown: { minRange: number; theme: ThemeName; map: MapStyleName; zones: boolean },
  saved: ClientParams | null,
  linkOnly: ReadonlySet<LinkSetting>,
): URLSearchParams {
  return serializeClientParams({
    minRange: linkOnly.has('minRange') ? saved?.minRange : shown.minRange,
    theme: linkOnly.has('theme') ? saved?.theme ?? 'auto' : shown.theme,
    map: linkOnly.has('map') ? saved?.map ?? 'calm' : shown.map,
    zones: linkOnly.has('zones') ? saved?.zones : shown.zones,
  });
}

export function serializeClientParams({
  minRange = 0,
  theme,
  map,
  zones = true,
}: {
  /** In whole metres, as the map shows it. */
  minRange?: number;
  theme: ThemeName;
  map: MapStyleName;
  zones?: boolean;
}): URLSearchParams {
  const params = new URLSearchParams();
  if (minRange !== 0) params.set('minRange', String(minRange));
  if (theme !== 'auto') params.set('theme', theme);
  if (map !== 'calm') params.set('map', map);
  if (!zones) params.set('zones', '0');
  return params;
}
