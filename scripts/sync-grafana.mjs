import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

// Makes production Grafana match observability/: the dashboards in grafana/ and
// the rule group in grafana-alerts/scootradar-alerts.json, in the ScootRadar
// folder. Dry run by default; pass --apply to create, update, and delete.
// Requests run through curl inside the Grafana container on the Netcup host,
// so the admin credentials never leave that container.

const root = new URL('../observability/', import.meta.url);
const alerts = JSON.parse(readFileSync(new URL('grafana-alerts/scootradar-alerts.json', root), 'utf8'));
const dashboards = readdirSync(new URL('grafana/', root)).filter(name => name.endsWith('.json')).sort()
  .map(name => JSON.parse(readFileSync(new URL(`grafana/${name}`, root), 'utf8')));

const apply = process.argv.includes('--apply');
const sshHost = process.env.GRAFANA_SSH_HOST ?? 'netcup';
const container = process.env.GRAFANA_CONTAINER ?? 'grafana-o33e3bv1zuhcc78xlz58kbq0';
const datasourceUid = process.env.GRAFANA_PROMETHEUS_DATASOURCE_UID ?? 'cf70hdhgchxj4c';

function grafana(method, path, body, { allowMissing = false } = {}) {
  const curl = [
    'curl -sS -w "\\n%{http_code}"',
    `-X ${method}`,
    '-u "$GF_SECURITY_ADMIN_USER:$GF_SECURITY_ADMIN_PASSWORD"',
    "-H 'Content-Type: application/json'",
    body === undefined ? '' : '--data-binary @-',
    `'http://localhost:3000${path}'`,
  ].join(' ');
  const result = spawnSync('ssh', ['-o', 'BatchMode=yes', sshHost,
    `sudo -n docker exec -i ${container} sh -c '${curl.replaceAll("'", "'\\''")}'`],
  { input: body === undefined ? '' : JSON.stringify(body), encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${method} ${path} failed: ${(result.stderr || result.stdout).trim()}`);
  const output = result.stdout.trimEnd();
  const status = Number(output.slice(output.lastIndexOf('\n') + 1));
  const text = output.slice(0, output.lastIndexOf('\n'));
  if (status === 404 && allowMissing) return null;
  if (status < 200 || status >= 300) throw new Error(`${method} ${path} answered ${status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

function query(rule) {
  return {
    refId: 'A',
    relativeTimeRange: { from: 600, to: 0 },
    datasourceUid,
    model: { datasource: { type: 'prometheus', uid: datasourceUid }, editorMode: 'code', expr: rule.expr,
      instant: true, range: false, intervalMs: 1000, maxDataPoints: 43200, refId: 'A' },
  };
}

// A classic condition makes one alert of every series; a threshold keeps one per
// series, so a rule over feeds notifies each feed with its labels.
function condition(rule) {
  const model = rule.perSeries
    ? { type: 'threshold', expression: 'A', conditions: [{ evaluator: { params: [0.5], type: 'gt' } }] }
    : { type: 'classic_conditions', conditions: [{ evaluator: { params: [0.5], type: 'gt' }, operator: { type: 'and' },
        query: { params: ['A'] }, reducer: { params: [], type: 'last' }, type: 'query' }] };
  return { refId: 'B', relativeTimeRange: { from: 0, to: 0 }, datasourceUid: '__expr__',
    model: { ...model, datasource: { type: '__expr__', uid: '__expr__' }, intervalMs: 1000, maxDataPoints: 43200, refId: 'B' } };
}

function toProvisionedRule(rule) {
  return {
    uid: rule.uid,
    title: rule.title,
    folderUID: alerts.folderUid,
    ruleGroup: alerts.ruleGroup,
    condition: 'B',
    data: [query(rule), condition(rule)],
    noDataState: rule.noDataState,
    execErrState: 'Error',
    for: rule.for,
    annotations: { summary: rule.summary, description: rule.description },
    labels: { service: 'scootradar', severity: rule.severity },
    isPaused: false,
    // A rule may send to its contact point directly, with its own grouping and reminders, rather
    // than through the notification policies (a reminder every 4 hours by default).
    notification_settings: rule.notificationSettings ?? null,
  };
}

function sortedKeys(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sortedKeys(value[key])]))
    : Array.isArray(value) ? value.map(sortedKeys) : value;
}

// What the source decides about a rule; Grafana adds fields of its own to what it stores.
function comparableRule(rule) {
  return JSON.stringify(sortedKeys({
    title: rule.title,
    ruleGroup: rule.ruleGroup,
    condition: rule.condition,
    data: rule.data.map(entry => ({
      refId: entry.refId,
      datasourceUid: entry.datasourceUid,
      relativeTimeRange: entry.relativeTimeRange,
      expr: entry.model?.expr?.replace(/\s+/g, ' '),
      type: entry.model?.type,
      expression: entry.model?.expression,
      evaluators: entry.model?.conditions?.map(condition => condition.evaluator),
    })),
    for: rule.for,
    noDataState: rule.noDataState,
    execErrState: rule.execErrState,
    annotations: rule.annotations,
    labels: rule.labels,
    isPaused: rule.isPaused,
    notification_settings: rule.notification_settings ?? null,
  }));
}

// Grafana adds its own id and version to a stored dashboard.
const comparableDashboard = dashboard => JSON.stringify(sortedKeys({ ...dashboard, id: undefined, version: undefined }));

const folder = grafana('GET', `/api/folders/${alerts.folderUid}`, undefined, { allowMissing: true });
const folderRenamed = folder && folder.title !== alerts.folderTitle;
console.log(`folder ${alerts.folderUid}: ${!folder ? 'create' : folderRenamed ? 'rename' : 'exists'}`);

const dashboardChanges = dashboards.filter(dashboard => {
  const live = grafana('GET', `/api/dashboards/uid/${dashboard.uid}`, undefined, { allowMissing: true });
  const changed = !live || comparableDashboard(live.dashboard) !== comparableDashboard(dashboard)
    || live.meta.folderUid !== alerts.folderUid;
  console.log(`dashboard ${dashboard.uid}: ${!live ? 'create' : changed ? 'update' : 'unchanged'}`);
  return changed;
});

const desired = new Map(alerts.rules.map(rule => [rule.uid, toProvisionedRule(rule)]));
// A rule of the source that sits in another group of the folder is live too: a
// renamed group is an update of its rules, not rules to create.
const live = new Map(grafana('GET', '/api/v1/provisioning/alert-rules')
  .filter(rule => rule.folderUID === alerts.folderUid && (rule.ruleGroup === alerts.ruleGroup || desired.has(rule.uid)))
  .map(rule => [rule.uid, rule]));
const toCreate = [...desired.keys()].filter(uid => !live.has(uid));
const toUpdate = [...desired.keys()].filter(uid => live.has(uid) && comparableRule(live.get(uid)) !== comparableRule(desired.get(uid)));
const toDelete = [...live.keys()].filter(uid => !desired.has(uid));
console.log(`${alerts.ruleGroup}: ${live.size} live, ${desired.size} in source`);
console.log(`create: ${toCreate.join(', ') || '-'}`);
console.log(`update: ${toUpdate.join(', ') || '-'}`);
console.log(`delete: ${toDelete.join(', ') || '-'}`);

if (!apply) {
  console.log('Dry run. Re-run with --apply to change Grafana.');
  process.exit(0);
}

if (!folder) grafana('POST', '/api/folders', { uid: alerts.folderUid, title: alerts.folderTitle });
if (folderRenamed) grafana('PUT', `/api/folders/${alerts.folderUid}`, { title: alerts.folderTitle, version: folder.version });
for (const dashboard of dashboardChanges) {
  grafana('POST', '/api/dashboards/db', { dashboard: { ...dashboard, id: null }, folderUid: alerts.folderUid,
    overwrite: true, message: 'Synced from the ScootRadar repository' });
}
for (const uid of toCreate) grafana('POST', '/api/v1/provisioning/alert-rules', desired.get(uid));
for (const uid of toUpdate) grafana('PUT', `/api/v1/provisioning/alert-rules/${uid}`, desired.get(uid));
for (const uid of toDelete) grafana('DELETE', `/api/v1/provisioning/alert-rules/${uid}`);
console.log('Applied.');
