// Runs the web's clusterVehicles (src/lib/clustering.ts) on scooters spread over a few places and writes them,
// with what it made of them at each zoom, for ScooterGridClusteringTest to hold the Kotlin port to.
// node android/core/src/test/web/clustering.mjs <output.json>, from the top of the repository; the build runs it.
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const output = process.argv[2];
const bundle = await build({
  entryPoints: ['src/lib/clustering.ts'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  tsconfig: 'tsconfig.json',
  logLevel: 'silent',
});
const source = Buffer.from(bundle.outputFiles[0].text).toString('base64');
const { clusterVehicles } = await import(`data:text/javascript;base64,${source}`);

// The same scooters every run: the MINSTD generator, whose products stay exact in a double.
let seed = 20261027;
function random() {
  seed = (seed * 48271) % 2147483647;
  return seed / 2147483647;
}

const places = [
  // Zürich and Paris, where scooters stand close together.
  { lat: 47.3769, lng: 8.5417, spread: 0.02, count: 160, providers: ['voi', 'lime', 'bolt', 'tier', 'dott'] },
  { lat: 48.8566, lng: 2.3522, spread: 0.04, count: 120, providers: ['dott', 'lime', 'voi'] },
  // Tromsø, far north.
  { lat: 69.6496, lng: 18.956, spread: 0.01, count: 30, providers: ['voi', 'ryde'] },
  // Either side of the antimeridian, where the cells' numbers have fewer digits, and on the equator.
  { lat: -17.71, lng: 179.95, spread: 0.08, count: 30, providers: ['lime'] },
  { lat: -17.71, lng: -179.95, spread: 0.08, count: 20, providers: ['bird'] },
  { lat: 0.01, lng: 0.01, spread: 0.02, count: 20, providers: ['bolt', 'unknown'] },
  // Past the edge of the map at 85°.
  { lat: 86.5, lng: 10, spread: 0.5, count: 8, providers: ['voi'] },
];

const vehicles = [];
for (const place of places) {
  for (let index = 0; index < place.count; index++) {
    const provider = place.providers[Math.floor(random() * place.providers.length)];
    const lat = place.lat + (random() - 0.5) * place.spread;
    const lng = Math.max(-180, Math.min(180, place.lng + (random() - 0.5) * place.spread * 1.5));
    vehicles.push({ provider, lat, lng, battery: 80, range_m: null, vehicle_id: `${provider}-${vehicles.length}`,
      deep_link: null, distance_m: null });
  }
}
// Six on one spot.
for (let index = 0; index < 6; index++) {
  vehicles.push({ provider: 'lime', lat: 47.37, lng: 8.54, battery: 80, range_m: null,
    vehicle_id: `lime-spot-${index}`, deep_link: null, distance_m: null });
}

const zooms = [1, 5, 9, 12, 13, 14, 14.5, 15, 16];
const results = zooms.map(zoom => {
  const { vehicles: alone, clusters } = clusterVehicles(vehicles, zoom);
  return { zoom, vehicles: alone.map(vehicle => vehicle.vehicle_id), clusters };
});

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify({
  vehicles: vehicles.map(({ provider, lat, lng, vehicle_id }) => ({ provider, lat, lng, vehicle_id })),
  results,
}));
