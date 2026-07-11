import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { validate, ValidationError } from '@/lib/validate';

const DEFAULT_REGELN = [
  { schluessel: 'stornierungsfristStd', wert: '24', beschreibung: 'Stornierungsfrist in Stunden vor Termin' },
  { schluessel: 'umbuchungsfristStd', wert: '24', beschreibung: 'Umbuchungsfrist in Stunden vor Termin' },
  { schluessel: 'erinnerungsfristStd', wert: '24', beschreibung: 'Zeitpunkt der Terminerinnerung in Stunden vor Termin' },
  { schluessel: 'noShowLimitErinnerung', wert: '2', beschreibung: 'No-Shows pro Jahr bis zur schriftlichen Erinnerung' },
  { schluessel: 'noShowLimitSperre', wert: '3', beschreibung: 'No-Shows pro Jahr bis zur Buchungssperre' },
  { schluessel: 'akutSlotVormittag', wert: '4', beschreibung: 'Anzahl freier Akutslots am Vormittag' },
  { schluessel: 'akutSlotNachmittag', wert: '4', beschreibung: 'Anzahl freier Akutslots am Nachmittag' },
];

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  let regeln = await prisma.praxisRegel.findMany({ orderBy: { schluessel: 'asc' } });

  if (regeln.length === 0) {
    for (const d of DEFAULT_REGELN) {
      await prisma.praxisRegel.create({ data: d });
    }
    regeln = await prisma.praxisRegel.findMany({ orderBy: { schluessel: 'asc' } });
  }

  return NextResponse.json({ regeln });
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger JSON-Body.' }, { status: 400 });
  }

  try {
    const cleaned = validate(body, [
      { name: 'id', type: 'string' },
      { name: 'wert', type: 'string', minLength: 1, maxLength: 50 },
    ]);

    const updated = await prisma.praxisRegel.update({
      where: { id: cleaned.id as string },
      data: { wert: cleaned.wert as string },
    });
    return NextResponse.json({ success: true, regel: updated });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
