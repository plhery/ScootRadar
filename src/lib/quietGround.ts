import type L from 'leaflet';
import {
  CenteredTextSymbolizer,
  GeomType,
  LineLabelPlacement,
  LineLabelSymbolizer,
  LineSymbolizer,
  PolygonSymbolizer,
  exp,
  leafletLayer,
  type Feature,
  type LabelRule,
  type PaintRule,
} from 'protomaps-leaflet';

// The ground under the scooters: land, water, green, buildings, streets, rails
// and a few names, drawn here from OpenStreetMap data in the colours of the
// app. Nothing on it competes with a scooter.

export type GroundTheme = 'day' | 'night';
/** Calm names the streets and the quarters; detailed adds places, stops and house numbers. */
export type GroundDetail = 'calm' | 'detailed';

interface GroundPalette {
  land: string;
  green: string;
  water: string;
  building: string;
  buildingLine: string;
  rail: string;
  path: string;
  /** The edge of a street where the street is as light as the land; null where it is not needed. */
  casing: string | null;
  minor: string;
  mid: string;
  major: string;
  border: string;
  label: string;
  labelStrong: string;
  halo: string;
  waterLabel: string;
}

export const GROUND_PALETTES: Record<GroundTheme, GroundPalette> = {
  night: {
    land: '#0b0e14', green: '#0d1d1b', water: '#0b2244', building: '#10141d', buildingLine: '#171d2a',
    rail: '#2a3246', path: '#1a2030', casing: null, minor: '#222a3b', mid: '#2b354a', major: '#35415a',
    border: '#3a4560', label: '#76819a', labelStrong: '#9aa4b8', halo: '#0b0e14', waterLabel: '#4670aa',
  },
  day: {
    land: '#eef0f4', green: '#dbe8da', water: '#c2d8f2', building: '#e2e5eb', buildingLine: '#d6dae2',
    rail: '#cfd4dd', path: '#f7f8fa', casing: '#dde1e8', minor: '#ffffff', mid: '#ffffff', major: '#ffffff',
    border: '#b9c0cc', label: '#7c8596', labelStrong: '#5f6878', halo: '#eef0f4', waterLabel: '#6d93c4',
  },
};

// The tiles are OpenFreeMap's, in the OpenMapTiles schema. Their address carries
// the date of the build, so it is asked for once per visit.
const TILE_INDEX_URL = 'https://tiles.openfreemap.org/planet';
const TILE_URL_PATTERN = /^https:\/\/tiles\.openfreemap\.org\/[\w./-]*\{z\}\/\{x\}\/\{y\}\.pbf$/;
/** The deepest zoom the tiles are cut for; closer in, the same data is drawn larger. */
const MAX_DATA_ZOOM = 14;

let tileUrl: Promise<string> | null = null;

/** Where the vector tiles are, as a {z}/{x}/{y} address. A failure is not remembered. */
export function groundTileUrl(fetcher: typeof fetch = fetch): Promise<string> {
  tileUrl ??= fetcher(TILE_INDEX_URL)
    .then(response => {
      if (!response.ok) throw new Error(`Map tiles: ${response.status}`);
      return response.json() as Promise<{ tiles?: unknown }>;
    })
    .then(index => {
      const url = Array.isArray(index.tiles) ? index.tiles[0] : null;
      if (typeof url !== 'string' || !TILE_URL_PATTERN.test(url)) throw new Error('Map tiles: unexpected address');
      return url;
    })
    .catch(error => {
      tileUrl = null;
      throw error;
    });
  return tileUrl;
}

/** For tests: forget the address. */
export function forgetGroundTileUrl() {
  tileUrl = null;
}

const text = (feature: Feature, key: string): string | undefined => {
  const value = feature.props[key];
  return typeof value === 'string' ? value : undefined;
};
const isLine = (feature: Feature) => feature.geomType === GeomType.Line;
const underground = (feature: Feature) => text(feature, 'brunnel') === 'tunnel';

/** Lines of the transportation layer of these classes, above ground. */
function ways(...classes: string[]) {
  return (_zoom: number, feature: Feature) =>
    isLine(feature) && !underground(feature) && classes.includes(text(feature, 'class') ?? '');
}

// A street closed to cars is filed with the footpaths; it is drawn as the street it is.
const isPedestrianStreet = (feature: Feature) =>
  text(feature, 'class') === 'path' && text(feature, 'subclass') === 'pedestrian';

/** Widths in pixels at the zooms of the map, growing as streets do on the ground. */
const grows = (stops: [number, number][]) => exp(1.6, stops);

const STREET_WIDTHS: Record<'service' | 'minor' | 'mid' | 'major', [number, number][]> = {
  service: [[15, 0.5], [17, 2.8], [19, 9]],
  minor: [[14, 0.7], [17, 5.4], [19, 18]],
  mid: [[12, 0.8], [17, 7], [19, 22]],
  major: [[8, 0.6], [12, 1.4], [17, 8.6], [19, 25]],
};

function streetRules(color: (kind: keyof typeof STREET_WIDTHS) => string, extra: number): PaintRule[] {
  const widths = (kind: keyof typeof STREET_WIDTHS) =>
    grows(STREET_WIDTHS[kind].map(([zoom, width]) => [zoom, width + extra]));
  const street = (kind: keyof typeof STREET_WIDTHS, minzoom: number, filter: PaintRule['filter']): PaintRule => ({
    dataLayer: 'transportation',
    minzoom,
    filter,
    symbolizer: new LineSymbolizer({ color: color(kind), width: widths(kind), lineCap: 'round', lineJoin: 'round' }),
  });
  return [
    street('service', 15, ways('service')),
    street('minor', 13, (zoom, feature) => ways('minor')(zoom, feature) ||
      (isLine(feature) && !underground(feature) && isPedestrianStreet(feature))),
    street('mid', 11, ways('tertiary', 'secondary')),
    street('major', 8, ways('primary', 'trunk', 'motorway')),
  ];
}

export interface GroundRules {
  background: string;
  paint: PaintRule[];
  labels: LabelRule[];
}

// Where a script is not one of Unicode's, the ones it writes with: Japanese in kanji and kana.
const SCRIPT_PARTS: Record<string, readonly string[]> = { Jpan: ['Hani', 'Hira', 'Kana'], Kore: ['Hang', 'Hani'], Hans: ['Hani'], Hant: ['Hani'] };

/** Whether a name's first letter is in the script a language is written in; true for a name without letters. */
function writtenAs(language: string): (name: string) => boolean {
  let script: RegExp;
  try {
    const code = new Intl.Locale(language).maximize().script ?? 'Latn';
    script = new RegExp(`^(?:${(SCRIPT_PARTS[code] ?? [code]).map(part => `\\p{Script=${part}}`).join('|')})`, 'u');
  } catch {
    script = /^\p{Script=Latn}/u;
  }
  return name => {
    const letter = name.match(/\p{L}/u)?.[0];
    return letter === undefined || script.test(letter);
  };
}

/**
 * Which of a feature's names its label shows, the first it has. The tiles carry
 * name, the local name; name:latin, the same where it is Latin and else its
 * English or Latin form; and name:<language> where OpenStreetMap has one. So:
 * the place in the visitor's language, as Zurich for "en", Αθήνα for "el" and
 * אתונה for "he"; else the local name where it is in the visitor's script, as
 * the Greek streets of Athens for "el", which seldom say name:el; else its
 * Latin form, so that an English map of Tel Aviv or Dubai reads "Ben Yehuda"
 * and "Al Mustaqbal Street"; and else the local name, as for a Hebrew name
 * with no Latin one.
 */
export function placeNameKeys(language: string): (zoom: number, feature?: Feature) => string[] {
  // The tiles write Norwegian as no.
  const own = `name:${language === 'nb' || language === 'nn' ? 'no' : language}`;
  const sameScript = writtenAs(language);
  const local = [own, 'name', 'name:latin'];
  const latin = [own, 'name:latin', 'name'];
  return (_zoom, feature) => {
    const name = feature ? text(feature, 'name') : undefined;
    return name !== undefined && sameScript(name) ? local : latin;
  };
}

/** What is drawn, from the bottom up, and the names over it, in the visitor's language where the tiles have it. */
export function groundRules(theme: GroundTheme, detail: GroundDetail, fontFamily: string, language = 'en'): GroundRules {
  const c = GROUND_PALETTES[theme];
  const classOf = (feature: Feature) => text(feature, 'class') ?? '';
  const labelProps = placeNameKeys(language);

  const paint: PaintRule[] = [
    {
      dataLayer: 'landcover',
      filter: (_zoom, feature) => classOf(feature) === 'grass' || classOf(feature) === 'wood',
      symbolizer: new PolygonSymbolizer({ fill: c.green }),
    },
    { dataLayer: 'park', symbolizer: new PolygonSymbolizer({ fill: c.green, opacity: 0.6 }) },
    { dataLayer: 'water', symbolizer: new PolygonSymbolizer({ fill: c.water }) },
    { dataLayer: 'waterway', minzoom: 11, symbolizer: new LineSymbolizer({ color: c.water, width: grows([[11, 0.6], [17, 2.4]]) }) },
    {
      dataLayer: 'boundary',
      filter: (_zoom, feature) => feature.props.admin_level === 2 && feature.props.maritime !== 1,
      symbolizer: new LineSymbolizer({ color: c.border, width: grows([[4, 0.6], [10, 1.4]]) }),
    },
    {
      dataLayer: 'building',
      minzoom: 15,
      symbolizer: new PolygonSymbolizer({ fill: c.building, stroke: c.buildingLine, width: 1 }),
    },
    // A square or a street closed to cars, mapped as an area.
    {
      dataLayer: 'transportation',
      minzoom: 15,
      filter: (_zoom, feature) => feature.geomType === GeomType.Polygon && classOf(feature) === 'path',
      symbolizer: new PolygonSymbolizer({ fill: c.path }),
    },
    {
      dataLayer: 'transportation',
      minzoom: 12,
      // The sidings of a station are left out until the tracks can be told apart.
      filter: (zoom, feature) => ways('rail')(zoom, feature) && (zoom >= 17 || feature.props.service === undefined),
      symbolizer: new LineSymbolizer({ color: c.rail, width: grows([[12, 0.4], [17, 1], [19, 2]]) }),
    },
    {
      dataLayer: 'transportation',
      minzoom: 16,
      filter: (zoom, feature) => ways('path', 'track')(zoom, feature) && !isPedestrianStreet(feature),
      symbolizer: new LineSymbolizer({ color: c.path, width: grows([[16, 0.6], [17, 1.3], [19, 3.2]]), lineCap: 'round' }),
    },
    ...(c.casing ? streetRules(() => c.casing!, 1.8) : []),
    ...streetRules(kind => (kind === 'service' ? c.minor : c[kind]), 0),
  ];

  const halo = { stroke: c.halo, width: 2.8 };
  const place = (classes: string[], minzoom: number, maxzoom: number, fontSize: number, strong = false): LabelRule => ({
    dataLayer: 'place',
    minzoom,
    maxzoom,
    filter: (_zoom, feature) => classes.includes(classOf(feature)),
    // The larger place first where two names want the same room.
    sort: (a, b) => (Number(a.rank) || 99) - (Number(b.rank) || 99),
    symbolizer: new CenteredTextSymbolizer({
      labelProps, fontFamily, fontSize, fontWeight: 700, maxLineChars: 12,
      fill: strong ? c.labelStrong : c.label, ...halo,
    }),
  });

  const labels: LabelRule[] = [
    place(['city'], 5, 12, 14, true),
    place(['town'], 9, 13, 12.5, true),
    place(['village'], 11, 14, 11.5),
    {
      dataLayer: 'place',
      minzoom: 13,
      filter: (_zoom, feature) => ['suburb', 'quarter', 'neighbourhood'].includes(classOf(feature)),
      symbolizer: new CenteredTextSymbolizer({
        labelProps, fontFamily, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: 1.6, maxLineChars: 12, fill: c.label, ...halo,
      }),
    },
    {
      dataLayer: 'poi',
      minzoom: 14,
      filter: (_zoom, feature) => classOf(feature) === 'railway' && text(feature, 'subclass') === 'station',
      symbolizer: new CenteredTextSymbolizer({
        labelProps, fontFamily, fontSize: 12.5, fontWeight: 700, maxLineChars: 14, fill: c.labelStrong, ...halo,
      }),
    },
    {
      dataLayer: 'water_name',
      minzoom: 9,
      filter: (_zoom, feature) => feature.geomType === GeomType.Point,
      symbolizer: new CenteredTextSymbolizer({
        labelProps, fontFamily, fontSize: 12, fontStyle: 'italic', fontWeight: 500, maxLineChars: 12, fill: c.waterLabel,
      }),
    },
    {
      dataLayer: 'transportation_name',
      minzoom: 16,
      filter: (_zoom, feature) => ['minor', 'tertiary', 'secondary', 'primary', 'trunk'].includes(classOf(feature)) ||
        (detail === 'detailed' && classOf(feature) === 'path'),
      symbolizer: new LineLabelSymbolizer({
        labelProps, fontFamily, fontWeight: 500, fontSize: zoom => (zoom >= 18 ? 12 : zoom >= 17 ? 11 : 10),
        fill: c.label, ...halo, position: LineLabelPlacement.Center, repeatDistance: 420,
      }),
    },
    {
      dataLayer: 'waterway',
      minzoom: 15,
      symbolizer: new LineLabelSymbolizer({
        labelProps, fontFamily, fontSize: 12, fontStyle: 'italic', fontWeight: 500,
        fill: c.waterLabel, position: LineLabelPlacement.Center,
      }),
    },
  ];

  if (detail === 'detailed') {
    labels.push(
      {
        dataLayer: 'poi',
        minzoom: 17,
        // Stations already have their name; the rest comes in the order of the data's own ranking.
        filter: (_zoom, feature) => !(classOf(feature) === 'railway' && text(feature, 'subclass') === 'station'),
        sort: (a, b) => (Number(a.rank) || 99) - (Number(b.rank) || 99),
        symbolizer: new CenteredTextSymbolizer({
          labelProps, fontFamily, fontSize: 10.5, fontWeight: 500, maxLineChars: 14, fill: c.label, ...halo,
        }),
      },
      {
        dataLayer: 'housenumber',
        minzoom: 19,
        symbolizer: new CenteredTextSymbolizer({
          labelProps: ['housenumber'], fontFamily, fontSize: 9.5, fontWeight: 500, fill: c.label, stroke: c.halo, width: 2,
        }),
      },
    );
  }

  return { background: c.land, paint, labels };
}

/** The Leaflet layer of the ground, with what changes its look afterwards. */
export type GroundLayer = L.GridLayer & {
  paintRules: PaintRule[];
  labelRules: LabelRule[];
  backgroundColor?: string;
  clearLayout(): void;
  rerenderTiles(): void;
};

export function createGroundLayer(url: string, rules: GroundRules, options: L.GridLayerOptions & {
  /** Drawing waits for these, so that names are set in the app's own typeface. */
  tasks?: Promise<unknown>[];
  /** The language the canvases are marked with. */
  lang?: string;
}): GroundLayer {
  return leafletLayer({
    ...options,
    url,
    maxDataZoom: MAX_DATA_ZOOM,
    paintRules: rules.paint,
    labelRules: rules.labels,
    backgroundColor: rules.background,
  } as Parameters<typeof leafletLayer>[0]) as unknown as GroundLayer;
}

/** Another appearance or level of detail: the tiles already loaded are drawn again, none is fetched. */
export function restyleGroundLayer(layer: GroundLayer, rules: GroundRules) {
  layer.paintRules = rules.paint;
  layer.labelRules = rules.labels;
  layer.backgroundColor = rules.background;
  layer.clearLayout();
  layer.rerenderTiles();
}
