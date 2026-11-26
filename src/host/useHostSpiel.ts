/**
 * Die Spielleitung: hält den Spielstand im Host-Browser, wertet Antworten aus und schickt
 * den Zustand an alle Spieler. Der Stand wird im localStorage gesichert, damit ein
 * versehentliches Neuladen am Smartboard das Spiel nicht beendet.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { FRAGE_MS, MAX_SPIELER } from '../game/constants';
import {
  alleHabenGeantwortet,
  antwortAnnehmen,
  beitreten,
  entfernen,
  frageAuswerten,
  gezeigteFrage,
  mischeRunden,
  neueBotId,
  neuWuerfeln,
  restzeitMs,
  spielStarten,
  weiter,
  zurueckZurLobby,
  type GameState,
  type Phase,
} from '../game/engine';
import { loadJSON, loadSessionJSON, removeKey, removeSessionKey, saveJSON, saveSessionJSON } from '../lib/storage';
import type { AnHost, VerbindungsStatus } from '../net/protocol';
import { getTransport, type HostVerbindung } from '../net/transport';
import { aktuellerZustand, aufloesungMsg, endeMsg, frageMsg } from './nachrichten';

export const HOST_SPEICHER = 'krippe-host-v1';
/** So lange bleibt die Auflösung stehen, bevor es automatisch weitergeht */
export const AUFLOESUNG_MS = 10_000;
/** Kurze Pause, wenn alle geantwortet haben, bevor aufgelöst wird */
const ALLE_DA_PAUSE_MS = 800;

function brauchbar(s: GameState | null): s is GameState {
  return !!s && !!s.code && s.phase !== 'ende' && Date.now() - s.aktualisiert < 3 * 60 * 60 * 1000;
}

/**
 * Zuerst das Spiel dieses Tabs (sessionStorage – wichtig, falls jemand zwei Räume im selben
 * Browser leitet), sonst das zuletzt gespeicherte Spiel dieses Browsers (localStorage).
 */
export function gespeichertesSpiel(): GameState | null {
  const tab = loadSessionJSON<GameState>(HOST_SPEICHER);
  if (brauchbar(tab)) return tab;
  const browser = loadJSON<GameState>(HOST_SPEICHER);
  return brauchbar(browser) ? browser : null;
}

export function gespeichertesSpielLoeschen() {
  removeKey(HOST_SPEICHER);
  removeSessionKey(HOST_SPEICHER);
}

/** Fragetexte der letzten Spiele auf diesem Gerät – damit beim nächsten Spiel andere drankommen. */
const ZULETZT_SPEICHER = 'krippe-zuletzt-v1';
const ZULETZT_MAX = 70;

function zuletztGespielt(): string[] {
  const l = loadJSON<string[]>(ZULETZT_SPEICHER);
  return Array.isArray(l) ? l : [];
}

function alsGespieltMerken(frage: string) {
  const l = zuletztGespielt().filter((f) => f !== frage);
  l.push(frage);
  saveJSON(ZULETZT_SPEICHER, l.slice(-ZULETZT_MAX));
}

function spielSpeichern(s: GameState) {
  saveSessionJSON(HOST_SPEICHER, s);
  saveJSON(HOST_SPEICHER, s);
}

export interface HostSteuerung {
  s: GameState;
  status: VerbindungsStatus;
  modus: 'cloudflare' | 'supabase' | 'lokal';
  autoWeiter: boolean;
  setAutoWeiter(v: boolean): void;
  /** Zeitpunkt, zu dem es automatisch weitergeht (oder null) */
  weiterUm: number | null;
  starten(): void;
  frageJetztBeenden(): void;
  weiterKlick(): void;
  entfernenKlick(id: string): void;
  neueRunde(): void;
  schliessen(): void;
}

export function useHostSpiel(start: GameState, bots: number, onEnde?: (s: GameState) => void): HostSteuerung {
  const sRef = useRef<GameState>(start);
  const [, setTick] = useState(0);
  const [status, setStatus] = useState<VerbindungsStatus>('verbinde');
  const [autoWeiter, setAutoWeiterState] = useState(true);
  const autoWeiterRef = useRef(true);
  const [weiterUm, setWeiterUm] = useState<number | null>(null);
  const linkRef = useRef<HostVerbindung | null>(null);
  const frageTimer = useRef<number | null>(null);
  const alleDaTimer = useRef<number | null>(null);
  const weiterTimer = useRef<number | null>(null);
  const botTimer = useRef<number[]>([]);
  const onEndeRef = useRef(onEnde);
  onEndeRef.current = onEnde;

  const geaendert = useCallback(() => {
    spielSpeichern(sRef.current);
    setTick((t) => t + 1);
  }, []);

  const clear = (ref: React.MutableRefObject<number | null>) => {
    if (ref.current !== null) {
      window.clearTimeout(ref.current);
      ref.current = null;
    }
  };
  const botsStoppen = () => {
    botTimer.current.forEach((t) => window.clearTimeout(t));
    botTimer.current = [];
  };

  // Die Funktionen unten verweisen gegenseitig aufeinander; über Refs bleiben sie stabil.
  const fn = useRef({
    frageBeenden: () => {},
    frageStarten: () => {},
    autoPlanen: () => {},
    weiterKlick: () => {},
    alleDaPruefen: () => {},
  }).current;

  fn.alleDaPruefen = () => {
    const s = sRef.current;
    if (s.phase === 'frage' && alleHabenGeantwortet(s) && alleDaTimer.current === null) {
      alleDaTimer.current = window.setTimeout(() => {
        alleDaTimer.current = null;
        fn.frageBeenden();
      }, ALLE_DA_PAUSE_MS);
    }
  };

  const botsAntwortenLassen = () => {
    botsStoppen();
    const s = sRef.current;
    const gf = gezeigteFrage(s);
    if (!gf) return;
    const rest = restzeitMs(s, Date.now());
    for (const p of Object.values(s.spieler)) {
      if (!p.bot || s.antworten[p.id]) continue;
      if (Math.random() < 0.08) continue; // manche verschlafen die Frage
      const delay = 900 + Math.random() * Math.max(0, Math.min(rest, FRAGE_MS) - 2000);
      const richtig = Math.random() < 0.6;
      const falsche = [0, 1, 2, 3].filter((i) => i !== gf.richtig);
      const index = richtig ? gf.richtig : falsche[Math.floor(Math.random() * 3)];
      const runde = s.rundeNr;
      botTimer.current.push(
        window.setTimeout(() => {
          if (antwortAnnehmen(sRef.current, p.id, p.token, runde, index, Date.now())) {
            geaendert();
            fn.alleDaPruefen();
          }
        }, delay),
      );
    }
  };

  fn.frageStarten = () => {
    const s = sRef.current;
    clear(frageTimer);
    clear(alleDaTimer);
    const msg = frageMsg(s, Date.now());
    if (msg) linkRef.current?.anAlle(msg);
    const gf = gezeigteFrage(s);
    if (gf) alsGespieltMerken(gf.frage);
    frageTimer.current = window.setTimeout(() => fn.frageBeenden(), restzeitMs(s, Date.now()) + 450);
    botsAntwortenLassen();
    geaendert();
  };

  fn.autoPlanen = () => {
    clear(weiterTimer);
    if (!autoWeiterRef.current || sRef.current.phase !== 'aufloesung') {
      setWeiterUm(null);
      return;
    }
    const um = Date.now() + AUFLOESUNG_MS;
    setWeiterUm(um);
    weiterTimer.current = window.setTimeout(() => fn.weiterKlick(), AUFLOESUNG_MS);
  };

  fn.frageBeenden = () => {
    const s = sRef.current;
    if (s.phase !== 'frage') return;
    clear(frageTimer);
    clear(alleDaTimer);
    botsStoppen();
    frageAuswerten(s, Date.now());
    const msg = aufloesungMsg(s);
    if (msg) linkRef.current?.anAlle(msg);
    geaendert();
    fn.autoPlanen();
  };

  fn.weiterKlick = () => {
    const s = sRef.current;
    clear(weiterTimer);
    setWeiterUm(null);
    if (s.phase !== 'aufloesung') return;
    weiter(s, Date.now());
    const neuePhase = s.phase as Phase;
    if (neuePhase === 'frage') {
      fn.frageStarten();
    } else if (neuePhase === 'ende') {
      linkRef.current?.anAlle(endeMsg(s));
      geaendert();
      onEndeRef.current?.(s);
    }
  };

  const nachricht = (msg: AnHost) => {
    const s = sRef.current;
    const link = linkRef.current;
    if (!link || !msg || typeof msg !== 'object' || typeof msg.id !== 'string') return;
    const now = Date.now();
    switch (msg.t) {
      case 'hallo': {
        const r = beitreten(s, msg.id, msg.token, now);
        if (!r.ok) {
          link.anSpieler(msg.id, { t: 'abgelehnt', grund: r.grund });
          return;
        }
        const p = r.spieler;
        link.anSpieler(p.id, {
          t: 'willkommen',
          figur: p.figur,
          feld: p.feld,
          kannWuerfeln: !p.neuGewuerfelt && s.phase === 'lobby',
          zustand: aktuellerZustand(s, now),
          meineAntwort: s.phase === 'frage' ? (s.antworten[p.id]?.index ?? null) : null,
        });
        if (r.neu) geaendert();
        return;
      }
      case 'wuerfeln': {
        const p = neuWuerfeln(s, msg.id, msg.token);
        if (p) {
          link.anSpieler(p.id, { t: 'figur', figur: p.figur, kannWuerfeln: false });
          geaendert();
        }
        return;
      }
      case 'antwort': {
        const neu = antwortAnnehmen(s, msg.id, msg.token, msg.runde, msg.index, now);
        const a = s.antworten[msg.id];
        // Auch Wiederholungen bestätigen, falls die erste Bestätigung verloren ging.
        if (a && msg.runde === s.rundeNr && s.spieler[msg.id]?.token === msg.token) {
          link.anSpieler(msg.id, { t: 'gespeichert', runde: s.rundeNr, index: a.index });
        }
        if (neu) {
          geaendert();
          fn.alleDaPruefen();
        }
        return;
      }
    }
  };
  const nachrichtRef = useRef(nachricht);
  nachrichtRef.current = nachricht;

  // Verbindung öffnen
  useEffect(() => {
    const t = getTransport();
    const link = t.hostOeffnen(
      sRef.current.code,
      (m) => nachrichtRef.current(m),
      setStatus,
    );
    linkRef.current = link;

    // Fortsetzen nach Neuladen
    const s = sRef.current;
    if (s.phase === 'frage') {
      if (restzeitMs(s, Date.now()) > 0) fn.frageStarten();
      else fn.frageBeenden();
    } else if (s.phase === 'aufloesung') {
      const msg = aufloesungMsg(s);
      if (msg) window.setTimeout(() => link.anAlle(msg), 300);
      fn.autoPlanen();
    } else {
      window.setTimeout(() => link.anAlle(aktuellerZustand(s, Date.now())), 300);
    }
    geaendert();

    return () => {
      clear(frageTimer);
      clear(alleDaTimer);
      clear(weiterTimer);
      botsStoppen();
      link.schliessen();
      linkRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Testmodus: simulierte Spieler treten nach und nach bei
  useEffect(() => {
    if (bots <= 0) return;
    const s = sRef.current;
    const ziel = Math.min(bots, MAX_SPIELER);
    const iv = window.setInterval(() => {
      const vorhanden = Object.values(s.spieler).filter((p) => p.bot).length;
      if (vorhanden >= ziel || Object.keys(s.spieler).length >= MAX_SPIELER) {
        window.clearInterval(iv);
        return;
      }
      const { id, token } = neueBotId();
      beitreten(s, id, token, Date.now(), true);
      geaendert();
    }, 90);
    return () => window.clearInterval(iv);
  }, [bots, geaendert]);

  return {
    s: sRef.current,
    status,
    modus: getTransport().modus,
    autoWeiter,
    setAutoWeiter(v) {
      autoWeiterRef.current = v;
      setAutoWeiterState(v);
      if (v) fn.autoPlanen();
      else {
        clear(weiterTimer);
        setWeiterUm(null);
      }
    },
    weiterUm,
    starten() {
      const s = sRef.current;
      if (s.phase !== 'lobby' || Object.keys(s.spieler).length === 0) return;
      spielStarten(s, Date.now(), mischeRunden(s.fragenMix, zuletztGespielt()));
      fn.frageStarten();
    },
    frageJetztBeenden: () => fn.frageBeenden(),
    weiterKlick: () => fn.weiterKlick(),
    entfernenKlick(id) {
      const s = sRef.current;
      entfernen(s, id);
      linkRef.current?.anSpieler(id, { t: 'abgelehnt', grund: 'entfernt' });
      geaendert();
      fn.alleDaPruefen();
    },
    neueRunde() {
      const s = sRef.current;
      clear(weiterTimer);
      setWeiterUm(null);
      zurueckZurLobby(s, Date.now());
      linkRef.current?.anAlle({ t: 'lobby' });
      geaendert();
    },
    schliessen() {
      linkRef.current?.anAlle({ t: 'geschlossen' });
      gespeichertesSpielLoeschen();
    },
  };
}
