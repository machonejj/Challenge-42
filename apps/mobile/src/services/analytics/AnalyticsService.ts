/**
 * Product analytics — provider-agnostic. PRIVACY: payloads carry only coarse, non-sensitive product
 * signals (see @challenge42/types AnalyticsEventPayloads). Never weight/calories/motivation/safety.
 */
import { ANALYTICS } from '@challenge42/config';
import type { AnalyticsEventName, AnalyticsEventPayloads } from '@challenge42/types';

export interface AnalyticsService {
  readonly id: string;
  track<K extends AnalyticsEventName>(name: K, payload: AnalyticsEventPayloads[K]): void;
}

class DevAnalyticsService implements AnalyticsService {
  readonly id = 'dev';
  track<K extends AnalyticsEventName>(name: K, payload: AnalyticsEventPayloads[K]): void {
    // Local-only structured log. A remote provider adapter plugs in here later.
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${name}`, payload);
  }
}

class NoopAnalyticsService implements AnalyticsService {
  readonly id = 'none';
  track(): void {}
}

let instance: AnalyticsService | null = null;

export function getAnalytics(): AnalyticsService {
  if (instance) return instance;
  instance = ANALYTICS.provider === 'none' ? new NoopAnalyticsService() : new DevAnalyticsService();
  return instance;
}
