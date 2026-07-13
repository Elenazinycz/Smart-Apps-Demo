import { validateCsrf } from '@/lib/csrf';
import { NextRequest, NextResponse } from 'next/server';
import { requirePatient } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { validate, ValidationError } from '@/lib/validate';

export async function PUT(req: NextRequest) {
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
      { name: 'einwilligungEmail', type: 'boolean?' },
      { name: 'einwilligungSms', type: 'boolean?' },
    ]);

    const updateData: Record<string, unknown> = {};
    if (typeof cleaned.einwilligungEmail === 'boolean') updateData.einwilligungEmail = cleaned.einwilligungEmail;
    if (typeof cleaned.einwilligungSms === 'boolean') updateData.einwilligungSms = cleaned.einwilligungSms;

    await prisma.patient.update({
      where: { id: session.id },
      data: updateData,
    });

    const patient = await prisma.patient.findUnique({
      where: { id: session.id },
      select: { einwilligungEmail: true, einwilligungSms: true, email: true, telefonnummer: true },
    });

    return NextResponse.json({ success: true, patient });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
