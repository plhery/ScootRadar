// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAP_PASS_PATH } from '@/lib/mapPass';
import { askForMapPass, MAP_PASS_DELAY_MS, MAP_PASS_URGENT_RETRY_MS, mapPassNow, noteMapPassUnheld,
  resetMapPassForTests } from '@/lib/mapPassClient';

const fetcher = vi.fn<(input: string, init: RequestInit) => Promise<Response>>();
const render = vi.fn((_container: HTMLElement, options: Record<string, unknown>) => {
  queueMicrotask(() => (options.callback as (token: string) => void)('turnstile-token'));
  return 'widget';
});

beforeEach(() => {
  vi.useFakeTimers();
  resetMapPassForTests();
  fetcher.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
  render.mockClear();
  vi.stubGlobal('fetch', fetcher);
  window.turnstile = { render, remove: vi.fn() };
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete window.turnstile;
});

describe('the map pass, asked for at once', () => {
  it('asks Turnstile without waiting, and the Worker for the pass it gives', async () => {
    await expect(mapPassNow()).resolves.toBe(true);
    expect(render).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith(MAP_PASS_PATH, expect.objectContaining({ method: 'POST',
      body: JSON.stringify({ token: 'turnstile-token' }) }));
  });

  it('joins the background try under way rather than starting another', async () => {
    askForMapPass(Date.now());
    const now = mapPassNow();
    await vi.advanceTimersByTimeAsync(MAP_PASS_DELAY_MS);
    await expect(now).resolves.toBe(true);
    expect(render).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('does not try again within half a minute of a try that failed, or of a pass that was not held', async () => {
    fetcher.mockResolvedValueOnce(new Response(null, { status: 403 }));
    await expect(mapPassNow()).resolves.toBe(false);
    await expect(mapPassNow()).resolves.toBe(false);
    expect(fetcher).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(MAP_PASS_URGENT_RETRY_MS);
    await expect(mapPassNow()).resolves.toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);
    noteMapPassUnheld();
    await expect(mapPassNow()).resolves.toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
