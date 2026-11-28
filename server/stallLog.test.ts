import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { watchStalls } from './stallLog';

// The watcher's clock and timers are the test's own, so a loaded machine can neither stretch its waits past the time
// limit nor hold the loop a second time: the event loop is held here by moving the clock with no timer run.
const clock = vi.hoisted(() => ({ now: 0 }));
vi.mock('node:perf_hooks', async importOriginal => ({
  ...await importOriginal<typeof import('node:perf_hooks')>(),
  performance: { now: () => clock.now },
}));

let stop = () => {};
beforeEach(() => {
  clock.now = 0;
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
});
afterEach(() => {
  stop();
  vi.useRealTimers();
});

/** Time passing with the loop free: each timer runs when due. */
function run(ms: number) {
  for (let passed = 0; passed < ms; passed += 10) {
    clock.now += 10;
    vi.advanceTimersByTime(10);
  }
}

it('logs the event loop held, with the collections that ended around it', () => {
  const lines: string[] = [];
  const watch = watchStalls(line => lines.push(line), 100, 20);
  stop = watch.stop;
  run(50);
  expect(lines).toEqual([]);
  watch.ended('norway:voi_no_oslo');
  clock.now += 200; // held: no timer runs
  run(50);
  watch.ended('france:dott_fr_bordeaux');
  run(1_950);
  expect(lines).toEqual([]); // not before the two seconds in which the collection that held it may end
  run(20);
  const held = lines.map(line => JSON.parse(line)).filter(line => line.event === 'event_loop_held');
  // Oslo's ended before the loop was held, Bordeaux's after it was let go.
  expect(held).toEqual([{ event: 'event_loop_held', ms: 200, ended: [
    { id: 'norway:voi_no_oslo', ms: -210 },
    { id: 'france:dott_fr_bordeaux', ms: 40 },
  ] }]);
});

it('leaves a loop held less than the threshold unlogged', () => {
  const lines: string[] = [];
  const watch = watchStalls(line => lines.push(line), 100, 20);
  stop = watch.stop;
  run(50);
  clock.now += 99;
  run(2_100);
  expect(lines.filter(line => JSON.parse(line).event === 'event_loop_held')).toEqual([]);
});
