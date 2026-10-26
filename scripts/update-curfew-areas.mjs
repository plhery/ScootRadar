import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { boundary, outerRings, writeCatalog } from './boundaries.mjs';

// Fills the areas of data/rental-curfews.json with each town's boundary,
// simplified to within TOLERANCE_M: Norwegian municipalities from Kartverket
// (CC BY 4.0), British local authority districts from the ONS (Open Government
// Licence v3.0), Portuguese municipalities from the Direção-Geral do Território's
// CAOP (CC BY 4.0), American incorporated places from the Census Bureau's
// TIGERweb (public domain), and Kyiv from OpenStreetMap (ODbL). Pieces smaller
// than MIN_AREA_KM2 (skerries, most islands) are left out, or than the boundary's
// own `minAreaKm2`: Parc Jean-Drapeau's two islands are each under a square
// kilometre. Run it after adding a curfew, then npm run generate:providers.

const TOLERANCE_M = 100;
const MIN_AREA_KM2 = 1;
const path = resolve(process.cwd(), 'data/rental-curfews.json');
const catalog = JSON.parse(readFileSync(path, 'utf8'));

for (const curfew of catalog.curfews) {
  const polygons = await boundary(curfew.boundary);
  // Outer rings by default; Espoo preserves its Kauniainen enclave. Kyiv's two
  // holes, enclaves of Kyiv Oblast to the west and north-east, lie well outside
  // its scooters' bounds. Of the American holes,
  // only Berry Hill, a city inside Nashville, held a scooter or two.
  curfew.areas = outerRings(polygons, { minAreaKm2: curfew.boundary.minAreaKm2 ?? MIN_AREA_KM2, tolerance: TOLERANCE_M,
    holes: curfew.boundary.holes });
  console.log(`${curfew.id}: ${curfew.areas.map(area => area.length).join(' + ')} points`);
}

writeCatalog(path, catalog);
