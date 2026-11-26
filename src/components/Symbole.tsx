import type { Ereignis } from '../game/constants';

/** Kleine, selbst gezeichnete Symbole für die Ereignisfelder (Mittelpunkt 0,0, ca. 28 × 28). */
export function EreignisSymbol({ art, farbe = '#f6d68a' }: { art: Ereignis; farbe?: string }) {
  switch (art) {
    case 'stern':
      return (
        <path
          d="M0 -13 L3 -3 L13 0 L3 3 L0 13 L-3 3 L-13 0 L-3 -3 Z M0 -7 L5 -5 L7 0 L5 5 L0 7 L-5 5 L-7 0 L-5 -5 Z"
          fill={farbe}
          fillRule="evenodd"
        />
      );
    case 'engel':
      return (
        <g fill={farbe}>
          <ellipse cx="0" cy="-11" rx="5" ry="1.6" fill="none" stroke={farbe} strokeWidth="1.4" />
          <circle cx="0" cy="-6" r="3" />
          <path d="M0 -3 L6 11 L-6 11 Z" />
          <path d="M-1 -1 C-7 -6 -12 -4 -13 2 C-9 1 -5 2 -2 4 Z" opacity="0.85" />
          <path d="M1 -1 C7 -6 12 -4 13 2 C9 1 5 2 2 4 Z" opacity="0.85" />
        </g>
      );
    case 'herberge':
      return (
        <g>
          <path d="M-11 -1 L0 -11 L11 -1 L11 11 L-11 11 Z" fill={farbe} />
          <rect x="-4" y="2" width="8" height="9" fill="#0a1230" />
          <path d="M-14 13 L14 -13" stroke="#ef8f86" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'volkszaehlung':
      return (
        <g>
          <rect x="-9" y="-11" width="18" height="22" rx="2" fill={farbe} />
          <path d="M-5 -5 H5 M-5 0 H5 M-5 5 H2" stroke="#0a1230" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      );
  }
}

/** Futterkrippe für das Zielfeld */
export function KrippeSymbol() {
  return (
    <g>
      <path d="M-14 -4 L14 -4 L9 6 L-9 6 Z" fill="#0a1230" />
      <path d="M-12 -4 C-6 -9 6 -9 12 -4" stroke="#fbeac0" strokeWidth="2.5" fill="none" />
      <path d="M-9 6 L-12 13 M9 6 L12 13" stroke="#0a1230" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

/** Leuchtender Stern (für Startseite und Brett) */
export function LeuchtStern({ groesse = 1 }: { groesse?: number }) {
  return (
    <g transform={`scale(${groesse})`}>
      <circle r="60" fill="url(#sternGlanz)" />
      <path
        className="stern-funkeln"
        d="M0 -46 L5 -7 L30 0 L5 7 L0 46 L-5 7 L-30 0 L-5 -7 Z"
        fill="#fbeac0"
      />
      <path d="M0 -16 L3 -3 L16 0 L3 3 L0 16 L-3 3 L-16 0 L-3 -3 Z" fill="#ffffff" transform="rotate(45)" opacity="0.8" />
    </g>
  );
}

export function SternGlanzDefs() {
  return (
    <defs>
      <radialGradient id="sternGlanz">
        <stop offset="0%" stopColor="#fbeac0" stopOpacity="0.55" />
        <stop offset="40%" stopColor="#f6d68a" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#f6d68a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="lichtStrahl" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbeac0" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#fbeac0" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}
