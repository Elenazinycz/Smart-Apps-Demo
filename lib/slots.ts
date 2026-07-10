import { prisma } from '@/lib/prisma';
import {
  SLOT_STATUS, BUCHUNGSQUELLE,
  REGEL, TERMINTYP_BEZEICHNUNG,
} from '@/lib/constants';

export type BuchungsAnfrage = {
  terminTypId: string;
  arztId: string;
  datum: string;
  startzeit: string;
  patientId: string;
};

export type SlotResult = {
  slotID: string;
  datum: string;
  startzeit: string;
  endzeit: string;
  arztId: string;
  arztName: string;
  terminTypId: string;
  terminTypName: string;
  terminTypDauer: number;
};

const ONLINE_BUCHBARE_TYPEN = new Set([
  TERMINTYP_BEZEICHNUNG.VORSORGE,
  TERMINTYP_BEZEICHNUNG.BERATUNG,
  TERMINTYP_BEZEICHNUNG.IMPFUNG_REISEMEDIZIN,
  TERMINTYP_BEZEICHNUNG.WIEDERHOLUNGSREZEPT_ABHOLUNG,
]);

export async function istOnlineBuchbar(terminTypId: string): Promise<boolean> {
  const t = await prisma.termintyp.findUnique({ where: { id: terminTypId }, select: { bezeichnung: true, onlineBuchbar: true } });
  return !!t && t.onlineBuchbar && ONLINE_BUCHBARE_TYPEN.has(t.bezeichnung as any);
}

export async function istArztFreigegeben(arztId: string, terminTypId: string): Promise<boolean> {
  const z = await prisma.arztTermintypZuordnung.findUnique({ where: { arztId_terminTypId: { arztId, terminTypId } }, select: { onlineErlaubt: true, aktiv: true } });
  return !!z && z.onlineErlaubt && z.aktiv;
}

function ueberschneidetSich(aS: Date, aE: Date, b: { start: Date; ende: Date }): boolean {
  return aS < b.ende && aE > b.start;
}

export async function getSperrzeitenBlocking(datum: Date, arztId: string): Promise<{ start: Date; ende: Date }[]> {
  const list = await prisma.sperrzeit.findMany({ where: { startdatum: { lte: datum }, enddatum: { gte: datum }, OR: [{ betrifft: 'Praxis' }, { betrifft: 'Arzt', arztId }] } });
  return list.map(s => {
    if (s.startzeit && s.endzeit) {
      const tagStart = new Date(datum); tagStart.setHours(s.startzeit.getHours(), s.startzeit.getMinutes(), 0, 0);
      const tagEnde = new Date(datum); tagEnde.setHours(s.endzeit.getHours(), s.endzeit.getMinutes(), 0, 0);
      return { start: tagStart, ende: tagEnde };
    }
    const gs = new Date(datum); gs.setHours(0, 0, 0, 0);
    const ge = new Date(datum); ge.setHours(23, 59, 0, 0);
    return { start: gs, ende: ge };
  });
}

export async function getFreieSlots(arztId: string, terminTypId: string, datum: string): Promise<SlotResult[]> {
  const [terminTyp, arzt] = await Promise.all([
    prisma.termintyp.findUnique({ where: { id: terminTypId }, select: { dauerStandardMinuten: true, bezeichnung: true } }),
    prisma.arzt.findUnique({ where: { id: arztId }, select: { name: true } }),
  ]);
  if (!terminTyp || !arzt) return [];

  const datumDate = new Date(datum + 'T00:00:00.000Z');
  const [sperren, slots] = await Promise.all([
    getSperrzeitenBlocking(datumDate, arztId),
    prisma.terminSlot.findMany({ where: { datum: datumDate, arztId, terminTypId, status: SLOT_STATUS.FREI }, orderBy: { startzeit: 'asc' } }),
  ]);

  return slots.filter(s => !sperren.some(b => ueberschneidetSich(s.startzeit, s.endzeit, b))).map(s => ({
    slotID: s.id, datum: s.datum.toISOString(), startzeit: s.startzeit.toISOString(), endzeit: s.endzeit.toISOString(),
    arztId: s.arztId, arztName: arzt.name, terminTypId: s.terminTypId, terminTypName: terminTyp.bezeichnung, terminTypDauer: terminTyp.dauerStandardMinuten,
  }));
}

export async function bucheOnlineTermin(anfrage: BuchungsAnfrage): Promise<{ success: boolean; error?: string }> {
  if (!(await istOnlineBuchbar(anfrage.terminTypId))) return { success: false, error: 'Dieser Termintyp ist nicht online buchbar.' };
  if (!(await istArztFreigegeben(anfrage.arztId, anfrage.terminTypId))) return { success: false, error: 'Dieser Arzt bietet diesen Termintyp nicht online an.' };

  const patient = await prisma.patient.findUnique({ where: { id: anfrage.patientId }, select: { status: true, noShowZaehlerJahr: true } });
  if (!patient) return { success: false, error: 'Patient nicht gefunden.' };
  if (patient.status !== 'aktiv') return { success: false, error: 'Patientenkonto ist gesperrt.' };
  if (patient.noShowZaehlerJahr >= REGEL.NO_SHOW_LIMIT_SPERRE) return { success: false, error: 'Online-Buchung gesperrt - bitte kontaktieren Sie die Praxis.' };

  const datumDate = new Date(anfrage.datum + 'T00:00:00.000Z');
  const startzeit = new Date(anfrage.startzeit);
  const terminTyp = await prisma.termintyp.findUnique({ where: { id: anfrage.terminTypId }, select: { dauerStandardMinuten: true } });
  if (!terminTyp) return { success: false, error: 'Termintyp nicht gefunden.' };

  const endzeit = new Date(startzeit.getTime() + terminTyp.dauerStandardMinuten * 60000);
  const sperren = await getSperrzeitenBlocking(datumDate, anfrage.arztId);
  if (sperren.some(b => ueberschneidetSich(startzeit, endzeit, b))) return { success: false, error: 'Der gewuenschte Zeitraum liegt in einer Sperrzeit.' };

  const slot = await prisma.terminSlot.findFirst({ where: { datum: datumDate, arztId: anfrage.arztId, terminTypId: anfrage.terminTypId, startzeit, status: SLOT_STATUS.FREI } });
  if (!slot) return { success: false, error: 'Dieser Slot ist nicht mehr verfuegbar.' };

  await prisma.terminSlot.update({ where: { id: slot.id }, data: { status: SLOT_STATUS.GEBAUT, patientId: anfrage.patientId, buchungsquelle: BUCHUNGSQUELLE.ONLINE } });
  return { success: true };
}
