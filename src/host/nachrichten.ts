import {
  gezeigteFrage,
  istSpielVorbei,
  plaetze,
  restzeitMs,
  spielerListe,
  type GameState,
  type Zug,
} from '../game/engine';
import type { AnAlle, AufloesungMsg, EndeMsg, FrageMsg, ZugKurz } from '../net/protocol';

export function frageMsg(s: GameState, now: number): FrageMsg | null {
  const gf = gezeigteFrage(s);
  if (!gf) return null;
  return {
    t: 'frage',
    runde: s.rundeNr,
    nr: gf.nr,
    gesamt: gf.gesamt,
    frage: gf.frage,
    antworten: gf.antworten,
    restMs: restzeitMs(s, now),
  };
}

function kurz(z: Zug): ZugKurz {
  return { s: z.schritte, n: z.nach, e: z.ereignis, r: z.richtig, b: z.bonusGesperrt, a: z.beantwortet };
}

export function aufloesungMsg(s: GameState): AufloesungMsg | null {
  const gf = gezeigteFrage(s);
  if (!gf) return null;
  const zuege: Record<string, ZugKurz> = {};
  for (const [id, z] of Object.entries(s.letzteZuege)) zuege[id] = kurz(z);
  return {
    t: 'aufloesung',
    runde: s.rundeNr,
    richtig: gf.richtig,
    richtigText: gf.antworten[gf.richtig],
    stelle: gf.stelle,
    erklaerung: gf.erklaerung,
    zuege,
    plaetze: plaetze(s),
    anzahl: spielerListe(s).length,
    letzteFrage: istSpielVorbei(s),
  };
}

export function endeMsg(s: GameState): EndeMsg {
  const felder: Record<string, number> = {};
  for (const p of spielerListe(s)) felder[p.id] = p.feld;
  return { t: 'ende', plaetze: plaetze(s), felder, anzahl: spielerListe(s).length };
}

/** Der Zustand, den ein (wieder) eintretender Spieler gerade sehen sollte. */
export function aktuellerZustand(s: GameState, now: number): AnAlle {
  switch (s.phase) {
    case 'frage':
      return frageMsg(s, now) ?? { t: 'lobby' };
    case 'aufloesung':
      return aufloesungMsg(s) ?? { t: 'lobby' };
    case 'ende':
      return endeMsg(s);
    default:
      return { t: 'lobby' };
  }
}
