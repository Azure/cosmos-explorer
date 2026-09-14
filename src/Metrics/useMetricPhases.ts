import React from "react";
import { useDatabases } from "../Explorer/useDatabases";
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
 *
 * DatabaseTreeRendered is completed only for a render that carries the ready revision
 * published by the current load (Explorer.refreshAndExpandNewDatabases). An earlier render —
 * databases fetched but collections still loading — carries a stale revision and is ignored,
 * so it cannot be mistaken for the loaded tree. Each revision is acknowledged at most once,
 * which also discards stale callbacks from a superseded load.
 *
 * An account with no databases still publishes a revision and renders an empty tree, so it
 * completes normally rather than stalling.
 */
export function useDatabaseLoadScenario(databaseTreeNodes: unknown[], fetchSucceeded: boolean) {
  const treeReadyRevision = useDatabases((state) => state.treeReadyRevision);
  const acknowledgedRevision = React.useRef(0);

  // Track DatabaseTreeRendered phase. Runs after commit, so the tree carrying this revision
  // is on screen by the time the phase is completed.
  React.useEffect(() => {
    if (!fetchSucceeded || treeReadyRevision === 0) {
      return;
    }
    if (acknowledgedRevision.current >= treeReadyRevision) {
      return;
    }
    acknowledgedRevision.current = treeReadyRevision;
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabaseTreeRendered);
  }, [databaseTreeNodes, fetchSucceeded, treeReadyRevision]);

  // Track Interactive phase
  useInteractive(MetricScenario.DatabaseLoad);
}
