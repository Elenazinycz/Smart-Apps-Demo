import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { storniereTermin } from '@/lib/slots';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (session.type !== 'patient') return NextResponse.json({ error: 'Nur Patient:innen koennen stornieren.' }, { status: 403 });

  const { slotId } = await req.json();
  if (!slotId) return NextResponse.json({ error: 'slotId erforderlich.' }, { status: 400 });

  const ergebnis = await storniereTermin(slotId, session.id);
  if (!ergebnis.success) return NextResponse.json({ error: ergebnis.error }, { status: 409 });

  return NextResponse.json({ success: true });
}