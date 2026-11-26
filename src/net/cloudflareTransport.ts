/**
 * Echtzeit über den eigenen Raum-Server auf Cloudflare (Ordner `worker/`).
 *
 * Jeder Raum hat dort ein eigenes Durable Object, deshalb gibt es – anders als beim kostenlosen
 * Supabase-Tarif – keine gemeinsame Obergrenze an gleichzeitigen Verbindungen.
 *
 * Eine WebSocket-Verbindung pro Gerät:
 *   Host:    …/raum/ABCD?rolle=host&schluessel=…   (Schlüssel bleibt im Browser gespeichert)
 *   Spieler: …/raum/ABCD?rolle=spieler&id=…
 *
 * Bricht die Verbindung ab, verbindet sich der Browser selbst neu. Was in der Zwischenzeit
 * gesendet wird, wartet in einer kleinen Warteschlange.
 */
import { randomHex } from '../lib/random';
import { loadJSON, saveJSON } from '../lib/storage';
import type { VerbindungsStatus } from './protocol';
import type { Transport } from './transport';

const PING_MS = 20_000;
/** So lange ohne jedes Lebenszeichen → Verbindung gilt als tot */
const STILLE_MS = 45_000;
const WARTESCHLANGE_MAX = 50;
const WARTESCHLANGE_ALT_MS = 60_000;
const SCHLUESSEL_SPEICHER = 'krippe-raumschluessel-v1';

interface Verbindung {
  /** `erzeugen` bekommt die Wartezeit in ms, falls die Nachricht in der Warteschlange lag. */
  senden(erzeugen: (verspaetungMs: number) => string): void;
  schliessen(): void;
}

/** Ein WebSocket, der sich bei Abbrüchen selbst neu verbindet. */
function stabileVerbindung(url: string, onText: (t: string) => void, onStatus: (s: VerbindungsStatus) => void): Verbindung {
  let ws: WebSocket | null = null;
  let beendet = false;
  let versuch = 0;
  let schonVerbunden = false;
  let zuletztEmpfangen = Date.now();
  let warteTimer: number | undefined;
  const warteschlange: { um: number; erzeugen: (v: number) => string }[] = [];

  const abgebrochen = (alt: WebSocket) => {
    if (ws !== alt) return;
    ws = null;
    onStatus('getrennt');
    planen();
  };

  const verbinden = () => {
    if (beendet) return;
    window.clearTimeout(warteTimer);
    if (!schonVerbunden) onStatus('verbinde');
    let neu: WebSocket;
    try {
      neu = new WebSocket(url);
    } catch {
      planen();
      return;
    }
    ws = neu;
    neu.onopen = () => {
      if (ws !== neu) return;
      versuch = 0;
      schonVerbunden = true;
      zuletztEmpfangen = Date.now();
      onStatus('verbunden');
      const jetzt = Date.now();
      for (const e of warteschlange.splice(0)) {
        if (jetzt - e.um < WARTESCHLANGE_ALT_MS) neu.send(e.erzeugen(jetzt - e.um));
      }
    };
    neu.onmessage = (e) => {
      zuletztEmpfangen = Date.now();
      if (typeof e.data === 'string' && e.data !== 'pong') onText(e.data);
    };
    neu.onclose = (e) => {
      if (ws !== neu) return;
      if (e.code === 4003) {
        // Der Raum gehört einer anderen Spielleitung – Neuverbinden bringt nichts.
        console.error('Raum-Server:', e.reason);
        ws = null;
        beendet = true;
        onStatus('getrennt');
        return;
      }
      abgebrochen(neu);
    };
  };

  const planen = () => {
    if (beendet) return;
    window.clearTimeout(warteTimer);
    const basis = Math.min(8_000, 500 * 2 ** versuch);
    versuch++;
    warteTimer = window.setTimeout(verbinden, basis * (0.7 + Math.random() * 0.6));
  };

  /** Sofort neu verbinden (z. B. Handy aus dem Standby zurück oder wieder online). */
  const sofort = () => {
    if (beendet) return;
    if (ws && ws.readyState === WebSocket.OPEN && Date.now() - zuletztEmpfangen > PING_MS + 5_000) {
      const alt = ws;
      try {
        alt.close();
      } catch {
        /* egal */
      }
      abgebrochen(alt);
      versuch = 0;
      verbinden();
    } else if (!ws) {
      versuch = 0;
      verbinden();
    }
  };

  const pingTimer = window.setInterval(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (Date.now() - zuletztEmpfangen > STILLE_MS) {
      const alt = ws;
      try {
        alt.close();
      } catch {
        /* egal */
      }
      abgebrochen(alt);
      return;
    }
    ws.send('ping');
  }, PING_MS);

  const sichtbar = () => {
    if (document.visibilityState === 'visible') sofort();
  };
  window.addEventListener('online', sofort);
  document.addEventListener('visibilitychange', sichtbar);

  verbinden();

  return {
    senden(erzeugen) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(erzeugen(0));
      } else {
        warteschlange.push({ um: Date.now(), erzeugen });
        if (warteschlange.length > WARTESCHLANGE_MAX) warteschlange.shift();
      }
    },
    schliessen() {
      beendet = true;
      window.clearTimeout(warteTimer);
      window.clearInterval(pingTimer);
      window.removeEventListener('online', sofort);
      document.removeEventListener('visibilitychange', sichtbar);
      const alt = ws;
      ws = null;
      try {
        alt?.close(1000, 'tschüss');
      } catch {
        /* egal */
      }
    },
  };
}

/** Geheimer Schlüssel der Spielleitung für einen Raum – bleibt beim Neuladen gleich. */
const schluesselImSpeicher = new Map<string, string>();
function hostSchluessel(code: string): string {
  const vorhanden = schluesselImSpeicher.get(code);
  if (vorhanden) return vorhanden;
  const jetzt = Date.now();
  const alle = loadJSON<Record<string, { s: string; um: number }>>(SCHLUESSEL_SPEICHER) ?? {};
  for (const [c, e] of Object.entries(alle)) if (jetzt - e.um > 2 * 24 * 60 * 60 * 1000) delete alle[c];
  const s = alle[code]?.s ?? randomHex(32);
  alle[code] = { s, um: jetzt };
  saveJSON(SCHLUESSEL_SPEICHER, alle);
  schluesselImSpeicher.set(code, s);
  return s;
}

function parse(t: string): unknown {
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

export function cloudflareTransport(serverUrl: string): Transport {
  const basis = serverUrl.trim().replace(/\/+$/, '').replace(/^http/, 'ws');

  return {
    modus: 'cloudflare',

    hostOeffnen(code, onMsg, onStatus) {
      const url = `${basis}/raum/${code}?rolle=host&schluessel=${hostSchluessel(code)}`;
      const v = stabileVerbindung(
        url,
        (t) => {
          const m = parse(t);
          if (m && typeof m === 'object') onMsg(m as never);
        },
        onStatus,
      );
      return {
        anAlle(msg) {
          v.senden((verspaetung) =>
            JSON.stringify({
              z: 'a',
              // Lag die Frage in der Warteschlange, die Restzeit entsprechend kürzen.
              m: msg.t === 'frage' ? { ...msg, restMs: Math.max(0, msg.restMs - verspaetung) } : msg,
            }),
          );
        },
        anSpieler(id, msg) {
          v.senden(() => JSON.stringify({ z: 'p', id, m: msg }));
        },
        schliessen: () => v.schliessen(),
      };
    },

    spielerOeffnen(code, id, onAlle, onPersoenlich, onStatus) {
      const url = `${basis}/raum/${code}?rolle=spieler&id=${encodeURIComponent(id)}`;
      const v = stabileVerbindung(
        url,
        (t) => {
          const u = parse(t) as { k?: string; m?: unknown } | null;
          if (!u || !u.m) return;
          if (u.k === 'a') onAlle(u.m as never);
          else if (u.k === 'p') onPersoenlich(u.m as never);
        },
        onStatus,
      );
      return {
        anHost(msg) {
          v.senden(() => JSON.stringify(msg));
        },
        schliessen: () => v.schliessen(),
      };
    },
  };
}
