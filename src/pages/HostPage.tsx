import { useEffect, useState } from 'react';
import { MAX_SPIELER } from '../game/constants';
import { neuesSpiel, type GameState } from '../game/engine';
import { HostSpiel } from '../host/HostSpiel';
import { gespeichertesSpiel, gespeichertesSpielLoeschen } from '../host/useHostSpiel';
import { makeRoomCode } from '../lib/random';
import { getQueryParam, navigate } from '../router';
import { getTransport } from '../net/transport';

/** Smartboard-Ansicht skaliert mit der Bildschirmbreite (1920 px ≙ 16 px Grundschrift). */
function useHostSkalierung() {
  useEffect(() => {
    const html = document.documentElement;
    const vorher = html.style.fontSize;
    html.style.fontSize = 'clamp(12px, 0.84vw, 34px)';
    return () => {
      html.style.fontSize = vorher;
    };
  }, []);
}

export default function HostPage() {
  useHostSkalierung();
  const bots = Math.max(0, Math.min(MAX_SPIELER, parseInt(getQueryParam('bots') ?? '0', 10) || 0));
  const [gespeichert] = useState(() => gespeichertesSpiel());
  const [spiel, setSpiel] = useState<GameState | null>(null);
  const [klasse, setKlasse] = useState('');

  if (spiel) {
    return (
      <HostSpiel
        start={spiel}
        bots={bots}
        onSchliessen={() => {
          setSpiel(null);
          navigate('/');
        }}
      />
    );
  }

  const neu = () => {
    gespeichertesSpielLoeschen();
    setSpiel(neuesSpiel(makeRoomCode(), klasse.trim().slice(0, 12)));
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 p-8 text-center">
      <div className="einblenden">
        <p className="mb-3 text-xl uppercase tracking-[0.3em] text-gold-300">Spiel leiten</p>
        <h1 className="text-7xl font-bold text-gold-200">Der Weg zur Krippe</h1>
      </div>

      {gespeichert && (
        <div className="card einblenden flex flex-col items-center gap-5 p-8">
          <p className="text-2xl">
            Hier läuft noch ein Spiel im Raum <span className="font-bold tracking-widest text-gold-300">{gespeichert.code}</span>.
          </p>
          <div className="flex gap-4">
            <button className="btn-gold text-2xl" onClick={() => setSpiel(gespeichert)}>
              Spiel fortsetzen
            </button>
            <button
              className="btn-ghost text-2xl"
              onClick={() => {
                gespeichertesSpielLoeschen();
                window.location.reload();
              }}
            >
              Verwerfen
            </button>
          </div>
        </div>
      )}

      <form
        className="card einblenden flex w-full max-w-2xl flex-col gap-6 p-10"
        onSubmit={(e) => {
          e.preventDefault();
          neu();
        }}
      >
        <label className="flex flex-col gap-3 text-left text-2xl">
          <span>
            Klasse <span className="text-gold-200/80">(freiwillig, für die Schulrangliste)</span>
          </span>
          <input
            value={klasse}
            onChange={(e) => setKlasse(e.target.value)}
            maxLength={12}
            placeholder="z. B. 9b"
            className="rounded-xl border border-white/20 bg-nacht-900 px-5 py-4 text-3xl text-white outline-none placeholder:text-white/30 focus:border-gold-300"
            autoComplete="off"
          />
        </label>
        <button type="submit" className="btn-gold py-5 text-3xl">
          Raum erstellen
        </button>
        {bots > 0 && <p className="text-xl text-gold-200">Testmodus: {bots} simulierte Spieler treten bei.</p>}
        {getTransport().modus === 'lokal' && (
          <p className="text-xl text-gold-200">
            Lokaler Testmodus (keine Supabase-Daten eingetragen): Spieler können nur in anderen Tabs dieses Browsers beitreten.
          </p>
        )}
      </form>

      <button className="text-xl text-gold-200 underline-offset-4 hover:underline" onClick={() => navigate('/')}>
        Zurück zur Startseite
      </button>
    </main>
  );
}
