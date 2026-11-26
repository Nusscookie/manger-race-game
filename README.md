# Der Weg zur Krippe

Ein kurzes Multiplayer-Weihnachtsquiz für die Morgenbesinnung am Peter-Breuer-Gymnasium
(Adventskalender der SMV, Türchen 16 · 16. Dezember 2026).

Die Lehrkraft öffnet am Smartboard einen Spielraum. Die Schülerinnen und Schüler treten per QR-Code
mit dem Handy bei, beantworten Fragen zur biblischen Weihnachtsgeschichte und ziehen mit jeder
richtigen Antwort auf einem Spielbrett von Nazareth Richtung Krippe in Bethlehem.

- **Kein Login, keine Namen, keine personenbezogenen Daten.** Jede Figur bekommt automatisch einen
  Namen wie „Hirte 7“ oder „Engel 12“.
- **Eine Runde dauert 5–7 Minuten** (höchstens 12 Fragen à 20 Sekunden).
- **Läuft im Browser** – am Smartboard und auf (auch älteren) Handys, über WLAN oder mobile Daten.

---

## Inhalt

1. [Zum Ausprobieren auf dem eigenen Rechner](#1-zum-ausprobieren-auf-dem-eigenen-rechner)
2. [Supabase einrichten (Echtzeit + Schulrangliste)](#2-supabase-einrichten)
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
| `VITE_SUPABASE_ANON_KEY` | **anon / public** key – oder der neue **publishable** key (`sb_publishable_…`) | `eyJhbGciOi…` |

> ⚠️ **Niemals** den `service_role`- bzw. `secret`-Schlüssel verwenden. Der anon/publishable key ist
> dafür gedacht, im Browser zu stehen – geschützt wird die Datenbank durch die Regeln aus 2.4.

### 2.3 Realtime erlauben

Links **Realtime → Settings**. Falls es dort eine Einstellung wie *„Allow public access“* gibt,
muss sie **eingeschaltet** sein (das Spiel nutzt öffentliche Broadcast-Kanäle ohne Anmeldung).
Steht dort nichts dergleichen, ist nichts zu tun.

### 2.4 Tabelle für die Schulrangliste anlegen (optional, aber empfohlen)

1. Links **SQL Editor → New query**.
2. Den kompletten Inhalt der Datei [`supabase/klassenwertung.sql`](supabase/klassenwertung.sql)
   hineinkopieren.
3. **Run** klicken. Es sollte „Success. No rows returned“ erscheinen.

Damit gibt es eine Tabelle `klassenwertung`, in die das Spiel nach jeder Runde Klasse + Anteil
richtiger Antworten einträgt. Dank *Row Level Security* darf jeder nur **lesen und eintragen**,
aber nichts ändern oder löschen. Einträge löschen kannst nur du im Supabase-Dashboard
(**Table Editor → klassenwertung**), z. B. wenn jemand Unsinn eingetragen hat.

### 2.5 Lokal mit Supabase testen (optional)

Datei `.env.example` kopieren und in `.env.local` umbenennen, die beiden Werte eintragen, dann
`npm run dev` neu starten. `.env.local` wird **nicht** zu GitHub hochgeladen (steht in `.gitignore`).

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
   - `VITE_SUPABASE_ANON_KEY` = dein anon/publishable key
5. **Deploy** klicken. Nach ca. einer Minute ist die Seite online.
6. Wichtig: Wenn du die Variablen **nach** dem ersten Deploy einträgst oder änderst, musst du neu
   bauen lassen: **Deploys → Trigger deploy → Clear cache and deploy site**.
   (Die Werte werden beim Bauen in die Seite eingesetzt.)
7. Schöner Name: **Site configuration → Change site name**, z. B. `krippe-pbg` → die Seite heißt
   dann `https://krippe-pbg.netlify.app`.

**Erkennen, ob es geklappt hat:** Auf der Seite `…/host` steht beim Erstellen eines Raums **kein**
Hinweis „Lokaler Testmodus“ mehr. Wenn doch, fehlen die Variablen oder es wurde nicht neu gebaut.

Jeder neue `git push` auf `main` veröffentlicht automatisch eine neue Version.

---

## 5. Vor dem 16. Dezember: Checkliste

- [ ] **Supabase-Projekt aufwecken:** Kostenlose Projekte werden nach etwa einer Woche ohne Nutzung
      pausiert. Am **15.12.** im Supabase-Dashboard einloggen; falls das Projekt pausiert ist,
      **Restore project** klicken (dauert ein paar Minuten).
- [ ] **Generalprobe am 15.12.:** Auf der echten Seite `…/host?bots=30` einen Raum erstellen und mit
      zwei, drei echten Handys (eins im WLAN, eins mit mobilen Daten) beitreten und eine Runde spielen.
- [ ] Zwei Räume gleichzeitig ausprobieren (zwei Rechner/Browser), um zu sehen, dass sie sich nicht stören.
- [ ] Die Fragen mit `// PRÜFEN` in `src/data/fragen.ts` kontrollieren.
- [ ] Link und Anleitung für die Lehrkräfte verschicken (siehe [`LEHRKRAEFTE.md`](LEHRKRAEFTE.md)).

---

## 6. Wie viele Klassen können gleichzeitig spielen?

Der **kostenlose** Supabase-Tarif erlaubt **200 gleichzeitige Verbindungen** und **100 Nachrichten
pro Sekunde** für das ganze Projekt. Jedes Handy und jedes Smartboard ist eine Verbindung.

| Spielweise | Geräte pro Klasse | Klassen gleichzeitig (ca.) |
|---|---|---|
| Jede/r mit eigenem Handy | ~30 | **5–6** |
| **Ein Handy pro Gruppe (3–4 Personen)** – empfohlen | ~8–10 | **15–18** |

Deshalb ist der **Gruppenmodus** der Standard (steht auch so in der Lobby und in der Anleitung):
Die Klasse bildet Tischgruppen, jede Gruppe spielt mit einem Handy. Das spart Verbindungen und passt
gut zur Besinnung, weil man gemeinsam überlegt.

Weitere Möglichkeiten, ohne Geld auszugeben:

- **Zeitlich staffeln:** Nicht alle Klassen müssen in derselben Minute spielen. Über die
  **Schulrangliste** (`/rangliste`) werden die Klassen trotzdem verglichen – gewertet wird der Anteil
  richtiger Antworten, das ist unabhängig von der Anzahl der Handys.
- Das Spiel ist sparsam gebaut: keine Sekunden-Ticks übers Netz, Antworten gehen nur an die
  Spielleitung, nicht an alle Handys. Pro Raum sind das im Schnitt nur etwa 5 Nachrichten pro Sekunde.

Wenn ein Limit doch einmal erreicht wird, verbindet sich das Spiel nach kurzer Zeit selbst neu;
am Handy steht dann „Verbindung weg – verbinde neu …“.

---

## 7. Fragen bearbeiten

Alle Fragen stehen in [`src/data/fragen.ts`](src/data/fragen.ts). Jede Frage hat:

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
- Pro Spiel werden 12 der 40 Fragen gezogen.
- Fragen mit dem Kommentar `// PRÜFEN` bitte vor dem Einsatz kontrollieren.
- Nach Änderungen `npm test` ausführen – der Test prüft u. a., dass es 40 vollständige Fragen ohne
  doppelte Antworten gibt.

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
- **Supabase Realtime (Broadcast)** für die Echtzeit. Der **Host-Browser ist die Spielleitung**:
  Er hält den Spielstand, wertet Antworten aus (es zählt der Eingang beim Host) und schickt den Stand
  an alle. Eine Datenbank braucht nur die Schulrangliste.

| Datei/Ordner | Inhalt |
|---|---|
| `src/data/fragen.ts` | die 40 Fragen |
| `src/game/` | Spielregeln (reine Logik, mit Tests in `engine.test.ts`) |
| `src/net/` | Echtzeit: Supabase-Broadcast und lokaler Testmodus, Nachrichtenformat |
| `src/host/` | Spielleitung (Smartboard): Steuerung, Bots, Ansichten |
| `src/player/`, `src/pages/PlayerPage.tsx` | Handy-Ansicht |
| `src/components/Board.tsx` | das selbst gezeichnete Spielbrett (SVG) |
| `src/lib/klassenwertung.ts`, `src/pages/RanglistePage.tsx` | Schulrangliste |
| `supabase/klassenwertung.sql` | Tabelle + Sicherheitsregeln für die Rangliste |

**Kanäle pro Raum** (z. B. Raum `ABCD`):

- `krippe:ABCD` – Spielleitung → alle Handys (nur bei Phasenwechseln: Frage, Auflösung, Ende)
- `krippe:ABCD:host` – Handys → Spielleitung (per REST, Handys hören hier nicht mit)
- `krippe:ABCD:p:<id>` – Spielleitung → ein einzelnes Handy (Willkommen, „Antwort gespeichert“)

Räume sind über den Code vollständig voneinander getrennt.

Ein Spiel der SMV des PBG.
