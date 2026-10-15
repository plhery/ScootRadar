import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { boundary, outerRings, writeCatalog } from './boundaries.mjs';

// Fills the areas of data/town-outlines.json with each town's boundary,
// simplified to within TOLERANCE_M: Israeli municipalities from OpenStreetMap
// (ODbL). Every piece is kept, however small. Run it after adding a town, then
// npm run generate:providers, which checks the file.

const TOLERANCE_M = 20;
const path = resolve(process.cwd(), 'data/town-outlines.json');
const catalog = JSON.parse(readFileSync(path, 'utf8'));

for (const town of catalog.towns) {
  // Outer rings only: no covered town has an enclave of another.
  town.areas = outerRings(await boundary(town.boundary), { minAreaKm2: 0, tolerance: TOLERANCE_M, digits: 5 });
  console.log(`${town.city}: ${town.areas.map(area => area.length).join(' + ')} points`);
}

writeCatalog(path, catalog);
