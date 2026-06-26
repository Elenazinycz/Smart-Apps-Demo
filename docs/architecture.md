# architecture.md - Smart-Apps-Demo

_Stand: 2026-06-26_

## Architekturstand

Das Projekt ist als Next.js-App mit Prisma und SQLite aufgesetzt.

## Technologieentscheidung

| Bereich | Wahl | Begruendung |
|---|---|---|
| Web-Framework | Next.js 16.2.9 mit App Router | Geeignet fuer eine kompakte Full-Stack-Demo mit UI, Serverlogik und spaeteren API-Routen in einem Projekt |
| Sprache | TypeScript | Striktere Typisierung fuer fachliche Regeln und Datenmodelle |
| ORM | Prisma 6.19.3 | Lesbares Schema, Migrationen und typsicherer Datenbankzugriff; Version 6 nutzt den einfachen `schema.prisma` + `.env`-Workflow fuer SQLite |
| Datenbank | SQLite | Einfach lokal lauffaehig und ausreichend fuer eine Hochschul-/Demo-Anwendung ohne externen DB-Server |

## Projektstruktur

| Pfad | Zweck |
|---|---|
| `app/` | Next.js App Router, Seiten und globale Styles |
| `lib/prisma.ts` | Gemeinsamer Prisma Client fuer Servercode |
| `prisma/schema.prisma` | Datenmodell und SQLite-Datasource |
| `.env.example` | Beispiel fuer `DATABASE_URL` |
| `docs/` | Projektmethodik, Spec, Backlog und Architektur |

## Fachliche Leitplanken aus der Spec

- Das PVS bleibt fuehrend fuer Patientenstammdaten, No-Shows und medizinische Workflows.
- Die App bucht, storniert und verschiebt Termine nur innerhalb der definierten Regeln.
- Sprechzeiten, Sperrzeiten, Praxisschliessungen, Termintypen und Arzt-Zuordnungen muessen pflegbar sein.
- Doppelbuchungen muessen technisch verhindert werden.
- Benachrichtigungen duerfen nur mit Opt-in versendet werden.
- Arzt-Ausfall wird durch Listen und Markierungen unterstuetzt, nicht durch vollautomatische Umbuchung.

## Datenobjekte

Die fachlichen Datenobjekte stehen in `docs/spec.md`:

- Patient
- PatientenKonto
- Arzt
- PraxisNutzer
- Termintyp
- TerminSlot
- Sperrzeit
- ArztTermintypZuordnung

## Offene Architekturfragen

- Welche PVS-Schnittstelle existiert?
- Wie werden PVS-Synchronisationsfehler behandelt?
- Wie werden PVS-Fehler fuer MFAs sichtbar gemacht?
- Welche Authentifizierung wird fuer den Demo-Umfang verwendet?
