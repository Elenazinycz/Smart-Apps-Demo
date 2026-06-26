# architecture.md - Smart-Apps-Demo

_Stand: 2026-06-26_

## Architekturstand

Noch nicht festgelegt. Diese Datei sammelt technische Leitplanken, sobald Implementierung beginnt.

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
- Welche Persistenz und Authentifizierung werden fuer den Demo-Umfang verwendet?
