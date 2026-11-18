import { execFileSync } from 'node:child_process';
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
    writeFileSync(join(cwd, 'data/city-zones.json'), JSON.stringify({ cities: [{ id: 'test', layers: [layer] }] }));
    const previous = join(cwd, 'data/city-zones/test.json');
    writeFileSync(previous, '{"zones":[]}');
    writeFileSync(join(cwd, 'fixture.mjs'), `let requests = 0;
      globalThis.setTimeout = callback => { callback(); };
      globalThis.fetch = async url => {
        if (++requests > 30) throw Error("request budget exceeded");
        return Response.json(url.includes('/identify?') ? { results: [{}, {}] } : { maxRecordCount: 2 });
      };`);
    const output = execFileSync(process.execPath, ['--import', './fixture.mjs', resolve('scripts/update-city-zones.mjs'), 'test'], { cwd, encoding: 'utf8' });
    expect(output).toContain('subdivision limit');
    expect(readFileSync(previous, 'utf8')).toBe('{"zones":[]}');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
