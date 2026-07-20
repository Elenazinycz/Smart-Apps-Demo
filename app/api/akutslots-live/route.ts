import { NextResponse } from "next/server";
import { requireMfaOrAdmin } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { SLOT_ART, SLOT_STATUS } from "@/lib/constants";

/** GET /api/akutslots-live
 *  Liefert die aktuell freien (ungebuchten) Akutslots für heute.
 *  Zugriff: MFA/Admin
 */
export async function GET() {
  const session = await requireMfaOrAdmin();
  if (session instanceof NextResponse) return session;

  const heute = new Date();
  const heuteStart = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate(), 0, 0, 0, 0);
  const heuteEnde = new Date(heuteStart.getTime() + 24 * 60 * 60 * 1000);

  const freieSlots = await prisma.terminSlot.findMany({
    where: {
      datum: { gte: heuteStart, lt: heuteEnde },
      slotArt: SLOT_ART.AKUT,
      status: SLOT_STATUS.FREI,
    },
    include: {
      arzt: { select: { id: true, name: true } },
    },
    orderBy: { startzeit: "asc" },
  });

  return NextResponse.json({ slots: freieSlots });
}