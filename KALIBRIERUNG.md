# KALIBRIERUNG


## 1. Business Rule

**Aussage:** Online buchbar sind nur Vorsorge, Beratung, Impfung/Reisemedizin und Wiederholungsrezept-Abholung. Akut, Blutabnahme und Erstgespräch sind ausgeschlossen.

**Konfidenz (1–10):** 9

**Wie geprüft?** In der Patientenansicht können nur Beratung, Vorsorge, Impfung und Rezeptabholung gebucht werden. Es gibt keine andere Auswahlmöglichkeiten. 

---

## 2. Business Rule

**Aussage:** Online-Termine sind sofort verbindlich. Stornierung und Umbuchung sind bis 24 Stunden vorher möglich. Bei 2 No-Shows/Jahr erfolgt eine Erinnerung, ab 3 No-Shows wird die Online-Buchung gesperrt.

**Konfidenz (1–10):** 9

**Wie geprüft?** 3 Termine wurden mit Erika Mustermann durchgeführt, ebenfalls getestet, dass nur 24h vorher umgebucht oder storniert werden kann. Ab 3 No-Shows, die durch die MFA in deren Zugang erfasst wurden (nur bei bereits vergangenen Terminen möglich), war das Konto gesperrt und die Patientin hat bei dem Anmeldungsversuch die Nachricht erhalten, dass das Konto wegen zu vielen No-Shows gesperrt war. Die MFA konnte das dann auch individuell in der Praxisansicht der APP rückgängig machen. Ob eine Erinnerung versendet wird, konnte nicht direkt getestet werden, da die Email der Mock-Patientin nicht existiert. Jedoch kann sie der Erinnerung in ihrer Ansicht zustimmen und ablehnen. Zudem sieht sie dauerhaft in ihrer Anzeige, wie viele No-Shows sie hat. Auch sieht das gleiche der Arzt/die MFA, sodass hier theoretisch auch telefonisch informiert werden kann. 

---

## 3. Datenmodell (n:m-Beziehung)

**Aussage:** Ärzte können mehrere Termintypen anbieten; Termintypen können bei mehreren Ärzt:innen möglich sein

**Konfidenz (1–10):** 10

**Wie geprüft?** Der Patient kann die Terminarten bei mehreren Ärzt:innen buchen (ausgeschlossen: Reisemedzin geht nur bei Demir). Außerdem kann der Admin/Arzt einstellen, wer welchen Termintyp anbieten kann. Demnach ist hier dauerhaft eine Änderung möglich. 

---

## 4. Widerspruchsauflösung

**Aussage:** Frühere Aussage: Dr. Yilmaz arbeitet Mo–Fr auch nachmittags.  
Spätere Aussage: Dr. Yilmaz arbeitet Mo–Do vormittags.

**Konfidenz (1–10):** 10

**Wie geprüft?** Die Lösung ist, dass Sprechzeiten pflegbar sein müssen und nicht hardcoded werden. Der Admin kann die Sprechzeiten anpassen, löschen und neue hinzufügen. Demnach können auch Änderungen hier schnell angepasst werden. 

---

## 5. Frei: Doppelbuchungen

**Aussage:** Termine dürfen nicht doppelt gebucht werden

**Konfidenz (1–10):** 9

**Wie geprüft?** Die Termine, die online buchbar sind, werden belegt, sobald der Patient sie online bucht (geprüft durch Code und Test zweier Patientenkonten). Zudem habe ich ein Tool eingebaut, sodass die MFAs die Akuttermine morgens freigeben (mit festgelegtem Arzt, wie Demir es verlangt hat) und dann jeweils den Akuttermin "telefonisch vergeben" können. So wir auch vermieden, dass zwei MFAs den Akuttermin doppelt per Telefon vergeben. Wenn das passieren sollte, bekommt der, der es als 2. versucht die Meldung, dass der Slot bereits vergeben wird. 
Nur Blutabnahmen und Erstgespräche bleiben offen, wobei das viel die MFA übernimmt - die laut Demir nicht mit in die Online-Buchungen aufgenommen werden sollen. 

---