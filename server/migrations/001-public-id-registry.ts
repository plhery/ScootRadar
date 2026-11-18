// Applied to the cache volume on startup, before requests are accepted.
export const publicIdSchema = `CREATE TABLE IF NOT EXISTS public_ids (
  key TEXT PRIMARY KEY, id TEXT NOT NULL, lat REAL NOT NULL, lng REAL NOT NULL,
  seenAt INTEGER NOT NULL, keptMs INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS public_id_expiry ON public_ids(seenAt + keptMs);
CREATE INDEX IF NOT EXISTS public_id_seen ON public_ids(seenAt);`;
