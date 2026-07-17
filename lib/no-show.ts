// lib/no-show.ts
// No-Show-Tracking – F-BETR-2 (STD-058 bis STD-062)
// Fachliche Regeln aus spec.md §16 und BR4:
//   1. No-Show: wird gezaehlt
//   2. No-Show/Jahr: schriftliche Erinnerung
//   3. No-Show/Jahr: Online-Buchung gesperrt

import { prisma } from '@/lib/prisma';
import { SLOT_STATUS, REGEL, KONTO_STATUS } from '@/lib/constants';
import { logSyncEintrag } from '@/lib/pvs-sync';
import { sendeBenachrichtigung } from '@/lib/notifications';

// ─── STD-058: No-Show erfassen ───

export async function erfasseNoShow(slotId: string, mfaNutzerId: string): Promise<{ success: boolean; error?: string; noShowZaehlerNeu?: number; erinnerungGesendet?: boolean; buchungGesperrt?: boolean }> {
  const slot = await prisma.terminSlot.findUnique({
    where: { id: slotId },
    include: { patient: { select: { id: true, noShowZaehlerJahr: true } } },
  });

  if (!slot) return { success: false, error: 'Termin nicht gefunden.' };
  if (!slot.patient) return { success: false, error: 'Diesem Termin ist kein Patient zugeordnet.' };
  if (slot.status === SLOT_STATUS.NO_SHOW) return { success: false, error: 'Dieser Termin wurde bereits als No-Show markiert.' };
  if (slot.status === SLOT_STATUS.ABGESAGT) return { success: false, error: 'Dieser Termin wurde storniert – keine No-Show-Markierung moeglich.' };

  const neuerZaehler = slot.patient.noShowZaehlerJahr + 1;

  await prisma.$transaction([
    prisma.terminSlot.update({
      where: { id: slotId },
      data: { status: SLOT_STATUS.NO_SHOW },
    }),
    prisma.patient.update({
      where: { id: slot.patient.id },
      data: { noShowZaehlerJahr: neuerZaehler },
    }),
  ]);

  // PVS-Sync (BR5: No-Shows werden synchronisiert)
  await logSyncEintrag('noShow', 'erfolg', 'terminSlot', slotId);

  const result: { success: boolean; noShowZaehlerNeu?: number; erinnerungGesendet?: boolean; buchungGesperrt?: boolean } = {
    success: true,
    noShowZaehlerNeu: neuerZaehler,
  };

  // ─── STD-059: Erinnerung bei 2. No-Show ───
  if (neuerZaehler === REGEL.NO_SHOW_LIMIT_ERINNERUNG) {
    const erinnerung = await sendeNoShowErinnerung(slot.patient.id, neuerZaehler);
    result.erinnerungGesendet = erinnerung;
  }

  // ─── STD-060: Sperre bei 3. No-Show ───
  if (neuerZaehler >= REGEL.NO_SHOW_LIMIT_SPERRE) {
    await sperrePatientOnlineBuchung(slot.patient.id);
    result.buchungGesperrt = true;
  }

  return result;
}

// ─── STD-059: No-Show-Erinnerung versenden ───

export async function sendeNoShowErinnerung(patientId: string, noShowZaehler: number): Promise<boolean> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { einwilligungEmail: true, einwilligungSms: true, email: true, telefonnummer: true },
  });
  if (!patient) return false;

  const betreff = 'Wichtige Mitteilung – Praxis Demir & Kollegen';
  const inhalt = `Sie haben bisher ${noShowZaehler} Termin(e) im laufenden Jahr nicht wahrgenommen. Bitte denken Sie daran, Termine rechtzeitig zu stornieren. Bei einem weiteren No-Show wird Ihre Online-Buchungsfunktion gesperrt.`;

  if (patient.einwilligungEmail && patient.email) {
    await sendeBenachrichtigung(patientId, 'terminerinnerung', 'email', betreff, inhalt);
    return true;
  }
  if (patient.einwilligungSms && patient.telefonnummer) {
    await sendeBenachrichtigung(patientId, 'terminerinnerung', 'sms', betreff, inhalt);
    return true;
  }

  // Kein Opt-in vorhanden – loggen als Mock
  console.log(`[NO-SHOW] Erinnerung fuer Patient ${patientId} (${noShowZaehler} No-Shows) – kein Opt-in fuer Versand.`);
  return false;
}

// ─── STD-060: Online-Buchung sperren ───

export async function sperrePatientOnlineBuchung(patientId: string): Promise<void> {
  await prisma.patientenKonto.updateMany({
    where: { patientId, buchungsStatus: KONTO_STATUS.AKTIV },
    data: { buchungsStatus: KONTO_STATUS.GESPERRT },
  });
  console.log(`[NO-SHOW] Online-Buchung fuer Patient ${patientId} gesperrt (3 No-Shows erreicht).`);
}

// ─── STD-060: Sperre manuell aufheben (MFA/Admin) ───

export async function entSperrePatientOnlineBuchung(patientId: string, noShowZaehlerReset: number = 0): Promise<{ success: boolean; error?: string }> {
  const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { id: true } });
  if (!patient) return { success: false, error: 'Patient nicht gefunden.' };

  await prisma.$transaction([
    prisma.patientenKonto.updateMany({
      where: { patientId },
      data: { buchungsStatus: KONTO_STATUS.AKTIV },
    }),
    prisma.patient.update({
      where: { id: patientId },
      data: { noShowZaehlerJahr: noShowZaehlerReset },
    }),
  ]);

  return { success: true };
}

// ─── STD-061: No-Show-Informationen fuer Patientenakte ───

export interface NoShowInfo {
  patientId: string;
  patientName: string;
  noShowZaehlerJahr: number;
  buchungsStatus: string;
  noShows: {
    slotId: string;
    datum: string;
    startzeit: string;
    arztName: string;
    terminTypName: string;
  }[];
}

export async function getNoShowInfoFuerPatient(patientId: string): Promise<NoShowInfo | null> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      id: true,
      name: true,
      noShowZaehlerJahr: true,
      konto: { select: { buchungsStatus: true } },
    },
  });
  if (!patient) return null;

  const noShowSlots = await prisma.terminSlot.findMany({
    where: { patientId, status: SLOT_STATUS.NO_SHOW },
    include: { arzt: { select: { name: true } }, terminTyp: { select: { bezeichnung: true } } },
    orderBy: { datum: 'desc' },
    take: 20,
  });

  return {
    patientId: patient.id,
    patientName: patient.name,
    noShowZaehlerJahr: patient.noShowZaehlerJahr,
    buchungsStatus: patient.konto?.buchungsStatus ?? 'aktiv',
    noShows: noShowSlots.map(s => ({
      slotId: s.id,
      datum: s.datum.toISOString().split('T')[0],
      startzeit: s.startzeit.toISOString().split('T')[1]?.substring(0, 5) ?? '',
      arztName: s.arzt.name,
      terminTypName: s.terminTyp.bezeichnung,
    })),
  };
}

export async function getNoShowUebersicht(): Promise<NoShowInfo[]> {
  const patienten = await prisma.patient.findMany({
    where: { noShowZaehlerJahr: { gt: 0 } },
    select: { id: true, name: true, noShowZaehlerJahr: true, konto: { select: { buchungsStatus: true } } },
    orderBy: { noShowZaehlerJahr: 'desc' },
  });

  const result: NoShowInfo[] = [];
  for (const p of patienten) {
    const noShowSlots = await prisma.terminSlot.findMany({
      where: { patientId: p.id, status: SLOT_STATUS.NO_SHOW },
      include: { arzt: { select: { name: true } }, terminTyp: { select: { bezeichnung: true } } },
      orderBy: { datum: 'desc' },
      take: 20,
    });

    result.push({
      patientId: p.id,
      patientName: p.name,
      noShowZaehlerJahr: p.noShowZaehlerJahr,
      buchungsStatus: p.konto?.buchungsStatus ?? 'aktiv',
      noShows: noShowSlots.map(s => ({
        slotId: s.id,
        datum: s.datum.toISOString().split('T')[0],
        startzeit: s.startzeit.toISOString().split('T')[1]?.substring(0, 5) ?? '',
        arztName: s.arzt.name,
        terminTypName: s.terminTyp.bezeichnung,
      })),
    });
  }

  return result;
}
