import { NextRequest, NextResponse } from "next/server";
import { requireMfaOrAdmin } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

/** GET /api/patienten-suche?q=...
 *  Durchsucht Patienten nach Name oder interner Patientennummer (mind. 2 Zeichen).
 *  Zugriff: MFA/Admin
 */
export async function GET(req: NextRequest) {
  const session = await requireMfaOrAdmin();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ patienten: [] });
  }

  const patienten = await prisma.patient.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { internePatientennummer: { contains: q } },
      ],
      status: "aktiv",
    },
    select: {
      id: true,
      name: true,
      geburtsdatum: true,
      internePatientennummer: true,
      telefonnummer: true,
    },
    orderBy: { name: "asc" },
    take: 30,
  });

  return NextResponse.json({ patienten });
}
