import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { istArztFreigegeben } from '@/lib/slots';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const terminTypId = searchParams.get('terminTypId');
  if (!terminTypId) {
    return NextResponse.json({ error: 'terminTypId erforderlich.' }, { status: 400 });
  }

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
