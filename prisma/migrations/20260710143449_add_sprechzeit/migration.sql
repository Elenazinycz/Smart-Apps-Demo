-- CreateTable
CREATE TABLE "Sprechzeit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "arztId" TEXT NOT NULL,
    "wochentag" INTEGER NOT NULL,
    "startZeit" TEXT NOT NULL,
    "endZeit" TEXT NOT NULL,
    "gueltigVon" DATETIME,
    "gueltigBis" DATETIME,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Sprechzeit_arztId_fkey" FOREIGN KEY ("arztId") REFERENCES "Arzt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
