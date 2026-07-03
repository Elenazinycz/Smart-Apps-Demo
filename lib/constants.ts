// lib/constants.ts
// Geschaeftliche Konstanten und Type Guards – F-KERN-1

// ── TerminSlot-Status ──
export const SLOT_STATUS = {
  FREI: "frei",
  GEBAUT: "gebucht",
  ABGESAGT: "abgesagt",
  GESPERRT: "gesperrt",
  NO_SHOW: "noShow",
  UMBUCHUNG_ERFORDERLICH: "umbuchungErforderlich",
} as const;

export type SlotStatus = (typeof SLOT_STATUS)[keyof typeof SLOT_STATUS];

export const SLOT_STATUS_LIST: SlotStatus[] = Object.values(SLOT_STATUS);

export function isSlotStatus(value: string): value is SlotStatus {
  return SLOT_STATUS_LIST.includes(value as SlotStatus);
}

// ── Slot-Art ──
export const SLOT_ART = {
  PLANBAR: "planbar",
  AKUT: "akut",
} as const;

export type SlotArt = (typeof SLOT_ART)[keyof typeof SLOT_ART];

// ── Buchungsquelle ──
export const BUCHUNGSQUELLE = {
  ONLINE: "online",
  TELEFONISCH: "telefonisch",
  INTERN: "intern",
} as const;

export type Buchungsquelle = (typeof BUCHUNGSQUELLE)[keyof typeof BUCHUNGSQUELLE];

// ── Patienten-/Konto-Status ──
export const PATIENT_STATUS = {
  AKTIV: "aktiv",
  GESPERRT: "gesperrt",
} as const;

export type PatientStatus = (typeof PATIENT_STATUS)[keyof typeof PATIENT_STATUS];

export const KONTO_STATUS = {
  AKTIV: "aktiv",
  GESPERRT: "gesperrt",
} as const;

export type KontoStatus = (typeof KONTO_STATUS)[keyof typeof KONTO_STATUS];

// ── Rollen ──
export const ROLLE = {
  MFA: "MFA",
  ARZT: "Arzt",
  ADMIN: "Admin",
} as const;

export type Rolle = (typeof ROLLE)[keyof typeof ROLLE];

// ── Versicherungsart ──
export const VERSICHERUNGSART = {
  GKV: "GKV",
  PKV: "PKV",
  SELBSTZAHLER: "Selbstzahler",
} as const;

export type Versicherungsart = (typeof VERSICHERUNGSART)[keyof typeof VERSICHERUNGSART];

// ── Prioritaet ──
export const PRIORITAET = {
  NIEDRIG: "niedrig",
  NORMAL: "normal",
  HOCH: "hoch",
} as const;

export type Prioritaet = (typeof PRIORITAET)[keyof typeof PRIORITAET];

// ── Sperrzeit-Grund ──
export const SPERRGRUND = {
  URLAUB: "Urlaub",
  KRANKHEIT: "Krankheit",
  FORTBILDUNG: "Fortbildung",
  FEIERTAG: "Feiertag",
  BRUECKENTAG: "Brueckentag",
  MITTAGSPAUSE: "Mittagspause",
} as const;

export type SperrGrund = (typeof SPERRGRUND)[keyof typeof SPERRGRUND];

// ── Betrifft (Sperrzeit) ──
export const SPERR_BETRIFFT = {
  ARZT: "Arzt",
  PRAXIS: "Praxis",
} as const;

export type SperrBetrifft = (typeof SPERR_BETRIFFT)[keyof typeof SPERR_BETRIFFT];

// ── Termintyp-Bezeichnungen ──
export const TERMINTYP_BEZEICHNUNG = {
  VORSORGE: "Vorsorge",
  BERATUNG: "Beratung",
  IMPFUNG_REISEMEDIZIN: "Impfung / Reisemedizin",
  WIEDERHOLUNGSREZEPT_ABHOLUNG: "Wiederholungsrezept-Abholung",
  BLUTABNAHME: "Blutabnahme",
  ERSTGESPRÄCH: "Erstgespraech",
  AKUT: "Akut",
} as const;

// ── Geschaeftliche Regeln (aus spec.md) ──
export const REGEL = {
  STORNIERUNGSFRIST_STD: 24,
  UMBUCHUNGSFRIST_STD: 24,
  ERINNERUNGSFRIST_STD: 24,
  NO_SHOW_LIMIT_ERINNERUNG: 2,
  NO_SHOW_LIMIT_SPERRE: 3,
  AKUTSLOT_VORMITTAG: 4,
  AKUTSLOT_NACHMITTAG: 4,
} as const;
