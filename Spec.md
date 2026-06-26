# SPEC.md v2 — Praxis-Terminsoftware

## 1. Kontext

Die Praxis **Demir & Kollegen** betreut ca. **2.500 Stammpatient:innen pro Quartal**. Es gibt **3 Ärzt:innen**, **4 MFAs**, ca. **80–110 Termine pro Tag** und täglich **8 Akutslots**.

Die App ersetzt nicht das bestehende Praxisverwaltungssystem (PVS), sondern dient als Online-Frontend für Terminbuchung, Umbuchung, Stornierung und ausgewählte Workflows.

---

## 2. Ziele

- Telefonaufwand der MFAs reduzieren
- Stammpatient:innen sollen online Termine buchen können
- Doppelbuchungen technisch verhindern
- Urlaube, Sperrzeiten, Mittagspause und Praxisschließungen beachten
- DSGVO-konforme Kommunikation nur mit Opt-in
- Online-Stornierung und Umbuchung bis 24 Stunden vorher ermöglichen
- MFAs bei Akutslots und Arzt-Ausfällen unterstützen

---

## 3. Systemgrenzen

### In Scope

- Online-Buchung für Stammpatient:innen
- Sofort verbindliche Terminbuchung
- Online-Stornierung und Umbuchung bis 24 Stunden vorher
- Terminerinnerung 24 Stunden vorher
- Sprechzeiten, Sperrzeiten und Akutslots pflegen
- No-Show-Tracking und Sperrlogik
- DSGVO-konforme Benachrichtigungen
- PVS-Synchronisation

### Out of Scope

- Ersatz des PVS
- Self-Registration
- Online-Buchung für Neupatient:innen
- Online-Buchung von Akutfällen, Blutabnahmen und Erstgesprächen
- Änderung von Patientenstammdaten durch Patient:innen
- medizinische Dringlichkeitsentscheidung durch die App
- vollautomatische Umbuchung bei Arzt-Ausfall

---

## 4. Datenobjekte

### 4.1 Patient

| Attribut | Beschreibung |
|---|---|
| patientID | eindeutige ID |
| name | Name |
| geburtsdatum | Geburtsdatum |
| versicherungsart | GKV, PKV oder Selbstzahler |
| versichertennummer | Nummer der Krankenversicherung |
| internePatientennummer | interne Praxisnummer |
| telefonnummer | Telefonnummer |
| email | optionale E-Mail |
| einwilligungEmail | Opt-in für E-Mail |
| einwilligungSMS | Opt-in für SMS |
| noShowZaehlerJahr | Anzahl No-Shows im Jahr |
| status | aktiv oder gesperrt |

### 4.2 PatientenKonto

| Attribut | Beschreibung |
|---|---|
| kontoID | eindeutige ID |
| patientID | zugehöriger Patient |
| benutzername | Login-Name |
| passwortHash | gespeichertes Passwort |
| erstelltAm | Erstellungsdatum |
| erstelltVonNutzerID | MFA/Admin |
| buchungsStatus | aktiv oder gesperrt |
| letzterLogin | letzter Login |

### 4.3 Arzt

| Attribut | Beschreibung |
|---|---|
| arztID | eindeutige ID |
| name | Name |
| fachrichtung | Fachrichtung |
| zusatzqualifikation | z.B. Reisemedizin |
| aktiv | aktiv ja/nein |

### 4.4 PraxisNutzer

| Attribut | Beschreibung |
|---|---|
| nutzerID | eindeutige ID |
| name | Name |
| rolle | MFA, Arzt oder Admin |
| emailDienstlich | dienstliche E-Mail |
| aktiv | aktiv ja/nein |
| berechtigung | Rechte in der App |

### 4.5 Termintyp

| Attribut | Beschreibung |
|---|---|
| terminTypID | eindeutige ID |
| bezeichnung | Name des Termintyps |
| dauerStandardMinuten | Dauer |
| onlineBuchbar | ja/nein |
| beschreibung | Kurzbeschreibung |
| prioritaet | niedrig, normal, hoch |

### 4.6 TerminSlot

| Attribut | Beschreibung |
|---|---|
| slotID | eindeutige ID |
| datum | Datum |
| startzeit | Startzeit |
| endzeit | Endzeit |
| status | frei, gebucht, abgesagt, gesperrt, noShow, umbuchungErforderlich |
| slotArt | planbar oder akut |
| buchungsquelle | online, telefonisch, intern |
| patientID | Patient |
| arztID | Arzt |
| terminTypID | Termintyp |

### 4.7 Sperrzeit

| Attribut | Beschreibung |
|---|---|
| sperrzeitID | eindeutige ID |
| titel | Titel |
| startdatum | Startdatum |
| enddatum | Enddatum |
| startzeit | Startzeit |
| endzeit | Endzeit |
| betrifft | Arzt oder ganze Praxis |
| arztID | betroffener Arzt |
| grund | Urlaub, Krankheit, Fortbildung, Feiertag, Brückentag, Mittagspause |
| erstelltVonNutzerID | Ersteller |

### 4.8 ArztTermintypZuordnung

| Attribut | Beschreibung |
|---|---|
| zuordnungID | eindeutige ID |
| arztID | Arzt |
| terminTypID | Termintyp |
| onlineErlaubt | ja/nein |
| aktiv | aktiv ja/nein |
| bemerkung | optionale Info |

---

## 5. Termintypen

| Termintyp | Dauer | Online? | Besonderheit |
|---|---:|---|---|
| Vorsorge | 20 Min. | Ja | bei freigegebenen Ärzt:innen |
| Beratung | 15 Min. | Ja | bei freigegebenen Ärzt:innen |
| Impfung / Reisemedizin | 15 Min. | Ja | nur Dr. Demir |
| Wiederholungsrezept-Abholung | 5 Min. | Ja | Zeitfenster am Tresen |
| Blutabnahme | 10 Min. | Nein | telefonisch / Tresen |
| Erstgespräch | 30 Min. | Nein | telefonisch |
| Akut | 10 Min. | Nein | nur über MFA-Triage |

---

## 6. Sprechzeiten

Sprechzeiten dürfen nicht fest im Code stehen, sondern müssen pflegbar sein.

| Arzt / Ärztin | Tage | Zeiten |
|---|---|---|
| Dr. Yilmaz | Mo–Do | ca. 08:00–13:00 |
| Dr. Schäfer | Mo–Fr | ca. 08:00–13:00 und 14:00–18:00 |
| Dr. Demir | Di–Do | ca. 08:00–13:00 und 14:00–18:00 |
| Dr. Demir | Fr | ca. 08:00–13:00 |

| Bereich | Zeit |
|---|---|
| Öffnungszeiten | Mo–Fr, 08:00–18:00 |
| Mittagspause | 13:00–14:00 |
| Vormittag | 08:00–13:00 |
| Nachmittag | 14:00–18:00 |

---

## 7. Akutslots

| Zeitraum | Anzahl |
|---|---:|
| Vormittag | 4 |
| Nachmittag | 4 |
| Gesamt | 8 pro Tag |

Akutslots werden morgens durch eine MFA freigegeben und dem diensthabenden Arzt zugewiesen. Die Rotation ist informell. Akutslots sind nicht online buchbar. Die MFA entscheidet telefonisch, ob ein Fall akut ist.

---

## 8. Kardinalitäten

| # | Entität A | Kardinalität | Entität B | Erklärung |
|---|---|---|---|---|
| 1 | Patient | 1 : 1 | PatientenKonto | Ein Patient hat ein Konto |
| 2 | Patient | 1 : N | TerminSlot | Ein Patient kann mehrere Termine haben |
| 3 | Arzt | 1 : N | TerminSlot | Ein Arzt kann viele Termine haben |
| 4 | Termintyp | 1 : N | TerminSlot | Ein Termintyp kann vielen Slots zugeordnet sein |
| 5 | Arzt | N : M | Termintyp | Ärzte können mehrere Termintypen anbieten; Termintypen können bei mehreren Ärzt:innen möglich sein |
| 6 | Arzt | 1 : N | Sperrzeit | Ein Arzt kann mehrere Sperrzeiten haben |
| 7 | PraxisNutzer | 1 : N | PatientenKonto | Eine MFA/Admin kann mehrere Konten anlegen |
| 8 | PraxisNutzer | 1 : N | Sperrzeit | Ein Nutzer kann mehrere Sperrzeiten eintragen |

Die N:M-Beziehung zwischen Arzt und Termintyp wird über `ArztTermintypZuordnung` umgesetzt.

---

## 9. Business Rules

| # | Regel |
|---|---|
| BR1 | **Buchungsberechtigung:** Nur Stammpatient:innen mit aktivem PatientenKonto dürfen online buchen. Es gibt keine Self-Registration. |
| BR2 | **Online-Buchbarkeit:** Online buchbar sind nur Vorsorge, Beratung, Impfung/Reisemedizin und Wiederholungsrezept-Abholung. Akut, Blutabnahme und Erstgespräch sind ausgeschlossen. |
| BR3 | **Slot-Prüfung:** Ein Slot darf nur gebucht werden, wenn er frei ist, innerhalb der Sprechzeit liegt, nicht gesperrt ist, nicht in der Mittagspause liegt und der Arzt verfügbar ist. Doppelbuchungen müssen technisch ausgeschlossen werden. |
| BR4 | **Stornierung, Umbuchung, No-Show:** Online-Termine sind sofort verbindlich. Stornierung und Umbuchung sind bis 24 Stunden vorher möglich. Bei 2 No-Shows/Jahr erfolgt eine Erinnerung, ab 3 No-Shows wird die Online-Buchung gesperrt. |
| BR5 | **DSGVO und PVS:** Nachrichten nur mit Opt-in. Das PVS bleibt führend für Patientenstammdaten, No-Shows und medizinische Workflows. Buchungen, Umbuchungen und Stornierungen müssen sofort synchronisiert werden. |

---

## 10. Benachrichtigungen

| Ereignis | Zeitpunkt | Bedingung |
|---|---|---|
| Buchungsbestätigung | sofort | nur mit Opt-in |
| Stornierungsbestätigung | sofort | nur mit Opt-in |
| Umbuchungsbestätigung | sofort | nur mit Opt-in |
| Terminerinnerung | 24h vorher | nur mit Opt-in |

---

## 11. Rollen und Berechtigungen

| Rolle | Darf |
|---|---|
| Patient:in | eigene Online-Termine buchen, stornieren, umbuchen |
| MFA | Konten anlegen, Akutslots freigeben, No-Show-Sperren setzen, Praxisschließungen eintragen, Wiederholungsrezepte anlegen |
| Arzt / Ärztin | eigene Abwesenheiten eintragen, Wiederholungsrezepte freigeben/ablehnen |
| Admin | Sprechzeiten, Termintyp-Zuordnungen, Rollen und Praxisregeln verwalten |

---

## 12. PVS-Synchronisation

| Datenbereich | Führend | App |
|---|---|---|
| Patientenstammdaten | PVS | nur anzeigen |
| Termine | PVS + App-Sync | buchen, umbuchen, stornieren |
| No-Shows | PVS | anzeigen / Aktion auslösen |
| Wiederholungsrezept-Status | PVS | anzeigen / Workflow auslösen |
| Buchungsweg | App | speichern |
| Opt-in E-Mail/SMS | App | speichern |

---

## 13. Tägliche Übersichten

| Rolle | Übersicht |
|---|---|
| MFA | Tagesliste aller Termine mit Uhrzeit, Patient:in, Arzt, Termintyp, Buchungsweg |
| MFA | offene Wiederholungsrezepte |
| MFA | freie Akutslots live |
| MFA | betroffene Termine bei Arzt-Ausfall |
| MFA | gesperrte Patient:innen |
| Arzt / Ärztin | eigene Tagesliste |
| Arzt / Ärztin | offene Rezeptfreigaben |

Ärzt:innen sehen standardmäßig nur ihre eigenen Termine und Aufgaben.

---

## 14. Kritische Fehler

| Fehler | Muss verhindert werden durch |
|---|---|
| Doppelbuchung | technische Slot-Sperre |
| Buchung trotz Praxisschließung | Sperrzeiten prüfen |
| Buchung trotz Arzt-Urlaub | Arzt-Abwesenheiten prüfen |
| Buchung ohne gültige Identifikation | Patient vor Buchung verifizieren |
| Nachricht ohne Opt-in | Opt-in vor Versand prüfen |

---

## 15. Arzt-Ausfall

Bei kurzfristigem Arzt-Ausfall werden Akutslots gesperrt. Geplante Termine werden nicht automatisch umgebucht, sondern durch MFAs telefonisch neu vergeben.

Die App soll unterstützen durch:

- Anzeige aller betroffenen Termine
- Sammelmarkierung als `umbuchungErforderlich`
- Liste betroffener Patient:innen

---

## 16. No-Show-Regel

| Ereignis | Folge |
|---|---|
| 1. No-Show | wird gezählt |
| 2. No-Show/Jahr | schriftliche Erinnerung |
| 3. No-Show/Jahr | Online-Buchung gesperrt |

Rechtzeitige Stornierung zählt nicht als No-Show.

---

## 17. Widersprüche und Unschärfen

### 17.1 Sprechzeiten Dr. Yilmaz

Frühere Aussage: Dr. Yilmaz arbeitet Mo–Fr auch nachmittags.  
Spätere Aussage: Dr. Yilmaz arbeitet Mo–Do vormittags.

**Lösung:** Sprechzeiten müssen pflegbar sein und dürfen nicht hardcoded werden.

### 17.2 Wiederholungsrezept

Frühere Aussage: MFA legt Wiederholungsrezept an, Arzt gibt frei oder lehnt ab.  
Spätere Aussage: Wiederholungsrezept-Abholung ist online buchbar.

**Lösung:** Beantragung/Freigabe bleibt interner Workflow. Nur die Abholung ist online als 5-Minuten-Zeitfenster buchbar.

---

## 18. Offene Punkte

| # | Offener Punkt |
|---|---|
| OP1 | Was passiert bei PVS-Synchronisationsfehlern? |
| OP2 | Welche technische PVS-Schnittstelle existiert? |
| OP3 | Wie werden PVS-Fehler MFAs angezeigt? |
| OP4 | Werden No-Show-Sperren automatisch oder manuell aufgehoben? |

---

## 19. Priorisierung

### Version 1 — Must-have

- Online-Buchung für Stammpatient:innen
- verbindliche Buchung
- Stornierung/Umbuchung bis 24h vorher
- DSGVO-Benachrichtigungen mit Opt-in
- pflegbare Sprechzeiten
- Termintyp-Arzt-Zuordnung
- Sperrzeiten und Praxisschließungen
- Akutslots
- No-Show-Tracking
- PVS-Synchronisation
- Liste betroffener Termine bei Arzt-Ausfall

### Version 1.1 — Nice-to-have

- erweiterter Wiederholungsrezept-Workflow
- automatische Umbuchungsvorschläge
- No-Show-Auswertung
- Admin-Statistiken

---

## 20. Zusammenfassung

Die App ist ein schlankes, regelbasiertes Online-Frontend für die Praxis Demir & Kollegen. Sie ermöglicht Stammpatient:innen die sichere Buchung planbarer Termine, berücksichtigt Sprechzeiten, Sperrzeiten, Termintypen, Akutslots, No-Show-Regeln und DSGVO-Einwilligungen. Das PVS bleibt führend für zentrale Patientendaten und medizinische Workflows.