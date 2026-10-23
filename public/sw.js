const CACHE_PREFIX = "scooters";
const LEGACY_CACHE_PREFIXES = ["swiss-scooters", "zurich-scooter"];
// The addresses the app had before: an app installed there is moved here.
const MOVED_ORIGIN = ["swiss-scooters.plhery.com", "zurich-scooter.plhery.com", "scooters.plhery.com"].includes(
  self.location.hostname
) ? "https://scootradar.com" : null;
const APP_CACHE = `${CACHE_PREFIX}-app-v6`;
const ASSET_CACHE = `${CACHE_PREFIX}-assets-v4`;
// The map. It was at "/" until the landing page took that place.
const APP_SHELL_PATH = "/map";
const APP_SHELL_URL = new URL(APP_SHELL_PATH, self.location.origin).toString();
const UPDATE_MARKER_URL = new URL(
  "/__pwa-update-pending__",
  self.location.origin
).toString();
const PUBLIC_ASSET_PATHS = new Set([
  "/favicon.ico",
  "/icon-180.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon.svg",
  "/manifest.json",
]);
const MAX_ASSET_ENTRIES = 80;
// The address in Safari's Smart App Banner, which the iPhone app opens on. The
// Worker writes in the one each page was asked for (src/lib/appStore.ts).
const BANNER_ARGUMENT = /(<meta name="apple-itunes-app" content="[^"]*?app-argument=)[^,"]*/;

let shellRefreshPromise = null;
// The pages the kept shell opened. It can be of an older release than the
// server's, whose files are gone from there.
const openedFromKeptShell = new Set();

self.addEventListener("install", (event) => {
  if (MOVED_ORIGIN) {
    event.waitUntil(self.skipWaiting());
    return;
  }

  event.waitUntil(
    (async () => {
      const [appCache, assetCache] = await Promise.all([
        caches.open(APP_CACHE),
        caches.open(ASSET_CACHE),
      ]);
      const shellResponse = await fetch(
        new Request(APP_SHELL_URL, { cache: "no-store" })
      );

      if (!shellResponse.ok || !responseNonce(shellResponse)) {
        throw new Error("Could not cache the app shell");
      }

      await appCache.put(APP_SHELL_URL, shellResponse);
      await Promise.all(
        [...PUBLIC_ASSET_PATHS].map(async (path) => {
          const url = new URL(path, self.location.origin).toString();
          const response = await fetch(new Request(url, { cache: "no-store" }));
          if (response.ok) await assetCache.put(url, response);
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const activeCaches = new Set(MOVED_ORIGIN ? [] : [APP_CACHE, ASSET_CACHE]);
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => (
            (name.startsWith(`${CACHE_PREFIX}-`) ||
              LEGACY_CACHE_PREFIXES.some((prefix) => name.startsWith(`${prefix}-`))) &&
            !activeCaches.has(name)
          ))
          .map((name) => caches.delete(name))
      );

      if (MOVED_ORIGIN) {
        await self.clients.claim();
        const clients = await self.clients.matchAll({ type: "window" });
        await Promise.allSettled(clients.map((client) => {
          const destination = movedPageUrl(client.url);
          return destination ? client.navigate(destination) : Promise.resolve();
        }));
        return;
      }

      // Off, where an earlier worker turned it on: Safari never settles the
      // preload of a launch answered from the cache, and the shell's update
      // waited for it for good.
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.disable();
        } catch {
          // Navigation preload is an optional optimization.
        }
      }

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (MOVED_ORIGIN) {
    const destination = movedPageUrl(request.url);
    if (request.mode === "navigate" && destination) {
      event.respondWith(Response.redirect(destination, 308));
    }
    return;
  }

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (
    request.mode === "navigate" &&
    url.origin === self.location.origin &&
    url.pathname === APP_SHELL_PATH
  ) {
    const refresh = refreshAppShell(request);
    event.waitUntil(refresh.then(() => undefined));
    event.respondWith(serveAppShell(request, refresh, event.resultingClientId));
    return;
  }

  if (
    request.mode === "navigate" &&
    url.origin === self.location.origin &&
    url.pathname === "/"
  ) {
    event.respondWith(landingPage(request));
    return;
  }

  if (
    url.origin === self.location.origin &&
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(appFile(event));
    return;
  }

  if (
    url.origin === self.location.origin &&
    PUBLIC_ASSET_PATHS.has(url.pathname)
  ) {
    event.respondWith(networkFirst(request));
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
    return;
  }

  if (MOVED_ORIGIN || event.data?.type !== "CHECK_FOR_UPDATE") return;

  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_CACHE);
      if (await cache.match(UPDATE_MARKER_URL)) {
        event.source?.postMessage({ type: "APP_UPDATED" });
        return;
      }

      await refreshAppShell(
        new Request(APP_SHELL_URL, { cache: "no-store" })
      );
    })()
  );
});

function movedPageUrl(source) {
  const url = new URL(source);
  if (!MOVED_ORIGIN || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return null;
  }
  // Only an installed app has this worker, and where it opens "/" that was the map.
  const path = url.pathname === "/" ? APP_SHELL_PATH : url.pathname;
  return `${MOVED_ORIGIN}${path}${url.search}${url.hash}`;
}

// The landing page is not kept: it comes from the network. Without one, an app
// installed while "/" was the map still opens on the map.
async function landingPage(request) {
  try {
    return await fetch(request);
  } catch {
    return Response.redirect(APP_SHELL_URL, 302);
  }
}

async function serveAppShell(request, refresh, clientId) {
  const cache = await caches.open(APP_CACHE);
  const [cached, updatePending] = await Promise.all([
    cache.match(APP_SHELL_URL),
    cache.match(UPDATE_MARKER_URL),
  ]);

  if (cached) {
    // If an update was prepared during an earlier launch, this response is the
    // new shell. Clearing the marker prevents a second, unnecessary reload.
    if (updatePending) await cache.delete(UPDATE_MARKER_URL);
    if (clientId) openedFromKeptShell.add(clientId);
    return openedAt(cached, request.url);
  }

  return (
    (await refresh) ??
    // A page that cannot be kept is shown all the same: only offline is there none.
    (await fetch(request).catch(() => null)) ??
    new Response("The app is unavailable offline until it has loaded once.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  );
}

function refreshAppShell(request) {
  if (shellRefreshPromise) return shellRefreshPromise;

  shellRefreshPromise = (async () => {
    const cache = await caches.open(APP_CACHE);
    const cached = await cache.match(APP_SHELL_URL);

    try {
      const fresh = await fetch(new Request(request, { cache: "no-store" }));

      if (!fresh.ok || !responseNonce(fresh)) return null;

      const changed = cached
        ? (await comparableAppShell(cached)) !== (await comparableAppShell(fresh))
        : false;

      await cache.put(APP_SHELL_URL, fresh.clone());

      if (changed) {
        await cache.put(UPDATE_MARKER_URL, new Response("pending"));
        await broadcastUpdate();
      }

      return fresh;
    } catch {
      return null;
    }
  })().finally(() => {
    shellRefreshPromise = null;
  });

  return shellRefreshPromise;
}

// The kept map was served for another link: its banner is given the link it
// opens now, as the Worker would have written it.
async function openedAt(response, address) {
  const url = new URL(address);
  url.hash = "";
  const argument = url.href.replaceAll(",", "%2C").replaceAll("&", "&amp;");
  const html = await response.clone().text();
  const opened = html.replace(BANNER_ARGUMENT, (_, tag) => `${tag}${argument}`);
  if (opened === html) return response;

  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(opened, { status: response.status, statusText: response.statusText, headers });
}

function responseNonce(response) {
  const contentSecurityPolicy =
    response.headers.get("Content-Security-Policy") ?? "";
  return contentSecurityPolicy.match(/'nonce-([^']+)'/)?.[1] ?? null;
}

async function comparableAppShell(response) {
  const html = await response.clone().text();
  const nonce = responseNonce(response);
  const contentSecurityPolicy =
    response.headers.get("Content-Security-Policy") ?? "";
  // The link a response was asked for, in its banner, makes no new version.
  const page = html.replace(BANNER_ARGUMENT, "$1<link>");
  if (!nonce) return `${contentSecurityPolicy}\n${page}`;

  // Nor does the fresh nonce of every rendered response. Normalize it in both the
  // policy and document so update checks still detect only meaningful changes.
  return `${contentSecurityPolicy.replaceAll(nonce, "<nonce>")}\n${page.replaceAll(
    nonce,
    "<nonce>"
  )}`;
}

// A file of the app never changes under its address: once kept, it comes from
// the cache. Only the map's are kept, as the map is the one page that opens
// offline: the pages around it would only push its files out.
async function appFile(event) {
  const { request, clientId } = event;
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  // A file the server no longer has, for a page of the kept shell: the shell is
  // of an older release, and the page cannot run.
  if (response.status === 404 && openedFromKeptShell.delete(clientId)) {
    event.waitUntil(reopenFromNetwork(clientId));
  }
  if (!response.ok || !(await askedByMap(clientId))) return response;

  await cache.put(request, response.clone());
  const keys = await cache.keys();
  await Promise.all(
    keys.slice(0, Math.max(keys.length - MAX_ASSET_ENTRIES, 0)).map((key) =>
      cache.delete(key)
    )
  );
  return response;
}

async function askedByMap(clientId) {
  const client = clientId ? await self.clients.get(clientId) : undefined;
  // A request the browser does not tie to a page is kept, as everything was.
  return !client || new URL(client.url).pathname === APP_SHELL_PATH;
}

// The page opens again from the network, with the release whose files the
// server has, and that shell is kept instead.
async function reopenFromNetwork(clientId) {
  // An update check under way would keep a shell again just after.
  await shellRefreshPromise;
  const cache = await caches.open(APP_CACHE);
  await Promise.all([
    cache.delete(APP_SHELL_URL),
    cache.delete(UPDATE_MARKER_URL),
  ]);

  const client = await self.clients.get(clientId);
  try {
    await client?.navigate(client.url);
  } catch {
    // Safari before 16 cannot: the next launch comes from the network.
  }
}

async function networkFirst(request) {
  const cache = await caches.open(ASSET_CACHE);

  try {
    const response = await fetch(new Request(request, { cache: "no-store" }));
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached ?? Response.error();
  }
}

async function broadcastUpdate() {
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of clients) {
    client.postMessage({ type: "APP_UPDATED" });
  }
}
