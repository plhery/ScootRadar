import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const lintPackages = new Set([
  'eslint-config-next',
  '@next/eslint-plugin-next',
  'fast-glob',
  'micromatch',
  'braces',
  'eslint',
  '@eslint/config-array',
  '@eslint/eslintrc',
  '@eslint-community/eslint-utils',
  'eslint-plugin-import',
  'eslint-plugin-jsx-a11y',
  'eslint-plugin-react',
  'typescript-eslint',
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser',
  '@typescript-eslint/type-utils',
  '@typescript-eslint/utils',
  'minimatch',
]);
const lintAdvisories = {
  braces: { version: '3.0.3', url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm' },
  minimatch: { version: '3.1.5', url: 'https://github.com/advisories/GHSA-g3hv-75wg-m249' },
};

export function checkAuditReport(report, packages) {
  if (report.auditReportVersion !== 2 || report.error || !report.vulnerabilities) {
    throw new Error('npm did not return a valid dependency audit.');
  }

  // The braces advisory is unpatched and only processes repository-controlled
  // lint patterns. The minimatch one is fixed only in minimatch 11, and ESLint
  // and its plugins still need minimatch 3, which has no `optimizationLevel` and
  // none of the `**/../` rewriting the advisory amplifies. Check npm's inherited
  // findings too, down to the advisories behind them, without accepting another
  // advisory or allowing the vulnerable dependency into the production
  // dependency graph.
  function isLintException(name) {
    const seen = new Set();
    let advisories = 0;
    function walk(name) {
      if (seen.has(name)) return true;
      seen.add(name);
      const finding = report.vulnerabilities[name];
      if (!lintPackages.has(name) || !finding?.nodes?.length || !finding.via?.length) return false;
      if (!finding.nodes.every(node => packages[node]?.dev === true)) return false;
      return finding.via.every(cause => {
        if (typeof cause === 'string') return walk(cause);
        advisories += 1;
        const accepted = lintAdvisories[name];
        return cause.name === name && cause.url === accepted?.url
          && finding.nodes.every(node => packages[node].version === accepted.version);
      });
    }
    return walk(name) && advisories > 0;
  }

  const failures = [];
  const exceptions = [];
  for (const [name, finding] of Object.entries(report.vulnerabilities)) {
    if (['info', 'low'].includes(finding.severity)) continue;
    if (!['moderate', 'high', 'critical'].includes(finding.severity)) {
      throw new Error(`Unrecognized audit severity for ${name}.`);
    }
    (isLintException(name) ? exceptions : failures).push(name);
  }
  return { failures, exceptions };
}

function main() {
  const audit = spawnSync('npm', ['audit', '--json', '--audit-level=moderate'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (audit.error || ![0, 1].includes(audit.status)) {
    throw new Error(audit.error?.message || audit.stderr || 'npm audit failed.');
  }
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  const report = JSON.parse(audit.stdout);
  const { failures, exceptions } = checkAuditReport(report, lock.packages);
  if (exceptions.length) {
    const urls = Object.values(lintAdvisories).map(advisory => advisory.url);
    console.log(`Known development-only lint advisories: ${urls.join(', ')}`);
    console.log(`Affected lint packages: ${exceptions.join(', ')}`);
  }
  if (failures.length) {
    for (const name of failures) {
      console.error(`${name}: ${JSON.stringify(report.vulnerabilities[name])}`);
    }
    process.exitCode = 1;
  } else {
    console.log('Dependency audit passed: no unexcepted moderate or higher advisories.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
