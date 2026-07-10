import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { istAdmin } from '@/lib/rollen';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (!istAdmin(session)) return NextResponse.json({ error: 'Nur Admin.' }, { status: 403 });

  const zuordnungen = await prisma.arztTermintypZuordnung.findMany({
    include: {
      arzt: { select: { id: true, name: true } },
      terminTyp: { select: { id: true, bezeichnung: true, dauerStandardMinuten: true } },
    },
    orderBy: [{ arztId: 'asc' }, { terminTypId: 'asc' }],
  });

  return NextResponse.json({ zuordnungen });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (!istAdmin(session)) return NextResponse.json({ error: 'Nur Admin.' }, { status: 403 });

  const { zuordnungId, onlineErlaubt, aktiv } = await req.json();
  if (!zuordnungId) return NextResponse.json({ error: 'zuordnungId erforderlich.' }, { status: 400 });

  const data: any = {};
  if (typeof onlineErlaubt === 'boolean') data.onlineErlaubt = onlineErlaubt;
  if (typeof aktiv === 'boolean') data.aktiv = aktiv;

  const updated = await prisma.arztTermintypZuordnung.update({ where: { id: zuordnungId }, data });
  return NextResponse.json({ success: true, zuordnung: updated });
}