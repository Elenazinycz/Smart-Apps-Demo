import { validateCsrf } from '@/lib/csrf';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { validate, ValidationError } from '@/lib/validate';

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const sprechzeiten = await prisma.sprechzeit.findMany({
    include: { arzt: { select: { name: true } } },
    orderBy: [{ arztId: 'asc' }, { wochentag: 'asc' }],
  });
  return NextResponse.json({ sprechzeiten });
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
      { name: 'arztId', type: 'string' },
      { name: 'wochentag', type: 'number', min: 1, max: 7 },
      { name: 'startZeit', type: 'string', pattern: '([01]\\d|2[0-3]):[0-5]\\d' },
      { name: 'endZeit', type: 'string', pattern: '([01]\\d|2[0-3]):[0-5]\\d' },
    ]);

    const sz = await prisma.sprechzeit.create({
      data: {
        arztId: cleaned.arztId as string,
        wochentag: cleaned.wochentag as number,
        startZeit: cleaned.startZeit as string,
        endZeit: cleaned.endZeit as string,
      },
    });
    return NextResponse.json({ success: true, sprechzeit: sz });
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
      { name: 'startZeit', type: 'string?', pattern: '([01]\\d|2[0-3]):[0-5]\\d' },
      { name: 'endZeit', type: 'string?', pattern: '([01]\\d|2[0-3]):[0-5]\\d' },
      { name: 'aktiv', type: 'boolean?' },
    ]);

    const data: Record<string, unknown> = {};
    if (cleaned.startZeit) data.startZeit = cleaned.startZeit;
    if (cleaned.endZeit) data.endZeit = cleaned.endZeit;
    if (typeof cleaned.aktiv === 'boolean') data.aktiv = cleaned.aktiv;

    const updated = await prisma.sprechzeit.update({
      where: { id: cleaned.id as string },
      data,
    });
    return NextResponse.json({ success: true, sprechzeit: updated });
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

  await prisma.sprechzeit.delete({ where: { id } });
  return NextResponse.json({ success: true });
}


