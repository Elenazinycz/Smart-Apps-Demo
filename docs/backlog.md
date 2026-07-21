# backlog.md - Smart-Apps-Demo

_Stand: 2026-07-20_

_Stabile Feature-IDs. Nicht umnummerieren. Killed-IDs bleiben killed._

---

## Konvention

- **ID-Schema:** `STD-NNN`
- **Prefix:** `STD` fuer Smart-Apps-Demo
- **Feature-ID-Schema:** `F-{PHASE}-NN` (z. B. `F-KERN-1`)
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
| `killed` | Verworfen oder bewusst out of scope, Begruendung in `decisions.md` oder Spec |

## Phasen

| Phase | Fokus |
|---|---|
| Kern | Minimal nutzbare Terminbuchung fuer Stammpatient:innen |
| Verwaltung | Pflege von Regeln, Stammdaten-Sichten und Praxisprozessen |
| Sicherheit & Sync | DSGVO, PVS-Synchronisation, Fehlervermeidung |
| Betrieb | Tagesuebersichten, Ausnahmefaelle und Unterstuetzung fuer MFAs/Aerzt:innen |
| v1.1 | Nice-to-have nach Version 1 |
| Out of Scope | Bewusst nicht bauen |

---

## Phase: Kern

### F-KERN-1: Datenmodelle Kern
| ID | Name | Phase | Feature | Status | Quelle | Notiz |
|---|---|---|---|---|---|---|
| STD-001 | PatientenKonto-Datenmodell | Kern | F-KERN-1 | done | docs/spec.md 4.2 | Implementiert in `prisma/schema.prisma` und Migration `20260626143205_init`; Konto mit Patientenzuordnung, Login-Name, Passwort-Hash, Erstelldaten, Buchungsstatus und letztem Login |
| STD-006 | TerminSlot-Datenmodell | Kern | F-KERN-1 | done | docs/spec.md 4.6 | Slot mit Datum, Start, Ende, Status, Slot-Art, Buchungsquelle, Patient, Arzt und Termintyp |
| STD-007 | Termintyp-Datenmodell | Kern | F-KERN-1 | done | docs/spec.md 4.5 | Termintyp mit Dauer, Online-Buchbarkeit, Beschreibung und Prioritaet |
| STD-010 | Arzt-Datenmodell | Kern | F-KERN-1 | done | docs/spec.md 4.3 | Arzt mit Fachrichtung, Zusatzqualifikation und Aktivstatus |
| STD-011 | Arzt-Termintyp-Zuordnung | Kern | F-KERN-1 | done | docs/spec.md 4.8, 8 | N:M-Zuordnung zwischen Aerzt:innen und Termintypen mit Online-Erlaubnis und Aktivstatus |
| STD-015 | Buchungsquelle speichern | Kern | F-KERN-1 | done | docs/spec.md 4.6, 12 | TerminSlot speichert online, telefonisch oder intern als Buchungsweg |

### F-KERN-2: Login & Berechtigung
| ID | Name | Phase | Feature | Status | Quelle | Notiz |
|---|---|---|---|---|---|---|
| STD-003 | Stammpatienten-Login | Kern | F-KERN-2 | done | docs/spec.md 3, BR1 | Nur Stammpatient:innen mit aktivem PatientenKonto duerfen online buchen |
| STD-004 | Self-Registration verhindern | Kern | F-KERN-2 | done | docs/spec.md 3, BR1 | Patientenkonten werden durch MFA/Admin angelegt, nicht durch Patient:innen selbst |
| STD-005 | Buchungsberechtigung pruefen | Kern | F-KERN-2 | done | docs/spec.md BR1, 14 | Vor jeder Buchung muss die Identifikation und Kontoaktivitaet geprueft werden |

### F-KERN-3: Buchungslogik & Slot-Anzeige
| ID | Name | Phase | Feature | Status | Quelle | Notiz |
|---|---|---|---|---|---|---|
| STD-008 | Planbare Online-Termintypen erlauben | Kern | F-KERN-3 | done | docs/spec.md 5, BR2 | Vorsorge, Beratung, Impfung/Reisemedizin und Wiederholungsrezept-Abholung via istOnlineBuchbar() + Arzt-Freigabe; lib/slots.ts, app/api/termintypen/route.ts, app/api/aerzte/route.ts |
| STD-009 | Nicht online buchbare Termintypen sperren | Kern | F-KERN-3 | done | docs/spec.md 5, BR2 | ONLINE_BUCHBARE_TYPEN-Whitelist in lib/slots.ts blockiert Akut, Blutabnahme, Erstgespraech; API gibt nur online-buchbare Typen zurück |
| STD-012 | Online-Termin verbindlich buchen | Kern | F-KERN-3 | done | docs/spec.md 3, BR4 | bucheOnlineTermin() in lib/slots.ts: Slot-Status sofort auf "gebucht" + patientId + buchungsquelle=online; API POST /api/appointments
| STD-013 | Freie Slots anzeigen | Kern | F-KERN-3 | done | docs/spec.md 2, 9 | getFreieSlots() in lib/slots.ts: Slots via /api/slots mit Sperrzeiten-Filter; BuchungsFormular.tsx zeigt Auswahl; Doppelbuchung durch Slot-Status-Prüfung verhindert
| STD-014 | Doppelbuchung technisch verhindern | Kern | F-KERN-3 | done | docs/spec.md 2, BR3, 14 | findFirst mit status=frei + atomares update; Slot-Sperre verhindert parallele Buchungen; DB-Index auf datum+arztId+status

### F-KERN-4: Eigene Termine verwalten
| ID | Name | Phase | Feature | Status | Quelle | Notiz |
|---|---|---|---|---|---|---|
| STD-002 | Patientendaten anzeigen | Kern | F-KERN-4 | done | docs/spec.md 4.1, 12 | Patientendaten mit Versicherungsart, Kontaktdaten, Opt-ins, No-Show-Zaehler und Status; PVS bleibt fuehrend |
| STD-016 | Eigene Termine fuer Patient:innen anzeigen | Kern | F-KERN-4 | done | docs/spec.md 11 | Patient:innen koennen eigene Online-Termine einsehen |
| STD-017 | Online-Stornierung bis 24h vorher | Kern | F-KERN-4 | done | docs/spec.md 2, 3, BR4 | Patient:innen koennen eigene Termine bis 24 Stunden vorher stornieren |
| STD-018 | Online-Umbuchung bis 24h vorher | Kern | F-KERN-4 | done | docs/spec.md 2, 3, BR4 | Patient:innen koennen eigene Termine bis 24 Stunden vorher umbuchen |
| STD-019 | Rechtzeitige Stornierung nicht als No-Show zaehlen | Kern | F-KERN-4 | done | docs/spec.md 16 | Stornierungen innerhalb der Regel zaehlen nicht als No-Show |

---

## Phase: Verwaltung

### F-VERW-1: Nutzer & Rollen
| ID | Name | Phase | Feature | Status | Quelle | Notiz |
|---|---|---|---|---|---|---|
| STD-020 | PraxisNutzer-Datenmodell | Verwaltung | F-VERW-1 | done | docs/spec.md 4.4 | Nutzer mit Rolle MFA, Arzt oder Admin, Dienstmail, Aktivstatus und Berechtigungen |
| STD-021 | Rollen und Berechtigungen umsetzen | Verwaltung | F-VERW-1 | done | docs/spec.md 11 | Patient:in, MFA, Arzt/Aerztin und Admin erhalten getrennte Rechte |
| STD-022 | MFA/Admin kann PatientenKonten anlegen | Verwaltung | F-VERW-1 | done | docs/spec.md 4.2, 11 | Kontoerstellung wird mit erstellendem PraxisNutzer dokumentiert |
| STD-035 | Admin kann Termintyp-Arzt-Zuordnung verwalten | Verwaltung | F-VERW-1 | done | docs/spec.md 11 | Nur Admin darf Zuordnungen aendern |

### F-VERW-2: Sprechzeiten & Sperrzeiten
| ID | Name | Phase | Feature | Status | Quelle | Notiz |
|---|---|---|---|---|---|---|
| STD-023 | Admin kann Sprechzeiten verwalten | Verwaltung | F-VERW-2 | done | docs/spec.md 6, 11 | Sprechzeiten pro Wochentag und Arzt pflegbar |
| STD-024 | Sprechzeiten-Datenmodell | Verwaltung | F-VERW-2 | done | docs/spec.md 4.7, 6 | Modell fuer regelbasierte Sprechzeiten pro Wochentag, Arzt und Schicht |
| STD-025 | Sperrzeit-Datenmodell | Verwaltung | F-VERW-2 | done | docs/spec.md 4.7 | Sperrzeit mit Titel, Datumsbereich, Zeitbereich, betrifft, Grund und Ersteller |
| STD-026 | Sperrzeiten durch Admin verwalten | Verwaltung | F-VERW-2 | done | docs/spec.md 11 | CRUD fuer Sperrzeiten durch Admin |
| STD-027 | Arzt kann eigene Abwesenheiten eintragen | Verwaltung | F-VERW-2 | done | docs/spec.md 11 | Arzt/Aerztin darf Urlaub/Krankheit selbst eintragen |
| STD-028 | Sperrzeiten bei Terminbuchung pruefen | Verwaltung | F-VERW-2 | done | docs/spec.md 14, BR3 | Buchung trotz Praxisschliessung oder Arzt-Urlaub verhindern |
| STD-029 | Mittagspause als Sperrzeit abbilden | Verwaltung | F-VERW-2 | done | docs/spec.md 6 | Mittagspause (13:00-14:00) ueber Sperrzeit-Modell abgedeckt |

### F-VERW-3: Termintypen & Arzt-Zuordnung
| ID | Name | Phase | Feature | Status | Quelle | Notiz |
|---|---|---|---|---|---|---|
| STD-030 | Termintypen durch Admin verwalten | Verwaltung | F-VERW-3 | done | docs/spec.md 11 | CRUD fuer Termintypen |
| STD-031 | Admin kann Arzt-Termintyp-Zuordnung pflegen | Verwaltung | F-VERW-3 | done | docs/spec.md 4.8, 11 | Zuordnung mit Online-Erlaubnis und Aktivstatus |
| STD-032 | Nur aktive Zuordnungen bei Buchung beruecksichtigen | Verwaltung | F-VERW-3 | done | docs/spec.md 4.8 | Inaktive Zuordnungen duerfen nicht zur Buchung angeboten werden |
| STD-033 | Sperrzeit-Grund standardisieren | Verwaltung | F-VERW-3 | done | docs/spec.md 4.7 | Gruende: Urlaub, Krankheit, Fortbildung, Feiertag, Brueckentag, Mittagspause |
| STD-034 | Admin kann Praxisregeln verwalten | Verwaltung | F-VERW-3 | done | docs/spec.md 11 | Zentrale Konfiguration fuer Buchungsfristen, No-Show-Grenzen etc. |

---

## Phase: Sicherheit & Sync

### F-SICH-1: Authentifizierung & Schutz
| ID | Name | Phase | Feature | Status | Quelle | Notiz |
|---|---|---|---|---|---|---|
| STD-036 | JWT-Session-Sicherheit (ENV-Secret + Issuer/Audience) | Sicherheit & Sync | F-SICH-1 | done | docs/spec.md 14 | lib/auth.ts: JWT mit ENV.JWT_SECRET (Fallback nur dev), Issuer/Audience-Validation, timingSafeVerify; .env um JWT_SECRET ergänzt |
| STD-037 | Session-Timeout (24h) + Expiry-Check | Sicherheit & Sync | F-SICH-1 | done | docs/spec.md 14 | lib/auth.ts: 24h-Expiration via setExpirationTime, isTokenExpiringSoon() prüft Restlaufzeit; Cookie maxAge=86400 |
| STD-038 | Rollenbasierte API-Guards (zentral) | Sicherheit & Sync | F-SICH-1 | done | docs/spec.md 11, 14 | lib/api-guard.ts: requireAuth/requirePatient/requirePraxis/requireAdmin/requireMfaOrAdmin; alle API-Routen umgestellt |
| STD-039 | CSRF-Schutz (Double-Submit-Cookie) | Sicherheit & Sync | F-SICH-1 | done | docs/spec.md 14 | lib/csrf.ts: Double-Submit-Cookie-Pattern mit crypto.timingSafeEqual; validateCsrf() in allen 10 mutierenden API-Routen aktiviert (POST/PUT/DELETE) |
| STD-040 | Rate-Limiting (Login + API) | Sicherheit & Sync | F-SICH-1 | done | docs/spec.md 14 | lib/rate-limit.ts: In-Memory-Fenster pro IP+Route; /api/login: 10/Minute, Default: 30/Minute; rateLimitKey()-Bug gefixt (fehlende Template-Literal-Backticks) |
| STD-041 | Input-Validierung & Sanitization | Sicherheit & Sync | F-SICH-1 | done | docs/spec.md 14 | lib/validate.ts: Typ-, Längen-, Enum-, Pattern-Prüfung; UUID/Datum/Zeit-Formatter; ValidationError-Klasse; alle mutierenden APIS umgestellt |

### F-SICH-2: DSGVO & Opt-in
| ID | Name | Phase | Feature | Status | Quelle | Notiz |
|---|---|---|---|---|---|---|
| STD-042 | Opt-in-Einwilligungen speichern/Ã¤ndern | Sicherheit & Sync | F-SICH-2 | done | docs/spec.md 4.1, 10 | EinwilligungEmail/einwilligungSms im Patient-Modell (bereits vorhanden); PUT /api/patient/einwilligung zum Ã„ndern durch Patient:in |
| STD-043 | Opt-in vor Nachrichtenversand prÃ¼fen | Sicherheit & Sync | F-SICH-2 | done | docs/spec.md 5, 10, BR5 | lib/notifications.ts: darfBenachrichtigen() prÃ¼ft Opt-in + Kontaktdaten vor jedem Versand |
| STD-044 | BuchungsbestÃ¤tigung per E-Mail/SMS | Sicherheit & Sync | F-SICH-2 | done | docs/spec.md 10 | sendeBuchungsbestaetigung() in appointments/route.ts nach erfolgreicher Buchung; nur mit Opt-in |
| STD-045 | Terminerinnerung 24h vorher senden | Sicherheit & Sync | F-SICH-2 | done | docs/spec.md 10, BR4 | sendeTerminerinnerung() in lib/notifications.ts (fÃ¼r Cron-Job/Edge); prÃ¼ft Opt-in + Kontaktdaten |
| STD-046 | Storno-/UmbuchungsbestÃ¤tigung senden | Sicherheit & Sync | F-SICH-2 | done | docs/spec.md 10 | sendeStornierungsbestaetigung() in cancel/route.ts + sendeUmbuchungsbestaetigung() in reschedule/route.ts; nur mit Opt-in |

### F-SICH-3: PVS-Synchronisation
| ID | Name | Phase | Feature | Status | Quelle | Notiz |
|---|---|---|---|---|---|---|
| STD-047 | Synchronisationslogik vorbereiten | Sicherheit & Sync | F-SICH-3 | done | docs/spec.md 12, OP1, OP2 | lib/pvs-sync.ts: Sync-Funktionen mit SyncLog-EintrÃ¤gen; erweiterbar auf echte PVS-Schnittstelle |
| STD-048 | Termin-Ã„nderungen an PVS melden | Sicherheit & Sync | F-SICH-3 | done | docs/spec.md BR5, 12 | syncTerminBuchung/Stornierung/Umbuchung in allen 3 Termin-Routen; sofort nach Buchung/Storno/Umbuchung |
| STD-049 | PVS-Daten importieren | Sicherheit & Sync | F-SICH-3 | done | docs/spec.md 12, OP2 | importPatientAusPvs() + importRezeptAusPvs() in lib/pvs-sync.ts (Mock); manueller Import Ã¼ber /api/pvs-sync |
| STD-050 | Synchronisationsfehler protokollieren | Sicherheit & Sync | F-SICH-3 | done | docs/spec.md OP1, OP3 | SyncLog-Modell + logSyncEintrag(); Fehler werden mit Status und Meldung gespeichert |
| STD-051 | MFA bei Sync-Fehlern informieren | Sicherheit & Sync | F-SICH-3 | done | docs/spec.md OP3 | /praxis/pvs-sync mit SyncLogClient.tsx zeigt Fehler-Liste; offeneSyncs-ZÃ¤hler im Header |
| STD-052 | Wiederholungsrezept-Status aus PVS anzeigen | Sicherheit & Sync | F-SICH-3 | done | docs/spec.md 12 | Wiederholungsrezept-Modell + /api/wiederholungsrezepte + /praxis/wiederholungsrezepte-Ãœbersicht |

---

## Phase: Betrieb

### F-BETR-1: Akutslots
| ID | Name | Phase | Feature | Status | Quelle | Notiz |
|---|---|---|---|---|---|---|
| STD-053 | Akutslot-Daten und Slot-Art abbilden | Betrieb | F-BETR-1 | done | docs/spec.md 4.6, 7 | Slots unterscheiden planbar und akut |
| STD-054 | Acht Akutslots pro Tag verwalten | Betrieb | F-BETR-1 | done | docs/spec.md 7 | 4 vormittags, 4 nachmittags |
| STD-055 | MFA kann Akutslots morgens freigeben | Betrieb | F-BETR-1 | done | docs/spec.md 7, 11 | Freigabe und Zuordnung zum diensthabenden Arzt durch MFA |
| STD-056 | Akutslots nicht online buchbar machen | Betrieb | F-BETR-1 | done | docs/spec.md 7, BR2 | Akutfallentscheidung bleibt telefonische MFA-Triage |
| STD-057 | Diensthabenden Arzt fuer Akutslots zuweisen | Betrieb | F-BETR-1 | done | docs/spec.md 7 | Informelle Rotation wird durch manuelle Zuweisung abgebildet |

### F-BETR-2: No-Show-Tracking
| ID | Name | Phase | Feature | Status | Quelle | Notiz |
|---|---|---|---|---|---|---|
| STD-058 | No-Show-Zaehler fuehren | Betrieb | F-BETR-2 | done | docs/spec.md 4.1, 16 | erfasseNoShow() in lib/no-show.ts; POST /api/noshow/mark; UI in /praxis/noshow |
| STD-059 | Erinnerung bei zweitem No-Show ausloesen | Betrieb | F-BETR-2 | done | docs/spec.md BR4, 16 | sendeNoShowErinnerung() in erfasseNoShow(); Opt-in-Pruefung; Mock-Versand |
| STD-060 | Online-Buchung ab drittem No-Show sperren | Betrieb | F-BETR-2 | done | docs/spec.md BR4, 16 | sperrePatientOnlineBuchung() in erfasseNoShow(); entsperrbar via POST /api/noshow |
| STD-061 | No-Show-Sperren manuell setzen | Betrieb | F-BETR-2 | done | docs/spec.md 11 | getNoShowInfoFuerPatient() und getNoShowUebersicht() in lib/no-show.ts; /praxis/noshow Uebersicht-Tab |
| STD-062 | Aufhebung von No-Show-Sperren klaeren | Betrieb | F-BETR-2 | done | docs/spec.md 18 OP4 | entSperrePatientOnlineBuchung() in lib/no-show.ts; Entsperren-Button in UI; Entscheidung: manuell (siehe decisions.md) |

### F-BETR-3: Tageslisten & Uebersichten
| ID | Name | Phase | Feature | Status | Quelle | Notiz |
|---|---|---|---|---|---|---|
| STD-063 | MFA-Tagesliste anzeigen | Betrieb | F-BETR-3 | done | docs/spec.md 13 | Alle Termine mit Uhrzeit, Patient:in, Arzt, Termintyp und Buchungsweg. Commit: 89af197 |
| STD-064 | Arzt-Tagesliste anzeigen | Betrieb | F-BETR-3 | done | docs/spec.md 13 | Aerzt:innen sehen standardmaessig nur eigene Termine (via Arzt-Filter). Commit: 89af197 |
| STD-065 | MFA sieht offene Wiederholungsrezepte | Betrieb | F-BETR-3 | done | docs/spec.md 13 | Uebersicht fuer interne Rezeptbearbeitung; Verlinkung in /praxis |
| STD-066 | Arzt sieht offene Rezeptfreigaben | Betrieb | F-BETR-3 | done | docs/spec.md 13 | Seite /praxis/rezeptfreigaben mit Freigabe/Ablehnen |
| STD-067 | MFA sieht freie Akutslots live | Betrieb | F-BETR-3 | done | docs/spec.md 13 | Seite /praxis/akutslots-live mit Live-Uebersicht |
| STD-068 | MFA sieht gesperrte Patient:innen | Betrieb | F-BETR-3 | done | docs/spec.md 13 | Seite /praxis/gesperrte-patienten mit Uebersicht |

### F-BETR-4: Arzt-Ausfall
| ID | Name | Phase | Feature | Status | Quelle | Notiz |
|---|---|---|---|---|---|---|
| STD-069 | Akutslots bei kurzfristigem Arzt-Ausfall sperren | Betrieb | F-BETR-4 | done | docs/spec.md 15 | POST /api/arzt-ausfall sperrt Akutslots im Zeitraum; Seite /praxis/arzt-ausfall mit Vorschau und Bestaetigung|
| STD-070 | Betroffene Termine bei Arzt-Ausfall anzeigen | Betrieb | F-BETR-4 | done | docs/spec.md 13, 15 | GET /api/arzt-ausfall liefert akutSlots + geplanteTermine + patienten; Vorschau vor Ausfuehrung|
| STD-071 | Termine als umbuchungErforderlich markieren | Betrieb | F-BETR-4 | done | docs/spec.md 4.6, 15 | POST /api/arzt-ausfall setzt planbare Termine auf umbuchungErforderlich; DB-Status aus spec.md 4.6|
| STD-072 | Liste betroffener Patient:innen erzeugen | Betrieb | F-BETR-4 | done | docs/spec.md 15 | GET /api/arzt-ausfall dedupliziert Patienten aus akutSlots + geplanten Terminen; Anzeige in UI|

---

## Phase: v1.1

### F-V11-1: Erweiterungen
| ID | Name | Phase | Feature | Status | Quelle | Notiz |
|---|---|---|---|---|---|---|
| STD-073 | Erweiterter Wiederholungsrezept-Workflow | v1.1 | F-V11-1 | hypo | docs/spec.md 19 | Nice-to-have nach Version 1 |
| STD-074 | Automatische Umbuchungsvorschlaege | v1.1 | F-V11-1 | hypo | docs/spec.md 19 | Nur Vorschlaege, keine vollautomatische Umbuchung |
| STD-075 | No-Show-Auswertung | v1.1 | F-V11-1 | hypo | docs/spec.md 19 | Auswertung fuer Praxissteuerung |
| STD-076 | Admin-Statistiken | v1.1 | F-V11-1 | hypo | docs/spec.md 19 | Nice-to-have nach Version 1 |

---

## Phase: Out of Scope

| ID | Name | Phase | Status | Quelle | Notiz |
|---|---|---|---|---|---|
| STD-077 | PVS ersetzen | Out of Scope | killed | docs/spec.md 3 | App ist nur Online-Frontend |
| STD-078 | Self-Registration fuer Patient:innen | Out of Scope | killed | docs/spec.md 3 | Konten werden durch MFA/Admin erstellt |
| STD-079 | Online-Buchung fuer Neupatient:innen | Out of Scope | killed | docs/spec.md 3 | Nur Stammpatient:innen |
| STD-080 | Online-Buchung von Akutfaellen | Out of Scope | killed | docs/spec.md 3, 7 | Akut nur ueber MFA-Triage |
| STD-081 | Online-Buchung von Blutabnahmen | Out of Scope | killed | docs/spec.md 3, 5 | Telefonisch oder am Tresen |
| STD-082 | Online-Buchung von Erstgespraechen | Out of Scope | killed | docs/spec.md 3, 5 | Telefonisch |
| STD-083 | Patient:innen aendern Stammdaten selbst | Out of Scope | killed | docs/spec.md 3, 12 | PVS bleibt fuehrend |
| STD-084 | Medizinische Dringlichkeitsentscheidung durch App | Out of Scope | killed | docs/spec.md 3, 7 | MFA entscheidet telefonisch |
| STD-085 | Vollautomatische Umbuchung bei Arzt-Ausfall | Out of Scope | killed | docs/spec.md 3, 15 | MFAs vergeben Termine telefonisch neu |

---

## Feature-Uebersicht

| Feature-ID | Name | Phase | Enthaltene IDs | Status |
|---|---|---|---|---|
| F-KERN-1 | Datenmodelle Kern | Kern | STD-001, STD-006, STD-007, STD-010, STD-011, STD-015 | done |
| F-KERN-2 | Login & Berechtigung | Kern | STD-003, STD-004, STD-005 | done |
| F-KERN-3 | Buchungslogik & Slot-Anzeige | Kern | STD-008, STD-009, STD-012, STD-013, STD-014 | done |
| F-KERN-4 | Eigene Termine verwalten | Kern | STD-002, STD-016, STD-017, STD-018, STD-019 | done |
| F-VERW-1 | Nutzer & Rollen | Verwaltung | STD-020, STD-021, STD-022, STD-035 | done |
| F-VERW-2 | Sprechzeiten & Sperrzeiten | Verwaltung | STD-023, STD-024, STD-025, STD-026, STD-027, STD-028, STD-029 | done |
| F-VERW-3 | Termintypen & Arzt-Zuordnung | Verwaltung | STD-030, STD-031, STD-032, STD-033, STD-034 | done |
| F-SICH-1 | Authentifizierung & Schutz | Sicherheit & Sync | STD-036, STD-037, STD-038, STD-039, STD-040, STD-041 | done |
| F-SICH-2 | DSGVO & Opt-in | Sicherheit & Sync | STD-042, STD-043, STD-044, STD-045, STD-046 | done |
| F-SICH-3 | PVS-Synchronisation | Sicherheit & Sync | STD-047, STD-048, STD-049, STD-050, STD-051, STD-052 | done |
| F-BETR-1 | Akutslots | Betrieb | STD-053, STD-054, STD-055, STD-056, STD-057 | done |
| F-BETR-2 | No-Show-Tracking | Betrieb | STD-058, STD-059, STD-060, STD-061, STD-062 | done |
| F-BETR-3 | Tageslisten & Uebersichten | Betrieb | STD-063, STD-064, STD-065, STD-066, STD-067, STD-068 | done |
| F-BETR-4 | Arzt-Ausfall | Betrieb | STD-069, STD-070, STD-071, STD-072 | done |
| F-V11-1 | Erweiterungen | v1.1 | STD-073, STD-074, STD-075, STD-076 | hypo |

## Workflow

**Feature wird gebaut:**
- Feature-Status in der Feature-Uebersicht auf `in-progress` setzen
- Einzelne IDs bei Bedarf ebenfalls auf `in-progress` oder `done` setzen
- Commit-Message nach Moeglichkeit mit Feature-ID und/oder STD-ID, z.B. `feat: F-KERN-3 verbindliche terminbuchung (STD-012)`

**Feature fertig:**
- Feature-Status in der Feature-Uebersicht auf `done` setzen
- Einzelne IDs auf `done` setzen
- Commit-Hash in der Notiz ergaenzen

**Feature verworfen:**
- Status -> `killed`
- Entscheidung mit Begruendung in `docs/decisions.md` dokumentieren, wenn sie nicht bereits explizit in `docs/spec.md` steht










