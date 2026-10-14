'use client';

import { track } from '@/lib/analytics';

import { useState, useEffect, useEffectEvent, useCallback, useMemo, useRef } from 'react';
import { flushSync } from 'react-dom';
import MapWrapper from '@/components/MapWrapper';
import type { MapPopover, MarkerLookup } from '@/components/MapComponent';
import BottomSheet from '@/components/BottomSheet';
import KeyHints from '@/components/KeyHints';
import ParkingCard, { type SelectedParking } from '@/components/ParkingCard';
import ScooterCard, { type SelectedVehicle } from '@/components/ScooterCard';
import type { CardWalk } from '@/components/WalkAction';
import MapControls from '@/components/MapControls';
import MapCredits from '@/components/MapCredits';
import MapNotices from '@/components/MapNotices';
import SearchIsland from '@/components/SearchIsland';
import ControlSheet from '@/components/ControlSheet';
import LocationHelpSheet from '@/components/LocationHelpSheet';
import { selectionFeedback } from '@/lib/feedback';
import type { MapBounds, ParkingLocation, ScooterCluster, Vehicle } from '@/lib/types';
import { PROVIDERS } from '@/lib/types';
import {
  parseClientParams,
  parseStoredClientParams,
  serializeClientParams,
  type ClientParams,
  type MapStyleName,
  type ThemeName,
} from '@/lib/clientParams';
import { nearestCoveredCities, type NearbyCoveredCity } from '@/lib/coveredCities';
import { providerForFailedSource, providerHealth, providersInView } from '@/lib/dataHealth';
import { dockIssue, dockModel, originInViewport, type DockInput } from '@/lib/dockModel';
import { activeCurfew } from '@/lib/rentalCurfews';
import { useI18n } from '@/lib/i18n';
import { failureSurface } from '@/lib/loadFailure';
import { unfilteredCountInView } from '@/lib/nothingToShow';
import { placeForCity, recentPlaces, searchNear, type Place } from '@/lib/places';
import { shortcutFor } from '@/lib/shortcuts';
import { useDesktopLayout } from '@/lib/useDesktopLayout';
import { useRecentPlaces } from '@/lib/useRecentPlaces';
import { useScooterData, type ScooterDataQuery } from '@/lib/useScooterData';
import { groupCityTotals } from '@/lib/clustering';
import { mapRepresentationsMatch, providersForViewport } from '@/lib/mapCoverage';
import {
  boundsContainBounds,
  boundsContainPoint,
  boundsIntersect,
  expandBounds,
  haversineM,
  viewportContainsPoint,
  type MapViewport,
} from '@/lib/geo';
import { useLiveLocation } from '@/lib/useLiveLocation';
import { useWalkRoute } from '@/lib/useWalkRoute';
import { walkEstimate, type WalkEstimate, type WalkOrigin } from '@/lib/walking';
import { WALK_ROUTE_MAX_M } from '@/lib/walkRoute';
import type { WalkFrom } from '@/lib/walkState';
import { requestHeadingPermission, type HeadingPermission } from '@/lib/deviceHeading';
import { deviceTimeZone, startCity } from '@/lib/startPlace';

// Where the map opens for a time zone that has no covered city near: all of Switzerland.
const SWITZERLAND_CENTER: [number, number] = [46.8182, 8.2275];
const INITIAL_ZOOM = 8;
// About 350 m across on a phone, as the iOS app shows after locating.
const LOCATE_ZOOM = 17;
// Where a city's scooters show as clusters, the same as a tap on its total.
const CITY_ZOOM = 13;
// Parking bays show from street level, where the server starts to send them.
const PARKING_MIN_ZOOM = 16;
// "Cities with scooters" in the open search: the covered cities nearest to the map centre.
const SEARCH_CITY_COUNT = 6;
// How often the age of the data in the dock is worked out again.
const CLOCK_TICK_MS = 30_000;
const VIEWPORT_FETCH_PADDING = 0.25;
// A scooter of the same app this close to the one walked to, under another id, is taken to be it.
const SAME_SCOOTER_M = 15;

// The colour the browser gives its own bars in each appearance.
const THEME_COLOR = { light: '#eef0f4', dark: '#0b0e14' };

const STORAGE_KEY = 'scooters-params';
const PROVIDERS_STORAGE_KEY = 'scooters-providers';
// Only the fact that locating has worked once on this device; never a position.
const LOCATED_ONCE_STORAGE_KEY = 'scooters-located-once';

interface ScooterMapQuery {
  bounds: MapBounds;
  zoom: number;
}

/** The scooter or bay walked to, as it was when Directions was pressed. */
type WalkPin = { vehicle: Vehicle } | { parking: ParkingLocation };

function vehicleKey(vehicle: Vehicle): string {
  return vehicle.vehicle_id ? `${vehicle.provider}:${vehicle.vehicle_id}` : `${vehicle.provider}:${vehicle.lat}:${vehicle.lng}`;
}

// Along the way on the map, once there is one: what is left of it, not the straight line.
function alongRoute(estimate: WalkEstimate | null, remainingM: number | null): WalkEstimate | null {
  return estimate && remainingM !== null ? { ...estimate, distanceM: remainingM } : estimate;
}

function saveParamsToStorage(params: Record<string, string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(params)); } catch {}
}

function loadParamsFromStorage(): ClientParams | null {
  try { return parseStoredClientParams(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}

function readUrlParams(): ClientParams {
  if (typeof window === 'undefined') {
    return { origin: null, minBattery: undefined, theme: undefined, map: undefined };
  }
  const p = new URLSearchParams(window.location.search);
  const hasUrlParams = p.toString().length > 0;

  // If no URL params, try to restore from localStorage (PWA home screen launch)
  if (!hasUrlParams) {
    const stored = loadParamsFromStorage();
    if (stored) {
      const sp = serializeClientParams({
        minBattery: stored.minBattery ?? 0,
        theme: stored.theme ?? 'auto',
        map: stored.map ?? 'calm',
      });
      window.history.replaceState(null, '', `?${sp.toString()}`);
      return stored;
    }
  }

  return parseClientParams(p);
}

// What the browser says of location before it is asked; null when it will not say.
async function locationPermission(): Promise<PermissionState | null> {
  try {
    const status = await navigator.permissions?.query({ name: 'geolocation' });
    return status?.state ?? null;
  } catch {
    return null;
  }
}

// A control that removes itself when it is pressed hands the keyboard to the search bar.
function focusSearchBar() {
  document.querySelector<HTMLElement>('.bar-button')?.focus({ preventScroll: true });
}

// The list of sources over the map closes itself with Escape.
function creditsOpen(): boolean {
  try {
    return document.querySelector('.map-credits:popover-open') !== null;
  } catch {
    return false;
  }
}

const sameCoordinate = (a: number, b: number) => Math.abs(a - b) < 1e-7;

function sameCorners(a: MapViewport['corners'], b: MapViewport['corners']): boolean {
  if (!a || !b) return a === b;
  return a.length === b.length &&
    a.every(([lat, lng], i) => sameCoordinate(lat, b[i][0]) && sameCoordinate(lng, b[i][1]));
}

// A turn of the map can keep its bounds and still show something else: the corners say.
function viewportsEqual(a: MapViewport | null, b: MapViewport): boolean {
  if (!a) return false;
  return (
    sameCoordinate(a.south, b.south) &&
    sameCoordinate(a.west, b.west) &&
    sameCoordinate(a.north, b.north) &&
    sameCoordinate(a.east, b.east) &&
    sameCorners(a.corners, b.corners)
  );
}

export default function Home() {
  const { t, locale, region } = useI18n();
  // A wide window with a mouse: the dock is a legend, cards open beside their marker, keys work.
  const desktop = useDesktopLayout();
  const [initialCenter, setInitialCenter] = useState<[number, number]>(SWITZERLAND_CENTER);
  const [initialZoom, setInitialZoom] = useState(INITIAL_ZOOM);
  const {
    location: userLocation,
    accuracyM: locationAccuracyM,
    locating,
    error: locationError,
    locate,
  } = useLiveLocation();
  const [headingPermission, setHeadingPermission] = useState<HeadingPermission | null>(null);
  const [minBattery, setMinBattery] = useState(0);
  const [theme, setTheme] = useState<ThemeName>('auto');
  const [mapStyle, setMapStyle] = useState<MapStyleName>('calm');
  const [enabledProviders, setEnabledProviders] = useState<Set<string>>(
    new Set(Object.keys(PROVIDERS))
  );
  const [viewportBounds, setViewportBounds] = useState<MapViewport | null>(null);
  const [viewportZoom, setViewportZoom] = useState(INITIAL_ZOOM);
  const [mapQuery, setMapQuery] = useState<ScooterMapQuery | null>(null);
  const [focusRequest, setFocusRequest] = useState<{
    location: [number, number] | null;
    /** The zoom to arrive at; null keeps the current zoom, or street level when further out. */
    zoom: number | null;
    version: number;
  }>({ location: null, zoom: null, version: 0 });
  const [zoomStep, setZoomStep] = useState<{ direction: 1 | -1; version: number }>({ direction: 1, version: 0 });
  // The origin for walking times until it is cleared; it wins over your location.
  const [searchedPlace, setSearchedPlace] = useState<Place | null>(null);
  const placeChoicesRef = useRef(0);
  const recent = useRecentPlaces();
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [locationHelpOpen, setLocationHelpOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'filters' | 'settings'>('filters');
  const [locatedOnce, setLocatedOnce] = useState<boolean | null>(null);
  const [locationNoticeDismissed, setLocationNoticeDismissed] = useState(false);
  // A scooter or a parking bay, never both: selecting one clears the other.
  const [selectedVehicleKey, setSelectedVehicleKey] = useState<string | null>(null);
  const [selectedParkingId, setSelectedParkingId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const initializedRef = useRef(false);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const mapQueryRef = useRef<ScooterMapQuery | null>(null);
  const markerLookupRef = useRef<MarkerLookup | null>(null);

  const startLocating = useCallback((moveMap = true) => {
    setLocationNoticeDismissed(false);
    // Asked within the tap, before waiting for GPS. Without a tap the browser
    // cannot prompt, and the direction is then simply not drawn.
    void requestHeadingPermission().then(setHeadingPermission);
    // Locating clears the place: walking times are from your location again.
    setSearchedPlace(null);
    const placeChoices = placeChoicesRef.current;
    locate((coords) => {
      try { localStorage.setItem(LOCATED_ONCE_STORAGE_KEY, '1'); } catch {}
      setLocatedOnce(true);
      // A place chosen while the fix was on its way is the later wish: the map stays there.
      if (moveMap && placeChoicesRef.current === placeChoices) {
        setFocusRequest(current => ({ location: coords, zoom: LOCATE_ZOOM, version: current.version + 1 }));
      }
    });
  }, [locate]);

  /* eslint-disable react-hooks/set-state-in-effect -- These effects intentionally
     restore browser-only state after hydration. */

  // Restore saved settings before live location tracking starts.
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      const saved: unknown = JSON.parse(localStorage.getItem(PROVIDERS_STORAGE_KEY) ?? 'null');
      if (Array.isArray(saved) && saved.every(key => typeof key === 'string' && Object.hasOwn(PROVIDERS, key))) {
        setEnabledProviders(new Set(saved));
      }
    } catch {}
    let located = false;
    try { located = localStorage.getItem(LOCATED_ONCE_STORAGE_KEY) === '1'; } catch {}
    setLocatedOnce(located);
    setPreferencesReady(true);
    const params = readUrlParams();
    if (params.minBattery !== undefined) setMinBattery(params.minBattery);
    if (params.theme) setTheme(params.theme);
    if (params.map) setMapStyle(params.map);

    // Preserve old shared links without persisting their coordinates again.
    if (params.origin) {
      setInitialCenter(params.origin);
      setFocusRequest(current => ({ location: params.origin, zoom: null, version: current.version + 1 }));
    } else {
      // Until then the map shows the covered city nearest the device's time
      // zone (startPlace.ts), as the iOS app does: Paris for Europe/Paris.
      const start = startCity(deviceTimeZone());
      if (start) {
        setInitialCenter(start.center);
        setInitialZoom(CITY_ZOOM);
        setFocusRequest(current => ({ location: start.center, zoom: CITY_ZOOM, version: current.version + 1 }));
      }
      // As the iOS app does on launch: locate at once where location is granted,
      // or has worked here before. Safari says "prompt" until the page has asked,
      // even where it then answers without one, so that alone is not a refusal.
      void locationPermission().then(state => {
        if (state === 'granted' || (located && state !== 'denied')) startLocating();
      });
    }
  }, [startLocating]);

  useEffect(() => {
    if (!preferencesReady) return;
    try { localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify([...enabledProviders].sort())); } catch {}
  }, [enabledProviders, preferencesReady]);

  // Sync state to URL + localStorage
  useEffect(() => {
    if (!preferencesReady) return;
    const p = serializeClientParams({ minBattery, theme, map: mapStyle });
    const qs = p.toString();
    const newUrl = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);

    // Persist to localStorage for PWA home screen launches
    const stored: Record<string, string> = {};
    p.forEach((v, k) => { stored[k] = v; });
    saveParamsToStorage(stored);
  }, [minBattery, theme, mapStyle, preferencesReady]);

  /* eslint-enable react-hooks/set-state-in-effect */

  // The dock says how old the data is; the clock also catches up after a pause in the background.
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, CLOCK_TICK_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  // Clustered responses are filtered by the server; single scooters by the client.
  const scooterQuery = useMemo<ScooterDataQuery | null>(
    () => mapQuery && { ...mapQuery, minBattery: mapQuery.zoom <= 15 ? minBattery : 0 },
    [mapQuery, minBattery]
  );
  // A searched place wins over your location until it is cleared.
  const walkOrigin = useMemo<WalkOrigin | null>(() => {
    if (searchedPlace) return { point: [searchedPlace.lat, searchedPlace.lng], place: searchedPlace.title };
    return userLocation ? { point: userLocation, place: null } : null;
  }, [searchedPlace, userLocation]);
  // Where a walk starts: the same, with how far off your location may be.
  const walkFrom = useMemo<WalkFrom | null>(() => walkOrigin && {
    ...walkOrigin,
    accuracyM: walkOrigin.place === null ? locationAccuracyM : null,
  }, [locationAccuracyM, walkOrigin]);
  // The walk to the selected scooter or bay, which Directions starts and its card ends.
  const walk = useWalkRoute(walkFrom);
  const { end: endWalk } = walk;
  // The scooter or bay walked to, as it was when Directions was pressed: it stays
  // on the map and in the dock while it is out of view or counted in a group.
  const [walkPin, setWalkPin] = useState<WalkPin | null>(null);
  const clearSelection = useCallback(() => {
    endWalk();
    setSelectedVehicleKey(null);
    setSelectedParkingId(null);
  }, [endWalk]);
  const {
    vehicles,
    clusters,
    parking,
    meta: responseMeta,
    lastUpdated,
    hasData,
    loading,
    answersQuery,
    failure,
    outOfDate,
    refresh,
  } = useScooterData(scooterQuery, { onOutOfDate: clearSelection });

  const handleProviderToggle = (provider: string) => {
    track('provider_filter', { provider, enabled: !enabledProviders.has(provider), source: 'filters' });
    setEnabledProviders(current => {
      const next = new Set(current);
      if (next.has(provider)) next.delete(provider);
      else next.add(provider);
      return next;
    });
  };

  const handleShowAllProviders = () => {
    track('providers_all');
    setEnabledProviders(new Set(Object.keys(PROVIDERS)));
  };

  // A search result, a recent place or a city with scooters: it becomes the origin
  // for walking times, is remembered until the page is closed, and the map moves there.
  const choosePlace = (place: Place) => {
    const location: [number, number] = [place.lat, place.lng];
    clearSelection();
    placeChoicesRef.current += 1;
    setSearchedPlace(place);
    recentPlaces.add(place);
    setFocusRequest(current => ({ location, zoom: place.city ? CITY_ZOOM : null, version: current.version + 1 }));
  };

  const handlePlaceSelect = (place: Place) => {
    track('search_select');
    choosePlace(place);
  };

  const handleViewportChange = useCallback((bounds: MapViewport, zoom: number) => {
    setViewportBounds(current => viewportsEqual(current, bounds) ? current : bounds);
    setViewportZoom(zoom);

    const current = mapQueryRef.current;
    const shouldFetch = !current || !mapRepresentationsMatch(current.zoom, zoom) ||
      !boundsContainBounds(current.bounds, bounds);
    if (!shouldFetch) return;

    // Padding also applies to clusters. Stable grid cells make nearby pans reuse
    // the response without refetching or rebuilding the entire marker layer.
    const next = { bounds: expandBounds(bounds, VIEWPORT_FETCH_PADDING), zoom };
    mapQueryRef.current = next;
    setMapQuery(next);
  }, []);

  const handleLocateMe = useCallback(() => {
    track('locate');
    startLocating();
  }, [startLocating]);

  // Asked from a card for its walking time: the map stays where it is, so the card stays open.
  const handleLocateFromCard = useCallback(() => {
    track('locate');
    startLocating(false);
  }, [startLocating]);

  // The only manual refresh: "Try again" where a failure is shown. A request
  // that is already running is waited for: starting over would cancel it, and
  // tapping faster than the network answers would never load anything.
  const retryLoad = useCallback(() => {
    if (loading !== null) return;
    track('refresh');
    void refresh().then(succeeded => track('refresh_result', { result: succeeded ? 'success' : 'error' }));
  }, [loading, refresh]);

  const resetFilters = useCallback(() => {
    track('filters_reset');
    setMinBattery(0);
    setEnabledProviders(new Set(Object.keys(PROVIDERS)));
  }, []);

  // The response covers a padded area; only markers inside the exact viewport,
  // what the screen shows even of a turned map, are rendered and counted. Provider counts intentionally ignore the active
  // provider selection so every pill shows how many are available on screen.
  const viewportData = useMemo(() => {
    const clustered = responseMeta?.mode === 'clusters';
    const providerCounts: Record<string, number> = {};
    const visibleVehicles: Vehicle[] = [];
    const visibleClusters: ScooterCluster[] = [];
    if (!viewportBounds) return { providerCounts, visibleVehicles, visibleClusters, totalCount: 0 };

    for (const vehicle of vehicles) {
      if (!viewportContainsPoint(viewportBounds, vehicle.lat, vehicle.lng)) continue;
      if (minBattery > 0 && (vehicle.battery === null || vehicle.battery < minBattery)) continue;

      providerCounts[vehicle.provider] = (providerCounts[vehicle.provider] ?? 0) + 1;
      if (enabledProviders.has(vehicle.provider)) visibleVehicles.push(vehicle);
    }

    if (clustered) {
      for (const cluster of clusters) {
        if (!viewportContainsPoint(viewportBounds, cluster.lat, cluster.lng)) continue;
        for (const [provider, count] of Object.entries(cluster.providers)) {
          providerCounts[provider] = (providerCounts[provider] ?? 0) + count;
        }
        const providers = Object.fromEntries(
          Object.entries(cluster.providers).filter(([provider]) => enabledProviders.has(provider))
        );
        const count = Object.values(providers).reduce((total, value) => total + value, 0);
        if (count > 0) visibleClusters.push({ ...cluster, count, providers });
      }
    }

    const totalCount = visibleVehicles.length + visibleClusters.reduce(
      (total, cluster) => total + cluster.count,
      0
    );
    return { providerCounts, visibleVehicles, visibleClusters, totalCount };
  }, [
    clusters,
    enabledProviders,
    minBattery,
    responseMeta?.mode,
    vehicles,
    viewportBounds,
  ]);

  // Zoomed out, a country, a state or province, or neighbouring cities are drawn as one total.
  const mapClusters = useMemo(() => {
    if (!responseMeta?.overview) return viewportData.visibleClusters;
    const countries = new Intl.DisplayNames([locale], { type: 'region' });
    return groupCityTotals(viewportData.visibleClusters, viewportZoom, code => countries.of(code.toUpperCase()) ?? code, locale);
  }, [locale, responseMeta?.overview, viewportData.visibleClusters, viewportZoom]);

  const representedVehicleCount = vehicles.length + clusters.reduce(
    (total, cluster) => total + cluster.count,
    0
  );

  // Its pin on the map is named as the search bar names the place.
  const destination = useMemo(() => searchedPlace && {
    lat: searchedPlace.lat,
    lng: searchedPlace.lng,
    display_name: [searchedPlace.title, searchedPlace.subtitle].filter(Boolean).join(', '),
  }, [searchedPlace]);

  // Like the scooters: only the bays of the providers switched on, inside the exact viewport.
  const visibleParking = useMemo<ParkingLocation[]>(() => {
    if (!viewportBounds || viewportZoom < PARKING_MIN_ZOOM) return [];
    return parking.filter(location => enabledProviders.has(location.provider) &&
      viewportContainsPoint(viewportBounds, location.lat, location.lng));
  }, [enabledProviders, parking, viewportBounds, viewportZoom]);

  // The scooter walked to, as the latest data has it. Some apps give a scooter a
  // new id now and then: one of the same app a few metres from where it was is it.
  // Held while the walk is under way, or to say it is gone; a walk that failed or
  // got there leaves the card to the view, as any other.
  const walkHolds = walk.state !== null && walk.state.phase !== 'failed' && walk.state.phase !== 'arrived';
  const pinnedVehicle = walkHolds && walkPin && 'vehicle' in walkPin ? walkPin.vehicle : null;
  const pinnedParking = walkHolds && walkPin && 'parking' in walkPin ? walkPin.parking : null;
  const pinnedProvider = pinnedVehicle?.provider ?? null;
  const [walkLat, walkLng] = walk.state?.target.point ?? [null, null];
  const liveWalkedVehicle = useMemo(() => {
    if (pinnedProvider === null || walkLat === null || walkLng === null) return null;
    let nearest: Vehicle | null = null;
    let nearestM = SAME_SCOOTER_M;
    for (const vehicle of vehicles) {
      if (vehicleKey(vehicle) === selectedVehicleKey) return vehicle;
      if (vehicle.provider !== pinnedProvider) continue;
      const distanceM = haversineM(walkLat, walkLng, vehicle.lat, vehicle.lng);
      if (distanceM <= nearestM) {
        nearest = vehicle;
        nearestM = distanceM;
      }
    }
    return nearest;
  }, [pinnedProvider, selectedVehicleKey, vehicles, walkLat, walkLng]);
  const liveWalkedParking = useMemo(
    () => pinnedParking && (parking.find(location => location.id === pinnedParking.id) ?? null),
    [parking, pinnedParking]
  );
  // The pin is kept as fresh as the data, for when the data has nothing to say of it.
  if (liveWalkedVehicle && pinnedVehicle && pinnedVehicle !== liveWalkedVehicle) setWalkPin({ vehicle: liveWalkedVehicle });
  if (liveWalkedVehicle && vehicleKey(liveWalkedVehicle) !== selectedVehicleKey) setSelectedVehicleKey(vehicleKey(liveWalkedVehicle));
  const walkedVehicle = liveWalkedVehicle ?? pinnedVehicle;
  const walkedParking = liveWalkedParking ?? pinnedParking;
  const routeRemainingM = walk.view?.phase === 'shown' ? walk.view.remainingM : null;

  // While it is walked to, a scooter or a bay keeps its card out of view, among
  // groups and below the zoom of bays; a provider switched off still closes it.
  const selectedParking = useMemo<SelectedParking | null>(() => {
    if (selectedParkingId === null) return null;
    const bay = walkedParking ?? visibleParking.find(location => location.id === selectedParkingId);
    if (!bay || !enabledProviders.has(bay.provider)) return null;
    return { parking: bay, walk: alongRoute(walkEstimate(walkOrigin, bay.lat, bay.lng), routeRemainingM) };
  }, [enabledProviders, routeRemainingM, selectedParkingId, visibleParking, walkOrigin, walkedParking]);

  const selectedVehicle = useMemo<SelectedVehicle | null>(() => {
    if (!selectedVehicleKey) return null;
    const vehicle = walkedVehicle ??
      viewportData.visibleVehicles.find(candidate => vehicleKey(candidate) === selectedVehicleKey);
    if (!vehicle || !enabledProviders.has(vehicle.provider)) return null;
    return {
      vehicle,
      walk: alongRoute(walkEstimate(walkOrigin, vehicle.lat, vehicle.lng), routeRemainingM),
      curfew: activeCurfew([vehicle.lat, vehicle.lng], now),
    };
  }, [enabledProviders, now, routeRemainingM, selectedVehicleKey, viewportData.visibleVehicles, walkOrigin, walkedVehicle]);

  // The scooter that leads the dock: the nearest one shown, while single scooters are.
  const nearestVehicle = useMemo(() => {
    if (!walkOrigin || responseMeta?.mode === 'clusters') return null;
    let nearest: { vehicle: Vehicle; distanceM: number } | null = null;
    for (const vehicle of viewportData.visibleVehicles) {
      const distanceM = walkEstimate(walkOrigin, vehicle.lat, vehicle.lng)?.distanceM ?? Infinity;
      if (!nearest || distanceM < nearest.distanceM) nearest = { vehicle, distanceM };
    }
    return nearest;
  }, [responseMeta?.mode, viewportData.visibleVehicles, walkOrigin]);

  // Another scooter or bay is another walk; the same one again keeps its way.
  const selectVehicle = (vehicle: Vehicle) => {
    track('vehicle_select', { provider: vehicle.provider });
    selectionFeedback();
    const key = vehicleKey(vehicle);
    if (key !== selectedVehicleKey) endWalk();
    setSelectedParkingId(null);
    setSelectedVehicleKey(key);
  };

  const selectParking = (location: ParkingLocation) => {
    track('parking_select', { provider: location.provider });
    selectionFeedback();
    if (location.id !== selectedParkingId) endWalk();
    setSelectedVehicleKey(null);
    setSelectedParkingId(location.id);
  };

  // What closes a card clears the selection, as in the iOS app: a scooter or a
  // bay that left the view, lost its provider or went with new data does not
  // open again by itself once it is back.
  if (selectedVehicleKey !== null && !selectedVehicle) setSelectedVehicleKey(null);
  if (selectedParkingId !== null && !selectedParking) setSelectedParkingId(null);

  // A walk belongs to its card: it ends with it, whatever closed it.
  const walking = walk.state !== null;
  const selectionShown = selectedVehicle !== null || selectedParking !== null;
  const { setTarget: setWalkTarget, locationFailed: walkLocationFailed, gone: walkGone } = walk;
  useEffect(() => {
    if (walking && !selectionShown) endWalk();
  }, [endWalk, selectionShown, walking]);

  // Moved by someone, or found under a new id: the walk leads to where it is now.
  const liveLat = liveWalkedVehicle?.lat ?? null;
  const liveLng = liveWalkedVehicle?.lng ?? null;
  useEffect(() => {
    if (liveLat !== null && liveLng !== null) setWalkTarget([liveLat, liveLng]);
  }, [liveLat, liveLng, setWalkTarget]);

  // Directions located you first, and your location could not be had.
  const walkPhase = walk.view?.phase ?? null;
  useEffect(() => {
    if (walkPhase === 'locating' && !locating && locationError) walkLocationFailed();
  }, [locating, locationError, walkLocationFailed, walkPhase]);

  // Taken while you walked to it: no longer in data that would have it, where
  // single scooters are sent whatever their battery and its app's feed answered.
  // Twice, from two updates of the data: a scooter missing from one comes back.
  const walkedCovered = pinnedVehicle !== null && walkLat !== null && walkLng !== null && lastUpdated !== null &&
    answersQuery && mapQuery !== null && responseMeta?.mode === 'vehicles' && !responseMeta.truncated &&
    (scooterQuery?.minBattery ?? 0) === 0 &&
    boundsContainPoint(mapQuery.bounds, walkLat, walkLng) &&
    !responseMeta.failedSources.some(source => providerForFailedSource(source) === pinnedVehicle.provider);
  const walkedSeen = liveWalkedVehicle ? true : walkedCovered ? false : null;
  const [walkMissedIn, setWalkMissedIn] = useState<number | null>(null);
  if (walkedSeen === false && walkMissedIn === null) setWalkMissedIn(lastUpdated);
  if (walkedSeen === true && walkMissedIn !== null) setWalkMissedIn(null);
  const walkedTaken = walkedSeen === false && walkMissedIn !== null && lastUpdated !== walkMissedIn;
  useEffect(() => {
    if (walkedTaken) walkGone();
  }, [walkGone, walkedTaken]);
  // Back after all: the card is the scooter's again, and Directions with it.
  const walkedBack = walkPhase === 'gone' && liveWalkedVehicle !== null;
  useEffect(() => {
    if (walkedBack) endWalk();
  }, [endWalk, walkedBack]);

  const availableProviders = viewportBounds
    ? [...new Set([...providersForViewport(viewportBounds), ...Object.keys(viewportData.providerCounts)])]
    : Object.keys(PROVIDERS);
  const hasActiveFilters = minBattery > 0 || availableProviders.some(provider => !enabledProviders.has(provider));

  const viewportCenter = useMemo<[number, number] | null>(() => viewportBounds && [
    (viewportBounds.south + viewportBounds.north) / 2,
    (viewportBounds.west + viewportBounds.east) / 2,
  ], [viewportBounds]);
  const nearbyCities = useMemo(
    () => searchExpanded && viewportCenter ? nearestCoveredCities(viewportCenter, SEARCH_CITY_COUNT) : [],
    [searchExpanded, viewportCenter]
  );
  const searchCentre = useMemo(() => searchNear(viewportCenter, viewportZoom), [viewportCenter, viewportZoom]);

  // Who has scooters here whatever the filters hide. Data loaded for another
  // view says nothing about this one, so it names nobody as not sharing data.
  const providersHere = useMemo(() => answersQuery
    ? providersInView({ vehicles, clusters, viewport: viewportBounds, serverMinBattery: scooterQuery?.minBattery ?? 0 })
    : null,
  [answersQuery, clusters, scooterQuery?.minBattery, vehicles, viewportBounds]);
  // The exception is the load that follows a move within the same area: what
  // was known just before holds until the answer, so that the notice and the
  // dashed chip do not leave and come back with every move of the map.
  const [answered, setAnswered] = useState<{ providers: ReadonlySet<string> | null; viewport: MapViewport | null }>(
    { providers: null, viewport: null }
  );
  if (answersQuery && (answered.providers !== providersHere || answered.viewport !== viewportBounds)) {
    setAnswered({ providers: providersHere, viewport: viewportBounds });
  }
  const loadingNearby = !answersQuery && loading === 'load' && !failure &&
    (scooterQuery?.minBattery ?? 0) === 0 &&
    viewportBounds !== null && answered.viewport !== null && boundsIntersect(answered.viewport, viewportBounds);
  const loadedProviders = answersQuery ? providersHere : loadingNearby ? answered.providers : null;

  const dockInput: DockInput = {
    count: viewportData.totalCount,
    originInViewport: originInViewport(walkOrigin?.point ?? null, viewportBounds),
    nearest: nearestVehicle && {
      provider: nearestVehicle.vehicle.provider,
      distanceM: nearestVehicle.distanceM,
      place: walkOrigin?.place ?? null,
    },
    loading,
    failure,
    outOfDate,
    hasData,
    meta: responseMeta,
    lastUpdated,
    now,
    representedCount: representedVehicleCount,
    viewportProviders: availableProviders,
    viewportCenter,
    providerCounts: viewportData.providerCounts,
    providersInView: loadedProviders,
    enabledProviders,
    minBattery,
    unfilteredCount: unfilteredCountInView({
      meta: responseMeta,
      vehicles,
      clusters,
      viewport: viewportBounds,
      serverMinBattery: scooterQuery?.minBattery ?? 0,
    }),
  };
  const dock = dockModel(dockInput);

  const openPanel = (panel: 'filters' | 'settings') => {
    track(panel === 'filters' ? 'filters_open' : 'settings_open');
    selectionFeedback();
    setSearchExpanded(false);
    setActivePanel(panel);
    setPanelOpen(true);
  };

  const openSearch = () => {
    track('search_open');
    // Commit within the tap so mobile Safari can focus the newly mounted input.
    flushSync(() => setSearchExpanded(true));
  };

  // A "Closest cities" chip chooses the city as the place, like its chip in the
  // search: walking times then start there, not at the place without scooter data.
  const handleCitySelect = (city: NearbyCoveredCity) => choosePlace(placeForCity(city, locale, region));

  const closeCard = () => {
    if (selectedVehicle) track('vehicle_dismiss');
    clearSelection();
  };

  // Directions on the open card: the way is drawn from where walking times start,
  // or from your location once it has come.
  const walkTarget = selectedVehicle?.vehicle ?? selectedParking?.parking ?? null;
  const cardWalk: CardWalk = {
    view: walk.view,
    tooFar: walkOrigin !== null && walkTarget !== null &&
      haversineM(walkOrigin.point[0], walkOrigin.point[1], walkTarget.lat, walkTarget.lng) > WALK_ROUTE_MAX_M,
    onStart: () => {
      const pin: WalkPin | null = selectedVehicle
        ? { vehicle: selectedVehicle.vehicle }
        : selectedParking ? { parking: selectedParking.parking } : null;
      if (!pin) return;
      const target = 'vehicle' in pin ? pin.vehicle : pin.parking;
      setWalkPin(pin);
      setWalkMissedIn(null);
      walk.start({
        key: 'vehicle' in pin ? `vehicle:${vehicleKey(pin.vehicle)}` : `parking:${pin.parking.id}`,
        point: [target.lat, target.lng],
      });
      if (!walkOrigin && !locating) {
        track('locate');
        startLocating(false);
      }
    },
    onHide: endWalk,
  };

  // What is walked to stays on the map while the walk holds it, as its card does;
  // a scooter gone is drawn as where it was.
  const mapVehicles = useMemo(() => {
    const walked = walkHolds ? selectedVehicle?.vehicle : undefined;
    const visible = viewportData.visibleVehicles;
    if (!walked) return visible;
    const key = vehicleKey(walked);
    return visible.some(vehicle => vehicleKey(vehicle) === key) ? visible : [...visible, walked];
  }, [selectedVehicle, viewportData.visibleVehicles, walkHolds]);
  const mapParking = useMemo(() => {
    const walked = walkHolds ? selectedParking?.parking : undefined;
    if (!walked || visibleParking.some(location => location.id === walked.id)) return visibleParking;
    return [...visibleParking, walked];
  }, [selectedParking, visibleParking, walkHolds]);
  // A stray tap on the map does not take the way away: the card closes it.
  const walkOnMap = walkPhase === 'locating' || walkPhase === 'finding' || walkPhase === 'shown';

  // The marker of the selection: the card in the dock hands the focus back to it when it closes.
  const selectionAnchor = useCallback(
    () => markerLookupRef.current?.(selectedVehicleKey, selectedParkingId) ?? null,
    [selectedParkingId, selectedVehicleKey]
  );

  // On a desktop the card of the selection opens beside its marker; the dock keeps the count.
  const popover: MapPopover | null = !desktop
    ? null
    : selectedVehicle
      ? {
          label: t('marker.scooter', {
            name: PROVIDERS[selectedVehicle.vehicle.provider]?.name ?? selectedVehicle.vehicle.provider,
          }),
          content: (
            <ScooterCard
              key={selectedVehicleKey}
              selection={selectedVehicle}
              onClose={closeCard}
              onLocate={handleLocateFromCard}
              locating={locating}
              walk={cardWalk}
            />
          ),
        }
      : selectedParking
        ? {
            label: t('bay.title', {
              name: PROVIDERS[selectedParking.parking.provider]?.name ?? selectedParking.parking.provider,
            }),
            content: <ParkingCard key={selectedParking.parking.id} selection={selectedParking} onClose={closeCard} walk={cardWalk} />,
          }
        : null;

  // The keys listed in the corner of the desktop layout.
  const handleShortcut = useEffectEvent((event: KeyboardEvent) => {
    // A sheet is a modal dialog: it closes itself with Escape and keeps the other keys from the map.
    if (panelOpen || locationHelpOpen) return;
    const shortcut = shortcutFor(event);
    if (!shortcut) return;
    if (searchExpanded) {
      // The open search has the keyboard; Escape closes it wherever the focus is.
      if (shortcut === 'close') {
        event.preventDefault();
        track('search_close');
        setSearchExpanded(false);
      }
      return;
    }
    switch (shortcut) {
      case 'search':
        // Keeps the "/" out of the field that opens.
        event.preventDefault();
        openSearch();
        break;
      case 'locate':
        if (!locating && !event.repeat) handleLocateMe();
        break;
      case 'zoomIn':
      case 'zoomOut': {
        const direction = shortcut === 'zoomIn' ? 1 : -1;
        track('map_zoom', { direction: direction > 0 ? 'in' : 'out' });
        setZoomStep(current => ({ direction, version: current.version + 1 }));
        break;
      }
      case 'close':
        if ((selectedVehicle || selectedParking) && !creditsOpen()) closeCard();
        break;
    }
  });
  useEffect(() => {
    if (!desktop) return;
    const onKeyDown = (event: KeyboardEvent) => handleShortcut(event);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [desktop]);

  const handleQuickProviderToggle = (provider: string) => {
    track('provider_filter', { provider, source: 'quick' });
    setEnabledProviders(current => {
      if (current.size === 1 && current.has(provider)) return new Set(Object.keys(PROVIDERS));
      if (availableProviders.every(key => current.has(key))) return new Set([provider]);
      const next = new Set(current);
      if (next.has(provider)) next.delete(provider);
      else next.add(provider);
      return next;
    });
  };

  return (
    // The stylesheet reads the appearance and the map style from here. Automatic
    // is left to it, so the system's appearance applies before any script runs.
    // A chosen Light or Dark is put here by a script of the layout before the
    // first paint, ahead of what this page knows when it starts: not a mismatch.
    <div
      className="app-shell"
      data-theme={theme}
      data-map={mapStyle}
      data-searching={searchExpanded}
      suppressHydrationWarning
    >
      {/* One colour per system appearance; a chosen appearance holds in both. */}
      <meta
        name="theme-color"
        media="(prefers-color-scheme: light)"
        content={theme === 'dark' ? THEME_COLOR.dark : THEME_COLOR.light}
      />
      <meta
        name="theme-color"
        media="(prefers-color-scheme: dark)"
        content={theme === 'light' ? THEME_COLOR.light : THEME_COLOR.dark}
      />
      {/* In the order of the layout, which is the order of the Tab key: the search
          bar, what went wrong, the dock, and only then the map with its markers,
          which can be many. All but the map are placed by the stylesheet. */}
      <SearchIsland
        place={searchedPlace}
        // Decided by the place, as in the iOS app: the map may since have been moved elsewhere.
        placeHasData={searchedPlace?.covered !== false}
        locating={locating}
        expanded={searchExpanded}
        hasActiveFilters={hasActiveFilters}
        recentPlaces={recent}
        nearbyCities={nearbyCities}
        near={searchCentre}
        onExpandedChange={expanded => { track(expanded ? 'search_open' : 'search_close'); setSearchExpanded(expanded); }}
        onSelect={handlePlaceSelect}
        onClear={() => { track('search_clear'); setSearchedPlace(null); }}
        onLocate={handleLocateMe}
        onShowFilters={() => openPanel('filters')}
        onShowSettings={() => openPanel('settings')}
      />

      <MapNotices
        loadFailure={failureSurface({ failure, hasData, outOfDate }) === 'banner' ? failure : null}
        loading={loading !== null}
        locationError={locating || locationNoticeDismissed ? null : locationError}
        hidden={searchExpanded}
        onRetryLoad={retryLoad}
        onRetryLocate={handleLocateMe}
        onSeeHow={() => setLocationHelpOpen(true)}
        // Searching is the answer to the card, as in the iOS app: it does not come back with the place.
        onSearchPlace={() => { setLocationNoticeDismissed(true); openSearch(); }}
        onDismissLocation={() => { setLocationNoticeDismissed(true); focusSearchBar(); }}
      />

      <BottomSheet
        dock={dock}
        issue={dockIssue(dockInput)}
        selectedVehicle={selectedVehicle}
        selectedParking={selectedParking}
        desktop={desktop}
        selectionAnchor={selectionAnchor}
        hidden={searchExpanded}
        onShowAllProviders={handleShowAllProviders}
        onProviderToggle={handleQuickProviderToggle}
        onClearSelection={closeCard}
        // "Show all" and a closest city leave with their card.
        onResetFilters={() => { resetFilters(); focusSearchBar(); }}
        onEditFilters={() => openPanel('filters')}
        onRetry={retryLoad}
        onCitySelect={city => { handleCitySelect(city); focusSearchBar(); }}
        onSelectNearest={() => { if (nearestVehicle) selectVehicle(nearestVehicle.vehicle); }}
        onLocate={handleLocateFromCard}
        locating={locating}
        walk={cardWalk}
      />

      <MapWrapper
        parking={mapParking}
        vehicles={mapVehicles}
        clusters={mapClusters}
        clustered={responseMeta?.mode === 'clusters'}
        origin={initialCenter}
        initialZoom={initialZoom}
        distanceOrigin={walkOrigin?.point ?? null}
        userLocation={userLocation}
        headingEnabled={headingPermission === 'granted' && locationError !== 'denied'}
        focusLocation={focusRequest.location}
        focusZoom={focusRequest.zoom}
        focusVersion={focusRequest.version}
        destination={destination}
        onViewportChange={handleViewportChange}
        selectedVehicleKey={selectedVehicleKey}
        onVehicleSelect={selectVehicle}
        selectedParkingId={selectedParkingId}
        onParkingSelect={selectParking}
        onMapClick={walkOnMap ? undefined : closeCard}
        walk={walk.view}
        revealAboveDock={!desktop}
        hoverTips={desktop}
        popover={popover}
        zoomStep={zoomStep}
        markerLookupRef={markerLookupRef}
        theme={theme}
        mapStyle={mapStyle}
      />

      {/* One row in the corner of a desktop; on a phone each of the two places itself. */}
      <div className="map-corner">
        <MapControls
          locating={locating}
          locatedOnce={locatedOnce}
          hidden={searchExpanded}
          onLocateMe={handleLocateMe}
        />

        <MapCredits />
      </div>

      {desktop && <KeyHints />}

      <ControlSheet
        open={panelOpen}
        panel={activePanel}
        onClose={() => { track('panel_close'); setPanelOpen(false); }}
        minBattery={minBattery}
        enabledProviders={enabledProviders}
        availableProviders={availableProviders}
        providerCounts={viewportData.providerCounts}
        downProviders={providerHealth({
          meta: responseMeta,
          viewportProviders: availableProviders,
          inView: loadedProviders,
        }).down}
        hasActiveFilters={hasActiveFilters}
        // While the answer for a new view or minimum is on its way there is no count to promise.
        showCount={loading === 'load' ? null : viewportData.totalCount}
        theme={theme}
        mapStyle={mapStyle}
        onMinBatteryChange={value => { track('battery_filter', { value }); setMinBattery(value); }}
        onProviderToggle={handleProviderToggle}
        onResetFilters={resetFilters}
        onThemeChange={next => { track('map_style', { style: next }); setTheme(next); }}
        onMapStyleChange={next => { track('map_style', { style: next }); setMapStyle(next); }}
      />

      <LocationHelpSheet open={locationHelpOpen} onClose={() => setLocationHelpOpen(false)} />
    </div>
  );
}
