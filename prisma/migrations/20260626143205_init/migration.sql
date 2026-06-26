-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "geburtsdatum" DATETIME NOT NULL,
    "versicherungsart" TEXT NOT NULL,
    "versichertennummer" TEXT NOT NULL,
    "internePatientennummer" TEXT NOT NULL,
    "telefonnummer" TEXT NOT NULL,
    "email" TEXT,
    "einwilligungEmail" BOOLEAN NOT NULL DEFAULT false,
    "einwilligungSms" BOOLEAN NOT NULL DEFAULT false,
    "noShowZaehlerJahr" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'aktiv',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PatientenKonto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "benutzername" TEXT NOT NULL,
    "passwortHash" TEXT NOT NULL,
    "erstelltVonNutzerId" TEXT NOT NULL,
    "buchungsStatus" TEXT NOT NULL DEFAULT 'aktiv',
    "letzterLogin" DATETIME,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PatientenKonto_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PatientenKonto_erstelltVonNutzerId_fkey" FOREIGN KEY ("erstelltVonNutzerId") REFERENCES "PraxisNutzer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Arzt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "fachrichtung" TEXT NOT NULL,
    "zusatzqualifikation" TEXT,
    "aktiv" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "PraxisNutzer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "rolle" TEXT NOT NULL,
    "emailDienstlich" TEXT NOT NULL,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "berechtigung" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Termintyp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bezeichnung" TEXT NOT NULL,
    "dauerStandardMinuten" INTEGER NOT NULL,
    "onlineBuchbar" BOOLEAN NOT NULL DEFAULT false,
    "beschreibung" TEXT,
    "prioritaet" TEXT NOT NULL DEFAULT 'normal'
);

-- CreateTable
CREATE TABLE "TerminSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datum" DATETIME NOT NULL,
    "startzeit" DATETIME NOT NULL,
    "endzeit" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'frei',
    "slotArt" TEXT NOT NULL DEFAULT 'planbar',
    "buchungsquelle" TEXT,
    "patientId" TEXT,
    "arztId" TEXT NOT NULL,
    "terminTypId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TerminSlot_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TerminSlot_arztId_fkey" FOREIGN KEY ("arztId") REFERENCES "Arzt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TerminSlot_terminTypId_fkey" FOREIGN KEY ("terminTypId") REFERENCES "Termintyp" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sperrzeit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titel" TEXT NOT NULL,
    "startdatum" DATETIME NOT NULL,
    "enddatum" DATETIME NOT NULL,
    "startzeit" DATETIME,
    "endzeit" DATETIME,
    "betrifft" TEXT NOT NULL,
    "arztId" TEXT,
    "grund" TEXT NOT NULL,
    "erstelltVonNutzerId" TEXT NOT NULL,
    CONSTRAINT "Sperrzeit_arztId_fkey" FOREIGN KEY ("arztId") REFERENCES "Arzt" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sperrzeit_erstelltVonNutzerId_fkey" FOREIGN KEY ("erstelltVonNutzerId") REFERENCES "PraxisNutzer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArztTermintypZuordnung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "arztId" TEXT NOT NULL,
    "terminTypId" TEXT NOT NULL,
    "onlineErlaubt" BOOLEAN NOT NULL DEFAULT false,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "bemerkung" TEXT,
    CONSTRAINT "ArztTermintypZuordnung_arztId_fkey" FOREIGN KEY ("arztId") REFERENCES "Arzt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ArztTermintypZuordnung_terminTypId_fkey" FOREIGN KEY ("terminTypId") REFERENCES "Termintyp" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_internePatientennummer_key" ON "Patient"("internePatientennummer");

-- CreateIndex
CREATE UNIQUE INDEX "PatientenKonto_patientId_key" ON "PatientenKonto"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientenKonto_benutzername_key" ON "PatientenKonto"("benutzername");

-- CreateIndex
CREATE UNIQUE INDEX "PraxisNutzer_emailDienstlich_key" ON "PraxisNutzer"("emailDienstlich");

-- CreateIndex
CREATE UNIQUE INDEX "Termintyp_bezeichnung_key" ON "Termintyp"("bezeichnung");

-- CreateIndex
CREATE INDEX "TerminSlot_datum_arztId_status_idx" ON "TerminSlot"("datum", "arztId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ArztTermintypZuordnung_arztId_terminTypId_key" ON "ArztTermintypZuordnung"("arztId", "terminTypId");
