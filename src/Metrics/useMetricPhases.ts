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
 * DatabaseTreeRendered is completed only for a render that carries the ready token published
 * by the current load (Explorer.refreshAndExpandNewDatabases). An earlier render — databases
 * fetched but collections still loading — carries the previous token and is ignored, so it
 * cannot be mistaken for the loaded tree. Each token is acknowledged at most once, which also
 * discards stale callbacks from a superseded load.
 *
 * The token is a fresh object compared by reference, so repeated refreshes cannot exhaust or
 * wrap it the way an incrementing counter could.
 *
 * An account with no databases still publishes a token and renders an empty tree, so it
 * completes normally rather than stalling.
 */
export function useDatabaseLoadScenario(databaseTreeNodes: unknown[], fetchSucceeded: boolean) {
  const treeReadyToken = useDatabases((state) => state.treeReadyToken);
  const acknowledgedToken = React.useRef<object | undefined>(undefined);

  // Track DatabaseTreeRendered phase. Runs after commit, so the tree carrying this token is on
  // screen by the time the phase is completed.
  React.useEffect(() => {
    if (!fetchSucceeded || !treeReadyToken) {
      return;
    }
    if (acknowledgedToken.current === treeReadyToken) {
      return;
    }
    acknowledgedToken.current = treeReadyToken;
    scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabaseTreeRendered);
  }, [databaseTreeNodes, fetchSucceeded, treeReadyToken]);

  // Track Interactive phase
  useInteractive(MetricScenario.DatabaseLoad);
}
