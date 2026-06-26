# decisions.md - Architektur- und Produktentscheidungen

_Chronologisches Log aller Architektur- und Produktentscheidungen._

---

## 2026-06-26 - SOLO-Setup nach Modus Operandi

**Kontext:** Das Projekt soll nach der Methodik `jacekzawisza/modus-operandi` eingerichtet werden, aber als Solo-Projekt.

### Entscheidung

- `docs/spec.md` ist die zentrale Produktgrundlage und ersetzt `prd.md`.
- `AGENTS.md` ist das Projekt-Briefing fuer Coding-Sessions.
- Die Dokumentation liegt unter `docs/`.
- Es werden keine Meeting- und Results-Ordner angelegt.
- Feature-Arbeit nutzt stabile IDs mit Prefix `STD`.

### Alternativen verworfen

- `prd.md` zusaetzlich pflegen: verworfen, weil es Doppelpflege zur vorhandenen Spec erzeugen wuerde.
- Meeting- und Results-Struktur anlegen: verworfen, weil das Projekt aktuell solo gefuehrt wird.

### Konsequenzen

- Weniger Doku-Overhead fuer das Solo-Projekt.
- `docs/spec.md` muss aktuell gehalten werden, weil sie die zentrale fachliche Quelle ist.

---

<!-- Vorlage fuer neue Entscheidungen:

## JJJJ-MM-TT - Titel der Entscheidung

**Kontext:** Warum musste entschieden werden?

### Entscheidung

Was wurde entschieden?

### Alternativen verworfen

- Option A: Warum nicht?
- Option B: Warum nicht?

### Konsequenzen

- Positiv
- Negativ / Risiken

-->
