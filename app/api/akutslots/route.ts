import { validateCsrf } from '@/lib/csrf';
import { NextRequest, NextResponse } from 'next/server';
import { requireMfaOrAdmin } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { SLOT_ART, SLOT_STATUS, TERMINTYP_BEZEICHNUNG } from '@/lib/constants';

// GET /api/akutslots
// Zeigt MFAs alle Akutslots fuer heute an (frei od. bereits freigegeben/gebucht)
export async function GET() {
  const session = await requireMfaOrAdmin();
  if (session instanceof NextResponse) return session;

  const heute = new Date();
  const heuteStart = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate(), 0, 0, 0, 0);
  const heuteEnde = new Date(heuteStart.getTime() + 24 * 60 * 60 * 1000);

  // Alle Akut-Slots fuer heute laden
  const akutSlots = await prisma.terminSlot.findMany({
    where: {
      datum: { gte: heuteStart, lt: heuteEnde },
      slotArt: SLOT_ART.AKUT,
    },
    include: {
      arzt: { select: { id: true, name: true } },
      patient: { select: { id: true, name: true } },
      terminTyp: { select: { id: true, bezeichnung: true } },
    },
    orderBy: { startzeit: 'asc' },
  });

  // Alle AErzt:innen fuer die Auswahl im Freigabe-Formular
  const aerzte = await prisma.arzt.findMany({
    where: { aktiv: true },
    select: { id: true, name: true, fachrichtung: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ slots: akutSlots, aerzte });
}

// POST /api/akutslots
// MFA gibt Akutslots fuer heute frei: legt 8 Slots an (wenn nicht bereits vorhanden)
// und weist den diensthabenden Arzt zu.
// Body: { arztId: string }
export async function POST(req: NextRequest) {
  if (!(await validateCsrf(req))) return NextResponse.json({ error: 'Ungueltiger CSRF-Token.' }, { status: 403 });
  const session = await requireMfaOrAdmin();
  if (session instanceof NextResponse) return session;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungueltiger JSON-Body.' }, { status: 400 });
  }

  const arztId = body.arztId as string | undefined;
  if (!arztId) {
    return NextResponse.json({ error: 'arztId erforderlich.' }, { status: 400 });
  }

  // Pruefen, ob Arzt existiert und aktiv ist
  const arzt = await prisma.arzt.findUnique({ where: { id: arztId }, select: { id: true, aktiv: true } });
  if (!arzt || !arzt.aktiv) {
    return NextResponse.json({ error: 'Arzt nicht gefunden oder nicht aktiv.' }, { status: 400 });
  }

  const heute = new Date();
  const heuteStart = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate(), 0, 0, 0, 0);
  const heuteEnde = new Date(heuteStart.getTime() + 24 * 60 * 60 * 1000);

  // Pruefen, ob bereits Akutslots fuer heute existieren
  const existing = await prisma.terminSlot.count({
    where: {
      datum: { gte: heuteStart, lt: heuteEnde },
      slotArt: SLOT_ART.AKUT,
    },
  });

  if (existing > 0) {
    // Bereits freigegebene Slots: nur den Arzt aktualisieren
    await prisma.terminSlot.updateMany({
      where: {
        datum: { gte: heuteStart, lt: heuteEnde },
        slotArt: SLOT_ART.AKUT,
        status: SLOT_STATUS.FREI,
      },
      data: { arztId },
    });
    return NextResponse.json({ success: true, message: 'Diensthabender Arzt aktualisiert.', neuAngelegt: false });
  }

  // Akut-Typ ermitteln
  const akutTyp = await prisma.termintyp.findUnique({ where: { bezeichnung: TERMINTYP_BEZEICHNUNG.AKUT }, select: { id: true, dauerStandardMinuten: true } });
  if (!akutTyp) {
    return NextResponse.json({ error: 'Akut-Termintyp nicht gefunden.' }, { status: 500 });
  }

  // 8 Akutslots erzeugen: 4 vormittags (08:00, 09:00, 10:00, 11:00), 4 nachmittags (14:00, 15:00, 16:00, 17:00)
  const zeitenVormittag = [8, 9, 10, 11];
  const zeitenNachmittag = [14, 15, 16, 17];
  const dauer = akutTyp.dauerStandardMinuten;
  const slotsToCreate: Array<{
    datum: Date; startzeit: Date; endzeit: Date;
    status: string; slotArt: string; arztId: string; terminTypId: string;
  }> = [];

  for (const h of zeitenVormittag) {
    const start = new Date(heuteStart);
    start.setHours(h, 0, 0, 0);
    const ende = new Date(start.getTime() + dauer * 60000);
    slotsToCreate.push({
      datum: new Date(heuteStart),
      startzeit: start,
      endzeit: ende,
      status: SLOT_STATUS.FREI,
      slotArt: SLOT_ART.AKUT,
      arztId,
      terminTypId: akutTyp.id,
    });
  }

  for (const h of zeitenNachmittag) {
    const start = new Date(heuteStart);
    start.setHours(h, 0, 0, 0);
    const ende = new Date(start.getTime() + dauer * 60000);
    slotsToCreate.push({
      datum: new Date(heuteStart),
      startzeit: start,
      endzeit: ende,
      status: SLOT_STATUS.FREI,
      slotArt: SLOT_ART.AKUT,
      arztId,
      terminTypId: akutTyp.id,
    });
  }

  await prisma.terminSlot.createMany({ data: slotsToCreate });

  return NextResponse.json({ success: true, message: '8 Akutslots freigegeben.', neuAngelegt: true, anzahl: slotsToCreate.length });
}
