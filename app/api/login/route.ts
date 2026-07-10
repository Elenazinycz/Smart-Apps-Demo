import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { benutzername, passwort } = await req.json();

  if (!benutzername || !passwort) {
    return NextResponse.json({ error: "Benutzername und Passwort erforderlich" }, { status: 400 });
  }

  // 1. Versuche PraxisNutzer-Login (MFA, Arzt, Admin)
  const praxisUser = await prisma.praxisNutzer.findFirst({
    where: { emailDienstlich: benutzername, aktiv: true },
  });

  if (praxisUser) {
    // Mock: jedes nicht-leere Passwort akzeptieren
    if (passwort.length === 0) {
      return NextResponse.json({ error: "Passwort erforderlich" }, { status: 401 });
    }

    await setSessionCookie({
      type: "praxis",
      id: praxisUser.id,
      name: praxisUser.name,
      rolle: praxisUser.rolle,
      berechtigung: praxisUser.berechtigung,
    });

    return NextResponse.json({
      success: true,
      user: { name: praxisUser.name, rolle: praxisUser.rolle, type: "praxis" },
    });
  }

  // 2. Versuche PatientenKonto-Login
  const konto = await prisma.patientenKonto.findFirst({
    where: { benutzername, buchungsStatus: "aktiv" },
    include: { patient: true },
  });

  if (konto) {
    if (passwort.length === 0) {
      return NextResponse.json({ error: "Passwort erforderlich" }, { status: 401 });
    }

    // Mock: Patientenkonto ohne echten Hash – jedes Passwort ok
    await setSessionCookie({
      type: "patient",
      id: konto.patientId,
      name: konto.patient.name,
      benutzername: konto.benutzername,
    });

    return NextResponse.json({
      success: true,
      user: { name: konto.patient.name, rolle: "Patient", type: "patient" },
    });
  }

  // 3. Kein Treffer
  return NextResponse.json({ error: "Benutzername oder Passwort falsch" }, { status: 401 });
}
