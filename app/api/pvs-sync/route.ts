import { validateCsrf } from '@/lib/csrf';
import { NextRequest, NextResponse } from 'next/server';
import { requireMfaOrAdmin } from '@/lib/api-guard';
import { getSyncLogs, countOffeneSyncs, importPatientAusPvs } from '@/lib/pvs-sync';

export async function GET() {
  const session = await requireMfaOrAdmin();
  if (session instanceof NextResponse) return session;

  const [logs, offeneSyncs] = await Promise.all([
    getSyncLogs(100),
    countOffeneSyncs(),
  ]);

  return NextResponse.json({ logs, offeneSyncs });
}

export async function POST(req: NextRequest) {
  if (!(await validateCsrf(req))) return NextResponse.json({ error: 'Ungueltiger CSRF-Token.' }, { status: 403 });
  const session = await requireMfaOrAdmin();
  if (session instanceof NextResponse) return session;

  let body: { pvsPatientenNr?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungueltiger JSON-Body.' }, { status: 400 });
  }

  if (!body.pvsPatientenNr) {
    return NextResponse.json({ error: 'pvsPatientenNr erforderlich.' }, { status: 400 });
  }

  const ergebnis = await importPatientAusPvs(body.pvsPatientenNr);
  if (!ergebnis.success) {
    return NextResponse.json({ error: ergebnis.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
