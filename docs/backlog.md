# backlog.md - Smart-Apps-Demo

_Stand: 2026-06-26_

_Stabile Feature-IDs. Nicht umnummerieren. Killed-IDs bleiben killed._

---

## Konvention

- **ID-Schema:** `STD-NNN`
- **Prefix:** `STD` fuer Smart-Apps-Demo
- **Nummerierung:** fortlaufend, nie wiederverwenden
- **Referenzierung:** In Commits, Konzepten und Doku immer per ID
- **Produktgrundlage:** `docs/spec.md` ersetzt `prd.md`

## Status-Werte

| Status | Bedeutung |
|---|---|
| `hypo` | Aus Spec oder Idee abgeleitet, noch nicht validiert |
| `validated` | Fachlich bestaetigt, aber noch kein Code |
| `in-progress` | Aktuell in Arbeit |
| `done` | Implementiert, im Commit referenziert |
| `killed` | Verworfen, Begruendung in `decisions.md` |

## Features

| ID | Name | Phase | Status | Quelle | Notiz |
|---|---|---|---|---|---|
| STD-001 | Stammpatienten-Login ohne Self-Registration | v1 | hypo | docs/spec.md | Nur aktive PatientenKonten duerfen online buchen |
| STD-002 | Online-Terminbuchung fuer planbare Termintypen | v1 | hypo | docs/spec.md | Vorsorge, Beratung, Impfung/Reisemedizin, Wiederholungsrezept-Abholung |
| STD-003 | Slot-Pruefung gegen Sprechzeiten und Sperrzeiten | v1 | hypo | docs/spec.md | Keine Doppelbuchung, keine Buchung in Pausen oder Abwesenheiten |
| STD-004 | Stornierung und Umbuchung bis 24h vorher | v1 | hypo | docs/spec.md | Online-Termine sind sofort verbindlich |
| STD-005 | DSGVO-konforme Benachrichtigungen mit Opt-in | v1 | hypo | docs/spec.md | Bestaetigungen und Erinnerung nur mit Opt-in |
| STD-006 | Verwaltung von Sprechzeiten und Termintyp-Zuordnungen | v1 | hypo | docs/spec.md | Sprechzeiten duerfen nicht hardcoded sein |
| STD-007 | Akutslot-Verwaltung fuer MFAs | v1 | hypo | docs/spec.md | Akutslots sind nicht online buchbar |
| STD-008 | No-Show-Tracking und Sperrlogik | v1 | hypo | docs/spec.md | Erinnerung ab 2, Sperre ab 3 No-Shows/Jahr |
| STD-009 | PVS-Synchronisation fuer Terminaktionen | v1 | hypo | docs/spec.md | Buchungen, Umbuchungen und Stornierungen synchronisieren |
| STD-010 | Arzt-Ausfall-Unterstuetzung | v1 | hypo | docs/spec.md | Betroffene Termine anzeigen und markieren |
| STD-011 | Wiederholungsrezept-Workflow erweitert | v1.1 | hypo | docs/spec.md | Nice-to-have laut Spec |
| STD-012 | Automatische Umbuchungsvorschlaege | v1.1 | hypo | docs/spec.md | Vorschlaege, keine vollautomatische Umbuchung |
| STD-013 | No-Show-Auswertung | v1.1 | hypo | docs/spec.md | Nice-to-have laut Spec |
| STD-014 | Admin-Statistiken | v1.1 | hypo | docs/spec.md | Nice-to-have laut Spec |

## Workflow

**Feature wird gebaut:**
- Status `hypo` oder `validated` -> `in-progress`
- Commit-Message nach Moeglichkeit mit Feature-ID, z.B. `feat: STD-002 online booking`

**Feature fertig:**
- Status `in-progress` -> `done`
- Commit-Hash in der Notiz ergaenzen

**Feature verworfen:**
- Status -> `killed`
- Entscheidung mit Begruendung in `docs/decisions.md` dokumentieren
