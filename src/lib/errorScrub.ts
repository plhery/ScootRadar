/**
 * What an error report of the website may say (src/lib/errorReports.ts), for Umami and Sentry
 * alike, and which errors are not the website's to report.
 */

/** Errors of the network, or of a request the page itself gave up: not the page's. */
export const IGNORED_ERRORS: RegExp[] = [
  /^(?:TypeError: )?(?:Failed to fetch|Load failed|NetworkError when attempting to fetch resource|Network request failed|The network connection was lost|The Internet connection appears to be offline)\b/,
  // How Safari says a request was cancelled, as when the page is left, in some of its languages.
  /^(?:TypeError: )?(?:cancell?ed|annulé|abgebrochen|cancelado|annullato|anulowano)$/i,
  /^(?:AbortError|TimeoutError)\b/,
  /\b(?:The operation was aborted|The user aborted a request|signal is aborted without reason|signal timed out)/i,
  // A script that did not arrive.
  /^ChunkLoadError\b/,
  /Failed to load chunk|Loading chunk [\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i,
  /^ResizeObserver loop/,
];

/** Whether an error, by its name and message, is one of the IGNORED_ERRORS. */
export function ignoredError(name: string, message: string): boolean {
  return IGNORED_ERRORS.some(pattern => pattern.test(message) || pattern.test(`${name}: ${message}`));
}

/** Where browser extensions' code lives, in each browser: an address that starts so is one. */
export const EXTENSION = /^(?:[a-z]+(?:-web)?-extension|webkit-masked-url|extensions?|resource):/i;
const EXTENSION_IN_STACK = /(?:^|[\s(@])(?:[a-z]+(?:-web)?-extension|webkit-masked-url|extensions?|resource):/im;

/** Whether a stack runs through a browser extension's code. */
export function extensionStack(stack: string): boolean {
  return EXTENSION_IN_STACK.test(stack);
}

/** Where the site's own scripts are. */
export function ownScripts(origin: string): string {
  return `${origin}/_next/`;
}

// An absolute address, or a path where a word could start. Either may hold a pair of brackets, as
// the folder of a group of pages (`app/(map)/…`), but ends before the bracket that closes a
// stack's frame: `at render (https://…/a.js:1:20)`.
const ADDRESS = /\b[a-z][a-z\d+.-]*:\/\/(?:[^\s"'`<>\\()]|\([^\s"'`<>\\()]*\))+|(^|[\s"'`(=])(\/(?:[^\s"'`<>\\()]|\([^\s"'`<>\\()]*\))*)/gi;
// Not across an address's `://`, as Firefox's frames are written: `render@https://…`.
const EMAIL = /[^\s@"'`<>()/:]+@[^\s@"'`<>()/:]+\.[a-z]{2,}/gi;
// A number with three decimals or more: a coordinate to about 100 m, or closer.
const DECIMAL = /-?\d+\.\d{3,}/g;
// Quoted text, from a quote that does not end a word to one that does not start one.
const QUOTED = /(^|[^\w])("[^"\n]*"|'[^'\n]*'|`[^`\n]*`|“[^”\n]*”|‘[^’\n]*’|«[^»\n]*»)(?!\w)/g;
const RUN = /[\w-]{8,}/g;

/**
 * An address without its query and fragment, where the map's coordinates travel, nor a name and
 * password before its host. A segment of its path of six characters or more with a digit, or
 * with three digits in a row, reads `:id`. The site's scripts keep their names, by which their
 * source maps are found.
 */
export function scrubAddress(address: string): string {
  const start = /^([a-z][a-z\d+.-]*:\/\/)(?:[^/?#@]*@)?([^/?#]*)/i.exec(address);
  const origin = start ? start[1] + start[2] : '';
  const path = address.slice(start?.[0].length ?? 0).split(/[?#]/, 1)[0];
  if (path.startsWith('/_next/')) return origin + path;
  return origin + path
    .split('/')
    .map(segment => (segment.length >= 6 && /\d/.test(segment)) || /\d{3}/.test(segment) ? ':id' : segment)
    .join('/');
}

/** Text between addresses, without what could be a person's or a place's. */
function scrubWords(text: string): string {
  return text
    .replace(DECIMAL, '[Filtered]')
    .replace(QUOTED, (_, before: string, quoted: string) =>
      quoted.length > 42 || /\s/.test(quoted) ? `${before}${quoted[0]}[Filtered]${quoted.at(-1)}` : before + quoted)
    .replace(RUN, run => {
      const digits = run.replace(/\D/g, '').length;
      return digits >= 4 || (digits > 0 && run.length >= 20) || run.length >= 32 ? '[Filtered]' : run;
    });
}

/**
 * An error's message or stack, as a report may give it. Its addresses lose their query and
 * fragment (scrubAddress), and the rest loses email addresses, numbers with three decimals or
 * more (a coordinate), quoted text with a space in it or over 40 characters (what a search may
 * be), and anything shaped like a key or a long number: a run of eight characters or more with
 * four digits, of twenty or more with one, or of thirty-two or more. A quoted name, as `'map'`
 * in "Cannot read properties of undefined (reading 'map')", stays.
 */
export function scrubText(text: string): string {
  const unmailed = text.replace(EMAIL, '[Filtered]');
  let scrubbed = '';
  let last = 0;
  for (const match of unmailed.matchAll(ADDRESS)) {
    const [whole, before, path] = match;
    const start = match.index + (path === undefined ? 0 : before.length);
    scrubbed += scrubWords(unmailed.slice(last, start)) + scrubAddress(path ?? whole);
    last = match.index + whole.length;
  }
  return scrubbed + scrubWords(unmailed.slice(last));
}
