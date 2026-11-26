/**
 * Nachrichten zwischen Spielleitung (Host) und Spielern.
 *
 * Sparsam gebaut, damit viele Klassen gleichzeitig in den kostenlosen Supabase-Tarif passen:
 * - Spieler → Host: nur an den Host-Kanal (andere Spieler bekommen das nicht mit).
 * - Host → alle: nur bei Phasenwechseln (Frage, Auflösung, Ende), kein Sekundentakt.
 * - Host → einzelner Spieler: über einen persönlichen Kanal (Willkommen, Bestätigung).
 */
import type { Ereignis } from '../game/constants';
import type { Figur } from '../game/figuren';

// ── Spieler → Host ──
export type AnHost =
  | { t: 'hallo'; id: string; token: string }
  | { t: 'wuerfeln'; id: string; token: string }
  | { t: 'antwort'; id: string; token: string; runde: number; index: number };

// ── Host → alle ──
export interface FrageMsg {
  t: 'frage';
  runde: number;
  nr: number;
  gesamt: number;
  frage: string;
  antworten: string[];
  /** verbleibende Zeit beim Senden */
  restMs: number;
}

export interface ZugKurz {
  /** Felder durch die Antwort */
  s: number;
  /** Feld nach dem Zug (inkl. Ereignis) */
  n: number;
  /** Ereignis auf dem Landefeld */
  e: Ereignis | null;
  /** richtig? */
  r: boolean;
  /** Schnelligkeitsbonus durch Volkszählung gesperrt? */
  b: boolean;
  /** überhaupt geantwortet? */
  a: boolean;
}

export interface AufloesungMsg {
  t: 'aufloesung';
  runde: number;
  richtig: number;
  richtigText: string;
  stelle: string;
  erklaerung: string;
  zuege: Record<string, ZugKurz>;
  plaetze: Record<string, number>;
  anzahl: number;
  letzteFrage: boolean;
}

export interface EndeMsg {
  t: 'ende';
  plaetze: Record<string, number>;
  felder: Record<string, number>;
  anzahl: number;
}

export type AnAlle = FrageMsg | AufloesungMsg | EndeMsg | { t: 'lobby' } | { t: 'geschlossen' };

// ── Host → einzelner Spieler ──
export type AnSpieler =
  | {
      t: 'willkommen';
      figur: Figur;
      feld: number;
      kannWuerfeln: boolean;
      zustand: AnAlle;
      /** bereits gegebene Antwort in der laufenden Frage */
      meineAntwort: number | null;
    }
  | { t: 'figur'; figur: Figur; kannWuerfeln: boolean }
  | { t: 'gespeichert'; runde: number; index: number }
  | { t: 'abgelehnt'; grund: 'voll' | 'entfernt' };

export type VerbindungsStatus = 'verbinde' | 'verbunden' | 'getrennt';
