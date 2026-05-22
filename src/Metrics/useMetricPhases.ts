import React from "react";
import MetricScenario from "./MetricEvents";
import { ApplicationMetricPhase, CommonMetricPhase } from "./ScenarioConfig";
import { scenarioMonitor } from "./ScenarioMonitor";

/**
 * Completes the Interactive phase once the browser is ready to paint.
 *
 * Uses requestAnimationFrame with a setTimeout fallback. In foreground tabs rAF fires
 * first (~16 ms) giving an accurate "browser painted" signal. In background tabs browsers
 * suspend rAF indefinitely, so the setTimeout fallback (1 s) completes the phase instead —
 * well within the 10 s scenario timeout — preventing false-negative unhealthy reports.
 */
export function useInteractive(scenario: MetricScenario, enabled = true) {
  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let completed = false;
    const complete = () => {
      if (completed) {
        return;
      }
      completed = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      scenarioMonitor.completePhase(scenario, CommonMetricPhase.Interactive);
    };

    const rafId = requestAnimationFrame(complete);
    // Fallback for background tabs where rAF is suspended.
    const timeoutId = setTimeout(complete, 1000);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
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
