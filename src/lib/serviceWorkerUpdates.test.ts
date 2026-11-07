import { describe, expect, it, vi } from 'vitest';
import {
  SERVICE_WORKER_LAST_RELOAD_KEY,
  createServiceWorkerReloader,
  createUpdateHold,
  isAppUpdateMessage,
} from '@/lib/serviceWorkerUpdates';

describe('service-worker updates', () => {
  it('recognizes only the app-update message', () => {
    expect(isAppUpdateMessage({ type: 'APP_UPDATED' })).toBe(true);
    expect(isAppUpdateMessage({ type: 'CHECK_FOR_UPDATE' })).toBe(false);
    expect(isAppUpdateMessage(null)).toBe(false);
  });

  it('reloads once and stores a loop guard', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const reload = vi.fn();
    const reloadForUpdate = createServiceWorkerReloader({
      storage,
      reload,
      now: () => 20_000,
    });

    expect(reloadForUpdate()).toBe(true);
    expect(reloadForUpdate()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(values.get(SERVICE_WORKER_LAST_RELOAD_KEY)).toBe('20000');
  });

  it('does not reload again inside the cross-navigation guard window', () => {
    const reload = vi.fn();
    const reloadForUpdate = createServiceWorkerReloader({
      storage: {
        getItem: () => '10000',
        setItem: vi.fn(),
      },
      reload,
      now: () => 20_000,
    });

    expect(reloadForUpdate()).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('waits while a walk, a card or the search holds the page, then reloads once all are closed', () => {
    const reload = vi.fn();
    const hold = createUpdateHold();
    const reloadForUpdate = createServiceWorkerReloader({
      storage: { getItem: () => null, setItem: vi.fn() },
      reload,
      now: () => 20_000,
      hold,
    });
    const releaseWalk = hold.hold();
    const releaseSearch = hold.hold();

    expect(reloadForUpdate()).toBe(false);
    // The worker says so again at each check while the update waits.
    expect(reloadForUpdate()).toBe(false);
    releaseWalk();
    releaseWalk();
    expect(reload).not.toHaveBeenCalled();
    releaseSearch();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads at once when nothing holds the page, and closing a card later does nothing', () => {
    const reload = vi.fn();
    const hold = createUpdateHold();
    const release = hold.hold();
    release();
    const reloadForUpdate = createServiceWorkerReloader({
      storage: { getItem: () => null, setItem: vi.fn() },
      reload,
      now: () => 20_000,
      hold,
    });

    expect(reloadForUpdate()).toBe(true);
    hold.hold()();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload when the page is closed without an update waiting', () => {
    const reload = vi.fn();
    const hold = createUpdateHold();
    createServiceWorkerReloader({ storage: { getItem: () => null, setItem: vi.fn() }, reload, hold });

    hold.hold()();
    expect(reload).not.toHaveBeenCalled();
  });
});
