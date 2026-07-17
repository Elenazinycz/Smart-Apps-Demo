import { NextRequest, NextResponse } from "next/server";
import { requireMfaOrAdmin } from "@/lib/api-guard";
import { erfasseNoShow } from "@/lib/no-show";

/** POST /api/noshow/mark
 *  Markiert einen TerminSlot als No-Show.
 *  Body: { slotId: string }
 *  Loest bei Bedarf Erinnerung und/oder Sperre aus (STD-059, STD-060).
 *  Zugriff: MFA/Admin
 */
export async function POST(req: NextRequest) {
  const session = await requireMfaOrAdmin();
  if (session instanceof NextResponse) return session;

  let body: { slotId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body." }, { status: 400 });
  }

  if (!body.slotId || typeof body.slotId !== "string") {
    return NextResponse.json({ error: "slotId ist erforderlich." }, { status: 400 });
  }

  const ergebnis = await erfasseNoShow(body.slotId, session.id);

  if (!ergebnis.success) {
    return NextResponse.json({ error: ergebnis.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    noShowZaehlerNeu: ergebnis.noShowZaehlerNeu,
    erinnerungGesendet: ergebnis.erinnerungGesendet ?? false,
    buchungGesperrt: ergebnis.buchungGesperrt ?? false,
  });
}
