'use client';

import dynamic from 'next/dynamic';
import { preload } from 'react-dom';
import type { MapViewport } from '@/lib/geo';
import type { ParkingLocation, ScooterCluster, Vehicle } from '@/lib/types';
import type { CityGroup } from '@/lib/clustering';
import type { AddressResult } from '@/components/AddressSearch';
import type { MapStyleName, ThemeName } from '@/lib/clientParams';
import type { RefObject } from 'react';
import type { WalkView } from '@/lib/walkState';
import type { MapPopover, MarkerLookup } from './MapComponent';
import type { MapZone } from '@/lib/zones';
import type { LastSeenStatus } from '@/lib/scooterDataState';
import type { RuleZoneShape } from '@/lib/ruleZones';

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });
// The map's code, Leaflet's with it, is asked for as soon as the page's own has run, not once the page has
// hydrated and first drawn it: on a slow phone that is a few hundred milliseconds sooner to the first scooters.
if (typeof window !== 'undefined') void import('./MapComponent');

interface MapWrapperProps {
  parking?: ParkingLocation[];
  zones?: MapZone[];
  ruleZones?: RuleZoneShape[];
  vehicles: Vehicle[];
  clusters: CityGroup[];
  clustered: boolean;
  lastSeenVehicles?: Vehicle[];
  lastSeenClusters?: ScooterCluster[];
  lastSeenProviders?: Readonly<Record<string, LastSeenStatus>>;
  origin: [number, number];
  initialZoom: number;
  distanceOrigin: [number, number] | null;
  userLocation: [number, number] | null;
  headingEnabled: boolean;
  focusLocation: [number, number] | null;
  focusZoom: number | null;
  focusVersion: number;
  destination: AddressResult | null;
  onViewportChange: (bounds: MapViewport, zoom: number) => void;
  selectedVehicleKey: string | null;
  onVehicleSelect: (vehicle: Vehicle) => void;
  selectedParkingId: string | null;
  onParkingSelect: (location: ParkingLocation) => void;
  onMapClick?: () => void;
  revealAboveDock?: boolean;
  walk?: WalkView | null;
  hoverTips?: boolean;
  popover?: MapPopover | null;
  zoomStep?: { direction: 1 | -1; version: number };
  markerLookupRef?: RefObject<MarkerLookup | null>;
  theme?: ThemeName;
  mapStyle?: MapStyleName;
}

export default function MapWrapper(props: MapWrapperProps) {
  // The address of the tiles' build (groundTileUrl in quietGround.ts), asked for with the page while the map's
  // code is on its way, not after it: the map then asks for its first tiles at once, on a connection already
  // open. Anonymous, as its fetch asks, or the browser would not hand it over.
  preload('https://tiles.openfreemap.org/planet', { as: 'fetch', crossOrigin: 'anonymous' });
  return <MapComponent {...props} />;
}
