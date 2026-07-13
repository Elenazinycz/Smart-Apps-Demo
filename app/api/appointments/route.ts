import { validateCsrf } from '@/lib/csrf';
import { NextRequest, NextResponse } from 'next/server';
import { requirePatient } from '@/lib/api-guard';
import { bucheOnlineTermin } from '@/lib/slots';
import { prisma } from '@/lib/prisma';
import { syncTerminBuchung } from '@/lib/pvs-sync';
import { sendeBuchungsbestaetigung } from '@/lib/notifications';
import { validate, ValidationError } from '@/lib/validate';

export async function POST(req: NextRequest) {
  if (!(await validateCsrf(req))) return NextResponse.json({ error: 'Ungueltiger CSRF-Token.' }, { status: 403 });
  const session = await requirePatient();
  if (session instanceof NextResponse) return session;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungueltiger JSON-Body.' }, { status: 400 });
  }

  try {
    const cleaned = validate(body, [
      { name: 'terminTypId', type: 'string' },
      { name: 'arztId', type: 'string' },
      { name: 'datum', type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2}' },
      { name: 'startzeit', type: 'string', pattern: '([01]\\d|2[0-3]):[0-5]\\d' },
    ]);
    const ergebnis = await bucheOnlineTermin({
      terminTypId: cleaned.terminTypId as string,
      arztId: cleaned.arztId as string,
      datum: cleaned.datum as string,
      startzeit: cleaned.startzeit as string,
      patientId: session.id,
    });
    if (!ergebnis.success) {
      return NextResponse.json({ error: ergebnis.error }, { status: 409 });
    }

    // Bestaetigung senden (nur mit Opt-in)
    const tt = await prisma.termintyp.findUnique({ where: { id: cleaned.terminTypId as string }, select: { bezeichnung: true } });
    const arzt = await prisma.arzt.findUnique({ where: { id: cleaned.arztId as string }, select: { name: true } });
        await sendeBuchungsbestaetigung(session.id, {
      datum: cleaned.datum as string,
      startzeit: cleaned.startzeit as string,
      arztName: arzt?.name ?? '',
      terminTypName: tt?.bezeichnung ?? '',
    });

    // PVS-Synchronisation (BR5)
    const patient = await prisma.patient.findUnique({ where: { id: session.id }, select: { internePatientennummer: true } });
    if (patient) {
      await syncTerminBuchung(patient.internePatientennummer, ergebnis.slotId ?? '');
    }

    return NextResponse.json({ success: true });;
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}

