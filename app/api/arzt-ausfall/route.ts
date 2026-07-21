import { NextRequest, NextResponse } from 'next/server';
import { requireMfaOrAdmin } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { SLOT_STATUS, SLOT_ART, SPERRGRUND } from '@/lib/constants';
import { validateCsrf } from '@/lib/csrf';
import { validate, ValidationError } from '@/lib/validate';

/** GET /api/arzt-ausfall?arztId=xxx&von=YYYY-MM-DD&bis=YYYY-MM-DD
 *  Liefert betroffene Termine und Patient:innen bei (potenziellem) Arzt-Ausfall.
 *
 *  Query-Parameter:
 *    arztId (required) – ID des betroffenen Arztes / der Ärztin
 *    von    (optional) – Startdatum, default: heute
 *    bis    (optional) – Enddatum, default: von (Ein-Tages-Ausfall)
 *
 *  Rückgabe:
 *    { slots: TerminSlot[], patienten: { id, name }[], datumVon, datumBis }
 */
export async function GET(req: NextRequest) {
  const session = await requireMfaOrAdmin();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const arztId = searchParams.get('arztId');
  if (!arztId) {
    return NextResponse.json({ error: 'arztId erforderlich.' }, { status: 400 });
  }

  // Datum-Bereich
  const heute = new Date();
  const heuteStart = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate(), 0, 0, 0, 0);

  let von: Date;
  let bis: Date;

  const vonParam = searchParams.get('von');
  if (vonParam) {
    const [y, m, d] = vonParam.split('-').map(Number);
    von = new Date(y, m - 1, d, 0, 0, 0, 0);
  } else {
    von = new Date(heuteStart);
  }

  const bisParam = searchParams.get('bis');
  if (bisParam) {
    const [y, m, d] = bisParam.split('-').map(Number);
    bis = new Date(y, m - 1, d, 23, 59, 59, 999);
  } else {
    bis = new Date(von);
    bis.setHours(23, 59, 59, 999);
  }

  // Arzt prüfen
  const arzt = await prisma.arzt.findUnique({
    where: { id: arztId },
    select: { id: true, name: true, fachrichtung: true },
  });
  if (!arzt) {
    return NextResponse.json({ error: 'Arzt nicht gefunden.' }, { status: 404 });
  }

  // 1) Akutslots des Arztes im Zeitraum (alle Status)
  const akutSlots = await prisma.terminSlot.findMany({
    where: {
      datum: { gte: von, lte: bis },
      arztId,
      slotArt: SLOT_ART.AKUT,
    },
    include: {
      patient: { select: { id: true, name: true } },
      terminTyp: { select: { bezeichnung: true } },
    },
    orderBy: { startzeit: 'asc' },
  });

  // 2) Geplante Termine des Arztes im Zeitraum (gebucht, nicht storniert)
  const geplanteTermine = await prisma.terminSlot.findMany({
    where: {
      datum: { gte: von, lte: bis },
      arztId,
      status: SLOT_STATUS.GEBAUT,
      slotArt: SLOT_ART.PLANBAR,
    },
    include: {
      patient: { select: { id: true, name: true } },
      terminTyp: { select: { bezeichnung: true } },
    },
    orderBy: { startzeit: 'asc' },
  });

  // 3) Liste aller betroffenen Patient:innen (unique)
  const patientMap = new Map<string, { id: string; name: string }>();
  for (const slot of [...akutSlots, ...geplanteTermine]) {
    if (slot.patient) {
      patientMap.set(slot.patient.id, slot.patient);
    }
  }
  const patienten = Array.from(patientMap.values());

  return NextResponse.json({
    akutSlots,
    geplanteTermine,
    patienten,
    arzt: { id: arzt.id, name: arzt.name, fachrichtung: arzt.fachrichtung },
    datumVon: von.toISOString().split('T')[0],
    datumBis: bis.toISOString().split('T')[0],
  });
}

/** POST /api/arzt-ausfall
 *  Führt den Arzt-Ausfall-Workflow aus:
 *  1) Akutslots des Arztes im Zeitraum werden auf "gesperrt" gesetzt
 *  2) Geplante Termine werden als "umbuchungErforderlich" markiert
 *  3) Eine Sperrzeit "Arzt-Ausfall (Krankheit)" wird angelegt
 *
 *  Body: { arztId, von, bis }
 */
export async function POST(req: NextRequest) {
  if (!(await validateCsrf(req))) {
    return NextResponse.json({ error: 'Ungueltiger CSRF-Token.' }, { status: 403 });
  }
  const session = await requireMfaOrAdmin();
  if (session instanceof NextResponse) return session;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungueltiger JSON-Body.' }, { status: 400 });
  }

  try {
    const cleaned = validate(body, [
      { name: 'arztId', type: 'string' },
      { name: 'von', type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2}' },
      { name: 'bis', type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2}' },
    ]);

    const { arztId, von, bis } = cleaned as { arztId: string; von: string; bis: string };

    const arzt = await prisma.arzt.findUnique({
      where: { id: arztId },
      select: { id: true, name: true },
    });
    if (!arzt) {
      return NextResponse.json({ error: 'Arzt nicht gefunden.' }, { status: 404 });
    }

    const vonDate = new Date(von + 'T00:00:00.000Z');
    const bisDate = new Date(bis + 'T23:59:59.999Z');

    // Schritt 1: Akutslots sperren
    const akutUpdate = await prisma.terminSlot.updateMany({
      where: {
        datum: { gte: vonDate, lte: bisDate },
        arztId,
        slotArt: SLOT_ART.AKUT,
        status: { not: SLOT_STATUS.ABGESAGT },
      },
      data: { status: SLOT_STATUS.GESPERRT },
    });

    // Schritt 2: Geplante Termine als umbuchungErforderlich markieren
    const terminUpdate = await prisma.terminSlot.updateMany({
      where: {
        datum: { gte: vonDate, lte: bisDate },
        arztId,
        status: SLOT_STATUS.GEBAUT,
        slotArt: SLOT_ART.PLANBAR,
      },
      data: { status: SLOT_STATUS.UMBUCHUNG_ERFORDERLICH },
    });

    // Schritt 3: Sperrzeit-Eintrag anlegen
    const sperrzeit = await prisma.sperrzeit.create({
      data: {
        titel: `Arzt-Ausfall: ${arzt.name}`,
        startdatum: vonDate,
        enddatum: bisDate,
        startzeit: null,
        endzeit: null,
        betrifft: 'Arzt',
        arztId,
        grund: SPERRGRUND.KRANKHEIT,
        erstelltVonNutzerId: session.id,
      },
    });

    return NextResponse.json({
      success: true,
      akutSlotsGesperrt: akutUpdate.count,
      termineMarkiert: terminUpdate.count,
      sperrzeitId: sperrzeit.id,
      message: `Arzt-Ausfall erfasst: ${akutUpdate.count} Akutslot(s) gesperrt, ${terminUpdate.count} Termin(e) als umbuchungErforderlich markiert.`,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
