import React from "react";
import MetricScenario from "./MetricEvents";
import { scenarioMonitor } from "./ScenarioMonitor";
import { ApplicationMetricPhase, CommonMetricPhase } from "./ScenarioConfig";

/**
 * Hook to automatically complete the Interactive phase when the component becomes interactive.
 * Uses requestAnimationFrame to complete after the browser has painted.
 *
 * Calls scenarioMonitor directly (not via React context) so that the effect dependencies
 * are only [scenario, enabled] — both stable primitives. This prevents re-renders from
 * cancelling the pending rAF due to an unstable context function reference.
 */
export function useInteractive(scenario: MetricScenario, enabled = true) {
  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const id = requestAnimationFrame(() => {
      scenarioMonitor.completePhase(scenario, CommonMetricPhase.Interactive);
    });
    return () => cancelAnimationFrame(id);
  }, [scenario, enabled]);
}

/**
 * Hook to manage DatabaseLoad scenario phase completions.
 * Tracks tree rendering and completes Interactive phase.
 * Only completes DatabaseTreeRendered if the database fetch was successful.
 * Note: Scenario must be started before databases are fetched (in refreshExplorer).
 *
 * Calls scenarioMonitor directly (not via React context) for the same stability reason
 * as useInteractive — avoids effect re-runs from unstable context function references.
 */
export function useDatabaseLoadScenario(databaseTreeNodes: unknown[], fetchSucceeded: boolean) {
  const hasCompletedTreeRenderRef = React.useRef(false);

  // Track DatabaseTreeRendered phase (only if fetch succeeded)
  React.useEffect(() => {
    if (!hasCompletedTreeRenderRef.current && fetchSucceeded) {
      hasCompletedTreeRenderRef.current = true;
      scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabaseTreeRendered);
    }
  }, [databaseTreeNodes, fetchSucceeded]);

  // Track Interactive phase
  useInteractive(MetricScenario.DatabaseLoad);
}
