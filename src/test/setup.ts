import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: new MemoryStorage(),
});

afterEach(() => cleanup());

// The map's units follow the browser's time zone (walking.ts), and Node follows TZ at once: a test that needs a place
// sets it (process.env.TZ = 'Europe/London'), and the next test starts from the zone its file had.
let timeZone: string | undefined;
beforeEach(() => {
  timeZone = process.env.TZ;
});
afterEach(() => {
  if (timeZone === undefined) delete process.env.TZ;
  else process.env.TZ = timeZone;
});
