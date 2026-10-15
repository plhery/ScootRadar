import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { boundary, outerRings, writeCatalog } from './boundaries.mjs';

// Fills the areas of data/town-outlines.json with each town's boundary,
// simplified to within TOLERANCE_M, or its country's COUNTRY_TOLERANCE_M:
// OpenStreetMap's municipalities (ODbL), Norway's from Kartverket, the 2018
// districts of Bournemouth, Christchurch and Poole from the ONS, and American
// towns from the Census Bureau's TIGERweb. Every piece is kept but those too
// small to keep a shape, islets that simplify to a line. Run it after adding a
// town, then npm run generate:providers, which checks the file. Name countries
// to refresh only their towns: node scripts/update-town-outlines.mjs il

const TOLERANCE_M = 20;
// Closer where riders park along town lines. In Gush Dan, Bird and Lime park
// along the streets between Ramat Gan and Givatayim: at 20 m 19 to 22 scooters
// a poll stood on the wrong side of an outline, at 10 m 8 to 11, for 383 more
// points.
const COUNTRY_TOLERANCE_M = { il: 10 };
const countries = process.argv.slice(2).map(country => country.toLowerCase());
const path = resolve(process.cwd(), 'data/town-outlines.json');
const catalog = JSON.parse(readFileSync(path, 'utf8'));

for (const town of catalog.towns) {
  const country = town.city.slice(0, town.city.indexOf(':'));
  if (countries.length && !countries.includes(country)) continue;
  const tolerance = COUNTRY_TOLERANCE_M[country] ?? TOLERANCE_M;
  // Outer rings only. A town inside another's outline, as Costa da Caparica in
  // Almada's, has an outline of its own, and the smaller one holding a scooter wins.
  town.areas = outerRings(await boundary(town.boundary), { minAreaKm2: 0, tolerance, digits: 5 })
    .filter(area => area.length >= 3);
  console.log(`${town.city}: ${town.areas.map(area => area.length).join(' + ')} points`);
}

writeCatalog(path, catalog);
