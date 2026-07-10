import { ROLLE, Rolle } from './constants';
import { SessionPayload } from './auth';

export function hatRolle(session: SessionPayload | null, erlaubteRollen: Rolle[]): boolean {
  if (!session || session.type !== 'praxis') return false;
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