import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { istOnlineBuchbar } from '@/lib/slots';

export async function GET() {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  const alle = await prisma.termintyp.findMany({
    orderBy: { bezeichnung: 'asc' },
  });

  const onlineBuchbar = [];
  for (const t of alle) {
    if (await istOnlineBuchbar(t.id)) {
      onlineBuchbar.push({ id: t.id, bezeichnung: t.bezeichnung, dauer: t.dauerStandardMinuten });
    }
  }

  return NextResponse.json({ termintypen: onlineBuchbar });
}
