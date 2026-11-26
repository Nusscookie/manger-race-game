/**
 * Echtzeit über Supabase Realtime (Broadcast, ohne Presence und ohne Datenbank).
 *
 * Kanäle pro Raum ABCD:
 *   krippe:ABCD           Host → alle Spieler (nur bei Phasenwechseln)
 *   krippe:ABCD:host      Spieler → Host (Spieler senden per REST, ohne den Kanal zu abonnieren,
 *                         damit sie die Antworten der anderen nicht mitbekommen)
 *   krippe:ABCD:p:<id>    Host → ein einzelner Spieler (per REST)
 *
 * So kostet eine Frage mit 35 Spielern nur rund 4 × 35 Nachrichten.
 */
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { VerbindungsStatus } from './protocol';
import type { Transport } from './transport';

const EVENT = 'm';

function statusAus(s: string): VerbindungsStatus {
  if (s === 'SUBSCRIBED') return 'verbunden';
  if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') return 'getrennt';
  return 'verbinde';
}

/** Per REST senden, bei Fehlern zweimal mit kurzer Pause wiederholen. */
async function restSenden(ch: RealtimeChannel, payload: unknown): Promise<void> {
  for (let versuch = 0; versuch < 3; versuch++) {
    try {
      await ch.httpSend(EVENT, payload);
      return;
    } catch (err) {
      if (versuch === 2) console.warn('Senden fehlgeschlagen', err);
      await new Promise((r) => setTimeout(r, 400 + versuch * 600));
    }
  }
}

export function supabaseTransport(client: SupabaseClient): Transport {
  /** Kanal-Objekte nur zum Senden per REST (werden nie abonniert). */
  const sendeKanaele = new Map<string, RealtimeChannel>();
  function sendeKanal(topic: string): RealtimeChannel {
    let ch = sendeKanaele.get(topic);
    if (!ch) {
      ch = client.channel(topic, { config: { broadcast: { self: false } } });
      sendeKanaele.set(topic, ch);
    }
    return ch;
  }

  return {
    modus: 'supabase',

    hostOeffnen(code, onMsg, onStatus) {
      const raum = client.channel(`krippe:${code}`, { config: { broadcast: { self: false } } });
      raum.subscribe((s) => onStatus(statusAus(s)));

      const eingang = client.channel(`krippe:${code}:host`, { config: { broadcast: { self: false } } });
      eingang.on('broadcast', { event: EVENT }, ({ payload }) => onMsg(payload)).subscribe();

      return {
        anAlle(msg) {
          if (raum.state === 'joined') {
            raum.send({ type: 'broadcast', event: EVENT, payload: msg }).catch(() => restSenden(raum, msg));
          } else {
            void restSenden(raum, msg);
          }
        },
        anSpieler(id, msg) {
          void restSenden(sendeKanal(`krippe:${code}:p:${id}`), msg);
        },
        schliessen() {
          void client.removeChannel(raum);
          void client.removeChannel(eingang);
        },
      };
    },

    spielerOeffnen(code, id, onAlle, onPersoenlich, onStatus) {
      let raumOk = false;
      let ichOk = false;
      const melde = (neu: VerbindungsStatus) => {
        if (neu === 'getrennt') onStatus('getrennt');
        else if (raumOk && ichOk) onStatus('verbunden');
        else onStatus('verbinde');
      };

      const raum = client.channel(`krippe:${code}`, { config: { broadcast: { self: false } } });
      raum
        .on('broadcast', { event: EVENT }, ({ payload }) => onAlle(payload))
        .subscribe((s) => {
          raumOk = s === 'SUBSCRIBED';
          melde(statusAus(s));
        });

      const ich = client.channel(`krippe:${code}:p:${id}`, { config: { broadcast: { self: false } } });
      ich
        .on('broadcast', { event: EVENT }, ({ payload }) => onPersoenlich(payload))
        .subscribe((s) => {
          ichOk = s === 'SUBSCRIBED';
          melde(statusAus(s));
        });

      const host = sendeKanal(`krippe:${code}:host`);

      return {
        anHost(msg) {
          void restSenden(host, msg);
        },
        schliessen() {
          void client.removeChannel(raum);
          void client.removeChannel(ich);
        },
      };
    },
  };
}
