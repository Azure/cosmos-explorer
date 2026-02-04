/**
 * @jest-environment jsdom
 */

import { configContext } from "../ConfigContext";
import { updateUserContext } from "../UserContext";
import MetricScenario, { reportHealthy, reportUnhealthy } from "./MetricEvents";
import { ApplicationMetricPhase, CommonMetricPhase } from "./ScenarioConfig";
import { scenarioMonitor } from "./ScenarioMonitor";

// Mock the MetricEvents module
jest.mock("./MetricEvents", () => ({
  __esModule: true,
  default: {
    ApplicationLoad: "ApplicationLoad",
    DatabaseLoad: "DatabaseLoad",
  },
  reportHealthy: jest.fn().mockResolvedValue({ ok: true }),
  reportUnhealthy: jest.fn().mockResolvedValue({ ok: true }),
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

      expect(reportHealthy).toHaveBeenCalledWith(MetricScenario.ApplicationLoad, configContext.platform, "SQL");
      expect(reportUnhealthy).not.toHaveBeenCalled();
    });

    it("sets flag on multiple active scenarios", () => {
      // Start two scenarios
      scenarioMonitor.start(MetricScenario.ApplicationLoad);
      scenarioMonitor.start(MetricScenario.DatabaseLoad);

      // Mark expected failure - should affect both
      scenarioMonitor.markExpectedFailure();

      // Let timeouts fire
      jest.advanceTimersByTime(10000);

      expect(reportHealthy).toHaveBeenCalledTimes(2);
      expect(reportUnhealthy).not.toHaveBeenCalled();
    });

    it("does not affect already emitted scenarios", () => {
      // Start scenario
      scenarioMonitor.start(MetricScenario.ApplicationLoad);

      // Complete all phases to emit
      scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, ApplicationMetricPhase.ExplorerInitialized);
      scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, CommonMetricPhase.Interactive);

      // Now mark expected failure - should not change anything
      scenarioMonitor.markExpectedFailure();

      // Healthy was called when phases completed
      expect(reportHealthy).toHaveBeenCalledTimes(1);
    });
  });

  describe("timeout behavior", () => {
    it("emits unhealthy on timeout without expected failure", () => {
      scenarioMonitor.start(MetricScenario.ApplicationLoad);

      // Let timeout fire without marking expected failure
      jest.advanceTimersByTime(10000);

      expect(reportUnhealthy).toHaveBeenCalledWith(MetricScenario.ApplicationLoad, configContext.platform, "SQL");
      expect(reportHealthy).not.toHaveBeenCalled();
    });

    it("emits healthy on timeout with expected failure", () => {
      scenarioMonitor.start(MetricScenario.ApplicationLoad);

      // Mark expected failure
      scenarioMonitor.markExpectedFailure();

      // Let timeout fire
      jest.advanceTimersByTime(10000);

      expect(reportHealthy).toHaveBeenCalledWith(MetricScenario.ApplicationLoad, configContext.platform, "SQL");
      expect(reportUnhealthy).not.toHaveBeenCalled();
    });

    it("emits healthy even with partial phase completion and expected failure", () => {
      scenarioMonitor.start(MetricScenario.ApplicationLoad);

      // Complete one phase
      scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, ApplicationMetricPhase.ExplorerInitialized);

      // Mark expected failure
      scenarioMonitor.markExpectedFailure();

      // Let timeout fire (Interactive phase not completed)
      jest.advanceTimersByTime(10000);

      expect(reportHealthy).toHaveBeenCalled();
      expect(reportUnhealthy).not.toHaveBeenCalled();
    });
  });

  describe("failPhase behavior", () => {
    it("emits unhealthy immediately on unexpected failure", () => {
      scenarioMonitor.start(MetricScenario.DatabaseLoad);

      // Fail a phase (simulating unexpected error)
      scenarioMonitor.failPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabasesFetched);

      // Should emit unhealthy immediately, not wait for timeout
      expect(reportUnhealthy).toHaveBeenCalledWith(MetricScenario.DatabaseLoad, configContext.platform, "SQL");
    });

    it("does not emit twice after failPhase and timeout", () => {
      scenarioMonitor.start(MetricScenario.DatabaseLoad);

      // Fail a phase
      scenarioMonitor.failPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabasesFetched);

      // Let timeout fire
      jest.advanceTimersByTime(10000);

      // Should only have emitted once (from failPhase)
      expect(reportUnhealthy).toHaveBeenCalledTimes(1);
    });
  });

  describe("completePhase behavior", () => {
    it("emits healthy when all phases complete", () => {
      scenarioMonitor.start(MetricScenario.ApplicationLoad);

      // Complete all required phases
      scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, ApplicationMetricPhase.ExplorerInitialized);
      scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, CommonMetricPhase.Interactive);

      expect(reportHealthy).toHaveBeenCalledWith(MetricScenario.ApplicationLoad, configContext.platform, "SQL");
    });

    it("does not emit until all phases complete", () => {
      scenarioMonitor.start(MetricScenario.ApplicationLoad);

      // Complete only one phase
      scenarioMonitor.completePhase(MetricScenario.ApplicationLoad, ApplicationMetricPhase.ExplorerInitialized);

      expect(reportHealthy).not.toHaveBeenCalled();
      expect(reportUnhealthy).not.toHaveBeenCalled();
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
      expect(reportHealthy).toHaveBeenCalledTimes(2);
      expect(reportUnhealthy).not.toHaveBeenCalled();
    });
  });
});
