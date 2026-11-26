export const ZIEL_FELD = 20;
export const FRAGE_MS = 20_000;
/** Schnell = im ersten Drittel der Zeit */
export const SCHNELL_MS = Math.round(FRAGE_MS / 3);
/** Kleiner Puffer für Antworten, die genau beim Ablauf unterwegs sind */
export const KULANZ_MS = 400;
export const MAX_FRAGEN = 12;
export const MAX_SPIELER = 35;
export const PUNKTE_RICHTIG = 2;
export const PUNKTE_SCHNELL = 3;

export type Ereignis = 'herberge' | 'stern' | 'engel' | 'volkszaehlung';

export const EREIGNIS_FELDER: Record<number, Ereignis> = {
  2: 'volkszaehlung',
  5: 'engel',
  8: 'stern',
  11: 'volkszaehlung',
  14: 'engel',
  17: 'herberge',
};

export const EREIGNIS_INFO: Record<Ereignis, { titel: string; wirkung: string; delta: number }> = {
  herberge: { titel: 'Die Herberge ist voll', wirkung: '2 Felder zurück', delta: -2 },
  stern: { titel: 'Der Stern zeigt den Weg', wirkung: '2 Felder vor', delta: 2 },
  engel: { titel: 'Ein Engel erscheint', wirkung: '1 Feld vor', delta: 1 },
  volkszaehlung: {
    titel: 'Volkszählung – alle stehen Schlange',
    wirkung: 'nächste Runde kein Schnelligkeitsbonus',
    delta: 0,
  },
};

export function gebietName(feld: number): string {
  if (feld <= 0) return 'Nazareth';
  if (feld <= 7) return 'Wüste';
  if (feld <= 11) return 'Hügel bei Bethlehem';
  if (feld <= 14) return 'Hirtenfeld';
  if (feld <= 19) return 'Herberge in Bethlehem';
  return 'Stall und Krippe';
}
