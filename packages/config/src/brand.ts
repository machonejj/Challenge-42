/**
 * Brand configuration. `CHALLENGE42` is a working name — everything user-facing reads from here so
 * the product can be rebranded by editing this one file. Never hardcode the product name in UI copy.
 */
export const brand = {
  /** Product name shown in the UI. Change this to rebrand. */
  name: 'Challenge42',
  /** Short mark for compact spots (e.g. header lockup). */
  shortName: 'C42',
  tagline: 'Six weeks. One challenge. Together.',

  /** Challenge length in days. The whole product is built around 42, but it is not hardcoded. */
  challengeLengthDays: 42,

  /** Default display units (users can override on their profile). */
  defaultUnits: {
    weight: 'lb', // 'lb' | 'kg'
    distance: 'mi', // 'mi' | 'km'
    energy: 'kcal',
  },

  support: {
    email: 'support@challenge42.example',
    website: 'https://challenge42.example',
  },

  legal: {
    /** Non-medical positioning is a hard product rule; surfaced in onboarding/footers. */
    disclaimer:
      'Challenge42 is a lifestyle and accountability program, not medical advice. ' +
      'Consult a qualified professional before starting any weight-loss or exercise plan.',
  },

  /**
   * Positioning of the INITIAL challenge experience. This is content/config — the platform itself
   * stays audience-agnostic so future challenge types drop in without a rewrite.
   */
  positioning: {
    id: 'parent_reset',
    name: 'The 42-Day Parent Reset',
    audience: 'Busy parents of young children',
    promise: 'You don’t need your old life back. You need a healthier version of your new one.',
    principles: ['Consistency', 'Adaptability', 'Comebacks', 'Real family life'],
  },
} as const;

/**
 * The seeded challenge new users enroll into during the pilot. Dates are configurable/overridable;
 * membership + snapshot are stored separately from the mutable profile.
 */
export const FOUNDING_CHALLENGE = {
  id: 'c0000000-0000-4000-a000-00000000FEED',
  slug: 'founding-parent-reset',
  name: 'Founding Parent Reset',
  lengthDays: 42,
} as const;

export type Brand = typeof brand;
export type WeightUnit = 'lb' | 'kg';
export type DistanceUnit = 'mi' | 'km';
