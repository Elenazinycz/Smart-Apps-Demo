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

export async function getSprechzeitenBlocking(datum: Date, arztId: string): Promise<{ start: Date; ende: Date }[]> {
  const wochentag = datum.getDay() === 0 ? 7 : datum.getDay();
  const liste = await prisma.sprechzeit.findMany({
    where: { arztId, wochentag, aktiv: true },
    select: { startZeit: true, endZeit: true },
  });

  if (liste.length === 0) {
    const gs = new Date(datum); gs.setHours(0, 0, 0, 0);
    const ge = new Date(datum); ge.setHours(23, 59, 0, 0);
    return [{ start: gs, ende: ge }];
  }

  const blocked: { start: Date; ende: Date }[] = [];
  let tagStart = new Date(datum); tagStart.setHours(0, 0, 0, 0);

  const sorted = liste.map(s => {
    const start = new Date(datum); start.setHours(Number(s.startZeit.split(':')[0]), Number(s.startZeit.split(':')[1]), 0, 0);
    const ende = new Date(datum); ende.setHours(Number(s.endZeit.split(':')[0]), Number(s.endZeit.split(':')[1]), 0, 0);
    return { start, ende };
  }).sort((a, b) => a.start.getTime() - b.start.getTime());

  for (const fenster of sorted) {
    if (fenster.start > tagStart) {
      blocked.push({ start: new Date(tagStart), ende: new Date(fenster.start) });
    }
    tagStart = new Date(Math.max(tagStart.getTime(), fenster.ende.getTime()));
  }

  const tagEnde = new Date(datum); tagEnde.setHours(23, 59, 0, 0);
  if (tagStart < tagEnde) blocked.push({ start: tagStart, ende: tagEnde });

  return blocked;
}

export async function getFreieSlots(arztId: string, terminTypId: string, datum: string): Promise<SlotResult[]> {
  const [terminTyp, arzt] = await Promise.all([
    prisma.termintyp.findUnique({ where: { id: terminTypId }, select: { dauerStandardMinuten: true, bezeichnung: true } }),
    prisma.arzt.findUnique({ where: { id: arztId }, select: { name: true } }),
  ]);
  if (!terminTyp || !arzt) return [];

  const datumDate = new Date(datum + 'T00:00:00.000Z');
  const [sperren, sprechzeitBlocks, slots] = await Promise.all([
    getSperrzeitenBlocking(datumDate, arztId),
    getSprechzeitenBlocking(datumDate, arztId),
    prisma.terminSlot.findMany({ where: { datum: datumDate, arztId, terminTypId, status: SLOT_STATUS.FREI }, orderBy: { startzeit: 'asc' } }),
  ]);

  return slots.filter(s => {
    const blocked = [...sperren, ...sprechzeitBlocks];
    return !blocked.some(b => ueberschneidetSich(s.startzeit, s.endzeit, b));
  }).map(s => ({
    slotID: s.id, datum: s.datum.toISOString(), startzeit: s.startzeit.toISOString(), endzeit: s.endzeit.toISOString(),
    arztId: s.arztId, arztName: arzt.name, terminTypId: s.terminTypId, terminTypName: terminTyp.bezeichnung, terminTypDauer: terminTyp.dauerStandardMinuten,
  }));
}

export async function bucheOnlineTermin(anfrage: BuchungsAnfrage): Promise<{ success: boolean; slotId?: string; error?: string }> {
  if (!(await istOnlineBuchbar(anfrage.terminTypId))) return { success: false, error: 'Dieser Termintyp ist nicht online buchbar.' };
  if (!(await istArztFreigegeben(anfrage.arztId, anfrage.terminTypId))) return { success: false, error: 'Dieser Arzt bietet diesen Termintyp nicht online an.' };

  const patient = await prisma.patient.findUnique({ where: { id: anfrage.patientId }, select: { status: true, noShowZaehlerJahr: true } });
  if (!patient) return { success: false, error: 'Patient nicht gefunden.' };
  if (patient.status !== 'aktiv') return { success: false, error: 'Patientenkonto ist gesperrt.' };
  if (patient.noShowZaehlerJahr >= REGEL.NO_SHOW_LIMIT_SPERRE) return { success: false, error: 'Online-Buchung gesperrt - bitte kontaktieren Sie die Praxis.' };

  const datumDate = new Date(anfrage.datum + 'T00:00:00.000Z');
  const [stunde, minute] = anfrage.startzeit.split(':').map(Number);
  const startzeit = new Date(datumDate);
  startzeit.setHours(stunde, minute, 0, 0);
  const terminTyp = await prisma.termintyp.findUnique({ where: { id: anfrage.terminTypId }, select: { dauerStandardMinuten: true } });
  if (!terminTyp) return { success: false, error: 'Termintyp nicht gefunden.' };

  const endzeit = new Date(startzeit.getTime() + terminTyp.dauerStandardMinuten * 60000);
  const [sperren, sprechzeitBlocks] = await Promise.all([
    getSperrzeitenBlocking(datumDate, anfrage.arztId),
    getSprechzeitenBlocking(datumDate, anfrage.arztId),
  ]);
  if ([...sperren, ...sprechzeitBlocks].some(b => ueberschneidetSich(startzeit, endzeit, b))) return { success: false, error: 'Der gewuenschte Zeitraum liegt in einer Sperrzeit.' };

  const slot = await prisma.terminSlot.findFirst({ where: { datum: datumDate, arztId: anfrage.arztId, terminTypId: anfrage.terminTypId, startzeit, status: SLOT_STATUS.FREI } });
  if (!slot) return { success: false, error: 'Dieser Slot ist nicht mehr verfuegbar.' };

  await prisma.terminSlot.update({ where: { id: slot.id }, data: { status: SLOT_STATUS.GEBAUT, patientId: anfrage.patientId, buchungsquelle: BUCHUNGSQUELLE.ONLINE } });
  return { success: true, slotId: slot.id };;
}

export async function storniereTermin(slotId: string, patientId: string): Promise<{ success: boolean; error?: string }> {
  const slot = await prisma.terminSlot.findUnique({ where: { id: slotId }, select: { id: true, patientId: true, startzeit: true, status: true, buchungsquelle: true } });
  if (!slot) return { success: false, error: 'Termin nicht gefunden.' };
  if (slot.patientId !== patientId) return { success: false, error: 'Dieser Termin gehoert nicht Ihnen.' };
  if (slot.status !== SLOT_STATUS.GEBAUT) return { success: false, error: 'Dieser Termin kann nicht storniert werden.' };
  if (slot.buchungsquelle !== BUCHUNGSQUELLE.ONLINE) return { success: false, error: 'Nur online gebuchte Termine koennen online storniert werden.' };

  const jetzt = new Date();
  const frist = new Date(slot.startzeit.getTime() - REGEL.STORNIERUNGSFRIST_STD * 60 * 60 * 1000);
  if (jetzt > frist) return { success: false, error: `Stornierung nur bis ${REGEL.STORNIERUNGSFRIST_STD} Stunden vor dem Termin moeglich.` };

  await prisma.terminSlot.update({ where: { id: slotId }, data: { status: SLOT_STATUS.ABGESAGT, patientId: null, buchungsquelle: null } });
  return { success: true };
}

export async function umbucheOnlineTermin(
  slotId: string,
  patientId: string,
  neueAnfrage: { terminTypId: string; arztId: string; datum: string; startzeit: string }
): Promise<{ success: boolean; neuerSlotId?: string; error?: string }> {
  const storno = await storniereTermin(slotId, patientId);
  if (!storno.success) return storno;

  const buchung = await bucheOnlineTermin({
    terminTypId: neueAnfrage.terminTypId,
    arztId: neueAnfrage.arztId,
    datum: neueAnfrage.datum,
    startzeit: neueAnfrage.startzeit,
    patientId,
  });

    if (!buchung.success) {
    await prisma.terminSlot.update({ where: { id: slotId }, data: { status: SLOT_STATUS.GEBAUT, patientId, buchungsquelle: BUCHUNGSQUELLE.ONLINE } });
  }

  return { success: buchung.success, neuerSlotId: buchung.slotId, error: buchung.error };
}

