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
} as const;

export type Brand = typeof brand;
export type WeightUnit = 'lb' | 'kg';
export type DistanceUnit = 'mi' | 'km';
