-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ereignis" TEXT NOT NULL,
    "referenzTyp" TEXT,
    "referenzId" TEXT,
    "status" TEXT NOT NULL,
    "fehlerMeldung" TEXT,
    "versuch" INTEGER NOT NULL DEFAULT 1,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Wiederholungsrezept" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "rezeptStatus" TEXT NOT NULL DEFAULT 'ausstehend',
    "letzteAktualisierung" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bemerkung" TEXT,
    CONSTRAINT "Wiederholungsrezept_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Wiederholungsrezept_patientId_idx" ON "Wiederholungsrezept"("patientId");
