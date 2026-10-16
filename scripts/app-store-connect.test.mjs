import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crc32 } from 'node:zlib';
import {
  ageRatingAnswers, changes, loadPrivateKey, readPng, reflow, reviewNotes, screenshotProblems, signToken, tokenSource,
  validateFields,
} from './app-store-connect.mjs';

// Runs with `node --test` and with vitest, which picks up every *.test.mjs.
const { describe, it, after } = process.env.VITEST ? await import('vitest').then(v => ({ ...v, after: v.afterAll }))
  : await import('node:test');

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(width, height, colorType, extra = []) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = colorType;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), ...extra,
    chunk('IDAT', Buffer.alloc(0)), chunk('IEND', Buffer.alloc(0))]);
}

describe('the API token', () => {
  const dir = mkdtempSync(join(tmpdir(), 'asc-key-'));
  after(() => rmSync(dir, { recursive: true, force: true }));
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const keyPath = join(dir, 'AuthKey_TEST123456.p8');
  writeFileSync(keyPath, privateKey.export({ type: 'pkcs8', format: 'pem' }));
  const decode = part => JSON.parse(Buffer.from(part, 'base64url').toString());

  it('is an ES256 JWT that the public key verifies', () => {
    const now = Date.UTC(2026, 9, 16, 12);
    const token = signToken({ keyId: 'TEST123456', issuerId: 'issuer-uuid', privateKey: loadPrivateKey(keyPath), now });
    const [header, payload, signature] = token.split('.');
    assert.deepEqual(decode(header), { alg: 'ES256', kid: 'TEST123456', typ: 'JWT' });
    const claims = decode(payload);
    assert.equal(claims.iss, 'issuer-uuid');
    assert.equal(claims.aud, 'appstoreconnect-v1');
    assert.equal(claims.exp - claims.iat, 1200);
    assert.ok(claims.iat <= now / 1000 && claims.exp > now / 1000 + 15 * 60);
    const raw = Buffer.from(signature, 'base64url');
    assert.equal(raw.length, 64);
    assert.ok(verify('sha256', Buffer.from(`${header}.${payload}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, raw));
    assert.ok(!verify('sha256', Buffer.from(`${header}.${payload}x`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, raw));
  });

  it('is signed again once it is 15 minutes old', () => {
    let now = Date.UTC(2026, 9, 16, 12);
    const token = tokenSource({ keyId: 'TEST123456', issuerId: 'issuer-uuid', privateKey: loadPrivateKey(keyPath) }, () => now);
    const first = token();
    now += 14 * 60_000;
    assert.equal(token(), first);
    now += 60_000;
    const second = token();
    assert.notEqual(second, first);
    assert.equal(decode(second.split('.')[1]).iat - decode(first.split('.')[1]).iat, 15 * 60);
  });
});

describe('the screenshots', () => {
  it('reads the size and colour type from IHDR', () => {
    assert.deepEqual(readPng(png(1206, 2622, 2)), { width: 1206, height: 2622, colorType: 2, alpha: false, transparency: false });
    assert.equal(readPng(png(1320, 2868, 6)).alpha, true);
    assert.equal(readPng(png(1320, 2868, 4)).alpha, true);
    assert.equal(readPng(png(1320, 2868, 3, [chunk('PLTE', Buffer.alloc(3)), chunk('tRNS', Buffer.from([0]))])).transparency, true);
    assert.throws(() => readPng(Buffer.from('not a png at all, just some text here')), /not a PNG/);
  });

  it('takes only the sizes of their folder, without alpha', () => {
    assert.deepEqual(screenshotProblems('a.png', '6.3', readPng(png(1206, 2622, 2))), []);
    assert.deepEqual(screenshotProblems('a.png', '6.3', readPng(png(1179, 2556, 2))), []);
    assert.deepEqual(screenshotProblems('a.png', '6.9', readPng(png(1260, 2736, 2))), []);
    assert.match(screenshotProblems('a.png', '6.3', readPng(png(1320, 2868, 2)))[0], /1320×2868; 6\.3 takes 1206×2622 or 1179×2556/);
    assert.match(screenshotProblems('a.png', '6.9', readPng(png(1320, 2868, 6)))[0], /alpha channel/);
  });
});

describe('the listing text', () => {
  const fields = { name: 'ScootRadar: E-Scooter Map', description: 'Every scooter.' };

  it('keeps to App Store Connect limits', () => {
    assert.deepEqual(validateFields('en-US', fields), []);
    assert.deepEqual(validateFields('en-US', { ...fields, name: 'S' }), ['en-US: name has 1 characters (2 to 30)']);
    assert.match(validateFields('en-US', { ...fields, subtitle: 'x'.repeat(31) })[0], /subtitle has 31/);
    assert.match(validateFields('en-US', { ...fields, promotionalText: 'x'.repeat(171) })[0], /promotional text has 171/);
    assert.match(validateFields('fr-FR', { name: 'Nom' })[0], /description\.txt is missing/);
  });

  it('counts keywords in bytes', () => {
    assert.deepEqual(validateFields('fr-FR', { ...fields, keywords: 'é'.repeat(50) }), []);
    assert.deepEqual(validateFields('fr-FR', { ...fields, keywords: `${'é'.repeat(50)}x` }),
      ['fr-FR: keywords has 101 bytes (at most 100 bytes in UTF-8)']);
  });

  it('unwraps the review notes into paragraphs and list items', () => {
    const readme = '## Review notes\n\nPaste:\n\n```\nFirst line\nwraps here.\n\nTo try it:\n1. One\n   continued.\n2. Two\n```\n\n## Next\n';
    assert.equal(reviewNotes(readme), 'First line wraps here.\n\nTo try it:\n1. One continued.\n2. Two');
    assert.equal(reflow('a\nb'), 'a b');
    assert.throws(() => reviewNotes('## Other\n'), /no ``` block/);
  });
});

describe('the age rating', () => {
  it('answers every question No or None and leaves the rest alone', () => {
    const { answers, unknown } = ageRatingAnswers({
      advertising: null, gambling: true, violenceRealistic: 'FREQUENT', contests: null, kidsAgeBand: null,
      ageRatingOverride: 'NONE', ageRatingOverrideV2: null, developerAgeRatingInfoUrl: null,
      someNewQuestion: true, someNewFrequency: 'INFREQUENT', someNewUnknown: null,
    });
    assert.deepEqual(answers, {
      advertising: false, gambling: false, violenceRealistic: 'NONE', contests: 'NONE', ageRatingOverrideV2: 'NONE',
      someNewQuestion: false, someNewFrequency: 'NONE',
    });
    assert.deepEqual(unknown, ['someNewUnknown']);
  });

  it('only sends what differs', () => {
    assert.deepEqual(changes({ a: false, b: 'NONE', c: null }, { a: false, b: 'NONE', c: false, d: 'x' }), { c: false, d: 'x' });
  });
});
