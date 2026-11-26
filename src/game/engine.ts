/**
 * Reine Spiellogik (ohne React, ohne Netzwerk). Der Host-Browser hält einen GameState
 * und ruft diese Funktionen auf. Alle Funktionen verändern den übergebenen Zustand direkt
 * und sind dadurch leicht zu testen.
 */
import { FRAGEN, istBibelFrage, type FragenMix } from '../data/fragen';
import { randomHex, shuffle } from '../lib/random';
import {
  EREIGNIS_FELDER,
  EREIGNIS_INFO,
  FRAGE_MS,
  KULANZ_MS,
  MAX_FRAGEN,
  MAX_SPIELER,
  PUNKTE_RICHTIG,
  PUNKTE_SCHNELL,
  SCHNELL_MS,
  ZIEL_FELD,
  type Ereignis,
} from './constants';
import { wuerfleFigur, type Figur } from './figuren';

export type Phase = 'lobby' | 'frage' | 'aufloesung' | 'ende';

export interface Spieler {
  id: string;
  token: string;
  figur: Figur;
  feld: number;
  richtigeAntworten: number;
  /** Summe der Antwortzeiten; keine Antwort zählt die volle Zeit */
  gesamtMs: number;
  keinBonusNaechsteRunde: boolean;
  neuGewuerfelt: boolean;
  bot: boolean;
  beigetretenUm: number;
}

export interface Antwort {
  index: number;
  ms: number;
}

export interface Zug {
  beantwortet: boolean;
  richtig: boolean;
  schnell: boolean;
  /** Schnell geantwortet, aber durch die Volkszählung kein Bonus */
  bonusGesperrt: boolean;
  schritte: number;
  von: number;
  landung: number;
  ereignis: Ereignis | null;
  nach: number;
}

/** Eine Frage, wie sie in diesem Spiel gezeigt wird (Antworten gemischt). */
export interface Runde {
  frageIndex: number;
  /** reihenfolge[i] = Index der Original-Antwort, die als Antwort i gezeigt wird */
  reihenfolge: number[];
}

export interface GameState {
  code: string;
  klasse: string;
  fragenMix: FragenMix;
  phase: Phase;
  runden: Runde[];
  /** 0-basiert: aktuelle bzw. zuletzt gespielte Runde */
  rundeNr: number;
  frageStart: number;
  antworten: Record<string, Antwort>;
  spieler: Record<string, Spieler>;
  entfernt: string[];
  letzteZuege: Record<string, Zug>;
  aktualisiert: number;
}

export function neuesSpiel(code: string, klasse = '', fragenMix: FragenMix = 'gemischt'): GameState {
  return {
    code,
    klasse,
    fragenMix,
    phase: 'lobby',
    runden: [],
    rundeNr: -1,
    frageStart: 0,
    antworten: {},
    spieler: {},
    entfernt: [],
    letzteZuege: {},
    aktualisiert: Date.now(),
  };
}

export function spielerListe(s: GameState): Spieler[] {
  return Object.values(s.spieler);
}

export type BeitrittErgebnis =
  | { ok: true; spieler: Spieler; neu: boolean }
  | { ok: false; grund: 'voll' | 'entfernt' };

/** Beitritt oder Wiedereinstieg. Ein bekannter Spieler muss sein Token mitschicken. */
export function beitreten(
  s: GameState,
  id: string,
  token: string,
  now: number,
  bot = false,
): BeitrittErgebnis {
  if (s.entfernt.includes(id)) return { ok: false, grund: 'entfernt' };
  const vorhanden = s.spieler[id];
  if (vorhanden) {
    if (vorhanden.token !== token) return { ok: false, grund: 'entfernt' };
    return { ok: true, spieler: vorhanden, neu: false };
  }
  if (spielerListe(s).length >= MAX_SPIELER) return { ok: false, grund: 'voll' };
  const verpasst =
    s.phase === 'lobby' ? 0 : s.phase === 'frage' ? s.rundeNr : s.rundeNr + 1;
  const spieler: Spieler = {
    id,
    token,
    figur: wuerfleFigur(spielerListe(s).map((p) => p.figur)),
    feld: 0,
    richtigeAntworten: 0,
    // Wer später einsteigt, bekommt für verpasste Fragen die volle Zeit angerechnet.
    gesamtMs: Math.max(0, verpasst) * FRAGE_MS,
    keinBonusNaechsteRunde: false,
    neuGewuerfelt: false,
    bot,
    beigetretenUm: now,
  };
  s.spieler[id] = spieler;
  s.aktualisiert = now;
  return { ok: true, spieler, neu: true };
}

/** Einmal neu würfeln, nur in der Lobby. */
export function neuWuerfeln(s: GameState, id: string, token: string): Spieler | null {
  const p = s.spieler[id];
  if (!p || p.token !== token || p.neuGewuerfelt || s.phase !== 'lobby') return null;
  const andere = spielerListe(s)
    .filter((x) => x.id !== id)
    .map((x) => x.figur);
  p.figur = wuerfleFigur([...andere, p.figur]);
  p.neuGewuerfelt = true;
  s.aktualisiert = Date.now();
  return p;
}

export function entfernen(s: GameState, id: string): void {
  delete s.spieler[id];
  delete s.antworten[id];
  if (!s.entfernt.includes(id)) s.entfernt.push(id);
  s.aktualisiert = Date.now();
}

export function neueBotId(): { id: string; token: string } {
  return { id: 'bot-' + randomHex(6), token: randomHex(16) };
}

// ───────────── Fragen ─────────────

/**
 * Zufällige Auswahl: erst Fragen, die zuletzt nicht dran waren; reichen die nicht,
 * dann die am längsten zurückliegenden.
 */
function auswaehlen(kandidaten: number[], anzahl: number, zuletzt: ReadonlyMap<string, number>): number[] {
  const frisch = kandidaten.filter((i) => !zuletzt.has(FRAGEN[i].frage));
  const alt = shuffle(kandidaten.filter((i) => zuletzt.has(FRAGEN[i].frage))).sort(
    (a, b) => zuletzt.get(FRAGEN[a].frage)! - zuletzt.get(FRAGEN[b].frage)!,
  );
  return [...shuffle(frisch), ...alt].slice(0, anzahl);
}

/**
 * Stellt die Fragen für ein Spiel zusammen. Beim gemischten Spiel wechseln sich Bibel- und
 * Weltfragen ab, damit es auch bei frühem Spielende ungefähr 50:50 bleibt.
 * `zuletzt` = Fragetexte aus den letzten Spielen auf diesem Gerät, älteste zuerst
 * (werden möglichst vermieden).
 */
export function mischeRunden(mix: FragenMix = 'gemischt', zuletzt: readonly string[] = [], anzahl = MAX_FRAGEN): Runde[] {
  const zuletztSet = new Map(zuletzt.map((f, i) => [f, i] as const));
  const alle = FRAGEN.map((_, i) => i);
  const bibel = alle.filter(istBibelFrage);
  const welt = alle.filter((i) => !istBibelFrage(i));
  let indizes: number[];
  if (mix === 'bibel') indizes = auswaehlen(bibel, anzahl, zuletztSet);
  else if (mix === 'welt') indizes = auswaehlen(welt, anzahl, zuletztSet);
  else {
    const haelfte = Math.ceil(anzahl / 2);
    const [erste, zweite] = Math.random() < 0.5 ? [bibel, welt] : [welt, bibel];
    const a = auswaehlen(erste, haelfte, zuletztSet);
    const b = auswaehlen(zweite, anzahl - haelfte, zuletztSet);
    indizes = [];
    for (let i = 0; i < haelfte; i++) {
      if (a[i] !== undefined) indizes.push(a[i]);
      if (b[i] !== undefined) indizes.push(b[i]);
    }
  }
  return indizes.map((frageIndex) => ({ frageIndex, reihenfolge: shuffle([0, 1, 2, 3]) }));
}

export interface GezeigteFrage {
  nr: number;
  gesamt: number;
  frage: string;
  antworten: string[];
  /** Index der richtigen Antwort in der gezeigten Reihenfolge */
  richtig: number;
  stelle: string;
  erklaerung: string;
}

export function gezeigteFrage(s: GameState, rundeNr = s.rundeNr): GezeigteFrage | null {
  const runde = s.runden[rundeNr];
  if (!runde) return null;
  const f = FRAGEN[runde.frageIndex];
  return {
    nr: rundeNr + 1,
    gesamt: s.runden.length,
    frage: f.frage,
    antworten: runde.reihenfolge.map((i) => f.antworten[i]),
    richtig: runde.reihenfolge.indexOf(f.richtig),
    stelle: f.stelle,
    erklaerung: f.erklaerung,
  };
}

export function spielStarten(s: GameState, now: number, runden?: Runde[]): void {
  s.runden = runden ?? mischeRunden(s.fragenMix);
  s.rundeNr = -1;
  for (const p of spielerListe(s)) {
    p.feld = 0;
    p.richtigeAntworten = 0;
    p.gesamtMs = 0;
    p.keinBonusNaechsteRunde = false;
  }
  s.letzteZuege = {};
  naechsteFrage(s, now);
}

export function naechsteFrage(s: GameState, now: number): void {
  s.rundeNr += 1;
  s.phase = 'frage';
  s.frageStart = now;
  s.antworten = {};
  s.aktualisiert = now;
}

export function restzeitMs(s: GameState, now: number): number {
  if (s.phase !== 'frage') return 0;
  return Math.max(0, s.frageStart + FRAGE_MS - now);
}

/** Speichert eine Antwort, wenn sie rechtzeitig beim Host eingeht. Gibt true zurück, wenn gespeichert. */
export function antwortAnnehmen(
  s: GameState,
  id: string,
  token: string,
  rundeNr: number,
  index: number,
  now: number,
): boolean {
  const p = s.spieler[id];
  if (!p || p.token !== token) return false;
  if (s.phase !== 'frage' || rundeNr !== s.rundeNr) return false;
  if (s.antworten[id]) return false;
  if (!Number.isInteger(index) || index < 0 || index > 3) return false;
  const ms = now - s.frageStart;
  if (ms > FRAGE_MS + KULANZ_MS) return false;
  s.antworten[id] = { index, ms: Math.max(0, Math.min(ms, FRAGE_MS)) };
  s.aktualisiert = now;
  return true;
}

export function alleHabenGeantwortet(s: GameState): boolean {
  const liste = spielerListe(s);
  return liste.length > 0 && liste.every((p) => s.antworten[p.id]);
}

/** Berechnet einen Zug – ohne Zustand zu ändern. */
export function berechneZug(p: Spieler, antwort: Antwort | undefined, richtigIndex: number): Zug {
  const beantwortet = !!antwort;
  const richtig = !!antwort && antwort.index === richtigIndex;
  const schnell = richtig && antwort!.ms <= SCHNELL_MS;
  const bonusGesperrt = schnell && p.keinBonusNaechsteRunde;
  const schritte = !richtig ? 0 : schnell && !bonusGesperrt ? PUNKTE_SCHNELL : PUNKTE_RICHTIG;
  const von = p.feld;
  const landung = Math.min(ZIEL_FELD, von + schritte);
  // Ereignisse wirken nur beim Landen nach einem Zug, und sie lösen keine weiteren Ereignisse aus.
  const ereignis = schritte > 0 ? (EREIGNIS_FELDER[landung] ?? null) : null;
  const delta = ereignis ? EREIGNIS_INFO[ereignis].delta : 0;
  const nach = Math.max(0, Math.min(ZIEL_FELD, landung + delta));
  return { beantwortet, richtig, schnell, bonusGesperrt, schritte, von, landung, ereignis, nach };
}

/** Beendet die laufende Frage, zieht alle Figuren und wechselt in die Auflösung. */
export function frageAuswerten(s: GameState, now: number): Record<string, Zug> {
  const gf = gezeigteFrage(s);
  if (!gf || s.phase !== 'frage') return s.letzteZuege;
  const zuege: Record<string, Zug> = {};
  for (const p of spielerListe(s)) {
    const a = s.antworten[p.id];
    const zug = berechneZug(p, a, gf.richtig);
    zuege[p.id] = zug;
    p.feld = zug.nach;
    p.gesamtMs += a ? a.ms : FRAGE_MS;
    if (zug.richtig) p.richtigeAntworten += 1;
    p.keinBonusNaechsteRunde = zug.ereignis === 'volkszaehlung';
  }
  s.letzteZuege = zuege;
  s.phase = 'aufloesung';
  s.aktualisiert = now;
  return zuege;
}

export function istSpielVorbei(s: GameState): boolean {
  if (spielerListe(s).some((p) => p.feld >= ZIEL_FELD)) return true;
  return s.rundeNr + 1 >= s.runden.length;
}

export function spielBeenden(s: GameState, now: number): void {
  s.phase = 'ende';
  s.aktualisiert = now;
}

/** Weiter nach der Auflösung: nächste Frage oder Siegerehrung. */
export function weiter(s: GameState, now: number): void {
  if (s.phase !== 'aufloesung') return;
  if (istSpielVorbei(s)) spielBeenden(s, now);
  else naechsteFrage(s, now);
}

/** Rangliste: weiteste Position zuerst, bei Gleichstand kürzere Gesamtantwortzeit. */
export function rangliste(s: GameState): Spieler[] {
  return spielerListe(s).sort(
    (a, b) => b.feld - a.feld || a.gesamtMs - b.gesamtMs || a.beigetretenUm - b.beigetretenUm,
  );
}

/** Platz pro Spieler (1-basiert); bei exakt gleichem Feld und gleicher Zeit gleicher Platz. */
export function plaetze(s: GameState): Record<string, number> {
  const liste = rangliste(s);
  const out: Record<string, number> = {};
  liste.forEach((p, i) => {
    const vorher = liste[i - 1];
    out[p.id] = vorher && vorher.feld === p.feld && vorher.gesamtMs === p.gesamtMs ? out[vorher.id] : i + 1;
  });
  return out;
}

/** Zurück in die Lobby, Spieler bleiben im Raum. */
export function zurueckZurLobby(s: GameState, now: number): void {
  s.phase = 'lobby';
  s.runden = [];
  s.rundeNr = -1;
  s.antworten = {};
  s.letzteZuege = {};
  for (const p of spielerListe(s)) {
    p.feld = 0;
    p.richtigeAntworten = 0;
    p.gesamtMs = 0;
    p.keinBonusNaechsteRunde = false;
  }
  s.aktualisiert = now;
}

/** Anteil richtiger Antworten aller Figuren in Prozent (für die Klassenwertung). */
export function richtigQuote(s: GameState): number {
  const liste = spielerListe(s);
  const gespielt = s.rundeNr + 1;
  if (liste.length === 0 || gespielt <= 0) return 0;
  const richtig = liste.reduce((sum, p) => sum + p.richtigeAntworten, 0);
  return Math.round((richtig / (liste.length * gespielt)) * 100);
}
