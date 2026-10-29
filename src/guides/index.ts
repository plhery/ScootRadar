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
import charleroiFr from './fr/trottinette-electrique-charleroi';
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
import norwichEn from './en/e-scooters-norwich';
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
import mannheimDe from './de/e-scooter-mannheim';
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
import chicagoEn from './en/e-scooters-chicago';
import seattleEn from './en/e-scooters-seattle';
import calgaryEn from './en/e-scooters-calgary';
import aucklandEn from './en/e-scooters-auckland';
import fuerteventuraEs from './es/alquiler-patinete-electrico-fuerteventura';
import torreviejaEs from './es/alquiler-patinete-electrico-torrevieja';
import cataniaIt from './it/monopattini-sharing-catania';
import losAngelesEn from './en/e-scooters-los-angeles';
import essenDe from './de/e-scooter-essen';
import baerumNb from './nb/elsparkesykkel-baerum';
import newYorkEn from './en/e-scooters-new-york';
import sanFranciscoEn from './en/e-scooters-san-francisco';
import heidelbergDe from './de/e-scooter-heidelberg';
import edmontonEn from './en/e-scooters-edmonton';
import atlantaEn from './en/e-scooters-atlanta';
import baltimoreEn from './en/e-scooters-baltimore';
import kaiserslauternDe from './de/e-scooter-kaiserslautern';
import lillestromNb from './nb/elsparkesykkel-lillestrom';
import denverEn from './en/e-scooters-denver';
import norfolkEn from './en/e-scooters-norfolk';
import aachenDe from './de/e-scooter-aachen';
import vancouverEn from './en/e-scooters-vancouver';
import sandefjordNb from './nb/elsparkesykkel-sandefjord';
import tubingenDe from './de/e-scooter-tuebingen';
import detroitEn from './en/e-scooters-detroit';
import bournemouthEn from './en/e-scooters-bournemouth';
import alesundNb from './nb/elsparkesykkel-alesund';
import ostendNl from './nl/deelstep-oostende';
import columbusEn from './en/e-scooters-columbus';
import skienNb from './nb/elsparkesykkel-skien';
import portimaoPt from './pt/trotinetes-portimao';
import ottawaEn from './en/e-scooters-ottawa';
import konstanzDe from './de/e-scooter-konstanz';
import tonsbergNb from './nb/elsparkesykkel-tonsberg';
import sanAntonioEn from './en/e-scooters-san-antonio';
import bodoNb from './nb/elsparkesykkel-bodo';
import tempeEn from './en/e-scooters-tempe';
import askerNb from './nb/elsparkesykkel-asker';
import nashvilleEn from './en/e-scooters-nashville';
import flughafenZuerichDe from './de/e-trottinett-flughafen-zuerich';
import gainesvilleEn from './en/e-scooters-gainesville';
import zurichAirportEn from './en/e-scooters-zurich-airport';
import santaMonicaEn from './en/e-scooters-santa-monica';
import leedsEn from './en/e-scooters-leeds';
import christchurchEn from './en/e-scooters-christchurch';
import wellingtonEn from './en/e-scooters-wellington';
import brightonEn from './en/e-scooters-brighton';
import erfurtDe from './de/e-scooter-erfurt';
import potsdamDe from './de/e-scooter-potsdam';
import regensburgDe from './de/e-scooter-regensburg';
import heilbronnDe from './de/e-scooter-heilbronn';
import plymouthEn from './en/e-scooters-plymouth';
import wuerzburgDe from './de/e-scooter-wuerzburg';
import goettingenDe from './de/e-scooter-goettingen';
import pforzheimDe from './de/e-scooter-pforzheim';
import sanDiegoEn from './en/e-scooters-san-diego';
import reutlingenDe from './de/e-scooter-reutlingen';
import phoenixEn from './en/e-scooters-phoenix';
import villingenSchwenningenDe from './de/e-scooter-villingen-schwenningen';
import openingHoursNb from './nb/elsparkesykkel-apningstider';
import oeirasPt from './pt/trotinetes-oeiras';
import matosinhosPt from './pt/trotinetes-matosinhos';
import bielDe from './de/e-trottinett-biel';
import gijonEs from './es/alquiler-patinete-electrico-gijon';
import bathEn from './en/e-scooters-bath';
import mechelenNl from './nl/deelstep-mechelen';
import cherbourgFr from './fr/trottinette-electrique-cherbourg';
import hamburgDe from './de/e-scooter-hamburg';
import milanIt from './it/monopattini-sharing-milano';
import londonEn from './en/e-scooters-london';
import nurembergDe from './de/e-scooter-nuernberg';
import bonnDe from './de/e-scooter-bonn';
import kielDe from './de/e-scooter-kiel';
import dortmundDe from './de/e-scooter-dortmund';
import wiesbadenDe from './de/e-scooter-wiesbaden';
import turinIt from './it/monopattini-sharing-torino';
import duisburgDe from './de/e-scooter-duisburg';
import saarbrueckenDe from './de/e-scooter-saarbruecken';
import moenchengladbachDe from './de/e-scooter-moenchengladbach';
import kasselDe from './de/e-scooter-kassel';
import braunschweigDe from './de/e-scooter-braunschweig';
import wienDe from './de/e-scooter-wien';
import osnabrueckDe from './de/e-scooter-osnabrueck';
import northamptonEn from './en/e-scooters-northampton';
import oxfordEn from './en/e-scooters-oxford';
import ingolstadtDe from './de/e-scooter-ingolstadt';
import bielefeldDe from './de/e-scooter-bielefeld';
import southamptonEn from './en/e-scooters-southampton';
import cambridgeEn from './en/e-scooters-cambridge';
import cheltenhamEn from './en/e-scooters-cheltenham';
import padovaIt from './it/monopattini-sharing-padova';
import portlandEn from './en/e-scooters-portland';
import bremenDe from './de/e-scooter-bremen';
import rostockDe from './de/e-scooter-rostock';
import paderbornDe from './de/e-scooter-paderborn';
import augsburgDe from './de/e-scooter-augsburg';
import flensburgDe from './de/e-scooter-flensburg';
import birminghamEn from './en/e-scooters-birmingham';
import miltonKeynesEn from './en/e-scooters-milton-keynes';
import wolfsburgDe from './de/e-scooter-wolfsburg';
import ulmDe from './de/e-scooter-ulm';
import salfordEn from './en/e-scooters-salford';
import liegeFr from './fr/trottinette-electrique-liege';
import santiagoEs from './es/scooters-electricos-santiago-chile';
import saoPauloEn from './en/e-scooters-sao-paulo';
import helsinkiEn from './en/e-scooters-helsinki';
import gdanskEn from './en/e-scooters-gdansk';
import warsawEn from './en/e-scooters-warsaw';
import stockholmEn from './en/e-scooters-stockholm';
import krakowEn from './en/e-scooters-krakow';
import istanbulEn from './en/e-scooters-istanbul';
import portoAlegreEn from './en/e-scooters-porto-alegre';
import florianopolisEn from './en/e-scooters-florianopolis';
import bucharestEn from './en/e-scooters-bucharest';
import seoulEn from './en/e-scooters-seoul';
import poznanEn from './en/e-scooters-poznan';
import tallinnEn from './en/e-scooters-tallinn';
import curitibaEn from './en/e-scooters-curitiba';
import monterreyEs from './es/scooters-electricos-monterrey';
import wroclawEn from './en/e-scooters-wroclaw';
import antalyaEn from './en/e-scooters-antalya';
import tokyoEn from './en/e-scooters-tokyo';
import budapestEn from './en/e-scooters-budapest';
import recifeEn from './en/e-scooters-recife';
import newarkEn from './en/e-scooters-newark';
import campoGrandeEn from './en/e-scooters-campo-grande';
import fayettevilleEn from './en/e-scooters-fayetteville';
import indianapolisEn from './en/e-scooters-indianapolis';
import tampaEn from './en/e-scooters-tampa';
import saltLakeCityEn from './en/e-scooters-salt-lake-city';
import clevelandEn from './en/e-scooters-cleveland';
import richmondEn from './en/e-scooters-richmond';
import dallasEn from './en/e-scooters-dallas';
import minneapolisEn from './en/e-scooters-minneapolis';
import stPaulEn from './en/e-scooters-st-paul';
import raleighEn from './en/e-scooters-raleigh';
import camposDoJordaoEn from './en/e-scooters-campos-do-jordao';
import durhamEn from './en/e-scooters-durham';
import lexingtonEn from './en/e-scooters-lexington';
import culverCityEn from './en/e-scooters-culver-city';
import fairfaxEn from './en/e-scooters-fairfax';
import bariIt from './it/monopattini-sharing-bari';
import darmstadtDe from './de/e-scooter-darmstadt';
import bochumDe from './de/e-scooter-bochum';
import mainzDe from './de/e-scooter-mainz';
import veronaIt from './it/monopattini-sharing-verona';
import luebeckDe from './de/e-scooter-luebeck';
import oberhausenDe from './de/e-scooter-oberhausen';
import neussDe from './de/e-scooter-neuss';
import muelheimDe from './de/e-scooter-muelheim';
import linzDe from './de/e-scooter-linz';
import hagenDe from './de/e-scooter-hagen';
import oldenburgDe from './de/e-scooter-oldenburg';
import dresdenDe from './de/e-scooter-dresden';
import magdeburgDe from './de/e-scooter-magdeburg';
import halleDe from './de/e-scooter-halle';
import hammDe from './de/e-scooter-hamm';
import chemnitzDe from './de/e-scooter-chemnitz';
import solingenDe from './de/e-scooter-solingen';
import fuerthDe from './de/e-scooter-fuerth';
import bergenNb from './nb/elsparkesykkel-bergen';
import innsbruckDe from './de/e-scooter-innsbruck';
import malmoEn from './en/e-scooters-malmo';
import austinEn from './en/e-scooters-austin';
import gothenburgEn from './en/e-scooters-gothenburg';
import sindelfingenDe from './de/e-scooter-sindelfingen';
import tampereEn from './en/e-scooters-tampere';
import linkopingEn from './en/e-scooters-linkoping';
import osakaEn from './en/e-scooters-osaka';
import milwaukeeEn from './en/e-scooters-milwaukee';
import turkuEn from './en/e-scooters-turku';
import uppsalaEn from './en/e-scooters-uppsala';
import orebroEn from './en/e-scooters-orebro';
import spokaneEn from './en/e-scooters-spokane';

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
  norwichEn,
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
  chicagoEn,
  seattleEn,
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
  mannheimDe,
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
  charleroiFr,
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
  essenDe,
  losAngelesEn,
  baerumNb,
  newYorkEn,
  sanFranciscoEn,
  heidelbergDe,
  edmontonEn,
  atlantaEn,
  baltimoreEn,
  kaiserslauternDe,
  lillestromNb,
  denverEn,
  norfolkEn,
  aachenDe,
  vancouverEn,
  sandefjordNb,
  tubingenDe,
  detroitEn,
  bournemouthEn,
  alesundNb,
  ostendNl,
  columbusEn,
  skienNb,
  portimaoPt,
  ottawaEn,
  konstanzDe,
  tonsbergNb,
  sanAntonioEn,
  bodoNb,
  tempeEn,
  askerNb,
  nashvilleEn,
  flughafenZuerichDe,
  gainesvilleEn,
  zurichAirportEn,
  santaMonicaEn,
  leedsEn,
  christchurchEn,
  wellingtonEn,
  brightonEn,
  erfurtDe,
  potsdamDe,
  regensburgDe,
  heilbronnDe,
  plymouthEn,
  wuerzburgDe,
  goettingenDe,
  pforzheimDe,
  sanDiegoEn,
  reutlingenDe,
  phoenixEn,
  villingenSchwenningenDe,
  openingHoursNb,
  oeirasPt,
  matosinhosPt,
  bielDe,
  gijonEs,
  bathEn,
  mechelenNl,
  cherbourgFr,
  hamburgDe,
  milanIt,
  londonEn,
  nurembergDe,
  bonnDe,
  kielDe,
  dortmundDe,
  wiesbadenDe,
  turinIt,
  duisburgDe,
  saarbrueckenDe,
  moenchengladbachDe,
  kasselDe,
  braunschweigDe,
  wienDe,
  osnabrueckDe,
  northamptonEn,
  oxfordEn,
  ingolstadtDe,
  bielefeldDe,
  southamptonEn,
  cambridgeEn,
  cheltenhamEn,
  padovaIt,
  portlandEn,
  bremenDe,
  rostockDe,
  paderbornDe,
  augsburgDe,
  flensburgDe,
  birminghamEn,
  miltonKeynesEn,
  wolfsburgDe,
  ulmDe,
  salfordEn,
  liegeFr,
  santiagoEs,
  saoPauloEn,
  helsinkiEn,
  gdanskEn,
  warsawEn,
  stockholmEn,
  krakowEn,
  istanbulEn,
  portoAlegreEn,
  florianopolisEn,
  bucharestEn,
  seoulEn,
  poznanEn,
  tallinnEn,
  curitibaEn,
  monterreyEs,
  wroclawEn,
  antalyaEn,
  tokyoEn,
  budapestEn,
  recifeEn,
  newarkEn,
  campoGrandeEn,
  fayettevilleEn,
  indianapolisEn,
  tampaEn,
  saltLakeCityEn,
  clevelandEn,
  richmondEn,
  dallasEn,
  minneapolisEn,
  stPaulEn,
  raleighEn,
  camposDoJordaoEn,
  durhamEn,
  lexingtonEn,
  culverCityEn,
  fairfaxEn,
  bariIt,
  darmstadtDe,
  bochumDe,
  mainzDe,
  veronaIt,
  luebeckDe,
  oberhausenDe,
  neussDe,
  muelheimDe,
  linzDe,
  hagenDe,
  oldenburgDe,
  dresdenDe,
  magdeburgDe,
  halleDe,
  hammDe,
  chemnitzDe,
  solingenDe,
  fuerthDe,
  bergenNb,
  innsbruckDe,
  malmoEn,
  austinEn,
  gothenburgEn,
  sindelfingenDe,
  tampereEn,
  linkopingEn,
  osakaEn,
  milwaukeeEn,
  turkuEn,
  uppsalaEn,
  orebroEn,
  spokaneEn,
];
