import { NextResponse } from 'next/server';
import { requirePatient } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await requirePatient();
  if (session instanceof NextResponse) return session;

  const termine = await prisma.terminSlot.findMany({
    where: { patientId: session.id, status: 'gebucht', datum: { gte: new Date() } },
    include: { arzt: { select: { name: true } }, terminTyp: { select: { bezeichnung: true, dauerStandardMinuten: true } } },
    orderBy: { datum: 'asc' },
  });

  return NextResponse.json({ termine });
}
