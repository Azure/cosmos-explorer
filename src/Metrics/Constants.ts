import { ApiType } from "Common/Constants";
import { Platform } from "ConfigContext";

export enum HealthMetricScenario {
  ApplicationLoad = "ApplicationLoad",
}

export interface HealthMetricEvent {
  readonly platform: Platform;
  readonly api: ApiType;
  readonly scenario: HealthMetricScenario;
  readonly healthy: boolean;
}
