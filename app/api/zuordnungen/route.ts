import { validateCsrf } from '@/lib/csrf';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { validate, ValidationError } from '@/lib/validate';

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const zuordnungen = await prisma.arztTermintypZuordnung.findMany({
    include: {
      arzt: { select: { id: true, name: true } },
      terminTyp: { select: { id: true, bezeichnung: true, dauerStandardMinuten: true } },
    },
    orderBy: [{ arztId: 'asc' }, { terminTypId: 'asc' }],
  });

  return NextResponse.json({ zuordnungen });
}

export async function PUT(req: NextRequest) {
  if (!(await validateCsrf(req))) return NextResponse.json({ error: 'Ungueltiger CSRF-Token.' }, { status: 403 });
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ung�ltiger JSON-Body.' }, { status: 400 });
  }

  try {
    const cleaned = validate(body, [
      { name: 'zuordnungId', type: 'string' },
      { name: 'onlineErlaubt', type: 'boolean?' },
      { name: 'aktiv', type: 'boolean?' },
    ]);

    const data: Record<string, unknown> = {};
    if (typeof cleaned.onlineErlaubt === 'boolean') data.onlineErlaubt = cleaned.onlineErlaubt;
    if (typeof cleaned.aktiv === 'boolean') data.aktiv = cleaned.aktiv;

    const updated = await prisma.arztTermintypZuordnung.update({
      where: { id: cleaned.zuordnungId as string },
      data,
    });
    return NextResponse.json({ success: true, zuordnung: updated });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}


