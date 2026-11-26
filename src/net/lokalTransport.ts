/**
 * Lokaler Testmodus ohne Server: Host- und Spieler-Tabs im selben Browser sprechen über
 * BroadcastChannel miteinander. Eine kleine künstliche Verzögerung simuliert das Netz.
 */
import type { Transport } from './transport';

interface Umschlag {
  ziel: string;
  msg: unknown;
}

const BUS_NAME = 'krippe-lokal';

function bus(onMsg: (u: Umschlag) => void): { post(u: Umschlag): void; close(): void } {
  if (typeof BroadcastChannel === 'undefined') {
    console.error('BroadcastChannel wird von diesem Browser nicht unterstützt.');
    return { post() {}, close() {} };
  }
  const bc = new BroadcastChannel(BUS_NAME);
  bc.onmessage = (e) => onMsg(e.data as Umschlag);
  return {
    post(u) {
      const verzoegerung = 20 + Math.random() * 80;
      setTimeout(() => {
        try {
          bc.postMessage(u);
        } catch {
          /* Kanal schon geschlossen */
        }
      }, verzoegerung);
    },
    close() {
      setTimeout(() => bc.close(), 200);
    },
  };
}

export function lokalTransport(): Transport {
  return {
    modus: 'lokal',
    hostOeffnen(code, onMsg, onStatus) {
      const b = bus((u) => {
        if (u.ziel === `host:${code}`) onMsg(u.msg as never);
      });
      setTimeout(() => onStatus('verbunden'), 50);
      return {
        anAlle: (msg) => b.post({ ziel: `alle:${code}`, msg }),
        anSpieler: (id, msg) => b.post({ ziel: `p:${code}:${id}`, msg }),
        schliessen: () => b.close(),
      };
    },
    spielerOeffnen(code, id, onAlle, onPersoenlich, onStatus) {
      const b = bus((u) => {
        if (u.ziel === `alle:${code}`) onAlle(u.msg as never);
        else if (u.ziel === `p:${code}:${id}`) onPersoenlich(u.msg as never);
      });
      setTimeout(() => onStatus('verbunden'), 50);
      return {
        anHost: (msg) => b.post({ ziel: `host:${code}`, msg }),
        schliessen: () => b.close(),
      };
    },
  };
}
