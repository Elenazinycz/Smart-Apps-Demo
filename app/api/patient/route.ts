import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (session.type !== 'patient') return NextResponse.json({ error: 'Nur fuer Patient:innen.' }, { status: 403 });

  const patient = await prisma.patient.findUnique({
    where: { id: session.id },
    select: {
      name: true,
      geburtsdatum: true,
      versicherungsart: true,
      telefonnummer: true,
      email: true,
      einwilligungEmail: true,
      einwilligungSms: true,
      noShowZaehlerJahr: true,
      status: true,
    },
  });

  if (!patient) return NextResponse.json({ error: 'Patient nicht gefunden.' }, { status: 404 });

  return NextResponse.json({ patient });
}