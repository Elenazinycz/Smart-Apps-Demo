import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { istMfaOderAdmin } from '@/lib/rollen';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (!istMfaOderAdmin(session)) return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });

  const body = await req.json();
  const { patientId, benutzername } = body;

  if (!patientId || !benutzername) {
    return NextResponse.json({ error: 'patientId und benutzername erforderlich.' }, { status: 400 });
  }

  // Prüfen ob Patient existiert
  const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { id: true, name: true, status: true } });
  if (!patient) return NextResponse.json({ error: 'Patient nicht gefunden.' }, { status: 404 });
  if (patient.status !== 'aktiv') return NextResponse.json({ error: 'Patient ist nicht aktiv.' }, { status: 400 });

  // Prüfen ob Konto bereits existiert
  const exist = await prisma.patientenKonto.findUnique({ where: { benutzername } });
  if (exist) return NextResponse.json({ error: 'Benutzername bereits vergeben.' }, { status: 409 });

  const existPatient = await prisma.patientenKonto.findUnique({ where: { patientId } });
  if (existPatient) return NextResponse.json({ error: 'Patient hat bereits ein Konto.' }, { status: 409 });

  // Konto anlegen (Mock-Passwort-Hash)
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
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (!istMfaOderAdmin(session)) return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });

  // Alle Patienten ohne Konto auflisten
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