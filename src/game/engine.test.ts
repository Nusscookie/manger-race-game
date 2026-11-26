import { describe, expect, it } from 'vitest';
import { BIBEL_FRAGEN, FRAGEN, istBibelFrage } from '../data/fragen';
import { WELT_FRAGEN } from '../data/fragenWelt';
import { FRAGE_MS, MAX_SPIELER, SCHNELL_MS, ZIEL_FELD } from './constants';
import {
  antwortAnnehmen,
  beitreten,
  berechneZug,
  entfernen,
  frageAuswerten,
  gezeigteFrage,
  mischeRunden,
  istSpielVorbei,
  neuesSpiel,
  neuWuerfeln,
  rangliste,
  spielStarten,
  weiter,
  type Spieler,
} from './engine';
import { figurName } from './figuren';

function spielerMitFeld(feld: number, keinBonus = false): Spieler {
  return {
    id: 'x',
    token: 't',
    figur: { art: 'Hirte', nr: 1, farbe: '#fff' },
    feld,
    richtigeAntworten: 0,
    gesamtMs: 0,
    keinBonusNaechsteRunde: keinBonus,
    neuGewuerfelt: false,
    bot: false,
    beigetretenUm: 0,
  };
}

describe('Fragen', () => {
  it('enthält 40 Bibelfragen, mindestens so viele weltliche und alle vollständig', () => {
    expect(BIBEL_FRAGEN).toHaveLength(40);
    expect(WELT_FRAGEN.length).toBeGreaterThanOrEqual(40);
    expect(FRAGEN).toHaveLength(BIBEL_FRAGEN.length + WELT_FRAGEN.length);
    for (const f of FRAGEN) {
      expect(f.antworten).toHaveLength(4);
      expect(new Set(f.antworten).size).toBe(4);
      expect(f.frage.length).toBeGreaterThan(5);
      expect(f.stelle.length).toBeGreaterThan(2);
      expect(f.erklaerung.length).toBeGreaterThan(10);
      expect([0, 1, 2, 3]).toContain(f.richtig);
    }
  });

  it('hat keine doppelten Fragen', () => {
    expect(new Set(FRAGEN.map((f) => f.frage)).size).toBe(FRAGEN.length);
  });
});

describe('Fragenauswahl', () => {
  it('gemischt: Bibel und Welt wechseln sich ab', () => {
    const runden = mischeRunden('gemischt');
    expect(runden).toHaveLength(12);
    const bibel = runden.map((r) => istBibelFrage(r.frageIndex));
    for (let i = 1; i < bibel.length; i++) expect(bibel[i]).not.toBe(bibel[i - 1]);
    expect(new Set(runden.map((r) => r.frageIndex)).size).toBe(12);
  });

  it('nur Bibel bzw. nur Welt', () => {
    expect(mischeRunden('bibel').every((r) => istBibelFrage(r.frageIndex))).toBe(true);
    expect(mischeRunden('welt').every((r) => !istBibelFrage(r.frageIndex))).toBe(true);
  });

  it('vermeidet zuletzt gespielte Fragen, solange genug andere da sind', () => {
    const zuletzt = BIBEL_FRAGEN.slice(0, 28).map((f) => f.frage);
    const runden = mischeRunden('bibel', zuletzt);
    expect(runden.every((r) => !zuletzt.includes(FRAGEN[r.frageIndex].frage))).toBe(true);
    // reicht der Rest nicht, kommen die am längsten zurückliegenden zuerst wieder
    const fast = BIBEL_FRAGEN.slice(0, 35).map((f) => f.frage);
    const r2 = mischeRunden('bibel', fast).map((r) => FRAGEN[r.frageIndex].frage);
    expect(r2.filter((f) => fast.includes(f)).sort()).toEqual(fast.slice(0, 7).sort());
  });
});

describe('Züge', () => {
  it('falsch oder keine Antwort: 0 Felder', () => {
    expect(berechneZug(spielerMitFeld(3), undefined, 1).nach).toBe(3);
    expect(berechneZug(spielerMitFeld(3), { index: 0, ms: 1000 }, 1).nach).toBe(3);
  });

  it('richtig: +2, richtig und schnell: +3', () => {
    expect(berechneZug(spielerMitFeld(0), { index: 1, ms: SCHNELL_MS + 1 }, 1).nach).toBe(2);
    // Feld 3 ist kein Ereignisfeld
    expect(berechneZug(spielerMitFeld(0), { index: 1, ms: SCHNELL_MS }, 1).nach).toBe(3);
  });

  it('Volkszählung sperrt den Schnelligkeitsbonus', () => {
    const z = berechneZug(spielerMitFeld(0, true), { index: 1, ms: 500 }, 1);
    expect(z.bonusGesperrt).toBe(true);
    expect(z.schritte).toBe(2);
  });

  it('Ereignisfelder: Engel +1, Stern +2, Herberge -2, ohne Kettenreaktion', () => {
    expect(berechneZug(spielerMitFeld(3), { index: 0, ms: 9000 }, 0)).toMatchObject({ landung: 5, ereignis: 'engel', nach: 6 });
    expect(berechneZug(spielerMitFeld(6), { index: 0, ms: 9000 }, 0)).toMatchObject({ landung: 8, ereignis: 'stern', nach: 10 });
    expect(berechneZug(spielerMitFeld(15), { index: 0, ms: 9000 }, 0)).toMatchObject({ landung: 17, ereignis: 'herberge', nach: 15 });
    // 12 → 14 (Engel) → 15: kein weiteres Ereignis auf 15
    expect(berechneZug(spielerMitFeld(12), { index: 0, ms: 9000 }, 0)).toMatchObject({ landung: 14, nach: 15 });
  });

  it('nicht über die Krippe hinaus', () => {
    expect(berechneZug(spielerMitFeld(19), { index: 0, ms: 100 }, 0).nach).toBe(ZIEL_FELD);
  });

  it('kein Ereignis, wenn man stehen bleibt', () => {
    expect(berechneZug(spielerMitFeld(17), undefined, 0).ereignis).toBeNull();
  });
});

describe('Spielablauf', () => {
  it('Beitritt, Wiedereinstieg mit Token, Raum voll, entfernen', () => {
    const s = neuesSpiel('ABCD');
    const a = beitreten(s, 'p1', 'geheim', 1);
    expect(a.ok && a.neu).toBe(true);
    const nochmal = beitreten(s, 'p1', 'geheim', 2);
    expect(nochmal.ok && !nochmal.neu).toBe(true);
    expect(beitreten(s, 'p1', 'falsch', 3).ok).toBe(false);
    for (let i = 2; i <= MAX_SPIELER; i++) beitreten(s, 'p' + i, 't', i);
    expect(beitreten(s, 'zuviel', 't', 99)).toEqual({ ok: false, grund: 'voll' });
    entfernen(s, 'p2');
    expect(beitreten(s, 'p2', 't', 100)).toEqual({ ok: false, grund: 'entfernt' });
    const namen = Object.values(s.spieler).map((p) => figurName(p.figur));
    expect(new Set(namen).size).toBe(namen.length);
  });

  it('nur einmal neu würfeln, nur in der Lobby', () => {
    const s = neuesSpiel('ABCD');
    beitreten(s, 'p1', 't', 1);
    expect(neuWuerfeln(s, 'p1', 't')).not.toBeNull();
    expect(neuWuerfeln(s, 'p1', 't')).toBeNull();
  });

  it('Antworten: nur einmal, nur rechtzeitig, Zeit zählt beim Host', () => {
    const s = neuesSpiel('ABCD');
    beitreten(s, 'p1', 't', 0);
    beitreten(s, 'p2', 't', 0);
    spielStarten(s, 1000);
    expect(antwortAnnehmen(s, 'p1', 't', 0, 2, 2000)).toBe(true);
    expect(antwortAnnehmen(s, 'p1', 't', 0, 3, 2100)).toBe(false);
    expect(antwortAnnehmen(s, 'p2', 'falsch', 0, 1, 2100)).toBe(false);
    expect(antwortAnnehmen(s, 'p2', 't', 0, 1, 1000 + FRAGE_MS + 5000)).toBe(false);
    expect(s.antworten.p1.ms).toBe(1000);
  });

  it('Spiel endet, sobald jemand die Krippe erreicht', () => {
    const s = neuesSpiel('ABCD');
    beitreten(s, 'p1', 't', 0);
    spielStarten(s, 0);
    s.spieler.p1.feld = 18;
    const richtig = gezeigteFrage(s)!.richtig;
    antwortAnnehmen(s, 'p1', 't', 0, richtig, 100);
    frageAuswerten(s, 200);
    expect(s.spieler.p1.feld).toBe(ZIEL_FELD);
    expect(istSpielVorbei(s)).toBe(true);
    weiter(s, 300);
    expect(s.phase).toBe('ende');
  });

  it('Spiel endet nach höchstens 12 Fragen', () => {
    const s = neuesSpiel('ABCD');
    beitreten(s, 'p1', 't', 0);
    spielStarten(s, 0);
    let fragen = 0;
    while (s.phase !== 'ende') {
      fragen++;
      frageAuswerten(s, fragen * 1000);
      weiter(s, fragen * 1000 + 1);
    }
    expect(fragen).toBe(12);
  });

  it('Gleichstand: kürzere Gesamtzeit gewinnt', () => {
    const s = neuesSpiel('ABCD');
    beitreten(s, 'a', 't', 0);
    beitreten(s, 'b', 't', 1);
    s.spieler.a.feld = 10;
    s.spieler.b.feld = 10;
    s.spieler.a.gesamtMs = 50_000;
    s.spieler.b.gesamtMs = 40_000;
    expect(rangliste(s).map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('Antwortreihenfolge wird gemischt, richtige Antwort bleibt richtig', () => {
    const s = neuesSpiel('ABCD');
    spielStarten(s, 0);
    for (let i = 0; i < s.runden.length; i++) {
      const gf = gezeigteFrage(s, i)!;
      const original = FRAGEN[s.runden[i].frageIndex];
      expect(gf.antworten[gf.richtig]).toBe(original.antworten[original.richtig]);
    }
  });
});
