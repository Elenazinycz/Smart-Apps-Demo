// lib/notifications.ts
// DSGVO-konforme Benachrichtigungen – F-SICH-2 (STD-043, STD-044, STD-045, STD-046)

import { prisma } from '@/lib/prisma';

export type BenachrichtigungsTyp =
  | 'buchungsbestaetigung'
  | 'stornierungsbestaetigung'
  | 'umbuchungsbestaetigung'
  | 'terminerinnerung';

export interface Benachrichtigung {
  typ: BenachrichtigungsTyp;
  patientId: string;
  empfaenger: string;   // E-Mail oder Telefonnummer
  kanal: 'email' | 'sms';
  betreff: string;
  inhalt: string;
  versendetAm?: Date;
}

/**
 * Prüft, ob der Patient die nötige Einwilligung für den Kanal hat.
 */
export async function hatEinwilligung(patientId: string, kanal: 'email' | 'sms'): Promise<boolean> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { einwilligungEmail: true, einwilligungSms: true, email: true, telefonnummer: true },
  });
  if (!patient) return false;

  if (kanal === 'email') return !!patient.einwilligungEmail && !!patient.email;
  if (kanal === 'sms') return !!patient.einwilligungSms && !!patient.telefonnummer;
  return false;
}

/**
 * Validiert vor Versand: Opt-in + Kontaktdaten vorhanden.
 * Gibt im Fehlerfall eine lesbare Nachricht zurück.
 */
export async function darfBenachrichtigen(
  patientId: string,
  kanal: 'email' | 'sms'
): Promise<{ ok: true } | { ok: false; grund: string }> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { einwilligungEmail: true, einwilligungSms: true, email: true, telefonnummer: true },
  });
  if (!patient) return { ok: false, grund: 'Patient nicht gefunden.' };

  if (kanal === 'email') {
    if (!patient.einwilligungEmail) return { ok: false, grund: 'Keine Einwilligung für E-Mail erteilt.' };
    if (!patient.email) return { ok: false, grund: 'Keine E-Mail-Adresse hinterlegt.' };
  }
  if (kanal === 'sms') {
    if (!patient.einwilligungSms) return { ok: false, grund: 'Keine Einwilligung für SMS erteilt.' };
    if (!patient.telefonnummer) return { ok: false, grund: 'Keine Telefonnummer hinterlegt.' };
  }

  return { ok: true };
}

/**
 * Mock-Versand einer Benachrichtigung.
 * In Produktion würde hier ein E-Mail/SMS-Gateway angebunden.
 * Die Funktion loggt die Benachrichtigung und gibt sie für Tests zurück.
 */
export async function sendeBenachrichtigung(
  patientId: string,
  typ: BenachrichtigungsTyp,
  kanal: 'email' | 'sms',
  betreff: string,
  inhalt: string
): Promise<{ success: boolean; nachricht?: Benachrichtigung; error?: string }> {
  const erlaubnis = await darfBenachrichtigen(patientId, kanal);
  if (!erlaubnis.ok) return { success: false, error: erlaubnis.grund };

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { email: true, telefonnummer: true },
  });
  if (!patient) return { success: false, error: 'Patient nicht gefunden.' };

  const empfaenger = kanal === 'email' ? patient.email! : patient.telefonnummer!;

  // Mock: Nur Loggen
  console.log([NOTIFICATION]  an );
  console.log([NOTIFICATION] Betreff: );
  console.log([NOTIFICATION] Inhalt: );

  const nachricht: Benachrichtigung = {
    typ,
    patientId,
    empfaenger,
    kanal,
    betreff,
    inhalt,
    versendetAm: new Date(),
  };

  return { success: true, nachricht };
}

/**
 * Bestätigung bei erfolgreicher Buchung versenden (nur mit Opt-in).
 * Versucht E-Mail, falls keine Einwilligung: SMS.
 */
export async function sendeBuchungsbestaetigung(
  patientId: string,
  terminDaten: { datum: string; startzeit: string; arztName: string; terminTypName: string }
): Promise<void> {
  const betreff = 'Terminbestätigung – Praxis Demir & Kollegen';
  const inhalt = Ihr Termin "" am  um  bei  wurde erfolgreich gebucht.;

  const emailOk = await hatEinwilligung(patientId, 'email');
  if (emailOk) {
    await sendeBenachrichtigung(patientId, 'buchungsbestaetigung', 'email', betreff, inhalt);
    return;
  }
  const smsOk = await hatEinwilligung(patientId, 'sms');
  if (smsOk) {
    await sendeBenachrichtigung(patientId, 'buchungsbestaetigung', 'sms', betreff, inhalt);
  }
}

/**
 * Bestätigung bei Stornierung versenden (nur mit Opt-in).
 */
export async function sendeStornierungsbestaetigung(
  patientId: string,
  terminDaten: { datum: string; startzeit: string; arztName: string; terminTypName: string }
): Promise<void> {
  const betreff = 'Stornierungsbestätigung – Praxis Demir & Kollegen';
  const inhalt = Ihr Termin "" am  um  bei  wurde storniert.;

  const emailOk = await hatEinwilligung(patientId, 'email');
  if (emailOk) {
    await sendeBenachrichtigung(patientId, 'stornierungsbestaetigung', 'email', betreff, inhalt);
    return;
  }
  const smsOk = await hatEinwilligung(patientId, 'sms');
  if (smsOk) {
    await sendeBenachrichtigung(patientId, 'stornierungsbestaetigung', 'sms', betreff, inhalt);
  }
}

/**
 * Bestätigung bei Umbuchung versenden (nur mit Opt-in).
 */
export async function sendeUmbuchungsbestaetigung(
  patientId: string,
  alteTerminDaten: { datum: string; startzeit: string },
  neueTerminDaten: { datum: string; startzeit: string; arztName: string; terminTypName: string }
): Promise<void> {
  const betreff = 'Umbuchungsbestätigung – Praxis Demir & Kollegen';
  const inhalt = Ihr Termin wurde von  um  auf  um  ( bei ) umgebucht.;

  const emailOk = await hatEinwilligung(patientId, 'email');
  if (emailOk) {
    await sendeBenachrichtigung(patientId, 'umbuchungsbestaetigung', 'email', betreff, inhalt);
    return;
  }
  const smsOk = await hatEinwilligung(patientId, 'sms');
  if (smsOk) {
    await sendeBenachrichtigung(patientId, 'umbuchungsbestaetigung', 'sms', betreff, inhalt);
  }
}

/**
 * 24h-Erinnerung versenden. Nur mit Opt-in.
 * Diese Funktion ist für den Aufruf durch einen Cron-Job / Edge-Function vorgesehen.
 */
export async function sendeTerminerinnerung(slotId: string): Promise<{ success: boolean; error?: string }> {
  const slot = await prisma.terminSlot.findUnique({
    where: { id: slotId },
    include: {
      patient: { select: { id: true, einwilligungEmail: true, einwilligungSms: true, email: true, telefonnummer: true } },
      arzt: { select: { name: true } },
      terminTyp: { select: { bezeichnung: true } },
    },
  });
  if (!slot || !slot.patient) return { success: false, error: 'Slot oder Patient nicht gefunden.' };

  const patientId = slot.patient.id;
  const betreff = 'Terminerinnerung – Praxis Demir & Kollegen';
  const datumStr = slot.datum.toISOString().split('T')[0];
  const zeitStr = slot.startzeit.toISOString().split('T')[1]?.substring(0, 5) ?? '';
  const inhalt = Erinnerung: Ihr Termin "" bei  ist morgen () um .;

  const emailOk = slot.patient.einwilligungEmail && !!slot.patient.email;
  if (emailOk) {
    return await sendeBenachrichtigung(patientId, 'terminerinnerung', 'email', betreff, inhalt);
  }
  const smsOk = slot.patient.einwilligungSms && !!slot.patient.telefonnummer;
  if (smsOk) {
    return await sendeBenachrichtigung(patientId, 'terminerinnerung', 'sms', betreff, inhalt);
  }

  return { success: false, error: 'Keine Einwilligung für Benachrichtigungen.' };
}
