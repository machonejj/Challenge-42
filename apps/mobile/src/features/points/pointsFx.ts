/**
 * A tiny event channel for the "you earned points!" celebration. UI handlers call celebratePoints()
 * right after a successful log; the global <PointsBurst/> overlay plays an animation for it.
 */
import { create } from 'zustand';

export interface PointsFxEvent {
  id: number;
  points: number;
  label?: string;
}

interface PointsFxState {
  event: PointsFxEvent | null;
  celebrate: (points: number, label?: string) => void;
}

export const usePointsFxStore = create<PointsFxState>((set) => ({
  event: null,
  celebrate: (points, label) =>
    set((s) => ({ event: { id: (s.event?.id ?? 0) + 1, points, label } })),
}));

/** Fire a points celebration from anywhere (no hook needed). No-op for non-positive amounts. */
export function celebratePoints(points: number, label?: string): void {
  if (points > 0) usePointsFxStore.getState().celebrate(points, label);
}
