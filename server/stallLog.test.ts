import { afterEach, expect, it } from 'vitest';
import { watchStalls } from './stallLog';

let stop = () => {};
afterEach(() => stop());

it('logs the event loop held, with the collections that ended around it', async () => {
  const lines: string[] = [];
  const watch = watchStalls(line => lines.push(line), 100, 20);
  stop = watch.stop;
  await new Promise(resolve => setTimeout(resolve, 50));
  expect(lines).toEqual([]);
  watch.ended('norway:voi_no_oslo');
  const until = performance.now() + 200;
  while (performance.now() < until) { /* held */ }
  await new Promise(resolve => setTimeout(resolve, 50));
  watch.ended('france:dott_fr_bordeaux');
  await new Promise(resolve => setTimeout(resolve, 2_100));
  const held = lines.map(line => JSON.parse(line)).filter(line => line.event === 'event_loop_held');
  expect(held).toHaveLength(1);
  expect(held[0].ms).toBeGreaterThanOrEqual(150);
  expect(held[0].ended.map((entry: { id: string }) => entry.id)).toEqual(['norway:voi_no_oslo', 'france:dott_fr_bordeaux']);
  // Oslo's ended before the loop was held, Bordeaux's after it was let go.
  expect(held[0].ended[0].ms).toBeLessThan(-150);
  expect(held[0].ended[1].ms).toBeGreaterThan(0);
});
