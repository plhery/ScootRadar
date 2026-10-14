import { describe, expect, it } from 'vitest';
import { holdOffMs, hostPacer } from './host-pacing.mjs';

// A clock that only moves when the pacer sleeps.
function clock() {
  let time = 0;
  const sent = [];
  return { now: () => time, sleep: async ms => { time += ms; }, sent, at: () => time };
}

describe('the pacing of the feed checks', () => {
  it('sends at most two requests a second to one host, and does not hold up the others', async () => {
    const time = clock();
    const pacer = hostPacer(500, time);
    const request = async url => { await pacer.wait(url); time.sent.push([new URL(url).hostname, time.at()]); };
    // One request after the other, as one of the check's workers sends them.
    for (let index = 0; index < 4; index++) await request('https://mds.bird.co/gbfs/v2/public/portland/gbfs.json');
    await request('https://data.lime.bike/api/partners/v2/gbfs/portland/gbfs.json');
    expect(time.sent).toEqual([['mds.bird.co', 0], ['mds.bird.co', 500], ['mds.bird.co', 1000], ['mds.bird.co', 1500],
      ['data.lime.bike', 1500]]);
  });

  it('spaces requests sent at once by several workers', async () => {
    let time = 0;
    const slept = [];
    const pacer = hostPacer(500, { now: () => time, sleep: async ms => { slept.push(ms); } });
    await Promise.all([1, 2, 3].map(() => pacer.wait('https://gbfs.api.ridedott.com/public/v2/lyon/gbfs.json')));
    expect(slept).toEqual([500, 1000]);
    time = 400;
    await pacer.wait('https://gbfs.api.ridedott.com/public/v2/paris/gbfs.json');
    expect(slept).toEqual([500, 1000, 1100]);
  });

  it('leaves a host alone as long as it asks', async () => {
    const time = clock();
    const pacer = hostPacer(500, time);
    await pacer.wait('https://mds.bird.co/a');
    pacer.holdOff('https://mds.bird.co/a', holdOffMs(new Response(null, { status: 429, headers: { 'Retry-After': '30' } })));
    await pacer.wait('https://mds.bird.co/b');
    expect(time.at()).toBe(30_000);
    expect(holdOffMs(new Response(null, { status: 403 }))).toBe(10_000);
    expect(holdOffMs(new Response(null, { status: 429, headers: { 'Retry-After': '3600' } }))).toBe(60_000);
  });
});
