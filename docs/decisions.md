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


## 2026-07-10 - F-KERN-3: Buchungslogik & Slot-Anzeige implementiert

**Kontext:** F-KERN-3 umfasst die zentrale Buchungslogik: Online-Buchbarkeit von Termintypen prüfen (STD-008, STD-009), verbindliche Buchung (STD-012), freie Slots anzeigen (STD-013) und Doppelbuchung verhindern (STD-014).

### Umsetzung
- **lib/slots.ts:** 6 Export-Funktionen – istOnlineBuchbar, istArztFreigegeben, getSperrzeitenBlocking, getFreieSlots, bucheOnlineTermin, ueberschneidetSich
- **API-Routen:** GET /api/termintypen (nur online-buchbare), GET /api/aerzte (nur freigegebene), GET /api/slots (freie + Sperrzeiten-Filter), POST /api/appointments (Buchung mit Vollprüfung)
- **Frontend:** BuchungsFormular.tsx mit 3-Stufen-Auswahl (Termintyp → Arzt → Datum → Slot) und verbindlichem Buchungs-Button
- **Doppelbuchungs-Schutz:** DB-Index auf (datum, arztId, status) + atomares findFirst mit status=frei + update in einem Request

### Business-Regeln vollständig abgebildet
- Nur Vorsorge, Beratung, Impfung/Reisemedizin und Wiederholungsrezept-Abholung sind online buchbar (Whitelist)
- Akut, Blutabnahme und Erstgespräch werden durch API und Backend blockiert
- Buchung prüft: Online-Buchbarkeit, Arzt-Freigabe, Konto-Aktiv, No-Show-Limit, Sperrzeiten, Slot-Verfügbarkeit
- Sperrzeiten: Praxis-weit und arzt-spezifisch, mit/without Uhrzeit (ganztägig)
- Buchungsquelle wird als "online" gespeichert

### Status
- F-KERN-3: done (alle 5 STD-IDs auf done gesetzt)
- STD-008, STD-009, STD-012, STD-013, STD-014: done

### Konsequenzen
- Code in lib/slots.ts bewusst kompakt gehalten (75 Zeilen) – alle Prüfungen bleiben lesbar
- Frontend (BuchungsFormular.tsx) als reines Client-Component – kein Server-Rendering für die Auswahl nötig
- Für Produktion müssten Transaktions-Sperren (prisma.\) ergänzt werden; aktuell reicht der atomare findFirst-Mechanismus für die Demo

## 2026-07-10 - F-KERN-4: Eigene Termine verwalten implementiert

**Kontext:** F-KERN-4 umfasst das Anzeigen von Patientendaten (STD-002), das Anzeigen eigener Termine (STD-016), Online-Stornierung (STD-017), Online-Umbuchung (STD-018) und die No-Show-Regel fuer rechtzeitige Stornierung (STD-019).

### Umsetzung
- **Patientendaten anzeigen:** Neue API /api/patient gibt Name, Geburtsdatum, Versicherungsart, E-Mail, Opt-ins, No-Show-Zaehler und Status zurueck. Anzeige in einem eigenen Panel auf /termine.
- **Eigene Termine anzeigen:** Server-Component auf /termine listet alle zukuenftigen Termine des Patienten mit Datum, Arzt, Termintyp und Dauer.
- **Online-Stornierung:** Neue Funktion storniereTermin() in lib/slots.ts mit Pruefung auf Eigentum, Status, Buchungsquelle und 24h-Frist. API POST /api/appointments/cancel.
- **Online-Umbuchung:** Neue Funktion umbucheOnlineTermin() kombiniert Stornierung des Alt-Slots + Buchung eines Neuen. Bei Fehler erfolgt automatischer Rollback. API POST /api/appointments/reschedule.
- **Frontend:** TerminListeClient.tsx bietet Stornieren- und Umbuchen-Buttons mit 24h-Frist-Prüfung. Umbuchungs-Formular mit Termintyp/Arzt/Datum/Slot-Auswahl.
- **Navigation:** Dashboard zeigt "Meine Termine" Link nur fuer Patient:innen. /termine/buchen als eigener Pfad.
- **No-Show-Regel:** Stornierte Termine erhalten Status "abgesagt" (nicht "noShow") und werden vom noShowZaehlerJahr nicht erhoeht (spec BR4/16).

### Status
- F-KERN-4: done
- STD-002, STD-016, STD-017, STD-018, STD-019: done

### Konsequenzen
- Die Umbuchungslogik verwendet ein Storno+NeuBuch-Pattern mit Rollback bei Fehler – fuer die Demo ausreichend, fuer Produktion waere eine Transaktionssperre zu empfehlen.
- /termine ist jetzt der zentrale Einstiegspunkt fuer Patient:innen; /termine/buchen ist die eigenstaendige Buchungsseite.
- Keine Aenderungen am Prisma-Schema noetig – die bestehenden Felder (status, patientId, buchungsquelle) decken alle Anforderungen ab.

## 2026-07-10 - F-VERW-1: Nutzer & Rollen implementiert

**Kontext:** F-VERW-1 umfasst das PraxisNutzer-Datenmodell (STD-020, existiert bereits), rollenbasierte Berechtigungen (STD-021), Anlegen von PatientenKonten durch MFA/Admin (STD-022) und Verwaltung der Termintyp-Arzt-Zuordnung durch Admin (STD-035).

### Umsetzung
- **lib/rollen.ts** — Neue Hilfsfunktionen: hatRolle(), istAdmin(), istMfa(), istArzt(), istMfaOderAdmin()
- **Praxis-Bereich** (/praxis) — Neuer geschützter Bereich für PraxisNutzer mit Layout-Guard (session.type !== 'praxis' blockt Patient:innen). Dynamische Navigation basierend auf Rolle.
- **Rollen-Guard im Dashboard** — Navigation zeigt "Praxis-Bereich" nur für PraxisNutzer, "Meine Termine" nur für Patient:innen.
- **PatientenKonto anlegen** (/praxis/konten-anlegen) — UI mit Auswahl aller aktiven Patienten ohne Konto, automatischer Benutzername-Vorschlag, API POST /api/patienten-konten mit Berechtigungsprüfung (MFA/Admin). GET /api/patienten-konten liefert Patienten ohne Konto.
- **Termintyp-Arzt-Zuordnung** (/praxis/termintyp-zuordnung) — Admin-UI mit Tabelle aller Zuordnungen, Checkboxen für onlineErlaubt und aktiv, API PUT /api/zuordnungen mit sofortigem Speichern.

### Status
- F-VERW-1: done
- STD-020: done (bereits vorhanden)
- STD-021, STD-022, STD-035: done

### Konsequenzen
- Die Rollenprüfung in lib/rollen.ts ist kompakt und wiederverwendbar für alle nachfolgenden Features (F-VERW-2, F-VERW-3, F-SICH-*, F-BETR-*).
- Keine Änderungen am Prisma-Schema nötig — alle benötigten Felder (rolle, berechtigung, erstelltVonNutzerId) waren bereits vorhanden.
- PatientenKonto-Erstellung verwendet Mock-Passwort-Hash — für Produktion müsste bcrypt eingebunden werden.

## 2026-07-10 - F-VERW-2: Sprechzeiten & Sperrzeiten implementiert

**Kontext:** F-VERW-2 umfasst pflegbare Sprechzeiten (STD-023/024), Sperrzeit-Datenmodell (STD-025, existiert bereits), Sperrzeiten-CRUD durch Admin (STD-026), Arzt-Abwesenheiten (STD-027), Buchungsprüfung (STD-028) und Mittagspause (STD-029).

### Umsetzung
- **Sprechzeit-Datenmodell:** Neues Prisma-Modell Sprechzeit mit arztId, wochentag (1-7), startZeit/endZeit (HH:mm), gueltigVon/gueltigBis, aktiv. Migration erstellt.
- **Sprechzeiten API + Admin-UI:** GET/POST/PUT/DELETE /api/sprechzeiten (nur Admin). UI unter /praxis/sprechzeiten mit Tabelle, Anlegen/Löschen/Toggle.
- **Sperrzeiten CRUD (Admin/MFA/Arzt):** POST /api/sperrzeiten mit Berechtigungsprüfung: Admin/MFA darf alles, Ärzte nur eigene Abwesenheiten. Ärzte sehen nur eigene Sperrzeiten. Standardisierte Gründe (Urlaub, Krankheit, Fortbildung, Feiertag, Brückentag, Mittagspause).
- **Buchungsprüfung (Sprechzeiten):** Neue getSprechzeitenBlocking() invertiert Sprechzeiten zu Blockade-Zeiträumen. Wird in getFreieSlots() und bucheOnlineTermin() zusätzlich zu getSperrzeitenBlocking() geprüft.
- **Buchungsprüfung (Sperrzeiten):** Bereits implementiert via getSperrzeitenBlocking().
- **Mittagspause:** Über Sperrzeit-Modell abbildbar (Grund "Mittagspause"). Beispiel: Sperrzeit 13:00-14:00 für Praxis an Werktagen.

### Status
- F-VERW-2: done
- STD-023, STD-024, STD-025, STD-026, STD-027, STD-028, STD-029: done

### Konsequenzen
- Ohne hinterlegte Sprechzeiten ist ein Arzt komplett blockiert (ganzer Tag gesperrt). Seed muss Sprechzeiten enthalten.
- Sprechzeiten werden als erlaubte Fenster modelliert, alles außerhalb ist blockiert. Das erspart die Berechnung von Öffnungs-/Mittagspause-Logik.
- Keine Änderung an der bisherigen Sperrzeit-Logik – getSperrzeitenBlocking() läuft parallel zu getSprechzeitenBlocking().

## 2026-07-10 - F-VERW-3: Termintypen & Arzt-Zuordnung implementiert

**Kontext:** F-VERW-3 umfasst Termintypen-CRUD durch Admin (STD-030), Arzt-Termintyp-Zuordnung (STD-031, bereits in F-VERW-1 gebaut), Aktivpruefung bei Buchung (STD-032, bereits via istArztFreigegeben()), standardisierte Sperrzeit-Gruende (STD-033, bereits via SPERRGRUND-Konstanten) und Praxisregeln-Konfiguration (STD-034).

### Umsetzung
- **STD-030 (Termintypen-CRUD):** Neue API-Route app/api/termintypen/admin/route.ts mit GET (Liste + Einzel), POST (Anlegen), PUT (Bearbeiten), DELETE (Loeschen mit Termin-Pruefung). Admin-UI unter /praxis/termintypen mit Tabelle, Anlegen/Bearbeiten/Loeschen.
- **STD-031 (Arzt-Termintyp-Zuordnung):** Bereits mit F-VERW-1 implementiert (/praxis/termintyp-zuordnung + /api/zuordnungen). Validated und auf done gesetzt.
- **STD-032 (Aktive Zuordnungen):** Bereits in lib/slots.ts via istArztFreigegeben() mit aktiv && onlineErlaubt. Buchungslogik und API pruefen dies. Validated und auf done gesetzt.
- **STD-033 (Sperrzeit-Gruende):** Bereits in lib/constants.ts via SPERRGRUND-Konstanten (Urlaub, Krankheit, Fortbildung, Feiertag, Brueckentag, Mittagspause). Validated und auf done gesetzt.
- **STD-034 (Praxisregeln):** Neues Prisma-Modell PraxisRegel (schluessel, wert, beschreibung). API /api/praxisregeln mit GET (liest/initialisiert Defaults) und PUT (Wert aktualisieren). Admin-UI /praxis/praxisregeln mit Tabelle aller Regeln. 7 Default-Regeln aus lib/constants.ts: Stornierungsfrist, Umbuchungsfrist, Erinnerungsfrist, No-Show-Limits, Akutslot-Anzahlen. Seed um 7 Default-Regeln ergaenzt.
- **Praxis-Dashboard:** Navigation unter "Verwaltung" um Links zu Termintypen und Praxisregeln ergaenzt.

### Status
- F-VERW-3: done
- STD-030, STD-031, STD-032, STD-033, STD-034: done

### Konsequenzen
- Termintypen sind jetzt vollstaendig ueber die Admin-UI pflegbar (CRUD) – bisher nur ueber Seed.
- Praxisregeln sind als key-value-Modell umgesetzt und koennen ohne Schema-Aenderung erweitert werden.
- Die Buchungslogik in lib/slots.ts verwendet noch harte Konstanten (REGEL-Objekt); ein naechster Schritt waere, die Logik auf DB-Werte aus der PraxisRegel-Tabelle umzustellen.
- Migration 20260710150437_add_praxisregel fuegt das PraxisRegel-Modell hinzu.