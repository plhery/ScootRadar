import { setImmediate } from 'node:timers/promises';

/**
 * Runs the steps to their end in slices of about `sliceMs`, letting the event loop answer requests
 * and take in collections between slices: the value the steps return.
 */
export async function runInSlices<T>(steps: Generator<void, T>, sliceMs: number): Promise<T> {
  for (;;) {
    const started = performance.now();
    let step = steps.next();
    while (!step.done && performance.now() - started < sliceMs) step = steps.next();
    if (step.done) return step.value;
    await setImmediate();
  }
}
