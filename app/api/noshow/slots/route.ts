import { NextRequest, NextResponse } from "next/server";
import { requireMfaOrAdmin } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

/** GET /api/noshow/slots
 *  Liefert fuer heute alle TerminSlots, die potenziell als No-Show markiert werden koennen.
 *  Dazu zaehlen:
 *  - status = "gebucht" und datum = heute (oder in der Vergangenheit)
 *  - slot mit status = "frei" und in der Vergangenheit (durchgefallen, kein Patient)
 *  Zugriff: MFA/Admin
 */
export async function GET() {
  const session = await requireMfaOrAdmin();
  if (session instanceof NextResponse) return session;

  const heuteStart = new Date();
  heuteStart.setHours(0, 0, 0, 0);

  const heuteEnde = new Date();
  heuteEnde.setHours(23, 59, 59, 999);

  const slots = await prisma.terminSlot.findMany({
    where: {
      datum: { gte: heuteStart, lte: heuteEnde },
      OR: [
        { status: "gebucht" },
      ],
      patientId: { not: null },
    },
    include: {
      patient: { select: { id: true, name: true } },
      arzt: { select: { name: true } },
      terminTyp: { select: { bezeichnung: true } },
    },
    orderBy: { startzeit: "asc" },
  });

  // Vergangene gebuchte Slots (startzeit liegt vor jetzt)
  const jetzt = new Date();
  const markierbare = slots.filter((s) => new Date(s.startzeit) < jetzt);

  return NextResponse.json({ slots: markierbare });
}
