import { validateCsrf } from '@/lib/csrf';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!(await validateCsrf(req))) return NextResponse.json({ error: 'Ungueltiger CSRF-Token.' }, { status: 403 });
  const rl = checkRateLimit(rateLimitKey(req, "login"), { windowSeconds: 60, maxRequests: 10 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zu viele Login-Versuche. Bitte warten Sie einen Moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { benutzername?: string; passwort?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungueltiger JSON-Body." }, { status: 400 });
  }

  const { benutzername, passwort } = body;

  if (!benutzername || !passwort) {
    return NextResponse.json({ error: "Benutzername und Passwort erforderlich" }, { status: 400 });
  }

  if (benutzername.length > 100 || passwort.length > 200) {
    return NextResponse.json({ error: "Ungueltige Eingabe." }, { status: 400 });
  }

  const praxisUser = await prisma.praxisNutzer.findFirst({
    where: { emailDienstlich: benutzername, aktiv: true },
  });

  if (praxisUser) {
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

  const konto = await prisma.patientenKonto.findFirst({
    where: { benutzername, buchungsStatus: "aktiv" },
    include: { patient: true },
  });

  if (konto) {
    if (passwort.length === 0) {
      return NextResponse.json({ error: "Passwort erforderlich" }, { status: 401 });
    }

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

  return NextResponse.json({ error: "Benutzername oder Passwort falsch" }, { status: 401 });
}

