import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { istAdmin } from '@/lib/rollen';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (!istAdmin(session)) return NextResponse.json({ error: 'Nur Admin.' }, { status: 403 });

  const sprechzeiten = await prisma.sprechzeit.findMany({
    include: { arzt: { select: { name: true } } },
    orderBy: [{ arztId: 'asc' }, { wochentag: 'asc' }],
  });
  return NextResponse.json({ sprechzeiten });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (!istAdmin(session)) return NextResponse.json({ error: 'Nur Admin.' }, { status: 403 });

  const { arztId, wochentag, startZeit, endZeit } = await req.json();
  if (!arztId || !wochentag || !startZeit || !endZeit) {
    return NextResponse.json({ error: 'arztId, wochentag (1-7), startZeit (HH:mm), endZeit (HH:mm) erforderlich.' }, { status: 400 });
  }
  if (wochentag < 1 || wochentag > 7) return NextResponse.json({ error: 'wochentag muss 1 (Mo) bis 7 (So) sein.' }, { status: 400 });

  const sz = await prisma.sprechzeit.create({ data: { arztId, wochentag, startZeit, endZeit } });
  return NextResponse.json({ success: true, sprechzeit: sz });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (!istAdmin(session)) return NextResponse.json({ error: 'Nur Admin.' }, { status: 403 });

  const { id, startZeit, endZeit, aktiv } = await req.json();
  if (!id) return NextResponse.json({ error: 'id erforderlich.' }, { status: 400 });

  const data: any = {};
  if (startZeit) data.startZeit = startZeit;
  if (endZeit) data.endZeit = endZeit;
  if (typeof aktiv === 'boolean') data.aktiv = aktiv;

  const updated = await prisma.sprechzeit.update({ where: { id }, data });
  return NextResponse.json({ success: true, sprechzeit: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  if (!istAdmin(session)) return NextResponse.json({ error: 'Nur Admin.' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id erforderlich.' }, { status: 400 });

  await prisma.sprechzeit.delete({ where: { id } });
  return NextResponse.json({ success: true });
}