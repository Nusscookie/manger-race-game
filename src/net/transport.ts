import type { AnAlle, AnHost, AnSpieler, VerbindungsStatus } from './protocol';
import { cloudflareTransport } from './cloudflareTransport';
import { lokalTransport } from './lokalTransport';
import { supabaseTransport } from './supabaseTransport';
import { getSupabase } from '../lib/supabase';

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
  modus: 'cloudflare' | 'supabase' | 'lokal';
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

/**
 * Welche Verbindung das Spiel nutzt:
 * 1. `?lokal` in der Adresse → lokaler Testmodus (nur Tabs im selben Browser)
 * 2. `VITE_ECHTZEIT=supabase` → Supabase (Rückfall-Schalter, falls Cloudflare Probleme macht)
 * 3. `VITE_CLOUDFLARE_URL` gesetzt → eigener Raum-Server auf Cloudflare (keine Verbindungs-Obergrenze)
 * 4. Supabase-Daten gesetzt → Supabase Realtime
 * 5. sonst lokaler Testmodus
 */
export function getTransport(): Transport {
  if (instanz) return instanz;
  const lokalErzwungen = new URLSearchParams(window.location.search).has('lokal');
  const cloudflareUrl = (import.meta.env.VITE_CLOUDFLARE_URL as string | undefined)?.trim();
  const supabaseErzwungen = (import.meta.env.VITE_ECHTZEIT as string | undefined)?.trim().toLowerCase() === 'supabase';
  const client = getSupabase();

  if (lokalErzwungen) instanz = lokalTransport();
  else if (supabaseErzwungen && client) instanz = supabaseTransport(client);
  else if (cloudflareUrl) instanz = cloudflareTransport(cloudflareUrl);
  else if (client) instanz = supabaseTransport(client);
  else instanz = lokalTransport();
  return instanz;
}
