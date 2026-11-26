-- Schulrangliste für „Der Weg zur Krippe“
-- In Supabase: SQL Editor → New query → diesen Text einfügen → Run.
-- Gespeichert werden nur Klassenname, Anteil richtiger Antworten und Anzahlen –
-- keine Namen, keine Geräte-Daten, keine personenbezogenen Daten.

create table if not exists public.klassenwertung (
  id bigint generated always as identity primary key,
  erstellt timestamptz not null default now(),
  klasse text not null check (char_length(klasse) between 1 and 12),
  quote smallint not null check (quote between 0 and 100),
  figuren smallint not null check (figuren between 1 and 35),
  fragen smallint not null check (fragen between 1 and 12)
);

-- Row Level Security: jeder darf lesen und eintragen, aber nichts ändern oder löschen.
alter table public.klassenwertung enable row level security;

drop policy if exists "Rangliste lesen" on public.klassenwertung;
create policy "Rangliste lesen" on public.klassenwertung
  for select to anon, authenticated using (true);

drop policy if exists "Ergebnis eintragen" on public.klassenwertung;
create policy "Ergebnis eintragen" on public.klassenwertung
  for insert to anon, authenticated with check (true);

grant select, insert on public.klassenwertung to anon, authenticated;
