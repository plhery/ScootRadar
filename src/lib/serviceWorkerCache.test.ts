// @vitest-environment node
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vitest';

const script = readFileSync('public/sw.js', 'utf8');
const origin = 'https://scootradar.com';
const shellUrl = `${origin}/map`;
const mapChunk = `${origin}/_next/static/chunks/map.js`;

const keyOf = (request: Request | string) => (typeof request === 'string' ? request : request.url);

class MemoryCache {
  readonly entries = new Map<string, Response>();
  async match(request: Request | string) { return this.entries.get(keyOf(request))?.clone(); }
  async put(request: Request | string, response: Response) {
    this.entries.delete(keyOf(request));
    this.entries.set(keyOf(request), response);
  }
  async delete(request: Request | string) { return this.entries.delete(keyOf(request)); }
  async keys() { return [...this.entries.keys()].map(url => new Request(url)); }
}

const shell = (release: string) => new Response(`<script src="/_next/static/chunks/${release}.js"></script>`, {
  headers: { 'Content-Security-Policy': `script-src 'nonce-${release}'` },
});

function appWorker(server: Record<string, () => Response>) {
  const listeners = new Map<string, (event: Record<string, unknown>) => void>();
  const caches = new Map<string, MemoryCache>();
  const pages = new Map<string, { url: string; navigate: ReturnType<typeof vi.fn> }>();
  const fetch = vi.fn(async (request: Request) => server[new URL(request.url).pathname]?.() ?? new Response('Not found', { status: 404 }));
  const cache = (name: string) => {
    if (!caches.has(name)) caches.set(name, new MemoryCache());
    return caches.get(name)!;
  };
  const navigationPreload = { enable: vi.fn().mockResolvedValue(undefined), disable: vi.fn().mockResolvedValue(undefined) };
  runInNewContext(script, {
    URL, Request, Response, fetch,
    caches: {
      open: async (name: string) => cache(name),
      keys: async () => [...caches.keys()],
      delete: async (name: string) => caches.delete(name),
    },
    self: {
      location: new URL(origin),
      registration: { navigationPreload },
      clients: { get: async (id: string) => pages.get(id), matchAll: async () => [], claim: async () => undefined },
      addEventListener: (name: string, listener: (event: Record<string, unknown>) => void) => {
        listeners.set(name, listener);
      },
    },
  });
  return {
    fetch, pages, navigationPreload,
    async activate() {
      const promises: Promise<unknown>[] = [];
      listeners.get('activate')?.({ waitUntil: (promise: Promise<unknown>) => promises.push(promise) });
      await Promise.all(promises);
    },
    appCache: () => cache('scooters-app-v6'),
    assetCache: () => cache('scooters-assets-v4'),
    open(id: string, url: string) {
      const page = { url, navigate: vi.fn().mockResolvedValue(null) };
      pages.set(id, page);
      return page;
    },
    async request(url: string, event: Record<string, unknown> = {}) {
      const promises: Promise<unknown>[] = [];
      let response: Promise<Response> | undefined;
      listeners.get('fetch')?.({
        request: new Request(url),
        ...event,
        respondWith: (promise: Promise<Response>) => { response = promise; },
        waitUntil: (promise: Promise<unknown>) => promises.push(promise),
      });
      const answer = await response;
      // Some work is only handed over once the answer is known.
      await Promise.all(promises);
      return answer;
    },
  };
}

function launch(worker: ReturnType<typeof appWorker>, id: string) {
  // Only a browser makes navigations.
  const request = Object.defineProperty(new Request(`${shellUrl}?theme=dark`), 'mode', { value: 'navigate' });
  // As Safari gives it for a launch answered from the cache: never settled.
  const preloadResponse = new Promise<never>(() => {});
  return worker.request(shellUrl, { request, preloadResponse, resultingClientId: id });
}

it('follows the server from launch to launch, where Safari never settles a preload', async () => {
  const worker = appWorker({ '/map': () => shell('new') });
  await worker.appCache().put(shellUrl, shell('old'));

  expect(await (await launch(worker, 'kept'))!.text()).toContain('chunks/old.js');
  expect(await (await worker.appCache().match(shellUrl))!.text()).toContain('chunks/new.js');
});

it('turns off the navigation preload an earlier worker turned on', async () => {
  const worker = appWorker({});
  await worker.activate();
  expect(worker.navigationPreload.disable).toHaveBeenCalledOnce();
  expect(worker.navigationPreload.enable).not.toHaveBeenCalled();
});

it('opens a map kept from an older release again from the network once its files are gone from the server', async () => {
  const worker = appWorker({ '/map': () => shell('new') });
  await worker.appCache().put(shellUrl, shell('old'));

  expect(await (await launch(worker, 'kept'))!.text()).toContain('chunks/old.js');
  const page = worker.open('kept', `${shellUrl}?theme=dark`);
  const missing = await worker.request(`${origin}/_next/static/chunks/old.js`, { clientId: 'kept' });

  expect(missing!.status).toBe(404);
  expect(page.navigate).toHaveBeenCalledWith(`${shellUrl}?theme=dark`);
  // Not the old shell, nor the new one kept while the old one ran: the next one comes from the server.
  expect(await worker.appCache().match(shellUrl)).toBeUndefined();

  expect(await (await launch(worker, 'fresh'))!.text()).toContain('chunks/new.js');
});

it('does not open a map from the network over and over where the server itself lacks a file', async () => {
  const worker = appWorker({ '/map': () => shell('broken') });

  await launch(worker, 'fresh');
  const page = worker.open('fresh', shellUrl);
  expect((await worker.request(`${origin}/_next/static/chunks/broken.js`, { clientId: 'fresh' }))!.status).toBe(404);
  expect(page.navigate).not.toHaveBeenCalled();
});

it('shows the map the server gives where it cannot be kept, rather than calling the app offline', async () => {
  const worker = appWorker({ '/map': () => new Response('without a nonce') });
  const response = await launch(worker, 'fresh');
  expect(response!.status).toBe(200);
  expect(await response!.text()).toBe('without a nonce');
});

it('keeps only the files of the map, so the pages around it do not push them out', async () => {
  const worker = appWorker({ '/_next/static/chunks/map.js': () => new Response('map'), '/_next/static/chunks/de.js': () => new Response('de') });
  worker.open('map', `${shellUrl}?theme=dark`);
  worker.open('landing', `${origin}/de`);

  await worker.request(`${origin}/_next/static/chunks/de.js`, { clientId: 'landing' });
  expect(await (await worker.request(mapChunk, { clientId: 'map' }))!.text()).toBe('map');
  expect([...worker.assetCache().entries.keys()]).toEqual([mapChunk]);

  // What the map keeps, the other pages are given from the cache all the same.
  expect(await (await worker.request(mapChunk, { clientId: 'landing' }))!.text()).toBe('map');
  expect(worker.fetch).toHaveBeenCalledTimes(2);
});
