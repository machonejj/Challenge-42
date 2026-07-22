/** Pure unit conversion + formatting. Canonical storage units are kg (mass) and meters (distance). */
import type { WeightUnit } from '@challenge42/types';

export const KG_PER_LB = 0.45359237;
export const METERS_PER_MILE = 1609.344;

export function round(value: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

/** Convert a canonical kg value into the user's display unit. */
export function kgToDisplay(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kgToLb(kg);
}

/** Convert a user-entered weight (in their unit) to canonical kg. */
export function displayToKg(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : lbToKg(value);
}

export function metersToMiles(m: number): number {
  return m / METERS_PER_MILE;
}

export function metersToKm(m: number): number {
  return m / 1000;
}

/** Format seconds as `m:ss` (e.g. 512 → "8:32"), used for pace and elapsed labels. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Format elapsed seconds as `H:MM:SS` when >= 1h, else `M:SS`. */
export function formatElapsed(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  if (hours === 0) return formatDuration(s);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
