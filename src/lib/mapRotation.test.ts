import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, it } from 'vitest';
import { ROTATE_PANES_STYLE, ROTATE_PANES_STYLE_ID } from '@/lib/mapRotation';

it('gives the rotation adapter its own pane rules, in the style it looks for', () => {
  const adapter = readFileSync(createRequire(import.meta.url).resolve('@tomickigrzegorz/leaflet-rotate'), 'utf8');
  // An update that renamed the style would add its own again, which the page refuses.
  expect(adapter).toContain(`const STYLE_ID = "${ROTATE_PANES_STYLE_ID}";`);
  for (const rule of ROTATE_PANES_STYLE.split('\n')) expect(adapter).toContain(`"${rule}"`);
});
