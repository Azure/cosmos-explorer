import { ApiType } from "Common/Constants";
import { Platform } from "ConfigContext";

// Metric scenarios represent lifecycle checkpoints we measure.
export enum MetricScenario {
  ApplicationLoad = "ApplicationLoad",
  DatabaseLoad = "DatabaseLoad",
}

export interface WebVitals {
  lcp?: number; // Largest Contentful Paint
  inp?: number; // Interaction to Next Paint
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

export interface PhaseTimings {
  endTimeISO: string; // When the phase completed
  durationMs: number; // Duration from scenario start to phase completion
}

// Generic metric emission event describing scenario outcome.
export interface MetricEvent {
  // === Existing required fields (unchanged) ===
  readonly platform: Platform;
  readonly api: ApiType;
  readonly scenario: MetricScenario;
  readonly healthy: boolean;

  // === New optional fields ===
  readonly durationMs?: number;
  readonly timedOut?: boolean;
  readonly documentHidden?: boolean;
  readonly hasExpectedFailure?: boolean;

  readonly completedPhases?: string[];
  readonly failedPhases?: string[];
  readonly phaseTimings?: Record<string, PhaseTimings>;

  readonly startTimeISO?: string;
  readonly endTimeISO?: string;

  readonly vitals?: WebVitals;
}
