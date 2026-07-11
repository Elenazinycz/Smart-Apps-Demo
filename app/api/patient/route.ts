import { NextResponse } from 'next/server';
import { requirePatient } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await requirePatient();
  if (session instanceof NextResponse) return session;

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
