import catalog from '../../data/rule-zones.json';
import type { RuleZone } from '@/lib/ruleZones';

/**
 * The streets and areas of data/rule-zones.json (148 KB): kept out of ruleZones.ts, so that the map page loads
 * them once it is up (useRuleCatalogs.ts).
 */
export const RULE_ZONES = catalog.zones as unknown as RuleZone[];
