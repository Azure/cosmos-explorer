/**
 * @jest-environment jsdom
 */

import { updateUserContext } from "../UserContext";
import MetricScenario, { reportMetric } from "./MetricEvents";
import { ApplicationMetricPhase, CommonMetricPhase } from "./ScenarioConfig";
import { scenarioMonitor } from "./ScenarioMonitor";

// Mock the MetricEvents module
jest.mock("./MetricEvents", () => ({
  __esModule: true,
  default: {
    ApplicationLoad: "ApplicationLoad",
    DatabaseLoad: "DatabaseLoad",
  },
  reportMetric: jest.fn().mockResolvedValue({ ok: true }),
}));

// Mock configContext
jest.mock("../ConfigContext", () => ({
  configContext: {
    platform: "Portal",
    PORTAL_BACKEND_ENDPOINT: "https://test.portal.azure.com",
  },
  Platform: {
    Portal: "Portal",
    Hosted: "Hosted",
    Emulator: "Emulator",
    Fabric: "Fabric",
  },
}));

describe("ScenarioMonitor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Use legacy fake timers to avoid conflicts with performance API
    jest.useFakeTimers({ legacyFakeTimers: true });

    // Ensure performance mock is available (setupTests.ts sets this but fake timers may override)
    if (typeof performance.mark !== "function") {
      Object.defineProperty(global, "performance", {
        writable: true,
        configurable: true,
        value: {
          mark: jest.fn(),
          measure: jest.fn(),
          clearMarks: jest.fn(),
          clearMeasures: jest.fn(),
          getEntriesByName: jest.fn().mockReturnValue([{ startTime: 0 }]),
          getEntriesByType: jest.fn().mockReturnValue([]),
          now: jest.fn(() => Date.now()),
          timeOrigin: Date.now(),
        },
      });
    }

    // Reset userContext
    updateUserContext({
      apiType: "SQL",
    });

    // Reset the scenario monitor to clear any previous state
    scenarioMonitor.reset();
  });

  afterEach(() => {
    // Reset scenarios before switching to real timers
    scenarioMonitor.reset();
    jest.useRealTimers();
  });

  describe("markExpectedFailure", () => {
    it("sets hasExpectedFailure flag on active scenarios", () => {
      // Start a scenario
      scenarioMonitor.start(MetricScenario.ApplicationLoad);

      // Mark expected failure
      scenarioMonitor.markExpectedFailure();

      // Let timeout fire - should emit healthy because of expected failure
      jest.advanceTimersByTime(10000);

      expect(reportMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: MetricScenario.ApplicationLoad,
          healthy: true,
          hasExpectedFailure: true,
          timedOut: true,
        }),
      );
    });

    it("sets flag on multiple active scenarios", () => {
      // Start two scenarios
      scenarioMonitor.start(MetricScenario.ApplicationLoad);
      scenarioMonitor.start(MetricScenario.DatabaseLoad);

      // Mark expected failure - should affect both
      scenarioMonitor.markExpectedFailure();

      // Let timeouts fire
      jest.advanceTimersByTime(10000);

      expect(reportMetric).toHaveBeenCalledTimes(2);
      expect(reportMetric).toHaveBeenCalledWith(expect.objectContaining({ healthy: true, hasExpectedFailure: true }));
    });

    it("does not affect already emitted scenarios", () => {
      // Start scenario
      scenarioMonitor.start(MetricScenario.ApplicationLoad);

      // Complete all phases to emit
      scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, ApplicationMetricPhase.ExplorerInitialized);
      scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, CommonMetricPhase.Interactive);

      // Now mark expected failure - should not change anything
      scenarioMonitor.markExpectedFailure();

      // reportMetric was called when phases completed
      expect(reportMetric).toHaveBeenCalledTimes(1);
      expect(reportMetric).toHaveBeenCalledWith(expect.objectContaining({ healthy: true }));
    });
  });

  describe("timeout behavior", () => {
    it("emits unhealthy on timeout without expected failure", () => {
      scenarioMonitor.start(MetricScenario.ApplicationLoad);

      // Let timeout fire without marking expected failure
      jest.advanceTimersByTime(10000);

      expect(reportMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: MetricScenario.ApplicationLoad,
          healthy: false,
          timedOut: true,
        }),
      );
    });

    it("emits healthy on timeout with expected failure", () => {
      scenarioMonitor.start(MetricScenario.ApplicationLoad);

      // Mark expected failure
      scenarioMonitor.markExpectedFailure();

      // Let timeout fire
      jest.advanceTimersByTime(10000);

      expect(reportMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: MetricScenario.ApplicationLoad,
          healthy: true,
          timedOut: true,
          hasExpectedFailure: true,
        }),
      );
    });

    it("emits healthy even with partial phase completion and expected failure", () => {
      scenarioMonitor.start(MetricScenario.ApplicationLoad);

      // Complete one phase
      scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, ApplicationMetricPhase.ExplorerInitialized);

      // Mark expected failure
      scenarioMonitor.markExpectedFailure();

      // Let timeout fire (Interactive phase not completed)
      jest.advanceTimersByTime(10000);

      expect(reportMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          healthy: true,
          timedOut: true,
          hasExpectedFailure: true,
          completedPhases: expect.arrayContaining(["ExplorerInitialized"]),
        }),
      );
    });
  });

  describe("failPhase behavior", () => {
    it("emits unhealthy immediately on unexpected failure", () => {
      scenarioMonitor.start(MetricScenario.DatabaseLoad);

      // Fail a phase (simulating unexpected error)
      scenarioMonitor.failPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabasesFetched);

      // Should emit unhealthy immediately, not wait for timeout
      expect(reportMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: MetricScenario.DatabaseLoad,
          healthy: false,
          timedOut: false,
        }),
      );
    });

    it("does not emit twice after failPhase and timeout", () => {
      scenarioMonitor.start(MetricScenario.DatabaseLoad);

      // Fail a phase
      scenarioMonitor.failPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabasesFetched);

      // Let timeout fire
      jest.advanceTimersByTime(10000);

      // Should only have emitted once (from failPhase)
      expect(reportMetric).toHaveBeenCalledTimes(1);
    });
  });

  describe("completePhase behavior", () => {
    it("emits healthy when all phases complete", () => {
      scenarioMonitor.start(MetricScenario.ApplicationLoad);

      // Complete all required phases
      scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, ApplicationMetricPhase.ExplorerInitialized);
      scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, CommonMetricPhase.Interactive);

      expect(reportMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: MetricScenario.ApplicationLoad,
          healthy: true,
          timedOut: false,
          completedPhases: expect.arrayContaining(["ExplorerInitialized", "Interactive"]),
        }),
      );
    });

    it("does not emit until all phases complete", () => {
      scenarioMonitor.start(MetricScenario.ApplicationLoad);

      // Complete only one phase
      scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, ApplicationMetricPhase.ExplorerInitialized);

      expect(reportMetric).not.toHaveBeenCalled();
    });
  });

  describe("scenario isolation", () => {
    it("expected failure on one scenario does not affect others after completion", () => {
      // Start both scenarios
      scenarioMonitor.start(MetricScenario.ApplicationLoad);
      scenarioMonitor.start(MetricScenario.DatabaseLoad);

      // Complete ApplicationLoad
      scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, ApplicationMetricPhase.ExplorerInitialized);
      scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, CommonMetricPhase.Interactive);

      // Now mark expected failure - should only affect DatabaseLoad
      scenarioMonitor.markExpectedFailure();

      // Let DatabaseLoad timeout
      jest.advanceTimersByTime(10000);

      // ApplicationLoad emitted healthy on completion
      // DatabaseLoad emits healthy on timeout (expected failure)
      expect(reportMetric).toHaveBeenCalledTimes(2);
      // Both should be healthy
      const calls = (reportMetric as jest.Mock).mock.calls;
      expect(calls[0][0].healthy).toBe(true);
      expect(calls[1][0].healthy).toBe(true);
    });
  });
});
