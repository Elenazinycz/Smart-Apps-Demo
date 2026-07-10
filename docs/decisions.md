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

## 2026-07-03 - F-KERN-1: Datenmodelle Kern implementiert

**Kontext:** F-KERN-1 fasst die sechs Datenmodelle der Kernphase zusammen: PatientenKonto, TerminSlot, Termintyp, Arzt, ArztTermintypZuordnung, Buchungsquelle. Das initiale Prisma-Schema war bereits angelegt.

### Umsetzung
- **Prisma-Schema:** Index auf TerminSlot.patientId ergÃ¤nzt fÃ¼r effiziente Abfragen eigener Termine
- **Typkonstanten:** lib/constants.ts mit typsicheren GeschÃ¤ftsregeln (Status-Werte, Rollen, Fristen aus spec.md Â§BR4)
- **Seed-Skript:** prisma/seed.ts befÃ¼llt die Demo mit 7 Termintypen, 3 Ã„rzt:innen, 1 Admin, 4 MFAs, 3 Patient:innen mit Konten und 19 Arzt-Termintyp-Zuordnungen
- **package.json:** prisma.seed-Konfiguration und BOM-Bereinigung fÃ¼r Schema und package.json

### Status
- F-KERN-1: done
- STD-001: done (bereits vorhanden)
- STD-006, STD-007, STD-010, STD-011, STD-015: done (Schema validiert, Seed deployed)

### Konsequenzen
- Seed muss bei Datenmodell-Ã„nderungen neu aufgesetzt werden (prisma migrate reset)
- TypeScript-Konstanten in lib/constants.ts sind die Single Source of Truth fÃ¼r GeschÃ¤ftsregeln
## 2026-07-10 - F-KERN-2: Login & Berechtigung als Mock-Auth

**Kontext:** F-KERN-2 umfasst Stammpatienten-Login (STD-003), Verhinderung von Self-Registration (STD-004) und Buchungsberechtigungsprüfung (STD-005). Für die Uni-Demo soll eine einfache Mock-Authentifizierung reichen.

### Entscheidung
- **Mock-Login** mit JWT-Tokens (jose) statt NextAuth.js oder bcrypt
- Login über API-Route /api/login mit zwei Pfaden: PraxisNutzer (E-Mail) oder PatientenKonto (Benutzername)
- Jedes nicht-leere Passwort wird akzeptiert (Mock)
- Middleware schützt alle Seiten außer /login und /api/login
- Session-Cookie (httpOnly, sameSite=lax, 24h)
- Keine Self-Registration – Konten werden nur über den Seed angelegt

### Umgesetzt
- lib/auth.ts – JWT sign/verify mit HS256
- lib/session.ts – Cookie-Management
- middleware.ts – Route-Guard
- app/api/login/route.ts – POST-Login mit DB-Lookup
- app/api/logout/route.ts – Session löschen
- app/api/me/route.ts – Session-Info abrufen
- app/login/page.tsx – Login-Formular mit Test-Hinweisen
- app/dashboard/page.tsx + LogoutButton.tsx – Demo-Dashboard

### Alternativen verworfen
- NextAuth.js: für Mock zu schwergewichtig
- bcrypt/eigener Passwort-Hash: für Demo unnötig
- Self-Registration: laut spec.md §3 out of scope

### Konsequenzen
- Für Produktion müssten echte Passwort-Hashes und ein sicheres JWT-Secret her
- Der Mock-Charakter ist in der UI über den Hinweis »beliebiges Passwort« transparent gemacht
- Bei Erweiterung kann auf NextAuth.js migriert werden (Session-Layout bleibt gleich)

