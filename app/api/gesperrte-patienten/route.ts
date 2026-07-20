import { NextResponse } from "next/server";
import { requireMfaOrAdmin } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { KONTO_STATUS } from "@/lib/constants";

type GesperrterPatient = {
  patientId: string;
  patientName: string;
  geburtsdatum: string;
  telefonnummer: string;
  email: string | null;
  noShowZaehlerJahr: number;
  kontoErstelltAm: string;
  letzterLogin: string | null;
};

/** GET /api/gesperrte-patienten
 *  Liefert alle Patient:innen mit gesperrtem Online-Buchungsstatus.
 *  Zugriff: MFA/Admin
 */
export async function GET() {
  const session = await requireMfaOrAdmin();
  if (session instanceof NextResponse) return session;

  const patientenMitSperre = await prisma.patientenKonto.findMany({
    where: { buchungsStatus: KONTO_STATUS.GESPERRT },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          geburtsdatum: true,
          telefonnummer: true,
          email: true,
          noShowZaehlerJahr: true,
        },
      },
    },
    orderBy: { erstelltAm: "desc" },
  });

  const result: GesperrterPatient[] = patientenMitSperre.map((k) => ({
    patientId: k.patient.id,
    patientName: k.patient.name,
    geburtsdatum: k.patient.geburtsdatum.toISOString().split("T")[0],
    telefonnummer: k.patient.telefonnummer,
    email: k.patient.email,
    noShowZaehlerJahr: k.patient.noShowZaehlerJahr,
    kontoErstelltAm: k.erstelltAm.toISOString().split("T")[0],
    letzterLogin: k.letzterLogin?.toISOString().split("T")[0] ?? null,
  }));

  return NextResponse.json({ patienten: result });
}
