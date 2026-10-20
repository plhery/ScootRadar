// The files the scooter cache is built from, as server/deploy-watch-paths.txt lists them: CI's
// deploy job redeploys the cache when a commit that passed changes one (DEPLOY.md). * stays within
// a folder, ** crosses folders, the last matching line wins and a "!" line excludes.
import { readFileSync } from 'node:fs';

export const watchPaths = readFileSync(new URL('../server/deploy-watch-paths.txt', import.meta.url), 'utf8')
  .split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));

const pattern = (/** @type {string} */ glob) => new RegExp(`^${glob
  .replace(/[.+^${}()|\\]/g, '\\$&')
  .replace(/\*\*\/?|\*|\?/g, wildcard => wildcard === '?' ? '[^/]' : wildcard === '*' ? '[^/]*' : '.*')}$`);

/**
 * Whether changing the file, a path from the repository's root, redeploys the cache.
 * @param {string} file
 */
export function cacheDeploys(file) {
  return watchPaths.reduce((/** @type {boolean | null} */ included, line) => {
    const exclusion = line.startsWith('!');
    return pattern(exclusion ? line.slice(1) : line).test(file) ? !exclusion : included;
  }, null) === true;
}
