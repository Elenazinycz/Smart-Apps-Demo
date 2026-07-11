import { NextRequest, NextResponse } from 'next/server';
import { requirePatient } from '@/lib/api-guard';
import { storniereTermin } from '@/lib/slots';
import { validate, ValidationError } from '@/lib/validate';

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}