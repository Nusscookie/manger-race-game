import { richtigQuote, spielerListe, type GameState } from '../game/engine';
import { getSupabase } from './supabase';

export interface KlassenEintrag {
  klasse: string;
  quote: number;
  figuren: number;
  fragen: number;
  erstellt: string;
}

/** „ 9 B “ → „9b“, damit dieselbe Klasse nicht doppelt auftaucht. */
export function klasseNormalisieren(k: string): string {
  return k.trim().replace(/\s+/g, '').toLowerCase().slice(0, 12);
}

export type EintragErgebnis =
  | { status: 'eingetragen'; quote: number }
  | { status: 'uebersprungen'; grund: string }
  | { status: 'fehler' };

/** Schreibt das Klassenergebnis in die Schulrangliste (nur wenn eine Klasse angegeben ist). */
export async function ergebnisEintragen(s: GameState): Promise<EintragErgebnis> {
  const klasse = klasseNormalisieren(s.klasse);
  if (!klasse) return { status: 'uebersprungen', grund: 'Keine Klasse angegeben.' };
  const sb = getSupabase();
  if (!sb) return { status: 'uebersprungen', grund: 'Supabase ist nicht eingerichtet.' };
  const echte = spielerListe(s).filter((p) => !p.bot);
  if (echte.length === 0) return { status: 'uebersprungen', grund: 'Im Testmodus mit Bots wird nichts eingetragen.' };
  const fragen = s.rundeNr + 1;
  if (fragen < 3) return { status: 'uebersprungen', grund: 'Zu wenige Fragen gespielt.' };
  const quote = richtigQuote(s);
  const { error } = await sb.from('klassenwertung').insert({
    klasse,
    quote,
    figuren: Math.min(35, spielerListe(s).length),
    fragen,
  });
  if (error) {
    console.warn('Eintrag in die Rangliste fehlgeschlagen', error);
    return { status: 'fehler' };
  }
  return { status: 'eingetragen', quote };
}

export interface RanglistenZeile {
  klasse: string;
  besteQuote: number;
  spiele: number;
}

/** Lädt die Einträge der letzten 120 Tage und nimmt pro Klasse das beste Ergebnis. */
export async function ranglisteLaden(): Promise<RanglistenZeile[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const seit = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await sb
    .from('klassenwertung')
    .select('klasse, quote, figuren, fragen, erstellt')
    .gte('erstellt', seit)
    .order('erstellt', { ascending: false })
    .limit(1000);
  if (error || !data) throw error ?? new Error('Keine Daten');
  const proKlasse = new Map<string, RanglistenZeile>();
  for (const e of data as KlassenEintrag[]) {
    const z = proKlasse.get(e.klasse) ?? { klasse: e.klasse, besteQuote: 0, spiele: 0 };
    z.besteQuote = Math.max(z.besteQuote, e.quote);
    z.spiele += 1;
    proKlasse.set(e.klasse, z);
  }
  return [...proKlasse.values()].sort((a, b) => b.besteQuote - a.besteQuote || a.klasse.localeCompare(b.klasse, 'de', { numeric: true }));
}
