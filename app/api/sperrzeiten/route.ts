import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { istAdmin, istMfaOderAdmin, istArzt } from '@/lib/rollen';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (!istMfaOderAdmin(session) && !istArzt(session)) return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });

  const where: any = {};
  // �rzte sehen nur ihre eigenen Sperrzeiten
  if (istArzt(session) && !istAdmin(session)) {
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
  const session = await getSession();
  if (!session || session.type !== 'praxis') return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });

  const { titel, startdatum, enddatum, startzeit, endzeit, betrifft, arztId, grund } = await req.json();
  if (!titel || !startdatum || !enddatum || !betrifft || !grund) {
    return NextResponse.json({ error: 'titel, startdatum, enddatum, betrifft, grund erforderlich.' }, { status: 400 });
  }

  // Berechtigungspr�fung: Arzt darf nur eigene Abwesenheiten, Admin/MFA alle
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
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id erforderlich.' }, { status: 400 });

  const sz = await prisma.sperrzeit.findUnique({ where: { id }, select: { erstelltVonNutzerId: true, arztId: true } });
  if (!sz) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 });

  // Berechtigung: Admin/MFA darf alle l�schen, Arzt nur eigene
  if (!istMfaOderAdmin(session) && istArzt(session)) {
    const arzt = await prisma.arzt.findFirst({ where: { name: session.name }, select: { id: true } });
    if (!arzt || sz.arztId !== arzt.id) return NextResponse.json({ error: 'Sie koennen nur eigene Sperrzeiten loeschen.' }, { status: 403 });
  }

  await prisma.sperrzeit.delete({ where: { id } });
  return NextResponse.json({ success: true });
}