import { CLIENT_PARAMETERS } from '@/lib/clientParams';

/**
 * Where the map is. It was at "/" until the landing page took that place, and
 * what still asks for it there is sent on: a link that carries what only the
 * map reads, and a web app installed while "/" was where it opened.
 */
export const MAP_PATH = '/map';

/** The map, opened on a place: a city's centre, say. */
export function mapAt([lat, lng]: readonly [number, number]): string {
  return `${MAP_PATH}?origin=${lat},${lng}`;
}

/** The answer to a link to the map as it was at "/", or nothing for any other request. */
export function movedMapRedirect(request: Request): Response | null {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;

  const url = new URL(request.url);
  if (url.pathname !== '/' || !CLIENT_PARAMETERS.some(name => url.searchParams.has(name))) return null;

  url.pathname = MAP_PATH;
  return Response.redirect(url, 308);
}

/**
 * The same on the landing page itself, before anything is painted: where no
 * Worker answers first, and for an installed web app, which only the browser
 * can tell from a visitor. Written as text because it is not part of any
 * bundle; the Worker gives it the nonce of the response.
 */
export const MOVED_MAP_SCRIPT = `(function () {
  try {
    if (location.pathname !== '/') return;
    var link = new URLSearchParams(location.search);
    var forTheMap = ${JSON.stringify(CLIENT_PARAMETERS)}.some(function (name) { return link.has(name); });
    var installed = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
    if (forTheMap || installed) location.replace('${MAP_PATH}' + location.search + location.hash);
  } catch (error) {}
})();`;
