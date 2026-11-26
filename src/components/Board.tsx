/**
 * Das Spielbrett: ein geschwungener Weg von Nazareth zur Krippe mit 20 Feldern,
 * einfachen Silhouetten und den Spielsteinen. Komplett selbst gezeichnet (SVG).
 */
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { EREIGNIS_FELDER, ZIEL_FELD } from '../game/constants';
import { EreignisSymbol, KrippeSymbol, LeuchtStern, SternGlanzDefs } from './Symbole';

type P = [number, number];

export const FELDER: P[] = [
  [95, 770], // 0 Nazareth
  [205, 795],
  [318, 778],
  [430, 748],
  [545, 765],
  [660, 790],
  [772, 768],
  [872, 712],
  [905, 610],
  [845, 528],
  [735, 510],
  [622, 528],
  [508, 505],
  [395, 520],
  [282, 498],
  [165, 440],
  [120, 340],
  [180, 250],
  [300, 215],
  [430, 225],
  [575, 192], // 20 Krippe
];

function wegPfad(pts: P[]): string {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/** Positionen in einer Sechseck-Spirale um die Feldmitte */
function haufen(n: number, abstand: number): P[] {
  const out: P[] = [[0, 0]];
  let ring = 1;
  while (out.length < n) {
    for (let seite = 0; seite < 6 && out.length < n; seite++) {
      for (let k = 0; k < ring && out.length < n; k++) {
        const a1 = (Math.PI / 3) * seite - Math.PI / 2;
        const a2 = (Math.PI / 3) * (seite + 1) - Math.PI / 2;
        const x = Math.cos(a1) * ring + ((Math.cos(a2) - Math.cos(a1)) * ring * k) / ring;
        const y = Math.sin(a1) * ring + ((Math.sin(a2) - Math.sin(a1)) * ring * k) / ring;
        out.push([x * abstand, y * abstand]);
      }
    }
    ring++;
  }
  return out;
}

export interface BrettFigur {
  id: string;
  kuerzel: string;
  farbe: string;
  feld: number;
}

export interface BrettZug {
  von: number;
  landung: number;
  nach: number;
}

interface Props {
  figuren: BrettFigur[];
  /** Züge der letzten Frage – werden animiert, sobald sich `animSchluessel` ändert */
  zuege?: Record<string, BrettZug>;
  animSchluessel?: number | string;
  /** Verzögerung, bevor die Figuren losziehen (ms) */
  startVerzoegerung?: number;
  hervorheben?: string | null;
}

const SCHRITT_MS = 330;
const PAUSE_MS = 750;

function BoardInner({ figuren, zuege, animSchluessel, startVerzoegerung = 1400, hervorheben }: Props) {
  const [anzeige, setAnzeige] = useState<Record<string, number> | null>(null);
  const timers = useRef<number[]>([]);
  const zuegeRef = useRef(zuege);
  zuegeRef.current = zuege;

  useEffect(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    const z = zuegeRef.current;
    if (!z || Object.keys(z).length === 0) {
      setAnzeige(null);
      return;
    }
    const ids = Object.keys(z);
    const start: Record<string, number> = {};
    ids.forEach((id) => (start[id] = z[id].von));
    setAnzeige(start);
    const reduziert = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const schritt = reduziert ? 0 : SCHRITT_MS;

    const max1 = Math.max(0, ...ids.map((id) => z[id].landung - z[id].von));
    const max2 = Math.max(0, ...ids.map((id) => Math.abs(z[id].nach - z[id].landung)));
    let t = startVerzoegerung;
    for (let k = 1; k <= max1; k++) {
      t += schritt;
      timers.current.push(
        window.setTimeout(() => {
          setAnzeige((prev) => {
            const n = { ...(prev ?? {}) };
            ids.forEach((id) => (n[id] = Math.min(z[id].von + k, z[id].landung)));
            return n;
          });
        }, t),
      );
    }
    if (max2 > 0) t += PAUSE_MS;
    for (let k = 1; k <= max2; k++) {
      t += schritt;
      timers.current.push(
        window.setTimeout(() => {
          setAnzeige((prev) => {
            const n = { ...(prev ?? {}) };
            ids.forEach((id) => {
              const { landung, nach } = z[id];
              const richtung = Math.sign(nach - landung);
              n[id] = richtung > 0 ? Math.min(landung + k, nach) : Math.max(landung - k, nach);
            });
            return n;
          });
        }, t),
      );
    }
    timers.current.push(window.setTimeout(() => setAnzeige(null), t + 400));
    return () => timers.current.forEach((x) => window.clearTimeout(x));
  }, [animSchluessel, startVerzoegerung]);

  const weg = useMemo(() => wegPfad(FELDER), []);

  // Figuren pro Feld gruppieren und im Haufen anordnen
  const positionen = useMemo(() => {
    const proFeld = new Map<number, BrettFigur[]>();
    for (const f of figuren) {
      const feld = anzeige?.[f.id] ?? f.feld;
      const liste = proFeld.get(feld) ?? [];
      liste.push(f);
      proFeld.set(feld, liste);
    }
    const out: Record<string, { x: number; y: number; r: number }> = {};
    proFeld.forEach((liste, feld) => {
      const n = liste.length;
      const r = n > 12 ? 14 : n > 6 ? 16 : 18;
      const offs = haufen(n, r * 1.9);
      const [cx, cy] = FELDER[Math.max(0, Math.min(ZIEL_FELD, feld))];
      liste.forEach((f, i) => {
        const x = Math.max(r + 2, Math.min(1000 - r - 2, cx + offs[i][0]));
        const y = Math.max(r + 2, Math.min(860 - r - 2, cy + offs[i][1]));
        out[f.id] = { x, y, r };
      });
    });
    return out;
  }, [figuren, anzeige]);

  return (
    <svg viewBox="0 0 1000 860" className="h-full w-full" role="img" aria-label="Spielbrett von Nazareth nach Bethlehem">
      <SternGlanzDefs />
      <Landschaft />

      {/* Weg */}
      <path d={weg} fill="none" stroke="#f6d68a" strokeOpacity="0.12" strokeWidth="54" strokeLinecap="round" />
      <path d={weg} fill="none" stroke="#f6d68a" strokeOpacity="0.45" strokeWidth="2.5" strokeDasharray="2 12" strokeLinecap="round" />

      {/* Felder */}
      {FELDER.map(([x, y], i) => {
        const ereignis = EREIGNIS_FELDER[i];
        if (i === 0) {
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="30" fill="#111c45" stroke="#f6d68a" strokeOpacity="0.7" strokeWidth="2.5" />
              <text x={x} y={y + 6} textAnchor="middle" fontSize="17" fontWeight="700" fill="#fbeac0" fontFamily="Source Sans 3, sans-serif">
                Start
              </text>
            </g>
          );
        }
        if (i === ZIEL_FELD) {
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="34" fill="#ecc15c" stroke="#fbeac0" strokeWidth="3" />
              <g transform={`translate(${x} ${y})`}>
                <KrippeSymbol />
              </g>
            </g>
          );
        }
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r="24"
              fill={ereignis ? '#1a2a5e' : '#111c45'}
              stroke="#f6d68a"
              strokeOpacity={ereignis ? 0.9 : 0.45}
              strokeWidth={ereignis ? 2.5 : 1.8}
            />
            {ereignis ? (
              <g transform={`translate(${x} ${y})`}>
                <EreignisSymbol art={ereignis} />
              </g>
            ) : (
              <text x={x} y={y + 6} textAnchor="middle" fontSize="17" fontWeight="600" fill="#fbeac0" fillOpacity="0.75" fontFamily="Source Sans 3, sans-serif">
                {i}
              </text>
            )}
          </g>
        );
      })}

      {/* Spielsteine */}
      {figuren.map((f) => {
        const p = positionen[f.id];
        if (!p) return null;
        const hell = hervorheben === f.id;
        return (
          <g
            key={f.id}
            style={{
              transform: `translate(${p.x}px, ${p.y}px)`,
              transition: 'transform 300ms ease-out',
            }}
          >
            <circle r={p.r + 1} cy="2.5" fill="#000" opacity="0.35" />
            <circle r={p.r} fill={f.farbe} stroke={hell ? '#ffffff' : '#0a1230'} strokeWidth={hell ? 4 : 2.5} />
            <text
              y={p.r * 0.36}
              textAnchor="middle"
              fontSize={f.kuerzel.length > 3 ? p.r * 0.72 : p.r * 0.88}
              fontWeight="700"
              fill="#0a1230"
              fontFamily="Source Sans 3, sans-serif"
            >
              {f.kuerzel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export const Board = memo(BoardInner);

/** Hintergrund: Himmel, Stern, Stall, Stadt, Hügel, Hirtenfeld, Wüste mit Palmen, Nazareth */
const Landschaft = memo(function Landschaft() {
  const label = { fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 700, fill: '#f6d68a', fillOpacity: 0.85 } as const;
  return (
    <g>
      {/* kleine Sterne */}
      {[
        [60, 60], [140, 110], [250, 50], [350, 95], [420, 40], [720, 70], [800, 130], [880, 60], [950, 160], [690, 200], [990, 300], [860, 250],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1.2} fill="#fbeac0" opacity={0.5 + (i % 4) * 0.1} />
      ))}

      {/* Lichtstrahl vom Stern zum Stall */}
      <path d="M575 70 L520 175 L630 175 Z" fill="url(#lichtStrahl)" />

      {/* Hügel bei Bethlehem (rechts) */}
      <path d="M560 470 C640 380 720 360 800 400 C860 330 940 320 1000 360 L1000 660 L560 660 Z" fill="#0f1940" />
      <path d="M640 520 C720 440 820 430 900 470 C950 440 990 440 1000 450 L1000 680 L640 680 Z" fill="#132050" />
      <text x="830" y="455" fontSize="24" textAnchor="middle" {...label}>Hügel bei Bethlehem</text>

      {/* Hirtenfeld (Mitte) */}
      <path d="M200 545 C300 470 520 455 640 560 L640 600 L200 600 Z" fill="#14244f" opacity="0.8" />
      {[
        [350, 470], [440, 458], [470, 472], [560, 470],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`} opacity="0.75">
          <ellipse cx="0" cy="0" rx="12" ry="8" fill="#d9d4c3" />
          <circle cx="11" cy="-3" r="4.5" fill="#d9d4c3" />
          <path d="M-6 6 v6 M6 6 v6" stroke="#d9d4c3" strokeWidth="2" />
        </g>
      ))}
      {/* Hirte mit Stab */}
      <g transform="translate(395 445)" opacity="0.75" fill="#d9d4c3">
        <circle cx="0" cy="-20" r="5" />
        <path d="M-7 -14 L7 -14 L9 10 L-9 10 Z" />
        <path d="M12 12 L12 -26 C12 -32 20 -32 20 -26" stroke="#d9d4c3" strokeWidth="2.2" fill="none" />
      </g>
      <text x="400" y="590" fontSize="24" textAnchor="middle" {...label}>Hirtenfeld</text>

      {/* Bethlehem: Häuser und Herberge (oben links) */}
      <g fill="#14224d">
        <rect x="40" y="200" width="70" height="70" />
        <rect x="95" y="165" width="80" height="60" />
        <rect x="215" y="140" width="110" height="65" />
        <rect x="335" y="160" width="70" height="50" />
        <rect x="395" y="135" width="60" height="70" />
        <path d="M415 135 a20 20 0 0 1 40 0 Z" />
      </g>
      {/* erleuchtete Fenster */}
      <g fill="#ecc15c" opacity="0.75">
        <rect x="60" y="220" width="10" height="12" />
        <rect x="120" y="180" width="10" height="12" />
        <rect x="145" y="180" width="10" height="12" />
        <rect x="235" y="160" width="12" height="14" />
        <rect x="265" y="160" width="12" height="14" />
        <rect x="295" y="160" width="12" height="14" />
        <rect x="352" y="175" width="10" height="12" />
        <rect x="415" y="155" width="10" height="12" />
      </g>
      <text x="270" y="128" fontSize="24" textAnchor="middle" {...label}>Herberge</text>

      {/* Stall */}
      <g transform="translate(575 150)">
        <path d="M-80 -10 L0 -62 L80 -10 Z" fill="#2a1f1a" />
        <rect x="-68" y="-12" width="136" height="70" fill="#22170f" />
        <path d="M-80 -10 L0 -62 L80 -10" stroke="#6b4a2b" strokeWidth="5" fill="none" strokeLinejoin="round" />
        <rect x="-30" y="5" width="60" height="53" fill="#3a2a18" />
        <rect x="-30" y="5" width="60" height="53" fill="#ecc15c" opacity="0.18" />
      </g>
      <text x="690" y="135" fontSize="24" {...label}>Stall</text>

      {/* Stern über Bethlehem */}
      <g transform="translate(575 62)">
        <LeuchtStern groesse={0.9} />
      </g>

      {/* Wüste (unten) */}
      <path d="M0 720 C150 680 300 700 450 690 C600 680 800 690 1000 670 L1000 860 L0 860 Z" fill="#1b2148" />
      <path d="M0 800 C200 770 420 830 640 800 C780 780 900 800 1000 790 L1000 860 L0 860 Z" fill="#20274f" />
      {[
        [255, 700, 1],
        [700, 712, 0.9],
        [960, 760, 1.1],
        [490, 845, 0.8],
      ].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`} fill="#0b1433">
          <path d="M-3 0 C-2 -25 0 -45 4 -62 L8 -62 C4 -45 3 -25 3 0 Z" />
          <path d="M6 -62 C-8 -72 -24 -70 -32 -60 C-18 -64 -6 -62 6 -60 Z" />
          <path d="M6 -62 C16 -76 32 -74 38 -62 C26 -66 16 -64 6 -60 Z" />
          <path d="M6 -62 C0 -80 -12 -86 -22 -84 C-10 -80 0 -72 6 -60 Z" />
          <path d="M6 -62 C14 -82 28 -88 34 -84 C22 -80 12 -72 6 -60 Z" />
        </g>
      ))}
      <text x="560" y="845" fontSize="24" textAnchor="middle" {...label}>Wüste</text>

      {/* Nazareth (unten links) */}
      <g fill="#14224d">
        <rect x="18" y="668" width="48" height="44" />
        <rect x="56" y="650" width="60" height="50" />
        <rect x="120" y="680" width="40" height="34" />
      </g>
      <g fill="#ecc15c" opacity="0.7">
        <rect x="32" y="682" width="8" height="10" />
        <rect x="76" y="664" width="8" height="10" />
        <rect x="132" y="692" width="8" height="10" />
      </g>
      <text x="88" y="638" fontSize="24" textAnchor="middle" {...label}>Nazareth</text>
    </g>
  );
});
