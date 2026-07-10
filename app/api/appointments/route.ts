import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { bucheOnlineTermin } from '@/lib/slots';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  }

  if (session.type !== 'patient') {
    return NextResponse.json({ error: 'Nur Patient:innen koennen online buchen.' }, { status: 403 });
  }

  const body = await req.json();
  const { terminTypId, arztId, datum, startzeit } = body;

  if (!terminTypId || !arztId || !datum || !startzeit) {
    return NextResponse.json({ error: 'Alle Felder sind erforderlich: terminTypId, arztId, datum, startzeit' }, { status: 400 });
  }

  const ergebnis = await bucheOnlineTermin({
    terminTypId,
    arztId,
    datum,
    startzeit,
    patientId: session.id,
  });

  if (!ergebnis.success) {
    return NextResponse.json({ error: ergebnis.error }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}
