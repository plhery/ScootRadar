export type {
  ParkingLocation,
  FeedSourceStatus,
  RentalUris,
  RidePricing,
  ScooterCluster,
  ScooterResponse,
  ScooterResponseMeta,
  ScooterResponseMode,
  Vehicle,
} from '@/generated/scooterApi';

/** A west greater than the east crosses the 180° line (geo.ts). */
export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export {
  PROVIDERS,
  PROVIDER_KEYS,
  type ProviderConfig,
  type ProviderKey,
} from '@/generated/providers';
