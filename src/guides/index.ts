// Every guide of the site, src/lib/guides.ts. In each language the order is
// the order of its list: the ones to read first at the top.

import type { Guide } from '@/lib/guides';
import swissRulesEn from './en/e-scooter-rules-switzerland';
import zurichEn from './en/e-scooters-zurich';
import swissPricesEn from './en/e-scooter-prices-switzerland';
import ukLawEn from './en/are-e-scooters-legal-uk';
import swissRulesDe from './de/e-trottinett-regeln-schweiz';
import zurichDe from './de/e-trottinett-zuerich';
import swissPricesDe from './de/e-trottinett-preise-schweiz';
import germanRulesDe from './de/e-scooter-regeln-deutschland';
import swissRulesFr from './fr/trottinette-electrique-regles-suisse';
import frenchRulesFr from './fr/trottinette-electrique-regles-france';
import swissRulesIt from './it/monopattino-elettrico-regole-svizzera';
import italianRulesIt from './it/monopattino-elettrico-regole-italia';
import belgianRulesNl from './nl/elektrische-step-regels-belgie';
import norwegianRulesNb from './nb/elsparkesykkel-regler';

export const GUIDES: readonly Guide[] = [
  swissRulesEn,
  zurichEn,
  swissPricesEn,
  ukLawEn,
  swissRulesDe,
  zurichDe,
  swissPricesDe,
  germanRulesDe,
  swissRulesFr,
  frenchRulesFr,
  swissRulesIt,
  italianRulesIt,
  belgianRulesNl,
  norwegianRulesNb,
];
