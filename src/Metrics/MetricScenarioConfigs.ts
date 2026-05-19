import MetricScenario from "./MetricEvents";
import { ApplicationMetricPhase, CommonMetricPhase, ScenarioConfig } from "./ScenarioConfig";

export const scenarioConfigs: Record<MetricScenario, ScenarioConfig> = {
  [MetricScenario.ApplicationLoad]: {
    requiredPhases: [
      ApplicationMetricPhase.PlatformConfigured,
      ApplicationMetricPhase.ExplorerInitialized,
      CommonMetricPhase.Interactive,
    ],
    deferredPhases: [ApplicationMetricPhase.ExplorerInitialized],
    timeoutMs: 10000,
  },
  [MetricScenario.DatabaseLoad]: {
    requiredPhases: [
      ApplicationMetricPhase.DatabasesFetched,
      ApplicationMetricPhase.CollectionsLoaded,
      ApplicationMetricPhase.DatabaseTreeRendered,
      CommonMetricPhase.Interactive,
    ],
    deferredPhases: [ApplicationMetricPhase.CollectionsLoaded, ApplicationMetricPhase.DatabaseTreeRendered],
    timeoutMs: 10000,
  },
};
