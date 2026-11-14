import { getDomain } from 'tldts';

// The links a scooter's "Open in" may open, which the feeds give: the URL schemes the operator's app claims and
// the https hosts its links are on, each host's subdomains with it (src/lib/rentalLinks.ts on the website and in
// the cache's answers, ScooterRentalLinkPolicy in both apps). website is what only the website's rules take: a
// host more (Bolt's store link) and the query dropped (Ryde's IMEI). A provider without rental, or with none, has
// every link refused. Until 13 November 2026 (LOG-367) each of the three kept its own table by hand.
const RENTAL_SCHEME = /^[a-z][a-z0-9+.-]*$/;
const RENTAL_HOST = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

// Schemes no operator's app claims, which a browser or the phone itself runs: a link on one would run a script, show
// a page made of the link itself, read a file, call or write to someone, install an app, run a shortcut or start
// whatever app it names. Until 14 November 2026 the list stopped at intent (fresh-eyes review's small fixes).
export const NOT_APP_SCHEMES = new Set([
  'http', 'https', 'javascript', 'vbscript', 'data', 'file', 'blob', 'about', 'content', 'intent',
  'tel', 'telprompt', 'sms', 'smsto', 'mms', 'mailto', 'facetime', 'facetime-audio', 'facetime-group',
  'itms', 'itms-apps', 'itms-appss', 'itms-services', 'market', 'android-app', 'shortcuts', 'prefs', 'app-prefs',
  'ftp', 'sftp', 'ssh', 'smb', 'afp', 'vnc', 'ws', 'wss',
]);

// The deep-link services operators' links go through, each serving every app that signs up under a name of its own:
// Branch (app.link, test-app.link, bnc.lt), Adjust (adj.st, go.link), AppsFlyer (onelink.me), Singular (sng.link),
// Firebase (page.link) and Kochava (smart.link). An operator's host is a name under one (birdapp.app.link,
// lqfa.adj.st, bolt.sng.link); the service's own name would let through the links of every app it serves.
export const LINK_SERVICES = new Set([
  'app.link', 'test-app.link', 'bnc.lt', 'adj.st', 'go.link', 'onelink.me', 'sng.link', 'page.link', 'smart.link',
]);

/**
 * Whether a host may stand for an operator's links, with its subdomains: a host name, not a public suffix
 * ("co.uk", "com.ua", "github.io", by the Public Suffix List, its private part too) nor a deep-link service's own
 * name, either of which would let through the links of anyone with a name under it.
 */
export function rentalHostProblem(host) {
  if (typeof host !== 'string' || !RENTAL_HOST.test(host)) return 'needs to be a lower-case host name';
  if (getDomain(host, { allowPrivateDomains: true }) === null) return 'is a public suffix, under which anyone has a name';
  if (LINK_SERVICES.has(host)) return 'is a deep-link service, under which every app it serves has a name';
  return null;
}

/** What is wrong with a provider's rental links, or null. */
export function rentalProblem(rental) {
  const only = (object, names) => typeof object === 'object' && object !== null && !Array.isArray(object)
    && Object.keys(object).every(name => names.includes(name));
  const distinct = values => Array.isArray(values) && new Set(values).size === values.length;
  const hostsProblem = (name, hosts) => {
    if (!distinct(hosts)) return `${name} need to be distinct host names`;
    for (const host of hosts) {
      const problem = rentalHostProblem(host);
      if (problem) return `${name}: ${JSON.stringify(host)} ${problem}`;
    }
    return null;
  };
  if (!only(rental, ['schemes', 'hosts', 'website', 'note'])) return 'takes schemes, hosts, website and note';
  // The schemes are the app's own: a link on http is never a rental's, and one on https is told by its host.
  if (!distinct(rental.schemes) || !rental.schemes.every(scheme => typeof scheme === 'string' && RENTAL_SCHEME.test(scheme))
    || rental.schemes.some(scheme => NOT_APP_SCHEMES.has(scheme))) {
    return `schemes need to be distinct lower-case URL schemes of the operator's app, none of ${[...NOT_APP_SCHEMES].join(', ')}`;
  }
  const problem = hostsProblem('hosts', rental.hosts);
  if (problem) return problem;
  const { website } = rental;
  if (website !== undefined) {
    if (!only(website, ['hosts', 'withoutQuery']) || Object.keys(website).length === 0) {
      return 'website takes hosts and withoutQuery';
    }
    if (website.hosts !== undefined) {
      if (!Array.isArray(website.hosts) || website.hosts.length === 0 || website.hosts.some(host => rental.hosts.includes(host))) {
        return 'website.hosts need to be host names besides hosts';
      }
      const websiteProblem = hostsProblem('website.hosts', website.hosts);
      if (websiteProblem) return websiteProblem;
    }
    if (website.withoutQuery !== undefined && website.withoutQuery !== true) {
      return 'website.withoutQuery is true or left out';
    }
  }
  if (rental.note !== undefined && (typeof rental.note !== 'string' || !rental.note.trim())) {
    return 'note needs to be text';
  }
  return null;
}
