-- CreateTable
CREATE TABLE "PraxisRegel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schluessel" TEXT NOT NULL,
    "wert" TEXT NOT NULL,
    "beschreibung" TEXT,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiert" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PraxisRegel_schluessel_key" ON "PraxisRegel"("schluessel");
