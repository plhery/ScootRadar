import { describe, expect, it } from 'vitest';
import { runInSlices } from './inSlices';

describe('runInSlices', () => {
  it('returns what the steps return, and lets other work run between slices', async () => {
    const order: string[] = [];
    function* steps(): Generator<void, number> {
      for (let step = 0; step < 3; step++) {
        order.push(`step ${step}`);
        yield;
      }
      return 42;
    }
    setImmediate(() => order.push('other work'));
    // A slice of no time takes one step at a time.
    await expect(runInSlices(steps(), 0)).resolves.toBe(42);
    expect(order).toEqual(['step 0', 'other work', 'step 1', 'step 2']);
  });

  it('takes the steps in one go while they fit in a slice', async () => {
    const order: string[] = [];
    function* steps(): Generator<void, string> {
      order.push('first');
      yield;
      order.push('second');
      return 'done';
    }
    setImmediate(() => order.push('other work'));
    await expect(runInSlices(steps(), 1_000)).resolves.toBe('done');
    expect(order).toEqual(['first', 'second']);
  });
});
