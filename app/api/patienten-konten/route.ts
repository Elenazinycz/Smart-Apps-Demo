import { NextRequest, NextResponse } from 'next/server';
import { requireMfaOrAdmin } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { validate, ValidationError } from '@/lib/validate';

export async function POST(req: NextRequest) {
  const session = await requireMfaOrAdmin();
  if (session instanceof NextResponse) return session;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungueltiger JSON-Body.' }, { status: 400 });
  }

  try {
    const cleaned = validate(body, [
      { name: 'patientId', type: 'string' },
      { name: 'benutzername', type: 'string', minLength: 3, maxLength: 50 },
    ]);

    const { patientId, benutzername } = cleaned as { patientId: string; benutzername: string };

    const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { id: true, name: true, status: true } });
    if (!patient) return NextResponse.json({ error: 'Patient nicht gefunden.' }, { status: 404 });
    if (patient.status !== 'aktiv') return NextResponse.json({ error: 'Patient ist nicht aktiv.' }, { status: 400 });

    const exist = await prisma.patientenKonto.findUnique({ where: { benutzername } });
    if (exist) return NextResponse.json({ error: 'Benutzername bereits vergeben.' }, { status: 409 });

    const existPatient = await prisma.patientenKonto.findUnique({ where: { patientId } });
    if (existPatient) return NextResponse.json({ error: 'Patient hat bereits ein Konto.' }, { status: 409 });

    const konto = await prisma.patientenKonto.create({
      data: {
        patientId,
        benutzername,
        passwortHash: 'mfa_created_mock_hash',
        erstelltVonNutzerId: session.id,
        buchungsStatus: 'aktiv',
      },
    });

    return NextResponse.json({
      success: true,
      konto: { id: konto.id, benutzername: konto.benutzername, patientId: konto.patientId },
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}

export async function GET(req: NextRequest) {
  const session = await requireMfaOrAdmin();
  if (session instanceof NextResponse) return session;

  const patientenOhneKonto = await prisma.patient.findMany({
    where: {
      konto: null,
      status: 'aktiv',
    },
    select: { id: true, name: true, geburtsdatum: true, versicherungsart: true, internePatientennummer: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ patienten: patientenOhneKonto });
}