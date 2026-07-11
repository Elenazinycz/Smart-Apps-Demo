import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePraxis } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { istArzt } from '@/lib/rollen';
import { validate, ValidationError } from '@/lib/validate';

export async function GET() {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  if (session.type !== 'praxis') {
    return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  }

  const where: Record<string, unknown> = {};
  // Ärzte sehen nur ihre eigenen Sperrzeiten
  if (session.rolle === 'Arzt') {
    const arzt = await prisma.arzt.findFirst({ where: { name: session.name }, select: { id: true } });
    if (arzt) where.arztId = arzt.id;
  }

  const sperrzeiten = await prisma.sperrzeit.findMany({
    where,
    include: {
      arzt: { select: { name: true } },
      erstelltVon: { select: { name: true, rolle: true } },
    },
    orderBy: { startdatum: 'desc' },
  });
  return NextResponse.json({ sperrzeiten });
}

export async function POST(req: NextRequest) {
  const session = await requirePraxis();
  if (session instanceof NextResponse) return session;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger JSON-Body.' }, { status: 400 });
  }

  try {
    const cleaned = validate(body, [
      { name: 'titel', type: 'string', minLength: 1, maxLength: 200 },
      { name: 'startdatum', type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2}' },
      { name: 'enddatum', type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2}' },
      { name: 'startzeit', type: 'string?', pattern: '([01]\\d|2[0-3]):[0-5]\\d' },
      { name: 'endzeit', type: 'string?', pattern: '([01]\\d|2[0-3]):[0-5]\\d' },
      { name: 'betrifft', type: 'string', enum: ['Arzt', 'Praxis'] },
      { name: 'arztId', type: 'string?' },
      { name: 'grund', type: 'string', enum: ['Urlaub', 'Krankheit', 'Fortbildung', 'Feiertag', 'Brueckentag', 'Mittagspause'] },
    ]);

    const { titel, startdatum, enddatum, startzeit, endzeit, betrifft, arztId, grund } = cleaned as {
      titel: string;
      startdatum: string;
      enddatum: string;
      startzeit?: string;
      endzeit?: string;
      betrifft: string;
      arztId?: string;
      grund: string;
    };

    // Berechtigungsprüfung: Arzt darf nur eigene Abwesenheiten, Admin/MFA alle
    if (session.rolle === 'Arzt') {
      const arzt = await prisma.arzt.findFirst({ where: { name: session.name }, select: { id: true } });
      if (!arzt || arzt.id !== arztId) return NextResponse.json({ error: 'Sie koennen nur eigene Abwesenheiten eintragen.' }, { status: 403 });
      if (betrifft !== 'Arzt') return NextResponse.json({ error: 'Aerzte koennen nur arzt-bezogene Sperrzeiten anlegen.' }, { status: 403 });
    }

    const sz = await prisma.sperrzeit.create({
      data: {
        titel,
        startdatum: new Date(startdatum + 'T00:00:00.000Z'),
        enddatum: new Date(enddatum + 'T00:00:00.000Z'),
        startzeit: startzeit ? new Date('1970-01-01T' + startzeit + ':00.000Z') : null,
        endzeit: endzeit ? new Date('1970-01-01T' + endzeit + ':00.000Z') : null,
        betrifft,
        arztId: arztId || null,
        grund,
        erstelltVonNutzerId: session.id,
      },
    });
    return NextResponse.json({ success: true, sperrzeit: sz });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id erforderlich.' }, { status: 400 });

  const sz = await prisma.sperrzeit.findUnique({ where: { id }, select: { erstelltVonNutzerId: true, arztId: true } });
  if (!sz) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 });

  // Berechtigung: Admin/MFA darf alle löschen, Arzt nur eigene
  if (session.type === 'praxis' && session.rolle === 'Arzt') {
    const arzt = await prisma.arzt.findFirst({ where: { name: session.name }, select: { id: true } });
    if (!arzt || sz.arztId !== arzt.id) return NextResponse.json({ error: 'Sie koennen nur eigene Sperrzeiten loeschen.' }, { status: 403 });
  }

  await prisma.sperrzeit.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
