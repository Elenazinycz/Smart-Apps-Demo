import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { validateCsrf } from "@/lib/csrf";

/** GET /api/rezeptfreigaben
 *  Liefert alle Wiederholungsrezepte mit Status "ausstehend" (freigabebereit).
 *  AErzt:innen sehen diese, um Rezepte freizugeben oder abzulehnen.
 */
export async function GET() {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  // Nur Aerzt:innen und Admins duerfen Freigaben sehen
  if (session.type !== "praxis" || (session.rolle !== "Arzt" && session.rolle !== "Admin")) {
    return NextResponse.json({ error: "Nur für Ärzt:innen und Admins." }, { status: 403 });
  }

  const rezepte = await prisma.wiederholungsrezept.findMany({
    where: { rezeptStatus: "ausstehend" },
    include: {
      patient: { select: { name: true, internePatientennummer: true, geburtsdatum: true } },
    },
    orderBy: { letzteAktualisierung: "desc" },
  });

  return NextResponse.json({ rezepte });
}

/** PATCH /api/rezeptfreigaben
 *  Arzt gibt Rezept frei (-> "abholbereit") oder lehnt ab (-> "abgeholt" mit Bemerkung).
 *  Body: { rezeptId: string, aktion: "freigeben" | "ablehnen", bemerkung?: string }
 */
export async function PATCH(req: NextRequest) {
  if (!(await validateCsrf(req))) {
    return NextResponse.json({ error: "Ungueltiger CSRF-Token." }, { status: 403 });
  }

  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  if (session.type !== "praxis" || (session.rolle !== "Arzt" && session.rolle !== "Admin")) {
    return NextResponse.json({ error: "Nur für Ärzt:innen und Admins." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungueltiger JSON-Body." }, { status: 400 });
  }

  const rezeptId = body.rezeptId as string | undefined;
  const aktion = body.aktion as string | undefined;
  const bemerkung = (body.bemerkung as string) || undefined;

  if (!rezeptId || !aktion || !["freigeben", "ablehnen"].includes(aktion)) {
    return NextResponse.json({ error: "rezeptId und aktion (freigeben/ablehnen) erforderlich." }, { status: 400 });
  }

  const rezept = await prisma.wiederholungsrezept.findUnique({ where: { id: rezeptId } });
  if (!rezept) {
    return NextResponse.json({ error: "Rezept nicht gefunden." }, { status: 404 });
  }
  if (rezept.rezeptStatus !== "ausstehend") {
    return NextResponse.json({ error: "Rezept hat nicht den Status 'ausstehend'." }, { status: 400 });
  }

  const neuerStatus = aktion === "freigeben" ? "abholbereit" : "abgeholt";

  await prisma.wiederholungsrezept.update({
    where: { id: rezeptId },
    data: {
      rezeptStatus: neuerStatus,
      bemerkung: bemerkung ?? rezept.bemerkung,
      letzteAktualisierung: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    message: aktion === "freigeben" ? "Rezept freigegeben." : "Rezept abgelehnt.",
  });
}
