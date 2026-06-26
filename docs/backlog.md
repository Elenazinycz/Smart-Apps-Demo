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

| ID | Name | Phase | Status | Quelle | Notiz |
|---|---|---|---|---|---|
| STD-001 | PatientenKonto-Datenmodell | Kern | hypo | docs/spec.md 4.2 | Konto mit Patientenzuordnung, Login-Name, Passwort-Hash, Erstelldaten, Buchungsstatus und letztem Login |
| STD-002 | Patientendaten anzeigen | Kern | hypo | docs/spec.md 4.1, 12 | Patientendaten mit Versicherungsart, Kontaktdaten, Opt-ins, No-Show-Zaehler und Status; PVS bleibt fuehrend |
| STD-003 | Stammpatienten-Login | Kern | hypo | docs/spec.md 3, BR1 | Nur Stammpatient:innen mit aktivem PatientenKonto duerfen online buchen |
| STD-004 | Self-Registration verhindern | Kern | hypo | docs/spec.md 3, BR1 | Patientenkonten werden durch MFA/Admin angelegt, nicht durch Patient:innen selbst |
| STD-005 | Buchungsberechtigung pruefen | Kern | hypo | docs/spec.md BR1, 14 | Vor jeder Buchung muss die Identifikation und Kontoaktivitaet geprueft werden |
| STD-006 | TerminSlot-Datenmodell | Kern | hypo | docs/spec.md 4.6 | Slot mit Datum, Start, Ende, Status, Slot-Art, Buchungsquelle, Patient, Arzt und Termintyp |
| STD-007 | Termintyp-Datenmodell | Kern | hypo | docs/spec.md 4.5 | Termintyp mit Dauer, Online-Buchbarkeit, Beschreibung und Prioritaet |
| STD-008 | Planbare Online-Termintypen erlauben | Kern | hypo | docs/spec.md 5, BR2 | Vorsorge, Beratung, Impfung/Reisemedizin und Wiederholungsrezept-Abholung sind online buchbar |
| STD-009 | Nicht online buchbare Termintypen sperren | Kern | hypo | docs/spec.md 5, BR2 | Akut, Blutabnahme und Erstgespraech sind nicht online buchbar |
| STD-010 | Arzt-Datenmodell | Kern | hypo | docs/spec.md 4.3 | Arzt mit Fachrichtung, Zusatzqualifikation und Aktivstatus |
| STD-011 | Arzt-Termintyp-Zuordnung | Kern | hypo | docs/spec.md 4.8, 8 | N:M-Zuordnung zwischen Aerzt:innen und Termintypen mit Online-Erlaubnis und Aktivstatus |
| STD-012 | Online-Termin verbindlich buchen | Kern | hypo | docs/spec.md 3, BR4 | Online-Buchungen sind sofort verbindlich |
| STD-013 | Freie Slots anzeigen | Kern | hypo | docs/spec.md 2, 9 | Patient:innen sehen nur buchbare, freie und regelkonforme Slots |
| STD-014 | Doppelbuchung technisch verhindern | Kern | hypo | docs/spec.md 2, BR3, 14 | Slot-Sperre oder gleichwertiger Mechanismus verhindert parallele Buchungen |
| STD-015 | Buchungsquelle speichern | Kern | hypo | docs/spec.md 4.6, 12 | TerminSlot speichert online, telefonisch oder intern als Buchungsweg |
| STD-016 | Eigene Termine fuer Patient:innen anzeigen | Kern | hypo | docs/spec.md 11 | Patient:innen koennen eigene Online-Termine einsehen |
| STD-017 | Online-Stornierung bis 24h vorher | Kern | hypo | docs/spec.md 2, 3, BR4 | Patient:innen koennen eigene Termine bis 24 Stunden vorher stornieren |
| STD-018 | Online-Umbuchung bis 24h vorher | Kern | hypo | docs/spec.md 2, 3, BR4 | Patient:innen koennen eigene Termine bis 24 Stunden vorher umbuchen |
| STD-019 | Rechtzeitige Stornierung nicht als No-Show zaehlen | Kern | hypo | docs/spec.md 16 | Stornierungen innerhalb der Regel zaehlen nicht als No-Show |

## Phase: Verwaltung

| ID | Name | Phase | Status | Quelle | Notiz |
|---|---|---|---|---|---|
| STD-020 | PraxisNutzer-Datenmodell | Verwaltung | hypo | docs/spec.md 4.4 | Nutzer mit Rolle MFA, Arzt oder Admin, Dienstmail, Aktivstatus und Berechtigungen |
| STD-021 | Rollen und Berechtigungen umsetzen | Verwaltung | hypo | docs/spec.md 11 | Patient:in, MFA, Arzt/Aerztin und Admin erhalten getrennte Rechte |
| STD-022 | MFA/Admin kann PatientenKonten anlegen | Verwaltung | hypo | docs/spec.md 4.2, 11 | Kontoerstellung wird mit erstellendem PraxisNutzer dokumentiert |
| STD-023 | Admin kann Sprechzeiten verwalten | Verwaltung | hypo | docs/spec.md 6, 11 | Sprechzeiten sind pflegbar und nicht hardcoded |
| STD-024 | Oeffnungszeiten und Tagesbereiche pflegen | Verwaltung | hypo | docs/spec.md 6 | Mo-Fr 08:00-18:00, Mittagspause, Vormittag und Nachmittag als pflegbare Regeln |
| STD-025 | Arztindividuelle Sprechzeiten pflegen | Verwaltung | hypo | docs/spec.md 6, 17.1 | Unterschiedliche Arbeitszeiten je Arzt/Aerztin abbilden |
| STD-026 | Sperrzeit-Datenmodell | Verwaltung | hypo | docs/spec.md 4.7 | Sperrzeit mit Titel, Zeitraum, Betroffenheit, Arztbezug, Grund und Ersteller |
| STD-027 | Praxisschliessungen pflegen | Verwaltung | hypo | docs/spec.md 2, 3, 11 | MFA/Admin kann Schliessungen und Sperrzeiten fuer die Praxis eintragen |
| STD-028 | Arzt-Abwesenheiten pflegen | Verwaltung | hypo | docs/spec.md 4.7, 11 | Aerzt:innen koennen eigene Abwesenheiten eintragen |
| STD-029 | Mittagspause als Sperrregel beachten | Verwaltung | hypo | docs/spec.md 6, BR3 | Keine Buchung in der Mittagspause |
| STD-030 | Urlaub, Krankheit, Fortbildung und Feiertage beachten | Verwaltung | hypo | docs/spec.md 4.7, BR3 | Sperrgruende verhindern passende Buchungen |
| STD-031 | Admin kann Termintyp-Zuordnungen verwalten | Verwaltung | hypo | docs/spec.md 11 | Admin pflegt, welcher Arzt welchen Termintyp online anbietet |
| STD-032 | Admin kann Rollen und Praxisregeln verwalten | Verwaltung | hypo | docs/spec.md 11 | Rechte- und Regelverwaltung fuer die Praxis |
| STD-033 | Impfung/Reisemedizin nur bei Dr. Demir anbieten | Verwaltung | hypo | docs/spec.md 5 | Fachliche Sonderregel fuer Termintyp-Zuordnung |
| STD-034 | Wiederholungsrezept-Abholung als 5-Minuten-Slot anbieten | Verwaltung | hypo | docs/spec.md 5, 17.2 | Nur Abholung online, Beantragung/Freigabe bleibt intern |

## Phase: Sicherheit & Sync

| ID | Name | Phase | Status | Quelle | Notiz |
|---|---|---|---|---|---|
| STD-035 | Slot-Pruefung gegen alle Buchungsregeln | Sicherheit & Sync | hypo | docs/spec.md BR3 | Slot muss frei sein, innerhalb Sprechzeit liegen, nicht gesperrt sein und Arzt muss verfuegbar sein |
| STD-036 | Buchung trotz Praxisschliessung verhindern | Sicherheit & Sync | hypo | docs/spec.md 14 | Sperrzeiten der gesamten Praxis pruefen |
| STD-037 | Buchung trotz Arzt-Urlaub verhindern | Sicherheit & Sync | hypo | docs/spec.md 14 | Arzt-Abwesenheiten pruefen |
| STD-038 | Nachrichtenversand nur mit Opt-in | Sicherheit & Sync | hypo | docs/spec.md 2, BR5, 10, 14 | Vor jeder E-Mail/SMS muss die passende Einwilligung geprueft werden |
| STD-039 | Buchungsbestaetigung versenden | Sicherheit & Sync | hypo | docs/spec.md 10 | Sofort nach Buchung, nur mit Opt-in |
| STD-040 | Stornierungsbestaetigung versenden | Sicherheit & Sync | hypo | docs/spec.md 10 | Sofort nach Stornierung, nur mit Opt-in |
| STD-041 | Umbuchungsbestaetigung versenden | Sicherheit & Sync | hypo | docs/spec.md 10 | Sofort nach Umbuchung, nur mit Opt-in |
| STD-042 | Terminerinnerung 24h vorher versenden | Sicherheit & Sync | hypo | docs/spec.md 3, 10 | Erinnerung 24 Stunden vor Termin, nur mit Opt-in |
| STD-043 | PVS bleibt fuehrend fuer Patientenstammdaten | Sicherheit & Sync | hypo | docs/spec.md 12, BR5 | App darf Patientenstammdaten anzeigen, aber nicht fuehrend veraendern |
| STD-044 | PVS-Synchronisation fuer Buchungen | Sicherheit & Sync | hypo | docs/spec.md 3, 12, BR5 | Neue Buchungen muessen sofort synchronisiert werden |
| STD-045 | PVS-Synchronisation fuer Umbuchungen | Sicherheit & Sync | hypo | docs/spec.md 3, 12, BR5 | Umbuchungen muessen sofort synchronisiert werden |
| STD-046 | PVS-Synchronisation fuer Stornierungen | Sicherheit & Sync | hypo | docs/spec.md 3, 12, BR5 | Stornierungen muessen sofort synchronisiert werden |
| STD-047 | PVS bleibt fuehrend fuer No-Shows | Sicherheit & Sync | hypo | docs/spec.md 12, BR5 | No-Shows werden angezeigt bzw. Aktionen ausgeloest, aber PVS bleibt fuehrend |
| STD-048 | PVS bleibt fuehrend fuer medizinische Workflows | Sicherheit & Sync | hypo | docs/spec.md 12, BR5 | Wiederholungsrezept-Status wird angezeigt bzw. Workflow ausgeloest |
| STD-049 | Opt-in fuer E-Mail/SMS speichern | Sicherheit & Sync | hypo | docs/spec.md 4.1, 12 | App speichert Kommunikations-Einwilligungen |
| STD-050 | PVS-Synchronisationsfehler klaeren | Sicherheit & Sync | hypo | docs/spec.md 18 OP1 | Offener Punkt: Was passiert bei PVS-Synchronisationsfehlern? |
| STD-051 | PVS-Schnittstelle klaeren | Sicherheit & Sync | hypo | docs/spec.md 18 OP2 | Offener Punkt: Welche technische PVS-Schnittstelle existiert? |
| STD-052 | PVS-Fehleranzeige fuer MFAs klaeren | Sicherheit & Sync | hypo | docs/spec.md 18 OP3 | Offener Punkt: Wie werden PVS-Fehler MFAs angezeigt? |

## Phase: Betrieb

| ID | Name | Phase | Status | Quelle | Notiz |
|---|---|---|---|---|---|
| STD-053 | Akutslot-Daten und Slot-Art abbilden | Betrieb | hypo | docs/spec.md 4.6, 7 | Slots unterscheiden planbar und akut |
| STD-054 | Acht Akutslots pro Tag verwalten | Betrieb | hypo | docs/spec.md 7 | 4 vormittags, 4 nachmittags |
| STD-055 | MFA kann Akutslots morgens freigeben | Betrieb | hypo | docs/spec.md 7, 11 | Freigabe und Zuordnung zum diensthabenden Arzt durch MFA |
| STD-056 | Akutslots nicht online buchbar machen | Betrieb | hypo | docs/spec.md 7, BR2 | Akutfallentscheidung bleibt telefonische MFA-Triage |
| STD-057 | Diensthabenden Arzt fuer Akutslots zuweisen | Betrieb | hypo | docs/spec.md 7 | Informelle Rotation wird durch manuelle Zuweisung abgebildet |
| STD-058 | No-Show-Zaehler fuehren | Betrieb | hypo | docs/spec.md 4.1, 16 | No-Shows pro Jahr zaehlen |
| STD-059 | Erinnerung bei zweitem No-Show ausloesen | Betrieb | hypo | docs/spec.md BR4, 16 | Bei 2 No-Shows/Jahr erfolgt schriftliche Erinnerung |
| STD-060 | Online-Buchung ab drittem No-Show sperren | Betrieb | hypo | docs/spec.md BR4, 16 | Ab 3 No-Shows/Jahr wird Online-Buchung gesperrt |
| STD-061 | No-Show-Sperren manuell setzen | Betrieb | hypo | docs/spec.md 11 | MFA darf No-Show-Sperren setzen |
| STD-062 | Aufhebung von No-Show-Sperren klaeren | Betrieb | hypo | docs/spec.md 18 OP4 | Offener Punkt: automatisch oder manuell? |
| STD-063 | MFA-Tagesliste anzeigen | Betrieb | hypo | docs/spec.md 13 | Alle Termine mit Uhrzeit, Patient:in, Arzt, Termintyp und Buchungsweg |
| STD-064 | Arzt-Tagesliste anzeigen | Betrieb | hypo | docs/spec.md 13 | Aerzt:innen sehen standardmaessig nur eigene Termine |
| STD-065 | MFA sieht offene Wiederholungsrezepte | Betrieb | hypo | docs/spec.md 13 | Uebersicht fuer interne Rezeptbearbeitung |
| STD-066 | Arzt sieht offene Rezeptfreigaben | Betrieb | hypo | docs/spec.md 13 | Aerzt:innen koennen Rezeptfreigaben bearbeiten |
| STD-067 | MFA sieht freie Akutslots live | Betrieb | hypo | docs/spec.md 13 | Live-Uebersicht fuer Tagessteuerung |
| STD-068 | MFA sieht gesperrte Patient:innen | Betrieb | hypo | docs/spec.md 13 | Uebersicht ueber Buchungssperren |
| STD-069 | Akutslots bei kurzfristigem Arzt-Ausfall sperren | Betrieb | hypo | docs/spec.md 15 | Bei Ausfall werden Akutslots gesperrt |
| STD-070 | Betroffene Termine bei Arzt-Ausfall anzeigen | Betrieb | hypo | docs/spec.md 13, 15 | Liste aller betroffenen geplanten Termine |
| STD-071 | Termine als umbuchungErforderlich markieren | Betrieb | hypo | docs/spec.md 4.6, 15 | Sammelmarkierung fuer betroffene Termine |
| STD-072 | Liste betroffener Patient:innen erzeugen | Betrieb | hypo | docs/spec.md 15 | MFAs koennen Patient:innen telefonisch neu vergeben |

## Phase: v1.1

| ID | Name | Phase | Status | Quelle | Notiz |
|---|---|---|---|---|---|
| STD-073 | Erweiterter Wiederholungsrezept-Workflow | v1.1 | hypo | docs/spec.md 19 | Nice-to-have nach Version 1 |
| STD-074 | Automatische Umbuchungsvorschlaege | v1.1 | hypo | docs/spec.md 19 | Nur Vorschlaege, keine vollautomatische Umbuchung |
| STD-075 | No-Show-Auswertung | v1.1 | hypo | docs/spec.md 19 | Auswertung fuer Praxissteuerung |
| STD-076 | Admin-Statistiken | v1.1 | hypo | docs/spec.md 19 | Nice-to-have nach Version 1 |

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

## Workflow

**Feature wird gebaut:**
- Status `hypo` oder `validated` -> `in-progress`
- Commit-Message nach Moeglichkeit mit Feature-ID, z.B. `feat: STD-012 verbindliche terminbuchung`

**Feature fertig:**
- Status `in-progress` -> `done`
- Commit-Hash in der Notiz ergaenzen

**Feature verworfen:**
- Status -> `killed`
- Entscheidung mit Begruendung in `docs/decisions.md` dokumentieren, wenn sie nicht bereits explizit in `docs/spec.md` steht
