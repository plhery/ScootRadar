'use client';

import { track } from '@/lib/analytics';
import { isolated } from '@/lib/bidi';

import { prefersReducedMotion, selectionFeedback } from '@/lib/feedback';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from 'react';
import L from 'leaflet';
import '@tomickigrzegorz/leaflet-rotate';
import 'leaflet/dist/leaflet.css';
import MapCompass from './MapCompass';
import MarkerPopover, { followMarker } from './MarkerPopover';
import UserLocationMarker from './UserLocationMarker';
import type { ParkingLocation, ScooterCluster, Vehicle } from '@/lib/types';
import type { CityGroup } from '@/lib/clustering';
import { PROVIDERS } from '@/lib/types';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import type { AddressResult } from '@/components/AddressSearch';
import type { MapStyleName, ThemeName } from '@/lib/clientParams';
import { haversineM, lngNear, lngSpan, viewBounds, type MapViewport } from '@/lib/geo';
import {
  CLOSE_UP_ZOOM,
  NAME_WEIGHT,
  fanOut,
  lightAt,
  lightDiameter,
  lightStrength,
  nearestOfEachProvider,
  placeNames,
  type DrawnLight,
  type LightKind,
  type NameToPlace,
  type Obstacle,
  type Offset,
} from '@/lib/mapLights';
import { revealShift } from '@/lib/markerReveal';
import { stopMapRotation, syncRotationMotion } from '@/lib/mapRotation';
import { providerInkColor, providerSurfaceColor } from '@/lib/providerColor';
import {
  createGroundLayer,
  groundRules,
  groundTileUrl,
  restyleGroundLayer,
  type GroundLayer,
  type GroundTheme,
} from '@/lib/quietGround';
import { scooterTip } from '@/lib/scooterTip';
import { formatDistance as formatWalkingDistance, measurementSystem, walkingMinutes, type DistanceFormatter } from '@/lib/walking';
import { createRouteLayer, type Frame, type RouteLayer } from '@/lib/walkRouteLayer';
import type { WalkView } from '@/lib/walkState';
import type { RuleKind, RuleZoneShape } from '@/lib/ruleZones';
import type { MapZone } from '@/lib/zones';
import { mergeZones } from '@/lib/zoneShapes';
import { ZONE_EDGE_CLEARANCE, ZONE_STYLES } from './ZoneLegend';
import './map.css';

/** The panes of the zones' fills are made in this order, the strongest rule on top. */
const ZONE_KINDS_BELOW_FIRST: MapZone['kind'][] = ['slow', 'noParking', 'noRide'];
/**
 * The cities' zones are drawn in this order: an area where scooters park only in racks or marked
 * places at the bottom, as the places within it are over it, then parking, the strongest rule on top.
 */
const RULE_KINDS_BELOW_FIRST: RuleKind[] = ['racksOnly', 'parking', 'slow', 'noParking', 'noRide'];
/** How strongly a street a city forbids riding on is drawn outside its hours, of how strongly within them. */
const RULE_ZONE_DIMMED = 0.35;

/** Polygons of [lat, lng] points, each moved by whole turns of the globe to the copy of the world the map frames. */
function polygonsNear(polygons: [number, number][][][], frameLng: number): [number, number][][][] {
  return polygons.map(polygon => {
    const first = polygon[0]?.[0];
    const shift = first ? lngNear(first[1], frameLng) - first[1] : 0;
    return polygon.map(ring => ring.map(([lat, lng]): [number, number] => [lat, lng + shift]));
  });
}

type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string;
type FormatNumber = (value: number, options?: Intl.NumberFormatOptions) => string;

// Every scooter starts from the same icon: 44 px to hold the focus, and inside it
// the light itself, which drawLight() sizes, colours and names.
const SCOOTER_ICON_HTML = '<div class="scooter-marker"><span aria-hidden="true"></span></div>';

function createScooterIcon(): L.DivIcon {
  return L.divIcon({
    className: 'scooter-marker-wrap',
    html: SCOOTER_ICON_HTML,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

/** A scooter as it is drawn: a light in the colour of its app. */
interface Light {
  key: string;
  provider: string;
  distanceM: number | null;
  kind: LightKind;
  diameter: number;
  /** The diameter it has when it is not selected: its place among its neighbours does not change with a tap. */
  slot: number;
  strength: number;
  /** The initials of the app, shown from close up. */
  lettered: boolean;
  /** The name beside it, for the nearest of each app and for the selected one; null for the others. */
  name: { app: string; walk: string | null } | null;
  /** Taken while it was walked to: only where it was is left. */
  gone: boolean;
}

function drawLight(marker: L.Marker, light: Light) {
  const element = marker.getElement();
  const dot = element?.querySelector<HTMLElement>('.scooter-marker');
  if (!element || !dot) return;
  const cfg = PROVIDERS[light.provider] ?? { color: '#999', initial: '?' };
  const color = providerSurfaceColor(light.provider, cfg.color);
  dot.className = [
    'scooter-marker',
    light.kind === 'head' && 'scooter-marker-head',
    light.kind === 'selected' && 'scooter-marker-selected',
    light.lettered && 'scooter-marker-lettered',
    light.gone && 'scooter-marker-gone',
  ].filter(Boolean).join(' ');
  dot.style.setProperty('--marker-color', color);
  dot.style.setProperty('--marker-ink', providerInkColor(light.provider));
  dot.style.setProperty('--d', `${light.diameter}px`);
  dot.style.setProperty('--strength', String(light.strength));
  // Lit from the visitor outwards, the first time scooters are shown.
  dot.style.setProperty('--light-delay', `${Math.round(Math.min(light.distanceM ?? 0, 900) * 1.5)}ms`);
  const letters = dot.firstElementChild;
  if (letters && letters.textContent !== cfg.initial) letters.textContent = cfg.initial;

  let name = element.querySelector<HTMLElement>('.scooter-name');
  if (!light.name) {
    name?.remove();
    return;
  }
  if (!name) {
    // The marker already says all of it to a screen reader.
    name = document.createElement('span');
    name.setAttribute('aria-hidden', 'true');
    for (const part of ['i', 'b', 'span']) name.appendChild(document.createElement(part));
    element.appendChild(name);
  }
  name.className = `scooter-name${light.kind === 'selected' ? ' scooter-name-selected' : ''}${light.gone ? ' scooter-name-gone' : ''}`;
  name.style.setProperty('--marker-color', color);
  name.style.setProperty('--marker-ink', providerInkColor(light.provider));
  const [, app, walk] = name.children;
  if (app.textContent !== light.name.app) app.textContent = light.name.app;
  if (walk.textContent !== (light.name.walk ?? '')) walk.textContent = light.name.walk ?? '';
}

function createParkingIcon(provider: string, selected: boolean): L.DivIcon {
  return L.divIcon({
    className: 'parking-marker-wrap',
    html: `<span class="parking-marker${selected ? ' parking-marker-selected' : ''}" style="--parking-provider:${PROVIDERS[provider]?.color ?? '#2166c2'}">P</span>`,
    // The sign is small; what can be pressed around it is 44 px, as for a scooter.
    iconSize: [44, 44],
    iconAnchor: [12, 32],
  });
}

function createDestinationIcon(): L.DivIcon {
  return L.divIcon({
    className: 'destination-marker-wrap',
    html: `<div class="destination-marker"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 34],
  });
}

// The ground is asked for again after these waits when its address cannot be had.
const GROUND_RETRY_MS = [2_000, 5_000, 15_000, 30_000];
// Names on the ground are drawn in the system's typeface when the app's own takes longer than this.
const GROUND_FONT_WAIT_MS = 1_500;
const DARK_SCHEME = '(prefers-color-scheme: dark)';
// How far from a scooter a tap, or a click, still means that scooter.
const TAP_REACH = 22;
const CLICK_REACH = 14;
// A name keeps this far from the edges of what can be seen of the map.
const NAME_EDGE = 6;
// The lights come on over this long, the first time scooters are shown.
const INTRO_MS = 1_800;
// The dock takes 280 ms to grow to the height of a new card.
const DOCK_SETTLE_MS = 320;
const TIP_GAP = 8;
const TIP_MARGIN = 8;
// A way is framed this far inside what can be seen of the map, clear of the
// markers at its ends and of the name beside the scooter.
const ROUTE_EDGE = 44;
const ROUTE_EDGE_VERTICAL = 28;

/** As walking.ts writes it, with a decimal on every kilometre: "1.0 km", so the label keeps its width. */
function formatDistance(meters: number, formatter: DistanceFormatter): string {
  if (measurementSystem(formatter.region) !== 'metric') return formatWalkingDistance(meters, formatter);
  const { t, formatNumber } = formatter;
  return meters < 1000
    ? t('distance.meters', { count: formatNumber(Math.round(meters)) })
    : t('distance.kilometers', {
        count: formatNumber(meters / 1000, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
      });
}

function createClusterIcon(cluster: ScooterCluster, count: string): L.DivIcon {
  const providerOrder = Object.keys(PROVIDERS);
  const entries = Object.entries(cluster.providers).sort(([a], [b]) => {
    const aIndex = providerOrder.indexOf(a);
    const bIndex = providerOrder.indexOf(b);
    return (aIndex < 0 ? providerOrder.length : aIndex) -
      (bIndex < 0 ? providerOrder.length : bIndex);
  });
  const colorOf = (provider: string) => providerSurfaceColor(provider, '#999');

  // A ring in the colours of the apps, each with the share of the scooters it has here.
  let progress = 0;
  const segments = entries.map(([provider, share]) => {
    const start = progress;
    progress += (share / cluster.count) * 360;
    return `${colorOf(provider)} ${start}deg ${progress}deg`;
  });
  const largest = entries.reduce<[string, number] | null>((best, entry) => (!best || entry[1] > best[1] ? entry : best), null);
  const glow = largest ? colorOf(largest[0]) : '#999';
  const ring = entries.length > 1 ? `conic-gradient(${segments.join(',')})` : glow;

  return L.divIcon({
    className: 'cluster-marker-wrap',
    html: `<div class="cluster-marker" style="--cluster-ring:${ring};--cluster-glow:${glow};--cluster-size:${clusterSize(cluster.count)}px"><span>${count}</span></div>`,
    iconSize: [58, 58],
    iconAnchor: [29, 29],
  });
}

const clusterSize = (count: number) => count < 10 ? 34 : count < 100 ? 40 : count < 1000 ? 46 : count < 10_000 ? 52 : 58;

/** A scooter where it was last seen, while it is collected again: a faded light in the colour of its app. */
function createLastSeenIcon(provider: string): L.DivIcon {
  const color = providerSurfaceColor(provider, PROVIDERS[provider]?.color ?? '#999');
  return L.divIcon({
    className: 'last-seen-wrap',
    html: `<div class="last-seen-light" style="--marker-color:${color}" aria-hidden="true"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

/** A group of them: their number in a dashed ring, in the colour of the app with most of them. */
function createLastSeenClusterIcon(cluster: ScooterCluster, count: string): L.DivIcon {
  const largest = Object.entries(cluster.providers).reduce<[string, number] | null>((best, entry) => (!best || entry[1] > best[1] ? entry : best), null);
  const glow = largest ? providerSurfaceColor(largest[0], '#999') : '#999';
  return L.divIcon({
    className: 'last-seen-wrap',
    html: `<div class="last-seen-cluster" style="--cluster-glow:${glow};--cluster-size:${clusterSize(cluster.count)}px" aria-hidden="true"><span>${count}</span></div>`,
    iconSize: [58, 58],
    iconAnchor: [29, 29],
  });
}

// Where totals touch, as neighbouring countries do zoomed out, the larger is drawn over the smaller.
function clusterZIndex(cluster: ScooterCluster): number {
  return 500 + Math.round(Math.log10(cluster.count + 1) * 1000);
}

function clusterTitle(cluster: ScooterCluster, t: Translate, formatNumber: FormatNumber): string {
  const providers = Object.entries(cluster.providers)
    .map(([provider, count]) => `${PROVIDERS[provider]?.name ?? provider} ${formatNumber(count)}`)
    .join(', ');
  return t('marker.cluster', { count: formatNumber(cluster.count), providers });
}

/** The name of a marker, and the browser's own tooltip unless the map shows one itself. */
function updateMarkerLabel(marker: L.Marker, label: string, tooltip = true) {
  // Leaflet writes this to the icon whenever it draws it.
  marker.options.title = tooltip ? label : '';
  const element = marker.getElement();
  element?.setAttribute('aria-label', label);
  if (tooltip) element?.setAttribute('title', label);
  else element?.removeAttribute('title');
}

function labelMarker(marker: L.Marker, label: string, tooltip = true) {
  const applyLabel = () => updateMarkerLabel(marker, label, tooltip);
  marker.on('add', applyLabel);
  applyLabel();
}

/** Leaflet makes a marker a button that can be reached with Tab, but only a pointer presses it: Enter and Space do too. */
function onMarkerPress(marker: L.Marker, press: () => void): L.Marker {
  return marker.on('click', press).on('keypress', (event) => {
    const { key } = event.originalEvent;
    if (key === 'Enter' || key === ' ') press();
  });
}

/**
 * What of the map can be seen for a way: under the search bar and its notices,
 * above the dock where it spans the screen, beside it where it stands at the
 * side, and on a phone clear of the buttons over the dock.
 */
function routeFrame(map: L.Map, aboveDock: boolean): Frame {
  const area = map.getContainer().getBoundingClientRect();
  const shown = (box: DOMRect | undefined): box is DOMRect => box !== undefined && box.height > 0;
  const above = [
    document.querySelector('.search-island')?.getBoundingClientRect(),
    ...[...document.querySelectorAll('.map-notices .load-banner, .map-notices .location-card')].map(notice => notice.getBoundingClientRect()),
  ].filter(shown);
  const sheet = document.querySelector('.sheet')?.getBoundingClientRect();
  const beside = shown(sheet) && sheet.width < area.width / 2;
  const below = [
    beside ? undefined : sheet,
    aboveDock ? document.querySelector('.fab-stack:not([aria-hidden="true"])')?.getBoundingClientRect() : undefined,
  ].filter(shown);
  return {
    left: beside ? sheet.right - area.left + ROUTE_EDGE_VERTICAL : ROUTE_EDGE,
    top: Math.max(0, ...above.map(box => box.bottom - area.top)) + ROUTE_EDGE_VERTICAL,
    right: area.width - ROUTE_EDGE,
    bottom: Math.min(area.height, ...below.map(box => box.top - area.top)) - ROUTE_EDGE_VERTICAL,
  };
}

function vehicleMarkerKey(vehicle: Vehicle): string {
  return vehicle.vehicle_id
    ? `${vehicle.provider}:${vehicle.vehicle_id}`
    : `${vehicle.provider}:${vehicle.lat}:${vehicle.lng}`;
}

function MapZoomControls({ mapRef }: { mapRef: { current: L.Map | null } }) {
  const { t } = useI18n();
  const controlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!controlRef.current) return;
    L.DomEvent.disableClickPropagation(controlRef.current);
    L.DomEvent.disableScrollPropagation(controlRef.current);
  }, []);

  return (
    <div ref={controlRef} className="map-zoom-controls" role="group" aria-label={t('controls.zoomGroup')}>
      <button
        type="button"
        aria-label={t('controls.zoomIn')}
        title={t('controls.zoomIn')}
        onClick={() => { selectionFeedback(); track('map_zoom', { direction: 'in' }); mapRef.current?.zoomIn(1, { animate: !prefersReducedMotion() }); }}
      >
        <span aria-hidden="true">+</span>
      </button>
      <button
        type="button"
        aria-label={t('controls.zoomOut')}
        title={t('controls.zoomOut')}
        onClick={() => { selectionFeedback(); track('map_zoom', { direction: 'out' }); mapRef.current?.zoomOut(1, { animate: !prefersReducedMotion() }); }}
      >
        <span aria-hidden="true">−</span>
      </button>
    </div>
  );
}

// The same empty lists on every render, so that a map without faded scooters does not draw them again.
const NO_VEHICLES: Vehicle[] = [];
const NO_CLUSTERS: ScooterCluster[] = [];
const NO_RULE_ZONES: RuleZoneShape[] = [];

interface MapComponentProps {
  parking?: ParkingLocation[];
  /** The operators' zones, drawn under everything else when turned on. */
  zones?: MapZone[];
  /** Streets a city forbids riding on, drawn as no riding's zones are, whether or not those are on. */
  ruleZones?: RuleZoneShape[];
  vehicles: Vehicle[];
  clusters: CityGroup[];
  clustered: boolean;
  /** Where scooters still being collected again were last seen: drawn faded under the others, and never pressed. */
  lastSeenVehicles?: Vehicle[];
  lastSeenClusters?: ScooterCluster[];
  origin: [number, number];
  initialZoom: number;
  distanceOrigin: [number, number] | null;
  userLocation: [number, number] | null;
  headingEnabled: boolean;
  focusLocation: [number, number] | null;
  /** The zoom to arrive at; null keeps the current zoom, or street level when further out. */
  focusZoom: number | null;
  focusVersion: number;
  destination: AddressResult | null;
  onViewportChange: (bounds: MapViewport, zoom: number) => void;
  selectedVehicleKey: string | null;
  onVehicleSelect: (vehicle: Vehicle) => void;
  selectedParkingId: string | null;
  onParkingSelect: (location: ParkingLocation) => void;
  /** A click or a tap on the map itself, not on a marker and not at the end of a drag. */
  onMapClick?: () => void;
  /** Phone: what was picked stays in view when the dock grows over it with a card. */
  revealAboveDock?: boolean;
  /** The walk to the selected scooter or bay: its way is drawn, and the scooter is named with what is left of it. */
  walk?: WalkView | null;
  /** Desktop: a scooter under the pointer says what it is, in place of the browser's tooltip. */
  hoverTips?: boolean;
  /** Desktop: the card of the selected scooter or parking bay, shown beside its marker. */
  popover?: MapPopover | null;
  /** A step in or out asked for from the keyboard; each new version is one step. */
  zoomStep?: { direction: 1 | -1; version: number };
  /** Receives the way to find a marker while the map is there, for the card in the dock. */
  markerLookupRef?: RefObject<MarkerLookup | null>;
  /** The appearance of the app, which the ground follows; Automatic is the system's. */
  theme?: ThemeName;
  /** Calm names streets and quarters; detailed adds places and house numbers. */
  mapStyle?: MapStyleName;
}

function subscribeToScheme(onChange: () => void) {
  const query = window.matchMedia(DARK_SCHEME);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** The typeface of the app, for the names on the ground, once it is there. */
function groundFont(container: HTMLElement): { family: string; ready: Promise<unknown> } {
  const own = getComputedStyle(container).getPropertyValue('--font-text').trim();
  const family = `${own ? `${own}, ` : ''}system-ui, sans-serif`;
  const loaded = own && document.fonts
    ? Promise.all([500, 700].map(weight => document.fonts.load(`${weight} 12px ${own}`)))
    : Promise.resolve();
  return {
    family,
    ready: Promise.race([loaded, new Promise(resolve => window.setTimeout(resolve, GROUND_FONT_WAIT_MS))]).catch(() => undefined),
  };
}

/** The marker of a scooter, by its key, or of a parking bay, by its id, as it is drawn on the map; null when it is not. */
export type MarkerLookup = (vehicleKey: string | null, parkingId: string | null) => HTMLElement | null;

export interface MapPopover {
  /** Names the card for screen readers: "Lime scooter", "Dott parking bay". */
  label: string;
  content: ReactNode;
}

export default function MapComponent({
  parking = [],
  zones = [],
  ruleZones = NO_RULE_ZONES,
  vehicles,
  clusters,
  clustered,
  lastSeenVehicles = NO_VEHICLES,
  lastSeenClusters = NO_CLUSTERS,
  origin,
  initialZoom,
  distanceOrigin,
  userLocation,
  headingEnabled,
  focusLocation,
  focusZoom,
  focusVersion,
  destination,
  onViewportChange,
  selectedVehicleKey,
  onVehicleSelect,
  selectedParkingId,
  onParkingSelect,
  onMapClick,
  revealAboveDock = false,
  walk = null,
  hoverTips = false,
  popover = null,
  zoomStep,
  markerLookupRef,
  theme = 'auto',
  mapStyle = 'calm',
}: MapComponentProps) {
  const { t, formatNumber, locale, region, nameLanguage } = useI18n();
  const systemDark = useSyncExternalStore(subscribeToScheme, () => window.matchMedia(DARK_SCHEME).matches, () => false);
  const ground: GroundTheme = theme === 'dark' || (theme === 'auto' && systemDark) ? 'night' : 'day';
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const scooterLayerRef = useRef<L.LayerGroup | null>(null);
  const destinationLayerRef = useRef<L.LayerGroup | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  // The pin of a searched place is kept clear of the dock from the moment the
  // place is chosen until the visitor drags the map: from then on it stays put.
  const revealPlaceRef = useRef(false);
  // True from the start of a move of the map, by hand or by itself, to its end.
  const movingRef = useRef(false);
  const vehicleMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const clusterMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  // What each total stands for now: a group gains and loses cities as the map zooms.
  const clusterDataRef = useRef<Map<string, CityGroup>>(new Map());
  const parkingMarkersRef = useRef<Map<string, { marker: L.Marker; signature: string }>>(new Map());
  const lastSeenMarkersRef = useRef<Map<string, { marker: L.Marker; signature: string }>>(new Map());
  const markerSignaturesRef = useRef<Map<string, string>>(new Map());
  const vehicleDataRef = useRef<Map<string, Vehicle>>(new Map());
  const parkingDataRef = useRef<Map<string, ParkingLocation>>(new Map());
  const groundLayerRef = useRef<GroundLayer | null>(null);
  const groundLookRef = useRef({ ground, mapStyle, nameLanguage });
  // The scooters as they are drawn now, and how far each was moved off its neighbours.
  const lightsRef = useRef<Map<string, Light>>(new Map());
  const lightOffsetsRef = useRef<Map<string, Offset>>(new Map());
  const layoutLightsRef = useRef<(() => void) | null>(null);
  const introducedRef = useRef(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const initialOriginRef = useRef(origin);
  const onViewportChangeRef = useRef(onViewportChange);
  const onVehicleSelectRef = useRef(onVehicleSelect);
  const onParkingSelectRef = useRef(onParkingSelect);
  const onMapClickRef = useRef(onMapClick);
  const revealAboveDockRef = useRef(revealAboveDock);
  const routeLayerRef = useRef<RouteLayer | null>(null);
  const [readyMap, setReadyMap] = useState<L.Map | null>(null);
  const [zoom, setZoom] = useState(initialZoom);
  // The longitude of the map's centre: what is on the map is drawn in the copy
  // of the world nearest it, the one on screen, also where the view crosses 180°.
  const [frameLng, setFrameLng] = useState(() => origin[1]);
  const walkPoints = walk?.line ?? null;
  // The way, all of it in the same copy as its start.
  const walkShift = walkPoints?.length ? lngNear(walkPoints[0][1], frameLng) - walkPoints[0][1] : 0;
  const walkLine = useMemo(
    () => walkShift === 0 ? walkPoints : walkPoints?.map(([lat, lng]): [number, number] => [lat, lng + walkShift]) ?? null,
    [walkPoints, walkShift]
  );
  const drawnUserLat = userLocation?.[0] ?? null;
  const drawnUserLng = userLocation ? lngNear(userLocation[1], frameLng) : null;
  const drawnUserLocation = useMemo<[number, number] | null>(
    () => drawnUserLat !== null && drawnUserLng !== null ? [drawnUserLat, drawnUserLng] : null,
    [drawnUserLat, drawnUserLng]
  );
  const destinationLng = destination ? lngNear(destination.lng, frameLng) : null;
  const walkRouteId = walk?.routeId ?? null;
  // Along the way once it is shown: the name of the selected scooter says what is left of it.
  const routeRemainingM = walk?.phase === 'shown' ? walk.remainingM : null;
  const walkedGone = walk?.phase === 'gone';

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    onVehicleSelectRef.current = onVehicleSelect;
  }, [onVehicleSelect]);

  useEffect(() => {
    onParkingSelectRef.current = onParkingSelect;
  }, [onParkingSelect]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    revealAboveDockRef.current = revealAboveDock;
  }, [revealAboveDock]);

  const scooterIcon = useMemo(() => createScooterIcon(), []);
  const hasPopover = popover !== null;

  /** The scooters where they are drawn on the screen now. */
  const drawnLights = useCallback((): DrawnLight[] => {
    const map = mapRef.current;
    if (!map) return [];
    const drawn: DrawnLight[] = [];
    for (const [key, light] of lightsRef.current) {
      const marker = vehicleMarkersRef.current.get(key);
      if (!marker) continue;
      const point = map.latLngToContainerPoint(marker.getLatLng());
      const offset = lightOffsetsRef.current.get(key);
      drawn.push({ key, x: point.x + (offset?.dx ?? 0), y: point.y + (offset?.dy ?? 0), diameter: light.diameter });
    }
    return drawn;
  }, []);

  /** The scooter a press at this point of the map means, if any. */
  const lightUnder = useCallback((point: L.Point, reach: number): Vehicle | null => {
    const key = lightAt(drawnLights(), point.x, point.y, reach);
    return (key && vehicleDataRef.current.get(key)) || null;
  }, [drawnLights]);
  const destinationIcon = useMemo(() => createDestinationIcon(), []);

  const reportViewport = useCallback((map: L.Map) => {
    // Panned past 180°, or into a copy of the world beside this one, the map
    // stays where it is: what is on it is drawn in the copy nearest its centre.
    setFrameLng(map.getCenter().lng);
    // Turned, the map's bounds enclose the screen, and more. Past ±180° they are
    // brought back between -180° and 180°: a view across the line is then a box
    // whose west is greater than its east (geo.ts), as the server is asked for it.
    const bounds = map.getBounds();
    const size = map.getSize();
    const corners = map.getBearing() % 360 === 0
      ? undefined
      : [L.point(0, 0), L.point(size.x, 0), size, L.point(0, size.y)].map(corner => {
          const { lat, lng } = map.containerPointToLatLng(corner);
          return [lat, lng] as const;
        });
    const next = {
      ...viewBounds(bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()),
      corners,
    };
    if (next.south < next.north && lngSpan(next) > 0) {
      onViewportChangeRef.current(next, map.getZoom());
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const vehicleMarkers = vehicleMarkersRef.current;
    const clusterMarkers = clusterMarkersRef.current;
    const clusterData = clusterDataRef.current;
    const parkingMarkers = parkingMarkersRef.current;
    const lastSeenMarkers = lastSeenMarkersRef.current;
    const markerSignatures = markerSignaturesRef.current;
    const lights = lightsRef.current;

    const map = L.map(container, {
      center: initialOriginRef.current,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
      rotate: true,
      touchRotate: true,
      shiftKeyRotate: true,
      dragRotate: true,
      rotateControl: false,
      preferCanvas: true,
      zoomAnimation: !prefersReducedMotion(),
      fadeAnimation: !prefersReducedMotion(),
      markerZoomAnimation: !prefersReducedMotion(),
    });
    mapRef.current = map;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => syncRotationMotion(map);
    syncMotion();
    motionQuery.addEventListener('change', syncMotion);
    scooterLayerRef.current = L.layerGroup().addTo(map);
    destinationLayerRef.current = L.layerGroup().addTo(map);

    const updateZoom = () => {
      const currentZoom = map.getZoom();
      container.dataset.zoom = String(currentZoom);
      setZoom(currentZoom);
    };
    const updateViewport = () => reportViewport(map);
    map.on('dragstart', () => { revealPlaceRef.current = false; });
    map.on('movestart', () => { movingRef.current = true; });
    map.on('moveend', () => { movingRef.current = false; });
    // Markers keep their clicks to themselves, so this is the map and nothing on it.
    // A light is small: a tap that lands beside one still means it.
    map.on('click', event => {
      const reach = window.matchMedia('(pointer: coarse)').matches ? TAP_REACH : CLICK_REACH;
      const vehicle = lightUnder(event.containerPoint, reach);
      if (vehicle) onVehicleSelectRef.current(vehicle);
      else onMapClickRef.current?.();
    });
    const layoutLights = () => layoutLightsRef.current?.();
    // Turning the map moves the scooters around each other, and their names with
    // them; moving it brings a name to the edge of the screen, or away from it.
    map.on('rotateend moveend', layoutLights);
    // Names are measured as they are written: once more when the app's typeface has come.
    void document.fonts?.ready.then(() => { if (mapRef.current === map) layoutLights(); });
    map.on('zoomend', updateZoom);
    map.on('moveend', updateViewport);
    map.on('rotateend', updateViewport);
    updateZoom();
    map.whenReady(updateViewport);
    setReadyMap(map);

    return () => {
      setReadyMap(null);
      map.off('zoomend', updateZoom);
      map.off('moveend', updateViewport);
      map.off('rotateend', updateViewport);
      map.off('rotateend moveend', layoutLights);
      motionQuery.removeEventListener('change', syncMotion);
      stopMapRotation(map);
      map.remove();
      mapRef.current = null;
      scooterLayerRef.current = null;
      destinationLayerRef.current = null;
      vehicleMarkers.clear();
      clusterMarkers.clear();
      clusterData.clear();
      parkingMarkers.clear();
      lastSeenMarkers.clear();
      markerSignatures.clear();
      vehicleDataRef.current.clear();
      parkingDataRef.current.clear();
      lights.clear();
      lightOffsetsRef.current = new Map();
      layoutLightsRef.current = null;
      delete container.dataset.zoom;
      delete container.dataset.intro;
    };
  }, [initialZoom, lightUnder, reportViewport]);

  // Parking bays open in the dock, as scooters do: a tap selects, the page shows the card.
  useEffect(() => {
    const map = mapRef.current;
    if (!readyMap || !map) return;
    const markers = parkingMarkersRef.current;
    parkingDataRef.current = new Map(parking.map(location => [location.id, location]));
    for (const [id, entry] of markers) {
      if (!parkingDataRef.current.has(id)) { entry.marker.remove(); markers.delete(id); }
    }
    for (const location of parking) {
      const { id } = location;
      const label = t('parking.label', { name: PROVIDERS[location.provider]?.name ?? location.provider, place: location.name });
      const selected = id === selectedParkingId;
      const at: [number, number] = [location.lat, lngNear(location.lng, frameLng)];
      const signature = JSON.stringify([location, at, label, selected]);
      const existing = markers.get(id);
      if (existing?.signature === signature) continue;
      const icon = createParkingIcon(location.provider, selected);
      if (existing) {
        // Changed in place, so that a bay selected from the keyboard keeps the focus.
        if (!existing.marker.getLatLng().equals(at)) existing.marker.setLatLng(at);
        existing.marker.setIcon(icon);
        updateMarkerLabel(existing.marker, label);
        existing.signature = signature;
        continue;
      }
      const marker = onMarkerPress(
        L.marker(at, { icon, title: label, zIndexOffset: 100 }),
        () => {
          const current = parkingDataRef.current.get(id);
          if (current) onParkingSelectRef.current(current);
        }
      ).addTo(map);
      labelMarker(marker, label);
      markers.set(id, { marker, signature });
    }
  }, [frameLng, readyMap, parking, selectedParkingId, t]);

  // Where scooters still being collected again were last seen: faded, under the others, until the
  // collection reaches them and the server sends them as the others. A press goes through them.
  useEffect(() => {
    const map = mapRef.current;
    if (!readyMap || !map) return;
    const markers = lastSeenMarkersRef.current;
    const wanted = new Map<string, { at: [number, number]; signature: string; icon: () => L.DivIcon }>();
    for (const vehicle of lastSeenVehicles) {
      wanted.set(`v:${vehicleMarkerKey(vehicle)}`, {
        at: [vehicle.lat, lngNear(vehicle.lng, frameLng)], signature: vehicle.provider, icon: () => createLastSeenIcon(vehicle.provider),
      });
    }
    for (const cluster of clustered ? lastSeenClusters : []) {
      const count = formatNumber(cluster.count);
      wanted.set(`c:${cluster.id}`, {
        at: [cluster.lat, lngNear(cluster.lng, frameLng)], signature: JSON.stringify([cluster.providers, count]),
        icon: () => createLastSeenClusterIcon(cluster, count),
      });
    }
    for (const [key, entry] of markers) {
      if (!wanted.has(key)) { entry.marker.remove(); markers.delete(key); }
    }
    for (const [key, { at, signature, icon }] of wanted) {
      const existing = markers.get(key);
      if (existing) {
        if (!existing.marker.getLatLng().equals(at)) existing.marker.setLatLng(at);
        if (existing.signature !== signature) { existing.marker.setIcon(icon()); existing.signature = signature; }
        continue;
      }
      // Under every other marker, whatever its latitude.
      const marker = L.marker(at, { icon: icon(), interactive: false, keyboard: false, zIndexOffset: -100_000 }).addTo(map);
      markers.set(key, { marker, signature });
    }
  }, [clustered, formatNumber, frameLng, lastSeenClusters, lastSeenVehicles, readyMap]);

  // The zones are drawn under the rest of what is drawn on the ground, in panes inside the
  // one that turns with the map: each kind's fills in a pane of its own that is translucent
  // as a whole, so that zones over each other are no darker, then all their edges. Each
  // kind is one shape, the operators' zones merged, within one edge. SVG, as the walk's
  // way: leaflet-rotate's renderer patch reads a map Leaflet's canvas does not hand it.
  const zoneShapes = useMemo(() => mergeZones(zones), [zones]);
  useEffect(() => {
    const map = mapRef.current;
    if (!readyMap || !map || !zoneShapes.length) return;
    const pane = (name: string, opacity = 1) => {
      const element = map.getPane(name) ?? map.createPane(name, map.getPane('overlayPane'));
      element.style.zIndex = '-1';
      element.style.opacity = String(opacity);
      return L.svg({ pane: name, padding: 0.5 });
    };
    const fills = Object.fromEntries(ZONE_KINDS_BELOW_FIRST.map(kind =>
      [kind, pane(`zones-${kind}`, ZONE_STYLES[kind].fillOpacity)])) as Record<MapZone['kind'], L.Renderer>;
    const edges = pane('zones-edges');
    const layer = L.layerGroup();
    const drawn = new Map<MapZone['kind'], { shape: [number, number][][][]; edge: L.Polygon }>();
    for (const { kind, polygons } of zoneShapes) {
      const shape = polygonsNear(polygons, frameLng);
      L.polygon(shape, { renderer: fills[kind], className: `zone-fill-${kind}`, interactive: false, stroke: false, fillOpacity: 1 }).addTo(layer);
      const edge = L.polygon(shape, { ...ZONE_STYLES[kind].edge, renderer: edges, className: `zone-edge-${kind}`, interactive: false, fill: false }).addTo(layer);
      drawn.set(kind, { shape, edge });
    }
    layer.addTo(map);
    // Where riding is forbidden, nothing more needs saying: no parking's and slow zones'
    // edges give way within no riding's zones and along their edge, which other operators'
    // zones of the same street often follow to the metre. A mask in the edges' own SVG,
    // whose no riding Leaflet keeps in step with the map as it does every path.
    const noRide = drawn.get('noRide');
    const giving = [drawn.get('noParking'), drawn.get('slow')].flatMap(kind => kind?.edge.getElement() ?? []);
    const svg = (noRide?.edge.getElement() as SVGPathElement | undefined)?.ownerSVGElement;
    if (noRide && svg && giving.length) {
      const clearance = L.polygon(noRide.shape, {
        renderer: edges, interactive: false, color: '#000', opacity: 1, weight: 2 * ZONE_EDGE_CLEARANCE, lineJoin: 'round',
        fillColor: '#000', fillOpacity: 1,
      }).addTo(layer);
      const svgElement = (name: string, attributes: Record<string, string>) => {
        const element = document.createElementNS('http://www.w3.org/2000/svg', name);
        for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
        return element;
      };
      const everywhere = { x: '-1000000', y: '-1000000', width: '2000000', height: '2000000' };
      const mask = svgElement('mask', { id: 'zone-edges-clear-of-no-riding', maskUnits: 'userSpaceOnUse', ...everywhere });
      mask.appendChild(svgElement('rect', { ...everywhere, fill: '#fff' }));
      mask.appendChild(clearance.getElement()!);
      svg.insertBefore(svgElement('defs', {}), svg.firstChild).appendChild(mask);
      for (const edge of giving) edge.setAttribute('mask', 'url(#zone-edges-clear-of-no-riding)');
    }
    return () => { layer.remove(); for (const renderer of [...Object.values(fills), edges]) renderer.remove(); };
  }, [frameLng, readyMap, zoneShapes]);

  // The zones a city sets and the streets it forbids riding on, each kind as the operators'
  // are, in a pane of their own; outside their hours, dimmer. All of a kind that hold now, or
  // all that don't, are one fill and one edge, so that a few hundred zones are a few paths
  // and those over each other are no darker. The fill goes by winding: rings that turn the
  // same way (ruleZones.ts) fill where they overlap, a band's or an area's holes stay open.
  // None of them takes a tap or a click from the scooters, whose pane is over this one.
  useEffect(() => {
    const map = mapRef.current;
    if (!readyMap || !map || !ruleZones.length) return;
    const element = map.getPane('rule-zones') ?? map.createPane('rule-zones', map.getPane('overlayPane'));
    element.style.zIndex = '-1';
    const renderer = L.svg({ pane: 'rule-zones', padding: 0.5 });
    const layer = L.layerGroup();
    for (const kind of RULE_KINDS_BELOW_FIRST) {
      for (const inForce of [false, true]) {
        const shape = ruleZones.filter(zone => zone.rule === kind && zone.inForce === inForce)
          .flatMap(zone => polygonsNear(zone.polygons, frameLng));
        if (!shape.length) continue;
        const { fillOpacity, edge } = ZONE_STYLES[kind];
        const strength = inForce ? 1 : RULE_ZONE_DIMMED;
        L.polygon(shape, { renderer, className: `zone-fill-${kind}`, interactive: false, stroke: false,
          fillRule: 'nonzero', fillOpacity: fillOpacity * strength }).addTo(layer);
        L.polygon(shape, { ...edge, opacity: (edge.opacity ?? 1) * strength, renderer, className: `zone-edge-${kind}`,
          interactive: false, fill: false }).addTo(layer);
      }
    }
    // The pavements a scooter may ride on are lines along the kerb, over the fills: all of
    // them one line of a few pixels, and no band round them, which would cover the street.
    // Each zone's lines are moved to the map's copy of the world as a polygon's rings are.
    for (const inForce of [false, true]) {
      const lines = ruleZones.filter(zone => zone.rule === 'pavement' && zone.inForce === inForce)
        .flatMap(zone => polygonsNear([zone.lines ?? []], frameLng)[0]);
      if (!lines.length) continue;
      const { edge } = ZONE_STYLES.pavement;
      L.polyline(lines, { ...edge, opacity: (edge.opacity ?? 1) * (inForce ? 1 : RULE_ZONE_DIMMED), renderer,
        className: 'zone-edge-pavement', interactive: false }).addTo(layer);
    }
    layer.addTo(map);
    return () => { layer.remove(); renderer.remove(); };
  }, [frameLng, readyMap, ruleZones]);

  // The ground: one layer, drawn here from vector tiles in the colours of the
  // appearance. Its address is asked for first; until it is known, and whenever
  // it cannot be had, the map is the plain colour of the land.
  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!readyMap || !map || !container) return;
    let stopped = false;
    let timer = 0;
    let attempt = 0;
    let layer: GroundLayer | null = null;
    const font = groundFont(container);
    const start = () => {
      groundTileUrl().then(url => {
        if (stopped) return;
        const look = groundLookRef.current;
        layer = createGroundLayer(url, groundRules(look.ground, look.mapStyle, font.family, look.nameLanguage), {
          attribution: '',
          className: 'map-basemap',
          maxZoom: 22,
          updateWhenZooming: false,
          keepBuffer: 2,
          tasks: [font.ready],
          // The language of the page, for the names on the canvas.
          lang: document.documentElement.lang || 'en',
        });
        layer.addTo(map);
        groundLayerRef.current = layer;
      }).catch(() => {
        if (stopped) return;
        timer = window.setTimeout(start, GROUND_RETRY_MS[Math.min(attempt, GROUND_RETRY_MS.length - 1)]);
        attempt += 1;
      });
    };
    start();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      layer?.remove();
      if (groundLayerRef.current === layer) groundLayerRef.current = null;
    };
  }, [readyMap]);

  // Another appearance, map style or language of names draws the same tiles again; none is loaded for it.
  useEffect(() => {
    const container = containerRef.current;
    if (!readyMap || !container) return;
    container.dataset.ground = ground;
    const previous = groundLookRef.current;
    groundLookRef.current = { ground, mapStyle, nameLanguage };
    const layer = groundLayerRef.current;
    if (!layer || (previous.ground === ground && previous.mapStyle === mapStyle && previous.nameLanguage === nameLanguage)) return;
    restyleGroundLayer(layer, groundRules(ground, mapStyle, groundFont(container).family, nameLanguage));
  }, [ground, mapStyle, nameLanguage, readyMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!readyMap || !map || !focusLocation || focusVersion === 0) return;
    map.stop();
    // To the copy of the place nearest the map's centre, not round the world.
    const target: [number, number] = [focusLocation[0], lngNear(focusLocation[1], map.getCenter().lng)];
    map.flyTo(target, focusZoom ?? Math.max(map.getZoom(), 16), {
      animate: !prefersReducedMotion(),
      duration: 0.5,
      easeLinearity: 0.25,
    });
  }, [focusLocation, focusVersion, focusZoom, readyMap]);

  // Each choice of a place, the same one again included, is a new flight to it.
  useEffect(() => {
    revealPlaceRef.current = destination !== null;
  }, [destination, focusVersion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!readyMap || !map || !zoomStep || zoomStep.version === 0) return;
    const options = { animate: !prefersReducedMotion() };
    if (zoomStep.direction > 0) map.zoomIn(1, options);
    else map.zoomOut(1, options);
  }, [readyMap, zoomStep]);

  useEffect(() => {
    const layer = destinationLayerRef.current;
    if (!readyMap || !layer) return;
    layer.clearLayers();
    destinationMarkerRef.current = null;

    if (destination && destinationLng !== null) {
      // A picture of where the place is: there is nothing to press, so it is
      // neither a button nor a stop for the Tab key.
      const marker = L.marker([destination.lat, destinationLng], {
        icon: destinationIcon,
        zIndexOffset: 1800,
        interactive: false,
        keyboard: false,
      }).addTo(layer);
      const element = marker.getElement();
      element?.setAttribute('role', 'img');
      element?.setAttribute('aria-label', t('marker.searchedAddress', { name: destination.display_name }));
      destinationMarkerRef.current = marker;
    }
  }, [destination, destinationIcon, destinationLng, readyMap, t]);

  // The way to walk, over the ground and under the markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!readyMap || !map) return;
    const layer = createRouteLayer(map, () => routeFrame(map, revealAboveDockRef.current));
    routeLayerRef.current = layer;
    return () => {
      layer.remove();
      routeLayerRef.current = null;
    };
  }, [readyMap]);

  useEffect(() => {
    const layer = routeLayerRef.current;
    if (!readyMap || !layer) return;
    if (walkLine && walkRouteId !== null) layer.show(walkLine, walkRouteId);
    else layer.hide();
  }, [readyMap, walkLine, walkRouteId]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = scooterLayerRef.current;
    const container = containerRef.current;
    if (!readyMap || !map || !layer || !container) return;

    const closeUp = zoom >= CLOSE_UP_ZOOM;
    const placed = vehicles.map(vehicle => ({
      key: vehicleMarkerKey(vehicle),
      provider: vehicle.provider,
      vehicle,
      distanceM: distanceOrigin
        ? haversineM(distanceOrigin[0], distanceOrigin[1], vehicle.lat, vehicle.lng)
        : null,
    }));
    // The nearest scooter of each app carries the name of the app: that is how the colours are learnt.
    // Further out, where most scooters are counted in groups, the few shown alone are not the nearest.
    const heads = clustered ? new Set<string>() : nearestOfEachProvider(placed);
    const labelFor = (vehicle: Vehicle, distanceM: number | null) => {
      const cfg = PROVIDERS[vehicle.provider];
      const name = cfg?.name ?? vehicle.provider;
      return distanceM === null
        ? t('marker.scooter', { name })
        : t('marker.scooterAway', {
            name,
            distance: formatDistance(distanceM, { t, formatNumber, locale, region }),
          });
    };

    vehicleDataRef.current = new Map(placed.map(({ key, vehicle }) => [key, vehicle]));
    for (const [key, marker] of vehicleMarkersRef.current) {
      if (vehicleDataRef.current.has(key)) continue;
      layer.removeLayer(marker);
      vehicleMarkersRef.current.delete(key);
      markerSignaturesRef.current.delete(`v:${key}`);
      lightsRef.current.delete(key);
    }
    for (const { key, vehicle, distanceM } of placed) {
      const selected = key === selectedVehicleKey;
      const gone = selected && walkedGone;
      const head = heads.has(key);
      const kind: LightKind = selected ? 'selected' : head ? 'head' : 'dot';
      // Beside a card that stands next to its marker, the name would say it twice.
      const named = selected ? !hasPopover : head;
      const light: Light = {
        key,
        provider: vehicle.provider,
        distanceM,
        kind,
        diameter: lightDiameter(distanceM, kind, closeUp),
        slot: lightDiameter(distanceM, head ? 'head' : 'dot', closeUp),
        strength: lightStrength(distanceM, kind),
        lettered: closeUp,
        name: named
          ? {
              // "PubliBike / Velospot" is the one name too long for the map.
              app: (PROVIDERS[vehicle.provider]?.name ?? vehicle.provider).split(' / ')[0],
              walk: gone ? null : selected && routeRemainingM !== null
                ? t('card.duration', { minutes: formatNumber(walkingMinutes(routeRemainingM)) })
                : distanceM === null ? null : t('card.duration', { minutes: formatNumber(walkingMinutes(distanceM)) }),
            }
          : null,
        gone,
      };
      lightsRef.current.set(key, light);
      const label = labelFor(vehicle, distanceM);
      const at: [number, number] = [vehicle.lat, lngNear(vehicle.lng, frameLng)];
      const signature = JSON.stringify([vehicle, at, light, label, hoverTips]);
      if (markerSignaturesRef.current.get(`v:${key}`) === signature) continue;
      markerSignaturesRef.current.set(`v:${key}`, signature);
      const zIndexOffset = selected ? 1500 : head ? 1000 : 0;
      const existing = vehicleMarkersRef.current.get(key);
      if (existing) {
        if (!existing.getLatLng().equals(at)) existing.setLatLng(at);
        if (existing.options.zIndexOffset !== zIndexOffset) existing.setZIndexOffset(zIndexOffset);
        updateMarkerLabel(existing, label, !hoverTips);
        drawLight(existing, light);
      } else {
        const marker = L.marker(at, {
          icon: scooterIcon, riseOnHover: true, zIndexOffset, title: hoverTips ? '' : label,
        });
        const select = (pressed: Vehicle | null | undefined) => {
          if (pressed) onVehicleSelectRef.current(pressed);
        };
        marker
          // Where lights touch, the press means the one drawn nearest to it, whichever is on top.
          .on('click', event => select(
            lightUnder(map.mouseEventToContainerPoint(event.originalEvent), TAP_REACH) ?? vehicleDataRef.current.get(key)
          ))
          .on('keypress', event => {
            const { key: pressed } = event.originalEvent;
            if (pressed === 'Enter' || pressed === ' ') select(vehicleDataRef.current.get(key));
          })
          // Leaflet makes the icon anew whenever the marker is put on the map.
          .on('add', () => {
            const current = lightsRef.current.get(key);
            if (current) drawLight(marker, current);
          })
          .addTo(layer);
        labelMarker(marker, label, !hoverTips);
        vehicleMarkersRef.current.set(key, marker);
      }
    }

    // Once, when the first scooters are shown around the visitor.
    if (!introducedRef.current && distanceOrigin && placed.length > 0) {
      introducedRef.current = true;
      if (!prefersReducedMotion()) {
        container.dataset.intro = 'true';
        window.setTimeout(() => { delete container.dataset.intro; }, INTRO_MS);
      }
    }

    const visibleClusters = clustered ? clusters : [];
    const incomingClusters = new Set(visibleClusters.map(cluster => cluster.id));
    for (const [id, marker] of clusterMarkersRef.current) {
      if (incomingClusters.has(id)) continue;
      layer.removeLayer(marker);
      clusterMarkersRef.current.delete(id);
      clusterDataRef.current.delete(id);
      markerSignaturesRef.current.delete(`c:${id}`);
    }
    for (const cluster of visibleClusters) {
      const center: [number, number] = [cluster.lat, lngNear(cluster.lng, frameLng)];
      const label = `${cluster.city ? `${isolated(cluster.city)}: ` : ''}${clusterTitle(cluster, t, formatNumber)}`;
      clusterDataRef.current.set(cluster.id, cluster);
      const signature = JSON.stringify([cluster, center, label]);
      if (markerSignaturesRef.current.get(`c:${cluster.id}`) === signature) continue;
      markerSignaturesRef.current.set(`c:${cluster.id}`, signature);
      const existing = clusterMarkersRef.current.get(cluster.id);
      if (existing) {
        if (!existing.getLatLng().equals(center)) existing.setLatLng(center);
        existing.setIcon(createClusterIcon(cluster, formatNumber(cluster.count)));
        existing.setZIndexOffset(clusterZIndex(cluster));
        updateMarkerLabel(existing, label);
      } else {
        const marker = onMarkerPress(
          L.marker(center, { icon: createClusterIcon(cluster, formatNumber(cluster.count)), zIndexOffset: clusterZIndex(cluster), title: label }),
          () => {
            selectionFeedback();
            track('cluster_select');
            const animate = !prefersReducedMotion();
            // A group opens onto its cities, each a total of its own again.
            const bounds = clusterDataRef.current.get(cluster.id)?.bounds;
            if (bounds) {
              // In the copy of the world on screen.
              const west = lngNear(bounds.west, map.getCenter().lng);
              map.flyToBounds(L.latLngBounds([bounds.south, west], [bounds.north, west + lngSpan(bounds)]), {
                animate, duration: 0.55, padding: [80, 80], maxZoom: 13,
              });
              return;
            }
            map.flyTo(marker.getLatLng(), cluster.city ? 13 : Math.min(map.getZoom() + 2, 20), { animate, duration: 0.55 });
          }
        ).addTo(layer);
        labelMarker(marker, label);
        clusterMarkersRef.current.set(cluster.id, marker);
      }
    }

    // Scooters on one spot are moved apart, then the names are set where they hide the least.
    const layout = () => {
      const spots: DrawnLight[] = [];
      for (const [key, light] of lightsRef.current) {
        const marker = vehicleMarkersRef.current.get(key);
        if (!marker) continue;
        const point = map.latLngToContainerPoint(marker.getLatLng());
        spots.push({ key, x: point.x, y: point.y, diameter: light.slot });
      }
      const offsets = new Map<string, Offset>();
      for (const [key, offset] of fanOut(spots)) offsets.set(key, { dx: Math.round(offset.dx), dy: Math.round(offset.dy) });
      lightOffsetsRef.current = offsets;

      const names: (NameToPlace & { element: HTMLElement; order: number })[] = [];
      const obstacles: Obstacle[] = [];
      for (const spot of spots) {
        const light = lightsRef.current.get(spot.key);
        const element = vehicleMarkersRef.current.get(spot.key)?.getElement();
        if (!light || !element) continue;
        const offset = offsets.get(spot.key);
        const moved = offset ? `${offset.dx}px ${offset.dy}px` : '';
        if (element.style.translate !== moved) element.style.translate = moved;
        const x = spot.x + (offset?.dx ?? 0);
        const y = spot.y + (offset?.dy ?? 0);
        const name = light.name ? element.querySelector<HTMLElement>('.scooter-name') : null;
        if (name) {
          names.push({
            key: spot.key, x, y, radius: light.diameter / 2, width: name.offsetWidth, element: name,
            // The selected scooter first, then the nearest.
            order: light.kind === 'selected' ? -1 : light.distanceM ?? 0,
          });
        } else {
          obstacles.push({ x, y, half: light.diameter / 2, weight: 1 });
        }
      }
      if (drawnUserLocation) {
        const point = map.latLngToContainerPoint(drawnUserLocation);
        obstacles.push({ x: point.x, y: point.y, half: 15, weight: NAME_WEIGHT });
      }
      if (destination && destinationLng !== null) {
        // The pin stands on its point.
        const point = map.latLngToContainerPoint([destination.lat, destinationLng]);
        obstacles.push({ x: point.x, y: point.y - 15, half: 19, weight: NAME_WEIGHT });
      }
      const area = container.getBoundingClientRect();
      // The credits and the locate button lie on the map.
      for (const selector of ['.map-attribution', '.fab-stack:not([aria-hidden="true"])']) {
        const box = document.querySelector(selector)?.getBoundingClientRect();
        if (!box || box.height === 0) continue;
        obstacles.push({
          x: (box.left + box.right) / 2 - area.left,
          y: (box.top + box.bottom) / 2 - area.top,
          half: box.width / 2,
          halfHeight: box.height / 2,
          weight: NAME_WEIGHT,
        });
      }
      names.sort((a, b) => a.order - b.order);
      // What of the map can be seen: under the search bar, and on a phone above the dock.
      const bar = document.querySelector('.search-island')?.getBoundingClientRect();
      const dock = revealAboveDock ? document.querySelector('.sheet')?.getBoundingClientRect() : undefined;
      const places = placeNames(names, obstacles, {
        left: NAME_EDGE,
        top: (bar && bar.height > 0 ? bar.bottom - area.top : 0) + NAME_EDGE,
        right: area.width - NAME_EDGE,
        bottom: (dock && dock.height > 0 ? dock.top - area.top : area.height) - NAME_EDGE,
      });
      for (const name of names) {
        const place = places.get(name.key);
        if (place) name.element.style.translate = `${Math.round(place.dx)}px ${Math.round(place.dy)}px`;
      }
    };
    layoutLightsRef.current = layout;
    layout();
  }, [
    clustered,
    clusters,
    destination,
    destinationLng,
    distanceOrigin,
    drawnUserLocation,
    formatNumber,
    frameLng,
    hasPopover,
    hoverTips,
    lightUnder,
    locale,
    readyMap,
    region,
    revealAboveDock,
    routeRemainingM,
    scooterIcon,
    selectedVehicleKey,
    walkedGone,
    t,
    vehicles,
    zoom,
  ]);

  // On a desktop a scooter under the pointer, or reached with the keyboard, says
  // who runs it, how charged it is and how far the walk is.
  useEffect(() => {
    const map = mapRef.current;
    const tip = tipRef.current;
    if (!readyMap || !map || !tip || !hoverTips) return;
    const container = map.getContainer();
    const hide = () => { tip.hidden = true; };
    const show = (event: Event) => {
      const icon = event.target instanceof Element ? event.target.closest<HTMLElement>('.scooter-marker-wrap') : null;
      const key = icon && [...vehicleMarkersRef.current].find(([, marker]) => marker.getElement() === icon)?.[0];
      const vehicle = key ? vehicleDataRef.current.get(key) : undefined;
      // The card of the selected scooter already says all of it.
      if (!icon || !vehicle || key === selectedVehicleKey) {
        hide();
        return;
      }
      const distanceM = distanceOrigin
        ? haversineM(distanceOrigin[0], distanceOrigin[1], vehicle.lat, vehicle.lng)
        : null;
      tip.textContent = scooterTip(vehicle, distanceM, { t, formatNumber });
      tip.hidden = false;
      // The light is small inside the 44 px its marker takes: the tip sits just above the light.
      const target = (icon.querySelector('.scooter-marker') ?? icon).getBoundingClientRect();
      const centred = target.left + target.width / 2 - tip.offsetWidth / 2;
      const above = target.top - TIP_GAP - tip.offsetHeight;
      tip.style.left = `${Math.round(Math.max(TIP_MARGIN, Math.min(centred, window.innerWidth - tip.offsetWidth - TIP_MARGIN)))}px`;
      // Under the scooter where there is no room above it.
      tip.style.top = `${Math.round(above < TIP_MARGIN ? target.bottom + TIP_GAP : above)}px`;
    };
    container.addEventListener('mouseover', show);
    container.addEventListener('mouseleave', hide);
    container.addEventListener('focusin', show);
    container.addEventListener('focusout', hide);
    map.on('movestart zoomstart', hide);
    return () => {
      hide();
      container.removeEventListener('mouseover', show);
      container.removeEventListener('mouseleave', hide);
      container.removeEventListener('focusin', show);
      container.removeEventListener('focusout', hide);
      map.off('movestart zoomstart', hide);
    };
  }, [distanceOrigin, formatNumber, hoverTips, readyMap, selectedVehicleKey, t]);

  const markerElement = useCallback<MarkerLookup>((vehicleKey, parkingId) => {
    const marker = vehicleKey !== null
      ? vehicleMarkersRef.current.get(vehicleKey)
      : parkingId !== null ? parkingMarkersRef.current.get(parkingId)?.marker : undefined;
    return marker?.getElement() ?? null;
  }, []);
  const popoverAnchor = useCallback(
    () => markerElement(selectedVehicleKey, selectedParkingId),
    [markerElement, selectedParkingId, selectedVehicleKey]
  );
  // On a phone the card is in the dock, far from the map: it asks for its marker to hand the focus back.
  useEffect(() => {
    if (!markerLookupRef) return;
    markerLookupRef.current = markerElement;
    return () => { markerLookupRef.current = null; };
  }, [markerElement, markerLookupRef]);

  // On a phone a card opens in the dock, which grows and lifts the controls that
  // sit on it. What the visitor picked, a scooter, a bay or a searched place, must
  // not end up underneath: once the dock has settled, the map moves up by just
  // what is needed, and sideways too where a tall card leaves too little room
  // above it to clear the controls. A place counts as just picked until the map is dragged; after
  // that the map does not move by itself for it again. Declared after the effects
  // that draw the markers.
  useEffect(() => {
    const map = mapRef.current;
    const content = document.querySelector('.sheet-content');
    if (!readyMap || !map || !revealAboveDock || !content) return;
    let timer = 0;
    let waiting = false;
    const boxOf = (selector: string) => document.querySelector(selector)?.getBoundingClientRect();
    const reveal = () => {
      waiting = false;
      const marker = popoverAnchor() ?? (revealPlaceRef.current ? destinationMarkerRef.current?.getElement() : null);
      // While the search is open the dock is not shown.
      if (!marker || document.querySelector('.app-shell[data-searching="true"]')) return;
      const area = map.getContainer().getBoundingClientRect();
      // The notices that are shown; the place kept for the location card is there when it is empty too.
      const notices = document.querySelectorAll('.map-notices .load-banner, .map-notices .location-card');
      const above = [boxOf('.search-island'), ...[...notices].map(notice => notice.getBoundingClientRect())];
      const shift = revealShift({
        marker: marker.getBoundingClientRect(),
        obstacles: [boxOf('.sheet'), boxOf('.fab-stack'), boxOf('.map-attribution')]
          .filter((box): box is DOMRect => box !== undefined && box.height > 0),
        ceiling: Math.max(area.top, ...above.map(box => box?.bottom ?? 0)),
        floor: area.bottom,
        sides: { left: area.left, right: area.right },
      });
      if (shift.x === 0 && shift.y === 0) return;
      const size = map.getSize();
      map.panTo(map.containerPointToLatLng(L.point(size.x / 2 - shift.x, size.y / 2 + shift.y)), {
        animate: !prefersReducedMotion(),
        duration: 0.25,
      });
    };
    // A move in progress, such as the flight to a searched place, is left to finish.
    const request = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (movingRef.current) waiting = true;
        else reveal();
      }, DOCK_SETTLE_MS);
    };
    const onMoveEnd = () => {
      if (waiting) reveal();
    };
    map.on('moveend', onMoveEnd);
    // Asks once for what was just picked, and again whenever the dock changes height.
    const observer = new ResizeObserver(request);
    observer.observe(content);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      map.off('moveend', onMoveEnd);
    };
  }, [destination, popoverAnchor, readyMap, revealAboveDock]);

  // The card stays beside its marker. Declared after the effects that draw the
  // markers, so that the marker is there to stand beside; new data may move it.
  useEffect(() => {
    const map = mapRef.current;
    const card = popoverRef.current;
    if (!readyMap || !map || !card || !hasPopover) return;
    return followMarker(map, card, popoverAnchor);
  }, [hasPopover, parking, popoverAnchor, readyMap, vehicles]);

  return (
    <>
      <div ref={containerRef} className="map-container" />
      {readyMap && (
        <UserLocationMarker map={readyMap} location={drawnUserLocation} headingEnabled={headingEnabled} />
      )}
      <div className="map-navigation">
        <MapCompass map={readyMap} />
        <MapZoomControls mapRef={mapRef} />
      </div>
      {(zones.length > 0 || ruleZones.length > 0) && (
        // No riding's hatching, which its zones are filled with (map.css).
        <svg className="zone-patterns" aria-hidden="true" focusable="false">
          <defs>
            <pattern id="zone-no-ride-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect className="zone-hatch-ground" width="8" height="8" />
              <line className="zone-hatch-line" x1="0" y1="0" x2="0" y2="8" />
            </pattern>
          </defs>
        </svg>
      )}
      <div ref={tipRef} className="map-tip glass" aria-hidden="true" hidden />
      {readyMap && popover && (
        <MarkerPopover
          cardRef={popoverRef}
          label={popover.label}
          selectionKey={selectedVehicleKey ?? selectedParkingId ?? ''}
          anchor={popoverAnchor}
        >
          {popover.content}
        </MarkerPopover>
      )}
    </>
  );
}
