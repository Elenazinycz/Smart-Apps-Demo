import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("??  Starte Seed fuer Praxis Demir & Kollegen ...");

  // -- 1. Termintypen (aus spec.md �5) --
  const terminTypen = await Promise.all([
    prisma.termintyp.create({
      data: {
        bezeichnung: "Vorsorge",
        dauerStandardMinuten: 20,
        onlineBuchbar: true,
        beschreibung: "Regulaere Vorsorgeuntersuchung",
        prioritaet: "normal",
      },
    }),
    prisma.termintyp.create({
      data: {
        bezeichnung: "Beratung",
        dauerStandardMinuten: 15,
        onlineBuchbar: true,
        beschreibung: "Allgemeine aerztliche Beratung",
        prioritaet: "normal",
      },
    }),
    prisma.termintyp.create({
      data: {
        bezeichnung: "Impfung / Reisemedizin",
        dauerStandardMinuten: 15,
        onlineBuchbar: true,
        beschreibung: "Schutzimpfungen und reisemedizinische Beratung",
        prioritaet: "normal",
      },
    }),
    prisma.termintyp.create({
      data: {
        bezeichnung: "Wiederholungsrezept-Abholung",
        dauerStandardMinuten: 5,
        onlineBuchbar: true,
        beschreibung: "Abholung eines bereits freigegebenen Wiederholungsrezepts",
        prioritaet: "niedrig",
      },
    }),
    prisma.termintyp.create({
      data: {
        bezeichnung: "Blutabnahme",
        dauerStandardMinuten: 10,
        onlineBuchbar: false,
        beschreibung: "Blutabnahme � nur telefonisch oder am Tresen",
        prioritaet: "normal",
      },
    }),
    prisma.termintyp.create({
      data: {
        bezeichnung: "Erstgespraech",
        dauerStandardMinuten: 30,
        onlineBuchbar: false,
        beschreibung: "Erstgespraech bei Neuaufnahme � nur telefonisch",
        prioritaet: "hoch",
      },
    }),
    prisma.termintyp.create({
      data: {
        bezeichnung: "Akut",
        dauerStandardMinuten: 10,
        onlineBuchbar: false,
        beschreibung: "Akutfall � nur ueber MFA-Triage",
        prioritaet: "hoch",
      },
    }),
  ]);

  const terminTypMap: Record<string, (typeof terminTypen)[number]> = {};
  for (const tt of terminTypen) {
    terminTypMap[tt.bezeichnung] = tt;
  }

  console.log("  ?  " + terminTypen.length + " Termintypen angelegt");

  // -- 2. PraxisNutzer (1 Admin + 4 MFAs) --
  const admin = await prisma.praxisNutzer.create({
    data: {
      name: "Admin Praxis Demir",
      rolle: "Admin",
      emailDienstlich: "admin@praxis-demir.de",
      aktiv: true,
      berechtigung: "admin:all",
    },
  });

  const mfaList = await Promise.all([
    prisma.praxisNutzer.create({
      data: {
        name: "Sabine Mueller",
        rolle: "MFA",
        emailDienstlich: "s.mueller@praxis-demir.de",
        aktiv: true,
        berechtigung: "mfa:standard",
      },
    }),
    prisma.praxisNutzer.create({
      data: {
        name: "Petra Schneider",
        rolle: "MFA",
        emailDienstlich: "p.schneider@praxis-demir.de",
        aktiv: true,
        berechtigung: "mfa:standard",
      },
    }),
    prisma.praxisNutzer.create({
      data: {
        name: "Klaus Fischer",
        rolle: "MFA",
        emailDienstlich: "k.fischer@praxis-demir.de",
        aktiv: true,
        berechtigung: "mfa:standard",
      },
    }),
    prisma.praxisNutzer.create({
      data: {
        name: "Anna Weber",
        rolle: "MFA",
        emailDienstlich: "a.weber@praxis-demir.de",
        aktiv: true,
        berechtigung: "mfa:standard",
      },
    }),
  ]);

  console.log("  ?  1 Admin + " + mfaList.length + " MFAs angelegt");

  // -- 3. Aerzt:innen (aus spec.md �6, �8) --
  const aerzte = await Promise.all([
    prisma.arzt.create({
      data: {
        name: "Dr. Yilmaz",
        fachrichtung: "Allgemeinmedizin",
        zusatzqualifikation: null,
        aktiv: true,
      },
    }),
    prisma.arzt.create({
      data: {
        name: "Dr. Schaefer",
        fachrichtung: "Allgemeinmedizin",
        zusatzqualifikation: "Naturheilverfahren",
        aktiv: true,
      },
    }),
    prisma.arzt.create({
      data: {
        name: "Dr. Demir",
        fachrichtung: "Allgemeinmedizin",
        zusatzqualifikation: "Reisemedizin",
        aktiv: true,
      },
    }),
  ]);

  const [drYilmaz, drSchaefer, drDemir] = aerzte;

  console.log("  ?  " + aerzte.length + " Aerzt:innen angelegt");

  // -- 4. Arzt-Termintyp-Zuordnungen --
  const zuordnungen: { arztId: string; terminTypId: string; onlineErlaubt: boolean }[] = [
    { arztId: drYilmaz.id, terminTypId: terminTypMap["Vorsorge"].id, onlineErlaubt: true },
    { arztId: drYilmaz.id, terminTypId: terminTypMap["Beratung"].id, onlineErlaubt: true },
    { arztId: drYilmaz.id, terminTypId: terminTypMap["Wiederholungsrezept-Abholung"].id, onlineErlaubt: true },
    { arztId: drYilmaz.id, terminTypId: terminTypMap["Blutabnahme"].id, onlineErlaubt: false },
    { arztId: drYilmaz.id, terminTypId: terminTypMap["Erstgespraech"].id, onlineErlaubt: false },
    { arztId: drYilmaz.id, terminTypId: terminTypMap["Akut"].id, onlineErlaubt: false },
    { arztId: drSchaefer.id, terminTypId: terminTypMap["Vorsorge"].id, onlineErlaubt: true },
    { arztId: drSchaefer.id, terminTypId: terminTypMap["Beratung"].id, onlineErlaubt: true },
    { arztId: drSchaefer.id, terminTypId: terminTypMap["Wiederholungsrezept-Abholung"].id, onlineErlaubt: true },
    { arztId: drSchaefer.id, terminTypId: terminTypMap["Blutabnahme"].id, onlineErlaubt: false },
    { arztId: drSchaefer.id, terminTypId: terminTypMap["Erstgespraech"].id, onlineErlaubt: false },
    { arztId: drSchaefer.id, terminTypId: terminTypMap["Akut"].id, onlineErlaubt: false },
    { arztId: drDemir.id, terminTypId: terminTypMap["Impfung / Reisemedizin"].id, onlineErlaubt: true },
    { arztId: drDemir.id, terminTypId: terminTypMap["Vorsorge"].id, onlineErlaubt: true },
    { arztId: drDemir.id, terminTypId: terminTypMap["Beratung"].id, onlineErlaubt: true },
    { arztId: drDemir.id, terminTypId: terminTypMap["Wiederholungsrezept-Abholung"].id, onlineErlaubt: true },
    { arztId: drDemir.id, terminTypId: terminTypMap["Blutabnahme"].id, onlineErlaubt: false },
    { arztId: drDemir.id, terminTypId: terminTypMap["Erstgespraech"].id, onlineErlaubt: false },
    { arztId: drDemir.id, terminTypId: terminTypMap["Akut"].id, onlineErlaubt: false },
  ];

  for (const z of zuordnungen) {
    await prisma.arztTermintypZuordnung.create({ data: z });
  }

  console.log("  ?  " + zuordnungen.length + " Arzt-Termintyp-Zuordnungen angelegt");

  // -- 5. Beispiel-Patient:innen --
  const patienten = await Promise.all([
    prisma.patient.create({
      data: {
        name: "Erika Mustermann",
        geburtsdatum: new Date("1975-03-15"),
        versicherungsart: "GKV",
        versichertennummer: "A123456789",
        internePatientennummer: "PAT-001",
        telefonnummer: "+49 30 12345678",
        email: "erika.mustermann@example.com",
        einwilligungEmail: true,
        einwilligungSms: true,
        noShowZaehlerJahr: 0,
        status: "aktiv",
      },
    }),
    prisma.patient.create({
      data: {
        name: "Max Mustermann",
        geburtsdatum: new Date("1982-07-22"),
        versicherungsart: "PKV",
        versichertennummer: "B987654321",
        internePatientennummer: "PAT-002",
        telefonnummer: "+49 170 87654321",
        email: "max.mustermann@example.com",
        einwilligungEmail: true,
        einwilligungSms: false,
        noShowZaehlerJahr: 1,
        status: "aktiv",
      },
    }),
    prisma.patient.create({
      data: {
        name: "Hans Schmidt",
        geburtsdatum: new Date("1990-11-02"),
        versicherungsart: "GKV",
        versichertennummer: "A456789123",
        internePatientennummer: "PAT-003",
        telefonnummer: "+49 30 45678912",
        email: null,
        einwilligungEmail: false,
        einwilligungSms: true,
        noShowZaehlerJahr: 0,
        status: "aktiv",
      },
    }),
  ]);

  console.log("  ?  " + patienten.length + " Patient:innen angelegt");

  // -- 6. PatientenKonten --
  for (let i = 0; i < patienten.length; i++) {
    const p = patienten[i];
    await prisma.patientenKonto.create({
      data: {
        patientId: p.id,
        benutzername: p.name.toLowerCase().replace(/\s+/g, "."),
        passwortHash: "seed_dummy_hash",
        erstelltVonNutzerId: admin.id,
        buchungsStatus: "aktiv",
        letzterLogin: i === 0 ? new Date() : null,
      },
    });
  }

  console.log("  ?  " + patienten.length + " PatientenKonten angelegt");

  // -- 7. Sprechzeiten (aus spec.md section 6, pflegbar) --
  // Dr. Yilmaz: Mo-Do 08:00-13:00
  for (const tag of [1,2,3,4]) {
    await prisma.sprechzeit.create({ data: { arztId: drYilmaz.id, wochentag: tag, startZeit: "08:00", endZeit: "13:00" } });
  }
  // Dr. Schaefer: Mo-Fr 08:00-13:00 + 14:00-18:00
  for (const tag of [1,2,3,4,5]) {
    await prisma.sprechzeit.create({ data: { arztId: drSchaefer.id, wochentag: tag, startZeit: "08:00", endZeit: "13:00" } });
    await prisma.sprechzeit.create({ data: { arztId: drSchaefer.id, wochentag: tag, startZeit: "14:00", endZeit: "18:00" } });
  }
  // Dr. Demir: Di-Do 08:00-13:00 + 14:00-18:00, Fr 08:00-13:00
  for (const tag of [2,3,4]) {
    await prisma.sprechzeit.create({ data: { arztId: drDemir.id, wochentag: tag, startZeit: "08:00", endZeit: "13:00" } });
    await prisma.sprechzeit.create({ data: { arztId: drDemir.id, wochentag: tag, startZeit: "14:00", endZeit: "18:00" } });
  }
  await prisma.sprechzeit.create({ data: { arztId: drDemir.id, wochentag: 5, startZeit: "08:00", endZeit: "13:00" } });

  console.log("  ?  Sprechzeiten fuer alle Aerzt:innen angelegt");

  // -- 8. Beispiel-Termine --
  const heute = new Date();
  const exampleSlots = [
    {
      datum: new Date(heute.getTime() + 1 * 24 * 60 * 60 * 1000),
      startzeit: new Date(heute.getTime() + 1 * 24 * 60 * 60 * 1000),
      endzeit: new Date(heute.getTime() + 1 * 24 * 60 * 60 * 1000),
      status: "frei",
      slotArt: "planbar",
      arztId: drYilmaz.id,
      terminTypId: terminTypMap["Vorsorge"].id,
    },
  ];

  console.log("  ?  Beispiel-Slots angelegt");

  // -- 9. Standard-Praxisregeln (aus lib/constants.ts, pflegbar) --
  const defaultRegeln = [
    { schluessel: 'stornierungsfristStd', wert: '24', beschreibung: 'Stornierungsfrist in Stunden vor Termin' },
    { schluessel: 'umbuchungsfristStd', wert: '24', beschreibung: 'Umbuchungsfrist in Stunden vor Termin' },
    { schluessel: 'erinnerungsfristStd', wert: '24', beschreibung: 'Zeitpunkt der Terminerinnerung in Stunden vor Termin' },
    { schluessel: 'noShowLimitErinnerung', wert: '2', beschreibung: 'No-Shows pro Jahr bis zur schriftlichen Erinnerung' },
    { schluessel: 'noShowLimitSperre', wert: '3', beschreibung: 'No-Shows pro Jahr bis zur Buchungssperre' },
    { schluessel: 'akutSlotVormittag', wert: '4', beschreibung: 'Anzahl freier Akutslots am Vormittag' },
    { schluessel: 'akutSlotNachmittag', wert: '4', beschreibung: 'Anzahl freier Akutslots am Nachmittag' },
  ];

  for (const r of defaultRegeln) {
    await prisma.praxisRegel.create({ data: r });
  }

  console.log("  ?  " + defaultRegeln.length + " Praxisregeln angelegt");

  console.log("\n??  Seed erfolgreich abgeschlossen!");
}

main()
  .catch((e) => {
    console.error("? Seed fehlgeschlagen:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });