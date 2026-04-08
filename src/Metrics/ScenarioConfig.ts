import type { PhaseTimings, WebVitals } from "Metrics/Constants";
import MetricScenario from "./MetricEvents";

// Common phases shared across all scenarios
export enum CommonMetricPhase {
  Interactive = "Interactive",
}

// Application-specific phases
export enum ApplicationMetricPhase {
  ExplorerInitialized = "ExplorerInitialized",
  PlatformConfigured = "PlatformConfigured",
  CopilotConfigured = "CopilotConfigured",
  SampleDataLoaded = "SampleDataLoaded",
  DatabasesFetched = "DatabasesFetched",
  CollectionsLoaded = "CollectionsLoaded",
  DatabaseTreeRendered = "DatabaseTreeRendered",
}

// Combined type for all metric phases
export type MetricPhase = CommonMetricPhase | ApplicationMetricPhase;

export interface ScenarioConfig<TPhase extends string = MetricPhase> {
  requiredPhases: TPhase[];
  deferredPhases?: TPhase[]; // Phases not auto-started at scenario start; started explicitly via startPhase()
  timeoutMs: number;
  validate?: (ctx: ScenarioContextSnapshot<TPhase>) => boolean; // Optional custom validation
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
