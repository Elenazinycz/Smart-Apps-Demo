import { validateCsrf } from '@/lib/csrf';
import { NextRequest, NextResponse } from 'next/server';
import { requirePatient } from '@/lib/api-guard';
import { umbucheOnlineTermin } from '@/lib/slots';
import { prisma } from '@/lib/prisma';
import { sendeUmbuchungsbestaetigung } from '@/lib/notifications';
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
      { name: 'terminTypId', type: 'string' },
      { name: 'arztId', type: 'string' },
      { name: 'datum', type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2}' },
      { name: 'startzeit', type: 'string', pattern: '([01]\\d|2[0-3]):[0-5]\\d' },
    ]);
    const ergebnis = await umbucheOnlineTermin(
      cleaned.slotId as string,
      session.id,
      {
        terminTypId: cleaned.terminTypId as string,
        arztId: cleaned.arztId as string,
        datum: cleaned.datum as string,
        startzeit: cleaned.startzeit as string,
      }
    );
    if (!ergebnis.success) return NextResponse.json({ error: ergebnis.error }, { status: 409 });

    // Umbuchungs-Bestaetigung senden (nur mit Opt-in)
    const alterSlot = await prisma.terminSlot.findUnique({
      where: { id: cleaned.slotId as string },
      include: { arzt: { select: { name: true } }, terminTyp: { select: { bezeichnung: true } } },
    });
    if (alterSlot) {
      const neuerArzt = await prisma.arzt.findUnique({ where: { id: cleaned.arztId as string }, select: { name: true } });
      const neuerTyp = await prisma.termintyp.findUnique({ where: { id: cleaned.terminTypId as string }, select: { bezeichnung: true } });
      await sendeUmbuchungsbestaetigung(session.id,
        { datum: alterSlot.datum.toISOString().split('T')[0], startzeit: alterSlot.startzeit.toISOString().split('T')[1]?.substring(0, 5) ?? '' },
        { datum: cleaned.datum as string, startzeit: cleaned.startzeit as string, arztName: neuerArzt?.name ?? '', terminTypName: neuerTyp?.bezeichnung ?? '' }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
