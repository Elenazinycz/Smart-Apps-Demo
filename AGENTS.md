# AGENTS.md - Smart-Apps-Demo

## Projekt
Smart-Apps-Demo ist eine Praxis-Terminsoftware fuer die Praxis Demir & Kollegen. Die App dient als Online-Frontend fuer Terminbuchung, Umbuchung, Stornierung und ausgewaehlte Praxis-Workflows; das bestehende PVS bleibt fuehrend.

## Deadline
Offen - Hochschulprojekt im Modul Digital Business.

## Was bauen wir?
-> Lies `docs/spec.md`. Diese Datei ist die zentrale Produktgrundlage und ersetzt ein `prd.md`.
-> Lies `docs/backlog.md` fuer Feature-IDs und Status, sobald konkrete Umsetzungsschritte gepflegt werden.

## Tech-Stack + Standards
-> Lies `docs/architecture.md`.

## Architektur-Entscheidungen
-> Lies `docs/decisions.md`.

## Arbeitsweise
-> Lies `docs/modus-operandi.md`.

## SOLO-Projektregeln
- Keine Meeting-Ordner und keine Results-Ordner anlegen, solange sie nicht explizit gebraucht werden.
- Keine `prd.md` anlegen; Produktumfang und Roadmap stehen in `docs/spec.md`.
- Offene Produktfragen aus der Spec bleiben sichtbar und werden in `docs/decisions.md` entschieden, sobald eine Entscheidung getroffen wurde.
- Feature-Arbeit nutzt stabile IDs aus `docs/backlog.md`.

## Coding-Prinzipien

**1. Think Before Coding.** Annahmen explizit machen. Bei Mehrdeutigkeit Interpretationen aufzeigen statt zu raten. Wenn etwas unklar ist: stoppen und fragen.

**2. Simplicity First.** Minimum Code, der das Problem loest. Keine Features ueber das Gefragte hinaus. Keine Abstraktionen fuer Single-Use-Code.

**3. Surgical Changes.** Nur das anfassen, was noetig ist. Bestehenden Stil matchen. Keine unaufgeforderten Architektur-Eingriffe.

**4. Goal-Driven Execution.** Erfolgskriterien vor Implementierung definieren. Bei Features: Akzeptanzkriterien als Checkliste. Bei Bugs: reproduzierender Test, dann Fix.

## Coding-Konventionen
- Deutsche UI-Texte fuer fachliche Oberflaechen.
- Fachbegriffe aus `docs/spec.md` verwenden: Patient, PatientenKonto, Arzt, PraxisNutzer, Termintyp, TerminSlot, Sperrzeit.
- Business Rules aus `docs/spec.md` sind verbindlich, besonders Buchungsberechtigung, Slot-Pruefung, No-Show-Regel, DSGVO-Opt-in und PVS-Synchronisation.

## Gotchas / Bekannte Fallen
- Keine Online-Self-Registration bauen; Konten werden durch MFA/Admin angelegt.
- Akut, Blutabnahme und Erstgespraech sind nicht online buchbar.
- Sprechzeiten duerfen nicht hardcoded werden.
- Nachrichten duerfen nur mit passendem Opt-in versendet werden.
- Arzt-Ausfall fuehrt nicht zu vollautomatischer Umbuchung.
