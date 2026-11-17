import { describe, expect, it } from 'vitest';
import { checkAuditReport } from './check-dependency-audit.mjs';

function lintAudit() {
  const chain = ['braces', 'micromatch', 'fast-glob', '@next/eslint-plugin-next', 'eslint-config-next'];
  const packages = {};
  const vulnerabilities = {};
  for (const [index, name] of chain.entries()) {
    const node = `node_modules/${name}`;
    packages[node] = { dev: true, version: name === 'braces' ? '3.0.3' : '1.0.0' };
    vulnerabilities[name] = {
      severity: 'high',
      nodes: [node],
      via: index ? [chain[index - 1]] : [{
        name: 'braces',
        url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm',
      }],
    };
  }
  return { report: { auditReportVersion: 2, vulnerabilities }, packages };
}

function minimatchAudit() {
  const vias = {
    minimatch: [{ name: 'minimatch', url: 'https://github.com/advisories/GHSA-g3hv-75wg-m249' }],
    eslint: ['@eslint-community/eslint-utils', 'minimatch'],
    '@eslint-community/eslint-utils': ['eslint'],
    'eslint-plugin-import': ['minimatch'],
    'eslint-config-next': ['eslint', 'eslint-plugin-import'],
  };
  const packages = {};
  const vulnerabilities = {};
  for (const [name, via] of Object.entries(vias)) {
    const node = `node_modules/${name}`;
    packages[node] = { dev: true, version: name === 'minimatch' ? '3.1.5' : '1.0.0' };
    vulnerabilities[name] = { severity: 'moderate', nodes: [node], via };
  }
  return { report: { auditReportVersion: 2, vulnerabilities }, packages };
}

describe('CI dependency audit', () => {
  it('accepts a clean audit and the single unpatched lint advisory with inherited findings', () => {
    expect(checkAuditReport({ auditReportVersion: 2, vulnerabilities: {} }, {})).toEqual({
      failures: [], exceptions: [],
    });
    const { report, packages } = lintAudit();
    expect(checkAuditReport(report, packages)).toEqual({
      failures: [], exceptions: Object.keys(report.vulnerabilities),
    });
  });

  it('rejects the lint advisory when any affected package is also a production dependency', () => {
    const { report, packages } = lintAudit();
    delete packages['node_modules/braces'].dev;
    expect(checkAuditReport(report, packages).failures).toEqual(Object.keys(report.vulnerabilities));
  });

  it('rejects another advisory in the same lint dependency chain', () => {
    const { report, packages } = lintAudit();
    report.vulnerabilities.braces.via.push({ name: 'braces', url: 'https://github.com/advisories/new-advisory' });
    expect(checkAuditReport(report, packages).failures).toEqual(Object.keys(report.vulnerabilities));
  });

  it('rejects moderate findings outside the lint chain, including development dependencies', () => {
    const { report, packages } = lintAudit();
    report.vulnerabilities['dev-tool'] = { severity: 'moderate', nodes: ['node_modules/dev-tool'], via: ['braces'] };
    packages['node_modules/dev-tool'] = { dev: true };
    expect(checkAuditReport(report, packages).failures).toEqual(['dev-tool']);
  });

  it('accepts the unpatched picomatch advisory on both installed versions through Vitest, and nowhere else', () => {
    const picomatchAudit = () => {
      const vias = {
        picomatch: [{ name: 'picomatch', url: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf' }],
        micromatch: ['picomatch'],
        tinyglobby: ['picomatch'],
        vitest: ['picomatch', 'tinyglobby'],
      };
      const packages = {
        'node_modules/picomatch': { dev: true, version: '4.0.7' },
        'node_modules/micromatch/node_modules/picomatch': { dev: true, version: '2.3.2' },
      };
      const vulnerabilities = {};
      for (const [name, via] of Object.entries(vias)) {
        const nodes = name === 'picomatch' ? Object.keys(packages) : [`node_modules/${name}`];
        if (name !== 'picomatch') packages[nodes[0]] = { dev: true, version: '1.0.0' };
        vulnerabilities[name] = { severity: 'high', nodes, via };
      }
      return { report: { auditReportVersion: 2, vulnerabilities }, packages };
    };
    const { report, packages } = picomatchAudit();
    expect(checkAuditReport(report, packages)).toEqual({ failures: [], exceptions: Object.keys(report.vulnerabilities) });
    const updated = picomatchAudit();
    updated.packages['node_modules/picomatch'].version = '4.0.8';
    expect(checkAuditReport(updated.report, updated.packages).failures).toEqual(Object.keys(updated.report.vulnerabilities));
    const shipped = picomatchAudit();
    delete shipped.packages['node_modules/picomatch'].dev;
    expect(checkAuditReport(shipped.report, shipped.packages).failures).toEqual(Object.keys(shipped.report.vulnerabilities));
  });

  it('rejects missing lockfile entries and additional production copies of braces', () => {
    const { report, packages } = lintAudit();
    report.vulnerabilities.braces.nodes.push('node_modules/runtime/node_modules/braces');
    expect(checkAuditReport(report, packages).failures).toEqual(Object.keys(report.vulnerabilities));
    packages['node_modules/runtime/node_modules/braces'] = { version: '3.0.3' };
    expect(checkAuditReport(report, packages).failures).toEqual(Object.keys(report.vulnerabilities));
  });

  it('rejects a different braces version so the exception must be reviewed after an update', () => {
    const { report, packages } = lintAudit();
    packages['node_modules/braces'].version = '3.0.4';
    expect(checkAuditReport(report, packages).failures).toEqual(Object.keys(report.vulnerabilities));
  });

  it('accepts the minimatch 3 advisory through ESLint, whose findings inherit from each other', () => {
    const { report, packages } = minimatchAudit();
    expect(checkAuditReport(report, packages)).toEqual({
      failures: [], exceptions: Object.keys(report.vulnerabilities),
    });
  });

  it('rejects the minimatch advisory on another version or in production', () => {
    const { report, packages } = minimatchAudit();
    packages['node_modules/minimatch'].version = '10.2.6';
    expect(checkAuditReport(report, packages).failures).toEqual(Object.keys(report.vulnerabilities));
    packages['node_modules/minimatch'] = { version: '3.1.5' };
    expect(checkAuditReport(report, packages).failures).toEqual(Object.keys(report.vulnerabilities));
  });

  it('rejects broken audit responses and dependency cycles', () => {
    expect(() => checkAuditReport({ error: { message: 'registry unavailable' } }, {})).toThrow();
    const { report, packages } = lintAudit();
    report.vulnerabilities.braces.via = ['micromatch'];
    expect(checkAuditReport(report, packages).failures).toEqual(Object.keys(report.vulnerabilities));
  });
});
