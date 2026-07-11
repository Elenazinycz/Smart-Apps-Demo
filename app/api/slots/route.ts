import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { getFreieSlots } from '@/lib/slots';

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const arztId = searchParams.get('arztId');
  const terminTypId = searchParams.get('terminTypId');
  const datum = searchParams.get('datum');

  if (!arztId || !terminTypId || !datum) {
    return NextResponse.json({ error: 'arztId, terminTypId und datum erforderlich.' }, { status: 400 });
  }

  const slots = await getFreieSlots(arztId, terminTypId, datum);
  return NextResponse.json({ slots });
}
