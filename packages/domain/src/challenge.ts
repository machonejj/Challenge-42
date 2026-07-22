/** Challenge calendar math — pure, timezone-agnostic on ISO dates (UTC day boundaries). */
import { HEALTH_GUARDRAILS } from '@challenge42/config';
import type { ISODate } from '@challenge42/types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parse an ISO date (`YYYY-MM-DD`) as a UTC midnight timestamp. */
function isoDateToUtcMs(date: ISODate): number {
  const [y, m, d] = date.split('-').map((n) => Number.parseInt(n, 10));
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Whole days between two ISO dates (b - a). Negative if b precedes a. */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((isoDateToUtcMs(b) - isoDateToUtcMs(a)) / MS_PER_DAY);
}

/**
 * 1-based day number within a challenge. Day 1 is the start date; clamps into [1, lengthDays].
 * `today` defaults must be supplied by the caller (domain stays free of ambient clock reads).
 */
export function challengeDayNumber(startDate: ISODate, today: ISODate, lengthDays: number): number {
  const raw = daysBetween(startDate, today) + 1;
  return Math.min(Math.max(raw, 1), lengthDays);
}

/** Days elapsed so far (1-based day number, same clamping). */
export function daysElapsed(startDate: ISODate, today: ISODate, lengthDays: number): number {
  return challengeDayNumber(startDate, today, lengthDays);
}

/** Days remaining (0 when on/after the final day). */
export function daysRemaining(startDate: ISODate, today: ISODate, lengthDays: number): number {
  return Math.max(0, lengthDays - challengeDayNumber(startDate, today, lengthDays));
}

/**
 * Whether a weigh-in is "due" today under the weekly cadence (avoids daily weigh-in pressure).
 * Due on day 1 and every `weighInCadenceDays` thereafter.
 */
export function isWeighInDue(
  challengeDay: number,
  cadenceDays: number = HEALTH_GUARDRAILS.weighInCadenceDays,
): boolean {
  if (challengeDay < 1) return false;
  return (challengeDay - 1) % cadenceDays === 0;
}
