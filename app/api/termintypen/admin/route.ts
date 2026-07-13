import { validateCsrf } from '@/lib/csrf';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { validate, ValidationError } from '@/lib/validate';
import { PRIORITAET } from '@/lib/constants';

const PRIO_LISTE = Object.values(PRIORITAET);

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const tt = await prisma.termintyp.findUnique({ where: { id }, include: { arztZuordnungen: true } });
    if (!tt) return NextResponse.json({ error: 'Termintyp nicht gefunden.' }, { status: 404 });
    return NextResponse.json({ termintyp: tt });
  }

  const alle = await prisma.termintyp.findMany({
    orderBy: { bezeichnung: 'asc' },
    include: { arztZuordnungen: { select: { id: true, arztId: true, aktiv: true } } },
  });
  return NextResponse.json({ termintypen: alle });
}

export async function POST(req: NextRequest) {
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
      { name: 'bezeichnung', type: 'string', minLength: 1, maxLength: 100 },
      { name: 'dauerStandardMinuten', type: 'number', min: 1, max: 480 },
      { name: 'onlineBuchbar', type: 'boolean?' },
      { name: 'beschreibung', type: 'string?', maxLength: 500 },
      { name: 'prioritaet', type: 'string?', enum: PRIO_LISTE },
    ]);

    const { bezeichnung, dauerStandardMinuten, onlineBuchbar, beschreibung, prioritaet } = cleaned as {
      bezeichnung: string;
      dauerStandardMinuten: number;
      onlineBuchbar?: boolean;
      beschreibung?: string;
      prioritaet?: string;
    };

    const exist = await prisma.termintyp.findUnique({ where: { bezeichnung } });
    if (exist) return NextResponse.json({ error: 'Termintyp existiert bereits.' }, { status: 409 });

    const tt = await prisma.termintyp.create({
      data: {
        bezeichnung,
        dauerStandardMinuten,
        onlineBuchbar: onlineBuchbar ?? false,
        beschreibung: beschreibung ?? null,
        prioritaet: prioritaet ?? 'normal',
      },
    });
    return NextResponse.json({ success: true, termintyp: tt });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
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
      { name: 'id', type: 'string' },
      { name: 'bezeichnung', type: 'string?', minLength: 1, maxLength: 100 },
      { name: 'dauerStandardMinuten', type: 'number?', min: 1, max: 480 },
      { name: 'onlineBuchbar', type: 'boolean?' },
      { name: 'beschreibung', type: 'string?', maxLength: 500 },
      { name: 'prioritaet', type: 'string?', enum: PRIO_LISTE },
    ]);

    const data: Record<string, unknown> = {};
    if (cleaned.bezeichnung) data.bezeichnung = cleaned.bezeichnung;
    if (cleaned.dauerStandardMinuten) data.dauerStandardMinuten = cleaned.dauerStandardMinuten;
    if (typeof cleaned.onlineBuchbar === 'boolean') data.onlineBuchbar = cleaned.onlineBuchbar;
    if (cleaned.beschreibung !== undefined) data.beschreibung = cleaned.beschreibung || null;
    if (cleaned.prioritaet) data.prioritaet = cleaned.prioritaet;

    const updated = await prisma.termintyp.update({
      where: { id: cleaned.id as string },
      data,
    });
    return NextResponse.json({ success: true, termintyp: updated });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await validateCsrf(req))) return NextResponse.json({ error: 'Ungueltiger CSRF-Token.' }, { status: 403 });
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id erforderlich.' }, { status: 400 });

  const verknuepfte = await prisma.terminSlot.count({ where: { terminTypId: id } });
  if (verknuepfte > 0) {
    return NextResponse.json({ error: 'Termintyp kann nicht geloescht werden - es existieren Termine mit diesem Typ.' }, { status: 409 });
  }
  await prisma.arztTermintypZuordnung.deleteMany({ where: { terminTypId: id } });
  await prisma.termintyp.delete({ where: { id } });
  return NextResponse.json({ success: true });
}


