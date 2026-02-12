import React from "react";
import MetricScenario from "./MetricEvents";
import { useMetricScenario } from "./MetricScenarioProvider";
import { ApplicationMetricPhase, CommonMetricPhase } from "./ScenarioConfig";

/**
 * Hook to automatically complete the Interactive phase when the component becomes interactive.
 * Uses requestAnimationFrame to complete after the browser has painted.
 */
export function useInteractive(scenario: MetricScenario, enabled = true) {
  const { completePhase } = useMetricScenario();

  React.useEffect(() => {
    if (!enabled) {
      return;
    }
    const id = requestAnimationFrame(() => {
      completePhase(scenario, CommonMetricPhase.Interactive);
    });
    return () => cancelAnimationFrame(id);
  }, [scenario, completePhase, enabled]);
}

/**
 * Hook to manage DatabaseLoad scenario phase completions.
 * Tracks tree rendering and completes Interactive phase.
 * Only completes DatabaseTreeRendered if the database fetch was successful.
 * Note: Scenario must be started before databases are fetched (in refreshExplorer).
 */
export function useDatabaseLoadScenario(databaseTreeNodes: unknown[], fetchSucceeded: boolean) {
  const { completePhase } = useMetricScenario();
  const hasCompletedTreeRenderRef = React.useRef(false);

  // Track DatabaseTreeRendered phase (only if fetch succeeded)
  React.useEffect(() => {
    if (!hasCompletedTreeRenderRef.current && fetchSucceeded) {
      hasCompletedTreeRenderRef.current = true;
      completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabaseTreeRendered);
    }
  }, [databaseTreeNodes, fetchSucceeded, completePhase]);

  // Track Interactive phase
  useInteractive(MetricScenario.DatabaseLoad);
}
