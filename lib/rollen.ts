import { ROLLE, Rolle } from "./constants";
import { SessionPayload } from "./auth";

export function hatRolle(
  session: SessionPayload | null,
  erlaubteRollen: Rolle[]
): boolean {
  if (!session || session.type !== "praxis") return false;
  return erlaubteRollen.includes(session.rolle as Rolle);
}

export function istAdmin(session: SessionPayload | null): boolean {
  return hatRolle(session, [ROLLE.ADMIN]);
}

export function istMfa(session: SessionPayload | null): boolean {
  return hatRolle(session, [ROLLE.MFA]);
}

export function istArzt(session: SessionPayload | null): boolean {
  return hatRolle(session, [ROLLE.ARZT]);
}

export function istMfaOderAdmin(session: SessionPayload | null): boolean {
  return hatRolle(session, [ROLLE.MFA, ROLLE.ADMIN]);
}

/** Gibt die benutzerfreundliche Anzeigebezeichnung einer Rolle zurueck. */
export function rolleAnzeige(rolle: string): string {
  const map: Record<string, string> = {
    [ROLLE.ADMIN]: "Arzt/Admin",
  };
  return map[rolle] ?? rolle;
}
