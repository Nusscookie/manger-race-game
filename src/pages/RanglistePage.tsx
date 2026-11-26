import { useEffect, useState } from 'react';
import { ranglisteLaden, type RanglistenZeile } from '../lib/klassenwertung';
import { navigate } from '../router';

export default function RanglistePage() {
  const [zeilen, setZeilen] = useState<RanglistenZeile[] | null | 'laden' | 'fehler'>('laden');

  useEffect(() => {
    let aktiv = true;
    const laden = () =>
      ranglisteLaden()
        .then((z) => aktiv && setZeilen(z))
        .catch(() => aktiv && setZeilen('fehler'));
    laden();
    // Alle 30 Sekunden aktualisieren, falls die Seite am Smartboard offen bleibt
    const iv = window.setInterval(laden, 30_000);
    return () => {
      aktiv = false;
      window.clearInterval(iv);
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-gold-300">Der Weg zur Krippe</p>
        <h1 className="mt-2 text-5xl font-bold text-gold-200">Schulrangliste</h1>
        <p className="mt-3 text-lg text-white/85">Bestes Ergebnis jeder Klasse – Anteil der richtigen Antworten.</p>
      </header>

      {zeilen === 'laden' && <p className="text-center text-xl">Lade …</p>}
      {zeilen === 'fehler' && <p className="text-center text-xl text-falsch">Die Rangliste konnte gerade nicht geladen werden.</p>}
      {zeilen === null && (
        <p className="card p-6 text-center text-lg">Die Schulrangliste ist verfügbar, sobald Supabase eingerichtet ist (siehe README).</p>
      )}
      {Array.isArray(zeilen) && zeilen.length === 0 && (
        <p className="card p-6 text-center text-lg">Noch keine Ergebnisse. Gebt beim Erstellen des Raums eure Klasse an!</p>
      )}
      {Array.isArray(zeilen) && zeilen.length > 0 && (
        <ol className="card divide-y divide-white/10 overflow-hidden">
          {zeilen.map((z, i) => (
            <li key={z.klasse} className={`flex items-center gap-4 px-5 py-4 ${i < 3 ? 'bg-gold-400/10' : ''}`}>
              <span className={`w-10 text-right font-serif text-3xl font-bold ${i < 3 ? 'text-gold-300' : 'text-white/80'}`}>{i + 1}.</span>
              <span className="flex-1 text-2xl font-semibold">{z.klasse}</span>
              <span className="text-right">
                <span className="text-2xl font-bold text-gold-200">{z.besteQuote} %</span>
                <span className="block text-sm text-white/75">
                  {z.spiele} {z.spiele === 1 ? 'Spiel' : 'Spiele'}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-col items-center gap-3">
        <button className="btn-ghost" onClick={() => navigate('/')}>
          Zur Startseite
        </button>
        <p className="font-serif text-lg text-gold-200/90">Ein Spiel der SMV des PBG</p>
      </div>
    </main>
  );
}
