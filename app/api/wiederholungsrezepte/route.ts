import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { validate, ValidationError } from '@/lib/validate';
import { validateCsrf } from '@/lib/csrf';
import { importRezeptAusPvs } from '@/lib/pvs-sync';

// Patient:in sieht eigene Rezepte
export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  const where: Record<string, unknown> = {};
  if (session.type === 'patient') {
    where.patientId = session.id;
  }

  const rezepte = await prisma.wiederholungsrezept.findMany({
    where: { ...where, rezeptStatus: { not: 'abgeholt' } },
    include: { patient: { select: { name: true, internePatientennummer: true } } },
    orderBy: { letzteAktualisierung: 'desc' },
  });

  return NextResponse.json({ rezepte });
}

// MFA/Admin kann Rezept-Status manuell aktualisieren (Mock-PVS-Import)
export async function POST(req: NextRequest) {
  if (!(await validateCsrf(req))) return NextResponse.json({ error: 'Ungueltiger CSRF-Token.' }, { status: 403 });
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  if (session.type !== 'praxis') return NextResponse.json({ error: 'Nur fuer Praxis-Nutzer:innen.' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungueltiger JSON-Body.' }, { status: 400 });
  }

  try {
    const cleaned = validate(body, [
      { name: 'pvsPatientenNr', type: 'string' },
      { name: 'rezeptStatus', type: 'string', enum: ['ausstehend', 'abholbereit', 'abgeholt'] },
      { name: 'bemerkung', type: 'string?', maxLength: 500 },
    ]);

    const ergebnis = await importRezeptAusPvs(
      cleaned.pvsPatientenNr as string,
      {
        pvsPatientenNr: cleaned.pvsPatientenNr as string,
        rezeptStatus: cleaned.rezeptStatus as 'ausstehend' | 'abholbereit' | 'abgeholt',
        bemerkung: cleaned.bemerkung as string | undefined,
      }
    );

    if (!ergebnis.success) {
      return NextResponse.json({ error: ergebnis.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
