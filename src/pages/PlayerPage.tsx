import type { ReactNode } from 'react';
import { Zeitbalken, useRestzeit } from '../components/Countdown';
import { EreignisSymbol } from '../components/Symbole';
import { Token } from '../components/Token';
import { EREIGNIS_INFO, PUNKTE_SCHNELL, ZIEL_FELD, gebietName } from '../game/constants';
import { figurName } from '../game/figuren';
import { isValidRoomCode } from '../lib/random';
import { usePlayerSpiel, type SpielerZustand } from '../player/usePlayerSpiel';
import { navigate } from '../router';

const BUCHSTABEN = ['A', 'B', 'C', 'D'];

export default function PlayerPage({ code }: { code: string }) {
  if (!isValidRoomCode(code)) {
    return (
      <Rahmen>
        <Mitte>
          <h1 className="text-3xl font-bold text-gold-200">Diesen Raum gibt es nicht</h1>
          <p className="text-lg">Ein Raumcode hat genau vier Buchstaben.</p>
          <button className="btn-gold w-full py-4 text-lg" onClick={() => navigate('/')}>
            Code eingeben
          </button>
        </Mitte>
      </Rahmen>
    );
  }
  return <Spieler code={code} />;
}

function Spieler({ code }: { code: string }) {
  const { z, antworten, wuerfeln } = usePlayerSpiel(code);
  return (
    <Rahmen>
      <Kopf z={z} code={code} />
      {z.status === 'getrennt' && (
        <p className="mx-4 rounded-lg bg-falsch/20 px-3 py-2 text-center text-sm font-semibold text-falsch">
          Verbindung weg – verbinde neu …
        </p>
      )}
      {z.ansicht === 'verbinde' && <Verbinde z={z} code={code} />}
      {z.ansicht === 'lobby' && <Lobby z={z} wuerfeln={wuerfeln} />}
      {z.ansicht === 'frage' && <Frage z={z} antworten={antworten} />}
      {z.ansicht === 'aufloesung' && <Aufloesung z={z} />}
      {z.ansicht === 'ende' && <Ende z={z} />}
      {z.ansicht === 'abgelehnt' && <Abgelehnt z={z} />}
      {z.ansicht === 'geschlossen' && (
        <Mitte>
          <h2 className="text-3xl font-bold text-gold-200">Das Spiel ist beendet</h2>
          <p className="text-lg">Die Spielleitung hat den Raum geschlossen. Danke fürs Mitspielen!</p>
          <Fuss />
        </Mitte>
      )}
    </Rahmen>
  );
}

function Rahmen({ children }: { children: ReactNode }) {
  return <main className="mx-auto flex min-h-screen w-full max-w-md flex-col pb-6">{children}</main>;
}

function Mitte({ children }: { children: ReactNode }) {
  return <div className="einblenden flex flex-1 flex-col items-center justify-center gap-5 px-5 text-center">{children}</div>;
}

function Fuss() {
  return <p className="mt-4 font-serif text-base text-gold-200/90">Ein Spiel der SMV des PBG</p>;
}

function Kopf({ z, code }: { z: SpielerZustand; code: string }) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 py-3">
      {z.figur ? (
        <span className="flex min-w-0 items-center gap-2">
          <Token figur={z.figur} groesse={2.2} />
          <span className="truncate text-lg font-semibold">{figurName(z.figur)}</span>
        </span>
      ) : (
        <span className="font-serif text-xl font-bold text-gold-200">Der Weg zur Krippe</span>
      )}
      <span className="shrink-0 text-sm text-white/80">
        Raum <span className="font-bold tracking-widest text-gold-300">{code}</span>
      </span>
    </header>
  );
}

function Verbinde({ z, code }: { z: SpielerZustand; code: string }) {
  return (
    <Mitte>
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gold-300/30 border-t-gold-300" aria-hidden="true" />
      <p className="text-xl">Verbinde mit Raum {code} …</p>
      {z.keinHost && (
        <div className="card flex flex-col gap-4 p-5">
          <p className="text-lg">
            Die Spielleitung antwortet noch nicht. Stimmt der Code, und ist das Spiel am Smartboard geöffnet?
          </p>
          <button className="btn-ghost w-full" onClick={() => navigate('/')}>
            Anderen Code eingeben
          </button>
        </div>
      )}
    </Mitte>
  );
}

function Lobby({ z, wuerfeln }: { z: SpielerZustand; wuerfeln(): void }) {
  if (!z.figur) return null;
  return (
    <Mitte>
      <p className="text-lg uppercase tracking-[0.25em] text-gold-300">Du bist</p>
      <Token figur={z.figur} groesse={7} />
      <h2 className="text-5xl font-bold">{figurName(z.figur)}</h2>
      {z.kannWuerfeln && (
        <button className="btn-ghost px-8 text-lg" onClick={wuerfeln}>
          Neu würfeln (einmal möglich)
        </button>
      )}
      <p className="mt-4 text-xl text-white/90">Schau auf das Smartboard – gleich geht es los.</p>
    </Mitte>
  );
}

function Frage({ z, antworten }: { z: SpielerZustand; antworten(i: number): void }) {
  const f = z.frage;
  const restMs = useRestzeit(f ? f.endeUm : null);
  if (!f) return null;
  const vorbei = restMs <= 0;
  const gewaehlt = z.meineAntwort;
  return (
    <section className="einblenden flex flex-1 flex-col gap-4 px-4">
      <div className="flex items-center justify-between text-base">
        <span className="uppercase tracking-[0.2em] text-gold-300">
          Frage {f.nr} von {f.gesamt}
        </span>
        <span className="font-semibold tabular-nums">{Math.ceil(restMs / 1000)} s</span>
      </div>
      <Zeitbalken restMs={restMs} />
      <h2 className="font-serif text-[1.65rem] font-bold leading-tight">{f.frage}</h2>
      <div className="flex flex-col gap-3">
        {f.antworten.map((text, i) => {
          const istGewaehlt = gewaehlt === i;
          const gesperrt = gewaehlt !== null || vorbei;
          return (
            <button
              key={i}
              onClick={() => antworten(i)}
              disabled={gesperrt}
              className={`flex min-h-[4.25rem] w-full items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left text-lg font-semibold leading-snug transition active:scale-[0.98] ${
                istGewaehlt
                  ? 'border-gold-300 bg-gold-400/20'
                  : gesperrt
                    ? 'border-white/5 bg-nacht-800/50 opacity-50'
                    : 'border-white/15 bg-nacht-800/80 hover:border-gold-300/60'
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-400 font-serif text-2xl font-bold text-nacht-900">
                {BUCHSTABEN[i]}
              </span>
              <span>{text}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-1 min-h-[3rem] text-center text-lg" aria-live="polite">
        {gewaehlt !== null ? (
          z.gespeichert ? (
            <p className="font-semibold text-richtig">✓ Antwort gespeichert</p>
          ) : (
            <p className="text-gold-200">Antwort wird gesendet …</p>
          )
        ) : vorbei ? (
          <p className="text-gold-200">Die Zeit ist um.</p>
        ) : null}
      </div>
    </section>
  );
}

function Fortschritt({ feld }: { feld: number }) {
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-sm text-gold-200">
        <span>Nazareth</span>
        <span>Krippe</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gold-400 transition-all duration-700" style={{ width: `${(feld / ZIEL_FELD) * 100}%` }} />
      </div>
    </div>
  );
}

function Aufloesung({ z }: { z: SpielerZustand }) {
  const a = z.aufloesung;
  if (!a) return null;
  const zug = a.zuege[z.id];
  const platz = a.plaetze[z.id];
  let titel = 'Keine Antwort';
  let farbe = 'text-gold-200';
  if (zug?.r) {
    titel = 'Richtig!';
    farbe = 'text-richtig';
  } else if (zug?.a) {
    titel = 'Leider falsch';
    farbe = 'text-falsch';
  }
  return (
    <Mitte>
      <h2 className={`text-5xl font-bold ${farbe}`}>{titel}</h2>
      {zug && (
        <p className="text-2xl">
          {zug.s > 0 ? (
            <>
              <span className="font-bold text-gold-300">+{zug.s} Felder</span>
              {zug.s === PUNKTE_SCHNELL && ' – schnell!'}
            </>
          ) : (
            'Du bleibst stehen.'
          )}
        </p>
      )}
      {zug?.b && <p className="text-base text-gold-200">Wegen der Volkszählung gab es diesmal keinen Schnelligkeitsbonus.</p>}
      {zug?.e && (
        <div className="card flex items-center gap-4 px-4 py-3 text-left">
          <svg viewBox="-16 -16 32 32" className="h-10 w-10 shrink-0">
            <EreignisSymbol art={zug.e} />
          </svg>
          <p className="text-lg leading-snug">
            <span className="font-semibold">{EREIGNIS_INFO[zug.e].titel}</span>
            <br />
            {EREIGNIS_INFO[zug.e].wirkung}
          </p>
        </div>
      )}
      <div className="card w-full p-4 text-left">
        <p className="text-sm uppercase tracking-[0.2em] text-gold-300">Richtige Antwort</p>
        <p className="mt-1 text-lg font-semibold">
          {BUCHSTABEN[a.richtig]} – {a.richtigText}
        </p>
        <p className="mt-1 font-serif text-lg font-bold text-gold-300">{a.stelle}</p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <p className="text-xl">
          Feld <span className="font-bold text-gold-300">{z.feld}</span> von {ZIEL_FELD} · {gebietName(z.feld)}
        </p>
        <Fortschritt feld={z.feld} />
        {platz && (
          <p className="text-lg">
            Platz <span className="font-bold">{platz}</span> von {a.anzahl}
          </p>
        )}
      </div>
      <p className="text-base text-white/80">{a.letzteFrage ? 'Gleich kommt die Siegerehrung.' : 'Gleich kommt die nächste Frage.'}</p>
    </Mitte>
  );
}

function Ende({ z }: { z: SpielerZustand }) {
  const e = z.ende;
  if (!e) return null;
  const platz = e.plaetze[z.id];
  return (
    <Mitte>
      {z.figur && <Token figur={z.figur} groesse={6} />}
      {platz ? (
        <>
          <p className="text-lg uppercase tracking-[0.25em] text-gold-300">Dein Platz</p>
          <h2 className={`font-serif text-8xl font-bold leading-none ${platz <= 3 ? 'text-gold-300' : 'text-white'}`}>{platz}.</h2>
          <p className="text-lg">von {e.anzahl} Figuren</p>
        </>
      ) : (
        <h2 className="text-4xl font-bold">Spiel beendet</h2>
      )}
      <p className="text-xl">
        {z.feld >= ZIEL_FELD ? 'Du hast die Krippe erreicht!' : `Du bist bis Feld ${z.feld} gekommen.`}
      </p>
      <Fortschritt feld={z.feld} />
      <p className="mt-2 text-xl text-gold-200">Frohe Weihnachten!</p>
      <Fuss />
    </Mitte>
  );
}

function Abgelehnt({ z }: { z: SpielerZustand }) {
  return (
    <Mitte>
      {z.grund === 'voll' ? (
        <>
          <h2 className="text-3xl font-bold text-gold-200">Der Raum ist voll</h2>
          <p className="text-lg">
            In diesem Raum sind schon 35 Figuren. Tut euch zu Gruppen zusammen und spielt gemeinsam auf einem Handy mit.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-3xl font-bold text-gold-200">Du bist nicht mehr im Spiel</h2>
          <p className="text-lg">Die Spielleitung hat deine Figur aus dem Raum entfernt.</p>
        </>
      )}
      <button className="btn-ghost w-full" onClick={() => navigate('/')}>
        Zur Startseite
      </button>
    </Mitte>
  );
}
