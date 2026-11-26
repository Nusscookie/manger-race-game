import { useMemo, useState } from 'react';
import { Board, type BrettFigur, type BrettZug } from '../components/Board';
import { CountdownRing, useRestzeit } from '../components/Countdown';
import { QrCode } from '../components/QrCode';
import { EreignisSymbol } from '../components/Symbole';
import { Token } from '../components/Token';
import { EREIGNIS_INFO, FRAGE_MS, MAX_SPIELER, ZIEL_FELD, type Ereignis } from '../game/constants';
import { gezeigteFrage, istSpielVorbei, rangliste, spielerListe, type GameState } from '../game/engine';
import { figurKuerzel, figurName } from '../game/figuren';
import { ergebnisEintragen, type EintragErgebnis } from '../lib/klassenwertung';
import { useHostSpiel, type HostSteuerung } from './useHostSpiel';

const BUCHSTABEN = ['A', 'B', 'C', 'D'];

interface Props {
  start: GameState;
  bots: number;
  onSchliessen(): void;
}

export function HostSpiel({ start, bots, onSchliessen }: Props) {
  const [eintrag, setEintrag] = useState<EintragErgebnis | 'laeuft' | null>(null);
  const h = useHostSpiel(start, bots, (s) => {
    if (!s.klasse) return;
    setEintrag('laeuft');
    ergebnisEintragen(s)
      .then(setEintrag)
      .catch(() => setEintrag({ status: 'fehler' }));
  });
  const { s } = h;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <Kopfzeile h={h} />
      {s.phase === 'lobby' && <Lobby h={h} />}
      {(s.phase === 'frage' || s.phase === 'aufloesung') && <Spielansicht h={h} />}
      {s.phase === 'ende' && (
        <Siegerehrung
          h={h}
          eintrag={eintrag}
          onNeueRunde={() => {
            setEintrag(null);
            h.neueRunde();
          }}
          onSchliessen={() => {
            h.schliessen();
            onSchliessen();
          }}
        />
      )}
    </div>
  );
}

function joinBasis() {
  return `${window.location.host}/join`;
}

function Kopfzeile({ h }: { h: HostSteuerung }) {
  const { s } = h;
  return (
    <header className="flex shrink-0 items-center justify-between gap-6 px-8 pb-2 pt-5">
      <h1 className="text-4xl font-bold text-gold-200">Der Weg zur Krippe</h1>
      <div className="flex items-center gap-6 text-xl">
        {h.status === 'getrennt' && (
          <span className="rounded-lg bg-falsch/20 px-4 py-2 font-semibold text-falsch">Verbindung unterbrochen – verbinde neu …</span>
        )}
        {h.modus === 'lokal' && <span className="rounded-lg bg-white/10 px-4 py-2 text-gold-200">Lokaler Testmodus</span>}
        <span className="text-gold-200">{s.klasse ? `Klasse ${s.klasse}` : 'Freies Spiel'}</span>
        {s.phase !== 'lobby' && (
          <span>
            Mitmachen: <span className="font-semibold">{joinBasis()}/</span>
            <span className="font-bold tracking-widest text-gold-300">{s.code}</span>
          </span>
        )}
      </div>
    </header>
  );
}

// ───────────── Lobby ─────────────

function Lobby({ h }: { h: HostSteuerung }) {
  const { s } = h;
  const liste = spielerListe(s).sort((a, b) => a.beigetretenUm - b.beigetretenUm);
  const url = `${window.location.origin}/join/${s.code}`;
  return (
    <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10 px-8 pb-8 pt-4">
      <section className="card einblenden flex flex-col items-center justify-center gap-6 p-8 text-center">
        <p className="text-3xl">Scanne den Code mit dem Handy</p>
        <QrCode text={url} className="aspect-square w-[min(26rem,42vh)]" />
        <div>
          <p className="text-2xl text-gold-200">
            oder öffne <span className="font-semibold text-white">{joinBasis()}</span> und gib ein:
          </p>
          <p className="mt-2 font-serif text-[7rem] font-bold leading-none tracking-[0.18em] text-gold-300">{s.code}</p>
        </div>
        <p className="text-2xl text-white/90">Ein Handy pro Gruppe (3–4 Personen) reicht – überlegt gemeinsam!</p>
      </section>

      <section className="flex min-h-0 flex-col gap-5">
        <div className="flex items-end justify-between">
          <h2 className="text-5xl font-bold">Spielfiguren</h2>
          <p className="text-3xl">
            <span className="font-bold text-gold-300">{liste.length}</span> / {MAX_SPIELER}
          </p>
        </div>
        <div className="card min-h-0 flex-1 overflow-y-auto p-5">
          {liste.length === 0 ? (
            <p className="flex h-full items-center justify-center text-3xl text-gold-200">Warte auf die ersten Figuren …</p>
          ) : (
            <ul className="grid grid-cols-3 gap-3">
              {liste.map((p) => (
                <li key={p.id} className="einblenden flex items-center gap-3 rounded-xl bg-white/5 py-2 pl-2 pr-1">
                  <Token figur={p.figur} groesse={2.8} />
                  <span className="min-w-0 flex-1 truncate text-2xl">{figurName(p.figur)}</span>
                  <button
                    onClick={() => {
                      if (window.confirm(`${figurName(p.figur)} aus dem Raum entfernen?`)) h.entfernenKlick(p.id);
                    }}
                    className="rounded-lg px-3 py-1 text-2xl text-white/60 hover:bg-white/10 hover:text-falsch"
                    aria-label={`${figurName(p.figur)} entfernen`}
                    title="Entfernen"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button className="btn-gold py-6 text-4xl" disabled={liste.length === 0} onClick={h.starten}>
          Spiel starten
        </button>
      </section>
    </main>
  );
}

// ───────────── Frage und Auflösung ─────────────

function Spielansicht({ h }: { h: HostSteuerung }) {
  const { s } = h;
  const gf = gezeigteFrage(s);
  const aufloesung = s.phase === 'aufloesung';
  const restMs = useRestzeit(s.phase === 'frage' ? s.frageStart + FRAGE_MS : null);
  const weiterRest = useRestzeit(h.weiterUm);
  const liste = spielerListe(s);
  const geantwortet = liste.filter((p) => s.antworten[p.id]).length;

  const figuren: BrettFigur[] = useMemo(
    () =>
      rangliste(s)
        .reverse()
        .map((p) => ({ id: p.id, kuerzel: figurKuerzel(p.figur), farbe: p.figur.farbe, feld: p.feld })),
    // s wird direkt verändert – neu berechnen, sobald sich der Zeitstempel ändert
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.aktualisiert, liste.length],
  );
  const zuege: Record<string, BrettZug> | undefined = useMemo(() => {
    if (!aufloesung) return undefined;
    const z: Record<string, BrettZug> = {};
    for (const [id, zug] of Object.entries(s.letzteZuege)) z[id] = { von: zug.von, landung: zug.landung, nach: zug.nach };
    return z;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aufloesung, s.rundeNr]);

  if (!gf) return null;

  const ereignisse = aufloesung
    ? liste
        .filter((p) => s.letzteZuege[p.id]?.ereignis)
        .map((p) => ({ p, e: s.letzteZuege[p.id].ereignis as Ereignis }))
    : [];
  const richtigAnzahl = aufloesung ? liste.filter((p) => s.letzteZuege[p.id]?.richtig).length : 0;
  const amZiel = aufloesung ? liste.filter((p) => p.feld >= ZIEL_FELD) : [];
  const letzte = aufloesung && istSpielVorbei(s);

  return (
    <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-8 px-8 pb-6 pt-2">
      <section className="card flex min-h-0 flex-col p-3">
        <div className="min-h-0 flex-1">
          <Board figuren={figuren} zuege={zuege} animSchluessel={aufloesung ? s.rundeNr : 'frage'} />
        </div>
        <Legende />
      </section>

      <section className="flex min-h-0 flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between gap-6">
          <p className="text-3xl uppercase tracking-[0.2em] text-gold-300">
            Frage {gf.nr} <span className="text-gold-200/70">von {gf.gesamt}</span>
          </p>
          {!aufloesung && <CountdownRing restMs={restMs} groesse={8.5} />}
        </div>

        <h2 className={`font-bold leading-tight ${aufloesung ? 'text-[2.5rem]' : 'text-[2.9rem]'}`}>{gf.frage}</h2>

        <ol className="flex flex-col gap-3">
          {gf.antworten.map((text, i) => {
            const istRichtig = i === gf.richtig;
            const stil = !aufloesung
              ? 'border-white/15 bg-nacht-800/70'
              : istRichtig
                ? 'border-richtig bg-richtig/15'
                : 'border-white/5 bg-nacht-800/40 opacity-45';
            return (
              <li key={i} className={`flex items-center gap-5 rounded-2xl border-2 px-5 transition ${aufloesung ? 'py-2' : 'py-4'} ${stil}`}>
                <span
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl font-serif text-4xl font-bold ${
                    aufloesung && istRichtig ? 'bg-richtig text-nacht-900' : 'bg-gold-400 text-nacht-900'
                  }`}
                >
                  {BUCHSTABEN[i]}
                </span>
                <span className={`leading-snug ${aufloesung ? 'text-[1.75rem]' : 'text-[2rem]'}`}>{text}</span>
              </li>
            );
          })}
        </ol>

        {!aufloesung ? (
          <div className="mt-auto flex items-center justify-between gap-4">
            <p className="text-3xl">
              <span className="font-bold text-gold-300">{geantwortet}</span> von {liste.length} haben geantwortet
            </p>
            <button className="btn-ghost text-xl" onClick={h.frageJetztBeenden}>
              Frage beenden
            </button>
          </div>
        ) : (
          <div className="einblenden flex min-h-0 flex-1 flex-col gap-3">
            <div className="card px-5 py-4">
              <p className="text-[1.6rem] leading-snug">{gf.erklaerung}</p>
              <p className="mt-2 font-serif text-3xl font-bold text-gold-300">{gf.stelle}</p>
            </div>
            <p className="text-2xl">
              <span className="font-bold text-richtig">{richtigAnzahl}</span> von {liste.length} richtig
              {amZiel.length > 0 && (
                <span className="ml-3 font-semibold text-gold-300">
                  · An der Krippe: {amZiel.map((p) => figurName(p.figur)).join(', ')}
                </span>
              )}
            </p>
            {ereignisse.length > 0 && (
              <ul className="flex flex-col gap-2 text-xl">
                {(['stern', 'engel', 'herberge', 'volkszaehlung'] as Ereignis[]).map((art) => {
                  const betroffen = ereignisse.filter((x) => x.e === art).map((x) => figurKuerzel(x.p.figur));
                  if (betroffen.length === 0) return null;
                  const gezeigt = betroffen.slice(0, 8).join(', ') + (betroffen.length > 8 ? ` +${betroffen.length - 8}` : '');
                  return (
                    <li key={art} className="flex items-start gap-3">
                      <svg viewBox="-16 -16 32 32" className="h-8 w-8 shrink-0">
                        <EreignisSymbol art={art} />
                      </svg>
                      <span className="leading-snug">
                        <span className="font-semibold">{EREIGNIS_INFO[art].titel}</span> ({EREIGNIS_INFO[art].wirkung}):{' '}
                        <span className="text-gold-200">{gezeigt}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-auto flex shrink-0 items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-3 text-xl">
                <input
                  type="checkbox"
                  checked={h.autoWeiter}
                  onChange={(e) => h.setAutoWeiter(e.target.checked)}
                  className="h-6 w-6 accent-gold-400"
                />
                {h.autoWeiter && h.weiterUm ? `Automatisch weiter in ${Math.ceil(weiterRest / 1000)} s` : 'Automatisch weiter'}
              </label>
              <button className="btn-gold px-10 py-4 text-3xl" onClick={h.weiterKlick}>
                {letzte ? 'Zur Siegerehrung' : 'Nächste Frage'}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Legende() {
  const arten: Ereignis[] = ['stern', 'engel', 'herberge', 'volkszaehlung'];
  return (
    <ul className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-1 px-4 pb-2 pt-1 text-lg">
      {arten.map((a) => (
        <li key={a} className="flex items-center gap-2">
          <svg viewBox="-16 -16 32 32" className="h-7 w-7 shrink-0">
            <EreignisSymbol art={a} />
          </svg>
          <span>
            <span className="font-semibold">{EREIGNIS_INFO[a].titel}:</span> {EREIGNIS_INFO[a].wirkung}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ───────────── Siegerehrung ─────────────

function Siegerehrung({
  h,
  eintrag,
  onNeueRunde,
  onSchliessen,
}: {
  h: HostSteuerung;
  eintrag: EintragErgebnis | 'laeuft' | null;
  onNeueRunde(): void;
  onSchliessen(): void;
}) {
  const { s } = h;
  const liste = rangliste(s);
  const podest = [liste[1], liste[0], liste[2]];
  const hoehen = ['h-36', 'h-48', 'h-24'];
  const amZiel = liste.some((p) => p.feld >= ZIEL_FELD);
  const plaetze = [2, 1, 3];
  const rest = liste.slice(3);

  return (
    <main className="flex min-h-0 flex-1 flex-col items-center gap-6 px-8 pb-4 pt-2">
      <h2 className="einblenden mb-2 text-6xl font-bold text-gold-200">
        {amZiel ? 'An der Krippe angekommen!' : 'Die Reise ist zu Ende'}
      </h2>

      <div className="flex items-end justify-center gap-8">
        {podest.map((p, i) =>
          p ? (
            <div key={p.id} className="einblenden flex w-72 flex-col items-center gap-3" style={{ animationDelay: `${(2 - i) * 0.25}s` }}>
              <Token figur={p.figur} groesse={plaetze[i] === 1 ? 6.5 : 5} />
              <p className="text-center text-3xl font-semibold">{figurName(p.figur)}</p>
              <p className="text-xl text-gold-200">Feld {p.feld}</p>
              <div
                className={`flex w-full items-start justify-center rounded-t-2xl border border-gold-300/40 pt-3 font-serif text-6xl font-bold ${hoehen[i]} ${
                  plaetze[i] === 1 ? 'bg-gold-400 text-nacht-900' : 'bg-nacht-700 text-gold-200'
                }`}
              >
                {plaetze[i]}
              </div>
            </div>
          ) : (
            <div key={i} className="w-72" />
          ),
        )}
      </div>

      {rest.length > 0 && (
        <ol className="card grid min-h-0 w-full max-w-6xl flex-1 grid-flow-col grid-cols-4 grid-rows-8 gap-x-6 gap-y-1 overflow-hidden p-5 text-xl">
          {rest.slice(0, 32).map((p, i) => (
            <li key={p.id} className="flex items-center gap-3">
              <span className="w-8 text-right font-semibold text-gold-300">{i + 4}.</span>
              <Token figur={p.figur} groesse={1.8} />
              <span className="truncate">{figurName(p.figur)}</span>
              <span className="ml-auto text-gold-200">{p.feld}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="flex w-full max-w-6xl items-center justify-between">
        <div>
          <p className="font-serif text-2xl text-gold-200">Ein Spiel der SMV des PBG</p>
          {eintrag && (
            <p className="mt-1 text-lg text-white/85">
              {eintrag === 'laeuft'
                ? 'Ergebnis wird in die Schulrangliste eingetragen …'
                : eintrag.status === 'eingetragen'
                  ? `Klasse ${s.klasse}: ${eintrag.quote} % richtig – in der Schulrangliste eingetragen.`
                  : eintrag.status === 'uebersprungen'
                    ? `Schulrangliste: ${eintrag.grund}`
                    : 'Schulrangliste: Eintragen hat nicht geklappt.'}
            </p>
          )}
        </div>
        <div className="flex gap-4">
          <button className="btn-ghost text-2xl" onClick={onSchliessen}>
            Raum schließen
          </button>
          <button className="btn-gold text-2xl" onClick={onNeueRunde}>
            Noch eine Runde
          </button>
        </div>
      </div>
    </main>
  );
}
