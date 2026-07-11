import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { istArztFreigegeben } from '@/lib/slots';

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const terminTypId = searchParams.get('terminTypId');

  if (terminTypId) {
    const alle = await prisma.arzt.findMany({
      where: { aktiv: true },
      include: { termintypZuordnungen: true },
    });

    const freigegeben = [];
    for (const arzt of alle) {
      if (await istArztFreigegeben(arzt.id, terminTypId)) {
        freigegeben.push({ id: arzt.id, name: arzt.name });
      }
    }
    return NextResponse.json({ aerzte: freigegeben });
  }

  const aerzte = await prisma.arzt.findMany({
    where: { aktiv: true },
    select: { id: true, name: true, fachrichtung: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ aerzte });
}