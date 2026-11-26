import { randomInt } from '../lib/random';

export type FigurArt = 'Hirte' | 'Engel' | 'Schaf' | 'Sterndeuter';

export interface Figur {
  art: FigurArt;
  nr: number;
  farbe: string;
}

const ARTEN: FigurArt[] = ['Hirte', 'Engel', 'Schaf', 'Sterndeuter'];
const KUERZEL: Record<FigurArt, string> = { Hirte: 'H', Engel: 'E', Schaf: 'S', Sterndeuter: 'SD' };

/** Gut unterscheidbare, helle Farben auf Nachtblau; Schrift auf den Steinen ist dunkel. */
export const FARBEN = [
  '#ef7d6e', // Rot
  '#f3a64f', // Orange
  '#f4dc5b', // Gelb
  '#8fd178', // Grün
  '#58c8c4', // Türkis
  '#7fb1ff', // Blau
  '#b496f5', // Violett
  '#f28cc7', // Rosa
  '#ececec', // Weiß
  '#d0a678', // Braun
  '#a9e2ff', // Himmelblau
  '#c6e46f', // Hellgrün
];

export function figurName(f: Pick<Figur, 'art' | 'nr'>): string {
  return `${f.art} ${f.nr}`;
}

export function figurKuerzel(f: Pick<Figur, 'art' | 'nr'>): string {
  return `${KUERZEL[f.art]}${f.nr}`;
}

/** Würfelt eine Figur, deren Name im Raum noch nicht vergeben ist; die Farbe ist die am seltensten genutzte. */
export function wuerfleFigur(vorhanden: Figur[]): Figur {
  const namen = new Set(vorhanden.map(figurName));
  let art: FigurArt = ARTEN[0];
  let nr = 1;
  for (let versuch = 0; versuch < 500; versuch++) {
    art = ARTEN[randomInt(ARTEN.length)];
    nr = 1 + randomInt(versuch < 200 ? 49 : 99);
    if (!namen.has(figurName({ art, nr }))) break;
  }
  const zaehler = FARBEN.map((farbe) => vorhanden.filter((f) => f.farbe === farbe).length);
  const min = Math.min(...zaehler);
  const freie = FARBEN.filter((_, i) => zaehler[i] === min);
  const farbe = freie[randomInt(freie.length)];
  return { art, nr, farbe };
}
