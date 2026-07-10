import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getFreieSlots } from '@/lib/slots';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  }

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
