# Der Weg zur Krippe

Ein kurzes Multiplayer-Weihnachtsquiz für die Morgenbesinnung am Peter-Breuer-Gymnasium
(Adventskalender der SMV, Türchen 16 · 16. Dezember 2026).

Die Lehrkraft öffnet am Smartboard einen Spielraum. Die Schülerinnen und Schüler treten per QR-Code
mit dem Handy bei, beantworten Fragen zur biblischen Weihnachtsgeschichte und zu Weihnachten in
aller Welt und ziehen mit jeder
richtigen Antwort auf einem Spielbrett von Nazareth Richtung Krippe in Bethlehem.

- **Kein Login, keine Namen, keine personenbezogenen Daten.** Jede Figur bekommt automatisch einen
  Namen wie „Hirte 7“ oder „Engel 12“.
- **Eine Runde dauert 5–7 Minuten** (höchstens 12 Fragen à 20 Sekunden).
- **Läuft im Browser** – am Smartboard und auf (auch älteren) Handys, über WLAN oder mobile Daten.

---

## Inhalt

1. [Zum Ausprobieren auf dem eigenen Rechner](#1-zum-ausprobieren-auf-dem-eigenen-rechner)
2. [Supabase einrichten (Schulrangliste + Echtzeit als Rückfall)](#2-supabase-einrichten)
2b. [Cloudflare einrichten (empfohlen: keine Obergrenze an Klassen)](#2b-cloudflare-einrichten)
3. [Code zu GitHub hochladen](#3-code-zu-github-hochladen)
4. [Auf Netlify veröffentlichen](#4-auf-netlify-veröffentlichen)
5. [Vor dem 16. Dezember: Checkliste](#5-vor-dem-16-dezember-checkliste)
6. [Wie viele Klassen können gleichzeitig spielen?](#6-wie-viele-klassen-können-gleichzeitig-spielen)
7. [Fragen bearbeiten](#7-fragen-bearbeiten)
8. [Spielregeln](#8-spielregeln)
9. [Datenschutz](#9-datenschutz)
10. [Technik-Überblick](#10-technik-überblick)

---

## 1. Zum Ausprobieren auf dem eigenen Rechner

Du brauchst [Node.js](https://nodejs.org) (Version 20 oder neuer).

```bash
npm install
npm run dev
```

Dann im Browser `http://localhost:5173` öffnen.

**Ohne Supabase** läuft das Spiel im *lokalen Testmodus*: Host und Spieler „reden“ nur zwischen
Tabs im selben Browser. Das reicht zum Ausprobieren:

1. Tab 1: `http://localhost:5173/host?bots=30` → „Raum erstellen“ (30 simulierte Spieler treten bei).
2. Tab 2: `http://localhost:5173/join/CODE` (CODE durch den angezeigten Raumcode ersetzen) – das ist
   deine eigene Figur.
3. In Tab 1 „Spiel starten“.

Mehrere Test-Spieler im selben Browser teilen sich eine Figur – für weitere Spieler ein privates
Fenster oder einen anderen Browser nehmen (oder gleich `?bots=30`).

`?bots=30` funktioniert auch später auf der echten Seite – so kannst du das Spiel ohne Klasse testen.
Im Testmodus mit nur Bots wird nichts in die Schulrangliste eingetragen.

Tests der Spiellogik: `npm test`

---

## 2. Supabase einrichten

Supabase übernimmt die Echtzeit-Verbindung zwischen Smartboard und Handys (und speichert die
Schulrangliste). Der kostenlose Tarif reicht.

### 2.1 Projekt anlegen

1. Auf [supabase.com](https://supabase.com) ein kostenloses Konto anlegen (am besten mit einer
   SMV-Adresse, damit es nicht an einer Person hängt).
2. **New project** klicken.
   - **Name:** z. B. `krippe-pbg`
   - **Database Password:** irgendein langes Passwort (wird für das Spiel nicht gebraucht, aber gut
     aufbewahren).
   - **Region:** `Central EU (Frankfurt)` – wegen Datenschutz bitte eine EU-Region wählen.
3. Ein, zwei Minuten warten, bis das Projekt fertig ist.

### 2.2 Adresse und Schlüssel kopieren

Oben im Projekt auf **Connect** klicken (oder links **Project Settings → API Keys** bzw. **Data API**).
Du brauchst zwei Werte:

| Name im Spiel | Wo in Supabase | Beispiel |
|---|---|---|
| `VITE_SUPABASE_URL` | Project URL | `https://abcdefgh.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **publishable** key (`sb_publishable_…`) | `sb_publishable_abc…` |

Supabase zeigt dir unter „Connect“ Anleitungen für verschiedene Frameworks (Next.js usw.) – die brauchst
du nicht, nur diese zwei Werte. Statt `VITE_SUPABASE_PUBLISHABLE_KEY` funktioniert auch der ältere Name
`VITE_SUPABASE_ANON_KEY` mit dem alten „anon“-Schlüssel (`eyJ…`).

> ⚠️ **Niemals** den `secret`- bzw. `service_role`-Schlüssel verwenden. Der publishable key ist
> dafür gedacht, im Browser zu stehen – geschützt wird die Datenbank durch die Regeln aus 2.4.
> „Mit Claude verbinden“ (MCP) ist für das Spiel nicht nötig.

### 2.3 Realtime erlauben

Links **Realtime → Settings**. Falls es dort eine Einstellung wie *„Allow public access“* gibt,
muss sie **eingeschaltet** sein (das Spiel nutzt öffentliche Broadcast-Kanäle ohne Anmeldung).
Steht dort nichts dergleichen, ist nichts zu tun.

### 2.4 Tabelle für die Schulrangliste anlegen (optional, aber empfohlen)

1. Links **SQL Editor → New query**.
2. Den kompletten Inhalt der Datei [`supabase/klassenwertung.sql`](supabase/klassenwertung.sql)
   hineinkopieren.
3. **Run** klicken. Es sollte „Success. No rows returned“ erscheinen.

Damit gibt es eine Tabelle `klassenwertung`, in die das Spiel nach jedem **Klassenspiel** Klasse +
Anteil richtiger Antworten einträgt (ein **Freies Spiel** wird nie eingetragen). Dank *Row Level
Security* darf jeder nur **lesen und eintragen**, aber nichts ändern oder löschen.

**Rangliste zurücksetzen** (z. B. nach euren Tests) geht deshalb nur im Supabase-Dashboard:

- Alles löschen: **SQL Editor → New query**, die Datei
  [`supabase/rangliste-zuruecksetzen.sql`](supabase/rangliste-zuruecksetzen.sql) einfügen, **Run**.
- Einzelne Einträge: **Table Editor → klassenwertung**, Zeilen anhaken → **Delete**.

Tipp: Zum Testen am besten „Freies Spiel“ wählen – dann landet gar nichts in der Rangliste.

### 2.5 Lokal mit Supabase testen (optional)

Datei `.env.example` kopieren und in `.env.local` umbenennen, die beiden Werte eintragen, dann
`npm run dev` neu starten. `.env.local` wird **nicht** zu GitHub hochgeladen (steht in `.gitignore`).

---

## 2b. Cloudflare einrichten

Mit Supabase allein können nur etwa 15 Klassen **gleichzeitig** spielen (siehe Abschnitt 6). Mit dem
eigenen kleinen Raum-Server auf **Cloudflare** gibt es diese Grenze nicht – ebenfalls kostenlos.
Jeder Spielraum bekommt dort seinen eigenen Mini-Server („Durable Object“), die Räume nehmen sich
gegenseitig also nichts weg. Supabase bleibt trotzdem für die **Schulrangliste** und als **Rückfall**
im Einsatz.

### 2b.1 Konto anlegen

Auf [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) kostenlos registrieren und die
E-Mail bestätigen. Der kostenlose Tarif („Free“) reicht.

### 2b.2 Raum-Server hochladen (einmalig, im Terminal)

Im Projektordner nacheinander ausführen:

```bash
cd worker
npm install
npx wrangler login
npx wrangler deploy
```

- `wrangler login` öffnet den Browser: bei Cloudflare anmelden und **Allow** klicken.
- Beim ersten `deploy` fragt Cloudflare eventuell nach einem Namen für deine
  `workers.dev`-Subdomain (z. B. `smv-pbg`) – eintippen, Enter.
- Am Ende steht eine Adresse wie `https://krippe-raum.smv-pbg.workers.dev`. **Die brauchst du gleich.**
- Test: Adresse im Browser öffnen → dort steht „Der Weg zur Krippe – Raum-Server läuft.“

Der Raum-Server ändert sich praktisch nie. Nur wenn sich etwas im Ordner `worker/` ändert, muss
`npx wrangler deploy` noch einmal ausgeführt werden – ein `git push` allein reicht dafür nicht.

### 2b.3 Bei Netlify eintragen

Bei Netlify die Variable **`VITE_CLOUDFLARE_URL`** = die Adresse von oben anlegen und neu bauen
lassen (siehe Abschnitt 4). Danach steht auf `…/host` unter dem Button **„Verbindung über Cloudflare“**.

### 2b.4 Rückfall auf Supabase

Falls Cloudflare einmal Probleme macht: bei Netlify zusätzlich die Variable **`VITE_ECHTZEIT`** =
`supabase` anlegen und neu bauen lassen. Auf `…/host` steht dann „Verbindung über Supabase“.
Zurück zu Cloudflare: Variable löschen und neu bauen. Räume, die beim Umschalten gerade laufen,
müssen danach neu erstellt werden.

### 2b.5 Was der kostenlose Tarif hergibt

- **Keine Grenze für gleichzeitige Verbindungen** – jeder Raum hat seinen eigenen Mini-Server.
- **100.000 Anfragen pro Tag.** Eine Verbindung öffnen zählt als 1 Anfrage, ankommende Nachrichten
  zählen nur zu 1/20, ausgehende gar nicht.
- **13.000 GB-s Rechenzeit pro Tag** – reicht geschätzt für 150–200 Spiele pro Tag.
- Die Kontingente werden jede Nacht um 1 Uhr (deutsche Winterzeit) zurückgesetzt.

Der Raum-Server kennt keine Spielregeln, er leitet nur Nachrichten weiter. Schutz vor Unfug:
höchstens 80 Verbindungen pro Raum, eine Bremse gegen Nachrichten-Spam, und nur der Browser, der
einen Raum erstellt hat, darf ihn als Spielleitung steuern.

### 2b.6 Lokal mit Cloudflare testen (optional)

Im Ordner `worker` `npm run dev` starten (läuft dann auf `http://127.0.0.1:8787`) und in `.env.local`
die Zeile `VITE_CLOUDFLARE_URL=ws://127.0.0.1:8787` ergänzen, dann im Hauptordner `npm run dev`.

---

## 3. Code zu GitHub hochladen

1. Auf [github.com](https://github.com) ein neues, leeres Repository anlegen, z. B. `manger-race-game`
   (ohne README, ohne .gitignore – die gibt es schon).
2. Im Projektordner im Terminal:

```bash
git remote add origin https://github.com/DEIN-NAME/manger-race-game.git
```

```bash
git push -u origin main
```

---

## 4. Auf Netlify veröffentlichen

1. Auf [netlify.com](https://www.netlify.com) mit dem GitHub-Konto anmelden.
2. **Add new site → Import an existing project → GitHub** und das Repository auswählen.
3. Die Build-Einstellungen füllt Netlify automatisch aus der Datei `netlify.toml` aus
   (Build command `npm run build`, Publish directory `dist`). Nichts ändern.
4. **Bevor** du auf Deploy klickst – oder danach unter
   **Site configuration → Environment variables → Add a variable** – die beiden Variablen eintragen:
   - `VITE_SUPABASE_URL` = deine Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = dein publishable key (`sb_publishable_…`)
   - `VITE_CLOUDFLARE_URL` = die Adresse deines Raum-Servers (siehe 2b, empfohlen)
5. **Deploy** klicken. Nach ca. einer Minute ist die Seite online.
6. Wichtig: Wenn du die Variablen **nach** dem ersten Deploy einträgst oder änderst, musst du neu
   bauen lassen: **Deploys → Trigger deploy → Clear cache and deploy site**.
   (Die Werte werden beim Bauen in die Seite eingesetzt.)
7. Schöner Name: **Site configuration → Change site name**, z. B. `krippe-pbg` → die Seite heißt
   dann `https://krippe-pbg.netlify.app`.

**Erkennen, ob es geklappt hat:** Auf der Seite `…/host` steht unter dem Button
**„Verbindung über Cloudflare“** (oder „über Supabase“, wenn keine Cloudflare-Adresse eingetragen
ist) – und **kein** Hinweis „Lokaler Testmodus“. Wenn doch, fehlen die Variablen oder es wurde nicht
neu gebaut.

Jeder neue `git push` auf `main` veröffentlicht automatisch eine neue Version.

---

## 5. Vor dem 16. Dezember: Checkliste

- [ ] **Supabase-Projekt wach halten:** Kostenlose Projekte werden nach etwa einer Woche ohne Nutzung
      pausiert. Dagegen hilft der automatische GitHub-Job (siehe unten). Am **15.12.** trotzdem
      einmal im Supabase-Dashboard nachsehen; falls das Projekt pausiert ist, **Restore project**
      klicken (dauert ein paar Minuten).
- [ ] Auf `…/host` steht „Verbindung über Cloudflare“ (siehe 2b).
- [ ] **Generalprobe am 15.12.:** Auf der echten Seite `…/host?bots=30` einen Raum erstellen und mit
      zwei, drei echten Handys (eins im WLAN, eins mit mobilen Daten) beitreten und eine Runde spielen.
- [ ] Zwei Räume gleichzeitig ausprobieren (zwei Rechner/Browser), um zu sehen, dass sie sich nicht stören.
- [ ] Die Fragen mit `// PRÜFEN` in `src/data/fragen.ts` kontrollieren und die weltlichen Fragen in
      `src/data/fragenWelt.ts` einmal durchlesen.
- [ ] Testeinträge aus der Rangliste löschen (siehe 2.4).
- [ ] Link und Anleitung für die Lehrkräfte verschicken (siehe [`LEHRKRAEFTE.md`](LEHRKRAEFTE.md)).

### Supabase automatisch wach halten (GitHub Actions)

Im Repo liegt [`.github/workflows/supabase-wachhalten.yml`](.github/workflows/supabase-wachhalten.yml).
Der Job fragt **montags und donnerstags** einmal die Ranglisten-Tabelle ab – das zählt für Supabase
als Aktivität, das Projekt schläft also nicht ein. Kostenlos, keine Daten werden verändert.

Einmalig einrichten:

1. Auf GitHub im Repo **Settings → Secrets and variables → Actions → New repository secret**.
2. Name `SUPABASE_URL`, Wert: deine Supabase-Adresse (`https://….supabase.co`) → **Add secret**.
3. Noch einmal **New repository secret**: Name `SUPABASE_PUBLISHABLE_KEY`, Wert: der
   `sb_publishable_…`-Schlüssel (derselbe wie bei Netlify – **nicht** der secret-Schlüssel).
4. Reiter **Actions** → links **Supabase wach halten** → **Run workflow** → **Run workflow**.
   Nach ca. 20 Sekunden sollte ein grüner Haken erscheinen.

Gut zu wissen:

- Wird der Job rot, bekommst du von GitHub eine E-Mail. Meist heißt das: Secret falsch geschrieben
  oder das Projekt ist schon pausiert (dann im Dashboard **Restore project**).
- GitHub schaltet geplante Jobs ab, wenn im Repo **60 Tage** lang nichts passiert ist. Bis
  Weihnachten ist das kein Thema; danach wieder einschalten unter **Actions → Supabase wach halten →
  Enable workflow**, falls ihr das Spiel nächstes Jahr wieder nutzt.

---

## 6. Wie viele Klassen können gleichzeitig spielen?

**Mit Cloudflare (Abschnitt 2b): praktisch beliebig viele.** Jeder Raum hat seinen eigenen
Mini-Server. Begrenzt ist nur, wie viel an einem Tag gespielt wird – geschätzt 150–200 Spiele pro Tag
im kostenlosen Tarif. Ob jede/r ein eigenes Handy nimmt oder eine Gruppe eins teilt, ist dann egal
(höchstens 35 Figuren pro Raum). Die Zahlen sind gerechnet, nicht unter Volllast getestet.

**Nur mit Supabase** (ohne Cloudflare oder im Rückfall-Modus): Der **kostenlose** Supabase-Tarif
erlaubt **200 gleichzeitige Verbindungen** und **100 Nachrichten pro Sekunde** für das ganze Projekt.
Jedes Handy und jedes Smartboard ist eine Verbindung.

| Spielweise | Geräte pro Klasse | Klassen gleichzeitig (ca.) |
|---|---|---|
| Jede/r mit eigenem Handy | ~30 | **5–6** |
| **Ein Handy pro Gruppe (3–4 Personen)** – empfohlen | ~8–10 | **15–18** |

Der **Gruppenmodus** steht als Vorschlag in der Lobby und in der Anleitung: Die Klasse bildet
Tischgruppen, jede Gruppe spielt mit einem Handy. Das spart Verbindungen und passt gut zur Besinnung,
weil man gemeinsam überlegt.

Weitere Möglichkeiten im Supabase-Modus, ohne Geld auszugeben:

- **Zeitlich staffeln:** Nicht alle Klassen müssen in derselben Minute spielen. Über die
  **Schulrangliste** (`/rangliste`) werden die Klassen trotzdem verglichen – gewertet wird der Anteil
  richtiger Antworten, das ist unabhängig von der Anzahl der Handys.
- Das Spiel ist sparsam gebaut: keine Sekunden-Ticks übers Netz, Antworten gehen nur an die
  Spielleitung, nicht an alle Handys. Pro Raum sind das im Schnitt nur etwa 5 Nachrichten pro Sekunde.

Wenn ein Limit doch einmal erreicht wird, verbindet sich das Spiel nach kurzer Zeit selbst neu;
am Handy steht dann „Verbindung weg – verbinde neu …“.

---

## 7. Fragen bearbeiten

Es gibt zwei Fragendateien:

- [`src/data/fragen.ts`](src/data/fragen.ts): 40 Fragen zur biblischen Weihnachtsgeschichte
- [`src/data/fragenWelt.ts`](src/data/fragenWelt.ts): über 80 weltliche Fragen (Weihnachtsmann & Co.,
  Bräuche und Weihnachtsmärkte, Weihnachten weltweit, Lieder, Filme, Bücher, Geschichte). Bei diesen
  Fragen steht in `stelle` statt einer Bibelstelle das Thema, z. B. `'Weihnachten weltweit · Japan'`.

Jede Frage hat:

```ts
{
  frage: 'Welcher Kaiser ordnete die Volkszählung an?',
  antworten: ['Augustus', 'Tiberius', 'Nero', 'Claudius'], // richtige Antwort steht vorne
  richtig: 0,                                              // Index der richtigen Antwort
  stelle: 'Lk 2,1',                                        // Lutherbibel 2017
  erklaerung: 'Ein Satz in eigenen Worten.',
  kategorie: 'Hintergrund',
}
```

- Die richtige Antwort steht in der Datei zur leichteren Kontrolle immer vorne – im Spiel werden
  Fragen **und** Antworten jedes Mal zufällig gemischt.
- Beim Erstellen des Raums wählt man **Gemischt** (Standard: Bibel- und Weltfragen immer
  abwechselnd, also 50:50), **Weihnachtsgeschichte** oder **Weihnachten weltweit**.
- Pro Spiel werden höchstens 12 Fragen gezogen. Das Smartboard merkt sich, welche Fragen zuletzt
  dran waren, und nimmt beim nächsten Spiel bevorzugt andere.
- Neue Fragen einfach in eine der beiden Dateien schreiben – mehr Fragen sind kein Problem.
- Fragen mit dem Kommentar `// PRÜFEN` bitte vor dem Einsatz kontrollieren.
- Nach Änderungen `npm test` ausführen – der Test prüft u. a., dass alle Fragen vollständig sind und
  keine Frage doppelt vorkommt.

---

## 8. Spielregeln

- 20 Felder von Nazareth (Start) über Wüste, Hügel bei Bethlehem, Hirtenfeld und Herberge bis zur
  Krippe (Feld 20).
- 20 Sekunden pro Frage. **Richtig: +2 Felder. Richtig und schnell** (in den ersten ~7 Sekunden):
  **+3 Felder.** Falsch oder keine Antwort: 0. Haben alle geantwortet, geht es sofort weiter.
- Ereignisfelder (wirken nur, wenn man nach einem Zug darauf landet, ohne Kettenreaktion):
  - ★ *Der Stern zeigt den Weg:* 2 Felder vor
  - Engel *Ein Engel erscheint:* 1 Feld vor
  - Haus *Die Herberge ist voll:* 2 Felder zurück
  - Liste *Volkszählung – alle stehen Schlange:* in der nächsten Runde kein Schnelligkeitsbonus
- Sobald jemand die Krippe erreicht, endet das Spiel nach dieser Frage – sonst nach 12 Fragen.
- Sieger ist, wer am weitesten gekommen ist; bei Gleichstand gewinnt die kürzere Gesamtantwortzeit
  (eine fehlende Antwort zählt die vollen 20 Sekunden).
- Wer später kommt, kann noch beitreten und startet in Nazareth.
- Der Host kann Figuren in der Lobby entfernen (× neben der Figur).
- Lädt das Smartboard versehentlich neu, kann das Spiel unter `/host` fortgesetzt werden.
  Lädt ein Handy neu, steigt es mit derselben Figur wieder ein.

---

## 9. Datenschutz

- Keine Anmeldung, keine Namen, keine E-Mail-Adressen. Figurennamen werden zufällig vergeben,
  freie Texteingaben gibt es für Schülerinnen und Schüler nicht.
- Im Handy wird nur eine zufällige Kennung gespeichert (localStorage), damit man nach dem Neuladen
  mit derselben Figur weiterspielt.
- Der Spielstand liegt nur im Browser des Smartboards; über Supabase laufen nur kurze Nachrichten
  (Frage, Antwort-Nummer, Spielstand). Es wird nichts davon gespeichert.
- In der Schulrangliste werden nur Klassenname, Anteil richtiger Antworten, Anzahl Figuren und
  Fragen gespeichert.
- Schriften und QR-Code werden lokal ausgeliefert bzw. im Browser erzeugt – keine Google Fonts,
  kein externer QR-Dienst.
- Supabase-Projekt in einer EU-Region (Frankfurt) anlegen.

---

## 10. Technik-Überblick

- **Vite + React + TypeScript**, Styling mit **Tailwind CSS 3.4** (Version 3, weil Version 4 auf
  älteren Handys/Smartboard-Browsern nicht läuft).
- **Netlify** hostet nur die statische Seite (`netlify.toml` enthält den Build-Befehl und die
  Weiterleitung, damit Links wie `/join/ABCD` funktionieren).
- **Echtzeit** wahlweise über den eigenen **Cloudflare-Raum-Server** (Ordner `worker/`, ein Durable
  Object pro Raum, WebSockets mit Hibernation) oder über **Supabase Realtime (Broadcast)**.
  In beiden Fällen ist der **Host-Browser die Spielleitung**: Er hält den Spielstand, wertet Antworten
  aus (es zählt der Eingang beim Host) und schickt den Stand an alle. Der Server leitet nur weiter.
- **Supabase** außerdem für die Schulrangliste (eine Tabelle, nur lesen und eintragen erlaubt).

| Datei/Ordner | Inhalt |
|---|---|
| `src/data/fragen.ts`, `src/data/fragenWelt.ts` | Bibelfragen und weltliche Fragen |
| `src/game/` | Spielregeln (reine Logik, mit Tests in `engine.test.ts`) |
| `src/net/` | Echtzeit: Cloudflare, Supabase-Broadcast und lokaler Testmodus, Nachrichtenformat |
| `worker/` | Raum-Server für Cloudflare (`src/index.ts`, Konfiguration in `wrangler.jsonc`) |
| `src/host/` | Spielleitung (Smartboard): Steuerung, Bots, Ansichten |
| `src/player/`, `src/pages/PlayerPage.tsx` | Handy-Ansicht |
| `src/components/Board.tsx` | das selbst gezeichnete Spielbrett (SVG) |
| `src/lib/klassenwertung.ts`, `src/pages/RanglistePage.tsx` | Schulrangliste |
| `supabase/klassenwertung.sql` | Tabelle + Sicherheitsregeln für die Rangliste |
| `supabase/rangliste-zuruecksetzen.sql` | Rangliste leeren (nur im Supabase-Dashboard) |
| `.github/workflows/supabase-wachhalten.yml` | hält das Supabase-Projekt wach (GitHub Actions) |

**Cloudflare:** pro Gerät eine WebSocket-Verbindung zu `…/raum/ABCD` (Spielleitung mit geheimem
Raumschlüssel, Handys mit ihrer zufälligen ID). Der Server schickt Nachrichten der Handys nur an die
Spielleitung und Nachrichten der Spielleitung an alle bzw. an ein einzelnes Handy.

**Supabase – Kanäle pro Raum** (z. B. Raum `ABCD`):

- `krippe:ABCD` – Spielleitung → alle Handys (nur bei Phasenwechseln: Frage, Auflösung, Ende)
- `krippe:ABCD:host` – Handys → Spielleitung (per REST, Handys hören hier nicht mit)
- `krippe:ABCD:p:<id>` – Spielleitung → ein einzelnes Handy (Willkommen, „Antwort gespeichert“)

Räume sind über den Code vollständig voneinander getrennt.

Ein Spiel der SMV des PBG.
