import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ------------------------------------------------------------------
   Money.
   The desktop app stores every amount as integer paisa (1 Rs = 100 paisa).
------------------------------------------------------------------- */
export function formatPaisa(paisa: number, options: { decimals?: boolean } = {}): string {
  const rupees = Number(paisa) / 100;
  const decimals = options.decimals ? 2 : 0;
  return `Rs ${rupees.toLocaleString("en-PK", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/* ------------------------------------------------------------------
   Quantities.
   Quantities are stored as integer milli-units (1 unit = 1000 milli).
   Note: this is separate from units.conversion_factor_1e4.
------------------------------------------------------------------- */
const UNIT_LABELS: Record<string, string> = {
  kg: "kg",
  g: "g",
  ltr: "L",
  ml: "ml",
  dozen: "dozen",
  pack: "pack",
  box: "box",
  bag: "bag",
  each: "pc",
};

const FRACTIONAL_UNITS = new Set(["kg", "g", "ltr", "ml"]);

export function unitLabel(unitCode: string): string {
  return UNIT_LABELS[unitCode] ?? unitCode;
}

export function isFractionalUnit(unitCode: string): boolean {
  return FRACTIONAL_UNITS.has(unitCode);
}

/** Weight and volume sell in 0.5 steps; packs and dozens sell in whole units. */
export function quantityStep(unitCode: string): number {
  return isFractionalUnit(unitCode) ? 0.5 : 1;
}

export function toDecimalQuantity(milli: number): number {
  return Number(milli) / 1000;
}

export function formatQuantity(milli: number, unitCode?: string): string {
  const value = toDecimalQuantity(milli).toLocaleString("en-PK", {
    maximumFractionDigits: 3,
  });
  return unitCode ? `${value} ${unitLabel(unitCode)}` : value;
}

/** Formats a decimal quantity the way a customer types it (0.5, 1, 12). */
export function formatDecimal(value: number): string {
  return value.toLocaleString("en-PK", { maximumFractionDigits: 3 });
}
