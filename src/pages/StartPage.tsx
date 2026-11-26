import { useState } from 'react';
import { LeuchtStern, SternGlanzDefs } from '../components/Symbole';
import { isValidRoomCode, normalizeRoomCode } from '../lib/random';
import { navigate } from '../router';

export default function StartPage() {
  const [code, setCode] = useState('');
  const gueltig = isValidRoomCode(code);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-10 px-4 py-10 text-center">
      <div className="einblenden flex flex-col items-center gap-4">
        <svg viewBox="-60 -60 120 120" className="h-28 w-28" aria-hidden="true">
          <SternGlanzDefs />
          <LeuchtStern />
        </svg>
        <h1 className="text-5xl font-bold leading-tight text-gold-200 sm:text-6xl">Der Weg zur Krippe</h1>
        <p className="text-lg text-white/85">Ein Weihnachtsquiz – von Nazareth bis nach Bethlehem.</p>
      </div>

      <form
        className="card einblenden flex w-full flex-col gap-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (gueltig) navigate(`/join/${code}`);
        }}
      >
        <label htmlFor="code" className="text-xl font-semibold">
          Spiel beitreten
        </label>
        <input
          id="code"
          value={code}
          onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
          placeholder="CODE"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="rounded-xl border border-white/20 bg-nacht-900 px-4 py-4 text-center font-serif text-4xl font-bold tracking-[0.4em] text-gold-200 outline-none placeholder:text-white/25 focus:border-gold-300"
          aria-label="Raumcode mit vier Buchstaben"
        />
        <button type="submit" className="btn-gold py-4 text-xl" disabled={!gueltig}>
          Beitreten
        </button>
      </form>

      <div className="einblenden flex w-full flex-col items-center gap-4">
        <button className="btn-ghost w-full py-4 text-lg" onClick={() => navigate('/host')}>
          Spiel leiten (Smartboard)
        </button>
        <button className="text-base text-gold-200 underline-offset-4 hover:underline" onClick={() => navigate('/rangliste')}>
          Schulrangliste ansehen
        </button>
      </div>

      <p className="font-serif text-lg text-gold-200/90">Ein Spiel der SMV des PBG</p>
    </main>
  );
}
