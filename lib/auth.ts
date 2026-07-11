import { SignJWT, jwtVerify } from "jose";

const JWT_ISSUER = "smart-apps-demo";
const JWT_AUDIENCE = "smart-apps-demo-user";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be at least 16 characters in production");
    }
    console.warn("[auth] WARN: JWT_SECRET nicht gesetzt, verwende Demo-Secret");
  }
  return new TextEncoder().encode(secret ?? "demo-secret-key-mock-2026");
}

export interface SessionPayload {
  type: "patient" | "praxis";
  id: string;
  name: string;
  rolle?: string;
  berechtigung?: string;
  benutzername?: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime("24h")
    .setIssuedAt()
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function isTokenExpiringSoon(payload: SessionPayload & { exp?: number }): boolean {
  if (!payload.exp) return true;
  const remaining = payload.exp * 1000 - Date.now();
  return remaining < 5 * 60 * 1000;
}