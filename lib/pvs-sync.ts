// lib/pvs-sync.ts
// PVS-Synchronisation – F-SICH-3 (STD-047, STD-048, STD-049, STD-050)
// Mock-Implementierung fuer die Demo. In Produktion gegen echte PVS-Schnittstelle austauschbar.

import { prisma } from '@/lib/prisma';

// ── SyncLog-Eintrag anlegen ──

export async function logSyncEintrag(
  ereignis: string,
  status: 'erfolg' | 'fehler',
  referenzTyp?: string,
  referenzId?: string,
  fehlerMeldung?: string,
  versuch: number = 1
) {
  await prisma.syncLog.create({
    data: { ereignis, status, referenzTyp, referenzId, fehlerMeldung, versuch },
  });
}

// ─── STD-048: Termin-Aenderungen an PVS melden ───

export async function syncTerminBuchung(pvsPatientenNr: string, slotId: string): Promise<boolean> {
  try {
    // Mock: PVS-Schnittstelle anrufen (hier nur Log + 200)
    console.log([PVS-MOCK] Buchung synced: PVS-Patient , Slot );
    await logSyncEintrag('buchung', 'erfolg', 'terminSlot', slotId);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSyncEintrag('buchung', 'fehler', 'terminSlot', slotId, msg);
    return false;
  }
}

export async function syncTerminStornierung(pvsPatientenNr: string, slotId: string): Promise<boolean> {
  try {
    console.log([PVS-MOCK] Stornierung synced: PVS-Patient , Slot );
    await logSyncEintrag('stornierung', 'erfolg', 'terminSlot', slotId);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSyncEintrag('stornierung', 'fehler', 'terminSlot', slotId, msg);
    return false;
  }
}

export async function syncTerminUmbuchung(pvsPatientenNr: string, alterSlotId: string, neuerSlotId: string): Promise<boolean> {
  try {
    console.log([PVS-MOCK] Umbuchung synced: PVS-Patient , alter Slot , neuer Slot );
    await logSyncEintrag('umbuchung', 'erfolg', 'terminSlot', neuerSlotId);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSyncEintrag('umbuchung', 'fehler', 'terminSlot', neuerSlotId, msg);
    return false;
  }
}

// ─── STD-049: PVS-Daten importieren (Mock) ───

export interface PvsPatientImport {
  pvsPatientenNr: string;
  name: string;
  geburtsdatum: string;
  versicherungsart: string;
  versichertennummer: string;
  telefonnummer: string;
  email?: string;
  noShowZaehlerJahr: number;
  status: string;
}

export interface PvsTerminImport {
  pvsPatientenNr: string;
  datum: string;
  startzeit: string;
  endzeit: string;
  arztName: string;
  terminTyp: string;
  status: string;
}

export interface PvsRezeptImport {
  pvsPatientenNr: string;
  rezeptStatus: 'ausstehend' | 'abholbereit' | 'abgeholt';
  bemerkung?: string;
}

/**
 * Mock: Patientenstammdaten aus PVS importieren.
 * Sucht anhand der internenPatientennummer und aktualisiert Stammdaten.
 * In Produktion: REST-Aufruf an PVS-Schnittstelle.
 */
export async function importPatientAusPvs(pvsPatientenNr: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Mock: Wir suchen den Patienten in unserer DB
    const patient = await prisma.patient.findUnique({ where: { internePatientennummer: pvsPatientenNr } });
    if (!patient) return { success: false, error: 'Patient nicht in der App gefunden.' };

    // Mock: PVS-Daten simulieren (in Produktion vom PVS abrufen)
    console.log([PVS-MOCK] Patient  aus PVS importiert.);
    await logSyncEintrag('patientenImport', 'erfolg', 'patient', patient.id);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSyncEintrag('patientenImport', 'fehler', undefined, undefined, msg);
    return { success: false, error: msg };
  }
}

/**
 * Mock: Wiederholungsrezept-Status aus PVS importieren.
 */
export async function importRezeptAusPvs(pvsPatientenNr: string, rezeptDaten: PvsRezeptImport): Promise<{ success: boolean; error?: string }> {
  try {
    const patient = await prisma.patient.findUnique({ where: { internePatientennummer: pvsPatientenNr } });
    if (!patient) return { success: false, error: 'Patient nicht gefunden.' };

    // Bestehendes Rezept aktualisieren oder neu anlegen
    const existing = await prisma.wiederholungsrezept.findFirst({
      where: { patientId: patient.id, rezeptStatus: { not: 'abgeholt' } },
      orderBy: { letzteAktualisierung: 'desc' },
    });

    if (existing) {
      await prisma.wiederholungsrezept.update({
        where: { id: existing.id },
        data: { rezeptStatus: rezeptDaten.rezeptStatus, bemerkung: rezeptDaten.bemerkung ?? null, letzteAktualisierung: new Date() },
      });
    } else {
      await prisma.wiederholungsrezept.create({
        data: {
          patientId: patient.id,
          rezeptStatus: rezeptDaten.rezeptStatus,
          bemerkung: rezeptDaten.bemerkung ?? null,
        },
      });
    }

    await logSyncEintrag('rezeptImport', 'erfolg', 'wiederholungsrezept', patient.id);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSyncEintrag('rezeptImport', 'fehler', undefined, undefined, msg);
    return { success: false, error: msg };
  }
}

/**
 * Ruft die aktuellen SyncLog-Eintraege ab (fuer MFA-Ansicht).
 */
export async function getSyncLogs(limit: number = 50): Promise<unknown[]> {
  return prisma.syncLog.findMany({
    orderBy: { erstelltAm: 'desc' },
    take: limit,
  });
}

/**
 * Anzahl der offenen (fehlgeschlagenen) Sync-Vorgaenge.
 */
export async function countOffeneSyncs(): Promise<number> {
  return prisma.syncLog.count({ where: { status: 'fehler' } });
}
