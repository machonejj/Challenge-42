/**
 * The points system. Points are *derived* from what you've logged (food, weigh-ins, activities,
 * steps) — so they stay in sync automatically, including when you delete something, with no separate
 * ledger to drift. Everything that's tracked earns points; new sources (board posts, likes) can be
 * added here as those features land.
 */
import { useMemo } from 'react';
import { useFoodLogStore } from '@/features/tracking/foodLogStore';
import { useWeightStore } from '@/features/tracking/weightStore';
import { useActivityStore } from '@/features/activity/activityStore';
import { useStepsStore, totalSteps } from '@/features/tracking/stepsStore';

export const POINTS = {
  food: 5, // per food logged
  weighIn: 10, // per weigh-in
  activity: 15, // per activity logged
  per1000Steps: 5, // per 1,000 steps
} as const;

const PER_LEVEL = 200;

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface PointsPart {
  label: string;
  icon: string;
  points: number;
}

export interface PointsSummary {
  total: number;
  today: number;
  level: number;
  levelProgress: number; // 0–1 toward the next level
  toNextLevel: number;
  parts: PointsPart[];
}

export function usePoints(): PointsSummary {
  const food = useFoodLogStore((s) => s.entries);
  const weight = useWeightStore((s) => s.entries);
  const activities = useActivityStore((s) => s.sessions);
  const steps = useStepsStore((s) => s.entries);

  return useMemo(() => {
    const dayStart = startOfToday();
    const stepTotal = totalSteps(steps);
    const stepToday = steps.filter((e) => e.atMs >= dayStart).reduce((sum, e) => sum + e.steps, 0);

    const parts: PointsPart[] = [
      { label: 'Food', icon: 'restaurant-outline', points: food.length * POINTS.food },
      { label: 'Weigh-ins', icon: 'scale-outline', points: weight.length * POINTS.weighIn },
      { label: 'Activity', icon: 'barbell-outline', points: activities.length * POINTS.activity },
      {
        label: 'Steps',
        icon: 'footsteps-outline',
        points: Math.floor(stepTotal / 1000) * POINTS.per1000Steps,
      },
    ];
    const total = parts.reduce((sum, p) => sum + p.points, 0);

    const today =
      food.filter((e) => e.atMs >= dayStart).length * POINTS.food +
      weight.filter((e) => e.measuredAtMs >= dayStart).length * POINTS.weighIn +
      activities.filter((a) => a.completedAtMs >= dayStart).length * POINTS.activity +
      Math.floor(stepToday / 1000) * POINTS.per1000Steps;

    const level = Math.floor(total / PER_LEVEL) + 1;
    const into = total % PER_LEVEL;
    return {
      total,
      today,
      level,
      levelProgress: into / PER_LEVEL,
      toNextLevel: PER_LEVEL - into,
      parts,
    };
  }, [food, weight, activities, steps]);
}
