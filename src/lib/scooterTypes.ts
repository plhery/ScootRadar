export interface GbfsVehicleType {
  vehicle_type_id: string;
  form_factor?: string;
  propulsion_type?: string;
}

// Zeus's own feeds (zeus.city) call its standing e-scooters electric_assist,
// which GBFS keeps for pedal assistance; MobiData BW republishes the same
// scooters as electric. No other provider gets this reading.
const ELECTRIC_ASSIST_SCOOTER_PROVIDERS: ReadonlySet<string> = new Set(['zeus']);

/** A standing e-scooter, the only vehicle the map shows: never a bicycle or a seated moped. */
export function isElectricScooter(type: GbfsVehicleType | undefined, provider: string | null): boolean {
  if (type?.form_factor !== 'scooter' && type?.form_factor !== 'scooter_standing') return false;
  return type.propulsion_type === 'electric' || (
    type.propulsion_type === 'electric_assist' && provider !== null && ELECTRIC_ASSIST_SCOOTER_PROVIDERS.has(provider)
  );
}
