import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { SessionPayload } from "@/lib/auth";

export async function requireAuth(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }
  return session;
}

export async function requirePatient(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  if (session.type !== "patient") {
    return NextResponse.json({ error: "Nur für Patient:innen." }, { status: 403 });
  }
  return session;
}

export async function requirePraxis(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  if (session.type !== "praxis") {
    return NextResponse.json({ error: "Nur für Praxis-Nutzer:innen." }, { status: 403 });
  }
  return session;
}

export async function requireAdmin(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  if (session.type !== "praxis" || session.rolle !== "Admin") {
    return NextResponse.json({ error: "Nur Admin." }, { status: 403 });
  }
  return session;
}

export async function requireMfaOrAdmin(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  if (session.type !== "praxis" || (session.rolle !== "MFA" && session.rolle !== "Admin")) {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403 });
  }
  return session;
}