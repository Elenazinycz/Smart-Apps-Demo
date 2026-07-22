import { NextRequest, NextResponse } from "next/server";
import { requireMfaOrAdmin } from "@/lib/api-guard";
import { validateCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { SLOT_STATUS, BUCHUNGSQUELLE, SLOT_ART } from "@/lib/constants";
import { validate, ValidationError } from "@/lib/validate";

/** POST /api/akutslots-live/buchen
 *  Bucht einen freien Akutslot telefonisch fuer einen Patienten.
 *  Body: { slotId: string, patientId?: string, patientNameFreitext?: string, telefonFreitext?: string }
 *
 *  KRITISCH (spec.md §14): Atomare Slot-Sperre via updateMany mit status-Filter.
 *  Wenn der Slot bereits von jemand anderem gebucht wurde, wird der Vorgang abgelehnt.
 *
 *  Zugriff: MFA/Admin
 */
export async function POST(req: NextRequest) {
  // CSRF-Pruefung
  if (!(await validateCsrf(req))) {
    return NextResponse.json({ error: "Ungueltiger CSRF-Token." }, { status: 403 });
  }

  const session = await requireMfaOrAdmin();
  if (session instanceof NextResponse) return session;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungueltiger JSON-Body." }, { status: 400 });
  }

  try {
    const cleaned = validate(body, [
      { name: "slotId", type: "string" },
      { name: "patientId", type: "string?" },
      { name: "patientNameFreitext", type: "string?" },
      { name: "telefonFreitext", type: "string?" },
    ]);

    const { slotId, patientId, patientNameFreitext, telefonFreitext } = cleaned as {
      slotId: string;
      patientId?: string;
      patientNameFreitext?: string;
      telefonFreitext?: string;
    };

    // Entweder patientId (existierendes Konto) ODER Freitext
    if (!patientId && !patientNameFreitext) {
      return NextResponse.json(
        { error: "Bitte entweder einen Patienten auswaehlen oder Namen/Telefon eingeben." },
        { status: 400 }
      );
    }

    // Slot vorab laden, um sicherzustellen, dass es sich um einen Akutslot handelt
    const slot = await prisma.terminSlot.findUnique({
      where: { id: slotId },
      select: { id: true, slotArt: true, status: true },
    });

    if (!slot) {
      return NextResponse.json({ error: "Slot nicht gefunden." }, { status: 404 });
    }

    if (slot.slotArt !== SLOT_ART.AKUT) {
      return NextResponse.json({ error: "Nur Akutslots koennen hier gebucht werden." }, { status: 400 });
    }

    // ATOMAR: updateMany mit status="frei"-Filter
    // Nur wenn der Slot aktuell FREI ist, wird er auf GEBAUT gesetzt
    const result = await prisma.terminSlot.updateMany({
      where: {
        id: slotId,
        status: SLOT_STATUS.FREI,
      },
      data: {
        status: SLOT_STATUS.GEBAUT,
        patientId: patientId ?? null,
        buchungsquelle: BUCHUNGSQUELLE.TELEFONISCH,
      },
    });

    if (result.count === 0) {
      // Slot wurde inzwischen von jemand anderem gebucht oder ist nicht mehr frei
      return NextResponse.json(
        { error: "Dieser Slot wurde inzwischen bereits vergeben." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: patientId
        ? "Akutslot erfolgreich telefonisch gebucht."
        : "Akutslot erfolgreich fuer Gast-Patienten erfasst.",
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
