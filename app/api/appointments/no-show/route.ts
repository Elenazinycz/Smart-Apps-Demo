import { validateCsrf } from "@/lib/csrf";
import { NextRequest, NextResponse } from "next/server";
import { requirePraxis } from "@/lib/api-guard";
import { erfasseNoShow } from "@/lib/no-show";
import { prisma } from "@/lib/prisma";
import { validate, ValidationError } from "@/lib/validate";

export async function POST(req: NextRequest) {
  if (!(await validateCsrf(req))) return NextResponse.json({ error: "Ungültiger CSRF-Token." }, { status: 403 });

  const session = await requirePraxis();
  if (session instanceof NextResponse) return session;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body." }, { status: 400 });
  }

  try {
    const cleaned = validate(body, [{ name: "slotId", type: "string" }]);
    const ergebnis = await erfasseNoShow(cleaned.slotId as string, session.id);

    if (!ergebnis.success) {
      return NextResponse.json({ error: ergebnis.error }, { status: 409 });
    }

    // Slot-Details für Antwort
    const slot = await prisma.terminSlot.findUnique({
      where: { id: cleaned.slotId as string },
      include: {
        patient: { select: { id: true, name: true, noShowZaehlerJahr: true } },
        arzt: { select: { name: true } },
        terminTyp: { select: { bezeichnung: true } },
      },
    });

    return NextResponse.json({
      success: true,
      ergebnis,
      slot: slot
        ? {
            datum: slot.datum.toISOString().split("T")[0],
            startzeit: slot.startzeit.toISOString().split("T")[1]?.substring(0, 5) ?? "",
            patientName: slot.patient?.name,
            arztName: slot.arzt.name,
            terminTypName: slot.terminTyp.bezeichnung,
          }
        : null,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
