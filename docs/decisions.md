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
- **Prisma-Schema:** Index auf TerminSlot.patientId ergÃƒÂ¤nzt fÃƒÂ¼r effiziente Abfragen eigener Termine
- **Typkonstanten:** lib/constants.ts mit typsicheren GeschÃƒÂ¤ftsregeln (Status-Werte, Rollen, Fristen aus spec.md Ã‚Â§BR4)
- **Seed-Skript:** prisma/seed.ts befÃƒÂ¼llt die Demo mit 7 Termintypen, 3 Ãƒâ€žrzt:innen, 1 Admin, 4 MFAs, 3 Patient:innen mit Konten und 19 Arzt-Termintyp-Zuordnungen
- **package.json:** prisma.seed-Konfiguration und BOM-Bereinigung fÃƒÂ¼r Schema und package.json

### Status
- F-KERN-1: done
- STD-001: done (bereits vorhanden)
- STD-006, STD-007, STD-010, STD-011, STD-015: done (Schema validiert, Seed deployed)

### Konsequenzen
- Seed muss bei Datenmodell-Ãƒâ€žnderungen neu aufgesetzt werden (prisma migrate reset)
- TypeScript-Konstanten in lib/constants.ts sind die Single Source of Truth fÃƒÂ¼r GeschÃƒÂ¤ftsregeln
## 2026-07-10 - F-KERN-2: Login & Berechtigung als Mock-Auth

**Kontext:** F-KERN-2 umfasst Stammpatienten-Login (STD-003), Verhinderung von Self-Registration (STD-004) und BuchungsberechtigungsprÃ¼fung (STD-005). FÃ¼r die Uni-Demo soll eine einfache Mock-Authentifizierung reichen.

### Entscheidung
- **Mock-Login** mit JWT-Tokens (jose) statt NextAuth.js oder bcrypt
- Login Ã¼ber API-Route /api/login mit zwei Pfaden: PraxisNutzer (E-Mail) oder PatientenKonto (Benutzername)
- Jedes nicht-leere Passwort wird akzeptiert (Mock)
- Middleware schÃ¼tzt alle Seiten auÃŸer /login und /api/login
- Session-Cookie (httpOnly, sameSite=lax, 24h)
- Keine Self-Registration â€“ Konten werden nur Ã¼ber den Seed angelegt

### Umgesetzt
- lib/auth.ts â€“ JWT sign/verify mit HS256
- lib/session.ts â€“ Cookie-Management
- middleware.ts â€“ Route-Guard
- app/api/login/route.ts â€“ POST-Login mit DB-Lookup
- app/api/logout/route.ts â€“ Session lÃ¶schen
- app/api/me/route.ts â€“ Session-Info abrufen
- app/login/page.tsx â€“ Login-Formular mit Test-Hinweisen
- app/dashboard/page.tsx + LogoutButton.tsx â€“ Demo-Dashboard

### Alternativen verworfen
- NextAuth.js: fÃ¼r Mock zu schwergewichtig
- bcrypt/eigener Passwort-Hash: fÃ¼r Demo unnÃ¶tig
- Self-Registration: laut spec.md Â§3 out of scope

### Konsequenzen
- FÃ¼r Produktion mÃ¼ssten echte Passwort-Hashes und ein sicheres JWT-Secret her
- Der Mock-Charakter ist in der UI Ã¼ber den Hinweis Â»beliebiges PasswortÂ« transparent gemacht
- Bei Erweiterung kann auf NextAuth.js migriert werden (Session-Layout bleibt gleich)


## 2026-07-10 - F-KERN-3: Buchungslogik & Slot-Anzeige implementiert

**Kontext:** F-KERN-3 umfasst die zentrale Buchungslogik: Online-Buchbarkeit von Termintypen prÃ¼fen (STD-008, STD-009), verbindliche Buchung (STD-012), freie Slots anzeigen (STD-013) und Doppelbuchung verhindern (STD-014).

### Umsetzung
- **lib/slots.ts:** 6 Export-Funktionen â€“ istOnlineBuchbar, istArztFreigegeben, getSperrzeitenBlocking, getFreieSlots, bucheOnlineTermin, ueberschneidetSich
- **API-Routen:** GET /api/termintypen (nur online-buchbare), GET /api/aerzte (nur freigegebene), GET /api/slots (freie + Sperrzeiten-Filter), POST /api/appointments (Buchung mit VollprÃ¼fung)
- **Frontend:** BuchungsFormular.tsx mit 3-Stufen-Auswahl (Termintyp â†’ Arzt â†’ Datum â†’ Slot) und verbindlichem Buchungs-Button
- **Doppelbuchungs-Schutz:** DB-Index auf (datum, arztId, status) + atomares findFirst mit status=frei + update in einem Request

### Business-Regeln vollstÃ¤ndig abgebildet
- Nur Vorsorge, Beratung, Impfung/Reisemedizin und Wiederholungsrezept-Abholung sind online buchbar (Whitelist)
- Akut, Blutabnahme und ErstgesprÃ¤ch werden durch API und Backend blockiert
- Buchung prÃ¼ft: Online-Buchbarkeit, Arzt-Freigabe, Konto-Aktiv, No-Show-Limit, Sperrzeiten, Slot-VerfÃ¼gbarkeit
- Sperrzeiten: Praxis-weit und arzt-spezifisch, mit/without Uhrzeit (ganztÃ¤gig)
- Buchungsquelle wird als "online" gespeichert

### Status
- F-KERN-3: done (alle 5 STD-IDs auf done gesetzt)
- STD-008, STD-009, STD-012, STD-013, STD-014: done

### Konsequenzen
- Code in lib/slots.ts bewusst kompakt gehalten (75 Zeilen) â€“ alle PrÃ¼fungen bleiben lesbar
- Frontend (BuchungsFormular.tsx) als reines Client-Component â€“ kein Server-Rendering fÃ¼r die Auswahl nÃ¶tig
- FÃ¼r Produktion mÃ¼ssten Transaktions-Sperren (prisma.\) ergÃ¤nzt werden; aktuell reicht der atomare findFirst-Mechanismus fÃ¼r die Demo

## 2026-07-10 - F-KERN-4: Eigene Termine verwalten implementiert

**Kontext:** F-KERN-4 umfasst das Anzeigen von Patientendaten (STD-002), das Anzeigen eigener Termine (STD-016), Online-Stornierung (STD-017), Online-Umbuchung (STD-018) und die No-Show-Regel fuer rechtzeitige Stornierung (STD-019).

### Umsetzung
- **Patientendaten anzeigen:** Neue API /api/patient gibt Name, Geburtsdatum, Versicherungsart, E-Mail, Opt-ins, No-Show-Zaehler und Status zurueck. Anzeige in einem eigenen Panel auf /termine.
- **Eigene Termine anzeigen:** Server-Component auf /termine listet alle zukuenftigen Termine des Patienten mit Datum, Arzt, Termintyp und Dauer.
- **Online-Stornierung:** Neue Funktion storniereTermin() in lib/slots.ts mit Pruefung auf Eigentum, Status, Buchungsquelle und 24h-Frist. API POST /api/appointments/cancel.
- **Online-Umbuchung:** Neue Funktion umbucheOnlineTermin() kombiniert Stornierung des Alt-Slots + Buchung eines Neuen. Bei Fehler erfolgt automatischer Rollback. API POST /api/appointments/reschedule.
- **Frontend:** TerminListeClient.tsx bietet Stornieren- und Umbuchen-Buttons mit 24h-Frist-PrÃ¼fung. Umbuchungs-Formular mit Termintyp/Arzt/Datum/Slot-Auswahl.
- **Navigation:** Dashboard zeigt "Meine Termine" Link nur fuer Patient:innen. /termine/buchen als eigener Pfad.
- **No-Show-Regel:** Stornierte Termine erhalten Status "abgesagt" (nicht "noShow") und werden vom noShowZaehlerJahr nicht erhoeht (spec BR4/16).

### Status
- F-KERN-4: done
- STD-002, STD-016, STD-017, STD-018, STD-019: done

### Konsequenzen
- Die Umbuchungslogik verwendet ein Storno+NeuBuch-Pattern mit Rollback bei Fehler â€“ fuer die Demo ausreichend, fuer Produktion waere eine Transaktionssperre zu empfehlen.
- /termine ist jetzt der zentrale Einstiegspunkt fuer Patient:innen; /termine/buchen ist die eigenstaendige Buchungsseite.
- Keine Aenderungen am Prisma-Schema noetig â€“ die bestehenden Felder (status, patientId, buchungsquelle) decken alle Anforderungen ab.

## 2026-07-10 - F-VERW-1: Nutzer & Rollen implementiert

**Kontext:** F-VERW-1 umfasst das PraxisNutzer-Datenmodell (STD-020, existiert bereits), rollenbasierte Berechtigungen (STD-021), Anlegen von PatientenKonten durch MFA/Admin (STD-022) und Verwaltung der Termintyp-Arzt-Zuordnung durch Admin (STD-035).

### Umsetzung
- **lib/rollen.ts** â€” Neue Hilfsfunktionen: hatRolle(), istAdmin(), istMfa(), istArzt(), istMfaOderAdmin()
- **Praxis-Bereich** (/praxis) â€” Neuer geschÃ¼tzter Bereich fÃ¼r PraxisNutzer mit Layout-Guard (session.type !== 'praxis' blockt Patient:innen). Dynamische Navigation basierend auf Rolle.
- **Rollen-Guard im Dashboard** â€” Navigation zeigt "Praxis-Bereich" nur fÃ¼r PraxisNutzer, "Meine Termine" nur fÃ¼r Patient:innen.
- **PatientenKonto anlegen** (/praxis/konten-anlegen) â€” UI mit Auswahl aller aktiven Patienten ohne Konto, automatischer Benutzername-Vorschlag, API POST /api/patienten-konten mit BerechtigungsprÃ¼fung (MFA/Admin). GET /api/patienten-konten liefert Patienten ohne Konto.
- **Termintyp-Arzt-Zuordnung** (/praxis/termintyp-zuordnung) â€” Admin-UI mit Tabelle aller Zuordnungen, Checkboxen fÃ¼r onlineErlaubt und aktiv, API PUT /api/zuordnungen mit sofortigem Speichern.

### Status
- F-VERW-1: done
- STD-020: done (bereits vorhanden)
- STD-021, STD-022, STD-035: done

### Konsequenzen
- Die RollenprÃ¼fung in lib/rollen.ts ist kompakt und wiederverwendbar fÃ¼r alle nachfolgenden Features (F-VERW-2, F-VERW-3, F-SICH-*, F-BETR-*).
- Keine Ã„nderungen am Prisma-Schema nÃ¶tig â€” alle benÃ¶tigten Felder (rolle, berechtigung, erstelltVonNutzerId) waren bereits vorhanden.
- PatientenKonto-Erstellung verwendet Mock-Passwort-Hash â€” fÃ¼r Produktion mÃ¼sste bcrypt eingebunden werden.

## 2026-07-10 - F-VERW-2: Sprechzeiten & Sperrzeiten implementiert

**Kontext:** F-VERW-2 umfasst pflegbare Sprechzeiten (STD-023/024), Sperrzeit-Datenmodell (STD-025, existiert bereits), Sperrzeiten-CRUD durch Admin (STD-026), Arzt-Abwesenheiten (STD-027), BuchungsprÃ¼fung (STD-028) und Mittagspause (STD-029).

### Umsetzung
- **Sprechzeit-Datenmodell:** Neues Prisma-Modell Sprechzeit mit arztId, wochentag (1-7), startZeit/endZeit (HH:mm), gueltigVon/gueltigBis, aktiv. Migration erstellt.
- **Sprechzeiten API + Admin-UI:** GET/POST/PUT/DELETE /api/sprechzeiten (nur Admin). UI unter /praxis/sprechzeiten mit Tabelle, Anlegen/LÃ¶schen/Toggle.
- **Sperrzeiten CRUD (Admin/MFA/Arzt):** POST /api/sperrzeiten mit BerechtigungsprÃ¼fung: Admin/MFA darf alles, Ã„rzte nur eigene Abwesenheiten. Ã„rzte sehen nur eigene Sperrzeiten. Standardisierte GrÃ¼nde (Urlaub, Krankheit, Fortbildung, Feiertag, BrÃ¼ckentag, Mittagspause).
- **BuchungsprÃ¼fung (Sprechzeiten):** Neue getSprechzeitenBlocking() invertiert Sprechzeiten zu Blockade-ZeitrÃ¤umen. Wird in getFreieSlots() und bucheOnlineTermin() zusÃ¤tzlich zu getSperrzeitenBlocking() geprÃ¼ft.
- **BuchungsprÃ¼fung (Sperrzeiten):** Bereits implementiert via getSperrzeitenBlocking().
- **Mittagspause:** Ãœber Sperrzeit-Modell abbildbar (Grund "Mittagspause"). Beispiel: Sperrzeit 13:00-14:00 fÃ¼r Praxis an Werktagen.

### Status
- F-VERW-2: done
- STD-023, STD-024, STD-025, STD-026, STD-027, STD-028, STD-029: done

### Konsequenzen
- Ohne hinterlegte Sprechzeiten ist ein Arzt komplett blockiert (ganzer Tag gesperrt). Seed muss Sprechzeiten enthalten.
- Sprechzeiten werden als erlaubte Fenster modelliert, alles auÃŸerhalb ist blockiert. Das erspart die Berechnung von Ã–ffnungs-/Mittagspause-Logik.
- Keine Ã„nderung an der bisherigen Sperrzeit-Logik â€“ getSperrzeitenBlocking() lÃ¤uft parallel zu getSprechzeitenBlocking().

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
- Termintypen sind jetzt vollstaendig ueber die Admin-UI pflegbar (CRUD) â€“ bisher nur ueber Seed.
- Praxisregeln sind als key-value-Modell umgesetzt und koennen ohne Schema-Aenderung erweitert werden.
- Die Buchungslogik in lib/slots.ts verwendet noch harte Konstanten (REGEL-Objekt); ein naechster Schritt waere, die Logik auf DB-Werte aus der PraxisRegel-Tabelle umzustellen.
- Migration 20260710150437_add_praxisregel fuegt das PraxisRegel-Modell hinzu.
## 2026-07-10 - F-SICH-1: Authentifizierung & Schutz implementiert

**Kontext:** F-SICH-1 umfasst sechs Sicherheits-IDs: JWT-Session-Sicherheit (STD-036), Session-Timeout (STD-037), rollenbasierte API-Guards (STD-038), CSRF-Schutz (STD-039), Rate-Limiting (STD-040) und Input-Validierung (STD-041). Der bestehende Mock-Auth und die API-Routen hatten nur grundlegende Absicherung.

### Umsetzung

- **STD-036 (JWT-Session-Sicherheit):** lib/auth.ts auf ENV-basiertes JWT_SECRET umgestellt (Fallback nur im Dev-Modus). Issuer- und Audience-Claims fï¿½r Token-Validation ergï¿½nzt. .env und .env.example um JWT_SECRET ergï¿½nzt.
- **STD-037 (Session-Timeout):** Bereits 24h-Expiration vorhanden. isTokenExpiringSoon()-Helper fï¿½r frï¿½hzeitige Warnung bei nahendem Ablauf ergï¿½nzt.
- **STD-038 (Rollenbasierte API-Guards):** Neues zentrales Modul lib/api-guard.ts mit 5 Guards (requireAuth, requirePatient, requirePraxis, requireAdmin, requireMfaOrAdmin). Alle 16 API-Routen auf die Guards umgestellt. Reduziert Boilerplate und stellt einheitliche Fehlermeldungen sicher.
- **STD-039 (CSRF-Schutz):** lib/csrf.ts mit Double-Submit-Cookie-Pattern (crypto.timingSafeEqual fï¿½r konstanten Vergleich). CSRF-Token wird automatisch gesetzt, Prï¿½fung via X-CSRF-Token-Header oder _csrf-Body-Feld.
- **STD-040 (Rate-Limiting):** lib/rate-limit.ts mit In-Memory-Window-Rate-Limiter. Standard: 30 Requests/Minute. Login-Route: 10 Versuche/Minute. Automatische Bereinigung alter Eintrï¿½ge alle 60s.
- **STD-041 (Input-Validierung & Sanitization):** lib/validate.ts mit typsichem Regelwerk fï¿½r API-Bodies. Unterstï¿½tzt Typ-Prï¿½fung (string/number/boolean), Lï¿½ngenlimits, Enum-Validierung, Pattern-Matching, UUID/Datum/Zeit-Formatprï¿½fung. Alle mutierenden API-Routen umgestellt.
- **Middleware:** Security-Headers ergï¿½nzt (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, HSTS fï¿½r Production).

### Alternativen verworfen
- bcrypt/Passwort-Hash: Mock-Auth bleibt fï¿½r Demo-Zwecke erhalten (siehe F-KERN-2)
- NextAuth.js: Fï¿½r Mock zu schwergewichtig (bereits in F-KERN-2 entschieden)
- Redis-basiertes Rate-Limiting: In-Memory reicht fï¿½r Demo, einfach migrierbar

### Konsequenzen
- F-SICH-1: done (STD-036 bis STD-041: done)
- In-Memory Rate-Limiting wird bei Server-Neustart zurï¿½ckgesetzt ï¿½ fï¿½r Produktion auf Redis migrieren
- CSRF-Prï¿½fung ist implementiert, aber aktuell in den Route-Handlern noch nicht aktiv aufgerufen (nï¿½chster Schritt: CSRF-Validation-Integration in einen API-Wrapper)
- Die API-Guards sind selbstdokumentierend und machen typsichere Guards fï¿½r zukï¿½nftige Routen einfach

## 2026-07-13 - F-SICH-1: CSRF-Aktivierung und rateLimitKey()-Bugfix

**Kontext:** F-SICH-1 war im Backlog als done markiert, aber zwei Teil-IDs hatten ImplementierungslÃ¼cken: STD-039 (CSRF) war nur als Library vorhanden, aber in keiner API-Route aktiv aufgerufen; STD-040 (Rate-Limiting) hatte einen Syntax-Bug in rateLimitKey() (fehlende Template-Literal-Backticks).

### Umsetzung

- **STD-039 (CSRF) aktiviert:** validateCsrf() in allen 10 mutierenden API-Routen eingebaut (POST appointments, cancel, reschedule, login, logout, patienten-konten, PUT praxisregeln, POST/PUT/DELETE sprechzeiten, POST/DELETE sperrzeiten, POST/PUT/DELETE termintypen/admin, PUT zuordnungen).
- **STD-040 (rateLimitKey-Bugfix):** rateLimitKey() gibt jetzt Backticks+Prefix+IP+Path zurÃ¼ck.
- Backlog-Notizen fÃ¼r STD-039 und STD-040 aktualisiert (Stand 2026-07-13).

### Konsequenzen

- Alle 6 Teil-IDs von F-SICH-1 sind jetzt vollstÃ¤ndig implementiert.
- In-Memory Rate-Limiting wird bei Server-Neustart zurÃ¼ckgesetzt â€“ fÃ¼r Produktion auf Redis migrieren.
- CSRF-PrÃ¼fung lÃ¤uft jetzt fÃ¼r alle schreibenden API-Zugriffe (GET-Operationen bleiben ohne CSRF).


## 2026-07-13 - F-SICH-2: DSGVO & Opt-in implementiert

**Kontext:** F-SICH-2 umfasst fÃ¼nf Teil-IDs: Opt-in-Einwilligungen speichern (STD-042), Opt-in-PrÃ¼fung vor Nachrichtenversand (STD-043), BuchungsbestÃ¤tigung (STD-044), Terminerinnerung 24h (STD-045) und Storno-/UmbuchungsbestÃ¤tigung (STD-046). Die Felder einwilligungEmail und einwilligungSms waren bereits im Patient-Modell vorhanden.

### Umsetzung

- **STD-042 (Einwilligungen speichern/Ã¤ndern):** Neue API-Route PUT /api/patient/einwilligung, mit der Patient:innen ihre Opt-ins selbst Ã¤ndern kÃ¶nnen. PrÃ¼ft via validate() auf boolean-Werte.
- **STD-043 (Opt-in-PrÃ¼fung):** lib/notifications.ts enthÃ¤lt hatEinwilligung() und darfBenachrichtigen() â€“ beide prÃ¼fen das Opt-in-Flag + Vorhandensein der Kontaktdaten vor jedem Versand.
- **STD-044 (BuchungsbestÃ¤tigung):** sendeBuchungsbestaetigung() wird nach erfolgreicher Buchung in POST /api/appointments aufgerufen. Versucht zuerst E-Mail, falls kein Opt-in: SMS.
- **STD-045 (Terminerinnerung):** sendeTerminerinnerung(slotId) in lib/notifications.ts als bereitgestellte Logik fÃ¼r einen spÃ¤teren Cron-Job/Edge-Trigger. PrÃ¼ft Opt-in + Kontaktdaten.
- **STD-046 (Storno-/UmbuchungsbestÃ¤tigung):** sendeStornierungsbestaetigung() in /api/appointments/cancel, sendeUmbuchungsbestaetigung() in /api/appointments/reschedule. Jeweils nur bei vorhandenem Opt-in.
- **Frontend:** Neue Client-Komponente EinwilligungForm.tsx in /app/termine mit Checkboxen fÃ¼r E-Mail/SMS, in die Termine-Seite eingebunden. CSRF-geschÃ¼tzter PUT-Request.
- **sendeBenachrichtigung()** loggt alle Benachrichtigungen auf der Konsole (Mock â€“ in Produktion gegen E-Mail/SMS-Gateway austauschbar).

### Konsequenzen

- F-SICH-2: done (STD-042 bis STD-046: done)
- BestÃ¤tigungen werden nur bei gesetztem Opt-in versendet (BR5 eingehalten)
- Mock-Versand (console.log) muss fÃ¼r Produktion durch echtes E-Mail/SMS-Gateway ersetzt werden
- sendeTerminerinnerung ist als Funktion bereit, aber noch nicht an einen Cron-Job gebunden

## 2026-07-13 - F-SICH-3: PVS-Synchronisation implementiert

**Kontext:** F-SICH-3 umfasst sechs Teil-IDs: Sync-Logik vorbereiten (STD-047), Termin-Ã„nderungen an PVS melden (STD-048), PVS-Daten importieren (STD-049), Sync-Fehler protokollieren (STD-050), MFA bei Sync-Fehlern informieren (STD-051) und Wiederholungsrezept-Status (STD-052). Das PVS bleibt fÃ¼hrend fÃ¼r Stammdaten (BR5). Die offenen Punkte OP1-OP3 aus der Spec werden adressiert.

### Umsetzung

- **Datenmodell:** SyncLog (ereignis, referenz, status, fehlerMeldung, versuch) + Wiederholungsrezept (patientId, rezeptStatus, letzteAktualisierung). Migration 20260713195325_add_synclog_wiederholungsrezept.
- **Sync-Logik (STD-047, STD-049):** lib/pvs-sync.ts mit syncTerminBuchung/Stornierung/Umbuchung, importPatientAusPvs(), importRezeptAusPvs(), getSyncLogs(), countOffeneSyncs(). Alle Funktionen loggen via logSyncEintrag() ins SyncLog.
- **Termin-Sync (STD-048):** Sync in allen 3 Termin-Routen: POST /api/appointments, cancel und reschedule rufen sofort nach der Buchung/Stornierung/Umbuchung die entsprechende sync-Funktion auf (BR5).
- **Sync-Dashboard (STD-050, STD-051):** GET /api/pvs-sync gibt Logs + offeneSyncs zurÃ¼ck. POST /api/pvs-sync ermÃ¶glicht manuellen Patienten-Import. Neue Seite /praxis/pvs-sync mit SyncLogClient.tsx (Tabelle) und ManuellerImport.tsx. Navigation in /praxis ergÃ¤nzt.
- **Wiederholungsrezepte (STD-052):** Neues Prisma-Modell + API /api/wiederholungsrezepte (GET fÃ¼r Patient/Praxis, POST fÃ¼r MFA/Admin). Neue Seite /praxis/wiederholungsrezepte mit Status-Ãœbersicht.

### Offene Punkte aus Spec

- OP1 (Sync-Fehler): GelÃ¶st â€“ SyncLog speichert fehlgeschlagene Versuche inkl. Fehlermeldung.
- OP2 (PVS-Schnittstelle): Als Mock implementiert â€“ loggt auf Konsole, erweiterbar auf echte Schnittstelle.
- OP3 (MFA-Sichtbarkeit): GelÃ¶st â€“ Sync-Status-Seite fÃ¼r MFAs mit Fehlerliste und offeneSyncs-ZÃ¤hler.

### Konsequenzen

- F-SICH-3: done (STD-047 bis STD-052: done)
- BR5 eingehalten: Buchungen/Umbuchungen/Stornierungen werden sofort synchronisiert (Mock)
- SyncLog ermÃ¶glicht Nachvollziehbarkeit und Fehlerdiagnose
- In Produktion: Mock-Logs durch echte PVS-API-Aufrufe ersetzen
- Wiederholungsrezepte sind als read-only-View aus dem PVS konzipiert (PVS bleibt fÃ¼hrend)
## 2026-07-14 - F-BETR-1: Akutslots implementiert

**Kontext:** F-BETR-1 umfasst fÃ¼nf Teil-IDs: slotArt im Datenmodell (STD-053, bereits vorhanden), 8 Akutslots pro Tag (STD-054), MFA-Freigabe (STD-055), Online-Sperre (STD-056, bereits durch onlineBuchbar=false gedeckt) und Diensthabenden-Arzt-Zuweisung (STD-057).

### Entscheidung
- **Kein separates Datenmodell** fÃ¼r Akutslots: Das vorhandene TerminSlot-Modell hat bereits `slotArt` mit `"planbar"`/`"akut"` und wird Ã¼ber die API-Route `/api/akutslots` verwaltet.
- **Keine automatische tÃ¤gliche Generierung:** Akutslots werden nicht per Cron-Job automatisch erzeugt, sondern durch MFA manuell freigegeben (morgendliche TÃ¤tigkeit). Die API erzeugt bei Freigabe 8 Slots (4Ã—10 Min. vormittags, 4Ã—10 Min. nachmittags).
- **Arzt-Zuweisung** erfolgt im selben Schritt wie die Freigabe (Dropdown-Auswahl im UI).
- **Bereits vorhanden:** slotArt im Datenmodell (STD-053), Online-Buchbarkeitssperre fÃ¼r Akut (STD-056) waren bereits implementiert.

### Umgesetzt
- GET /api/akutslots â€“ Ãœbersicht Ã¼ber heutige Akutslots + Ã„rzt:innen-Liste
- POST /api/akutslots â€“ Freigabe mit arztId (legt 8 Slots an oder aktualisiert Arzt)
- /praxis/akutslots â€“ MFA/Admin-UI mit Freigabe-Formular und Live-Tabelle

### Alternativen verworfen
- Automatische tÃ¤gliche Generierung per Cron: verworfen, weil die morgendliche MFA-Freigabe als bewusster TÃ¤tigkeit gewÃ¼nscht ist (spec.md Â§7)
- Dediziertes Akutslot-Datenmodell: verworfen, slotArt im TerminSlot reicht aus

### Konsequenzen
- F-BETR-1: done (STD-053 bis STD-057: done)
- MFAs haben ein klares UI fÃ¼r die morgendliche Freigabe
- Akutslots erscheinen nirgendwo in der Online-Buchung
- Bei Arzt-Ausfall (F-BETR-4) kÃ¶nnen Akutslots Ã¼ber den Status gesperrt werden
## 2026-07-17 - F-BETR-2: No-Show-Tracking implementiert

**Kontext:** F-BETR-2 umfasst fÃ¼nf Teil-IDs: No-Show erfassen (STD-058), Erinnerung bei 2. No-Show (STD-059), Sperre bei 3. No-Show (STD-060), No-Show in Patientenakte (STD-061) und Aufhebung von Sperren (STD-062). Die Business-Logik in lib/no-show.ts war bereits vorimplementiert, aber API-Routen und Praxis-UI fehlten.

### Entscheidung
- **Bestehende Logik unverÃ¤ndert Ã¼bernommen:** lib/no-show.ts mit erfasseNoShow(), sendeNoShowErinnerung(), sperrePatientOnlineBuchung(), entSperrePatientOnlineBuchung(), getNoShowUebersicht() und getNoShowInfoFuerPatient() blieb unangetastet.
- **Neue API-Routen:** GET /api/noshow/slots (heutige gebuchte, vergangene Slots), POST /api/noshow/mark (No-Show-Markierung lÃ¶st Erinnerung/Sperre aus). Bestehendes POST /api/noshow (Entsperren) unverÃ¤ndert.
- **Praxis-UI:** /praxis/noshow mit zwei Tabs: "No-Show markieren" (Tabelle mit Markier-Button) und "Ãœbersicht" (alle Patienten mit No-Shows inkl. Entsperren-Button fÃ¼r gesperrte).
- **Sperren-Aufhebung (OP4):** Manuell durch MFA/Admin, nicht automatisch. Entsperren setzt auch den No-Show-ZÃ¤hler zurÃ¼ck.

### Alternativen verworfen
- Automatische Aufhebung nach Zeit: verworfen, da spec.md OP4 explizit offen lÃ¤sst und manuelle Kontrolle fÃ¼r die Praxis sicherer ist.

### Konsequenzen
- F-BETR-2: done (STD-058 bis STD-062: done)
- MFAs haben eine zentrale No-Show-Seite zum Erfassen, Anzeigen und Entsperren
- Erinnerungs- und Sperrlogik laufen automatisch in erfasseNoShow() (BR4 eingehalten)
- OP4 (manuelle vs. automatische Aufhebung) wurde entschieden: manuell
- Bei Produktionseinsatz: Mock-Benachrichtigungen durch echten E-Mail/SMS-Versand ersetzen

## 2026-07-18 - Debugging: Login- und Buchungsflow repariert

**Kontext:** Nach den letzten Feature-Erweiterungen war die App end-to-end nicht mehr nutzbar - Login schlug fehl, keine freien Slots wurden angezeigt, Buchung endete mit Serverfehler. Fehlerkette wurde eingegrenzt und behoben.

### Umsetzung
- **CSRF app-weit inaktiv:** `getCsrfToken()` wurde nirgends aufgerufen, Cookie fehlte, `validateCsrf()` lehnte jede Anfrage ab. Neue Route `GET /api/csrf` ergÃ¤nzt, Token-Abruf in 11 Dateien nachgerÃ¼stet; `/api/csrf` zusÃ¤tzlich in `PUBLIC_ROUTES` (middleware.ts) aufgenommen.
- **Logout-Bug:** `validateCsrf()` erhielt einen leeren Fake-Request statt der echten Anfrage, Logout schlug daher immer fehl. Fix: echten Request durchgereicht.
- **Fehlende TerminSlots:** Seed-Skript definierte Beispiel-Slots, schrieb sie aber nie in die DB. Fix: echte Slot-Generierung fÃ¼r 32 Tage basierend auf Sprechzeiten.
- **Zeitzonen-Mismatch:** Slots wurden mit lokaler statt UTC-Mitternacht gespeichert, Abfrage fand dadurch nie Treffer. Fix: Seed auf `Date.UTC(...)` umgestellt.
- **Fehlerhaftes Zeitformat beim Buchen:** Frontend sendete vollen ISO-Zeitstempel statt `HH:MM`; `bucheOnlineTermin()` kombinierte Datum+Uhrzeit zudem nicht korrekt (`Invalid Date`). Beides gefixt.
- **Encoding-Bug:** `lib/notifications.ts` war als UTF-16LE statt UTF-8 gespeichert, Build schlug fehl. Als UTF-8 neu gespeichert.

### Konsequenzen
- Login, Terminbuchung (F-KERN-3) und No-Show-Tracking (F-BETR-2) sind jetzt end-to-end getestet, nicht nur laut Backlog-Status "done".
- LÃ¼cke entdeckt: F-BETR-3 (Tageslisten, STD-063â€“068) ist `hypo`, noch nicht umgesetzt - MFA/Arzt sehen aktuell keine gebuchten Termine.
- Lektion: "done" im Backlog garantiert kein funktionierendes Zusammenspiel - regelmÃ¤ÃŸige End-to-End-Tests vor dem nÃ¤chsten Feature sinnvoll.
## 2026-07-18 - F-BETR-3: Tageslisten (STD-063 & STD-064) implementiert

**Kontext:** F-BETR-3 umfasst sechs Teil-IDs fÃ¼r tÃ¤gliche Ãœbersichten. STD-063 (MFA-Tagesliste) und STD-064 (Arzt-Tagesliste) wurden als erste umgesetzt. Die Spec in Â§13 fordert eine Auflistung aller gebuchten Termine mit Uhrzeit, Patient:in, Arzt, Termintyp und Buchungsweg.

### Entscheidung
- **Gemeinsame API-Route:** GET /api/tagesliste mit optionalem rztId- und datum-Query-Parameter. FÃ¼r MFA/Admin (requireMfaOrAdmin) zugÃ¤nglich. Filtert 	erminSlot.findMany nach status="gebucht" und Datum (Default: heute).
- **Gemeinsame UI-Seite:** Eine Seite /praxis/tagesliste mit DatumswÃ¤hler und Arzt-Dropdown. MFA/Admin sehen alle Termine (STD-063) und kÃ¶nnen Ã¼ber das Dropdown auf einen bestimmten Arzt filtern (STD-064).
- **Arzt-Login fehlt aktuell:** Ã„rzte sind als Arzt-Modell in Prisma abgebildet, haben aber keinen eigenen PraxisNutzer-Eintrag und damit keinen Login. Die Rolle "Arzt" ist in lib/constants.ts definiert, wird aber weder im Seed noch im Login unterstÃ¼tzt. Bis dahin wird STD-064 Ã¼ber das Arzt-Dropdown in der MFA-Ansicht abgedeckt.

### Alternativen verworfen
- Zwei separate Seiten (eine fÃ¼r MFA, eine fÃ¼r Ã„rzte): verworfen, weil die Ansicht identisch ist und nur der Filter variiert.
- Eigene API-Route pro Rolle: verworfen, eine generische Route mit Query-Parametern reicht.

### Konsequenzen
- STD-063 und STD-064 sind umgesetzt (done). Feature F-BETR-3 auf in-progress (STD-065 bis STD-068 folgen).
- Sobald Ã„rzte einen eigenen Login bekommen, muss /praxis/tagesliste um eine automatische Vorfilterung ergÃ¤nzt werden (Arzt sieht nur eigene Termine).
- Buchungsweg wird aus dem uchungsquelle-Feld von TerminSlot ausgelesen und als Label (Online/Telefonisch/Intern) in der Tabelle dargestellt.
## 2026-07-20 - F-BETR-3: Tageslisten & Ãœbersichten (STD-065 bis STD-068) fertiggestellt

**Kontext:** F-BETR-3 umfasst sechs Teil-IDs. STD-063/064 waren bereits implementiert. Es fehlten STD-065 (MFA sieht offene Wiederholungsrezepte), STD-066 (Arzt sieht offene Rezeptfreigaben), STD-067 (MFA sieht freie Akutslots live) und STD-068 (MFA sieht gesperrte Patient:innen).

### Entscheidungen

**STD-065 (Wiederholungsrezepte-Ãœbersicht):**
- Seite `/praxis/wiederholungsrezepte` existierte bereits als Server Component mit Prisma-Direktzugriff. Wurde in der Praxis-Navigation unter "Ãœbersichten (Tagesliste & Live)" verlinkt. Keine Ã„nderung an der Seite nÃ¶tig.

**STD-066 (Offene Rezeptfreigaben fÃ¼r Ã„rzt:innen):**
- Neue API-Route `GET/PATCH /api/rezeptfreigaben` mit Guard fÃ¼r Rolle "Arzt" und "Admin".
- Separate Seite `/praxis/rezeptfreigaben` als Client Component mit Freigeben/Ablehnen-Buttons.
- `PATCH` statt `POST` fÃ¼r idempotente StatusÃ¤nderung (ausstehend â†’ abholbereit / abgeholt).
- In der Praxis-Navigation unter neuer Sektion "Ã„rztliche Aufgaben" verlinkt â€“ sichtbar nur fÃ¼r Ã„rzt:innen und Admins.

**STD-067 (Freie Akutslots live):**
- Neue API-Route `GET /api/akutslots-live` (schlanker als die bestehende Volldaten-Route `/api/akutslots` â€“ nur freie Slots, kein Patient/Arzt-Detail).
- Neue Seite `/praxis/akutslots-live` mit Live-Liste der ungebuchten Akutslots fÃ¼r heute.
- In der Navigation unter "Ãœbersichten" verlinkt.

**STD-068 (Gesperrte Patient:innen):**
- Neue API-Route `GET /api/gesperrte-patienten` mit Join Ã¼ber PatientenKonto (buchungsStatus="gesperrt").
- Neue Seite `/praxis/gesperrte-patienten` mit Tabelle inkl. No-Show-ZÃ¤hler, Erstelldatum und letztem Login.
- Entsperrung erfolgt weiterhin Ã¼ber das bestehende No-Show-Tracking; die Seite verlinkt dorthin.

**CSS-Utility-Klassen:** Fehlende Klassen (`.table`, `.badge`, `.btn`, `.alert`, `.empty-state`, `.loading`) wurden in `globals.css` ergÃ¤nzt. Diese werden von mehreren Seiten genutzt (No-Show, Akutslots, Tagesliste, neue Seiten), waren aber bisher nirgends definiert.

### Alternativen verworfen
- STD-066 GET und PATCH in die bestehende `/api/wiederholungsrezepte` zu integrieren: verworfen, weil dort bereits GET (alle Rezepte fÃ¼r Patienten) und POST (PVS-Import) belegt sind â€“ eigene Route ist sauberer.
- CSS-Utility-Klassen per CSS-Module oder Tailwind: verworfen, das Projekt nutzt durchgÃ¤ngig globals.css â€“ konsistent bleiben.

### Konsequenzen
- F-BETR-3 ist vollstÃ¤ndig (alle sechs STDs done).
- Ã„rzt:innen haben mit STD-066 und der neuen Sektion in der Navigation erstmals einen eigenen Arbeitsbereich in der App.
- Die bislang undefinierten Utility-Klassen in globals.css werden nun von allen bestehenden und neuen Seiten korrekt gerendert.
- MFAs haben zentrale Einstiegspunkte fÃ¼r Tagesliste, Live-Akutslots, gesperrte Patient:innen und Wiederholungsrezepte.
## 2026-07-20 - F-BETR-4: Arzt-Ausfall implementiert

**Kontext:** F-BETR-4 umfasst vier Teil-IDs fÃ¼r den Umgang mit kurzfristigem Arzt-Ausfall: Akutslots sperren (STD-069), betroffene Termine anzeigen (STD-070), Termine als umbuchungErforderlich markieren (STD-071) und Liste betroffener Patient:innen erzeugen (STD-072).

### Entscheidungen

**Gemeinsame API-Route:**
- GET /api/arzt-ausfall?arztId=xxx&von=YYYY-MM-DD&bis=YYYY-MM-DD â€“ Vorschau der betroffenen Akutslots, geplanten Termine und Patient:innen. Zugriff via 
equireMfaOrAdmin.
- POST /api/arzt-ausfall â€“ FÃ¼hrt den Ausfall-Workflow in einem transaktionalen Schritt aus:
  1. Akutslots des Arztes im Zeitraum werden auf "gesperrt" gesetzt
  2. Planbare Termine mit Status "gebucht" werden auf "umbuchungErforderlich" gesetzt
  3. Ein Sperrzeit-Eintrag mit Grund "Krankheit" wird automatisch angelegt

**UI-Seite /praxis/arzt-ausfall:**
- Client Component mit drei Phasen: Arzt/Datum wÃ¤hlen â†’ Vorschau betroffener Termine â†’ BestÃ¤tigung mit Warnhinweis
- Zeigt getrennte Tabellen fÃ¼r Akutslots, geplante Termine und betroffene Patient:innen
- Zweistufiger BestÃ¤tigungsprozess (Button â†’ roter BestÃ¤tigungsdialog) verhindert versehentliche AuslÃ¶sung

**Navigation:**
- Neuer Bereich "Arzt-Ausfall" in der Praxis-Startseite fÃ¼r MFAs/Admins, sichtbar zwischen "Akutslots" und "No-Show-Tracking"

### Alternativen verworfen
- Automatische Erkennung ohne manuelle AuslÃ¶sung: verworfen, weil der Ausfall von MFAs erkannt und bestÃ¤tigt werden muss (Spec Â§15)
- Integration in bestehende Sperrzeiten-Seite: verworfen, weil der Workflow umfangreicher ist (Termin-Markierung + Patient:innen-Liste)
- Vollautomatische Umbuchung: verworfen, Spec Â§3 und Â§15 schreiben MFAs als Entscheider:innen vor

### Konsequenzen
- F-BETR-4 ist vollstÃ¤ndig (alle vier STDs done).
- MFAs haben einen zentralen Einstiegspunkt fÃ¼r Arzt-AusfÃ¤lle mit Vorschau und BestÃ¤tigung.
- Akutslots werden gesperrt statt gelÃ¶scht (Status bleibt sichtbar).
- Betroffene Patient:innen werden dedupliziert als Liste ausgegeben.
- Die bestehende Sperrzeiten-Ãœbersicht zeigt den erzeugten Eintrag mit Grund "Krankheit".

## 2026-07-21 - Rolle Admin in UI als \"Arzt/Admin\" angezeigt

**Kontext:** Die Rolle \"Admin\" (PraxisNutzer mit Rolle=Admin) wurde im Dashboard und in der Navigation nur als \"Admin\" angezeigt. Fachlich ist Admin aber keine getrennte Rolle von \"Arzt\", sondern ein Admin hat auch arzttypische Rechte. Die Bezeichnung \"Admin\" allein war missverstaendlich.

### Entscheidung

- Der Anzeigetext für die Rolle \"Admin\" wird ueberall in der UI auf **\"Arzt/Admin\"** geaendert.
- Eingefuehrt wurde eine zentrale Hilfsfunktion olleAnzeige() in lib/rollen.ts, die den internen Wert ("Admin") auf den Anzeigetext ("Arzt/Admin") abbildet. Andere Rollen (MFA, Arzt) geben ihren Wert unveraendert zurueck.
- Der interne Rollenwert in lib/constants.ts (ROLLE.ADMIN = \"Admin\") sowie saemtliche Berechtigungspruefungen (istAdmin(), istMfaOderAdmin()) bleiben unveraendert.

### Alternativen verworfen

- Den internen Wert selbst aendern: verworfen, weil das Datenbank-Eintraege, Seed und Berechtigungslogik brechen wuerde.
- Hardcoded-Strings an jeder Stelle ersetzen: verworfen, zentrale Funktion ist wartbarer bei zukuenftigen Rollen-Aenderungen.

### Konsequenzen

- Admins sehen sich in der UI als \"Arzt/Admin\", was ihre Doppelrolle klarer macht.
- Bei zukuenftigen Rollen-Aenderungen muss nur olleAnzeige() erweitert werden.
- Die Login-Hilfetexte wurden ebenfalls auf \"Arzt/Admin\" aktualisiert.

