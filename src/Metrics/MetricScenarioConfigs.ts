import MetricScenario from "./MetricEvents";
import { ApplicationMetricPhase, CommonMetricPhase, ScenarioConfig } from "./ScenarioConfig";

export const scenarioConfigs: Record<MetricScenario, ScenarioConfig> = {
  [MetricScenario.ApplicationLoad]: {
    requiredPhases: [ApplicationMetricPhase.ExplorerInitialized, CommonMetricPhase.Interactive],
    timeoutMs: 10000,
  },
  [MetricScenario.DatabaseLoad]: {
    requiredPhases: [
      ApplicationMetricPhase.DatabasesFetched,
      ApplicationMetricPhase.DatabaseTreeRendered,
      CommonMetricPhase.Interactive,
    ],
    timeoutMs: 10000,
  },
};
