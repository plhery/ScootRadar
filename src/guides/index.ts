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
import munichEn from './en/e-scooters-munich';
import osloEn from './en/e-scooters-oslo';
import brusselsEn from './en/e-scooters-brussels';
import portugueseRulesPt from './pt/trotinete-eletrica-regras-portugal';
import lisbonPt from './pt/trotinetes-lisboa';
import lisbonEn from './en/e-scooters-lisbon';
import portoPt from './pt/trotinetes-porto';
import portoEn from './en/e-scooters-porto';
import frankfurtDe from './de/e-scooter-frankfurt';
import icelandicRulesIs from './is/rafskutur-reglur';
import spanishRulesEs from './es/normativa-patinete-electrico-espana';
import reykjavikIs from './is/rafskutur-reykjavik';
import reykjavikEn from './en/e-scooters-reykjavik';
import cologneDe from './de/e-scooter-koeln';
import howToRentPt from './pt/alugar-trotinete-eletrica';
import cascaisPt from './pt/trotinetes-cascais';
import coimbraPt from './pt/trotinetes-coimbra';
import howToRentEs from './es/alquilar-patinete-electrico';
import howToRentIs from './is/leigja-rafskutu';
import marseilleFr from './fr/trottinette-electrique-marseille';
import bristolEn from './en/e-scooters-bristol';
import bordeauxFr from './fr/trottinette-electrique-bordeaux';
import stuttgartDe from './de/e-scooter-stuttgart';
import winterthurDe from './de/e-trottinett-winterthur';
import tenerifeEn from './en/e-scooters-tenerife';
import tenerifeEs from './es/alquiler-patinete-electrico-tenerife-sur';
import trondheimNb from './nb/elsparkesykkel-trondheim';
import naplesIt from './it/monopattini-sharing-napoli';
import antwerpNl from './nl/deelstep-antwerpen';
import lilleFr from './fr/trottinette-electrique-lille';
import liverpoolEn from './en/e-scooters-liverpool';
import nottinghamEn from './en/e-scooters-nottingham';
import dusseldorfDe from './de/e-scooter-duesseldorf';
import hanoverDe from './de/e-scooter-hannover';
import stavangerNb from './nb/elsparkesykkel-stavanger';
import palermoIt from './it/monopattini-sharing-palermo';
import stGallenDe from './de/e-trottinett-st-gallen';
import grenobleFr from './fr/trottinette-electrique-grenoble';
import karlsruheDe from './de/e-scooter-karlsruhe';
import freiburgDe from './de/e-scooter-freiburg';
import wuppertalDe from './de/e-scooter-wuppertal';
import leipzigDe from './de/e-scooter-leipzig';
import tromsoNb from './nb/elsparkesykkel-tromso';
import tromsoEn from './en/e-scooters-tromso';
import munsterDe from './de/e-scooter-muenster';
import kristiansandNb from './nb/elsparkesykkel-kristiansand';
import fredrikstadNb from './nb/elsparkesykkel-fredrikstad';
import leHavreFr from './fr/trottinette-electrique-le-havre';
import angersFr from './fr/trottinette-electrique-angers';
import rhodesEn from './en/e-scooters-rhodes';
import kosEn from './en/e-scooters-kos';
import rigaEn from './en/e-scooters-riga';
import fuerteventuraEn from './en/e-scooters-fuerteventura';
import dubaiEn from './en/e-scooters-dubai';
import telAvivEn from './en/e-scooters-tel-aviv';
import washingtonEn from './en/e-scooters-washington-dc';
import calgaryEn from './en/e-scooters-calgary';
import aucklandEn from './en/e-scooters-auckland';
import fuerteventuraEs from './es/alquiler-patinete-electrico-fuerteventura';
import torreviejaEs from './es/alquiler-patinete-electrico-torrevieja';
import cataniaIt from './it/monopattini-sharing-catania';

export const GUIDES: readonly Guide[] = [
  swissRulesEn,
  howToRentEn,
  swissPricesEn,
  zurichEn,
  baselEn,
  bernEn,
  ukLawEn,
  ukHireEn,
  bristolEn,
  liverpoolEn,
  nottinghamEn,
  berlinEn,
  munichEn,
  parisEn,
  romeEn,
  brusselsEn,
  lisbonEn,
  portoEn,
  osloEn,
  tromsoEn,
  reykjavikEn,
  tenerifeEn,
  fuerteventuraEn,
  rhodesEn,
  kosEn,
  rigaEn,
  dubaiEn,
  telAvivEn,
  washingtonEn,
  calgaryEn,
  aucklandEn,
  swissRulesDe,
  howToRentDe,
  swissPricesDe,
  zurichDe,
  baselDe,
  bernDe,
  winterthurDe,
  stGallenDe,
  germanRulesDe,
  berlinDe,
  munichDe,
  cologneDe,
  frankfurtDe,
  stuttgartDe,
  dusseldorfDe,
  hanoverDe,
  karlsruheDe,
  munsterDe,
  freiburgDe,
  wuppertalDe,
  leipzigDe,
  swissRulesFr,
  howToRentFr,
  frenchRulesFr,
  parisFr,
  lyonFr,
  marseilleFr,
  bordeauxFr,
  lilleFr,
  grenobleFr,
  leHavreFr,
  angersFr,
  brusselsFr,
  swissRulesIt,
  howToRentIt,
  italianRulesIt,
  romeIt,
  naplesIt,
  palermoIt,
  cataniaIt,
  belgianRulesNl,
  howToRentNl,
  brusselsNl,
  antwerpNl,
  norwegianRulesNb,
  howToRentNb,
  osloNb,
  trondheimNb,
  stavangerNb,
  tromsoNb,
  kristiansandNb,
  fredrikstadNb,
  portugueseRulesPt,
  howToRentPt,
  lisbonPt,
  portoPt,
  cascaisPt,
  coimbraPt,
  spanishRulesEs,
  howToRentEs,
  tenerifeEs,
  fuerteventuraEs,
  torreviejaEs,
  icelandicRulesIs,
  howToRentIs,
  reykjavikIs,
];
