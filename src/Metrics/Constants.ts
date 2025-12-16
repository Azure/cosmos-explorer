import { ApiType } from "Common/Constants";
import { Platform } from "ConfigContext";

// Metric scenarios represent lifecycle checkpoints we measure.
export enum MetricScenario {
  ApplicationLoad = "ApplicationLoad",
  DatabaseLoad = "DatabaseLoad",
}

// Generic metric emission event describing scenario outcome.
export interface MetricEvent {
  readonly platform: Platform;
  readonly api: ApiType;
  readonly scenario: MetricScenario;
  readonly healthy: boolean;
}
