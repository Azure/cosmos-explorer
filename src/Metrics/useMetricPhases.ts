import React from "react";
import MetricScenario from "./MetricEvents";
import { useMetricScenario } from "./MetricScenarioProvider";
import { CommonMetricPhase } from "./ScenarioConfig";

/**
 * Hook to automatically complete the Interactive phase when the component becomes interactive.
 * Uses requestAnimationFrame to complete after the browser has painted.
 */
export function useInteractive(scenario: MetricScenario) {
  const { completePhase } = useMetricScenario();

  React.useEffect(() => {
    requestAnimationFrame(() => {
      completePhase(scenario, CommonMetricPhase.Interactive);
    });
  }, [scenario, completePhase]);
}
