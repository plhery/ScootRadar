// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

const denied = () => { throw new DOMException('The operation is insecure.', 'SecurityError'); };

let serviceWorker: EventTarget & { controller: object | null; register: () => Promise<never>; getRegistration: () => Promise<undefined> };
const reload = vi.fn();

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production');
  // A replacement worker: the page it controls reloads when the new one takes over.
  serviceWorker = Object.assign(new EventTarget(), {
    controller: {},
    register: () => new Promise<never>(() => {}),
    getRegistration: async () => undefined,
  });
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: serviceWorker });
  // Safari with every cookie blocked throws as soon as the storage is reached.
  Object.defineProperty(window, 'sessionStorage', { configurable: true, get: denied });
  Object.defineProperty(window, 'location', { configurable: true, value: { ...window.location, reload } });
});

afterEach(() => {
  // Unmount first: it lets go of the worker removed below.
  cleanup();
  vi.unstubAllEnvs();
  reload.mockClear();
  Reflect.deleteProperty(navigator, 'serviceWorker');
  Reflect.deleteProperty(window, 'sessionStorage');
});

it('leaves the page standing where the browser denies storage, and still reloads into an update once', () => {
  render(<><ServiceWorkerRegistration /><p>The map</p></>);
  expect(screen.getByText('The map')).toBeInTheDocument();

  act(() => {
    serviceWorker.dispatchEvent(new Event('controllerchange'));
    serviceWorker.dispatchEvent(new Event('controllerchange'));
  });
  expect(reload).toHaveBeenCalledTimes(1);
});
