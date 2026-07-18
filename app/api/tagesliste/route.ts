import { NextRequest, NextResponse } from "next/server";
import { requireMfaOrAdmin } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

/** GET /api/tagesliste?datum=YYYY-MM-DD&arztId=xxx
 *  Liefert alle TerminSlots mit status="gebucht" für ein Datum.
 *  Standard-Datum ist heute.
 *  Optionaler arztId-Parameter filtert auf einen bestimmten Arzt.
 *  Zugriff: MFA/Admin (requireMfaOrAdmin)
 */
export async function GET(req: NextRequest) {
  const session = await requireMfaOrAdmin();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const datumParam = searchParams.get("datum");
  const arztId = searchParams.get("arztId");

  // Datum für Abfrage: Standard = heute (lokale Zeit)
  const heute = new Date();
  const jahr = heute.getFullYear();
  const monat = heute.getMonth();
  const tag = heute.getDate();

  let datumStart: Date;
  if (datumParam) {
    const [y, m, d] = datumParam.split("-").map(Number);
    datumStart = new Date(y, m - 1, d, 0, 0, 0, 0);
  } else {
    datumStart = new Date(jahr, monat, tag, 0, 0, 0, 0);
  }

  const datumEnde = new Date(datumStart);
  datumEnde.setHours(23, 59, 59, 999);

  const where: Record<string, unknown> = {
    datum: { gte: datumStart, lte: datumEnde },
    status: "gebucht",
    patientId: { not: null },
  };

  if (arztId) {
    where.arztId = arztId;
  }

  const slots = await prisma.terminSlot.findMany({
    where,
    include: {
      patient: { select: { id: true, name: true } },
      arzt: { select: { name: true } },
      terminTyp: { select: { bezeichnung: true } },
    },
    orderBy: { startzeit: "asc" },
  });

  const datumStr = datumStart.toISOString().split("T")[0];

  return NextResponse.json({ slots, datum: datumStr });
}
