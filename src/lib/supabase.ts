import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

/** Gemeinsamer Supabase-Client – oder null, wenn keine Zugangsdaten eingetragen sind. */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  // Supabase nennt den öffentlichen Schlüssel inzwischen „publishable key“; der alte Name geht weiterhin.
  const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as
    | string
    | undefined;
  client =
    url && key
      ? createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
          realtime: {
            params: { eventsPerSecond: 20 },
            // Herzschlag im Web Worker, damit Browser ihn in Hintergrund-Tabs nicht drosseln.
            worker: typeof Worker !== 'undefined',
          },
        })
      : null;
  return client;
}
