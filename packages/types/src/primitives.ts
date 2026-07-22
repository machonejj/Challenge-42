/** Primitive aliases used across the domain. Kept as readable aliases (not branded) for ergonomics. */

/** A UUID (v4) primary/foreign key. */
export type UUID = string;

/** An ISO-8601 timestamp with timezone, e.g. `2026-01-15T14:12:00Z`. */
export type ISOTimestamp = string;

/** An ISO-8601 calendar date, e.g. `2026-01-15` (no time component). */
export type ISODate = string;

/** Fields present on every persisted row. */
export interface Timestamps {
  readonly created_at: ISOTimestamp;
  readonly updated_at: ISOTimestamp;
}

/** A signed change value with a direction, for UI deltas (e.g. weight ↓ 8.6). */
export interface Delta {
  readonly value: number;
  readonly direction: 'up' | 'down' | 'none';
}
