// Run by CI's deploy job once every job of CI has passed on a commit pushed to main. It moves the
// branches production deploys from to that commit (DEPLOY.md): `production`, which Workers Builds
// deploys as the website and its Worker, and `production-cache`, which Coolify deploys as the
// scooter cache. A branch only moves forward: a commit whose CI ends after a later one's is left
// out, as the later one carries it.
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { cacheDeploys } from './deploy-watch-paths.mjs';

export const WEBSITE_BRANCH = 'production';
export const CACHE_BRANCH = 'production-cache';

const parisTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/**
 * Whether it is 23:00–05:30 in Paris: Norway's night bans and the 30 minutes Sentry watches after
 * them, when the cache is not restarted (AGENTS.md).
 * @param {Date} date
 */
export function inNightBanHours(date) {
  const [hour, minute] = parisTime.format(date).split(':').map(Number);
  const minutes = hour * 60 + minute;
  return minutes >= 23 * 60 || minutes < 5 * 60 + 30;
}

/**
 * Whether the cache deploys a commit, from the files changed and the commit messages since the
 * commit it runs: only for a file of its own, not when every commit says `[skip cd]` (or
 * `[skip ci]`), and not in the night-ban hours. A change left out goes with the next commit that
 * passes and may deploy.
 * @param {{ files: string[], messages: string[], now: Date }} since
 * @returns {{ deploy: true, changed: string[] } | { deploy: false, reason: string }}
 */
export function cacheDeployment({ files, messages, now }) {
  const changed = files.filter(cacheDeploys);
  if (changed.length === 0) return { deploy: false, reason: 'no file of the cache changed' };
  if (messages.every(message => /\[skip c[di]\]/i.test(message))) {
    return { deploy: false, reason: 'every commit since says [skip cd]' };
  }
  if (inNightBanHours(now)) return { deploy: false, reason: 'it is 23:00–05:30 in Paris, the night-ban hours' };
  return { deploy: true, changed };
}

const git = (/** @type {string[]} */ ...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const short = (/** @type {string} */ commit) => commit.slice(0, 7);

/** Whether `ancestor` is `commit` or comes before it. */
function carries(/** @type {string} */ commit, /** @type {string} */ ancestor) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ancestor, commit]);
    return true;
  } catch (error) {
    if (/** @type {{ status?: number }} */ (error).status === 1) return false;
    throw error;
  }
}

function main() {
  const commit = git('rev-parse', 'HEAD');
  let failed = false;
  for (const branch of [CACHE_BRANCH, WEBSITE_BRANCH]) {
    try {
      // The job's next steps wait for Workers Builds to put the website live, then tell IndexNow.
      if (advance(branch, commit) && branch === WEBSITE_BRANCH && process.env.GITHUB_OUTPUT) {
        appendFileSync(process.env.GITHUB_OUTPUT, 'website=moved\n');
      }
    } catch (error) {
      console.error(`::error title=${branch} not moved::${/** @type {Error} */ (error).message}`);
      failed = true;
    }
  }
  if (failed) process.exitCode = 1;
}

/**
 * Moves the branch to the commit, if the commit is newer and, for the cache, should deploy.
 * Returns whether it moved.
 */
function advance(/** @type {string} */ branch, /** @type {string} */ commit) {
  const tip = git('rev-parse', `refs/remotes/origin/${branch}`);
  if (carries(tip, commit)) {
    console.log(`${branch} is at ${short(tip)}, which carries ${short(commit)} already.`);
    return false;
  }
  if (!carries(commit, tip)) throw new Error(`${branch} (${short(tip)}) is not an ancestor of ${short(commit)}: move it by hand (DEPLOY.md).`);
  if (branch === CACHE_BRANCH) {
    const decision = cacheDeployment({
      files: git('diff', '--name-only', '--no-renames', tip, commit).split('\n').filter(Boolean),
      messages: git('log', '--format=%B%x00', `${tip}..${commit}`).split('\0').map(message => message.trim()).filter(Boolean),
      now: new Date(),
    });
    if (!decision.deploy) {
      console.log(`::notice title=Cache not deployed::${branch} stays at ${short(tip)}: ${decision.reason}.`);
      return false;
    }
    console.log(`The cache's files changed since ${short(tip)}: ${decision.changed.join(', ')}`);
  }
  execFileSync('git', ['push', 'origin', `${commit}:refs/heads/${branch}`], { stdio: 'inherit' });
  console.log(`::notice title=Deployed::${branch} moved from ${short(tip)} to ${short(commit)}.`);
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
