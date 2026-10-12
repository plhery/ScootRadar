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
import osloNb from './nb/elsparkesykkel-oslo';
import munichDe from './de/e-scooter-muenchen';
import lyonFr from './fr/trottinette-electrique-lyon';
import brusselsNl from './nl/deelstep-brussel';
import brusselsFr from './fr/trottinette-electrique-bruxelles';
import berlinDe from './de/e-scooter-berlin';
import berlinEn from './en/e-scooters-berlin';
import romeIt from './it/monopattini-sharing-roma';
import romeEn from './en/e-scooters-rome';
import ukHireEn from './en/e-scooter-hire-uk';
import parisFr from './fr/trottinette-libre-service-paris';
import parisEn from './en/e-scooters-paris';
import bernDe from './de/e-trottinett-bern';
import bernEn from './en/e-scooters-bern';
import howToRentEn from './en/how-to-rent-an-e-scooter';
import howToRentDe from './de/e-scooter-mieten';
import howToRentFr from './fr/louer-trottinette-electrique';
import howToRentIt from './it/noleggio-monopattino-elettrico';
import howToRentNl from './nl/deelstep-huren';
import howToRentNb from './nb/leie-elsparkesykkel';
import baselDe from './de/e-trottinett-basel';
import baselEn from './en/e-scooters-basel';

export const GUIDES: readonly Guide[] = [
  swissRulesEn,
  howToRentEn,
  swissPricesEn,
  zurichEn,
  baselEn,
  bernEn,
  ukLawEn,
  ukHireEn,
  berlinEn,
  parisEn,
  romeEn,
  swissRulesDe,
  howToRentDe,
  swissPricesDe,
  zurichDe,
  baselDe,
  bernDe,
  germanRulesDe,
  berlinDe,
  munichDe,
  swissRulesFr,
  howToRentFr,
  frenchRulesFr,
  parisFr,
  lyonFr,
  brusselsFr,
  swissRulesIt,
  howToRentIt,
  italianRulesIt,
  romeIt,
  belgianRulesNl,
  howToRentNl,
  brusselsNl,
  norwegianRulesNb,
  howToRentNb,
  osloNb,
];
