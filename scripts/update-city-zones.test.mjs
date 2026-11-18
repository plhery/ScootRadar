import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';

it('retains a layer when co-located ArcGIS features saturate every subdivision', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'zones-limit-'));
  try {
    mkdirSync(join(cwd, 'data/city-zones'), { recursive: true });
    const url = 'https://fixture.invalid/MapServer';
    const layer = { kind: 'parking', layer: 0, url, envelope: '0,0,1,1' };
    writeFileSync(join(cwd, 'data/city-zones.json'), JSON.stringify({ verifiedOn: '2026-10-30', cities: [{ id: 'test', layers: [layer] }] }));
    const previous = join(cwd, 'data/city-zones/test.json');
    writeFileSync(previous, '{"zones":[]}');
    writeFileSync(join(cwd, 'fixture.mjs'), `let requests = 0;
      globalThis.setTimeout = callback => { callback(); };
      globalThis.fetch = async url => {
        if (++requests > 30) throw Error("request budget exceeded");
        return Response.json(url.includes('/identify?') ? { results: [{}, {}] } : { maxRecordCount: 2 });
      };`);
    const output = spawnSync(process.execPath, ['--import', './fixture.mjs', resolve('scripts/update-city-zones.mjs'), 'test'], { cwd, encoding: 'utf8' });
    expect(output.status).toBe(1);
    expect(JSON.parse(readFileSync(join(cwd, 'data/city-zones.json'))).verifiedOn).toBe('2026-10-30');
    expect(output.stderr).toContain('subdivision limit');
    expect(readFileSync(previous, 'utf8')).toBe('{"zones":[]}');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

it('restores the scooter corral colour after drawing a bike-only symbol', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'zones-colour-'));
  try {
    mkdirSync(join(cwd, 'data/city-zones'), { recursive: true });
    const layer = { kind: 'parking', format: 'geopdf', url: 'https://fixture.invalid/map.pdf',
      ocg: 'Corrals', symbols: { '1': 'Scooter', '0': null }, nameField: 'name' };
    writeFileSync(join(cwd, 'data/city-zones.json'), JSON.stringify({ cities: [{ id: 'test', layers: [layer] }] }));
    const pdf = `/VP [ << /BBox [0 0 10 10] /WKT (PROJCS["Mercator"]) /GPTS [0 0 1 0 1 1 0 1] /LPTS [0 0 0 1 1 1 1 0]
1 0 obj << /Type /OCG /Name (Corrals) >> endobj
2 0 obj << /Properties << /Layer 1 0 R >> >> endobj
3 0 obj << /Subtype /Form >> stream
/OC /Layer BDC 1 g 1 1 1 1 re f q 0 g 3 3 1 1 re f Q 5 5 1 1 re f EMC
endstream endobj`;
    writeFileSync(join(cwd, 'fixture.mjs'), 'globalThis.fetch = async () => new Response(' + JSON.stringify(pdf) + ')');
    const result = spawnSync(process.execPath, ['--import', './fixture.mjs', resolve('scripts/update-city-zones.mjs')], { cwd, encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    const { zones } = JSON.parse(readFileSync(join(cwd, 'data/city-zones/test.json')));
    expect(zones.map(zone => zone.name)).toEqual(['Scooter', 'Scooter']);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
