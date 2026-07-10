import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { istAdmin } from '@/lib/rollen';
import { PRIORITAET } from '@/lib/constants';

const PRIO_LISTE = Object.values(PRIORITAET);

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (!istAdmin(session)) return NextResponse.json({ error: 'Nur Admin.' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const tt = await prisma.termintyp.findUnique({ where: { id }, include: { arztZuordnungen: true } });
    if (!tt) return NextResponse.json({ error: 'Termintyp nicht gefunden.' }, { status: 404 });
    return NextResponse.json({ termintyp: tt });
  }

  const alle = await prisma.termintyp.findMany({
    orderBy: { bezeichnung: 'asc' },
    include: { arztZuordnungen: { select: { id: true, arztId: true, aktiv: true } } },
  });
  return NextResponse.json({ termintypen: alle });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (!istAdmin(session)) return NextResponse.json({ error: 'Nur Admin.' }, { status: 403 });

  const { bezeichnung, dauerStandardMinuten, onlineBuchbar, beschreibung, prioritaet } = await req.json();
  if (!bezeichnung || !dauerStandardMinuten) {
    return NextResponse.json({ error: 'bezeichnung und dauerStandardMinuten erforderlich.' }, { status: 400 });
  }
  if (prioritaet && !PRIO_LISTE.includes(prioritaet)) {
    return NextResponse.json({ error: 'Ungueltige Prioritaet.' }, { status: 400 });
  }

  const exist = await prisma.termintyp.findUnique({ where: { bezeichnung } });
  if (exist) return NextResponse.json({ error: 'Termintyp existiert bereits.' }, { status: 409 });

  const tt = await prisma.termintyp.create({
    data: {
      bezeichnung,
      dauerStandardMinuten,
      onlineBuchbar: onlineBuchbar ?? false,
      beschreibung: beschreibung ?? null,
      prioritaet: prioritaet ?? 'normal',
    },
  });
  return NextResponse.json({ success: true, termintyp: tt });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (!istAdmin(session)) return NextResponse.json({ error: 'Nur Admin.' }, { status: 403 });

  const { id, bezeichnung, dauerStandardMinuten, onlineBuchbar, beschreibung, prioritaet } = await req.json();
  if (!id) return NextResponse.json({ error: 'id erforderlich.' }, { status: 400 });

  const data: any = {};
  if (bezeichnung) data.bezeichnung = bezeichnung;
  if (dauerStandardMinuten) data.dauerStandardMinuten = dauerStandardMinuten;
  if (typeof onlineBuchbar === 'boolean') data.onlineBuchbar = onlineBuchbar;
  if (beschreibung !== undefined) data.beschreibung = beschreibung;
  if (prioritaet) {
    if (!PRIO_LISTE.includes(prioritaet)) return NextResponse.json({ error: 'Ungueltige Prioritaet.' }, { status: 400 });
    data.prioritaet = prioritaet;
  }

  const updated = await prisma.termintyp.update({ where: { id }, data });
  return NextResponse.json({ success: true, termintyp: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (!istAdmin(session)) return NextResponse.json({ error: 'Nur Admin.' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id erforderlich.' }, { status: 400 });

  const verknuepfte = await prisma.terminSlot.count({ where: { terminTypId: id } });
  if (verknuepfte > 0) {
    return NextResponse.json({ error: 'Termintyp kann nicht geloescht werden - es existieren Termine mit diesem Typ.' }, { status: 409 });
  }
  await prisma.arztTermintypZuordnung.deleteMany({ where: { terminTypId: id } });
  await prisma.termintyp.delete({ where: { id } });
  return NextResponse.json({ success: true });
}