# Modus Operandi - Smart-Apps-Demo

## Zweck

Diese Datei beschreibt, wie das Solo-Projekt dokumentiert und umgesetzt wird. Markdown-Dateien im Repo sind die Single Source of Truth.

## Single Source of Truth

1. `docs/spec.md` beschreibt Produktumfang, Business Rules, Datenobjekte, Rollen, offene Punkte und Priorisierung.
2. `docs/backlog.md` uebersetzt die Spec in stabile, umsetzbare Feature-IDs.
3. `docs/decisions.md` dokumentiert getroffene Produkt- und Architekturentscheidungen.
4. `docs/architecture.md` beschreibt technische Leitplanken.
5. `AGENTS.md` ist das kurze Projekt-Briefing fuer Coding-Sessions.

## Session-Workflow

1. Vor Aenderungen `AGENTS.md` und die relevante Doku in `docs/` lesen.
2. Ziel und Akzeptanzkriterien klaeren.
3. Bei Feature-Arbeit passende ID aus `docs/backlog.md` verwenden oder eine neue ID anlegen.
4. Kleine, nachvollziehbare Aenderungen umsetzen.
5. Verifizieren: Tests, Linting oder mindestens gezielte manuelle Pruefung.
6. Relevante Doku aktualisieren, wenn sich Verhalten, Scope oder Architektur aendert.

## Feature-IDs

- Prefix: `STD` fuer Smart-Apps-Demo.
- Schema: `STD-NNN`, zum Beispiel `STD-001`.
- IDs werden nie umnummeriert und nie wiederverwendet.
- Verworfene Features bleiben im Backlog mit Status `killed`.

## Status-Werte

| Status | Bedeutung |
|---|---|
| `hypo` | Aus Spec oder Idee abgeleitet, noch nicht validiert |
| `validated` | Fachlich bestaetigt, aber noch nicht implementiert |
| `in-progress` | Aktuell in Arbeit |
| `done` | Implementiert und im Commit referenziert |
| `killed` | Verworfen, Begruendung in `decisions.md` |

## Entscheidungsregeln

- Widersprueche und offene Punkte aus `docs/spec.md` nicht stillschweigend loesen.
- Entscheidungen mit dauerhaftem Einfluss in `docs/decisions.md` dokumentieren.
- Bei unklarer fachlicher Bedeutung lieber explizit nachfragen.

## Scope-Regeln

- Das PVS wird nicht ersetzt.
- Keine `prd.md` anlegen; `docs/spec.md` bleibt die Produktgrundlage.
- Keine Meeting- oder Results-Ordner anlegen, solange das Solo-Setup gilt.
