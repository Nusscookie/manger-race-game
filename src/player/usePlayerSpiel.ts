/**
 * Spieler-Seite: verbindet sich mit dem Raum, merkt sich die eigene Figur im localStorage
 * (Wiedereinstieg nach Neuladen) und schickt Antworten an die Spielleitung.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Figur } from '../game/figuren';
import { randomHex } from '../lib/random';
import { loadJSON, removeKey, saveJSON } from '../lib/storage';
import type { AnAlle, AnSpieler, AufloesungMsg, EndeMsg, FrageMsg, VerbindungsStatus } from '../net/protocol';
import { getTransport, type SpielerVerbindung } from '../net/transport';

const SPEICHER = 'krippe-spieler-v1';
const HALLO_INTERVALL_MS = 3000;
const ANTWORT_WIEDERHOLEN_MS = 2500;
const KEIN_HOST_NACH_MS = 9000;

interface Identitaet {
  code: string;
  id: string;
  token: string;
}

function identitaetFuer(code: string): Identitaet {
  const alt = loadJSON<Identitaet>(SPEICHER);
  if (alt && alt.code === code && alt.id && alt.token) return alt;
  const neu = { code, id: randomHex(12), token: randomHex(24) };
  saveJSON(SPEICHER, neu);
  return neu;
}

export type Ansicht = 'verbinde' | 'lobby' | 'frage' | 'aufloesung' | 'ende' | 'abgelehnt' | 'geschlossen';

export interface SpielerZustand {
  id: string;
  status: VerbindungsStatus;
  ansicht: Ansicht;
  keinHost: boolean;
  figur: Figur | null;
  feld: number;
  kannWuerfeln: boolean;
  frage: (FrageMsg & { endeUm: number }) | null;
  meineAntwort: number | null;
  gespeichert: boolean;
  aufloesung: AufloesungMsg | null;
  ende: EndeMsg | null;
  grund: 'voll' | 'entfernt' | null;
}

export function usePlayerSpiel(code: string) {
  const [ich] = useState(() => identitaetFuer(code));
  const [z, setZ] = useState<SpielerZustand>({
    id: ich.id,
    status: 'verbinde',
    ansicht: 'verbinde',
    keinHost: false,
    figur: null,
    feld: 0,
    kannWuerfeln: false,
    frage: null,
    meineAntwort: null,
    gespeichert: false,
    aufloesung: null,
    ende: null,
    grund: null,
  });
  const zRef = useRef(z);
  zRef.current = z;
  const linkRef = useRef<SpielerVerbindung | null>(null);
  const begruesst = useRef(false);
  const antwortTimer = useRef<number | null>(null);

  const update = useCallback((f: (alt: SpielerZustand) => SpielerZustand) => {
    setZ((alt) => {
      const neu = f(alt);
      zRef.current = neu;
      return neu;
    });
  }, []);

  const stoppeAntwortWiederholung = () => {
    if (antwortTimer.current !== null) {
      window.clearInterval(antwortTimer.current);
      antwortTimer.current = null;
    }
  };

  const hallo = useCallback(() => {
    linkRef.current?.anHost({ t: 'hallo', id: ich.id, token: ich.token });
  }, [ich]);

  const zustandAnwenden = useCallback(
    (msg: AnAlle) => {
      if (!msg || typeof msg !== 'object') return;
      switch (msg.t) {
        case 'frage':
          update((a) => {
            const neueRunde = a.frage?.runde !== msg.runde;
            if (neueRunde) stoppeAntwortWiederholung();
            return {
              ...a,
              ansicht: 'frage',
              frage: { ...msg, endeUm: Date.now() + msg.restMs },
              meineAntwort: neueRunde ? null : a.meineAntwort,
              gespeichert: neueRunde ? false : a.gespeichert,
              kannWuerfeln: false,
            };
          });
          return;
        case 'aufloesung':
          stoppeAntwortWiederholung();
          update((a) => ({
            ...a,
            ansicht: 'aufloesung',
            aufloesung: msg,
            feld: msg.zuege[ich.id]?.n ?? a.feld,
          }));
          return;
        case 'ende':
          stoppeAntwortWiederholung();
          update((a) => ({ ...a, ansicht: 'ende', ende: msg, feld: msg.felder[ich.id] ?? a.feld }));
          return;
        case 'lobby':
          stoppeAntwortWiederholung();
          update((a) => ({
            ...a,
            ansicht: a.figur ? 'lobby' : a.ansicht,
            feld: 0,
            frage: null,
            meineAntwort: null,
            gespeichert: false,
            aufloesung: null,
            ende: null,
          }));
          return;
        case 'geschlossen':
          stoppeAntwortWiederholung();
          removeKey(SPEICHER);
          update((a) => ({ ...a, ansicht: 'geschlossen' }));
          return;
      }
    },
    [ich, update],
  );

  const persoenlich = useCallback(
    (msg: AnSpieler) => {
      if (!msg || typeof msg !== 'object') return;
      switch (msg.t) {
        case 'willkommen':
          begruesst.current = true;
          update((a) => ({
            ...a,
            figur: msg.figur,
            feld: msg.feld,
            kannWuerfeln: msg.kannWuerfeln,
            keinHost: false,
            ansicht: 'lobby',
          }));
          zustandAnwenden(msg.zustand);
          if (msg.meineAntwort !== null) {
            update((a) => ({ ...a, meineAntwort: msg.meineAntwort, gespeichert: true }));
          }
          return;
        case 'figur':
          update((a) => ({ ...a, figur: msg.figur, kannWuerfeln: msg.kannWuerfeln }));
          return;
        case 'gespeichert':
          if (zRef.current.frage?.runde === msg.runde) {
            stoppeAntwortWiederholung();
            update((a) => ({ ...a, meineAntwort: msg.index, gespeichert: true }));
          }
          return;
        case 'abgelehnt':
          begruesst.current = true;
          stoppeAntwortWiederholung();
          update((a) => ({ ...a, ansicht: 'abgelehnt', grund: msg.grund }));
          return;
      }
    },
    [update, zustandAnwenden],
  );

  // Verbindung
  useEffect(() => {
    const t = getTransport();
    const link = t.spielerOeffnen(
      code,
      ich.id,
      zustandAnwenden,
      persoenlich,
      (status) => {
        update((a) => ({ ...a, status }));
        if (status === 'verbunden') {
          // Nach jedem (Wieder-)Verbinden neu anmelden, um den aktuellen Stand zu bekommen.
          begruesst.current = false;
          hallo();
        }
      },
    );
    linkRef.current = link;

    const halloIv = window.setInterval(() => {
      if (!begruesst.current && zRef.current.status === 'verbunden') hallo();
    }, HALLO_INTERVALL_MS);
    const keinHostTimer = window.setTimeout(() => {
      if (!begruesst.current) update((a) => ({ ...a, keinHost: true }));
    }, KEIN_HOST_NACH_MS);

    // Handy war im Standby → beim Zurückkommen Stand neu holen
    const sichtbar = () => {
      if (document.visibilityState === 'visible') {
        begruesst.current = false;
        hallo();
      }
    };
    document.addEventListener('visibilitychange', sichtbar);

    return () => {
      window.clearInterval(halloIv);
      window.clearTimeout(keinHostTimer);
      document.removeEventListener('visibilitychange', sichtbar);
      stoppeAntwortWiederholung();
      link.schliessen();
      linkRef.current = null;
    };
  }, [code, ich, hallo, persoenlich, zustandAnwenden, update]);

  const antworten = useCallback(
    (index: number) => {
      const a = zRef.current;
      if (a.ansicht !== 'frage' || !a.frage || a.meineAntwort !== null) return;
      if (Date.now() > a.frage.endeUm + 300) return;
      const runde = a.frage.runde;
      update((x) => ({ ...x, meineAntwort: index, gespeichert: false }));
      const senden = () => linkRef.current?.anHost({ t: 'antwort', id: ich.id, token: ich.token, runde, index });
      senden();
      stoppeAntwortWiederholung();
      let versuche = 0;
      antwortTimer.current = window.setInterval(() => {
        versuche++;
        if (versuche > 6 || zRef.current.gespeichert || zRef.current.frage?.runde !== runde) {
          stoppeAntwortWiederholung();
          return;
        }
        senden();
      }, ANTWORT_WIEDERHOLEN_MS);
    },
    [ich, update],
  );

  const wuerfeln = useCallback(() => {
    if (!zRef.current.kannWuerfeln) return;
    update((a) => ({ ...a, kannWuerfeln: false }));
    linkRef.current?.anHost({ t: 'wuerfeln', id: ich.id, token: ich.token });
  }, [ich, update]);

  return { z, antworten, wuerfeln };
}
