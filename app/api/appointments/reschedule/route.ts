import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { umbucheOnlineTermin } from '@/lib/slots';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (session.type !== 'patient') return NextResponse.json({ error: 'Nur Patient:innen koennen umbuchen.' }, { status: 403 });

  const { slotId, terminTypId, arztId, datum, startzeit } = await req.json();
  if (!slotId || !terminTypId || !arztId || !datum || !startzeit) {
    return NextResponse.json({ error: 'slotId, terminTypId, arztId, datum und startzeit erforderlich.' }, { status: 400 });
  }

  const ergebnis = await umbucheOnlineTermin(slotId, session.id, { terminTypId, arztId, datum, startzeit });
  if (!ergebnis.success) return NextResponse.json({ error: ergebnis.error }, { status: 409 });

  return NextResponse.json({ success: true });
}