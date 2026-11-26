import type { Figur } from '../game/figuren';
import { figurKuerzel } from '../game/figuren';

/** Spielstein als HTML (für Listen, Lobby, Handy) */
export function Token({ figur, groesse = 2.5, className = '' }: { figur: Figur; groesse?: number; className?: string }) {
  const k = figurKuerzel(figur);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-nacht-900 shadow-md ring-2 ring-nacht-900 ${className}`}
      style={{
        backgroundColor: figur.farbe,
        width: `${groesse}rem`,
        height: `${groesse}rem`,
        fontSize: `${groesse * (k.length > 3 ? 0.32 : 0.4)}rem`,
      }}
      aria-hidden="true"
    >
      {k}
    </span>
  );
}
