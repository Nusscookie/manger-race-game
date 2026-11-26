-- Schulrangliste zurücksetzen (z. B. nach euren Testspielen).
-- Supabase → SQL Editor → New query → eine der Zeilen unten einfügen → Run.
-- Das geht nur im Dashboard: Die Website selbst darf nichts löschen.

-- 1) ALLE Einträge löschen (Achtung: lässt sich nicht rückgängig machen):
delete from public.klassenwertung;

-- 2) Nur eine bestimmte Klasse löschen – dafür Zeile 1 oben löschen und hier die "--" entfernen.
--    Klassennamen werden klein und ohne Leerzeichen gespeichert, also "9b" statt "9 B".
-- delete from public.klassenwertung where klasse = 'test';
