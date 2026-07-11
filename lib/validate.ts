export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export interface FieldRule {
  name: string;
  type: "string" | "number" | "boolean" | "string?" | "number?" | "boolean?";
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: readonly string[];
  pattern?: string;
  message?: string;
}

const UUID_RE = /^[a-fA-F0-9-]{36}$/;

export function validate(body: Record<string, unknown>, rules: FieldRule[]): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};

  for (const rule of rules) {
    const value = body[rule.name];

    const isOptional = rule.type.endsWith("?");
    const baseType = rule.type.replace("?", "") as "string" | "number" | "boolean";

    if (value === undefined || value === null) {
      if (isOptional) continue;
      throw new ValidationError(rule.message ?? rule.name + " ist erforderlich.");
    }

    if (baseType === "string") {
      if (typeof value !== "string" || value.length === 0) {
        throw new ValidationError(rule.message ?? rule.name + " muss ein nicht-leerer Text sein.");
      }
      const str = value as string;

      if (rule.minLength !== undefined && str.length < rule.minLength) {
        throw new ValidationError(rule.message ?? rule.name + " muss mindestens " + rule.minLength + " Zeichen haben.");
      }
      if (rule.maxLength !== undefined && str.length > rule.maxLength) {
        throw new ValidationError(rule.message ?? rule.name + " darf maximal " + rule.maxLength + " Zeichen haben.");
      }
      if (rule.enum && !rule.enum.includes(str)) {
        throw new ValidationError(rule.message ?? rule.name + " hat einen ungueltigen Wert.");
      }
      if (rule.pattern) {
        const re = new RegExp("^" + rule.pattern + "$");
        if (!re.test(str)) {
          throw new ValidationError(rule.message ?? rule.name + " hat ein ungueltiges Format.");
        }
      }

      cleaned[rule.name] = str;
    } else if (baseType === "number") {
      if (typeof value !== "number" || isNaN(value)) {
        throw new ValidationError(rule.message ?? rule.name + " muss eine Zahl sein.");
      }
      if (rule.min !== undefined && (value as number) < rule.min) {
        throw new ValidationError(rule.message ?? rule.name + " muss mindestens " + rule.min + " sein.");
      }
      if (rule.max !== undefined && (value as number) > rule.max) {
        throw new ValidationError(rule.message ?? rule.name + " darf maximal " + rule.max + " sein.");
      }
      if (rule.enum && !rule.enum.includes(String(value))) {
        throw new ValidationError(rule.message ?? rule.name + " hat einen ungueltigen Wert.");
      }
      cleaned[rule.name] = value;
    } else if (baseType === "boolean") {
      if (typeof value !== "boolean") {
        throw new ValidationError(rule.message ?? rule.name + " muss wahr oder falsch sein.");
      }
      cleaned[rule.name] = value;
    }
  }

  return cleaned;
}

export function isUUID(value: string): boolean {
  return UUID_RE.test(value);
}

export function isValidDatum(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value + "T00:00:00"));
}

export function isValidZeit(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}