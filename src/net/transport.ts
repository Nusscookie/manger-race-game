import type { AnAlle, AnHost, AnSpieler, VerbindungsStatus } from './protocol';
import { lokalTransport } from './lokalTransport';
import { supabaseTransport } from './supabaseTransport';

export interface HostVerbindung {
  anAlle(msg: AnAlle): void;
  anSpieler(id: string, msg: AnSpieler): void;
  schliessen(): void;
}

export interface SpielerVerbindung {
  anHost(msg: AnHost): void;
  schliessen(): void;
}

export interface Transport {
  modus: 'supabase' | 'lokal';
  hostOeffnen(
    code: string,
    onMsg: (msg: AnHost) => void,
    onStatus: (s: VerbindungsStatus) => void,
  ): HostVerbindung;
  spielerOeffnen(
    code: string,
    id: string,
    onAlle: (msg: AnAlle) => void,
    onPersoenlich: (msg: AnSpieler) => void,
    onStatus: (s: VerbindungsStatus) => void,
  ): SpielerVerbindung;
}

let instanz: Transport | null = null;

/** Supabase, wenn die Umgebungsvariablen gesetzt sind – sonst lokaler Testmodus (nur Tabs im selben Browser). */
export function getTransport(): Transport {
  if (instanz) return instanz;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const lokalErzwungen = new URLSearchParams(window.location.search).has('lokal');
  instanz = url && key && !lokalErzwungen ? supabaseTransport(url, key) : lokalTransport();
  return instanz;
}
