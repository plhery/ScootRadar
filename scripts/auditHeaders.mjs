import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * The header that tells the Worker a request for scooters is one of our own scripts' (SCOOTER_AUDIT_HEADER in
 * src/lib/scooterClient.ts): without it, a script is none of our maps and apps, and production answers it 403. The
 * token is SCOOTRADAR_AUDIT_TOKEN, as in CI, or ~/.config/scootradar/audit-token on our machines (DEPLOY.md, "Map
 * passes"); it is never printed. Without either, no header.
 */
export function auditHeaders() {
  let token = process.env.SCOOTRADAR_AUDIT_TOKEN?.trim();
  if (!token) {
    try {
      token = readFileSync(join(homedir(), '.config', 'scootradar', 'audit-token'), 'utf8').trim();
    } catch {
      // No token on this machine.
    }
  }
  return token ? { 'X-Scooter-Audit': token } : {};
}

/** What to add to an error for a 403 of the scooter API: the token is likely missing or wrong. */
export const auditHint = status => status === 403
  ? ' (no audit token, or a wrong one: set SCOOTRADAR_AUDIT_TOKEN, DEPLOY.md "Map passes")' : '';
