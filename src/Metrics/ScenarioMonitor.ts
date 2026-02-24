import { Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import { configContext } from "../ConfigContext";
import { Action } from "../Shared/Telemetry/TelemetryConstants";
import { traceFailure, traceMark, traceStart, traceSuccess } from "../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../UserContext";
import MetricScenario, { reportHealthy, reportUnhealthy } from "./MetricEvents";
import { scenarioConfigs } from "./MetricScenarioConfigs";
import { MetricPhase, PhaseTimings, ScenarioConfig, ScenarioContextSnapshot, WebVitals } from "./ScenarioConfig";

interface PhaseContext {
  startMarkName: string; // Performance mark name for phase start
  endMarkName?: string; // Performance mark name for phase end
}

interface InternalScenarioContext {
  scenario: MetricScenario;
  config: ScenarioConfig;
  startMarkName: string;
  completed: Set<MetricPhase>;
  failed: Set<MetricPhase>;
  phases: Map<MetricPhase, PhaseContext>; // Track start/end for each phase
  timeoutId?: number;
  emitted: boolean;
  hasExpectedFailure: boolean; // Flag for expected failures (auth, firewall, etc.)
}

class ScenarioMonitor {
  private contexts = new Map<MetricScenario, InternalScenarioContext>();
  private vitals: WebVitals = {};
  private vitalsInitialized = false;

  constructor() {
    this.initializeVitals();
  }

  private initializeVitals() {
    if (this.vitalsInitialized) {
      return;
    }
    this.vitalsInitialized = true;

    onLCP((metric: Metric) => {
      this.vitals.lcp = metric.value;
    });
    onINP((metric: Metric) => {
      this.vitals.inp = metric.value;
    });
    onCLS((metric: Metric) => {
      this.vitals.cls = metric.value;
    });
    onFCP((metric: Metric) => {
      this.vitals.fcp = metric.value;
    });
    onTTFB((metric: Metric) => {
      this.vitals.ttfb = metric.value;
    });
  }

  private devLog(msg: string) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log(`[Metrics] ${msg}`);
    }
  }

  start(scenario: MetricScenario) {
    if (this.contexts.has(scenario)) {
      return;
    }
    const config = scenarioConfigs[scenario];
    if (!config) {
      throw new Error(`Missing scenario config for ${scenario}`);
    }

    const startMarkName = `scenario_${scenario}_start`;
    performance.mark(startMarkName);

    const ctx: InternalScenarioContext = {
      scenario,
      config,
      startMarkName,
      completed: new Set<MetricPhase>(),
      failed: new Set<MetricPhase>(),
      phases: new Map<MetricPhase, PhaseContext>(),
      emitted: false,
      hasExpectedFailure: false,
    };

    // Start all required phases at scenario start time
    config.requiredPhases.forEach((phase) => {
      const phaseStartMarkName = `scenario_${scenario}_${phase}_start`;
      performance.mark(phaseStartMarkName);
      ctx.phases.set(phase, { startMarkName: phaseStartMarkName });
    });

    this.devLog(
      `scenario_start: ${scenario} | phases=${config.requiredPhases.join(", ")} | timeout=${config.timeoutMs}ms`,
    );

    traceMark(Action.MetricsScenario, {
      event: "scenario_start",
      scenario,
      requiredPhases: config.requiredPhases.join(","),
      timeoutMs: config.timeoutMs,
    });

    ctx.timeoutId = window.setTimeout(() => {
      const missingPhases = ctx.config.requiredPhases.filter((p) => !ctx.completed.has(p));

      this.devLog(
        `timeout: ${scenario} | missing=[${missingPhases.join(", ")}] | completed=[${Array.from(ctx.completed).join(", ")}] | documentHidden=${document.hidden} | hasExpectedFailure=${ctx.hasExpectedFailure}`,
      );

      traceMark(Action.MetricsScenario, {
        event: "scenario_timeout",
        scenario,
        missingPhases: missingPhases.join(","),
        completedPhases: Array.from(ctx.completed).join(","),
        documentHidden: document.hidden,
        hasExpectedFailure: ctx.hasExpectedFailure,
      });

      // If an expected failure occurred (auth, firewall, etc.), emit healthy instead of unhealthy
      const healthy = ctx.hasExpectedFailure;
      this.emit(ctx, healthy, true);
    }, config.timeoutMs);
    this.contexts.set(scenario, ctx);
  }

  startPhase(scenario: MetricScenario, phase: MetricPhase) {
    const ctx = this.contexts.get(scenario);
    if (!ctx || ctx.emitted || !ctx.config.requiredPhases.includes(phase) || ctx.phases.has(phase)) {
      return;
    }

    const startMarkName = `scenario_${scenario}_${phase}_start`;
    performance.mark(startMarkName);
    ctx.phases.set(phase, { startMarkName });

    traceStart(Action.MetricsScenario, {
      event: "phase_start",
      scenario,
      phase,
    });
  }

  completePhase(scenario: MetricScenario, phase: MetricPhase) {
    const ctx = this.contexts.get(scenario);
    const phaseCtx = ctx?.phases.get(phase);
    if (!ctx || ctx.emitted || !ctx.config.requiredPhases.includes(phase) || !phaseCtx) {
      return;
    }

    const endMarkName = `scenario_${scenario}_${phase}_end`;
    performance.mark(endMarkName);
    phaseCtx.endMarkName = endMarkName;
    ctx.completed.add(phase);

    const navigationStart = performance.timeOrigin;
    const startEntry = performance.getEntriesByName(phaseCtx.startMarkName)[0];
    const endEntry = performance.getEntriesByName(endMarkName)[0];
    const endTimeISO = endEntry ? new Date(navigationStart + endEntry.startTime).toISOString() : undefined;
    const durationMs = startEntry && endEntry ? endEntry.startTime - startEntry.startTime : undefined;

    this.devLog(
      `phase_complete: ${scenario}.${phase} | ${
        durationMs !== null && durationMs !== undefined ? `${Math.round(durationMs)}ms` : "?"
      } | ${ctx.completed.size}/${ctx.config.requiredPhases.length} phases`,
    );

    traceSuccess(Action.MetricsScenario, {
      event: "phase_complete",
      scenario,
      phase,
      endTimeISO,
      durationMs,
      completedCount: ctx.completed.size,
      requiredCount: ctx.config.requiredPhases.length,
    });

    this.tryEmitIfReady(ctx);
  }

  failPhase(scenario: MetricScenario, phase: MetricPhase) {
    const ctx = this.contexts.get(scenario);
    if (!ctx || ctx.emitted) {
      return;
    }

    // If an expected failure was flagged (auth, firewall, etc.), treat as success.
    if (ctx.hasExpectedFailure) {
      this.devLog(`phase_fail: ${scenario}.${phase} — expected failure, completing as healthy`);
      this.completePhase(scenario, phase);
      return;
    }

    // Mark the explicitly failed phase
    performance.mark(`scenario_${scenario}_${phase}_failed`);
    ctx.failed.add(phase);

    // Mark all remaining incomplete required phases as failed
    ctx.config.requiredPhases.forEach((requiredPhase) => {
      if (!ctx.completed.has(requiredPhase) && !ctx.failed.has(requiredPhase)) {
        ctx.failed.add(requiredPhase);
      }
    });

    // Build a snapshot with failure info
    const failureSnapshot = this.buildSnapshot(ctx, { final: false, timedOut: false });

    this.devLog(
      `phase_fail: ${scenario}.${phase} | failed=[${Array.from(ctx.failed).join(", ")}] | completed=[${Array.from(
        ctx.completed,
      ).join(", ")}]`,
    );

    traceFailure(Action.MetricsScenario, {
      event: "phase_fail",
      scenario,
      phase,
      failedPhases: Array.from(ctx.failed).join(","),
      completedPhases: Array.from(ctx.completed).join(","),
    });

    // Emit unhealthy immediately for unexpected failures
    this.emit(ctx, false, false, failureSnapshot);
  }

  /**
   * Marks that an expected failure occurred (auth, firewall, permissions, etc.).
   * When the scenario times out with this flag set, it will emit healthy instead of unhealthy.
   * This is called automatically from handleError when an expected error is detected.
   */
  markExpectedFailure() {
    // Set the flag on all active (non-emitted) scenarios
    this.contexts.forEach((ctx) => {
      if (!ctx.emitted) {
        ctx.hasExpectedFailure = true;
        traceMark(Action.MetricsScenario, {
          event: "expected_failure_marked",
          scenario: ctx.scenario,
        });
      }
    });
  }

  private tryEmitIfReady(ctx: InternalScenarioContext) {
    const allDone = ctx.config.requiredPhases.every((p) => ctx.completed.has(p));
    if (!allDone) {
      return;
    }
    const finalSnapshot = this.buildSnapshot(ctx, { final: true, timedOut: false });
    const healthy = ctx.config.validate ? ctx.config.validate(finalSnapshot) : true;
    this.emit(ctx, healthy, false, finalSnapshot);
  }

  private getPhaseTimings(ctx: InternalScenarioContext): Record<string, PhaseTimings> {
    const result: Record<string, PhaseTimings> = {};
    const navigationStart = performance.timeOrigin;

    ctx.phases.forEach((phaseCtx, phase) => {
      // Only include completed phases (those with endMarkName)
      if (phaseCtx.endMarkName) {
        const endEntry = performance.getEntriesByName(phaseCtx.endMarkName)[0];
        if (endEntry) {
          const endTimeISO = new Date(navigationStart + endEntry.startTime).toISOString();

          // Use Performance API measure to calculate duration
          const measureName = `scenario_${ctx.scenario}_${phase}_duration`;
          performance.measure(measureName, phaseCtx.startMarkName, phaseCtx.endMarkName);
          const measure = performance.getEntriesByName(measureName)[0];
          if (measure) {
            result[phase] = {
              endTimeISO,
              durationMs: measure.duration,
            };
          }
        }
      }
    });

    return result;
  }

  private emit(ctx: InternalScenarioContext, healthy: boolean, timedOut: boolean, snapshot?: ScenarioContextSnapshot) {
    if (ctx.emitted) {
      return;
    }
    ctx.emitted = true;
    if (ctx.timeoutId) {
      clearTimeout(ctx.timeoutId);
      ctx.timeoutId = undefined;
    }

    const platform = configContext.platform;
    const api = userContext.apiType;

    // Build snapshot if not provided
    const finalSnapshot = snapshot || this.buildSnapshot(ctx, { final: false, timedOut });

    traceMark(Action.MetricsScenario, {
      event: "scenario_end",
      scenario: ctx.scenario,
      healthy,
      timedOut,
      documentHidden: document.hidden,
      platform,
      api,
      durationMs: finalSnapshot.durationMs,
      completedPhases: finalSnapshot.completed.join(","),
      failedPhases: finalSnapshot.failedPhases?.join(","),
      lcp: finalSnapshot.vitals?.lcp,
      inp: finalSnapshot.vitals?.inp,
      cls: finalSnapshot.vitals?.cls,
      fcp: finalSnapshot.vitals?.fcp,
      ttfb: finalSnapshot.vitals?.ttfb,
    });

    this.devLog(
      `scenario_end: ${ctx.scenario} | ${healthy ? "healthy" : "unhealthy"} | ${
        timedOut ? "timed out" : `${Math.round(finalSnapshot.durationMs)}ms`
      } | ${JSON.stringify({
        completedPhases: finalSnapshot.completed.join(", "),
        failedPhases: finalSnapshot.failedPhases?.join(", ") || "none",
        platform,
        api,
        phaseTimings: finalSnapshot.phaseTimings,
        vitals: finalSnapshot.vitals,
      })}`,
    );

    // Call portal backend health metrics endpoint
    // If healthy is true (either completed successfully or timeout with expected failure), report healthy
    if (healthy) {
      reportHealthy(ctx.scenario, platform, api);
    } else {
      reportUnhealthy(ctx.scenario, platform, api);
    }

    // Cleanup performance entries
    this.cleanupPerformanceEntries(ctx);
  }

  private cleanupPerformanceEntries(ctx: InternalScenarioContext) {
    performance.clearMarks(ctx.startMarkName);
    ctx.config.requiredPhases.forEach((phase) => {
      const phaseCtx = ctx.phases.get(phase);
      if (phaseCtx?.startMarkName) {
        performance.clearMarks(phaseCtx.startMarkName);
      }
      if (phaseCtx?.endMarkName) {
        performance.clearMarks(phaseCtx.endMarkName);
      }
      performance.clearMarks(`scenario_${ctx.scenario}_${phase}_failed`);
      performance.clearMeasures(`scenario_${ctx.scenario}_${phase}_duration`);
    });
  }

  private buildSnapshot(
    ctx: InternalScenarioContext,
    opts: { final: boolean; timedOut: boolean },
  ): ScenarioContextSnapshot {
    const phaseTimings = this.getPhaseTimings(ctx);

    // Capture current time once for consistency
    const currentTime = performance.now();

    // Convert performance timestamps (relative to navigationStart) to absolute timestamps
    const navigationStart = performance.timeOrigin;
    const startEntry = performance.getEntriesByName(ctx.startMarkName)[0];
    const startTimeISO = new Date(navigationStart + (startEntry?.startTime || 0)).toISOString();
    const endTimeISO = new Date(navigationStart + currentTime).toISOString();

    // Calculate overall scenario duration directly from the timestamps
    const durationMs = currentTime - (startEntry?.startTime || 0);

    return {
      scenario: ctx.scenario,
      startTimeISO,
      endTimeISO,
      durationMs,
      completed: Array.from(ctx.completed),
      failedPhases: ctx.failed.size > 0 ? Array.from(ctx.failed) : undefined,
      timedOut: opts.timedOut,
      vitals: { ...this.vitals },
      phaseTimings,
    };
  }

  /**
   * Reset all scenarios (for testing purposes only).
   * Clears all active contexts and their timeouts.
   */
  reset() {
    this.contexts.forEach((ctx) => {
      if (ctx.timeoutId) {
        clearTimeout(ctx.timeoutId);
      }
    });
    this.contexts.clear();
  }
}

export const scenarioMonitor = new ScenarioMonitor();
