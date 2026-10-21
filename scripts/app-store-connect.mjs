import { createHash, createPrivateKey, sign } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

// Pushes the iOS App Store listing in docs/app-store/ to App Store Connect through
// its API. Dry run by default: it prints the writes it would send (with
// credentials it still reads); pass --apply to send them. It never submits
// anything for review: there is no code here for reviewSubmissions or
// appStoreVersionSubmissions, so that step stays with a person on the web.
//
//   node scripts/app-store-connect.mjs check|listing|screenshots|availability|testflight [--apply]
//
// Credentials: ASC_KEY_ID, ASC_ISSUER_ID and the key at ASC_KEY_PATH or
// ~/.appstoreconnect/private_keys/AuthKey_<ASC_KEY_ID>.p8. Without them the dry
// run only checks the files and prints the plan.

const usage = `Usage: node scripts/app-store-connect.mjs <command> [--apply]
  check          check the files; with credentials, the app record, bundle ID and builds
  listing        categories, names, descriptions, keywords, URLs, copyright, age rating, review notes
  screenshots    upload docs/app-store/screenshots/ (--replace deletes a set's screenshots first)
  availability   --territories CHE,FRA,…: sell in exactly those territories, for free
  testflight     add the newest valid build to the internal group "Internal"`;

const baseUrl = 'https://api.appstoreconnect.apple.com';
const bundleId = 'com.plhery.scootradar';
const teamId = 'HGC93X794T';
const primaryLocale = 'en-US';
const versionString = '1.0';
const copyright = '2026 Paul-Louis Hery';
const categories = { primaryCategory: 'NAVIGATION', secondaryCategory: 'TRAVEL' };
const urls = {
  privacyPolicyUrl: 'https://scootradar.com/privacy',
  supportUrl: 'https://scootradar.com/privacy#contact',
  marketingUrl: 'https://scootradar.com',
};
const docsDir = fileURLToPath(new URL('../docs/app-store/', import.meta.url));

const fieldFiles = {
  name: 'name.txt',
  subtitle: 'subtitle.txt',
  promotionalText: 'promotional_text.txt',
  description: 'description.txt',
  keywords: 'keywords.txt',
};

const storeLocales = new Set(['ar-SA', 'ca', 'cs', 'da', 'de-DE', 'el', 'en-AU', 'en-CA', 'en-GB', 'en-US', 'es-ES',
  'es-MX', 'fi', 'fr-CA', 'fr-FR', 'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl-NL', 'no', 'pl', 'pt-BR',
  'pt-PT', 'ro', 'ru', 'sk', 'sv', 'th', 'tr', 'uk', 'vi', 'zh-Hans', 'zh-Hant']);

export const displayTypes = {
  '6.3': { type: 'APP_IPHONE_61', sizes: ['1206x2622', '1179x2556'] },
  '6.9': { type: 'APP_IPHONE_67', sizes: ['1320x2868', '1290x2796', '1260x2736'] },
};

// The questionnaire of API 4.5.1. The declaration App Store Connect returns decides
// which attributes are sent; these lists give the type of those that are still null.
const ageRatingBooleans = ['advertising', 'ageAssurance', 'gambling', 'healthOrWellnessTopics', 'lootBox',
  'messagingAndChat', 'parentalControls', 'socialMedia', 'socialMediaAgeRestricted', 'unrestrictedWebAccess',
  'userGeneratedContent'];
const ageRatingFrequencies = ['alcoholTobaccoOrDrugUseOrReferences', 'contests', 'gamblingSimulated',
  'gunsOrOtherWeapons', 'horrorOrFearThemes', 'matureOrSuggestiveThemes', 'medicalOrTreatmentInformation',
  'profanityOrCrudeHumor', 'sexualContentGraphicAndNudity', 'sexualContentOrNudity', 'violenceCartoonOrFantasy',
  'violenceRealistic', 'violenceRealisticProlongedGraphicOrSadistic'];
const ageRatingNoOverride = ['ageRatingOverrideV2', 'koreaAgeRatingOverride'];
const ageRatingLeftAlone = new Set(['kidsAgeBand', 'ageRatingOverride', 'gracRatingClassificationNumber',
  'developerAgeRatingInfoUrl']);
const frequencyValues = new Set(['NONE', 'INFREQUENT_OR_MILD', 'FREQUENT_OR_INTENSE', 'INFREQUENT', 'FREQUENT']);

const editableStates = new Set(['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED',
  'INVALID_BINARY']);

const chars = text => [...text].length;
const bytes = text => Buffer.byteLength(text, 'utf8');
const compact = object => Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
const byName = (a, b) => a.localeCompare(b, 'en', { numeric: true });
const byLocale = (a, b) => (a === primaryLocale ? -1 : b === primaryLocale ? 1 : a.localeCompare(b));

export function signToken({ keyId, issuerId, privateKey, now = Date.now() }) {
  // A minute in the past, so a clock running a little ahead doesn't put exp beyond Apple's 20 minutes.
  const iat = Math.floor(now / 1000) - 60;
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const data = `${encode({ alg: 'ES256', kid: keyId, typ: 'JWT' })}.${encode({
    iss: issuerId, iat, exp: iat + 1200, aud: 'appstoreconnect-v1',
  })}`;
  const signature = sign('sha256', Buffer.from(data), { key: privateKey, dsaEncoding: 'ieee-p1363' });
  return `${data}.${signature.toString('base64url')}`;
}

// The same token until it is 15 minutes old.
export function tokenSource(credentials, now = Date.now) {
  let token;
  let signedAt = -Infinity;
  return () => {
    if (now() - signedAt >= 15 * 60_000) {
      signedAt = now();
      token = signToken({ ...credentials, now: signedAt });
    }
    return token;
  };
}

export const loadPrivateKey = path => createPrivateKey(readFileSync(path));

export function readPng(buffer) {
  if (buffer.length < 33 || buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') throw new Error('not a PNG file');
  if (buffer.toString('latin1', 12, 16) !== 'IHDR') throw new Error('no IHDR chunk');
  const colorType = buffer[25];
  let transparency = false;
  for (let offset = 8; offset + 8 <= buffer.length;) {
    const type = buffer.toString('latin1', offset + 4, offset + 8);
    if (type === 'tRNS') transparency = true;
    if (type === 'IDAT' || type === 'IEND') break;
    offset += 12 + buffer.readUInt32BE(offset);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType,
    alpha: colorType === 4 || colorType === 6,
    transparency,
  };
}

export function screenshotProblems(name, folder, png) {
  const problems = [];
  const { sizes } = displayTypes[folder];
  if (!sizes.includes(`${png.width}x${png.height}`)) {
    problems.push(`${name} is ${png.width}×${png.height}; ${folder} takes ${sizes.map(size => size.replace('x', '×')).join(' or ')}`);
  }
  if (png.alpha) problems.push(`${name} has an alpha channel (colour type ${png.colorType}); App Store Connect refuses it`);
  if (png.transparency) problems.push(`${name} has a transparent colour (tRNS chunk); App Store Connect refuses it`);
  return problems;
}

export function validateFields(locale, fields) {
  const problems = [];
  const limit = (field, value, ok, rule) => { if (!ok) problems.push(`${locale}: ${field} has ${value} (${rule})`); };
  for (const field of ['name', 'description']) {
    if (fields[field] === undefined) problems.push(`${locale}: ${fieldFiles[field]} is missing or empty`);
  }
  if (fields.name !== undefined) {
    limit('name', `${chars(fields.name)} characters`, chars(fields.name) >= 2 && chars(fields.name) <= 30, '2 to 30');
  }
  if (fields.subtitle !== undefined) {
    limit('subtitle', `${chars(fields.subtitle)} characters`, chars(fields.subtitle) <= 30, 'at most 30');
  }
  if (fields.promotionalText !== undefined) {
    limit('promotional text', `${chars(fields.promotionalText)} characters`, chars(fields.promotionalText) <= 170, 'at most 170');
  }
  if (fields.description !== undefined) {
    limit('description', `${chars(fields.description)} characters`, chars(fields.description) <= 4000, 'at most 4000');
  }
  if (fields.keywords !== undefined) {
    limit('keywords', `${bytes(fields.keywords)} bytes`, bytes(fields.keywords) <= 100, 'at most 100 bytes in UTF-8');
  }
  return problems;
}

// The README wraps the notes at 80 columns and App Store Connect keeps every line
// break, so the lines go back into paragraphs and list items.
export function reflow(text) {
  return text.split(/\n\s*\n/).map(paragraph => paragraph.split('\n').reduce((lines, line) => {
    const trimmed = line.trim();
    if (!lines.length || /^(\d+\.|[-•])\s/.test(trimmed)) lines.push(trimmed);
    else lines[lines.length - 1] += ` ${trimmed}`;
    return lines;
  }, []).join('\n')).join('\n\n');
}

export function reviewNotes(readme) {
  const section = readme.split(/^## /m).find(part => part.startsWith('Review notes'));
  const block = section?.match(/```[^\n]*\n([\s\S]*?)\n```/)?.[1];
  if (!block) throw new Error('docs/app-store/README.md has no ``` block under "## Review notes"');
  return reflow(block);
}

// Every question answered No or None. Attributes that aren't questions are left as they are.
export function ageRatingAnswers(attributes) {
  const answers = {};
  const unknown = [];
  for (const [key, value] of Object.entries(attributes)) {
    if (ageRatingLeftAlone.has(key)) continue;
    if (ageRatingBooleans.includes(key) || typeof value === 'boolean') answers[key] = false;
    else if (ageRatingFrequencies.includes(key) || ageRatingNoOverride.includes(key) || frequencyValues.has(value)) answers[key] = 'NONE';
    else unknown.push(key);
  }
  return { answers, unknown };
}

export const changes = (current, desired) =>
  Object.fromEntries(Object.entries(desired).filter(([key, value]) => (current?.[key] ?? null) !== value));

function preview(value) {
  if (typeof value !== 'string') return String(value);
  const flat = value.replace(/\s+/g, ' ');
  return flat.length > 40 ? `"${flat.slice(0, 37)}…" (${chars(value)} characters)` : `"${flat}"`;
}
const describe = attributes => Object.entries(attributes).map(([key, value]) => `${key} ${preview(value)}`).join(', ');

function subfolders(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.')).map(entry => entry.name);
}

function readFields(dir) {
  return compact(Object.fromEntries(Object.entries(fieldFiles).map(([field, file]) => {
    const path = join(dir, file);
    const text = existsSync(path) ? readFileSync(path, 'utf8').replace(/^﻿/, '').trim() : '';
    return [field, text || undefined];
  })));
}

function loadMetadata(report) {
  const dir = join(docsDir, 'metadata');
  const locales = subfolders(dir).sort(byLocale).map(locale => ({ locale, fields: readFields(join(dir, locale)) }));
  if (!locales.some(({ locale }) => locale === primaryLocale)) report.problems.push(`metadata/${primaryLocale}/ is missing`);
  for (const { locale, fields } of locales) {
    if (!storeLocales.has(locale)) report.warnings.push(`${locale} is not a locale App Store Connect lists`);
    report.problems.push(...validateFields(locale, fields));
    const missing = ['subtitle', 'promotionalText', 'keywords'].filter(field => fields[field] === undefined);
    const sizes = [
      fields.name && `name ${chars(fields.name)}/30`,
      fields.subtitle && `subtitle ${chars(fields.subtitle)}/30`,
      fields.promotionalText && `promotional text ${chars(fields.promotionalText)}/170`,
      fields.description && `description ${chars(fields.description)}/4000`,
      fields.keywords && `keywords ${bytes(fields.keywords)}/100 bytes`,
    ].filter(Boolean);
    console.log(`metadata ${locale}: ${sizes.join(', ')}${missing.length ? `; no ${missing.map(field => fieldFiles[field]).join(', ')}` : ''}`);
  }
  return locales;
}

function loadNotes(report) {
  try {
    const notes = reviewNotes(readFileSync(join(docsDir, 'README.md'), 'utf8'));
    console.log(`review notes: ${bytes(notes)}/4000 bytes`);
    if (bytes(notes) > 4000) report.problems.push(`review notes take ${bytes(notes)} bytes (at most 4000)`);
    return notes;
  } catch (error) {
    report.problems.push(error.message);
    return undefined;
  }
}

function loadScreenshots(report) {
  const dir = join(docsDir, 'screenshots');
  const sets = [];
  for (const locale of subfolders(dir).sort(byLocale)) {
    for (const folder of subfolders(join(dir, locale)).sort()) {
      const label = `screenshots/${locale}/${folder}`;
      if (!displayTypes[folder]) {
        report.warnings.push(`${label}/ is not a size this script uploads (6.3, 6.9); skipped`);
        continue;
      }
      const files = readdirSync(join(dir, locale, folder)).filter(name => /\.png$/i.test(name)).sort(byName);
      for (const fileName of files) {
        try {
          report.problems.push(...screenshotProblems(`${label}/${fileName}`, folder,
            readPng(readFileSync(join(dir, locale, folder, fileName)))));
        } catch (error) {
          report.problems.push(`${label}/${fileName}: ${error.message}`);
        }
      }
      if (files.length > 10) report.problems.push(`${label} has ${files.length} screenshots (at most 10)`);
      if (!files.length) continue;
      if (!storeLocales.has(locale)) report.warnings.push(`${locale} is not a locale App Store Connect lists`);
      console.log(`${label}: ${files.length} PNG${files.length === 1 ? '' : 's'} for ${displayTypes[folder].type}`);
      sets.push({ locale, folder, displayType: displayTypes[folder].type, dir: join(dir, locale, folder), files });
    }
  }
  if (!sets.length) console.log('screenshots: none yet');
  return sets;
}

function credentials() {
  const { ASC_KEY_ID: keyId, ASC_ISSUER_ID: issuerId } = process.env;
  const keyPath = process.env.ASC_KEY_PATH
    || (keyId && join(homedir(), '.appstoreconnect', 'private_keys', `AuthKey_${keyId}.p8`));
  const missing = [
    !keyId && 'ASC_KEY_ID',
    !issuerId && 'ASC_ISSUER_ID',
    !(keyPath && existsSync(keyPath)) && (keyPath ? `the key file ${keyPath}` : 'the key file'),
  ].filter(Boolean);
  return { keyId, issuerId, keyPath, missing };
}

function apiError(method, path, status, text) {
  let errors = [];
  try { errors = JSON.parse(text).errors ?? []; } catch { /* not JSON */ }
  const details = errors.map(error => [error.code, error.title, error.detail, error.source?.pointer ?? error.source?.parameter]
    .filter(Boolean).join(' · '));
  const error = new Error(`${method} ${path} answered ${status}:\n  ${details.length ? details.join('\n  ') : text.slice(0, 500)}`);
  error.status = status;
  error.errors = errors;
  return error;
}

function createApi(token) {
  return async function call(method, path, body, { allowMissing = false } = {}) {
    const url = path.startsWith('https://') ? path : `${baseUrl}${path}`;
    if (!url.startsWith(`${baseUrl}/`)) throw new Error(`refusing to send the API token to ${new URL(url).origin}`);
    for (let attempt = 1; ; attempt++) {
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token()}`, ...(body && { 'Content-Type': 'application/json' }) },
        body: body && JSON.stringify(body),
      });
      if ((response.status === 429 || (method === 'GET' && response.status >= 500)) && attempt < 4) {
        await response.arrayBuffer();
        await sleep(5000 * 2 ** (attempt - 1));
        continue;
      }
      if (response.status === 404 && allowMissing) return null;
      const text = await response.text();
      if (!response.ok) throw apiError(method, path, response.status, text);
      return text ? JSON.parse(text) : null;
    }
  };
}

// Set in main. Without credentials api stays null: reads find nothing and ids are placeholders.
let api = null;
let apply = false;
let replace = false;

// A path with a placeholder id in it names something only the dry run's writes would create.
const readable = path => api && !path.includes('{');

const get = async (path, options) => (readable(path) ? api('GET', path, undefined, options) : null);

async function* pages(path) {
  for (let next = readable(path) ? path : null; next;) {
    const page = await api('GET', next);
    yield page;
    next = page.links?.next;
  }
}

async function getAll(path) {
  const data = [];
  const included = [];
  for await (const page of pages(path)) {
    data.push(...page.data);
    included.push(...(page.included ?? []));
  }
  return { data, included };
}

async function write(method, path, body, summary) {
  console.log(`${apply ? '' : 'would '}${method} ${path}  ${summary}`);
  if (!apply) return { id: `{new ${body?.data?.type ?? 'resource'}}`, attributes: body?.data?.attributes ?? {} };
  return (await api(method, path, body))?.data ?? null;
}

async function upsert(type, existing, attributes, { locale, relationships }, label) {
  if (existing) {
    const changed = changes(existing.attributes, attributes);
    if (!Object.keys(changed).length) {
      console.log(`${label}: unchanged`);
      return existing;
    }
    await write('PATCH', `/v1/${type}/${existing.id}`, { data: { type, id: existing.id, attributes: changed } },
      `${label}: ${describe(changed)}`);
    return existing;
  }
  return write('POST', `/v1/${type}`, { data: { type, attributes: compact({ locale, ...attributes }), relationships } },
    `${label}: ${api ? 'create' : 'create or update'} with ${describe(attributes)}`);
}

async function findApp() {
  if (!api) return { id: '{appId}', attributes: {} };
  const { data } = await api('GET', `/v1/apps?filter[bundleId]=${bundleId}`);
  return data.find(app => app.attributes.bundleId === bundleId) ?? null;
}

async function requireApp() {
  const app = await findApp();
  if (!api) console.log(`app: the record for ${bundleId}, {appId} here`);
  if (!app) {
    throw new Error(`App Store Connect has no app with bundle ID ${bundleId}. The app record can only be created on the web `
      + '(Apps › + › New App) by the Account Holder, an Admin or an App Manager.');
  }
  if (api) console.log(`app ${app.id}: ${app.attributes.name} (${app.attributes.bundleId})`);
  if (api && app.attributes.primaryLocale !== primaryLocale) {
    console.log(`warning: the app's primary locale is ${app.attributes.primaryLocale}, not ${primaryLocale}`);
  }
  return app;
}

const stateOf = resource => resource.attributes.appVersionState ?? resource.attributes.state ?? resource.attributes.appStoreState;

async function editableAppInfo(app) {
  if (!api) return { id: '{appInfoId}', attributes: {} };
  const { data } = await getAll(`/v1/apps/${app.id}/appInfos?include=primaryCategory,secondaryCategory&limit=200`);
  const appInfo = data.find(info => editableStates.has(stateOf(info)));
  if (!appInfo) throw new Error(`no app info can be edited (states: ${data.map(stateOf).join(', ')})`);
  console.log(`app info ${appInfo.id}: ${stateOf(appInfo)}`);
  return appInfo;
}

async function editableVersion(app, { create }) {
  if (!api) {
    console.log(`version: the editable iOS version${create ? `, or a new ${versionString} if the app has none` : ''}`);
    return { id: '{appStoreVersionId}', attributes: {} };
  }
  const { data } = await getAll(`/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=200`);
  const version = data.find(candidate => editableStates.has(stateOf(candidate)));
  if (version) {
    console.log(`version ${version.attributes.versionString} (${version.id}): ${stateOf(version)}`);
    return version;
  }
  if (data.length) {
    throw new Error(`no iOS version can be edited (${data.map(v => `${v.attributes.versionString} ${stateOf(v)}`).join(', ')}); `
      + 'add the next version on the web first');
  }
  if (!create) throw new Error('the app has no iOS version yet: run listing first');
  return write('POST', '/v1/appStoreVersions', {
    data: {
      type: 'appStoreVersions',
      attributes: { platform: 'IOS', versionString, copyright },
      relationships: { app: { data: { type: 'apps', id: app.id } } },
    },
  }, `create iOS version ${versionString}, copyright "${copyright}"`);
}

async function check(report) {
  if (!api) {
    console.log(`with credentials it reads GET /v1/apps?filter[bundleId]=${bundleId}, `
      + `GET /v1/bundleIds?filter[identifier]=${bundleId}&include=bundleIdCapabilities and `
      + 'GET /v1/builds?filter[app]={appId}&sort=-uploadedDate&limit=5');
    return;
  }
  const app = await findApp();
  console.log(app
    ? `app record: ${app.id} "${app.attributes.name}", SKU ${app.attributes.sku}, primary locale ${app.attributes.primaryLocale}, `
      + `content rights ${app.attributes.contentRightsDeclaration ?? 'not declared'}`
    : `app record: none for ${bundleId}; it can only be created on the web (Apps › + › New App)`);

  try {
    const response = await api('GET', `/v1/bundleIds?filter[identifier]=${bundleId}&include=bundleIdCapabilities&limit[bundleIdCapabilities]=50`);
    const bundle = response.data.find(candidate => candidate.attributes.identifier === bundleId);
    if (!bundle) {
      console.log(`bundle ID: ${bundleId} is not registered (Xcode registers it with -allowProvisioningUpdates)`);
    } else {
      const { seedId } = bundle.attributes;
      console.log(`bundle ID ${bundleId}: seed ID ${seedId}, ${seedId === teamId ? `the team ${teamId}` : `expected ${teamId}`}`);
      if (seedId !== teamId) report.problems.push(`the bundle ID's seed ID is ${seedId}, not ${teamId}`);
      const ids = new Set(bundle.relationships?.bundleIdCapabilities?.data?.map(capability => capability.id));
      const capabilities = (response.included ?? [])
        .filter(item => item.type === 'bundleIdCapabilities' && ids.has(item.id)).map(item => item.attributes.capabilityType);
      console.log(`capabilities: ${capabilities.join(', ') || 'none'}`);
      console.log(`ASSOCIATED_DOMAINS: ${capabilities.includes('ASSOCIATED_DOMAINS') ? 'on' : 'off (universal links need it)'}`);
    }
  } catch (error) {
    if (error.status !== 403) throw error;
    console.log(`bundle ID: ${error.message}\n  (individual keys can't read bundle IDs; a team key can)`);
  }

  if (!app) return;
  const builds = await api('GET', `/v1/builds?filter[app]=${app.id}&sort=-uploadedDate&limit=5&include=preReleaseVersion`);
  if (!builds.data.length) console.log('builds: none uploaded yet');
  for (const build of builds.data) {
    const preRelease = builds.included?.find(item => item.id === build.relationships?.preReleaseVersion?.data?.id);
    console.log(`build ${preRelease?.attributes.version ?? '?'} (${build.attributes.version}), uploaded ${build.attributes.uploadedDate}: `
      + `${build.attributes.processingState}${build.attributes.expired ? ', expired' : ''}, `
      + `usesNonExemptEncryption ${build.attributes.usesNonExemptEncryption ?? 'unset'}`);
  }
}

async function newestValidBuild(app) {
  const response = await api('GET', `/v1/builds?filter[app]=${app.id}&filter[processingState]=VALID&filter[expired]=false`
    + '&sort=-uploadedDate&limit=1&include=preReleaseVersion');
  const build = response.data[0];
  if (!build) return null;
  const preRelease = response.included?.find(item => item.id === build.relationships?.preReleaseVersion?.data?.id);
  return { ...build, shortVersion: preRelease?.attributes.version };
}

async function pushListing(locales, notes) {
  const app = await requireApp();
  if (app.attributes.contentRightsDeclaration === 'USES_THIRD_PARTY_CONTENT') {
    console.log('content rights: uses third-party content, unchanged');
  } else {
    await write('PATCH', `/v1/apps/${app.id}`, {
      data: { type: 'apps', id: app.id, attributes: { contentRightsDeclaration: 'USES_THIRD_PARTY_CONTENT' } },
    }, 'contentRightsDeclaration USES_THIRD_PARTY_CONTENT');
  }

  const appInfo = await editableAppInfo(app);
  if (Object.entries(categories).every(([key, id]) => appInfo.relationships?.[key]?.data?.id === id)) {
    console.log('categories: Navigation and Travel, unchanged');
  } else {
    await write('PATCH', `/v1/appInfos/${appInfo.id}`, {
      data: {
        type: 'appInfos',
        id: appInfo.id,
        relationships: Object.fromEntries(Object.entries(categories)
          .map(([key, id]) => [key, { data: { type: 'appCategories', id } }])),
      },
    }, `primaryCategory ${categories.primaryCategory}, secondaryCategory ${categories.secondaryCategory}`);
  }

  const { data: infoLocalizations } = await getAll(`/v1/appInfos/${appInfo.id}/appInfoLocalizations?limit=200`);
  for (const { locale, fields } of locales) {
    await upsert('appInfoLocalizations', infoLocalizations.find(item => item.attributes.locale === locale),
      compact({ name: fields.name, subtitle: fields.subtitle, privacyPolicyUrl: urls.privacyPolicyUrl }),
      { locale, relationships: { appInfo: { data: { type: 'appInfos', id: appInfo.id } } } }, `${locale} app info`);
  }

  const version = await editableVersion(app, { create: true });
  if (version.attributes.copyright === copyright) console.log('copyright: unchanged');
  else if (api) {
    await write('PATCH', `/v1/appStoreVersions/${version.id}`, {
      data: { type: 'appStoreVersions', id: version.id, attributes: { copyright } },
    }, `copyright "${copyright}"`);
  } else console.log(`would PATCH /v1/appStoreVersions/${version.id}  copyright "${copyright}" (if different)`);

  // Submitting needs a build on the version: the newest one Apple has processed, of the same version number.
  const attached = (await get(`/v1/appStoreVersions/${version.id}/build`))?.data;
  if (attached) console.log(`build: ${attached.attributes.version} attached`);
  else if (!readable(`/v1/appStoreVersions/${version.id}/build`)) {
    console.log(`would PATCH /v1/appStoreVersions/${version.id}/relationships/build  the newest VALID build of ${versionString}, `
      + 'if none is attached');
  } else {
    const build = await newestValidBuild(app);
    if (!build) console.log('build: no VALID build yet; upload one with scripts/upload-ios-app.sh, then run listing again');
    else if (build.shortVersion !== versionString) {
      console.log(`build: the newest VALID build is ${build.shortVersion} (${build.attributes.version}), not ${versionString}; none attached`);
    } else {
      await write('PATCH', `/v1/appStoreVersions/${version.id}/relationships/build`, { data: { type: 'builds', id: build.id } },
        `attach build ${build.attributes.version}`);
    }
  }

  // No whatsNew: App Store Connect has none for the first version.
  const { data: versionLocalizations } = await getAll(`/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations?limit=200`);
  for (const { locale, fields } of locales) {
    await upsert('appStoreVersionLocalizations', versionLocalizations.find(item => item.attributes.locale === locale),
      compact({
        description: fields.description,
        keywords: fields.keywords,
        promotionalText: fields.promotionalText,
        supportUrl: urls.supportUrl,
        marketingUrl: urls.marketingUrl,
      }),
      { locale, relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } } } },
      `${locale} version text`);
  }

  const declaration = (await get(`/v1/appInfos/${appInfo.id}/ageRatingDeclaration`))?.data
    ?? { id: '{ageRatingDeclarationId}', attributes: Object.fromEntries([...ageRatingBooleans, ...ageRatingFrequencies,
      ...ageRatingNoOverride].map(key => [key, null])) };
  const { answers, unknown } = ageRatingAnswers(declaration.attributes);
  console.log(`age rating: No or None for ${Object.keys(answers).length} attributes: ${Object.keys(answers).join(', ')}`);
  if (unknown.length) console.log(`warning: age rating attributes of unknown type, left alone (answer them on the web): ${unknown.join(', ')}`);
  if (!Object.keys(changes(declaration.attributes, answers)).length) console.log('age rating: unchanged');
  else {
    await write('PATCH', `/v1/ageRatingDeclarations/${declaration.id}`, {
      data: { type: 'ageRatingDeclarations', id: declaration.id, attributes: answers },
    }, `${Object.keys(changes(declaration.attributes, answers)).length} answers change`);
  }

  const reviewDetail = (await get(`/v1/appStoreVersions/${version.id}/appStoreReviewDetail`, { allowMissing: true }))?.data;
  const contact = compact({
    contactFirstName: process.env.ASC_REVIEW_FIRST_NAME || undefined,
    contactLastName: process.env.ASC_REVIEW_LAST_NAME || undefined,
    contactPhone: process.env.ASC_REVIEW_PHONE || undefined,
    contactEmail: process.env.ASC_REVIEW_EMAIL || undefined,
  });
  if (!Object.keys(contact).length) console.log('review contact: not set here (ASC_REVIEW_FIRST_NAME, _LAST_NAME, _PHONE, _EMAIL)');
  await upsert('appStoreReviewDetails', reviewDetail, compact({ notes, demoAccountRequired: false, ...contact }),
    { relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } } } }, 'review details');
}

async function uploadScreenshot(screenshotSet, dir, fileName, label) {
  const data = readFileSync(join(dir, fileName));
  const checksum = createHash('md5').update(data).digest('hex');
  const size = `${Math.round(data.length / 1024)} KB`;
  if (!apply) {
    console.log(`would POST /v1/appScreenshots, PUT its parts and PATCH it  ${label}: ${fileName} (${size}, MD5 ${checksum})`);
    return null;
  }
  const reservation = await write('POST', '/v1/appScreenshots', {
    data: {
      type: 'appScreenshots',
      attributes: { fileName, fileSize: data.length },
      relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: screenshotSet.id } } },
    },
  }, `${label}: reserve ${fileName} (${size})`);
  for (const operation of reservation.attributes.uploadOperations) {
    const headers = Object.fromEntries((operation.requestHeaders ?? [])
      .filter(header => header.name.toLowerCase() !== 'content-length').map(header => [header.name, header.value]));
    const response = await fetch(operation.url, {
      method: operation.method,
      headers,
      body: data.subarray(operation.offset, operation.offset + operation.length),
    });
    if (!response.ok) {
      throw new Error(`uploading ${fileName} (bytes ${operation.offset} to ${operation.offset + operation.length}) answered `
        + `${response.status}: ${(await response.text()).slice(0, 300)}`);
    }
  }
  await write('PATCH', `/v1/appScreenshots/${reservation.id}`, {
    data: { type: 'appScreenshots', id: reservation.id, attributes: { uploaded: true, sourceFileChecksum: checksum } },
  }, `${label}: uploaded ${fileName}`);
  return { id: reservation.id, fileName, label };
}

async function waitForDelivery(shots) {
  const pending = new Map(shots.map(shot => [shot.id, shot]));
  const deadline = Date.now() + 10 * 60_000;
  while (pending.size && Date.now() < deadline) {
    await sleep(3000);
    for (const [id, shot] of pending) {
      const state = (await api('GET', `/v1/appScreenshots/${id}`)).data.attributes.assetDeliveryState;
      if (state?.state === 'COMPLETE') {
        console.log(`${shot.label}: ${shot.fileName} processed`);
        pending.delete(id);
      } else if (state?.state === 'FAILED') {
        console.error(`${shot.label}: ${shot.fileName} failed: ${(state.errors ?? []).map(e => `${e.code} ${e.description}`).join('; ')}`);
        process.exitCode = 1;
        pending.delete(id);
      }
    }
  }
  for (const shot of pending.values()) console.log(`${shot.label}: ${shot.fileName} still processing after 10 minutes`);
}

async function pushScreenshots(sets, report) {
  if (!sets.length) return;
  const app = await requireApp();
  const version = await editableVersion(app, { create: false });
  const { data: localizations } = await getAll(`/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations?limit=200`);
  const uploaded = [];
  for (const set of sets) {
    const label = `${set.locale} ${set.folder} (${set.displayType})`;
    const localization = api
      ? localizations.find(item => item.attributes.locale === set.locale)
      : { id: `{${set.locale} localization}` };
    if (!localization) {
      report.problems.push(`${label}: the version has no ${set.locale} localization; run listing first`);
      continue;
    }
    const { data: screenshotSets } = await getAll(`/v1/appStoreVersionLocalizations/${localization.id}/appScreenshotSets?limit=200`);
    const screenshotSet = screenshotSets.find(item => item.attributes.screenshotDisplayType === set.displayType)
      ?? await write('POST', '/v1/appScreenshotSets', {
        data: {
          type: 'appScreenshotSets',
          attributes: { screenshotDisplayType: set.displayType },
          relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: localization.id } } },
        },
      }, `${label}: ${api ? 'create' : 'find or create'} the screenshot set`);

    let { data: existing } = await getAll(`/v1/appScreenshotSets/${screenshotSet.id}/appScreenshots?limit=200`);
    if (replace) {
      for (const shot of existing) {
        await write('DELETE', `/v1/appScreenshots/${shot.id}`, undefined, `${label}: delete ${shot.attributes.fileName}`);
      }
      existing = [];
    }
    // A screenshot counts as there by its name or by its content, so a renamed file isn't sent twice.
    const present = new Set(existing.flatMap(shot => [shot.attributes.fileName, shot.attributes.sourceFileChecksum]));
    const files = set.files.filter(fileName => {
      const checksum = createHash('md5').update(readFileSync(join(set.dir, fileName))).digest('hex');
      const there = present.has(fileName) || present.has(checksum);
      if (there) console.log(`${label}: ${fileName} is already there (--replace uploads the set again)`);
      return !there;
    });
    if (existing.length + files.length > 10) {
      report.problems.push(`${label}: ${existing.length} screenshots already there and ${files.length} new ones are more than 10; use --replace`);
      continue;
    }
    for (const fileName of files) uploaded.push(await uploadScreenshot(screenshotSet, set.dir, fileName, label));
  }
  if (apply) await waitForDelivery(uploaded.filter(Boolean));
}

async function pushAvailability(territories) {
  const app = await requireApp();
  const chosen = new Set(territories);
  const current = (await get(`/v1/apps/${app.id}/appAvailabilityV2`, { allowMissing: true }))?.data;
  if (current) {
    const { data } = await getAll(`/v2/appAvailabilities/${current.id}/territoryAvailabilities?include=territory&limit=200`);
    const territoryOf = item => item.relationships?.territory?.data?.id;
    const unknown = territories.filter(territory => !data.some(item => territoryOf(item) === territory));
    if (unknown.length) throw new Error(`App Store Connect has no territory ${unknown.join(', ')}`);
    const changed = data.filter(item => Boolean(item.attributes.available) !== chosen.has(territoryOf(item)));
    console.log(`availability ${current.id}: available in ${data.filter(item => item.attributes.available).length} of `
      + `${data.length} territories, ${changed.length} to change`);
    if (current.attributes.availableInNewTerritories) {
      console.log('warning: the app becomes available in new territories, and the API cannot change that; untick it on the web '
        + '(Pricing and Availability)');
    }
    for (const item of changed) {
      const available = chosen.has(territoryOf(item));
      await write('PATCH', `/v1/territoryAvailabilities/${item.id}`, {
        data: { type: 'territoryAvailabilities', id: item.id, attributes: { available } },
      }, `${territoryOf(item)}: ${available ? 'available' : 'not available'}`);
    }
  } else {
    // Apple wants every territory in the first availability, the unavailable ones too.
    const all = api ? (await getAll('/v1/territories?limit=200')).data.map(territory => territory.id) : territories;
    const unknown = territories.filter(territory => !all.includes(territory));
    if (unknown.length) throw new Error(`App Store Connect has no territory ${unknown.join(', ')}`);
    const localId = territory => `\${local-${territory.toLowerCase()}}`;
    try {
      await write('POST', '/v2/appAvailabilities', {
        data: {
          type: 'appAvailabilities',
          attributes: { availableInNewTerritories: false },
          relationships: {
            app: { data: { type: 'apps', id: app.id } },
            territoryAvailabilities: { data: all.map(territory => ({ type: 'territoryAvailabilities', id: localId(territory) })) },
          },
        },
        included: all.map(territory => ({
          type: 'territoryAvailabilities',
          id: localId(territory),
          attributes: { available: chosen.has(territory) },
          relationships: { territory: { data: { type: 'territories', id: territory } } },
        })),
      }, `available in ${territories.join(', ')} only (${api ? `not in the other ${all.length - territories.length}` : 'not in any other territory'}), `
        + 'nor in new territories');
    } catch (error) {
      if (!error.errors?.some(item => item.detail?.includes("expects an included resource with type 'territories'"))) throw error;
      error.message += '\n  App Store Connect may refuse the first availability through the API: set it once on the web '
        + '(Pricing and Availability), then run this again to adjust it.';
      throw error;
    }
  }

  let point = api ? null : { id: '{USA $0 price point}', attributes: { customerPrice: '0.00' } };
  for await (const page of pages(`/v1/apps/${app.id}/appPricePoints?filter[territory]=USA&limit=200`)) {
    point = page.data.find(item => Number(item.attributes.customerPrice) === 0);
    if (point) break;
  }
  if (!point) throw new Error('App Store Connect lists no $0 price point for the USA');
  await write('POST', '/v1/appPriceSchedules', {
    data: {
      type: 'appPriceSchedules',
      relationships: {
        app: { data: { type: 'apps', id: app.id } },
        baseTerritory: { data: { type: 'territories', id: 'USA' } },
        manualPrices: { data: [{ type: 'appPrices', id: '${free}' }] },
      },
    },
    included: [{
      type: 'appPrices',
      id: '${free}',
      attributes: { startDate: null, endDate: null },
      relationships: { appPricePoint: { data: { type: 'appPricePoints', id: point.id } } },
    }],
  }, `free from now on: base territory USA, price point ${point.id} ($${point.attributes.customerPrice})`);
}

async function pushTestflight() {
  const app = await requireApp();
  const { data: groups } = await getAll(`/v1/apps/${app.id}/betaGroups?limit=200`);
  let group = groups.find(item => item.attributes.name === 'Internal' && item.attributes.isInternalGroup);
  if (!group) {
    group = await write('POST', '/v1/betaGroups', {
      data: {
        type: 'betaGroups',
        attributes: { name: 'Internal', isInternalGroup: true, hasAccessToAllBuilds: true },
        relationships: { app: { data: { type: 'apps', id: app.id } } },
      },
    }, `${api ? 'create' : 'find or create'} the internal group "Internal", with access to every build`);
  }
  console.log(`group "Internal" ${group.id}: internal ${group.attributes.isInternalGroup}, `
    + `every build ${group.attributes.hasAccessToAllBuilds}`);

  if (!api) {
    console.log('build: the newest VALID one; would PATCH /v1/builds/{id} usesNonExemptEncryption false if unset, '
      + `and POST /v1/betaGroups/${group.id}/relationships/builds unless it is in the group`);
    return;
  }
  const build = await newestValidBuild(app);
  if (!build) {
    console.log('build: no VALID build yet; upload one with scripts/upload-ios-app.sh and wait for processing');
    process.exitCode = 1;
    return;
  }
  console.log(`build ${build.shortVersion ?? '?'} (${build.attributes.version}) ${build.id}: `
    + `${build.attributes.processingState}, uploaded ${build.attributes.uploadedDate}`);
  if (build.attributes.usesNonExemptEncryption == null) {
    await write('PATCH', `/v1/builds/${build.id}`, {
      data: { type: 'builds', id: build.id, attributes: { usesNonExemptEncryption: false } },
    }, 'usesNonExemptEncryption false');
  } else console.log(`build: usesNonExemptEncryption ${build.attributes.usesNonExemptEncryption}`);

  const { data: linked } = await getAll(`/v1/betaGroups/${group.id}/relationships/builds?limit=200`);
  if (linked.some(item => item.id === build.id)) {
    console.log('build: already in the group');
    return;
  }
  try {
    await write('POST', `/v1/betaGroups/${group.id}/relationships/builds`, { data: [{ type: 'builds', id: build.id }] },
      `add build ${build.attributes.version} to "Internal"`);
  } catch (error) {
    if (!group.attributes.hasAccessToAllBuilds) throw error;
    console.log(`${error.message}\n  The group has access to every build, so it gets this one anyway.`);
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      apply: { type: 'boolean', default: false },
      replace: { type: 'boolean', default: false },
      territories: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  const command = positionals[0];
  if (values.help || !['check', 'listing', 'screenshots', 'availability', 'testflight'].includes(command)) {
    console.log(usage);
    process.exitCode = values.help ? 0 : 2;
    return;
  }
  apply = values.apply;
  replace = values.replace;

  const report = { problems: [], warnings: [] };
  const territories = values.territories?.split(',').map(territory => territory.trim().toUpperCase()).filter(Boolean) ?? [];
  if (command === 'availability') {
    if (!territories.length) report.problems.push('availability needs --territories, e.g. --territories CHE,FRA,ISL');
    const invalid = territories.filter(territory => !/^[A-Z]{3}$/.test(territory));
    if (invalid.length) report.problems.push(`territories are ISO 3166 alpha-3 codes, not ${invalid.join(', ')}`);
  }
  const locales = ['check', 'listing'].includes(command) ? loadMetadata(report) : [];
  const notes = ['check', 'listing'].includes(command) ? loadNotes(report) : undefined;
  const sets = ['check', 'screenshots'].includes(command) ? loadScreenshots(report) : [];
  let printed = 0;
  const flush = () => {
    for (const warning of new Set(report.warnings.splice(0))) console.log(`warning: ${warning}`);
    for (const problem of report.problems.slice(printed)) console.error(`problem: ${problem}`);
    printed = report.problems.length;
  };
  flush();

  const { keyId, issuerId, keyPath, missing } = credentials();
  if (missing.length) {
    if (apply) throw new Error(`--apply needs credentials; missing ${missing.join(', ')}`);
    console.log(`\nNo credentials (missing ${missing.join(', ')}): the files are checked and the plan is printed with `
      + 'placeholders for the ids App Store Connect would give.');
  } else {
    api = createApi(tokenSource({ keyId, issuerId, privateKey: loadPrivateKey(keyPath) }));
  }
  if (report.problems.length && apply) throw new Error('nothing sent: fix the problems above first');
  console.log(`\n${command}${apply ? '' : ' (dry run: nothing is sent; --apply sends it)'}`);

  if (command === 'check') await check(report);
  if (command === 'listing') await pushListing(locales, notes);
  if (command === 'screenshots') await pushScreenshots(sets, report);
  if (command === 'availability' && !report.problems.length) await pushAvailability(territories);
  if (command === 'testflight') await pushTestflight();

  flush();
  if (report.problems.length) process.exitCode = 1;
}

if (import.meta.main) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
