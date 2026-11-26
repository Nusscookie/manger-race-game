import { useEffect, useState } from 'react';
import { FRAGE_MS } from '../game/constants';

/** Liefert die Restzeit bis `endeUm` (lokale Uhr), aktualisiert ca. 5× pro Sekunde. */
export function useRestzeit(endeUm: number | null): number {
  const [jetzt, setJetzt] = useState(Date.now());
  useEffect(() => {
    if (endeUm === null) return;
    const iv = window.setInterval(() => setJetzt(Date.now()), 200);
    return () => window.clearInterval(iv);
  }, [endeUm]);
  return endeUm === null ? 0 : Math.max(0, endeUm - jetzt);
}

/** Großer runder Countdown für das Smartboard */
export function CountdownRing({ restMs, gesamtMs = FRAGE_MS, groesse = 9 }: { restMs: number; gesamtMs?: number; groesse?: number }) {
  const anteil = Math.max(0, Math.min(1, restMs / gesamtMs));
  const sek = Math.ceil(restMs / 1000);
  const r = 44;
  const umfang = 2 * Math.PI * r;
  const knapp = sek <= 5;
  return (
    <div className="relative shrink-0" style={{ width: `${groesse}rem`, height: `${groesse}rem` }} role="timer" aria-label={`${sek} Sekunden`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="#0a1230" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={knapp ? '#ef8f86' : '#ecc15c'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={umfang}
          strokeDashoffset={umfang * (1 - anteil)}
          style={{ transition: 'stroke-dashoffset 200ms linear' }}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-serif font-bold ${knapp ? 'text-falsch' : 'text-gold-200'}`}
        style={{ fontSize: `${groesse * 0.42}rem` }}
      >
        {sek}
      </span>
    </div>
  );
}

/** Schmaler Zeitbalken fürs Handy */
export function Zeitbalken({ restMs, gesamtMs = FRAGE_MS }: { restMs: number; gesamtMs?: number }) {
  const anteil = Math.max(0, Math.min(1, restMs / gesamtMs));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.ceil(restMs / 1000)} aria-valuemax={gesamtMs / 1000}>
      <div
        className={`h-full rounded-full ${restMs <= 5000 ? 'bg-falsch' : 'bg-gold-400'}`}
        style={{ width: `${anteil * 100}%`, transition: 'width 200ms linear' }}
      />
    </div>
  );
}
