import { describe, expect, it } from 'vitest';
import { isAppUserAgent, isBrowserUserAgent } from '@/lib/scooterClient';

describe("a browser's user agent", () => {
  it("is Safari's, Chrome's, Edge's, Firefox's, Samsung's or an in-app web view's", () => {
    for (const agent of [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Safari/605.1.15',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0',
      'Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0',
      'Mozilla/5.0 (Linux; Android 15; SAMSUNG SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 400.0',
      'Mozilla/5.0 (Linux; Android 15; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/142.0.0.0 Mobile Safari/537.36',
    ]) expect(isBrowserUserAgent(agent), agent).toBe(true);
  });

  it("is not a script's, a crawler's or none", () => {
    for (const agent of [
      'Mozilla/5.0', 'Mozilla/5.0 (review)', 'curl/8.7.1', 'node', 'python-requests/2.32.3', 'PiHomeSystem/1.0',
      'NRW-availability-pilot/0.1', 'Go-http-client/2.0',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)',
      'ScootRadar/1.6 (iPhone)', 'okhttp/4.12.0', '', null, undefined,
    ]) expect(isBrowserUserAgent(agent), String(agent)).toBe(false);
  });

  it("is not our apps', which are told apart on their own", () => {
    expect(isAppUserAgent('ScootRadar/1.6 CFNetwork/3860 Darwin/25.1.0')).toBe(true);
    expect(isAppUserAgent('okhttp/4.12.0')).toBe(true);
    expect(isAppUserAgent('Mozilla/5.0 (Linux; Android 15) okhttp/4.12.0')).toBe(false);
  });
});
