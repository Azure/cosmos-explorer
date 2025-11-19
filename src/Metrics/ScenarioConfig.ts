import MetricScenario from "./MetricEvents";

// Common phases shared across all scenarios
export enum CommonMetricPhase {
  Interactive = "Interactive",
}

// Application-specific phases
export enum ApplicationMetricPhase {
  ExplorerInitialized = "ExplorerInitialized",
}

// Combined type for all metric phases
export type MetricPhase = CommonMetricPhase | ApplicationMetricPhase;

export interface WebVitals {
  lcp?: number; // Largest Contentful Paint
  inp?: number; // Interaction to Next Paint
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

export interface ScenarioConfig<TPhase extends string = MetricPhase> {
  requiredPhases: TPhase[];
  timeoutMs: number;
  validate?: (ctx: ScenarioContextSnapshot<TPhase>) => boolean; // Optional custom validation
}

export interface PhaseTimings {
  endTimeISO: string; // When the phase completed
  durationMs: number; // Duration from scenario start to phase completion
}

export interface ScenarioContextSnapshot<TPhase extends string = MetricPhase> {
  scenario: MetricScenario;
  startTimeISO: string; // Human-readable ISO timestamp
  endTimeISO: string; // Human-readable end timestamp
  durationMs: number; // Total scenario duration from start to end
  completed: TPhase[]; // Array for JSON serialization
  failedPhases?: TPhase[]; // Phases that failed
  timedOut: boolean;
  vitals?: WebVitals;
  phaseTimings?: Record<string, PhaseTimings>; // Start/end times for each phase
}
