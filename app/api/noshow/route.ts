import { NextRequest, NextResponse } from "next/server";
import { requirePraxis } from "@/lib/api-guard";
import { getNoShowUebersicht, entSperrePatientOnlineBuchung } from "@/lib/no-show";

export async function GET() {
  const session = await requirePraxis();
  if (session instanceof NextResponse) return session;

  const uebersicht = await getNoShowUebersicht();
  return NextResponse.json({ patienten: uebersicht });
}

export async function POST(req: NextRequest) {
  const session = await requirePraxis();
  if (session instanceof NextResponse) return session;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body." }, { status: 400 });
  }

  const { patientId, noShowZaehlerReset } = body as { patientId?: string; noShowZaehlerReset?: number };

  if (!patientId || typeof patientId !== "string") {
    return NextResponse.json({ error: "patientId ist erforderlich." }, { status: 400 });
  }

  // Sperre aufheben und Zähler zurücksetzen
  const ergebnis = await entSperrePatientOnlineBuchung(
    patientId,
    typeof noShowZaehlerReset === "number" ? noShowZaehlerReset : 0
  );

  if (!ergebnis.success) {
    return NextResponse.json({ error: ergebnis.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
