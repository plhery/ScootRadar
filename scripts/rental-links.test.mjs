import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { rentalHostProblem, rentalProblem } from './rental-links.mjs';

const providers = JSON.parse(readFileSync(new URL('../data/providers.json', import.meta.url), 'utf8'));
const rental = (overrides = {}) => ({ schemes: ['bird'], hosts: ['bird.co', 'birdapp.app.link'], ...overrides });

describe("the rental links' rules", () => {
  it("take every operator's rules in the catalogue", () => {
    const list = Array.isArray(providers) ? providers : providers.providers;
    const problems = list.filter(provider => provider.rental).map(provider => [provider.key, rentalProblem(provider.rental)]);
    expect(problems.filter(([, problem]) => problem)).toEqual([]);
    expect(problems.length).toBeGreaterThan(20);
  });

  it('refuse a host that is a public suffix, under which anyone has a name', () => {
    for (const host of ['co.uk', 'com.ua', 'github.io', 'pages.dev']) {
      expect(rentalHostProblem(host), host).toMatch(/public suffix/);
      expect(rentalProblem(rental({ hosts: ['bird.co', host] })), host).toMatch(/public suffix/);
    }
    // A name under one is the operator's own: 3electra.com.ua, as Zelectra's.
    expect(rentalHostProblem('3electra.com.ua')).toBeNull();
  });

  it("refuse a deep-link service's own name, which would let through every app's links, but take a name under it", () => {
    for (const host of ['app.link', 'adj.st', 'sng.link', 'onelink.me', 'page.link']) {
      expect(rentalHostProblem(host), host).toMatch(/deep-link service/);
    }
    expect(rentalProblem(rental({ hosts: ['bird.co', 'app.link'] }))).toMatch(/"app.link" is a deep-link service/);
    expect(rentalProblem(rental({ hosts: ['bolt.eu'], website: { hosts: ['sng.link'] } }))).toMatch(/website.hosts: "sng.link"/);
    for (const host of ['birdapp.app.link', 'lqfa.adj.st', 'bolt.sng.link']) expect(rentalHostProblem(host), host).toBeNull();
  });

  it('refuse the schemes the phone itself runs: calls, messages, installs, shortcuts and other apps by name', () => {
    for (const scheme of ['tel', 'sms', 'facetime', 'itms-services', 'shortcuts', 'market', 'android-app', 'javascript', 'intent']) {
      expect(rentalProblem(rental({ schemes: ['bird', scheme] })), scheme).toMatch(/none of/);
    }
    expect(rentalProblem(rental({ schemes: ['bird', 'co.ponybikes.mercury'] }))).toBeNull();
  });

  it('refuse hosts that are not lower-case names, or twice the same', () => {
    expect(rentalProblem(rental({ hosts: ['Bird.co'] }))).toMatch(/lower-case host name/);
    expect(rentalProblem(rental({ hosts: ['localhost'] }))).toMatch(/lower-case host name/);
    expect(rentalProblem(rental({ hosts: ['bird.co', 'bird.co'] }))).toMatch(/distinct/);
    expect(rentalProblem(rental({ hosts: [] }))).toBeNull();
  });
});
