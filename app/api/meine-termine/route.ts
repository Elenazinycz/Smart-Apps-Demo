import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (session.type !== 'patient') return NextResponse.json({ error: 'Nur fuer Patient:innen.' }, { status: 403 });

  const termine = await prisma.terminSlot.findMany({
    where: { patientId: session.id, status: 'gebucht', datum: { gte: new Date() } },
    include: { arzt: { select: { name: true } }, terminTyp: { select: { bezeichnung: true, dauerStandardMinuten: true } } },
    orderBy: { datum: 'asc' },
  });

  return NextResponse.json({ termine });
}