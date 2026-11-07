export const SERVICE_WORKER_RELOAD_GUARD_MS = 15_000;
export const SERVICE_WORKER_LAST_RELOAD_KEY = 'scooters-pwa-last-reload';

interface ReloadStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export function isAppUpdateMessage(data: unknown): boolean {
  return Boolean(
    data &&
    typeof data === 'object' &&
    'type' in data &&
    data.type === 'APP_UPDATED'
  );
}

/**
 * What keeps a new release from reloading the page: a walk, a scooter's card or the search, which a reload would
 * lose. The reload then waits until the last of them is closed; the new page is kept for the next launch meanwhile.
 */
export interface UpdateHold {
  /** Holds updates until the function returned is called. */
  hold: () => () => void;
  held: () => boolean;
  /** Runs `run` once nothing holds updates, in place of what was waiting before. */
  whenFree: (run: () => void) => void;
}

export function createUpdateHold(): UpdateHold {
  let holds = 0;
  let waiting: (() => void) | null = null;
  return {
    hold: () => {
      holds++;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        holds--;
        if (holds > 0 || !waiting) return;
        const run = waiting;
        waiting = null;
        run();
      };
    },
    held: () => holds > 0,
    whenFree: (run) => { waiting = run; },
  };
}

/** The page's own: the map holds it, and the service worker's registration reloads through it. */
export const appUpdateHold = createUpdateHold();

export function createServiceWorkerReloader({
  storage,
  reload,
  now = () => Date.now(),
  hold,
}: {
  storage: ReloadStorage;
  reload: () => void;
  now?: () => number;
  hold?: UpdateHold;
}) {
  let reloading = false;

  const reloadForUpdate = (): boolean => {
    if (reloading) return false;
    if (hold?.held()) {
      hold.whenFree(reloadForUpdate);
      return false;
    }

    const currentTime = now();
    try {
      const lastReloadAt = Number(storage.getItem(SERVICE_WORKER_LAST_RELOAD_KEY) ?? 0);
      if (currentTime - lastReloadAt < SERVICE_WORKER_RELOAD_GUARD_MS) return false;
      storage.setItem(SERVICE_WORKER_LAST_RELOAD_KEY, String(currentTime));
    } catch {
      // Private browsing modes may deny storage while reload still works.
    }

    reloading = true;
    reload();
    return true;
  };
  return reloadForUpdate;
}
