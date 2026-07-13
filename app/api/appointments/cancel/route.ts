import { validateCsrf } from '@/lib/csrf';
import { NextRequest, NextResponse } from 'next/server';
import { requirePatient } from '@/lib/api-guard';
import { storniereTermin } from '@/lib/slots';
import { prisma } from '@/lib/prisma';
import { syncTerminStornierung } from '@/lib/pvs-sync';
import { sendeStornierungsbestaetigung } from '@/lib/notifications';
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
      { name: 'slotId', type: 'string' },
    ]);
    const ergebnis = await storniereTermin(cleaned.slotId as string, session.id);
    if (!ergebnis.success) return NextResponse.json({ error: ergebnis.error }, { status: 409 });

    // Storno-Bestaetigung senden (nur mit Opt-in)
    const slot = await prisma.terminSlot.findUnique({
      where: { id: cleaned.slotId as string },
      include: { arzt: { select: { name: true } }, terminTyp: { select: { bezeichnung: true } } },
    });
    if (slot) {
      await sendeStornierungsbestaetigung(session.id, {
        datum: slot.datum.toISOString().split('T')[0],
        startzeit: slot.startzeit.toISOString().split('T')[1]?.substring(0, 5) ?? '',
        arztName: slot.arzt.name,
        terminTypName: slot.terminTyp.bezeichnung,
      });

      // PVS-Synchronisation (BR5)
      const patient = await prisma.patient.findUnique({ where: { id: session.id }, select: { internePatientennummer: true } });
      if (patient) {
        await syncTerminStornierung(patient.internePatientennummer, slot.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
