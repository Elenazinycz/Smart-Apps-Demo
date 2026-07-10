import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { istAdmin } from '@/lib/rollen';

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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (!istAdmin(session)) return NextResponse.json({ error: 'Nur Admin.' }, { status: 403 });

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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (!istAdmin(session)) return NextResponse.json({ error: 'Nur Admin.' }, { status: 403 });

  const { id, wert } = await req.json();
  if (!id || wert === undefined) return NextResponse.json({ error: 'id und wert erforderlich.' }, { status: 400 });

  const updated = await prisma.praxisRegel.update({ where: { id }, data: { wert: String(wert) } });
  return NextResponse.json({ success: true, regel: updated });
}